import { JWT } from "next-auth/jwt";

declare module "next-auth/jwt" {
  interface JWT {
    access_token: string;
    refresh_token: string;
    accessTokenExpires: number;
    error?: string;
  }
}

declare module "next-auth" {
  interface Session {
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
  }
}
