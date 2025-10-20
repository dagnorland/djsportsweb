"use server";

/**
 * Seeks the playback position of the Spotify player to the specified position in milliseconds.
 *
 * @param {string} token - The Spotify access token.
 * @param {number} position_ms - The position in milliseconds to seek to.
 * @param {string} [deviceId] - (optional) The ID of the device on which to seek the playback position. Default is user's currently active device.
 *
 * @returns {Promise<void>} A promise that resolves when the seek operation is completed.
 *
 * @see https://developer.spotify.com/documentation/web-api/reference/seek-to-position-in-currently-playing-track
 */
export default async function seekToPosition(
  token: string,
  position_ms: number,
  deviceId?: string
): Promise<void> {
  try {
    const res: Response = await fetch(
      `https://api.spotify.com/v1/me/player/seek?position_ms=${position_ms}${
        deviceId ? `&device_id=${deviceId}` : ""
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

    // Spotify API returns 204 No Content for successful seek, no JSON to parse
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
