import { getToken, JWT } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(
  req: NextRequest
): Promise<NextResponse<unknown>> {
  const token: JWT | null = await getToken({
    req,
    secret: process.env.JWT_SECRET,
  });
  const { pathname } = req.nextUrl;

  // Redirect authenticated users from home to playlists
  if (token && pathname === "/") {
    return NextResponse.redirect(new URL("/playlists", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Only run middleware on home page for redirect
    "/",
  ],
};
