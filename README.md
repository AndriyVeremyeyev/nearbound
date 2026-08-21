# Nearbound

**Explainable regional short-trip discovery for the Pacific Northwest.**

Nearbound helps people choose a realistic one-to-four-day getaway based on where they start, who is traveling, how much time they have, how far they are willing to go, and what kind of experience they want.

> **Status:** research-backed concept prototype. The current demo uses a small curated dataset centered on the Issaquah area. It is not yet a production travel service.

## The problem

Short regional trips are often harder to choose than they should be. A destination can look appealing while being a poor fit once driving time, ferry or border friction, weather, children, lodging quality, and the length of the trip are considered together.

Nearbound is intended to return a short, ranked list and explain:

- why each destination fits the request;
- what the main tradeoff is;
- which area is practical to stay in;
- which logistics or seasonal conditions need attention.

## Current prototype

The existing concept spike includes:

- a four-step guided setup for trip basics, time, experiences, and route logistics;
- an origin field and travel-radius control;
- traveling-with-children, trip length, and experience filters;
- a deterministic ranking over 18 curated destinations;
- visible reasons, cautions, and stay suggestions;
- click-through destination detail pages with trip context and source links;
- an optional email-and-password account with persistent sessions;
- a per-account profile with saved starting points, visited-place history, ratings, and short notes;
- a single workspace where the same answers and results can be changed without restarting the setup;
- an interactive Mapbox map with the active starting point and top-ranked destinations.

Important limitations:

- when a `MAPBOX_ACCESS_TOKEN` is configured locally, the starting point uses temporary Mapbox autocomplete and the selected place drives live Mapbox drive-time estimates for the current session;
- ferry and border filters still use curated route metadata, rather than live route analysis;
- the browser map needs a separate public `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`; it is URL-restricted in Mapbox and is intentionally visible to the browser, while `MAPBOX_ACCESS_TOKEN` stays server-only;
- live route time stays in the planner and is not carried onto detail pages, because the selected starting point is temporary;
- saved starting points retain only user-entered address fields; Mapbox confirms coordinates only for the active trip and does not persist them;
- email verification and password recovery are not included in the current prototype;
- schedules, weather, lodging availability, and prices are not live;
- the dataset is a product-research seed, not comprehensive travel advice.

## MVP direction

The first credible version is deliberately regional and narrow:

- Washington, Oregon, Idaho, and British Columbia;
- one-to-four-day trips;
- driving first, with ferry and border constraints where relevant;
- solo travelers, couples, and families;
- curated destination data and explainable scoring;
- a short four-step first-run setup followed by one editable filter-and-results workspace.

Flights, booking, detailed itineraries, live pricing, and AI-generated recommendations are outside the initial MVP. Account-based personalization is being added separately and never blocks public planning.

## Technology status

The prototype uses the official Next.js App Router with React and TypeScript. Its curated catalog, optional Better Auth account data, profile fields, user-entered saved starting points, and per-account visited history are stored in Neon Postgres through a server-only Drizzle data layer; versioned migrations and an idempotent development seed keep the initial dataset reproducible. The interactive planner and deterministic ranking remain client-side. A server-only Mapbox integration uses Search Box autocomplete to confirm a temporary origin, then uses the Matrix API for live drive-time estimates; an independent URL-restricted public Mapbox token renders the interactive map in the browser. It does not persist Mapbox search data. Vercel Hobby is the planned deployment target. AI-generated recommendations remain outside the MVP.

## Local development

Prerequisites: Node.js `24.x` and npm `11.x`.

Copy `.env.example` to `.env.local` and provide a Neon `DATABASE_URL`, a server-only Mapbox `MAPBOX_ACCESS_TOKEN`, a URL-restricted public `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` for the browser map, and a private `BETTER_AUTH_SECRET`, then run:

```bash
npm install
npm run db:migrate
npm run db:seed
npm run db:catalog:check
npm run dev
```

The seed bootstraps the current 18-destination concept dataset and the Oregon Coast route catalog. Curated route changes should begin in a reviewed definition under `db/catalog/`, then be applied with the seed; Neon Console remains useful for inspecting the result.
Run `npm run db:catalog:check` after applying a catalog change to verify the published route graph, coordinates, source evidence, and review metadata before relying on it in the planner.

Useful checks:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Data responsibility

Nearbound should distinguish curated facts from live facts and retain source, verification date, and confidence metadata. Ferry schedules, border requirements, road conditions, closures, events, weather, and lodging details must be verified before a real trip.

## Development approach

This repository is being developed as a real portfolio project: product decisions come before large implementation changes, commits should represent meaningful reviewed steps, and documentation must describe only behavior that actually exists.
