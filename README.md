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

- an origin field and travel-radius control;
- party size, trip length, and experience filters;
- a deterministic ranking over 12 curated destinations;
- visible reasons, cautions, and stay suggestions;
- a single workspace where filters and results can be changed without restarting a questionnaire;
- a stylized map used to test the visual direction.

Important limitations:

- the origin field is not connected to geocoding or routing yet;
- travel times are curated estimates rather than live route calculations;
- the map is illustrative, not geographic;
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

Flights, booking, accounts, detailed itineraries, live pricing, and AI-generated recommendations are outside the initial MVP.

## Technology status

The prototype now has an official Next.js App Router baseline with React and TypeScript. The current interface remains a client-side concept prototype while the domain model is separated and tested. Mapbox is the planned map, geocoding, and routing provider, and Vercel Hobby is the planned deployment target; neither integration is active yet. The MVP does not require a database, user accounts, or AI-generated recommendations.

## Local development

Prerequisites: Node.js `24.x` and npm `11.x`.

```bash
npm install
npm run dev
```

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
