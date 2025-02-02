import { once } from 'node:events';
import { PassThrough, Readable, TransformOptions } from 'node:stream';

// from https://gist.github.com/timoxley/61bdb55fe0cab34217b724326a1ab829

/**
 * Write to stream.
 * Block until drained or aborted
 */
async function write(stream: PassThrough, data: unknown, ac: AbortController) {
  if (stream.write(data)) {
    return;
  }
  await once(stream, 'drain', ac);
}

/**
 * Background async task to pull data from the browser stream and push it into the node stream.
 */
async function pull(
  fromBrowserStream: ReadableStream,
  toNodeStream: PassThrough,
) {
  const reader = fromBrowserStream.getReader();

  const ac = new AbortController();
  const cleanup = () => {
    toNodeStream.off('close', cleanup);
    ac.abort();
  };
  reader.closed.finally(cleanup);
  toNodeStream.once('close', cleanup);

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        return;
      }

      if (!toNodeStream.writable) {
        return;
      }
      await write(toNodeStream, value, ac);
    }
  } catch (err) {
    toNodeStream.destroy(err as Error);
    reader.cancel();
  } finally {
    toNodeStream.end();
    cleanup();
  }
}

/**
 * Convert browser ReadableStream to Node stream.Readable.
 */
export function WebStreamToNodeStream(
  webStream: ReadableStream | Readable,
  nodeStreamOptions?: TransformOptions,
): Readable {
  if ('pipe' in webStream) {
    return webStream as Readable;
  }

  // use PassThrough so we can write to it
  const nodeStream = new PassThrough(nodeStreamOptions);
  pull(webStream, nodeStream);
  return nodeStream;
}
