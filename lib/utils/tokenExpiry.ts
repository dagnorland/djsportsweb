/**
 * Check if an error is due to an expired access token
 */
export function isTokenExpiredError(error: any): boolean {
  return error?.status === 401 || error?.message?.includes("access token expired");
}
