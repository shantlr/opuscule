#! /usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { networkInterfaces } from 'os';

export const getLocalIp = () => {
  const netInterfaces = networkInterfaces();
  const matches = [];

  Object.keys(netInterfaces).forEach(function (item) {
    netInterfaces[item]?.forEach(function (address) {
      if (address.internal === false && address.family === 'IPv4') {
        matches.push(address.address);
      }
    });
  });

  return matches[0];
};

const ENV_PATH = './.env';

const envFileExists = existsSync(ENV_PATH);

const AUTO_GEN_ENV = {
  EXPO_PUBLIC_API_URL: `http://${getLocalIp()}:4560`,
};

const GENERATED_MARKER = ' #GENERATED_LOCAL_ENV';

if (!envFileExists) {
  // Create the file
  const defaultEnv = `
${Object.entries(AUTO_GEN_ENV)
  .map(([key, value]) => `${key}=${value}${GENERATED_MARKER}`)
  .join('\n')} 
`;

  writeFileSync(ENV_PATH, defaultEnv);
} else {
  // Update the file
  let envFile = readFileSync(ENV_PATH).toString();

  Object.entries(AUTO_GEN_ENV).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=(.*)${GENERATED_MARKER}( *)$`, 'm');
    if (envFile.match(regex)) {
      envFile = envFile.replace(regex, `${key}=${value}${GENERATED_MARKER}\n`);
    } else {
      if (!envFile.endsWith('\n')) {
        envFile += '\n';
      }
      envFile += `${key}=${value}${GENERATED_MARKER}\n`;
    }
  });

  writeFileSync(ENV_PATH, envFile);
}
