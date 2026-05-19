/**
 * Environment variable validation and access
 * Validates all required env vars at startup
 */

function validateEnv(key: string, value: unknown): string {
  if (typeof value !== 'string' || !value) {
    throw new Error(`Missing or invalid environment variable: ${key}`);
  }
  return value;
}

export const env = {
  SUPABASE_URL: validateEnv(
    'VITE_SUPABASE_URL',
    import.meta.env.VITE_SUPABASE_URL
  ),
  SUPABASE_KEY: validateEnv(
    'VITE_SUPABASE_ANON_KEY',
    import.meta.env.VITE_SUPABASE_ANON_KEY
  ),
  SERVICE_ROLE_KEY: import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
} as const;

// Validate at module load time
Object.entries(env).forEach(([key, value]) => {
  if (key !== 'SERVICE_ROLE_KEY' && !value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

export default env;
