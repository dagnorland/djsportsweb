"use server";

import { CurrentlyPlayingContext } from "@/lib/types";

/**
 * Retrieves the playback state from the Spotify API.
 *
 * @param {string} token - The access token for authentication.
 * @param {string} [market] - (optional) The market (country) for which to retrieve the tracks.
 *
 * @returns {Promise<CurrentlyPlayingContext>} - The currently playing context.
 *
 * @see https://developer.spotify.com/documentation/web-api/reference/get-information-about-the-users-current-playback
 */
export default async function getPlaybackState(
  token: string,
  market?: string
): Promise<CurrentlyPlayingContext> {
  try {
    const res: Response = await fetch(
      `https://api.spotify.com/v1/me/player${
        market ? `?market=${market}` : ""
      }`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch data");
    }

    const data: CurrentlyPlayingContext = await res.json();
    return data;
  } catch (error) {
    console.error("An error occurred while fetching data:", error);
    throw error;
  }
}
