#!/bin/bash

# Script for å få Spotify Refresh Token
# Bruker authorization code fra get-auth-code.html

echo "🎵 Spotify Refresh Token Generator"
echo ""

# Les miljøvariabler
if [ -f .env.local ]; then
    source .env.local
fi

# Spør etter verdier hvis de ikke er satt
if [ -z "$SPOTIFY_CLIENT_ID" ]; then
    read -p "Skriv inn SPOTIFY_CLIENT_ID: " SPOTIFY_CLIENT_ID
fi

if [ -z "$SPOTIFY_CLIENT_SECRET" ]; then
    read -p "Skriv inn SPOTIFY_CLIENT_SECRET: " SPOTIFY_CLIENT_SECRET
fi

if [ -z "$1" ]; then
    echo ""
    echo "Bruk: $0 <AUTHORIZATION_CODE>"
    echo ""
    echo "For å få AUTHORIZATION_CODE:"
    echo "1. Åpne currently-playing/get-auth-code.html i nettleseren"
    echo "2. Klikk på 'Start Spotify Autorisasjon'"
    echo "3. Logg inn og godta tilgang"
    echo "4. Kopier authorization code som vises"
    echo "5. Kjør dette scriptet med koden som argument"
    echo ""
    exit 1
fi

AUTHORIZATION_CODE=$1

# Spør etter redirect URI hvis den ikke er satt
if [ -z "$REDIRECT_URI" ]; then
    echo ""
    echo "Hvilken Redirect URI brukte du i Spotify Dashboard?"
    echo "(Dette skal være den samme URL-en som HTML-filen din har)"
    read -p "Redirect URI (standard: file:// path til get-auth-code.html): " REDIRECT_URI
fi

# Bruk file:// hvis ikke spesifisert
if [ -z "$REDIRECT_URI" ]; then
    # Prøv å finne full path til HTML-filen
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
    HTML_FILE="$SCRIPT_DIR/get-auth-code.html"
    if [ -f "$HTML_FILE" ]; then
        REDIRECT_URI="file://$HTML_FILE"
        echo "Bruker Redirect URI: $REDIRECT_URI"
    else
        REDIRECT_URI="http://localhost:8080/callback"
        echo "Bruker standard Redirect URI: $REDIRECT_URI"
    fi
fi

echo "Henter refresh token..."
echo ""

RESPONSE=$(curl -s -X POST "https://accounts.spotify.com/api/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code&code=${AUTHORIZATION_CODE}&redirect_uri=${REDIRECT_URI}" \
  --user "${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}")

# Sjekk om vi fikk en feil
if echo "$RESPONSE" | grep -q "error"; then
    echo "❌ Feil ved henting av token:"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
    exit 1
fi

# Parse refresh_token fra responsen
REFRESH_TOKEN=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('refresh_token', ''))" 2>/dev/null)

if [ -z "$REFRESH_TOKEN" ]; then
    echo "❌ Kunne ikke hente refresh_token fra responsen."
    echo "Full respons:"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
    exit 1
fi

echo "✅ Success!"
echo ""
echo "Refresh Token:"
echo "$REFRESH_TOKEN"
echo ""
echo "Legg denne til i .env.local som:"
echo "SPOTIFY_REFRESH_TOKEN=$REFRESH_TOKEN"
echo ""

