/**
 * Environment variable validation and configuration
 */

interface EnvConfig {
  SPOTIFY_CLIENT_ID: string;
  SPOTIFY_CLIENT_SECRET: string;
  JWT_SECRET: string;
  NEXTAUTH_URL: string;
  NODE_ENV: 'development' | 'production' | 'test';
  // Firebase (client-side only — accessed directly via process.env in firebase-client.ts)
  FIREBASE_API_KEY: string;
  FIREBASE_PROJECT_ID: string;
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

      NODE_ENV: (process.env.NODE_ENV as EnvConfig['NODE_ENV']) || 'development',
      // Firebase — optional (not required; app works without it)
      FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
      FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
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
