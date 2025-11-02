/**
 * Token Manager for Currently Playing Display
 * Håndterer refresh token og oppdatering av access token
 */

import { env } from "@/lib/config/env";

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

/**
 * Refresher access token ved bruk av refresh token
 */
async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refreshToken);
  
  const url = "https://accounts.spotify.com/api/token";
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(env.SPOTIFY_CLIENT_ID + ":" + env.SPOTIFY_CLIENT_SECRET).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token refresh failed: ${response.status} ${errorText}`);
  }
  
  const data = await response.json();
  return {
    access_token: data.access_token,
    expires_in: data.expires_in,
  };
}

/**
 * Henter gyldig access token, refresher ved behov
 */
export async function getAccessToken(): Promise<string> {
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;
  
  if (!refreshToken) {
    throw new Error('SPOTIFY_REFRESH_TOKEN environment variable is not set');
  }

  // Sjekk om vi har en cached token som fortsatt er gyldig
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.accessToken;
  }

  // Refresh token
  const tokenData = await refreshAccessToken(refreshToken);
  
  // Cache token med 60 sekunder margin før utløp
  tokenCache = {
    accessToken: tokenData.access_token,
    expiresAt: Date.now() + (tokenData.expires_in - 60) * 1000,
  };

  return tokenCache.accessToken;
}
