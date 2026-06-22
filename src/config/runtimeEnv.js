const runtimeEnv = globalThis.__APP_ENV__ ?? {};

export const API_BASE_URL = runtimeEnv.VITE_API_BASE_URL ?? import.meta.env.VITE_API_BASE_URL ?? '/api/v1';
