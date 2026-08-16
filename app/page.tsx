"use client";

import { FormEvent, useMemo, useState } from "react";

type Preference = "ocean" | "animals" | "city" | "resort" | "mountains" | "forest";

type Destination = {
  id: string;
  name: string;
  region: string;
  hours: number;
  minDays: number;
  maxDays: number;
  preferences: Preference[];
  familyFit: number;
  weatherBackup: number;
  visited?: boolean;
  position: { left: string; top: string };
  summary: string;
  anchor: string;
  stay: string;
  caution: string;
};

const destinations: Destination[] = [
  {
    id: "point-defiance",
    name: "Point Defiance",
    region: "Tacoma, WA",
    hours: 1.2,
    minDays: 1,
    maxDays: 2,
    preferences: ["animals", "ocean", "city"],
    familyFit: 10,
    weatherBackup: 9,
    position: { left: "43%", top: "59%" },
    summary: "A zoo and two aquariums in one compact day, with a carousel and a real indoor fallback.",
    anchor: "Pacific Seas Aquarium before lunch; Kids’ Zone after the toddler break.",
    stay: "Make it a day trip, or choose a Tacoma hotel with a pool.",
    caution: "Arrive early and keep the afternoon intentionally light.",
  },
  {
    id: "northwest-trek",
    name: "Northwest Trek",
    region: "Eatonville, WA",
    hours: 1.8,
    minDays: 1,
    maxDays: 2,
    preferences: ["animals", "forest", "mountains"],
    familyFit: 10,
    weatherBackup: 6,
    position: { left: "50%", top: "70%" },
    summary: "The strongest big-animal day trip without putting the family car inside an animal enclosure.",
    anchor: "Discovery Tram first, then Kids’ Trek while everyone still has energy.",
    stay: "Usually best as a day trip from home.",
    caution: "Tram times are first come, first served—opening time matters.",
  },
  {
    id: "ocean-shores",
    name: "Ocean Shores",
    region: "Washington coast",
    hours: 2.9,
    minDays: 2,
    maxDays: 4,
    preferences: ["ocean", "resort"],
    familyFit: 9,
    weatherBackup: 7,
    position: { left: "14%", top: "69%" },
    summary: "A simple ocean reset: repeatable beach time, room for naps, and no pressure to sightsee.",
    anchor: "One unhurried beach window, then pool or playroom after the nap.",
    stay: "Oyhut Bay cottage or condo with a kitchen and separate sleep space.",
    caution: "Wind and cold water make the quality of the house more important than the view.",
  },
  {
    id: "bellingham",
    name: "Bellingham",
    region: "Bellingham, WA",
    hours: 2.2,
    minDays: 1,
    maxDays: 3,
    preferences: ["city", "ocean", "animals", "forest"],
    familyFit: 8,
    weatherBackup: 9,
    position: { left: "49%", top: "21%" },
    summary: "A forgiving mix of waterfront, a small marine center, playgrounds, food, and rain-safe options.",
    anchor: "Marine Life Center plus Boulevard Park; Fairhaven becomes the easy second stop.",
    stay: "Waterfront hotel or a Fairhaven base within walking distance of dinner.",
    caution: "The marine center is a bonus, not a full-size aquarium.",
  },
  {
    id: "alderbrook",
    name: "Alderbrook",
    region: "Hood Canal, WA",
    hours: 2.2,
    minDays: 2,
    maxDays: 4,
    preferences: ["ocean", "resort", "forest"],
    familyFit: 9,
    weatherBackup: 8,
    position: { left: "29%", top: "64%" },
    summary: "The comfortable-waterfront option: one base, a pool, easy meals, and small outings instead of a checklist.",
    anchor: "Resort morning, one short Hood Canal outing, then back for the pool.",
    stay: "A two-bedroom cottage with kitchen access and room for four real sleepers.",
    caution: "Confirm pool access for the exact rate before paying.",
  },
  {
    id: "great-wolf",
    name: "Great Wolf Lodge",
    region: "Grand Mound, WA",
    hours: 1.6,
    minDays: 1,
    maxDays: 3,
    preferences: ["resort", "city"],
    familyFit: 9,
    weatherBackup: 10,
    position: { left: "44%", top: "78%" },
    summary: "A high-certainty bad-weather reset where the hotel itself is the trip.",
    anchor: "One water-park session, a quiet break, then only low-key resort activities.",
    stay: "Family suite away from elevators, with a protected toddler nap window.",
    caution: "It can be overstimulating; plan an explicit quiet exit route.",
  },
  {
    id: "suncadia",
    name: "Suncadia",
    region: "Cle Elum, WA",
    hours: 1.5,
    minDays: 2,
    maxDays: 4,
    preferences: ["resort", "mountains", "forest"],
    familyFit: 9,
    weatherBackup: 8,
    position: { left: "69%", top: "55%" },
    summary: "The easiest mountain-resort switch: short drive, pool-centered stay, and no need to chase attractions.",
    anchor: "Pool first; add Roslyn or one easy outdoor stop only if energy is good.",
    stay: "Condo or vacation home with a kitchen and verified pool access.",
    caution: "Amenities vary by booking channel—verify what is actually included.",
  },
  {
    id: "leavenworth",
    name: "Leavenworth",
    region: "Cascade Mountains, WA",
    hours: 2.7,
    minDays: 2,
    maxDays: 4,
    preferences: ["city", "mountains", "resort"],
    familyFit: 8,
    weatherBackup: 7,
    position: { left: "79%", top: "42%" },
    summary: "A walkable town, reliable food, family lodging, and mountain scenery without making hiking the whole trip.",
    anchor: "Front Street and Waterfront Park, with mini-golf or pool as the child anchor.",
    stay: "A family condo with a kitchen and separate bedroom.",
    caution: "US-2 traffic and winter pass conditions can change the equation fast.",
  },
  {
    id: "vancouver",
    name: "Vancouver Aquarium",
    region: "Vancouver, BC",
    hours: 3.3,
    minDays: 2,
    maxDays: 4,
    preferences: ["animals", "city", "ocean"],
    familyFit: 10,
    weatherBackup: 10,
    position: { left: "50%", top: "7%" },
    summary: "The best full-size aquarium within a long-drive weekend, backed by a genuinely kid-friendly city.",
    anchor: "Aquarium as the only must-do; Stanley Park and the hotel pool stay optional.",
    stay: "Suite near Stanley Park with a kitchen and parking included.",
    caution: "Passports, border variability, and parking make this a two-night trip.",
  },
  {
    id: "seabrook",
    name: "Seabrook",
    region: "Pacific Beach, WA",
    hours: 3.4,
    minDays: 3,
    maxDays: 4,
    preferences: ["ocean", "resort"],
    familyFit: 9,
    weatherBackup: 9,
    position: { left: "12%", top: "61%" },
    summary: "A beach town designed around the stay: full house, pools, playgrounds, food, and ocean on foot.",
    anchor: "Beach in the morning, a protected quiet block, then pool or playground.",
    stay: "Official vacation rental with kitchen, laundry, and confirmed pool access.",
    caution: "For a three-hour-plus drive, the extra day is what makes the trip feel easy.",
  },
  {
    id: "sequim",
    name: "Sequim",
    region: "Olympic Peninsula, WA",
    hours: 2.6,
    minDays: 2,
    maxDays: 3,
    preferences: ["animals", "ocean", "resort"],
    familyFit: 8,
    weatherBackup: 6,
    visited: true,
    position: { left: "20%", top: "39%" },
    summary: "Animals, a drier climate, and a manageable waterfront base on the Olympic Peninsula.",
    anchor: "Olympic Game Farm or waterfront—not both as mandatory anchors.",
    stay: "Hotel or cottage in Sequim with simple meals nearby.",
    caution: "Drive-through animals can scratch mirrors or bodywork.",
  },
  {
    id: "long-beach",
    name: "Long Beach",
    region: "Long Beach, WA",
    hours: 3.5,
    minDays: 2,
    maxDays: 4,
    preferences: ["ocean", "resort", "city"],
    familyFit: 8,
    weatherBackup: 7,
    visited: true,
    position: { left: "16%", top: "89%" },
    summary: "A classic long beach, kites, and a compact tourist town that earns the drive with an overnight stay.",
    anchor: "Kites and beach time, with the town as the weather fallback.",
    stay: "Beach hotel or cottage with a real second sleeping zone.",
    caution: "Too far for a satisfying same-day return with small children.",
  },
];

const preferenceOptions: { id: Preference; label: string }[] = [
  { id: "ocean", label: "Ocean" },
  { id: "animals", label: "Animals" },
  { id: "city", label: "City" },
  { id: "resort", label: "Easy resort" },
  { id: "mountains", label: "Mountains" },
  { id: "forest", label: "Forest" },
];

const dayOptions = [
  { value: 1, label: "Day trip" },
  { value: 2, label: "2 days" },
  { value: 4, label: "3–4 days" },
];

function formatDriveTime(hours: number) {
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  return `${whole}h ${minutes ? `${minutes}m` : ""}`.trim();
}

export default function Home() {
  const [address, setAddress] = useState("Issaquah, WA");
  const [radius, setRadius] = useState(3);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(2);
  const [days, setDays] = useState(2);
  const [preferences, setPreferences] = useState<Preference[]>(["animals", "ocean"]);
  const [hideVisited, setHideVisited] = useState(true);
  const [selectedId, setSelectedId] = useState("point-defiance");
  const [searchCount, setSearchCount] = useState(0);

  const ranked = useMemo(() => {
    return destinations
      .filter((destination) => destination.hours <= radius + 0.15)
      .filter((destination) => !hideVisited || !destination.visited)
      .map((destination) => {
        const preferenceMatches = destination.preferences.filter((tag) => preferences.includes(tag)).length;
        const preferenceScore = preferences.length ? (preferenceMatches / preferences.length) * 28 : 16;
        const distanceScore = Math.max(5, 18 - (destination.hours / radius) * 8);
        const dayScore = days >= destination.minDays && days <= destination.maxDays ? 14 : 3;
        const childScore = children > 0 ? destination.familyFit * 1.8 : destination.familyFit;
        const weatherScore = destination.weatherBackup * 0.9;
        const score = Math.round(Math.min(98, 15 + preferenceScore + distanceScore + dayScore + childScore + weatherScore));
        return { ...destination, score, preferenceMatches };
      })
      .sort((a, b) => b.score - a.score || a.hours - b.hours);
  }, [children, days, hideVisited, preferences, radius]);

  const topResults = ranked.slice(0, 5);
  const selected = ranked.find((destination) => destination.id === selectedId) ?? topResults[0];

  function togglePreference(preference: Preference) {
    setPreferences((current) =>
      current.includes(preference)
        ? current.filter((item) => item !== preference)
        : [...current, preference],
    );
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchCount((current) => current + 1);
    if (topResults[0]) setSelectedId(topResults[0].id);
    document.getElementById("matches")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const isIssaquah = /issaquah/i.test(address);

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Nearbound home">
          <span className="brand-mark" aria-hidden="true">N</span>
          <span>nearbound</span>
        </a>
        <div className="header-note">
          <span className="status-dot" aria-hidden="true" />
          Family travel prototype · Cascadia
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">A smarter way to choose a short trip</p>
          <h1>Find somewhere that fits your <em>actual</em> family.</h1>
          <p className="hero-intro">
            Start with the constraints that usually ruin a weekend—drive time, naps, weather, and logistics.
            Then match the destination.
          </p>
        </div>
        <div className="hero-proof" aria-label="Prototype research summary">
          <span><strong>87</strong> researched ideas</span>
          <span><strong>4</strong> planning constraints</span>
          <span><strong>1</strong> strong plan per day</span>
        </div>
      </section>

      <section className="planner-shell" aria-label="Trip planner">
        <form className="planner-card" onSubmit={handleSearch}>
          <div className="section-heading">
            <span>01</span>
            <div>
              <p>Your trip brief</p>
              <small>Four choices. No twenty-field questionnaire.</small>
            </div>
          </div>

          <label className="field-label" htmlFor="address">Starting point</label>
          <div className="address-field">
            <span className="pin-mini" aria-hidden="true" />
            <input
              id="address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="City or street address"
            />
          </div>
          <p className={`demo-note ${isIssaquah ? "" : "is-warning"}`}>
            {isIssaquah
              ? "Live prototype uses the Issaquah drive-time dataset."
              : "Address captured. Recommendations still use the Issaquah demo dataset."}
          </p>

          <div className="form-row">
            <div>
              <span className="field-label">Travel mode</span>
              <div className="segmented" aria-label="Travel mode">
                <button type="button" className="active" aria-pressed="true">Drive</button>
                <button type="button" disabled title="Planned after the driving MVP">Fly <small>next</small></button>
              </div>
            </div>
            <div>
              <span className="field-label">Travelers</span>
              <div className="travelers">
                <div><span>{adults}</span><small>adults</small></div>
                <div><span>{children}</span><small>kids</small></div>
                <div className="stepper-buttons">
                  <button type="button" onClick={() => setChildren((value) => Math.max(0, value - 1))} aria-label="Remove one child">−</button>
                  <button type="button" onClick={() => setChildren((value) => Math.min(6, value + 1))} aria-label="Add one child">+</button>
                </div>
              </div>
              <button className="adult-toggle" type="button" onClick={() => setAdults((value) => value === 2 ? 1 : 2)}>
                {adults === 2 ? "Two adults" : "One adult"}
              </button>
            </div>
          </div>

          <div className="radius-block">
            <div className="label-line">
              <span className="field-label">Maximum drive</span>
              <strong>{radius.toFixed(1)} hours</strong>
            </div>
            <input
              className="range-input"
              type="range"
              min="1"
              max="6"
              step="0.5"
              value={radius}
              onChange={(event) => setRadius(Number(event.target.value))}
              aria-label="Maximum drive time in hours"
            />
            <div className="range-labels" aria-hidden="true"><span>1 hour</span><span>6 hours</span></div>
          </div>

          <div className="days-block">
            <span className="field-label">Time away</span>
            <div className="day-options">
              {dayOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={days === option.value ? "active" : ""}
                  aria-pressed={days === option.value}
                  onClick={() => setDays(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="preferences-block">
            <span className="field-label">What sounds good?</span>
            <div className="preference-list">
              {preferenceOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={preferences.includes(option.id) ? "active" : ""}
                  aria-pressed={preferences.includes(option.id)}
                  onClick={() => togglePreference(option.id)}
                >
                  <span aria-hidden="true">{preferences.includes(option.id) ? "✓" : "+"}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <label className="check-row">
            <input type="checkbox" checked={hideVisited} onChange={(event) => setHideVisited(event.target.checked)} />
            <span>Hide places we’ve already visited</span>
          </label>

          <button className="primary-button" type="submit">
            Find my trips
            <span aria-hidden="true">↗</span>
          </button>
        </form>

        <div className="map-card">
          <div className="map-topline">
            <div>
              <span className="map-kicker">Your search area</span>
              <strong>{topResults.length} strong matches near {isIssaquah ? "Issaquah" : "your start"}</strong>
            </div>
            <span className="map-scale">≈ {radius.toFixed(1)}h drive</span>
          </div>

          <div className="map-canvas" aria-label="Stylized map of recommended destinations around Issaquah">
            <div className="water-shape water-one" />
            <div className="water-shape water-two" />
            <div className="mountain-band" aria-hidden="true">CASCADE RANGE</div>
            <div className="road road-one" />
            <div className="road road-two" />
            <div className="radius-ring" style={{ width: `${32 + radius * 8}%`, height: `${32 + radius * 8}%` }} />
            <div className="home-pin" aria-label="Starting point: Issaquah">
              <span />
              <small>Issaquah</small>
            </div>
            <span className="map-label seattle">Seattle</span>
            <span className="map-label olympia">Olympia</span>
            <span className="map-label canada">CANADA</span>
            <span className="map-label pacific">PACIFIC OCEAN</span>
            {topResults.map((destination, index) => (
              <button
                key={destination.id}
                type="button"
                className={`destination-pin ${selected?.id === destination.id ? "active" : ""}`}
                style={destination.position}
                onClick={() => setSelectedId(destination.id)}
                aria-label={`${destination.name}, ${destination.score}% match`}
              >
                <span><i>{index + 1}</i></span>
                <small>{destination.name}</small>
              </button>
            ))}
          </div>

          {selected && (
            <article className="map-spotlight" aria-live="polite">
              <div className="match-score"><strong>{selected.score}%</strong><span>family fit</span></div>
              <div className="spotlight-copy">
                <p>{selected.region} · {formatDriveTime(selected.hours)} drive</p>
                <h2>{selected.name}</h2>
                <span>{selected.summary}</span>
              </div>
              <button type="button" onClick={() => document.getElementById(`result-${selected.id}`)?.scrollIntoView({ behavior: "smooth" })}>
                View plan <span aria-hidden="true">↓</span>
              </button>
            </article>
          )}
        </div>
      </section>

      <section className="results-section" id="matches">
        <div className="results-heading">
          <div>
            <p className="eyebrow">Ranked for your real constraints</p>
            <h2>Your best fits</h2>
          </div>
          <p>
            Distance gets you into the list. Child fit, weather backup, and the right amount of time decide the order.
          </p>
        </div>

        <div className="results-grid">
          {topResults.slice(0, 3).map((destination, index) => (
            <article
              className={`result-card ${selected?.id === destination.id ? "selected" : ""}`}
              id={`result-${destination.id}`}
              key={destination.id}
              onMouseEnter={() => setSelectedId(destination.id)}
            >
              <div className="result-rank">0{index + 1}</div>
              <div className="result-title-row">
                <div>
                  <p>{destination.region}</p>
                  <h3>{destination.name}</h3>
                </div>
                <div className="result-score"><strong>{destination.score}</strong><span>/100</span></div>
              </div>
              <p className="result-summary">{destination.summary}</p>
              <div className="tag-row">
                <span>{formatDriveTime(destination.hours)} drive</span>
                <span>{destination.minDays === 1 && destination.maxDays <= 2 ? "Day-trip friendly" : `${destination.minDays}–${destination.maxDays} days`}</span>
              </div>
              <div className="micro-plan">
                <div><span>One strong anchor</span><p>{destination.anchor}</p></div>
                <div><span>Where to stay</span><p>{destination.stay}</p></div>
                <div className="caution"><span>Reality check</span><p>{destination.caution}</p></div>
              </div>
            </article>
          ))}
        </div>
        {topResults.length === 0 && (
          <div className="empty-state">
            <h3>No honest match inside this radius.</h3>
            <p>Increase the drive time or choose fewer preferences—we won’t pretend a rushed weekend is a good fit.</p>
          </div>
        )}
        <p className="search-status" aria-live="polite">
          {searchCount > 0 ? `Updated with your latest trip brief · search ${searchCount}` : "Adjust the brief above—the ranking updates as you go."}
        </p>
      </section>

      <section className="principle-section">
        <p className="eyebrow">The product principle</p>
        <blockquote>
          “A good short trip isn’t the farthest place or the longest checklist. It’s one strong destination,
          comfortable sleep, one main plan a day, and a Monday that doesn’t feel like recovery.”
        </blockquote>
        <div className="research-note">
          <span>Built from a family travel calendar, a 17-page destination guide, and real post-trip preferences.</span>
          <span>Prototype data current to August 2026 · verify live conditions before booking.</span>
        </div>
      </section>

      <footer>
        <a className="brand" href="#top"><span className="brand-mark" aria-hidden="true">N</span><span>nearbound</span></a>
        <p>Short trips, chosen well.</p>
      </footer>
    </main>
  );
}
