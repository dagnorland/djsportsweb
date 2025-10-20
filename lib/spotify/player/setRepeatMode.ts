"use server";

/**
 * Sets the repeat mode for the Spotify player.
 *
 * @param {string} token - The access token for the Spotify API.
 * @param {"track" | "context" | "off"} state - The repeat mode state. Possible values are "track", "context", or "off".
 * @param {string} [deviceId] - (optional) The ID of the device to set the repeat mode on. Default is user's currently active device.
 *
 * @returns {Promise<void>} A promise that resolves with void.
 *
 * @see https://developer.spotify.com/documentation/web-api/reference/set-repeat-mode-on-users-playback
 */
export default async function setRepeatMode(
  token: string,
  state: "track" | "context" | "off",
  deviceId?: string
): Promise<void> {
  try {
    const res: Response = await fetch(
      `https://api.spotify.com/v1/me/player/repeat?state=${state}${
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

    // Spotify API returns 204 No Content for successful repeat mode change, no JSON to parse
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
