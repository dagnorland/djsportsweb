// app/layout.tsx
/* eslint-disable @next/next/no-sync-scripts */
import type { Metadata } from "next";
import { NextAuthProvider } from "../providers/NextAuthProvider";
import { Inter } from "next/font/google";
import "./globals.css";
import { NextFont } from "next/dist/compiled/@next/font";
import { Navigation } from "@/components/Navigation";
import GlobalNowPlayingBar from "@/components/GlobalNowPlayingBar";

const inter: NextFont = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "djSports",
    description: "Listen to Spotify and manage playlists from your own app !",
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>): Promise<JSX.Element> {

    return (
        <NextAuthProvider>
            <html lang="no">
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#1db954" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <meta name="apple-mobile-web-app-title" content="djSports" />
                <link rel="apple-touch-icon" href="/icon-192x192.png" />
                <body className={`dark ${inter.className}`}>
                    <Navigation />
                    <main className="pb-24">
                        {children}
                    </main>
                    <GlobalNowPlayingBar />
                    <script src="https://sdk.scdn.co/spotify-player.js"></script>
                </body>
            </html>
        </NextAuthProvider >
    );
}