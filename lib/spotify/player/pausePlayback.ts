"use server";

/**
 * Pauses the playback on Spotify.
 *
 * @param {string} token - The access token for the Spotify API.
 * @param {string} [deviceId] - (optional) The ID of the device on which to pause the playback. Default is user's currently active device.
 *
 * @returns {Promise<void>} A promise that resolves when the playback is paused.
 *
 * @see https://developer.spotify.com/documentation/web-api/reference/pause-a-users-playback
 */
export default async function pausePlayback(
  token: string,
  deviceId?: string
): Promise<void> {
  try {
    const res: Response = await fetch(
      `https://api.spotify.com/v1/me/player/pause${
        deviceId ? `?device_id=${deviceId}` : ""
      }`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      // Get more detailed error information
      let errorMessage = "Failed to pause playback";
      try {
        const errorData = await res.json();
        if (errorData.error) {
          errorMessage = errorData.error.message || errorMessage;
        }
      } catch (e) {
        // If we can't parse the error, use the status text
        errorMessage = `${res.status} ${res.statusText}`;
      }
      throw new Error(errorMessage);
    }

    // Spotify API returns 204 No Content for successful pause, no JSON to parse
    if (res.status === 204) {
      return;
    }

    // Only try to parse JSON if there's content
    const text = await res.text();
    if (!text.trim()) {
      return;
    }

    // Try to parse JSON, but handle parsing errors gracefully
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.warn("Response is not valid JSON:", text.substring(0, 100));
      return;
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}
