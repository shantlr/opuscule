declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_API_URL: string;
    }
  }
}

export const API_URL = process.env.EXPO_PUBLIC_API_URL;
