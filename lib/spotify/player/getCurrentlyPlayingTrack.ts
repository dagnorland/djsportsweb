"use server";

import { CurrentlyPlaying } from "@/lib/types";

/**
 * Retrieves the currently playing track from the Spotify API.
 *
 * @param {string} token - The access token for authentication.
 *
 * @returns {Promise<CurrentlyPlaying | null>} A promise that resolves to the currently playing track, or null if no track is playing.
 *
 * @see https://developer.spotify.com/documentation/web-api/reference/get-the-users-currently-playing-track
 */
export default async function getCurrentlyPlayingTrack(
  token: string
): Promise<CurrentlyPlaying | null> {
  try {
    const res: Response = await fetch(
      "https://api.spotify.com/v1/me/player/currently-playing",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Handle 204 No Content (no music playing)
    if (res.status === 204) {
      return null;
    }

    // Handle 401 Unauthorized (token expired or invalid)
    if (res.status === 401) {
      console.warn("Spotify token expired or invalid");
      return null;
    }

    if (!res.ok) {
      console.error(`Failed to fetch currently playing track: ${res.status} ${res.statusText}`);
      return null;
    }

    // Check if response has content before parsing JSON
    const text = await res.text();
    if (!text.trim()) {
      return null;
    }

    const data: CurrentlyPlaying = JSON.parse(text);
    return data;
  } catch (error) {
    console.error("An error occurred while fetching data:", error);
    return null; // Return null instead of throwing
  }
}
