import { networkInterfaces } from 'os';

export const getLocalIp = () => {
  const netInterfaces = networkInterfaces();
  const matches: string[] = [];

  Object.keys(netInterfaces).forEach(function (item) {
    netInterfaces[item]?.forEach(function (address) {
      if (address.internal === false && address.family === 'IPv4') {
        matches.push(address.address);
      }
    });
  });

  return matches[0];
};
