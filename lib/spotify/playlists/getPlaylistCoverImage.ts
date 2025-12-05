"use server";

import { Image } from "@/lib/types";

/**
 * Retrieves the cover image URL for a given playlist.
 *
 * @param {string} token - The access token for the Spotify API.
 * @param {string} playlistId - The ID of the playlist.
 *
 * @returns {Promise<string>} - The URL of the playlist cover image.
 *
 * @see https://developer.spotify.com/documentation/web-api/reference/get-playlist-cover
 */
export default async function getPlaylistCoverImage(
  token: string,
  playlistId: string
): Promise<Image> {
  try {
    const res: Response = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/images`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch data");
    }

    const data: Image = await res.json();
    return data;
  } catch (error) {
    console.error("An error occurred while fetching data:", error);
    throw error;
  }
}
