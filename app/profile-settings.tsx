"use client";

import { FormEvent, useState } from "react";

import type { SavedOrigin, UserProfile } from "@/lib/trips/repository";

type ProfileResponse = { firstName?: string; lastName?: string; error?: string };
type SavedOriginResponse = SavedOrigin & { error?: string };

const regionsByCountry = {
  US: [
    ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"], ["CA", "California"], ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"], ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"], ["MD", "Maryland"], ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"], ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"], ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"], ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"], ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"], ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"], ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],
  ],
  CA: [
    ["AB", "Alberta"], ["BC", "British Columbia"], ["MB", "Manitoba"], ["NB", "New Brunswick"], ["NL", "Newfoundland and Labrador"], ["NS", "Nova Scotia"], ["NT", "Northwest Territories"], ["NU", "Nunavut"], ["ON", "Ontario"], ["PE", "Prince Edward Island"], ["QC", "Quebec"], ["SK", "Saskatchewan"], ["YT", "Yukon"],
  ],
} as const;

export function ProfileSettings({
  profile,
  savedOrigins: initialSavedOrigins,
  fallbackName,
  email,
}: {
  profile: UserProfile;
  savedOrigins: readonly SavedOrigin[];
  fallbackName: string;
  email: string;
}) {
  const fallbackParts = fallbackName.trim().split(/\s+/);
  const [savedOrigins, setSavedOrigins] = useState(initialSavedOrigins);
  const [profileStatus, setProfileStatus] = useState<"idle" | "saving">("idle");
  const [originStatus, setOriginStatus] = useState<"idle" | "saving">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState<keyof typeof regionsByCountry>("US");

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileStatus("saving");
    setMessage(null);
    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: formData.get("firstName"), lastName: formData.get("lastName") }),
      });
      const payload = await response.json() as ProfileResponse;
      if (!response.ok) throw new Error(payload.error ?? "Profile could not be saved.");
      setMessage("Profile saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Profile could not be saved.");
    } finally {
      setProfileStatus("idle");
    }
  }

  async function addOrigin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOriginStatus("saving");
    setMessage(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      const response = await fetch("/api/saved-origins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: formData.get("label"),
          streetAddress: formData.get("streetAddress"),
          city: formData.get("city"),
          regionCode: formData.get("regionCode"),
          postalCode: formData.get("postalCode"),
          countryCode: formData.get("countryCode"),
        }),
      });
      const payload = await response.json() as SavedOriginResponse;
      if (!response.ok || !payload.id) throw new Error(payload.error ?? "Starting point could not be saved.");
      setSavedOrigins((origins) => [...origins, payload]);
      form.reset();
      setMessage("Starting point saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Starting point could not be saved.");
    } finally {
      setOriginStatus("idle");
    }
  }

  async function removeOrigin(originId: string) {
    setOriginStatus("saving");
    setMessage(null);
    try {
      const response = await fetch(`/api/saved-origins/${originId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Starting point could not be removed.");
      setSavedOrigins((origins) => origins.filter((origin) => origin.id !== originId));
      setMessage("Starting point removed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Starting point could not be removed.");
    } finally {
      setOriginStatus("idle");
    }
  }

  return (
    <section className="profile-settings">
      <div className="profile-heading">
        <p className="eyebrow">Your account</p>
        <h1>Personal settings</h1>
        <p>Keep the information and starting points that make planning easier. Nothing here appears in a shared trip link.</p>
      </div>
      <div className="profile-grid">
        <form className="profile-card" onSubmit={(event) => void saveProfile(event)}>
          <div><p className="eyebrow">About you</p><h2>Your details</h2></div>
          <div className="profile-name-fields">
            <label>First name<input name="firstName" defaultValue={profile.firstName ?? fallbackParts[0] ?? ""} required maxLength={80} autoComplete="given-name" /></label>
            <label>Last name<input name="lastName" defaultValue={profile.lastName ?? fallbackParts.slice(1).join(" ")} required maxLength={80} autoComplete="family-name" /></label>
          </div>
          <label>Email<input value={email} disabled aria-label="Email" /></label>
          <button type="submit" disabled={profileStatus === "saving"}>{profileStatus === "saving" ? "Saving…" : "Save details"}</button>
        </form>
        <section className="profile-card saved-origins-card">
          <div><p className="eyebrow">Your bases</p><h2>Saved starting points</h2></div>
          <p className="profile-card-note">Save the text you use for an address or city. Nearbound confirms it with Mapbox only when you choose it for a trip, so coordinates are never stored.</p>
          {savedOrigins.length > 0 && <ul className="saved-origins-list">{savedOrigins.map((origin) => <li key={origin.id}><div><strong>{origin.label}</strong><span>{origin.addressInput}</span></div><button type="button" disabled={originStatus === "saving"} onClick={() => void removeOrigin(origin.id)}>Remove</button></li>)}</ul>}
          <form className="saved-origin-form" onSubmit={(event) => void addOrigin(event)}>
            <label>Label<input name="label" placeholder="Home" required maxLength={60} /></label>
            <label>Street address<input name="streetAddress" placeholder="123 Main St" required maxLength={140} autoComplete="street-address" /></label>
            <div className="saved-origin-location-fields">
              <label>City<input name="city" placeholder="Seattle" required maxLength={80} autoComplete="address-level2" /></label>
              <label>State / province<select name="regionCode" required defaultValue="WA">{regionsByCountry[countryCode].map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label>
            </div>
            <div className="saved-origin-location-fields">
              <label>ZIP / postal code<input name="postalCode" placeholder={countryCode === "US" ? "98101" : "V6B 1A1"} required maxLength={16} autoComplete="postal-code" /></label>
              <label>Country<select name="countryCode" value={countryCode} onChange={(event) => setCountryCode(event.target.value as keyof typeof regionsByCountry)}><option value="US">United States</option><option value="CA">Canada</option></select></label>
            </div>
            <p className="saved-origin-form-note">Nearbound saves the fields you enter. Mapbox confirms the address only when you use it to plan a trip.</p>
            <button type="submit" disabled={originStatus === "saving"}>{originStatus === "saving" ? "Saving…" : "Save starting point"}</button>
          </form>
        </section>
      </div>
      {message && <p className="profile-status" role="status">{message}</p>}
    </section>
  );
}
