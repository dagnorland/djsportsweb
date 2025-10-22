# djSports - Spotify Music Management App

En avansert Next.js-applikasjon for å administrere Spotify-spillelister med fokus på sportsarrangementer. Appen inkluderer optimalisert caching, feilhåndtering, og en moderne brukeropplevelse.

## Hovedfunksjoner

- **🎵 Spotify Integration**: Fullstendig integrering med Spotify API og Web Playback SDK
- **⚡ Optimalisert Ytelse**: Intelligent caching og adaptive polling-intervaller
- **🔐 Sikker Autentisering**: NextAuth.js med Spotify OAuth og token-refreshing
- **🎨 Moderne UI**: shadcn/ui komponenter med TailwindCSS
- **📱 Responsiv Design**: Optimalisert for både desktop og mobil
- **🛡️ Robust Feilhåndtering**: Sentralisert error handling med brukervennlige meldinger
- **♿ Tilgjengelighet**: Route guards, keyboard navigation og loading states
- **🔧 TypeScript**: Fullstendig type safety med forbedrede type-definisjoner

## Getting Started

### Prerequisites

Make sure you have the following installed on your machine:

- [Node.js](https://nodejs.org/) (v14 or later)
- [npm](https://www.npmjs.com/) (v6 or later) or [Yarn](https://yarnpkg.com/) (v1.22 or later) or [pnpm](https://pnpm.io/) (v6 or later) or [Bun](https://bun.sh/)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/CyprienDeRoef/nextjs-spotify-api-template
cd nextjs-spotify-api-template
```

2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### Running the Development Server

To start the development server, run:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open http://localhost:3000 with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

### Spotify API Setup

For å bruke Spotify API, må du sette opp en Spotify Developer-konto og få nødvendige legitimasjoner:

1. Gå til [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) og logg inn.

2. Opprett en ny applikasjon for å få Client ID og Client Secret.

3. Kopier `env.example` til `.env.local` og fyll inn dine legitimasjoner:

```bash
cp env.example .env.local
```

4. Fyll inn dine Spotify-legitimasjoner i `.env.local`:

```
SPOTIFY_CLIENT_ID=din_spotify_client_id
SPOTIFY_CLIENT_SECRET=din_spotify_client_secret
JWT_SECRET=din_sikre_jwt_secret_minst_32_tegn
NEXTAUTH_URL=http://localhost:3000
```

**Viktig**: JWT_SECRET må være minst 32 tegn lang for sikkerhet.

## Nye Forbedringer

### 🔧 Sikkerhet & Konfigurasjon
- **Miljøvariabel-validering**: Automatisk validering av påkrevde miljøvariabler ved oppstart
- **Sikker JWT-håndtering**: Forbedret token-refreshing med bedre feilhåndtering
- **Type-safe konfigurasjon**: TypeScript-definerte miljøvariabler

### ⚡ Ytelse-optimalisering
- **Adaptive polling**: Intelligent polling med eksponentiell backoff ved feil
- **Optimalisert caching**: LRU-cache med automatisk opprydding
- **Preloading**: Kritiske spillelister lastes inn på forhånd

### 🛡️ Robust Feilhåndtering
- **Error Boundary**: Sentralisert feilhåndtering med brukervennlige meldinger
- **Retry-logikk**: Automatisk retry med eksponentiell backoff
- **Kategoriserte feil**: Spotify API, nettverk og valideringsfeil

### ♿ Tilgjengelighet & UX
- **Route Guards**: Automatisk omdirigering for ikke-autentiserte brukere
- **Loading States**: Forbedrede loading-indikatorer og skeleton-komponenter
- **Keyboard Navigation**: Fullstendig keyboard-støtte for alle komponenter

### 🔧 TypeScript-forbedringer
- **Type Safety**: Fjernet alle `any` typer og forbedret type-definisjoner
- **NextAuth Types**: Forbedrede type-definisjoner for autentisering
- **Error Types**: Type-safe feilhåndtering med kategoriserte feiltyper

### Playing Spotify Music with Web Playback SDK

This project also integrates the Spotify Web Playback SDK as a `React.ContextProvider` to enable music playback directly within your application and share all its relative states. Note that you **must** have a Premium Spotify account to use this functionnality since Spotify only provides it to its Premium members. Here's how to implement the Spotify Web Playback SDK:

```typescript
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import PlayerProvider from "@/providers/PlayerProvider";
[...]
const session = await getServerSession(authOptions);
return (
    <PlayerProvider token={ session.accessToken }>
      //...
    </PlayerProvider>
)
```

### Building an Interface with shadcn/ui

This template comes with an optional components library: [shadcn/ui](https://ui.shadcn.com/docs). Unlike many components libraries, shadcn/ui allows you to fully customize your components by placing them in a `components/ui` folder instead of the usual `node_modules`, granting you access to all properties. Here's an exemple of how to create a Card:

```tsx
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter
} from '@/components/ui/card';
[...]
return (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card Content</p>
      </CardContent>
      <CardFooter>
        <p>Card Footer</p>
      </CardFooter>
    </Card>
)
```
Here is my current work in progress based on Spotify layout and built with shadcn/ui:

![image](https://github.com/user-attachments/assets/069d1e99-40ad-4f84-a8eb-2775b687e07b)

### Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

To learn more about NextAuth.js, browse the [NextAuth](https://next-auth.js.org/providers/spotify) documentation.

To learn more about the Spotify API and Web Playback SDK, check out these resources:

- [Spotify for Developers](https://developer.spotify.com/documentation/web-api) - find everything you need about Spotify API endpoints.
- [Spotify Web Playback SDK](https://developer.spotify.com/documentation/web-playback-sdk) - learn how to stream and play Spotify music in your own app.

To learn more about TailwindCSS, go to the [TaildwindCSS](https://tailwindcss.com/docs) documentation.

To learn more about shadcn/ui, visit the [shadcn/ui](https://ui.shadcn.com/docs) documentation.

## Utvikling

### Arkitektur
- **Next.js 14**: App Router med server-side rendering
- **TypeScript**: Fullstendig type safety
- **TailwindCSS**: Utility-first CSS framework
- **shadcn/ui**: Moderne komponentbibliotek
- **NextAuth.js**: Sikker autentisering
- **Spotify Web API**: Fullstendig API-integrasjon

### Kodekvalitet
- **ESLint**: Automatisk kodekvalitetskontroll
- **TypeScript**: Streng type-sjekking
- **Error Boundaries**: Robust feilhåndtering
- **Logging**: Strukturert logging med miljøbaserte nivåer

### Ytelse
- **Caching**: Intelligent caching med TTL og LRU-eviction
- **Polling**: Adaptive polling med backoff-strategier
- **Preloading**: Kritiske ressurser lastes på forhånd
- **Bundle Optimization**: Optimalisert JavaScript-bundling

## Bidrag

Vi setter pris på bidrag! Vennligst:
1. Fork prosjektet
2. Opprett en feature branch
3. Commit dine endringer
4. Push til branch
5. Opprett en Pull Request

## Lisens

Dette prosjektet er lisensiert under MIT-lisensen.
