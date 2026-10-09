"use client";

import { useParams } from "next/navigation";
import { PlaylistEditor } from "@/components/playlist/PlaylistEditor";

/** /playlist/new = create, /playlist/<id> = edit. */
export default function PlaylistEditPage() {
  const id = useParams<{ id: string }>()?.id ?? "new";
  return <PlaylistEditor key={id} playlistId={id === "new" ? null : id} />;
}
