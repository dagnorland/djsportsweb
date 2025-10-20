"use server";

/**
 * Sets the playback volume for the Spotify player.
 *
 * @param {string} token - The access token for the Spotify API.
 * @param {number} volume_percent - The desired volume percentage (0-100).
 * @param {string} [deviceId] - (optional) The device ID to set the volume for. Default is user's currently active device.
 *
 * @returns {Promise<void>} A promise that resolves when the volume is set successfully.
 *
 * @see https://developer.spotify.com/documentation/web-api/reference/set-volume-for-users-playback
 */
export default async function setPlaybackVolume(
  token: string,
  volume_percent: number,
  deviceId?: string
): Promise<void> {
  try {
    const res: Response = await fetch(
      `https://api.spotify.com/v1/me/player/volume?volume_percent=${volume_percent}${
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

    // Spotify API returns 204 No Content for successful volume change, no JSON to parse
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
