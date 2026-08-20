"use client";

import { useEffect, useRef, useState } from "react";

import type { OriginSuggestion, ResolvedOrigin } from "@/lib/trips/mapbox-search";

type OriginAutocompleteProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (origin: ResolvedOrigin) => void;
  fieldClassName?: string;
  showGuidance?: boolean;
};

type SuggestionResponse = { suggestions?: OriginSuggestion[]; error?: string };
type RetrieveResponse = { origin?: ResolvedOrigin; error?: string };

function createSessionToken() {
  return crypto.randomUUID();
}

export function OriginAutocomplete({
  id,
  value,
  onChange,
  onSelect,
  fieldClassName,
  showGuidance = true,
}: OriginAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<OriginSuggestion[]>([]);
  const [searchStatus, setSearchStatus] = useState<"idle" | "loading" | "error">("idle");
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [sessionToken, setSessionToken] = useState(createSessionToken);
  const requestNumber = useRef(0);

  useEffect(() => {
    const query = value.trim();
    if (!searchEnabled || query.length < 3) return;

    const currentRequest = ++requestNumber.current;
    const controller = new AbortController();

    const timeout = window.setTimeout(async () => {
      try {
        const searchParams = new URLSearchParams({
          q: query,
          sessionToken,
        });
        const response = await fetch(`/api/origin-suggestions?${searchParams}`, {
          signal: controller.signal,
        });
        const payload = (await response.json()) as SuggestionResponse;

        if (!response.ok) throw new Error(payload.error ?? "Suggestions are unavailable.");
        if (currentRequest !== requestNumber.current) return;

        setSuggestions(payload.suggestions ?? []);
        setSearchStatus("idle");
      } catch (error) {
        if (controller.signal.aborted || currentRequest !== requestNumber.current) return;

        setSuggestions([]);
        setSearchStatus("error");
        setSelectionError(
          error instanceof Error ? error.message : "Suggestions are unavailable.",
        );
      }
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [searchEnabled, sessionToken, value]);

  async function chooseSuggestion(suggestion: OriginSuggestion) {
    setSearchStatus("loading");
    setSelectionError(null);

    try {
      const response = await fetch("/api/origin-suggestions/retrieve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          suggestionId: suggestion.id,
          sessionToken,
        }),
      });
      const payload = (await response.json()) as RetrieveResponse;
      if (!response.ok || !payload.origin) {
        throw new Error(payload.error ?? "That starting point could not be confirmed.");
      }

      onChange(payload.origin.label);
      onSelect(payload.origin);
      setSuggestions([]);
      setSearchStatus("idle");
      setSearchEnabled(false);
      setSessionToken(createSessionToken());
    } catch (error) {
      setSearchStatus("error");
      setSelectionError(
        error instanceof Error ? error.message : "That starting point could not be confirmed.",
      );
    }
  }

  const statusMessage =
    searchStatus === "loading"
      ? "Finding places…"
      : selectionError
        ? selectionError
        : showGuidance && searchEnabled && value.trim().length >= 3
          ? "Choose a suggestion to confirm your starting point."
          : null;

  return (
    <div className="origin-autocomplete">
      <div className={`address-field ${fieldClassName ?? ""}`}>
        <span className="pin-mini" aria-hidden="true" />
        <input
          id={id}
          value={value}
          onChange={(event) => {
            setSearchEnabled(true);
            setSuggestions([]);
            setSearchStatus(event.target.value.trim().length >= 3 ? "loading" : "idle");
            setSelectionError(null);
            onChange(event.target.value);
          }}
          placeholder="City or street address"
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-controls={`${id}-suggestions`}
          aria-expanded={suggestions.length > 0}
        />
      </div>
      {suggestions.length > 0 && (
        <ul className="origin-suggestions" id={`${id}-suggestions`} role="listbox" aria-label="Starting point suggestions">
          {suggestions.map((suggestion) => (
            <li key={suggestion.id}>
              <button type="button" role="option" aria-selected={false} onClick={() => chooseSuggestion(suggestion)}>
                <strong>{suggestion.label}</strong>
                <span>{suggestion.context}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {statusMessage && <p className="origin-search-status" aria-live="polite">{statusMessage}</p>}
    </div>
  );
}
