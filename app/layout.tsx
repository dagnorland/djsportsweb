/* eslint-disable @next/next/no-sync-scripts */
import type { Metadata } from "next";
import { NextAuthProvider } from "../providers/NextAuthProvider";
import { Inter } from "next/font/google";
import "./globals.css";
import { NextFont } from "next/dist/compiled/@next/font";

const inter: NextFont = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "NextJS Spotify API",
    description: "Listen to Spotify and manage playlists from your own app !",
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>): Promise<JSX.Element> {

    return (
        <NextAuthProvider>
            <html lang="en">
                <body className={`dark ${inter.className}`}>
                    { children }
                    <script src="https://sdk.scdn.co/spotify-player.js"></script>
                </body>
            </html>
        </NextAuthProvider >
    );
}
