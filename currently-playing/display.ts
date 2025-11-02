/**
 * Display utilities for currently playing track
 * Formaterer track info som tekst med animasjoner
 */

import { CurrentlyPlaying } from "@/lib/types";
import { Track } from "@/lib/types/track";
import { Episode } from "@/lib/types/episode";

/**
 * Konverterer tekst til ASCII art banner-stil
 */
function createBanner(text: string): string {
  // Enkel ASCII banner med store bokstaver og ramme
  const lines: string[] = [];
  const width = Math.max(60, text.length + 4);
  
  // Top border
  lines.push('┌' + '─'.repeat(width - 2) + '┐');
  
  // Empty line
  lines.push('│' + ' '.repeat(width - 2) + '│');
  
  // Center text
  const padding = Math.floor((width - 2 - text.length) / 2);
  const centeredText = ' '.repeat(padding) + text.toUpperCase() + ' '.repeat(width - 2 - text.length - padding);
  lines.push('│' + centeredText + '│');
  
  // Empty line
  lines.push('│' + ' '.repeat(width - 2) + '│');
  
  // Bottom border
  lines.push('└' + '─'.repeat(width - 2) + '┘');
  
  return lines.join('\n');
}

/**
 * Animasjon ved oppdatering - morsom effekt med musikksymboler
 */
async function animateUpdate(message: string): Promise<void> {
  const frames = [
    '♪  Oppdaterer...',
    '♫  Oppdaterer...',
    '♬  Oppdaterer...',
    '♪  Oppdaterer...',
    '♫  Oppdaterer...',
    '♪♫ Oppdaterer...',
    '♫♪ Oppdaterer...',
    '♪  Oppdaterer...',
  ];
  
  // Vis animasjon
  for (let i = 0; i < frames.length; i++) {
    process.stdout.write(`\r${frames[i]}    `);
    await new Promise(resolve => setTimeout(resolve, 120));
  }
  
  // Clear line
  process.stdout.write('\r' + ' '.repeat(50) + '\r');
}

/**
 * Formaterer currently playing track til tekst
 */
export function formatCurrentlyPlaying(data: CurrentlyPlaying | null): string {
  if (!data || !data.item) {
    return createBanner('Ingen musikk spiller');
  }

  const item = data.item;
  let displayText = '';

  if (data.currently_playing_type === 'track' && 'artists' in item) {
    const track = item as Track;
    const artistNames = track.artists.map(a => a.name).join(', ');
    displayText = `${artistNames} - ${track.name}`;
  } else if (data.currently_playing_type === 'episode' && 'show' in item) {
    const episode = item as Episode;
    displayText = `${episode.show.name} - ${episode.name}`;
  } else {
    displayText = 'Ukjent innhold';
  }

  return createBanner(displayText);
}

/**
 * Viser currently playing med animasjon
 */
export async function displayCurrentlyPlaying(data: CurrentlyPlaying | null): Promise<void> {
  // Clear screen
  process.stdout.write('\x1B[2J\x1B[0f'); // ANSI escape codes for clear screen
  
  const formatted = formatCurrentlyPlaying(data);
  
  // Animasjon før visning
  await animateUpdate('Oppdaterer...');
  
  // Vis banner
  console.log('\n');
  console.log(formatted);
  console.log('\n');
  
  // Vis ekstra info hvis tilgjengelig
  if (data?.item && data.currently_playing_type === 'track' && 'album' in data.item) {
    const track = data.item as Track;
    console.log(`   Album: ${track.album.name}`);
  }
  
  if (data?.is_playing !== undefined) {
    console.log(`   Status: ${data.is_playing ? '▶ Spiller' : '⏸ Pauset'}`);
  }
  
  console.log('\n');
}
