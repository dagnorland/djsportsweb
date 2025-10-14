# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-10-14

### Added
- **Playlists-side** (`/playlists`): Fullstendig spilleliste-visning og avspillingsfunksjonalitet
  - Viser brukerens Spotify-spillelister i et sidebar
  - Detaljert visning av spor i valgt spilleliste
  - Klikk på spor for å starte avspilling fra tilfeldig posisjon (5-40 sekunder)
  
- **NowPlayingBar-komponent**: Interaktiv avspillingskontroll nederst på siden
  - Viser nåværende sang med albumgrafikk
  - Play/Pause, Next, Previous knapper
  - Fremdriftsindikator med tidskode
  - Volumkontroll
  - Sangtittel og artist-informasjon
  - Automatisk oppdatering hvert 5. sekund
  
- **PlaylistSidebar-komponent**: Spilleliste-navigasjon
  - Liste over alle brukerens spillelister
  - Albumgrafikk for hver spilleliste
  - Antall spor per spilleliste
  - Visuell indikator for valgt spilleliste
  - Loading states og tom-tilstand
  
- **TrackList-komponent**: Sporvisning i tabellformat
  - Detaljert informasjon: tittel, artist, album, varighet
  - Albumgrafikk for hvert spor
  - Nummerering av spor
  - Explicit-merking
  - Klikk for å spille av spor
  - Loading states og tom-tilstand

### Changed
- **Hovedside** (`app/page.tsx`): 
  - Lagt til norsk språkstøtte i grensesnittet
  - Navigasjonsknapp til spilleliste-siden
  - Forbedret brukergrensesnitt med velkomstmelding
  
- **Layout** (`app/layout.tsx`):
  - Integrert Spotify Web Playback SDK
  - Mørk tema som standard
  
- **Autentisering** (`pages/api/auth/[...nextauth].js`):
  - Oppdaterte Spotify OAuth-scopes for avspillingskontroll
  - Forbedret token-håndtering

- **Avspillingsfunksjon** (`lib/spotify/player/startResumePlayback.ts`):
  - Utvidet funksjonalitet for å støtte kontekst-avspilling
  - Støtte for offset og posisjonering

### Technical Details
- Implementert polling-mekanisme for sangtilstand (5s intervall)
- Bruk av Next.js 14.2.5 med App Router
- TypeScript type-sikkerhet for alle Spotify API-interaksjoner
- Responsive design med TailwindCSS
- shadcn/ui komponenter for konsistent UI

## [0.1.0] - Initial Release

### Added
- Next.js project structure
- Spotify API integration
- NextAuth.js authentication with Spotify
- TypeScript types for Spotify API
- Pre-built fetch actions for Spotify endpoints
- TailwindCSS styling
- shadcn/ui component library