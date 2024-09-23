export const formatDuration = (ms: number) => {
  if (ms > 60 * 60 * 1000) {
    return `${(ms / (60 * 60 * 1000)).toFixed(2)}h`;
  }
  if (ms > 60 * 1000) {
    return `${(ms / (60 * 1000)).toFixed(2)}min`;
  }

  if (ms > 1000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }

  return `${ms}ms`;
};
