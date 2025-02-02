import sade from 'sade';
import { fetchSourceLatests, Sources } from 'sources';

const prog = sade('cli');

prog.command('fetch latests <source-id>').action(async (sourceId) => {
  const source = Sources.find((s) => s.id === sourceId);
  if (!source) {
    console.error(`source not found: ${sourceId}`);
    return 1;
  }
  await fetchSourceLatests(source);
});

prog.parse(process.argv);
