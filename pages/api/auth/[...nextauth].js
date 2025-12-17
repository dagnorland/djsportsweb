import NextAuth from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";
import { env } from "@/lib/config/env";

const scopes = [
    "streaming",
    "app-remote-control",
    "user-read-email",
    "user-read-private",
    "playlist-read-private",
    "playlist-read-collaborative",
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-currently-playing",
].join(',');

const params = {
    scope: scopes,
}

const LOGIN_URL = "https://accounts.spotify.com/authorize?" + new URLSearchParams(params).toString();

async function refreshAccessToken(token) {
    try {
        const params = new URLSearchParams();
        params.append('grant_type', 'refresh_token');
        params.append('refresh_token', token.refresh_token);
        const url = "https://accounts.spotify.com/api/token";
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(env.SPOTIFY_CLIENT_ID + ":" + env.SPOTIFY_CLIENT_SECRET).toString('base64'),
            },
            body: params,
        });
        
        if (!response.ok) {
            throw new Error('Token refresh failed');
        }
        
        const data = await response.json();
        return {
            access_token: data.access_token,
            refresh_token: data.refresh_token ?? token.refresh_token,
            accessTokenExpires: Date.now() + data.expires_in * 1000,
        };
    } catch (error) {
        console.error('Error refreshing access token:', error);
        return {
            ...token,
            error: "RefreshAccessTokenError",
        };
    }
}


export const authOptions ={
    providers: [
        SpotifyProvider({
            clientId: env.SPOTIFY_CLIENT_ID,
            clientSecret: env.SPOTIFY_CLIENT_SECRET,
            authorization: LOGIN_URL,
        }),
    ],
    secret: env.JWT_SECRET,
    trustHost: true, // Required for Next.js 16+ to handle cookies correctly
    //pages: {
        //signIn: '/login',
    //},
    cookies: {
        sessionToken: {
            name: `next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
            },
        },
        callbackUrl: {
            name: `next-auth.callback-url`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
            },
        },
        csrfToken: {
            name: `next-auth.csrf-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
            },
        },
        pkceCodeVerifier: {
            name: `next-auth.pkce.code_verifier`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 15, // 15 minutter
            },
        },
        state: {
            name: `next-auth.state`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 15, // 15 minutter
            },
        },
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 dager i sekunder
    },
    jwt: {
        maxAge: 30 * 24 * 60 * 60, // 30 dager i sekunder
    },
    callbacks: {
        async jwt({ token, account }) {
            if (account) {
                token.access_token = account.access_token;
                token.refresh_token = account.refresh_token;
                token.accessTokenExpires = Date.now() + account.expires_in * 1000;
                return token;
            }
            
            // Return token hvis den ikke er utløpt
            if (Date.now() < token.accessTokenExpires) {
                return token;
            }
            
            // Prøv å refreshe token
            return await refreshAccessToken(token);
        },
        async session({ session, token }) {
            // Send properties to the client
            session.accessToken = token.access_token;
            session.refreshToken = token.refresh_token;
            session.accessTokenExpires = token.accessTokenExpires;
            return session;
        }
    }
};

export default async function auth(req, res) {
    /**
     * Dev-fiks: hvis man åpner appen på `127.0.0.1` men NEXTAUTH_URL (eller Spotify redirect URI)
     * peker til `localhost` (eller omvendt), kan NextAuth feile med:
     * "OAuthCallbackError: State cookie was missing."
     *
     * For å gjøre dette robust lokalt, setter vi NEXTAUTH_URL dynamisk per request basert på Host.
     * (I produksjon bør NEXTAUTH_URL være statisk og riktig satt i miljøvariabler.)
     */
    const forwardedProto = req.headers["x-forwarded-proto"];
    const proto = (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto || (process.env.NODE_ENV === "development" ? "http" : "https"))
        .toString()
        .split(",")[0]
        .trim();
    const forwardedHost = req.headers["x-forwarded-host"];
    const host = (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost || req.headers.host || "")
        .toString()
        .split(",")[0]
        .trim();

    // Lokalt: tillat localhost/127.0.0.1
    if (process.env.NODE_ENV === "development" && host && (host.startsWith("localhost") || host.startsWith("127.0.0.1"))) {
        // Spotify krever eksakt match på redirect_uri. Hvis du ikke ønsker/kan bruke `localhost`
        // som redirect URI i Spotify Dashboard, kanoniserer vi `localhost` -> `127.0.0.1` lokalt.
        const canonicalHost = host.startsWith("localhost")
            ? host.replace(/^localhost(?=[:$])/, "127.0.0.1")
            : host;
        process.env.NEXTAUTH_URL = `${proto}://${canonicalHost}`;
    }

    // Vercel (prod/preview): bruk request-host for å unngå mismatch mellom deploy-url og NEXTAUTH_URL.
    // Dette er spesielt nyttig hvis NEXTAUTH_URL er satt feil, eller hvis du bruker preview deploys.
    if (host && process.env.VERCEL_URL) {
        const isVercelHost = host === process.env.VERCEL_URL || host.endsWith(".vercel.app");
        if (isVercelHost) {
            process.env.NEXTAUTH_URL = `https://${host}`;
        }
    }

    return await NextAuth(req, res, authOptions);
}