"use client";

/** Login / landing page. Logged-in users are redirected to /home (proxy.ts). */
import { useEffect, useState } from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { CheckCircle2, Loader2 } from "lucide-react";
import packageJson from "@/package.json";

export default function Page() {
  const { data: session, status } = useSession();
  const [cleaned, setCleaned] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("cleaned") === "true") {
      setCleaned(true);
      params.delete("cleaned");
      window.history.replaceState({}, "", window.location.pathname + (params.toString() ? `?${params}` : ""));
    }
  }, []);

  useEffect(() => {
    if (session) window.location.replace("/home");
  }, [session]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-stage-bg p-4 text-stage-text">
      <div className="w-full max-w-sm rounded-2xl bg-stage-surface p-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon-192x192.png" alt="djSports" className="mx-auto h-20 w-20 rounded-full" />
        <h1 className="mt-3 text-2xl font-bold">djSports</h1>
        <p className="text-xs text-stage-muted">v{packageJson.version}</p>

        {status === "loading" || session ? (
          <Loader2 className="mx-auto mt-6 h-6 w-6 animate-spin" />
        ) : (
          <>
            {cleaned && (
              <p className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-green-500/10 p-2 text-sm text-green-500">
                <CheckCircle2 className="h-4 w-4" /> Logged out
              </p>
            )}
            <p className="mt-4 text-sm text-stage-muted">
              Log in with Spotify (Premium) to play. Your Spotify e-mail must be registered first — send it to
              djsportsweb@gmail.com or dag.norland@gmail.com.
            </p>
            <button
              onClick={() => signIn("spotify", { callbackUrl: "/home" })}
              className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-full bg-[#1DB954] font-semibold text-black"
            >
              Login with Spotify
            </button>
            <Link href="/home" className="mt-3 block text-sm text-stage-muted hover:text-stage-text">
              Continue without Spotify (playlists, cloud backup)
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
