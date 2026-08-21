export const WHIDBEY_ISLAND_VERIFIED_ON = "2026-08-21";
export const WHIDBEY_ISLAND_REVIEW_DUE_ON = "2027-02-21";

export const whidbeyIslandAreas = [
  {
    id: "whidbey-mukilteo-clinton",
    slug: "mukilteo-clinton-ferry",
    name: "Mukilteo–Clinton Ferry",
    kind: "coastal_area",
    latitude: 47.9474,
    longitude: -122.3045,
    summary: "The Seattle-side gateway to Whidbey: the crossing is part of the trip, but sailing times and wait times need a same-day check.",
  },
  {
    id: "whidbey-langley-south",
    slug: "langley-south-whidbey",
    name: "Langley & South Whidbey",
    kind: "island",
    latitude: 48.0409,
    longitude: -122.4085,
    summary: "A slower south-island base with a walkable village, shoreline parks and enough room to make the ferry ride feel like the beginning rather than the whole outing.",
  },
  {
    id: "whidbey-coupeville-ebey",
    slug: "coupeville-ebeys-landing",
    name: "Coupeville & Ebey's Landing",
    kind: "island",
    latitude: 48.2189,
    longitude: -122.6864,
    summary: "Central Whidbey's historic waterfront, farmland and bluff landscape, best treated as a real pause rather than a photo stop between ferry terminals.",
  },
  {
    id: "whidbey-deception-pass",
    slug: "deception-pass-oak-harbor",
    name: "Deception Pass & North Whidbey",
    kind: "park",
    latitude: 48.4058,
    longitude: -122.6435,
    summary: "A north-island finish where beaches, forest and the bridge viewpoint make a credible second day before the drive home over the bridge.",
  },
] as const;

export const whidbeyIslandStops = [
  {
    id: "mukilteo-clinton-ferry-crossing",
    slug: "mukilteo-clinton-ferry-crossing",
    name: "Mukilteo–Clinton Ferry Crossing",
    kind: "other",
    areaId: "whidbey-mukilteo-clinton",
    latitude: 47.9474,
    longitude: -122.3045,
    typicalDurationMinutes: 75,
    indoorOutdoor: "mixed",
    childFit: "good",
    weatherSensitivity: "medium",
    summary: "A scheduled vehicle ferry across Possession Sound. Treat the crossing as a trip experience, while checking current sailings and terminal waits before leaving home.",
    preferences: ["ferry", "ocean"],
  },
  {
    id: "mukilteo-lighthouse-park",
    slug: "mukilteo-lighthouse-park",
    name: "Mukilteo Lighthouse Park",
    kind: "park",
    areaId: "whidbey-mukilteo-clinton",
    latitude: 47.9492,
    longitude: -122.3055,
    typicalDurationMinutes: 45,
    indoorOutdoor: "outdoor",
    childFit: "good",
    weatherSensitivity: "medium",
    summary: "A short waterfront park stop beside the ferry terminal, useful if the schedule creates a little time without turning the departure into a separate half-day.",
    preferences: ["ocean", "historic"],
  },
  {
    id: "langley-historic-downtown",
    slug: "langley-historic-downtown",
    name: "Langley Historic Downtown",
    kind: "historic_downtown",
    areaId: "whidbey-langley-south",
    latitude: 48.0408,
    longitude: -122.4087,
    typicalDurationMinutes: 120,
    indoorOutdoor: "mixed",
    childFit: "good",
    weatherSensitivity: "low",
    summary: "A compact bluff-top village for a meal, bookstores and a waterfront walk; it works as the primary anchor for an unhurried south-Whidbey day.",
    preferences: ["city", "historic", "ocean"],
  },
  {
    id: "south-whidbey-state-park",
    slug: "south-whidbey-state-park",
    name: "South Whidbey State Park",
    kind: "park",
    areaId: "whidbey-langley-south",
    latitude: 48.1017,
    longitude: -122.4844,
    typicalDurationMinutes: 120,
    indoorOutdoor: "outdoor",
    childFit: "good",
    weatherSensitivity: "medium",
    summary: "A forest-and-shoreline state park for a slower island reset; use its beach and short walks rather than trying to add every south-island detour.",
    preferences: ["forest", "ocean"],
  },
  {
    id: "coupeville-historic-waterfront",
    slug: "coupeville-historic-waterfront",
    name: "Coupeville Historic Waterfront",
    kind: "historic_downtown",
    areaId: "whidbey-coupeville-ebey",
    latitude: 48.2196,
    longitude: -122.6878,
    typicalDurationMinutes: 120,
    indoorOutdoor: "mixed",
    childFit: "good",
    weatherSensitivity: "low",
    summary: "A short historic waterfront walk with food and museum options, allowing the central-island day to include history without adding a demanding trail.",
    preferences: ["historic", "city", "ocean"],
  },
  {
    id: "fort-casey-historical-state-park",
    slug: "fort-casey-historical-state-park",
    name: "Fort Casey Historical State Park",
    kind: "park",
    areaId: "whidbey-coupeville-ebey",
    latitude: 48.1606,
    longitude: -122.6724,
    typicalDurationMinutes: 150,
    indoorOutdoor: "outdoor",
    childFit: "good",
    weatherSensitivity: "medium",
    summary: "A broad historic fort and shoreline park with room to choose one battery, beach or lighthouse element instead of treating the whole site as a checklist.",
    preferences: ["historic", "ocean", "forest"],
  },
  {
    id: "ebeys-landing-bluff-overlook",
    slug: "ebeys-landing-bluff-overlook",
    name: "Ebey's Landing Bluff Overlook",
    kind: "viewpoint",
    areaId: "whidbey-coupeville-ebey",
    latitude: 48.2115,
    longitude: -122.6761,
    typicalDurationMinutes: 60,
    indoorOutdoor: "outdoor",
    childFit: "good",
    weatherSensitivity: "high",
    summary: "A short high-viewpoint pause above the reserve; it adds a landscape perspective without making the longer bluff trail mandatory for the day.",
    preferences: ["historic", "ocean", "forest"],
  },
  {
    id: "deception-pass-state-park",
    slug: "deception-pass-state-park",
    name: "Deception Pass State Park",
    kind: "park",
    areaId: "whidbey-deception-pass",
    latitude: 48.4009,
    longitude: -122.6439,
    typicalDurationMinutes: 180,
    indoorOutdoor: "outdoor",
    childFit: "good",
    weatherSensitivity: "medium",
    summary: "A large beach-and-forest state park around the bridge. Pick one shoreline or forest section rather than trying to cover both islands in a single stop.",
    preferences: ["forest", "ocean"],
  },
  {
    id: "deception-pass-bridge-viewpoint",
    slug: "deception-pass-bridge-viewpoint",
    name: "Deception Pass Bridge Viewpoint",
    kind: "viewpoint",
    areaId: "whidbey-deception-pass",
    latitude: 48.4074,
    longitude: -122.6467,
    typicalDurationMinutes: 45,
    indoorOutdoor: "outdoor",
    childFit: "good",
    weatherSensitivity: "high",
    summary: "A short bridge-and-water viewpoint that makes a good final scenic anchor before the mainland drive, especially when the park day is otherwise intentionally light.",
    preferences: ["ocean", "forest"],
  },
] as const;

export const whidbeyIslandSources = [
  { id: "wsdot-mukilteo-clinton", title: "Mukilteo–Clinton ferry route", url: "https://wsdot.wa.gov/travel/washington-state-ferries/routes-schedules/mukilteo-clinton", publisherType: "government" },
  { id: "mukilteo-lighthouse-park-source", title: "Mukilteo Lighthouse Park", url: "https://mukilteowa.gov/departments/parks___recreation/parks___trails/mukilteo_lighthouse_park.php", publisherType: "government" },
  { id: "visit-langley", title: "Visit Langley", url: "https://visitlangley.com/", publisherType: "visitor_bureau" },
  { id: "wa-parks-south-whidbey", title: "South Whidbey State Park", url: "https://parks.wa.gov/find-parks/state-parks/south-whidbey-state-park", publisherType: "government" },
  { id: "ebeys-landing-nps", title: "Ebey's Landing National Historical Reserve", url: "https://www.nps.gov/ebla/index.htm", publisherType: "government" },
  { id: "wa-parks-fort-casey", title: "Fort Casey Historical State Park", url: "https://parks.wa.gov/find-parks/state-parks/fort-casey-historical-state-park", publisherType: "government" },
  { id: "wa-parks-deception-pass", title: "Deception Pass State Park", url: "https://parks.wa.gov/find-parks/state-parks/deception-pass-state-park", publisherType: "government" },
] as const;

export const whidbeyIslandRoute = {
  id: "whidbey-island-ferry-loop",
  slug: "whidbey-island-ferry-loop",
  name: "Whidbey Island Ferry Loop",
  shape: "loop",
  countryCode: "US",
  minDays: 1,
  maxDays: 3,
  summary: "An island route that begins with the Mukilteo–Clinton ferry, moves through Langley and Coupeville, and finishes at Deception Pass before returning to the mainland by road. Ferry schedule and wait time remain same-day checks.",
} as const;

export const whidbeyIslandTripPlans = [
  {
    id: "south-whidbey-ferry-day",
    slug: "south-whidbey-ferry-day",
    name: "South Whidbey ferry day",
    summary: "An adult-friendly one-day island outing: make the ferry part of the experience, choose Langley or one nearby shoreline stop, and leave room for variable terminal time.",
    startAreaId: "whidbey-mukilteo-clinton",
    endAreaId: "whidbey-langley-south",
    minDays: 1,
    minDaysWithChildren: 2,
    maxDays: 2,
  },
  {
    id: "whidbey-ferry-loop",
    slug: "whidbey-ferry-loop",
    name: "Whidbey ferry loop",
    summary: "A deliberate island loop with the ferry, a central-Whidbey history or shoreline anchor, and Deception Pass as a separate final-day landscape stop.",
    startAreaId: "whidbey-mukilteo-clinton",
    endAreaId: "whidbey-deception-pass",
    minDays: 2,
    minDaysWithChildren: 3,
    maxDays: 3,
  },
] as const;

export const whidbeyIslandRouteLegs = [
  { position: 1, fromAreaId: "whidbey-mukilteo-clinton", toAreaId: "whidbey-langley-south", distanceMiles: 21, driveMinutes: 80, usesFerry: true },
  { position: 2, fromAreaId: "whidbey-langley-south", toAreaId: "whidbey-coupeville-ebey", distanceMiles: 31, driveMinutes: 50, usesFerry: false },
  { position: 3, fromAreaId: "whidbey-coupeville-ebey", toAreaId: "whidbey-deception-pass", distanceMiles: 29, driveMinutes: 45, usesFerry: false },
] as const;

export function sourceForWhidbeyIslandArea(areaId: string) {
  if (areaId === "whidbey-mukilteo-clinton") return "wsdot-mukilteo-clinton";
  if (areaId === "whidbey-langley-south") return "visit-langley";
  if (areaId === "whidbey-coupeville-ebey") return "ebeys-landing-nps";
  return "wa-parks-deception-pass";
}

export function sourceForWhidbeyIslandStop(stopId: string) {
  if (stopId === "mukilteo-clinton-ferry-crossing") return "wsdot-mukilteo-clinton";
  if (stopId === "mukilteo-lighthouse-park") return "mukilteo-lighthouse-park-source";
  if (stopId === "langley-historic-downtown") return "visit-langley";
  if (stopId === "south-whidbey-state-park") return "wa-parks-south-whidbey";
  if (stopId === "coupeville-historic-waterfront" || stopId === "ebeys-landing-bluff-overlook") return "ebeys-landing-nps";
  if (stopId === "fort-casey-historical-state-park") return "wa-parks-fort-casey";
  return "wa-parks-deception-pass";
}
