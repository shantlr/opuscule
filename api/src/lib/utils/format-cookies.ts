import { Cookie } from 'data/types';

export const formatCookie = (cookie: Cookie) => {
  const res: string[] = [`${cookie.name}=${cookie.value}`];
  if (cookie.domain) {
    res.push(`Domain=${cookie.domain}`);
  }
  if (cookie.path) {
    res.push(`Path=${cookie.path}`);
  }
  if (cookie.secure) {
    res.push('Secure');
  }
  if (cookie.httpOnly) {
    res.push('HttpOnly');
  }
  if (cookie.sameSite) {
    res.push(`SameSite=${cookie.sameSite}`);
  }
  if (cookie.expiry) {
    res.push(`Expires=${new Date(cookie.expiry).toUTCString()}`);
  }
  return res.join('; ');
};
