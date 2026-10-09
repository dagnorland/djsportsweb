"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { TrackEditor } from "@/components/playlist/TrackEditor";

export default function TrackEditPage() {
  const p = useParams<{ id: string; index: string }>();
  const id = p?.id ?? "";
  const index = Number(p?.index ?? 0);
  return (
    <Suspense>
      <TrackEditor key={`${id}-${index}`} playlistId={id} index={index} />
    </Suspense>
  );
}
