import NextAuth from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";

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
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', token.refresh_token);
    const url = "https://accounts.spotify.com/api/token";
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + Buffer.from(process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET).toString('base64'),
        },
        body: params,
    });
    const data = await response.json();
    return {
        access_token: data.access_token,
        refresh_token: data.refresh_token ?? token.refresh_token,
        accessTokenExpires: Date.now() + data.expires_in * 1000,
    };
}

export const authOptions ={
    providers: [
        SpotifyProvider({
            clientId: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
            authorization: LOGIN_URL,
        }),
    ],
    secret: process.env.JWT_SECRET,
    //pages: {
        //signIn: '/login',
    //},
    callbacks: {
        async jwt({ token, account }) {
            if (account) {
                token.access_token = account.access_token;
                token.refresh_token = account.refresh_token;
                token.accessTokenExpires = account.expires_in;
                return token;
            }
            if (Date.now() < token.accessTokenExpires * 1000) {
                return token;
            }
            return refreshAccessToken(token);
        },
        async session({ session, token, user }) {
            session.accessToken = token.access_token;
            return session;
        }
    }
};

export default NextAuth(authOptions);