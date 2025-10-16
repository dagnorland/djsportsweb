/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        // This is all the known domains Spotify host its images on. You need to provide them all to avoid CORS issues from Next.js and the Spotify API.
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'i.scdn.co',
            },
            {
                protocol: 'https',
                hostname: 'thisis-images.spotifycdn.com',
            },
            {
                protocol: 'https',
                hostname: 'wrapped-images.spotifycdn.com',
            },
            {
                protocol: 'https',
                hostname: 'mosaic.scdn.co',
            },
            {
                protocol: 'https',
                hostname: 'blend-playlist-covers.spotifycdn.com',
            },
            {
                protocol: 'https',
                hostname: 'newjams-images.scdn.co',
            },
            {
                protocol: 'https',
                hostname: 'pl.scdn.co',
            },
            {
                protocol: 'https',
                hostname: 'charts-images.scdn.co',
            },
            {
                protocol: 'https',
                hostname: 'daily-mix.scdn.co',
            },
            {
                protocol: 'https',
                hostname: 'seeded-session-images.scdn.co',
            },
            {
                protocol: 'https',
                hostname: 'image-cdn-fa.spotifycdn.com',
            },
            {
                protocol: 'https',
                hostname: 'image-cdn-ak.spotifycdn.com',
            },
            {
                protocol: 'https',
                hostname: 'lineup-images.scdn.co',
            },
            {
                protocol: 'https',
                hostname: 'i2o.scdn.co',
            },
            {
                protocol: 'https',
                hostname: 't.scdn.co',
            },
        ],
    },
};

export default nextConfig;
