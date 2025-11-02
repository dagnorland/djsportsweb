#!/usr/bin/env node

/**
 * Currently Playing Display for Raspberry Pi
 * 
 * Viser nåværende Spotify-spor i tekstformat på stdout
 * Bruker refresh token for autentisering
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import { getAccessToken } from './tokenManager';
import { getCurrentlyPlayingTrack } from '@/lib/spotify';
import { displayCurrentlyPlaying } from './display';
import { CurrentlyPlaying } from '@/lib/types';

// Parse command line arguments for polling interval
const args = process.argv.slice(2);
let pollingInterval = 3000; // Default 3 sekunder

if (args.length > 0) {
  const intervalArg = parseInt(args[0], 10);
  if (!isNaN(intervalArg) && intervalArg > 0) {
    pollingInterval = intervalArg * 1000; // Convert to milliseconds
  } else {
    console.error(`Ugyldig intervall: ${args[0]}. Bruker standard 3 sekunder.`);
  }
}

// Validate environment variables before starting
const requiredEnvVars = ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET', 'SPOTIFY_REFRESH_TOKEN'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Manglende miljøvariabler:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\n💡 Tips: Sjekk at .env.local eksisterer og inneholder alle nødvendige variabler');
  process.exit(1);
}

console.log(`🎵 Spotify Currently Playing Display`);
console.log(`📡 Polling intervall: ${pollingInterval / 1000} sekunder\n`);

let isRunning = true;

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Avslutter...');
  isRunning = false;
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 Avslutter...');
  isRunning = false;
  process.exit(0);
});

/**
 * Hovedloop som poller Spotify API
 */
async function main() {
  let lastTrackId: string | null = null;
  
  while (isRunning) {
    try {
      // Hent access token (refresher automatisk ved behov)
      const accessToken = await getAccessToken();
      
      // Hent currently playing track
      const currentlyPlaying: CurrentlyPlaying | null = await getCurrentlyPlayingTrack(accessToken);
      
      // Sjekk om track har endret seg
      const currentTrackId = currentlyPlaying?.item?.id || null;
      const hasChanged = currentTrackId !== lastTrackId;
      
      // Oppdater display hvis track har endret seg eller første gang
      if (hasChanged || lastTrackId === null) {
        await displayCurrentlyPlaying(currentlyPlaying);
        lastTrackId = currentTrackId;
      } else {
        // Liten oppdatering uten animasjon hvis samme track
        // (kan legge til progress bar her senere hvis ønskelig)
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('\n❌ Feil ved henting av currently playing:', errorMessage);
      
      // Vis feilmelding med detaljer
      process.stdout.write('\x1B[2J\x1B[0f');
      console.log('\n');
      console.log('┌────────────────────────────────────────┐');
      console.log('│   ⚠️  KUNNE IKKE HENTE SPOTIFY DATA   │');
      console.log('└────────────────────────────────────────┘');
      console.log('\n');
      console.log(`Feil: ${errorMessage}`);
      console.log('\n');
      
      // Vis tips hvis det er miljøvariabel-problemer
      if (errorMessage.includes('SPOTIFY_REFRESH_TOKEN') || errorMessage.includes('environment variable')) {
        console.log('💡 Tips: Sjekk at .env.local inneholder SPOTIFY_REFRESH_TOKEN');
        console.log('💡 Tips: Sjekk at SPOTIFY_CLIENT_ID og SPOTIFY_CLIENT_SECRET er satt');
        console.log('\n');
      }
    }
    
    // Vent før neste polling
    if (isRunning) {
      await new Promise(resolve => setTimeout(resolve, pollingInterval));
    }
  }
}

// Start hovedloop
main().catch((error) => {
  console.error('\n💥 Kritisk feil:', error);
  process.exit(1);
});
