"use client";

import { useState } from "react";

import type { VisitedPlace } from "@/lib/trips/repository";

export function VisitedPlaces({ initialPlaces }: { initialPlaces: VisitedPlace[] }) {
  const [places, setPlaces] = useState(initialPlaces);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editingDestinationIds, setEditingDestinationIds] = useState(
    () => new Set(initialPlaces.filter((place) => place.rating === null && !place.note).map((place) => place.destinationId)),
  );

  function setEditing(destinationId: string, isEditing: boolean) {
    setEditingDestinationIds((current) => {
      const next = new Set(current);
      if (isEditing) next.add(destinationId);
      else next.delete(destinationId);
      return next;
    });
  }

  async function save(place: VisitedPlace, form: HTMLFormElement) {
    setSavingId(place.destinationId);
    const formData = new FormData(form);
    try {
      const response = await fetch(`/api/visited-destinations/${place.destinationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: formData.get("rating") ? Number(formData.get("rating")) : null,
          note: String(formData.get("note") ?? ""),
        }),
      });
      if (response.ok) {
        const updated = await response.json() as { rating?: number | null; note?: string | null };
        setPlaces((items) => items.map((item) => item.destinationId === place.destinationId ? { ...item, rating: updated.rating ?? null, note: updated.note ?? null } : item));
        setEditing(place.destinationId, false);
      }
    } finally {
      setSavingId(null);
    }
  }

  async function remove(destinationId: string) {
    setSavingId(destinationId);
    try {
      const response = await fetch(`/api/visited-destinations/${destinationId}`, { method: "DELETE" });
      if (response.ok) setPlaces((items) => items.filter((item) => item.destinationId !== destinationId));
    } finally {
      setSavingId(null);
    }
  }

  if (places.length === 0) return <p className="visited-empty">No visited places yet. Mark a shortlist card after a trip, then return here to remember what worked.</p>;

  return (
    <div className="visited-list">
      {places.map((place) => (
        <article className="visited-place" id={`visited-${place.destinationId}`} key={place.destinationId}>
          <div><p className="eyebrow">{place.region}</p><h2>{place.name}</h2><p>{place.summary}</p></div>
          {editingDestinationIds.has(place.destinationId) ? (
            <form onSubmit={(event) => { event.preventDefault(); void save(place, event.currentTarget); }}>
              <fieldset><legend>Your rating</legend><div className="rating-options">
                {[1, 2, 3, 4, 5].map((rating) => <label key={rating}><input type="radio" name="rating" value={rating} defaultChecked={place.rating === rating} />{rating}</label>)}
              </div></fieldset>
              <label className="visited-note">A short note<textarea name="note" defaultValue={place.note ?? ""} maxLength={1000} placeholder="What worked, what you would change…" /></label>
              <div className="visited-actions"><button type="submit" disabled={savingId === place.destinationId}>{savingId === place.destinationId ? "Saving…" : "Save reflection"}</button>{(place.rating !== null || place.note) && <button className="secondary-action" type="button" onClick={() => setEditing(place.destinationId, false)} disabled={savingId === place.destinationId}>Cancel</button>}<button className="secondary-action" type="button" onClick={() => void remove(place.destinationId)} disabled={savingId === place.destinationId}>Remove from visited</button></div>
            </form>
          ) : (
            <div className="visited-reflection">
              <p className="eyebrow">Your reflection</p>
              <strong>{place.rating ? `${place.rating} / 5` : "No rating"}</strong>
              {place.note && <p>{place.note}</p>}
              <div className="visited-actions"><button type="button" onClick={() => setEditing(place.destinationId, true)}>Edit reflection</button><button className="secondary-action" type="button" onClick={() => void remove(place.destinationId)}>Remove from visited</button></div>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
