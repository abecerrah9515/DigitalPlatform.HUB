declare global {
  interface Window {
    __env?: {
      API_URL?: string;
      API_KEY?: string;
    };
  }
}

const runtimeEnv = typeof window !== 'undefined' ? window.__env : undefined;

export const environment = {
  production: true,
  useMock: false,
  apiUrl: runtimeEnv?.API_URL ?? '',
  apiKey: runtimeEnv?.API_KEY ?? '',
};
