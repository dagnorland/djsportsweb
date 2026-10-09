"use client";

// Placeholder — the playlist editor arrives in step 4b.
import Link from "next/link";
import { useParams } from "next/navigation";

export default function PlaylistEditPage() {
  const id = useParams<{ id: string }>()?.id;
  return (
    <div className="min-h-screen bg-stage-bg p-6 text-stage-text">
      <Link href="/home" className="text-stage-muted hover:text-stage-text">← Home</Link>
      <p className="mt-4">Playlist editor ({id}) — coming in step 4b.</p>
    </div>
  );
}
