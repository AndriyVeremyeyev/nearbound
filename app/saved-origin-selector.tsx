"use client";

import { useState } from "react";

import type { ResolvedOrigin } from "@/lib/trips/mapbox-search";
import type { SavedOrigin } from "@/lib/trips/repository";

type ResolveResponse = { origin?: ResolvedOrigin; error?: string };

export function SavedOriginSelector({
  origins,
  onSelect,
}: {
  origins: readonly SavedOrigin[];
  onSelect: (origin: ResolvedOrigin) => void;
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (origins.length === 0) return null;

  async function selectOrigin(originId: string) {
    setLoadingId(originId);
    setError(null);
    try {
      const response = await fetch(`/api/saved-origins/${originId}/resolve`, { method: "POST" });
      const payload = await response.json() as ResolveResponse;
      if (!response.ok || !payload.origin) throw new Error(payload.error ?? "Saved starting point could not be confirmed.");
      onSelect(payload.origin);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Saved starting point could not be confirmed.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="saved-origin-selector">
      <div aria-label="Saved starting points">
        {origins.map((origin) => (
          <button key={origin.id} type="button" disabled={loadingId !== null} onClick={() => void selectOrigin(origin.id)}>
            {loadingId === origin.id ? "Confirming…" : origin.label}
          </button>
        ))}
      </div>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
