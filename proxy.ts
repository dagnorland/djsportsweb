import { getToken, JWT } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(
  req: NextRequest
): Promise<NextResponse<unknown>> {
  const { pathname } = req.nextUrl;

  // Never interfere with auth routes - let them handle cookies properly
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Behold tidligere oppførsel: vi gjør bare session-sjekk på "/" for redirect.
  if (pathname === "/") {
    const token: JWT | null = await getToken({
      req,
      secret: process.env.JWT_SECRET,
    });

    // Redirect authenticated users from home to playlists
    if (token) {
      return NextResponse.redirect(new URL("/playlists", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Only run proxy on home page for redirect
    // Auth routes are automatically excluded since they're not in the matcher
    "/",
  ],
};

