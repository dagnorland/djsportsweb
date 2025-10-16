import type { Metadata } from "next";
import { NextAuthProvider } from "../providers/NextAuthProvider";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import GlobalNowPlayingBar from "@/components/GlobalNowPlayingBar";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

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
        <html lang="no">
            <head>
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#1db954" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <meta name="apple-mobile-web-app-title" content="djSports" />
                <link rel="apple-touch-icon" href="/icon-192x192.png" />
            </head>
            <body className={`dark ${inter.className}`}>
                <NextAuthProvider>
                    <Navigation />
                    <main className="pb-24">
                        {children}
                    </main>
                    <GlobalNowPlayingBar />
                    <Script 
                        src="https://sdk.scdn.co/spotify-player.js" 
                        strategy="afterInteractive"
                    />
                </NextAuthProvider>
            </body>
        </html>
    );
}