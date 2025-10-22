/**
 * Environment variable validation and configuration
 */

interface EnvConfig {
  SPOTIFY_CLIENT_ID: string;
  SPOTIFY_CLIENT_SECRET: string;
  JWT_SECRET: string;
  NEXTAUTH_URL: string;
  NODE_ENV: 'development' | 'production' | 'test';
}

function validateEnvVar(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
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
    _env = {
      SPOTIFY_CLIENT_ID: validateEnvVar('SPOTIFY_CLIENT_ID', process.env.SPOTIFY_CLIENT_ID),
      SPOTIFY_CLIENT_SECRET: validateEnvVar('SPOTIFY_CLIENT_SECRET', process.env.SPOTIFY_CLIENT_SECRET),
      JWT_SECRET: validateJwtSecret(validateEnvVar('JWT_SECRET', process.env.JWT_SECRET)),
      NEXTAUTH_URL: validateEnvVar('NEXTAUTH_URL', process.env.NEXTAUTH_URL),
      NODE_ENV: (process.env.NODE_ENV as EnvConfig['NODE_ENV']) || 'development',
    };
  }
  return _env;
}

export const env = new Proxy({} as EnvConfig, {
  get(target, prop) {
    return getEnv()[prop as keyof EnvConfig];
  }
});

export const isDevelopment = () => getEnv().NODE_ENV === 'development';
export const isProduction = () => getEnv().NODE_ENV === 'production';
