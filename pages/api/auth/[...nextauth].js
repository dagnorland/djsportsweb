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
    //pages: {
        //signIn: '/login',
    //},
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

export default NextAuth(authOptions);