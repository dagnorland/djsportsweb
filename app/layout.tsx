import type { Metadata } from "next";
import { NextAuthProvider } from "../providers/NextAuthProvider";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import GlobalNowPlayingBar from "@/components/GlobalNowPlayingBar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "djSports",
    description: "Listen to Spotify and manage playlists from your own app !",
    icons: {
        icon: [
            { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
            { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
            { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' }
        ],
        shortcut: '/favicon-32x32.png',
        apple: '/apple-touch-icon.png',
    },
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
                <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
                <link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png" />
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                try {
                                    var theme = localStorage.getItem('theme') || 'dark';
                                    document.documentElement.classList.add(theme);
                                } catch (e) {}
                            })();
                        `,
                    }}
                />
            </head>
            <body className={inter.className}>
                <ErrorBoundary>
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
                </ErrorBoundary>
            </body>
        </html>
    );
}