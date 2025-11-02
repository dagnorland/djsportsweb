# Currently Playing Display for Raspberry Pi

Tekstbasert display for å vise nåværende Spotify-spor på en Raspberry Pi med liten skjerm.

## Funksjoner

- 🎵 Viser nåværende sang/episode i ASCII banner-format
- 📡 Automatisk polling med konfigurerbart intervall (standard 3 sekunder)
- 🔄 Automatisk token refresh
- 🎨 Morsom animasjon ved oppdatering
- 🖥️ Perfekt for headless Raspberry Pi med liten skjerm

## Forutsetninger

1. Node.js installert på Raspberry Pi
2. Spotify Developer applikasjon opprettet
3. Refresh token fra Spotify

## Installasjon

### 1. Installer avhengigheter

```bash
npm install
```

### 2. Få Spotify Refresh Token

For å få en refresh token kan du:

**Alternativ A: Bruk NextAuth session**
Hvis du allerede er logget inn via NextAuth, kan du hente refresh token fra session.

**Alternativ B: Manuell autentisering**
1. Gå til Spotify Developer Dashboard og opprett en app
2. Sett redirect URI til `http://localhost:3000/api/auth/callback/spotify`
3. Logg inn via NextAuth i hovedapplikasjonen
4. Refresh token lagres i session

**Alternativ C: Direkte via Spotify API (Enklest metode)**

Bruk den medfølgende HTML-filen for å enkelt fange authorization code:

1. **Legg til redirect URI i Spotify Dashboard:**
   - Gå til [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Velg din app
   - Gå til "Settings"
   - Under "Redirect URIs", legg til URL-en som vises i HTML-filen (enten `file://` path eller en lokal server URL)
   - **Merk:** Hvis du åpner HTML-filen direkte (file://), bruk den fullstendige file:// URL-en
   - **Alternativ:** Du kan også starte en lokal server: `python3 -m http.server 8080` og bruke `http://localhost:8080/get-auth-code.html`

2. **Start en lokal server (anbefalt):**
   ```bash
   # I prosjektets rotmappe:
   cd currently-playing
   python3 -m http.server 8080
   ```

3. **Åpne HTML-filen i nettleseren:**
   ```bash
   # Åpne denne URL-en i nettleseren:
   open http://localhost:8080/get-auth-code.html
   # Eller manuelt: http://localhost:8080/get-auth-code.html
   ```

4. **Følg instruksjonene i nettleseren:**
   - HTML-filen viser Redirect URI som skal legges til i Spotify Dashboard
   - Skriv inn din `SPOTIFY_CLIENT_ID` i input-feltet
   - Klikk på "Start Spotify Autorisasjon"
   - Logg inn på Spotify og godta tilgang
   - **Etter redirect vil authorization code vises direkte på siden** - kopier den!

5. **Hent refresh token:**
   ```bash
   chmod +x currently-playing/get-refresh-token.sh
   ./currently-playing/get-refresh-token.sh <AUTHORIZATION_CODE>
   ```

   Scriptet vil spørre om Redirect URI (bruk samme som du la til i Spotify Dashboard) og gi deg refresh_token som du kan legge i `.env.local`.

**Alternativ: Hvis du ikke vil bruke lokal server:**
- Åpne `get-auth-code.html` direkte i nettleseren (dobbeltklikk)
- Bruk den fullstendige `file://` URL-en som Redirect URI i Spotify Dashboard
- HTML-filen viser deg riktig Redirect URI når du åpner den

**Alternativ: Manuell curl (hvis du foretrekker):**

Hvis du allerede har fått authorization code, kan du bruke:

```bash
curl -X POST "https://accounts.spotify.com/api/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code&code=AUTHORIZATION_CODE&redirect_uri=http://localhost:8080/callback" \
  --user "CLIENT_ID:CLIENT_SECRET"
```

Responsen vil inneholde både `access_token` og `refresh_token`.

### 3. Konfigurer miljøvariabler

Kopier `env.example` til `.env.local` og fyll inn:

```bash
cp env.example .env.local
```

Fyll inn:
- `SPOTIFY_CLIENT_ID` - Fra Spotify Developer Dashboard
- `SPOTIFY_CLIENT_SECRET` - Fra Spotify Developer Dashboard  
- `SPOTIFY_REFRESH_TOKEN` - Refresh token du fikk i steg 2

## Bruk

### Grunnleggende bruk

```bash
npm run currently-playing
```

Dette starter displayet med standard polling intervall på 3 sekunder.

### Tilpasset polling intervall

```bash
npm run currently-playing 5
```

Dette setter polling intervallet til 5 sekunder.

### Raspberry Pi Auto-start

For å starte automatisk ved oppstart på Raspberry Pi:

#### Systemd Service (anbefalt)

Opprett `/etc/systemd/system/spotify-display.service`:

```ini
[Unit]
Description=Spotify Currently Playing Display
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/projects/djsportsweb
Environment="NODE_ENV=production"
EnvironmentFile=/home/pi/projects/djsportsweb/.env.local
ExecStart=/usr/bin/npm run currently-playing
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Aktiver servicen:

```bash
sudo systemctl enable spotify-display.service
sudo systemctl start spotify-display.service
```

#### Cron Job (alternativ)

Legg til i crontab (`crontab -e`):

```cron
@reboot cd /home/pi/projects/djsportsweb && npm run currently-playing >> /tmp/spotify-display.log 2>&1
```

### Fullscreen Terminal på Raspberry Pi

For å vise på liten skjerm i fullscreen:

1. Installer `xdotool` hvis du bruker X11:
```bash
sudo apt-get install xdotool
```

2. Start terminal i fullscreen ved oppstart:
```bash
# Legg til i ~/.bashrc eller opprett eget script
xdotool key F11
```

Eller bruk framebuffer direkt (anbefalt for headless):

```bash
# Start direkte på framebuffer
FRAMEBUFFER=/dev/fb0 npm run currently-playing
```

## Output Format

Displayet viser:

```
┌────────────────────────────────────────┐
│                                        │
│   ARTIST NAVN - SANG NAVN              │
│                                        │
└────────────────────────────────────────┘

   Album: Album Navn
   Status: ▶ Spiller
```

Ved oppdatering vises en morsom animasjon med musikksymboler (♪ ♫) før nytt innhold vises.

## Troubleshooting

### "SPOTIFY_REFRESH_TOKEN environment variable is not set"
- Sjekk at `.env.local` eksisterer og inneholder `SPOTIFY_REFRESH_TOKEN`
- For production/systemd, sjekk at `EnvironmentFile` er satt korrekt

### "Token refresh failed"
- Refresh token kan være utløpt (varer vanligvis svært lenge, men kan utløpe)
- Du må få en ny refresh token ved å logge inn på nytt

### Ingen musikk spiller
- Displayet viser "Ingen musikk spiller" hvis ingen aktiv avspilling
- Start musikk på en Spotify-enhet (telefon, desktop, etc.)

### Permission denied
- Sjekk at scriptet har execute-permissions: `chmod +x currently-playing/index.ts`
- For systemd, sjekk at brukeren har tilgang til prosjektmappen

## Utvikling

Koden er strukturert i tre hovedfiler:

- `index.ts` - Hovedentry point med polling loop
- `tokenManager.ts` - Håndterer refresh token og token refresh
- `display.ts` - Formaterer output og animasjoner

Alle filer bruker TypeScript og kan utvides med flere funksjoner som progress bar, album cover via ASCII art, etc.
