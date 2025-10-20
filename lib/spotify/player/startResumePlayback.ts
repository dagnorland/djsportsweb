"use server";

/**
 * Starts or resumes playback on the Spotify player.
 *
 * @param {string} token - The access token for the user's Spotify account.
 * @param {string} [device_id] - (optional) The ID of the device on which to start or resume playback. Default is user's currently active device.
 * @param {object} [options] - (optional) Playback options including context_uri, uris, offset, and position_ms.
 *
 * @returns {Promise<void>} A promise that resolves when the playback is started or resumed successfully.
 *
 * @see https://developer.spotify.com/documentation/web-api/reference/start-a-users-playback
 */
export default async function startResumePlayback(
  token: string,
  device_id?: string,
  options?: {
    context_uri?: string;
    uris?: string[];
    offset?: { position?: number; uri?: string };
    position_ms?: number;
  }
): Promise<void> {
  try {
    const res: Response = await fetch(
      `https://api.spotify.com/v1/me/player/play${
        device_id ? `?device_id=${device_id}` : ""
      }`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: options ? JSON.stringify(options) : undefined,
      }
    );

    if (!res.ok) {
      // Get more detailed error information
      let errorMessage = "Failed to fetch data";
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

    // Response is 204 No Content on success
    if (res.status === 204) {
      return;
    }

    return await res.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}
