export const NORTH_CASCADES_VERIFIED_ON = "2026-08-21";
export const NORTH_CASCADES_REVIEW_DUE_ON = "2027-02-21";

export const northCascadesSr20Areas = [
  {
    id: "north-cascades-newhalem-diablo",
    slug: "newhalem-diablo-lake",
    name: "Newhalem & Diablo Lake",
    kind: "park",
    latitude: 48.7128,
    longitude: -121.1446,
    summary: "A North Cascades gateway pairing the historic company town of Newhalem with the turquoise lake overlooks along SR-20.",
  },
  {
    id: "north-cascades-washington-pass-blue-lake",
    slug: "washington-pass-blue-lake",
    name: "Washington Pass & Blue Lake",
    kind: "park",
    latitude: 48.5191,
    longitude: -120.6742,
    summary: "The high-country section of SR-20: a dramatic paved overlook and a substantial alpine lake hike from the highway.",
  },
  {
    id: "north-cascades-winthrop-methow",
    slug: "winthrop-methow-valley",
    name: "Winthrop & Methow Valley",
    kind: "town",
    latitude: 48.4771,
    longitude: -120.1861,
    summary: "A western-themed small town and flexible overnight in the Methow Valley, with river paths close to downtown.",
  },
  {
    id: "north-cascades-lake-chelan",
    slug: "lake-chelan",
    name: "Lake Chelan",
    kind: "resort",
    latitude: 47.8405,
    longitude: -120.016,
    summary: "A long, sunny lake pause where a state-park beach can balance the more active mountain days around it.",
  },
  {
    id: "north-cascades-leavenworth",
    slug: "leavenworth",
    name: "Leavenworth",
    kind: "town",
    latitude: 47.5962,
    longitude: -120.6615,
    summary: "A walkable Cascade town and a gentler final overnight before the origin-specific drive home via US-2.",
  },
] as const;

export const northCascadesSr20Stops = [
  {
    id: "newhalem-historic-district",
    slug: "newhalem-historic-district",
    name: "Newhalem Historic District",
    kind: "historic_downtown",
    areaId: "north-cascades-newhalem-diablo",
    latitude: 48.6722,
    longitude: -121.2449,
    typicalDurationMinutes: 75,
    indoorOutdoor: "mixed",
    childFit: "good",
    weatherSensitivity: "medium",
    summary: "A short, low-pressure start in the historic hydroelectric town before the highway climbs into the mountains.",
    preferences: ["city", "mountains"],
  },
  {
    id: "diablo-lake-overlook",
    slug: "diablo-lake-overlook",
    name: "Diablo Lake Overlook",
    kind: "viewpoint",
    areaId: "north-cascades-newhalem-diablo",
    latitude: 48.7128,
    longitude: -121.1446,
    typicalDurationMinutes: 45,
    indoorOutdoor: "outdoor",
    childFit: "good",
    weatherSensitivity: "high",
    summary: "A short roadside overlook above Diablo Lake that gives the route an immediate North Cascades payoff.",
    preferences: ["mountains", "forest"],
  },
  {
    id: "blue-lake-trail",
    slug: "blue-lake-trail",
    name: "Blue Lake Trail",
    kind: "hike",
    areaId: "north-cascades-washington-pass-blue-lake",
    latitude: 48.5191,
    longitude: -120.6742,
    typicalDurationMinutes: 240,
    indoorOutdoor: "outdoor",
    childFit: "possible",
    weatherSensitivity: "high",
    summary: "A 4.4-mile round-trip alpine lake hike with meaningful elevation gain; save it for a dedicated, snow-free half-day.",
    preferences: ["mountains", "forest"],
  },
  {
    id: "washington-pass-overlook",
    slug: "washington-pass-overlook",
    name: "Washington Pass Overlook",
    kind: "viewpoint",
    areaId: "north-cascades-washington-pass-blue-lake",
    latitude: 48.5356,
    longitude: -120.7347,
    typicalDurationMinutes: 45,
    indoorOutdoor: "outdoor",
    childFit: "good",
    weatherSensitivity: "high",
    summary: "A short paved overlook for Liberty Bell Mountain views, useful when the Blue Lake hike is not the right fit.",
    preferences: ["mountains"],
  },
  {
    id: "winthrop-western-downtown",
    slug: "winthrop-western-downtown",
    name: "Winthrop Western Downtown",
    kind: "historic_downtown",
    areaId: "north-cascades-winthrop-methow",
    latitude: 48.4772,
    longitude: -120.1857,
    typicalDurationMinutes: 120,
    indoorOutdoor: "mixed",
    childFit: "good",
    weatherSensitivity: "low",
    summary: "A compact Old West-style downtown for a meal, browsing and an easy transition into an overnight.",
    preferences: ["city"],
  },
  {
    id: "spring-creek-bridge",
    slug: "spring-creek-bridge",
    name: "Spring Creek Bridge",
    kind: "park",
    areaId: "north-cascades-winthrop-methow",
    latitude: 48.4737,
    longitude: -120.1862,
    typicalDurationMinutes: 45,
    indoorOutdoor: "outdoor",
    childFit: "good",
    weatherSensitivity: "medium",
    summary: "A short river-and-mountain walk at the edge of downtown rather than another driving stop.",
    preferences: ["forest", "mountains"],
  },
  {
    id: "lake-chelan-state-park",
    slug: "lake-chelan-state-park",
    name: "Lake Chelan State Park",
    kind: "park",
    areaId: "north-cascades-lake-chelan",
    latitude: 47.8726,
    longitude: -120.1966,
    typicalDurationMinutes: 180,
    indoorOutdoor: "outdoor",
    childFit: "good",
    weatherSensitivity: "high",
    summary: "A lakefront reset with beach, picnic and easy walking time after the route’s mountain driving.",
    preferences: ["resort", "mountains"],
  },
  {
    id: "leavenworth-waterfront-park",
    slug: "leavenworth-waterfront-park",
    name: "Waterfront Park Trail",
    kind: "park",
    areaId: "north-cascades-leavenworth",
    latitude: 47.5895,
    longitude: -120.6618,
    typicalDurationMinutes: 90,
    indoorOutdoor: "outdoor",
    childFit: "good",
    weatherSensitivity: "medium",
    summary: "An easy riverside walk from downtown Leavenworth, with a flatter and quieter alternative to another mountain outing.",
    preferences: ["forest", "city"],
  },
] as const;

export const northCascadesSr20HikeDetails = [
  {
    stopId: "blue-lake-trail",
    difficulty: "moderate",
    distanceMiles: 4.4,
    elevationGainFeet: 1050,
    routeShape: "out_and_back",
    trailheadLatitude: 48.5191,
    trailheadLongitude: -120.6742,
  },
] as const;

export const northCascadesSr20Sources = [
  { id: "nps-north-cascades-highway", title: "North Cascades Highway", url: "https://home.nps.gov/noca/planyourvisit/north-cascades-highway.htm", publisherType: "government" },
  { id: "nps-north-cascades-road-conditions", title: "North Cascades road conditions", url: "https://www.nps.gov/noca/planyourvisit/road-conditions.htm", publisherType: "government" },
  { id: "wsdot-sr20-seasonal-closure", title: "SR-20 North Cascades Highway seasonal closure", url: "https://wsdot.wa.gov/about/news/2025/sr-20-north-cascades-highway-closes-season-thursday-dec-4-6-pm", publisherType: "government" },
  { id: "wta-blue-lake", title: "Blue Lake", url: "https://www.wta.org/go-hiking/hikes/blue-lake", publisherType: "trail_organization" },
  { id: "winthrop-washington", title: "Experience Winthrop", url: "https://www.winthropwashington.com/", publisherType: "visitor_bureau" },
  { id: "wa-parks-lake-chelan", title: "Lake Chelan State Park", url: "https://parks.wa.gov/find-parks/state-parks/lake-chelan-state-park", publisherType: "government" },
  { id: "leavenworth-waterfront-park", title: "Waterfront Park Trail", url: "https://leavenworth.org/trail/waterfront-park-2/", publisherType: "visitor_bureau" },
] as const;

export const northCascadesSr20Route = {
  id: "north-cascades-sr20-loop",
  slug: "north-cascades-sr20-loop",
  name: "North Cascades Loop via SR-20",
  shape: "loop",
  countryCode: "US",
  minDays: 3,
  maxDays: 4,
  summary: "A seasonal Cascade loop over SR-20: Newhalem and Diablo Lake, Washington Pass and Blue Lake, Winthrop, Lake Chelan and Leavenworth. The drive home from Leavenworth is calculated from the traveler’s starting point.",
} as const;

export const northCascadesSr20RouteLegs = [
  { position: 1, fromAreaId: "north-cascades-newhalem-diablo", toAreaId: "north-cascades-washington-pass-blue-lake", distanceMiles: 42, driveMinutes: 60 },
  { position: 2, fromAreaId: "north-cascades-washington-pass-blue-lake", toAreaId: "north-cascades-winthrop-methow", distanceMiles: 31, driveMinutes: 45 },
  { position: 3, fromAreaId: "north-cascades-winthrop-methow", toAreaId: "north-cascades-lake-chelan", distanceMiles: 83, driveMinutes: 125 },
  { position: 4, fromAreaId: "north-cascades-lake-chelan", toAreaId: "north-cascades-leavenworth", distanceMiles: 65, driveMinutes: 90 },
] as const;

export function sourceForNorthCascadesSr20Stop(stopId: string) {
  if (["newhalem-historic-district", "diablo-lake-overlook"].includes(stopId)) return "nps-north-cascades-highway";
  if (["blue-lake-trail", "washington-pass-overlook"].includes(stopId)) return "wta-blue-lake";
  if (["winthrop-western-downtown", "spring-creek-bridge"].includes(stopId)) return "winthrop-washington";
  if (stopId === "lake-chelan-state-park") return "wa-parks-lake-chelan";
  return "leavenworth-waterfront-park";
}

export function sourceForNorthCascadesSr20Area(areaId: string) {
  if (areaId === "north-cascades-newhalem-diablo") return "nps-north-cascades-highway";
  if (areaId === "north-cascades-washington-pass-blue-lake") return "wta-blue-lake";
  if (areaId === "north-cascades-winthrop-methow") return "winthrop-washington";
  if (areaId === "north-cascades-lake-chelan") return "wa-parks-lake-chelan";
  return "leavenworth-waterfront-park";
}
