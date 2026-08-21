export const MOUNT_RAINIER_VERIFIED_ON = "2026-08-21";
export const MOUNT_RAINIER_REVIEW_DUE_ON = "2027-02-21";

export const mountRainierSouthAreas = [
  { id: "rainier-ashford-nisqually", slug: "ashford-nisqually-entrance", name: "Ashford & Nisqually Entrance", kind: "town", latitude: 46.7585, longitude: -121.8795, summary: "The practical south-gateway base for a Rainier visit, where an early arrival matters more than trying to add another distant park district." },
  { id: "rainier-longmire", slug: "longmire", name: "Longmire", kind: "park", latitude: 46.7511, longitude: -121.8102, summary: "The lower-elevation historic park district: a useful all-season pause when Paradise conditions are not right for the day's main plan." },
  { id: "rainier-paradise", slug: "paradise", name: "Paradise", kind: "park", latitude: 46.7867, longitude: -121.7358, summary: "Rainier's high-elevation visitor area for mountain views and short meadow walks, where road, weather and parking determine the real plan." },
] as const;

export const mountRainierSouthStops = [
  { id: "longmire-museum", slug: "longmire-museum", name: "Longmire Museum", kind: "museum", areaId: "rainier-longmire", latitude: 46.7516, longitude: -121.8116, typicalDurationMinutes: 60, indoorOutdoor: "indoor", childFit: "good", weatherSensitivity: "low", summary: "A small historic and park-orientation stop that makes Longmire a genuine fallback rather than just a road checkpoint.", preferences: ["historic", "city"] },
  { id: "trail-of-the-shadows", slug: "trail-of-the-shadows", name: "Trail of the Shadows", kind: "hike", areaId: "rainier-longmire", latitude: 46.7535, longitude: -121.8096, typicalDurationMinutes: 75, indoorOutdoor: "outdoor", childFit: "good", weatherSensitivity: "medium", summary: "A short Longmire meadow-and-forest loop with historic springs, suited to a lower-elevation family walk.", preferences: ["forest", "historic"] },
  { id: "longmire-suspension-bridge", slug: "longmire-suspension-bridge", name: "Longmire Suspension Bridge", kind: "viewpoint", areaId: "rainier-longmire", latitude: 46.7515, longitude: -121.8078, typicalDurationMinutes: 30, indoorOutdoor: "outdoor", childFit: "good", weatherSensitivity: "medium", summary: "A quick Nisqually River viewpoint that can be paired with Longmire without turning the lower park into a full activity day.", preferences: ["forest", "historic"] },
  { id: "henry-m-jackson-visitor-center", slug: "henry-m-jackson-visitor-center", name: "Henry M. Jackson Visitor Center", kind: "museum", areaId: "rainier-paradise", latitude: 46.7861, longitude: -121.7357, typicalDurationMinutes: 75, indoorOutdoor: "indoor", childFit: "good", weatherSensitivity: "low", summary: "The high-elevation orientation and indoor fallback at Paradise; operating hours remain seasonal and should be checked.", preferences: ["mountains", "historic"] },
  { id: "nisqually-vista-trail", slug: "nisqually-vista-trail", name: "Nisqually Vista Trail", kind: "hike", areaId: "rainier-paradise", latitude: 46.7854, longitude: -121.7408, typicalDurationMinutes: 60, indoorOutdoor: "outdoor", childFit: "good", weatherSensitivity: "high", summary: "A short family-friendly Paradise loop for Nisqually Glacier and meadow views when trail conditions allow.", preferences: ["mountains", "forest"] },
  { id: "paradise-historic-district", slug: "paradise-historic-district", name: "Paradise Historic District", kind: "historic_downtown", areaId: "rainier-paradise", latitude: 46.7867, longitude: -121.7358, typicalDurationMinutes: 60, indoorOutdoor: "mixed", childFit: "good", weatherSensitivity: "medium", summary: "A compact historic walk around the Paradise Inn and visitor area for a lower-effort part of a high-country day.", preferences: ["historic", "mountains"] },
  { id: "reflection-lakes", slug: "reflection-lakes", name: "Reflection Lakes", kind: "viewpoint", areaId: "rainier-paradise", latitude: 46.7595, longitude: -121.7298, typicalDurationMinutes: 60, indoorOutdoor: "outdoor", childFit: "good", weatherSensitivity: "high", summary: "A short roadside lake stop south of Paradise, best kept optional when weather or road conditions make the main mountain plan uncertain.", preferences: ["lake", "mountains", "forest"] },
] as const;

export const mountRainierSouthHikeDetails = [
  { stopId: "trail-of-the-shadows", difficulty: "easy", distanceMiles: 0.7, elevationGainFeet: 0, routeShape: "loop", trailheadLatitude: 46.7535, trailheadLongitude: -121.8096 },
  { stopId: "nisqually-vista-trail", difficulty: "easy", distanceMiles: 1.2, elevationGainFeet: 0, routeShape: "loop", trailheadLatitude: 46.7854, trailheadLongitude: -121.7408 },
] as const;

export const mountRainierSouthSources = [
  { id: "nps-rainier-basic-info", title: "Mount Rainier basic information", url: "https://www.nps.gov/mora/planyourvisit/basicinfo.htm", publisherType: "government" },
  { id: "nps-rainier-longmire", title: "Historic Longmire Area", url: "https://www.nps.gov/mora/learn/historyculture/historic-longmire-area.htm", publisherType: "government" },
  { id: "nps-rainier-longmire-accessibility", title: "Longmire accessibility", url: "https://www.nps.gov/mora/planyourvisit/longmire-accessibility.htm", publisherType: "government" },
  { id: "nps-rainier-paradise", title: "Paradise Visitor Guide", url: "https://www.nps.gov/mora/planyourvisit/paradise-basic-info.htm", publisherType: "government" },
  { id: "nps-rainier-day-hiking", title: "Day hiking at Mount Rainier", url: "https://www.nps.gov/mora/planyourvisit/day-hiking-at-mount-rainier.htm", publisherType: "government" },
  { id: "nps-rainier-hours", title: "Mount Rainier operating hours and seasons", url: "https://www.nps.gov/mora/planyourvisit/hours.htm", publisherType: "government" },
] as const;

export const mountRainierSouthRoute = {
  id: "mount-rainier-south-gateway",
  slug: "mount-rainier-south-gateway",
  name: "Mount Rainier South Gateway",
  shape: "linear",
  countryCode: "US",
  minDays: 1,
  maxDays: 3,
  summary: "A focused south-side Mount Rainier corridor from Ashford to Paradise. Nearbound treats Longmire as a useful lower-elevation alternative, not a reason to pack every stop into a mountain day.",
} as const;

export const mountRainierSouthTripPlans = [
  { id: "rainier-mountain-day", slug: "rainier-mountain-day", name: "Rainier mountain day", summary: "A focused adult day for one Paradise walk or viewpoint, with Longmire as the sensible weather and energy fallback.", startAreaId: "rainier-ashford-nisqually", endAreaId: "rainier-paradise", minDays: 1, minDaysWithChildren: null, maxDays: 1 },
  { id: "rainier-slow-stay", slug: "rainier-slow-stay", name: "Rainier slow stay", summary: "A two- or three-day south-Rainier stay with time for Longmire, a single high-country outing and no pressure to drive to a second park district.", startAreaId: "rainier-ashford-nisqually", endAreaId: "rainier-paradise", minDays: 2, minDaysWithChildren: 2, maxDays: 3 },
] as const;

export const mountRainierSouthRouteLegs = [
  { position: 1, fromAreaId: "rainier-ashford-nisqually", toAreaId: "rainier-longmire", distanceMiles: 16, driveMinutes: 30 },
  { position: 2, fromAreaId: "rainier-longmire", toAreaId: "rainier-paradise", distanceMiles: 18, driveMinutes: 45 },
] as const;

export function sourceForMountRainierSouthArea(areaId: string) {
  if (areaId === "rainier-longmire") return "nps-rainier-longmire";
  if (areaId === "rainier-paradise") return "nps-rainier-paradise";
  return "nps-rainier-basic-info";
}

export function sourceForMountRainierSouthStop(stopId: string) {
  if (["longmire-museum", "trail-of-the-shadows"].includes(stopId)) return "nps-rainier-longmire";
  if (stopId === "longmire-suspension-bridge") return "nps-rainier-longmire-accessibility";
  if (["nisqually-vista-trail", "reflection-lakes"].includes(stopId)) return "nps-rainier-day-hiking";
  return "nps-rainier-paradise";
}
