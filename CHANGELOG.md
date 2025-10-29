# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.10.0] - 2025-10-29

### Added
- **Token Expiry Management**: Automatic detection and user-friendly handling of expired Spotify tokens
  - New TokenExpiredDialog component with Norwegian localization
  - Dialog prompts user to re-authenticate when access token expires
  - Automatic 401 error detection in all API calls
  - Integrated into both match and playlists pages
  - Returns user to current page after successful re-authentication

- **Smart Polling Interval Management**: Intelligent automatic control of polling intervals
  - Auto-starts polling at 5 seconds when playback begins (if currently off)
  - Auto-stops polling after 60 seconds of idle time when no music is playing
  - Prevents multiple idle timers with ref-based tracking
  - Reduces unnecessary API calls while ensuring responsive UI updates
  - Implemented in both match and playlists pages

### Enhanced
- **PlaylistCarousel UI Improvements**: Refined visual hierarchy and user experience
  - Track counter moved to header with compact "1/5" format next to playlist name
  - Start time chip now overlays album image at bottom center
  - Start time always visible with conditional styling:
    - Bright primary color with shadow and border when start time > 0
    - Subtle transparent style when start time = 0
  - Larger play button (80x80px) for easier interaction
  - Previous/next buttons stretch full height of album image
  - Grid layout ensures proper button sizing
  - Removed duplicate start time display from track info

### Fixed
- **Idle Timer Loops**: Resolved issue where idle timer started on every poll
  - Used ref to track active timer state
  - Timer now only starts once when playback stops
  - Timer properly cleared when playback resumes
  - Eliminated console spam in development mode

### Technical Details
- Token expiry utility function for consistent error detection across app
- Error status codes now properly propagated from API calls
- useRef pattern for timer management prevents memory leaks
- Grid layout with stretch alignment for consistent button sizing
- Conditional styling with Tailwind for dynamic visual feedback

## [0.9.2] - 2025-10-27

### Added
- **Multi-Theme Support**: Three distinct themes for different use cases
  - Light theme - Clean, professional light mode with soft blue accents
  - Dark theme - Existing dark theme with purple accents (default)
  - SPORTS theme - High-energy yellow and black theme inspired by Sola Håndball
  - Theme switcher with icon buttons (Sun/Moon/Zap) in navigation bar
  - Theme preference persists in localStorage
  - Smooth theme initialization prevents flash on page load

### Enhanced
- **Navigation & User Experience**: Streamlined app navigation
  - /playlists is now the default start page after login
  - Removed "Hjem", "Innstillinger", and "Statistikk" menu items
  - Logo now links directly to /playlists
  - Simplified navigation for focused DJ workflow

- **Image Quality**: Significantly improved album cover display
  - Match page now uses highest resolution images (640x640px) instead of lowest (64x64px)
  - Added responsive image sizing with Next.js Image optimization
  - Priority loading for better performance

- **Performance Monitoring**: Improved developer tools
  - Renamed "Show Performance" button to "Log"
  - Moved Log button to navigation bar (appears next to "Kamp" menu)
  - Only visible when on /match page
  - Custom event-based communication between Navigation and Match page

### Fixed
- **Continuous Page Reloading**: Resolved POST request loop issues
  - Fixed unstable useEffect dependencies in playlists and match pages
  - Wrapped async functions in useCallback with stable dependencies
  - Simplified middleware to only run on home page redirect
  - Removed duplicate redirect logic causing loops

- **Error Handling**: Better Spotify API error management
  - 401 Unauthorized errors now handled gracefully (token expired/invalid)
  - No longer throws errors when no track is playing (204 responses)
  - Improved error logging and user feedback

- **djCloud Sync Optimization**: Reduced unnecessary polling
  - Sync status polling only runs when djCloud dialog is open
  - Removed debug console logs from sync comparison
  - Prevents continuous sync checks on match page

### Technical Details
- Function hoisting fixed by moving useCallback definitions before useEffects
- Custom event system for cross-component communication (Navigation ↔ Match)
- Server-side middleware redirect for authenticated users
- Theme system uses CSS custom properties with Tailwind
- Improved React hook dependency arrays for stable renders

## [0.9.1] - 2025-10-27

### Enhanced
- **djCloud Smart CTA**: Intelligent button recommendations based on sync state
  - Backup button becomes CTA (primary style) when local changes are newer than cloud
  - Restore button becomes CTA (primary style) when cloud is newer than local
  - Both buttons use outline style when data is in sync
  - Improved visual hierarchy guides users to recommended action

- **djCloud Sync Indicators**: Enhanced visibility of sync state badges
  - Increased arrow icon size (h-3 → h-4) for better visibility
  - Enlarged badge container (h-4 → h-5) for more prominent display
  - Thicker border (border-2) with primary color accent
  - Added shadow effect for improved visual prominence
  - Orange up-arrow (↑) clearly indicates backup needed
  - Blue down-arrow (↓) clearly indicates restore available

### Technical Details
- Refactored sync state logic into reusable `getSyncState()` function
- Dynamic button variant switching based on sync comparison
- Enhanced badge styling for improved user awareness

## [0.9.0] - 2025-10-27

### Added
- **djCloud - Cloud Synchronization System**: Complete cloud backup and restore functionality
  - Branded as "djCloud" for professional DJ-focused user experience
  - Backup/Restore buttons for intuitive data management
  - Supabase integration for reliable cloud storage
  - Automatic synchronization of track start times and playlist types across devices
  - Device name management for multi-device setup tracking

- **CloudSyncPanel Component**: New modal dialog for cloud sync management
  - Centered modal dialog with clean, accessible interface
  - Device name input and management
  - Visual sync status indicators with timestamps
  - Real-time sync status display (last cloud sync vs. last local change)

- **Smart Sync Indicators**: Visual feedback for sync state
  - Orange up-arrow (↑) badge when local changes need backup
  - Blue down-arrow (↓) badge when cloud has newer data
  - Automatic indicator updates via periodic polling (5 seconds)
  - Second-level timestamp precision to avoid false sync warnings

- **Automatic Change Tracking**: Intelligent local change detection
  - Timestamp updates when saving/removing track start times
  - Timestamp updates when saving/removing playlist types
  - Local timestamp synchronization after successful backup/restore
  - Persistent timestamp storage in localStorage

### Enhanced
- **Environment Configuration**: Browser-safe environment variable handling
  - Added NEXT_PUBLIC_ prefix support for client-side Supabase access
  - Server-only variables properly isolated from browser code
  - Improved security with proper variable scoping

- **TypeScript Support**: Complete type safety for Supabase integration
  - Database type definitions with JSON field support
  - Proper type inference for all Supabase operations
  - Type-safe sync operations and status checks

- **User Experience**: Improved cloud sync workflow
  - Console logging for sync comparison debugging
  - Toast notifications for all sync operations
  - Loading states during backup/restore operations
  - Automatic page reload after restore to reflect changes

### Fixed
- **Import Issues**: Resolved getCurrentUser import error
  - Changed from named export to default export import
  - Fixed CloudSyncPanel component initialization

- **TypeScript Build Errors**: Resolved all Supabase type inference issues
  - Fixed Database schema type definitions
  - Added proper type assertions for JSONB fields
  - Resolved maybeSingle() return type issues

### Technical Details
- Supabase cloud storage with Row Level Security policies
- Automatic timestamp management for sync detection
- Browser-compatible environment variable configuration
- Type-safe database operations with proper error handling
- Periodic polling for real-time sync status updates
- Device-specific data tracking and management

## [0.8.0] - 2025-10-22

### Added
- **ErrorBoundary komponent**: Ny feilhåndteringskomponent for bedre brukeropplevelse
  - Automatisk feilfangst og visning av brukervennlige feilmeldinger
  - Forbedret stabilitet ved uventede feil i komponenter
  - Integrert med eksisterende feilhåndteringssystem

- **RouteGuard komponent**: Ny rutebeskyttelse for autentisering
  - Automatisk omdirigering til innlogging for beskyttede ruter
  - Forbedret sikkerhet og brukeropplevelse
  - Integrert med NextAuth.js autentisering

- **Konfigurasjonssystem**: Nytt sentralisert konfigurasjonssystem
  - Miljøvariabel-håndtering i `lib/config/env.ts`
  - Type-sikker konfigurasjon for alle miljøer
  - Forbedret sikkerhet for sensitive verdier

### Enhanced
- **Logger-system**: Utvidet logging og feilhåndtering
  - Detaljert logging i `lib/utils/logger.ts`
  - Forbedret feilhåndtering i `lib/utils/errorHandler.ts`
  - Bedre debugging og overvåking av applikasjonen

- **Performance-optimalisering**: Forbedret ytelse og caching
  - Optimalisert polling-mekanismer i `lib/hooks/useOptimizedPolling.ts`
  - Forbedret loading states i `lib/hooks/useLoadingState.ts`
  - Bedre cache-håndtering og ytelse

- **UI-komponenter**: Oppdaterte og forbedrede brukergrensesnitt
  - Forbedret skeleton-komponenter for bedre loading states
  - Oppdaterte core utilities for bedre kompatibilitet
  - Forbedret komponentarkitektur og gjenbrukbarhet

### Fixed
- **Autentisering**: Forbedret NextAuth.js integrasjon
  - Oppdaterte token-typer og håndtering
  - Forbedret sikkerhet og stabilitet
  - Bedre integrasjon med Spotify API

- **Build og distribusjon**: Forbedret Electron-applikasjon
  - Oppdaterte build-konfigurasjoner
  - Forbedret distribusjon og installasjon
  - Bedre kompatibilitet på tvers av plattformer

### Technical Details
- Nytt konfigurasjonssystem for bedre miljøhåndtering
- Utvidet logging og feilhåndtering for bedre debugging
- Forbedret performance med optimaliserte hooks og caching
- Oppdaterte type-definisjoner for bedre TypeScript-støtte
- Forbedret komponentarkitektur med nye utility-komponenter

## [0.7.0] - 2025-10-21

### Minor Updates
- General improvements and optimizations
- Enhanced user experience across components
- Default tasklist page

## [0.6.0] - 2025-10-21

### Enhanced
- **Hovedside (app/page.tsx)**: Forbedret hovedside med oppdatert funksjonalitet
  - Forbedret brukeropplevelse og navigasjon
  - Oppdatert layout og design

- **Spilleliste-side (app/playlists/page.tsx)**: Forbedret spilleliste-funksjonalitet
  - Bedre integrasjon med avspillingssystem
  - Forbedret brukergrensesnitt

- **NowPlayingBar**: Oppdatert avspillingskontroll
  - Forbedret funksjonalitet og brukeropplevelse
  - Bedre integrasjon med andre komponenter

- **TrackListSetStartTime**: Forbedret funksjonalitet for starttidsredigering
  - Bedre brukeropplevelse for DJ-funksjonalitet
  - Forbedret redigeringsgrensesnitt

- **TrackListSwitcher**: Oppdatert sporvisningskomponent
  - Forbedret navigasjon mellom sporvisninger
  - Bedre brukeropplevelse

### Technical Details
- Oppdaterte komponenter for bedre integrasjon
- Forbedret brukeropplevelse på tvers av alle sider
- Optimalisert komponentarkitektur

## [0.5.0] - 2025-10-20

### Added
- **TrackListSetStartTime komponent**: Ny funksjonalitet for å sette starttider på spor
  - Mulighet til å redigere starttider for individuelle spor
  - Forbedret brukeropplevelse for DJ-funksjonalitet
  - Integrert med eksisterende avspillingssystem

- **TrackListSwitcher komponent**: Ny komponent for å bytte mellom forskjellige sporvisninger
  - Fleksibel visning av spor i forskjellige formater
  - Forbedret navigasjon og organisering av spor

- **Favicon og PWA-støtte**: Utvidet favicon-støtte og Progressive Web App-funksjonalitet
  - Flere favicon-størrelser for bedre kompatibilitet
  - PWA manifest for installasjon som app
  - Forbedret mobil- og desktop-opplevelse

### Enhanced
- **GlobalNowPlayingBar**: Forbedret global avspillingskontroll
  - Bedre integrasjon med alle sider
  - Forbedret brukergrensesnitt og responsivitet

- **Navigation**: Oppdatert navigasjonssystem
  - Forbedret brukeropplevelse
  - Bedre integrasjon med nye komponenter

- **PlaylistCarousel**: Forbedret spilleliste-karusell
  - Bedre ytelse og brukeropplevelse
  - Forbedret navigasjon og interaksjon

### Fixed
- **Player API-funksjoner**: Oppdaterte og forbedrede Spotify player API-integrasjoner
  - pausePlayback: Forbedret pause-funksjonalitet
  - seekToPosition: Bedre posisjonering i spor
  - setPlaybackVolume: Forbedret volumkontroll
  - setRepeatMode: Bedre repeat-funksjonalitet
  - skipToNext/Previous: Forbedret spor-navigasjon
  - startResumePlayback: Bedre avspillingsstart
  - togglePlaybackShuffle: Forbedret shuffle-funksjonalitet

- **Layout og routing**: Oppdaterte app-layout og routing-struktur
  - Forbedret favicon-håndtering
  - Bedre organisering av app-struktur

### Technical Details
- Oppdaterte Spotify player API-integrasjoner for bedre stabilitet
- Forbedret komponentarkitektur med nye spesialiserte komponenter
- Utvidet PWA-funksjonalitet for bedre mobil-opplevelse
- Forbedret favicon-støtte på tvers av plattformer

## [0.4.1] - 2025-10-20

### Fixed
- **PlaylistCarousel navigasjon**: Fikset "previous track" knapp for første spilleliste i hver kategori
  - Løst event handling problemer som forhindret klikk-funksjonalitet
  - Fikset z-index konflikter mellom play-knapp og navigasjonsknapper
  - Implementert robust fallback-logikk for track-navigasjon
  - Forbedret pointer events håndtering for bedre brukeropplevelse

### Technical Details
- Lagt til eksplisitt event handling med preventDefault() og stopPropagation()
- Implementert z-index løsning (relative z-10) for navigasjonsknapper
- Fikset pointer events konflikter mellom overlappende elementer
- Forbedret fallback-mekanisme for track arrays (tracksWithStartTimes vs tracks)

## [0.4.0] - 2025-10-20

### Enhanced
- **Auto-advance funksjonalitet**: Implementert automatisk fremgang for spillelister
  - MatchPage og PlaylistCarousel støtter nå automatisk avspilling av neste spor
  - Forbedret brukeropplevelse med sømløs overgang mellom spor
  
- **Error handling**: Forbedret feilhåndtering under sporavspilling
  - Brukervennlige feilmeldinger ved avspillingsproblemer
  - Bedre håndtering av nettverksfeil og API-problemer
  - Tydelige indikatorer for feiltilstander

### Fixed
- **Track playback interval**: Justert avspillingsintervall for forbedret responsivitet
  - Optimalisert polling-frekvens for bedre ytelse
  - Redusert serverbelastning med smartere oppdateringsintervaller
  
- **Focus management**: Forbedret fokus-håndtering for redigering av sporstarttider
  - Bedre navigasjon i TrackList-komponenten
  - Forbedret tilgjengelighet for tastaturnavigasjon
  - Smidigere redigeringsopplevelse

## [0.3.0] - 2025-10-18

### Enhanced
- **MatchPage og PlaylistCarousel**: Optimalisert spilleliste- og sporiadlasting
  - Implementert caching-mekanismer for forbedret ytelse
  - Batch-ladning av spor for raskere innlasting
  - Detaljerte ytelsesmetrikker for utviklermodus
  
- **Avspillingsfunksjonalitet**: Refaktorert sporavspilling
  - Bruker forhåndsberegnede mappinger for raskere tilgang
  - Optimalisert sporiadlasting og caching

### Added
- **Performance Monitoring**: Ytelsesovervåking i utviklermodus
  - Detaljerte metrikker for sporiadlasting
  - Cache-hit/miss-statistikk
  - Lastingstider og optimaliseringsindikatorer

### Technical Details
- Nytt caching-system i `lib/utils/cache.ts`
- Optimalisert sporiadlasting i `lib/spotify/optimized/`
- Ytelsesmetrikker i `lib/utils/performance.ts`
- Forbedret UI-komponenter for ytelsesovervåking

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