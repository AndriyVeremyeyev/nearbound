export const COLUMBIA_GORGE_VERIFIED_ON = "2026-08-21";
export const COLUMBIA_GORGE_REVIEW_DUE_ON = "2027-02-21";

export const columbiaRiverGorgeAreas = [
  { id: "gorge-multnomah-cascade-locks", slug: "multnomah-falls-cascade-locks", name: "Multnomah Falls & Cascade Locks", kind: "park", latitude: 45.6696, longitude: -121.8906, summary: "The west Gorge gateway, pairing a major waterfall with a compact river town and dam history rather than treating either as a freeway photo stop." },
  { id: "gorge-hood-river-mosier", slug: "hood-river-mosier", name: "Hood River & Mosier", kind: "town", latitude: 45.7054, longitude: -121.5215, summary: "A walkable river town and east-Gorge base where downtown, waterfront and nearby viewpoints can support a genuine overnight." },
  { id: "gorge-the-dalles-rowena", slug: "the-dalles-rowena", name: "The Dalles & Rowena", kind: "town", latitude: 45.6047, longitude: -121.1787, summary: "An east-Gorge transition from river history to high-bluff views, with space to slow down before crossing into Washington." },
  { id: "gorge-maryhill-goldendale", slug: "maryhill-goldendale", name: "Maryhill & Goldendale", kind: "coastal_area", latitude: 45.6837, longitude: -120.8087, summary: "A quieter Washington bluff above the Columbia, anchored by art, history and wide Gorge views rather than another driving-only leg." },
  { id: "gorge-white-salmon-bingen", slug: "white-salmon-bingen", name: "White Salmon & Bingen", kind: "town", latitude: 45.7279, longitude: -121.4865, summary: "A small Washington-side river-town pause that keeps the longer Gorge loop from becoming a continuous run of overlooks." },
  { id: "gorge-stevenson-beacon-rock", slug: "stevenson-beacon-rock", name: "Stevenson & Beacon Rock", kind: "coastal_area", latitude: 45.6279, longitude: -122.0239, summary: "The western Washington shore of the Gorge, with forest trails and river views that make a calmer final overnight possible." },
] as const;

export const columbiaRiverGorgeStops = [
  { id: "multnomah-falls", slug: "multnomah-falls", name: "Multnomah Falls", kind: "viewpoint", areaId: "gorge-multnomah-cascade-locks", latitude: 45.5762, longitude: -122.1158, typicalDurationMinutes: 90, indoorOutdoor: "outdoor", childFit: "good", weatherSensitivity: "medium", summary: "A high-payoff waterfall stop, but one that needs parking and crowd timing rather than a promise of a quick visit.", preferences: ["waterfall", "forest"] },
  { id: "bonneville-lock-and-dam", slug: "bonneville-lock-and-dam", name: "Bonneville Lock and Dam", kind: "museum", areaId: "gorge-multnomah-cascade-locks", latitude: 45.6438, longitude: -121.9415, typicalDurationMinutes: 120, indoorOutdoor: "mixed", childFit: "good", weatherSensitivity: "low", summary: "A river-engineering and fish-history anchor that gives the west Gorge a real indoor fallback.", preferences: ["historic", "city"] },
  { id: "cascade-locks-waterfront", slug: "cascade-locks-waterfront", name: "Cascade Locks Waterfront", kind: "historic_downtown", areaId: "gorge-multnomah-cascade-locks", latitude: 45.6694, longitude: -121.8907, typicalDurationMinutes: 90, indoorOutdoor: "mixed", childFit: "good", weatherSensitivity: "medium", summary: "A compact riverfront pause for a meal and short walk after a waterfall or dam visit.", preferences: ["city", "historic"] },
  { id: "hood-river-downtown-waterfront", slug: "hood-river-downtown-waterfront", name: "Hood River Downtown & Waterfront", kind: "historic_downtown", areaId: "gorge-hood-river-mosier", latitude: 45.7087, longitude: -121.5154, typicalDurationMinutes: 150, indoorOutdoor: "mixed", childFit: "good", weatherSensitivity: "low", summary: "A walkable town-and-waterfront anchor with enough food, river watching and low-pressure activity for an overnight base.", preferences: ["city", "historic", "mountains"] },
  { id: "hood-river-waterfront-park", slug: "hood-river-waterfront-park", name: "Hood River Waterfront Park", kind: "park", areaId: "gorge-hood-river-mosier", latitude: 45.7122, longitude: -121.5275, typicalDurationMinutes: 90, indoorOutdoor: "outdoor", childFit: "good", weatherSensitivity: "medium", summary: "A family-friendly riverfront park for watching water sports or simply keeping an active day from becoming all driving.", preferences: ["mountains", "city"] },
  { id: "rowena-crest", slug: "rowena-crest-overlook", name: "Rowena Crest Overlook", kind: "viewpoint", areaId: "gorge-the-dalles-rowena", latitude: 45.6817, longitude: -121.2997, typicalDurationMinutes: 75, indoorOutdoor: "outdoor", childFit: "good", weatherSensitivity: "high", summary: "A paved high-bluff viewpoint above the Columbia, best used as a short scenic anchor rather than the start of a long hike.", preferences: ["mountains", "historic"] },
  { id: "columbia-gorge-discovery-center", slug: "columbia-gorge-discovery-center", name: "Columbia Gorge Discovery Center", kind: "museum", areaId: "gorge-the-dalles-rowena", latitude: 45.6072, longitude: -121.1894, typicalDurationMinutes: 120, indoorOutdoor: "indoor", childFit: "good", weatherSensitivity: "low", summary: "An indoor history-and-landscape stop that gives an eastern Gorge day an honest bad-weather alternative.", preferences: ["historic", "city"] },
  { id: "maryhill-museum", slug: "maryhill-museum-of-art", name: "Maryhill Museum of Art", kind: "museum", areaId: "gorge-maryhill-goldendale", latitude: 45.6842, longitude: -120.8083, typicalDurationMinutes: 150, indoorOutdoor: "mixed", childFit: "good", weatherSensitivity: "low", summary: "A seasonal museum on a Columbia bluff, with art and outdoor grounds that make Maryhill more than a viewpoint.", preferences: ["historic", "city"] },
  { id: "beacon-rock", slug: "beacon-rock-state-park", name: "Beacon Rock State Park", kind: "park", areaId: "gorge-stevenson-beacon-rock", latitude: 45.6279, longitude: -122.0239, typicalDurationMinutes: 150, indoorOutdoor: "outdoor", childFit: "good", weatherSensitivity: "medium", summary: "A forest-and-river state park where a short walk can be enough; the summit trail is optional, not the default family plan.", preferences: ["forest", "mountains", "waterfall"] },
  { id: "doetsch-walking-path", slug: "doetsch-walking-path", name: "Doetsch Walking Path", kind: "hike", areaId: "gorge-stevenson-beacon-rock", latitude: 45.6355, longitude: -122.0289, typicalDurationMinutes: 60, indoorOutdoor: "outdoor", childFit: "good", weatherSensitivity: "medium", summary: "A flat interpretive loop through Beacon Rock State Park for a lower-effort final stop.", preferences: ["forest", "historic"] },
] as const;

export const columbiaRiverGorgeHikeDetails = [
  { stopId: "doetsch-walking-path", difficulty: "easy", distanceMiles: 1.2, elevationGainFeet: 0, routeShape: "loop", trailheadLatitude: 45.6355, trailheadLongitude: -122.0289 },
] as const;

export const columbiaRiverGorgeSources = [
  { id: "multnomah-falls-tourism", title: "Multnomah Falls", url: "https://www.multnomahfalls.com/experiences/multnomah-falls", publisherType: "visitor_bureau" },
  { id: "usace-bonneville", title: "Bonneville Lock and Dam visitor guide", url: "https://usace.contentdm.oclc.org/digital/api/collection/p16021coll11/id/425/download", publisherType: "government" },
  { id: "visit-hood-river", title: "Visit Hood River", url: "https://visithoodriver.com/", publisherType: "visitor_bureau" },
  { id: "port-of-hood-river-waterfront", title: "Hood River Waterfront", url: "https://www.portofhoodriver.com/waterfront", publisherType: "government" },
  { id: "oregon-parks-rowena", title: "Rowena Crest Overlook", url: "https://stateparks.oregon.gov/index.cfm?do=park.profile&parkId=221", publisherType: "government" },
  { id: "columbia-gorge-discovery-center", title: "Columbia Gorge Discovery Center", url: "https://gorgediscovery.org/", publisherType: "official" },
  { id: "maryhill-museum-source", title: "Maryhill Museum of Art", url: "https://www.maryhillmuseum.org/inside", publisherType: "official" },
  { id: "wa-parks-beacon-rock", title: "Beacon Rock State Park", url: "https://parks.wa.gov/find-parks/state-parks/beacon-rock-state-park", publisherType: "government" },
  { id: "nps-rowena", title: "Rowena Crest Viewpoint", url: "https://www.nps.gov/places/000/rowena-crest-viewpoint.htm", publisherType: "government" },
] as const;

export const columbiaRiverGorgeRoute = {
  id: "columbia-river-gorge-loop",
  slug: "columbia-river-gorge-loop",
  name: "Columbia River Gorge Loop",
  shape: "loop",
  countryCode: "US",
  minDays: 2,
  maxDays: 4,
  summary: "A cross-river Columbia Gorge corridor from the waterfall country east of Portland through Hood River and Maryhill, returning on Washington's north shore. Nearbound surfaces smaller plans inside the full loop.",
} as const;

export const columbiaRiverGorgeTripPlans = [
  { id: "gorge-river-towns", slug: "gorge-river-towns", name: "Gorge river towns", summary: "A west-to-east Gorge escape around Cascade Locks and Hood River, with one waterfall or dam anchor and time to actually use the town base.", startAreaId: "gorge-multnomah-cascade-locks", endAreaId: "gorge-hood-river-mosier", minDays: 2, minDaysWithChildren: 3, maxDays: 3 },
  { id: "gorge-cross-river-loop", slug: "gorge-cross-river-loop", name: "Columbia Gorge loop", summary: "A fuller Oregon-and-Washington Gorge circuit with river towns, viewpoints, history and one intentionally light final day near Beacon Rock.", startAreaId: "gorge-multnomah-cascade-locks", endAreaId: "gorge-stevenson-beacon-rock", minDays: 3, minDaysWithChildren: 4, maxDays: 4 },
] as const;

export const columbiaRiverGorgeRouteLegs = [
  { position: 1, fromAreaId: "gorge-multnomah-cascade-locks", toAreaId: "gorge-hood-river-mosier", distanceMiles: 24, driveMinutes: 35 },
  { position: 2, fromAreaId: "gorge-hood-river-mosier", toAreaId: "gorge-the-dalles-rowena", distanceMiles: 25, driveMinutes: 35 },
  { position: 3, fromAreaId: "gorge-the-dalles-rowena", toAreaId: "gorge-maryhill-goldendale", distanceMiles: 48, driveMinutes: 65 },
  { position: 4, fromAreaId: "gorge-maryhill-goldendale", toAreaId: "gorge-white-salmon-bingen", distanceMiles: 62, driveMinutes: 75 },
  { position: 5, fromAreaId: "gorge-white-salmon-bingen", toAreaId: "gorge-stevenson-beacon-rock", distanceMiles: 42, driveMinutes: 50 },
] as const;

export function sourceForColumbiaRiverGorgeArea(areaId: string) {
  if (areaId === "gorge-multnomah-cascade-locks") return "multnomah-falls-tourism";
  if (areaId === "gorge-hood-river-mosier") return "visit-hood-river";
  if (areaId === "gorge-the-dalles-rowena") return "oregon-parks-rowena";
  if (areaId === "gorge-maryhill-goldendale") return "maryhill-museum-source";
  if (areaId === "gorge-white-salmon-bingen") return "nps-rowena";
  return "wa-parks-beacon-rock";
}

export function sourceForColumbiaRiverGorgeStop(stopId: string) {
  if (stopId === "multnomah-falls") return "multnomah-falls-tourism";
  if (stopId === "bonneville-lock-and-dam") return "usace-bonneville";
  if (stopId === "cascade-locks-waterfront") return "multnomah-falls-tourism";
  if (stopId === "hood-river-downtown-waterfront") return "visit-hood-river";
  if (stopId === "hood-river-waterfront-park") return "port-of-hood-river-waterfront";
  if (stopId === "rowena-crest") return "oregon-parks-rowena";
  if (stopId === "columbia-gorge-discovery-center") return "columbia-gorge-discovery-center";
  if (stopId === "maryhill-museum") return "maryhill-museum-source";
  return "wa-parks-beacon-rock";
}
