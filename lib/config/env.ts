/**
 * Environment variable validation and configuration
 */

interface EnvConfig {
  SPOTIFY_CLIENT_ID: string;
  SPOTIFY_CLIENT_SECRET: string;
  JWT_SECRET: string;
  NEXTAUTH_URL: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  NODE_ENV: 'development' | 'production' | 'test';
}

function validateEnvVar(name: string, value: string | undefined, required: boolean = true): string {
  if (!value && required) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value || '';
}

function validateJwtSecret(secret: string): string {
  if (secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
  return secret;
}

// Lazy loading av miljøvariabler for å sikre at de er tilgjengelige
let _env: EnvConfig | null = null;

function getEnv(): EnvConfig {
  if (!_env) {
    const isBrowser = typeof window !== 'undefined';
    const inferredNextAuthUrl =
      process.env.NEXTAUTH_URL ||
      (!isBrowser && process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

    _env = {
      // Server-only variables (not required in browser)
      SPOTIFY_CLIENT_ID: validateEnvVar('SPOTIFY_CLIENT_ID', process.env.SPOTIFY_CLIENT_ID, !isBrowser),
      SPOTIFY_CLIENT_SECRET: validateEnvVar('SPOTIFY_CLIENT_SECRET', process.env.SPOTIFY_CLIENT_SECRET, !isBrowser),
      JWT_SECRET: isBrowser ? '' : validateJwtSecret(validateEnvVar('JWT_SECRET', process.env.JWT_SECRET)),
      // På Vercel er VERCEL_URL alltid tilgjengelig i runtime; bruk den som fallback hvis NEXTAUTH_URL mangler.
      NEXTAUTH_URL: validateEnvVar('NEXTAUTH_URL', inferredNextAuthUrl, !isBrowser),

      // Client-safe variables (available everywhere)
      SUPABASE_URL: validateEnvVar('SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL),
      SUPABASE_ANON_KEY: validateEnvVar('SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY),
      NODE_ENV: (process.env.NODE_ENV as EnvConfig['NODE_ENV']) || 'development',
    };
  }
  return _env;
}

export const env = new Proxy({} as EnvConfig, {
  get(_target, prop) {
    return getEnv()[prop as keyof EnvConfig];
  }
});

export const isDevelopment = () => getEnv().NODE_ENV === 'development';
export const isProduction = () => getEnv().NODE_ENV === 'production';
