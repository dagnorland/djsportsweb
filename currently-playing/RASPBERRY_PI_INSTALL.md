# CurrentlyPlaying Installasjonsguide for Raspberry Pi

Denne guiden beskriver hvordan du installerer og setter opp CurrentlyPlaying på en Raspberry Pi.

## Forutsetninger

- Raspberry Pi med Raspberry Pi OS (eller annen Debian-basert Linux-distribusjon)
- Internett-tilkobling
- Node.js 18 eller nyere installert
- Spotify Developer applikasjon opprettet

## Steg 1: Installer Node.js (hvis ikke allerede installert)

```bash
# Oppdater systempakker
sudo apt update && sudo apt upgrade -y

# Installer Node.js via NodeSource (anbefalt for nyere versjoner)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verifiser installasjonen
node --version
npm --version
```

Alternativ: Hvis du bruker Raspberry Pi OS, kan du også installere via apt:
```bash
sudo apt install -y nodejs npm
```

## Steg 2: Klon eller kopier prosjektet

### Alternativ A: Fra Git repository

```bash
# Naviger til hjemmemappen
cd ~

# Klon repositoriet (erstatt URL med ditt repository)
git clone <repository-url> djsportsweb
cd djsportsweb
```

### Alternativ B: Kopier filer manuelt

```bash
# Opprett prosjektmappe
mkdir -p ~/projects/djsportsweb
cd ~/projects/djsportsweb

# Kopier alle filer til denne mappen (bruk scp, USB, eller annen metode)
# Strukturen må være:
# djsportsweb/
#   ├── currently-playing/
#   ├── lib/
#   ├── package.json
#   └── ...
```

## Steg 3: Installer avhengigheter

```bash
# Naviger til prosjektmappen
cd ~/projects/djsportsweb  # eller hvor du har plassert prosjektet

# Installer alle npm-pakker
npm install
```

Dette kan ta noen minutter første gang.

## Steg 4: Få Spotify Refresh Token

Du trenger en refresh token fra Spotify. Dette gjør du på en datamaskin med nettleser (ikke nødvendigvis på Pi-en):

### På din hovedmaskin (Mac/PC):

1. **Start lokal server for autentisering:**
   ```bash
   cd currently-playing
   python3 -m http.server 8080
   ```

2. **Åpne HTML-filen:**
   - Gå til: `http://127.0.0.1:8080/get-auth-code.html`
   - Eller åpne `get-auth-code.html` direkte i nettleseren

3. **Følg instruksjonene:**
   - Legg til Redirect URI i Spotify Developer Dashboard (vises i HTML-filen)
   - Skriv inn din `SPOTIFY_CLIENT_ID`
   - Klikk "Start Spotify Autorisasjon"
   - Logg inn og kopier authorization code

4. **Hent refresh token:**
   ```bash
   chmod +x currently-playing/get-refresh-token.sh
   ./currently-playing/get-refresh-token.sh <AUTHORIZATION_CODE>
   ```

   Scriptet vil gi deg en `refresh_token` - kopier denne!

## Steg 5: Konfigurer miljøvariabler på Raspberry Pi

```bash
# Kopier eksempelfilen
cp env.example .env.local

# Rediger filen med nano eller annen editor
nano .env.local
```

Fyll inn følgende verdier:

```env
SPOTIFY_CLIENT_ID=din_client_id_her
SPOTIFY_CLIENT_SECRET=din_client_secret_her
SPOTIFY_REFRESH_TOKEN=din_refresh_token_her
```

**Viktig:** Du trenger kun Spotify-variablene for currently-playing. De andre variablene (NextAuth, Supabase) er kun nødvendige for hele webapplikasjonen.

Lagre filen (Ctrl+O, Enter, Ctrl+X i nano).

## Steg 6: Test installasjonen

```bash
# Test at alt fungerer
npm run currently-playing
```

Du bør nå se:
- En melding om at displayet starter
- Polling intervall informasjon
- Et ASCII-banner med nåværende sang (hvis noe spiller på Spotify)

Trykk `Ctrl+C` for å avslutte.

**Tips:** For å teste med annet polling intervall:
```bash
npm run currently-playing 5  # 5 sekunder intervall
```

## Steg 7: Sett opp auto-start med systemd

For å starte automatisk ved oppstart:

### Opprett systemd service-fil

```bash
sudo nano /etc/systemd/system/spotify-display.service
```

Lim inn følgende (juster stier etter hvor du har plassert prosjektet):

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
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**Viktig:** 
- Bytt `/home/pi/projects/djsportsweb` med faktisk sti til prosjektet ditt
- Bytt `User=pi` med din bruker hvis du ikke bruker `pi`-brukeren
- Bytt `/usr/bin/npm` hvis npm ikke er der (sjekk med `which npm`)

### Aktiver og start servicen

```bash
# Last inn ny service
sudo systemctl daemon-reload

# Aktiver ved oppstart
sudo systemctl enable spotify-display.service

# Start servicen nå
sudo systemctl start spotify-display.service

# Sjekk status
sudo systemctl status spotify-display.service

# Se logger
sudo journalctl -u spotify-display.service -f
```

### Nyttige systemd-kommandoer

```bash
# Stopp servicen
sudo systemctl stop spotify-display.service

# Start servicen
sudo systemctl start spotify-display.service

# Restart servicen
sudo systemctl restart spotify-display.service

# Se logger
sudo journalctl -u spotify-display.service -n 50  # Siste 50 linjer
sudo journalctl -u spotify-display.service -f     # Følg logger i sanntid

# Deaktiver auto-start
sudo systemctl disable spotify-display.service
```

## Steg 8: Fullscreen display på liten skjerm (valgfritt)

Hvis du har en liten skjerm koblet til Raspberry Pi og vil vise i fullscreen:

### Alternativ 1: Bruk framebuffer direkte

```bash
# Start på framebuffer (for headless/små skjermer)
FRAMEBUFFER=/dev/fb0 npm run currently-playing
```

Oppdater systemd service-filen:
```ini
ExecStart=/bin/bash -c 'cd /home/pi/projects/djsportsweb && FRAMEBUFFER=/dev/fb0 /usr/bin/npm run currently-playing'
```

### Alternativ 2: Fullscreen terminal

Hvis du bruker X11/GUI:

```bash
# Installer xdotool
sudo apt install -y xdotool

# I terminal, trykk F11 for fullscreen
```

### Alternativ 3: Start terminal i fullscreen ved oppstart

Legg til i `~/.bashrc` eller `~/.xinitrc`:

```bash
# Vent litt før du trykker F11
sleep 2
xdotool key F11
```

## Troubleshooting

### "command not found: npm"
- Sjekk at Node.js er installert: `node --version`
- Hvis npm ikke finnes: `sudo apt install npm`
- Eller installer Node.js på nytt (se Steg 1)

### "SPOTIFY_REFRESH_TOKEN environment variable is not set"
- Sjekk at `.env.local` eksisterer i prosjektmappen
- Sjekk at filen inneholder `SPOTIFY_REFRESH_TOKEN=...`
- For systemd: sjekk at `EnvironmentFile` i service-filen peker til riktig sti
- Test manuelt: `source .env.local && npm run currently-playing`

### Service starter ikke
- Sjekk logger: `sudo journalctl -u spotify-display.service -n 50`
- Sjekk at alle stier i service-filen er riktige
- Sjekk at brukeren har tilgang til prosjektmappen: `sudo chown -R pi:pi ~/projects/djsportsweb`
- Sjekk at `.env.local` har riktige rettigheter: `chmod 600 .env.local`

### "Permission denied"
- Sjekk rettigheter på script: `chmod +x currently-playing/index.ts`
- Sjekk at brukeren kan skrive til prosjektmappen

### Ingen musikk vises
- Dette er normalt hvis ingen musikk spiller på Spotify
- Start musikk på en Spotify-enhet (telefon, desktop, etc.)
- Sjekk at refresh token er gyldig

### Refresh token utløpt
- Du må få en ny refresh token (se Steg 4)
- Oppdater `.env.local` med ny token
- Restart service: `sudo systemctl restart spotify-display.service`

### Service crasher kontinuerlig
- Sjekk logger for feilmeldinger
- Test manuelt først: `npm run currently-playing`
- Sjekk at alle miljøvariabler er satt korrekt

## Optimalisering for Raspberry Pi

### Reduser polling intervall for lavere CPU-bruk

I systemd service-filen, endre ExecStart til:

```ini
ExecStart=/bin/bash -c 'cd /home/pi/projects/djsportsweb && /usr/bin/npm run currently-playing 5'
```

Dette setter polling intervall til 5 sekunder i stedet for 3.

### Bruk tmux/screen for manuell kjøring

Hvis du vil kjøre manuelt og beholde det kjørende etter at du logger ut:

```bash
# Installer tmux
sudo apt install -y tmux

# Start ny session
tmux new -s spotify

# Kjør displayet
npm run currently-playing

# Detach: Ctrl+B, så D
# Reattach: tmux attach -t spotify
```

## Vedlikehold

### Oppdatere prosjektet

```bash
cd ~/projects/djsportsweb
git pull  # Hvis du bruker git
npm install  # Installer eventuelle nye avhengigheter
sudo systemctl restart spotify-display.service
```

### Sjekke at alt fungerer

```bash
# Se siste logger
sudo journalctl -u spotify-display.service --since "1 hour ago"

# Test manuelt
npm run currently-playing
```

## Neste steg

Nå bør du ha et fungerende Spotify display på din Raspberry Pi! Displayet vil automatisk starte ved oppstart og vise nåværende sang i et ASCII banner-format.

For å tilpasse displayet eller legge til funksjoner, se:
- `currently-playing/index.ts` - Hovedlogikk
- `currently-playing/display.ts` - Visningsformat
- `currently-playing/tokenManager.ts` - Token-håndtering

