"use server";

/**
 * Toggles the playback shuffle state for the current user's Spotify player.
 *
 * @param {string} token - The access token for the Spotify API.
 * @param {boolean} state - The desired shuffle state (true for on, false for off).
 * @param {string} [device_id] - (optional) The device ID to target the shuffle state change. Default is user's currently active device.
 *
 * @returns {Promise<void>} A promise that resolves when the shuffle state is toggled.
 *
 * @see https://developer.spotify.com/documentation/web-api/reference/toggle-shuffle-for-users-playback
 */
export default async function togglePlaybackShuffle(
  token: string,
  state: boolean,
  device_id?: string
): Promise<void> {
  try {
    const res: Response = await fetch(
      `https://api.spotify.com/v1/me/player/shuffle?state=${state}${
        device_id ? `&device_id=${device_id}` : ""
      }`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch data");
    }

    // Spotify API returns 204 No Content for successful shuffle toggle, no JSON to parse
    if (res.status === 204) {
      return;
    }

    // Only try to parse JSON if there's content
    const text = await res.text();
    if (!text.trim()) {
      return;
    }

    return JSON.parse(text);
  } catch (error) {
    console.error(error);
    throw error;
  }
}
