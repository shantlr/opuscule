export const joinUrl = (base: string, path: string) => {
  // path is an url
  if (/^[a-z]+:\/\//i.test(path)) {
    return path;
  }
  if (base.endsWith('/')) {
    if (path.startsWith('/')) {
      return `${base}${path.slice(1)}`;
    }
    return base + path;
  }
  if (path.startsWith('/')) {
    return `${base}${path}`;
  }
  return `${base}/${path}`;
};
