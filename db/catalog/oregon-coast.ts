export const CATALOG_VERIFIED_ON = "2026-08-21";
export const CATALOG_REVIEW_DUE_ON = "2027-02-21";

export const oregonCoastAreas = [
  { id: "oregon-coast-astoria", slug: "astoria", name: "Astoria", kind: "town", latitude: 46.1879, longitude: -123.8313, summary: "A maritime gateway where the Columbia River meets the Pacific, with walkable history and an easy first overnight." },
  { id: "oregon-coast-cannon-beach", slug: "cannon-beach", name: "Cannon Beach", kind: "town", latitude: 45.8918, longitude: -123.9615, summary: "A compact beach town with tide-pool landmarks, forested headlands and an easy walkable base." },
  { id: "oregon-coast-nehalem-bay", slug: "nehalem-bay", name: "Nehalem Bay & Manzanita", kind: "coastal_area", latitude: 45.7216, longitude: -123.9362, summary: "A quieter North Coast pause for a long beach, a bay and a less programmed overnight." },
  { id: "oregon-coast-three-capes", slug: "three-capes", name: "Three Capes", kind: "coastal_area", latitude: 45.5257, longitude: -123.9492, summary: "A concentrated stretch of headlands, lighthouse views and coastal forest detours south of Tillamook." },
  { id: "oregon-coast-pacific-city", slug: "pacific-city", name: "Pacific City", kind: "town", latitude: 45.2151, longitude: -123.9648, summary: "A small beach town built around Cape Kiwanda, a dramatic dune and a relaxed ocean-facing stop." },
  { id: "oregon-coast-lincoln-city", slug: "lincoln-city", name: "Lincoln City & Cascade Head", kind: "coastal_area", latitude: 45.0106, longitude: -123.9109, summary: "A practical central-coast base with broad beaches and access to the headlands north of town." },
  { id: "oregon-coast-newport", slug: "newport", name: "Newport", kind: "town", latitude: 44.6368, longitude: -124.0535, summary: "A working harbor town with a real aquarium, lighthouse country and enough indoor options to anchor a multi-day coast trip." },
  { id: "oregon-coast-cape-perpetua", slug: "cape-perpetua-yachats", name: "Yachats & Cape Perpetua", kind: "coastal_area", latitude: 44.291, longitude: -124.108, summary: "A rocky, forested headland area for short walks, powerful surf and one of the coast’s strongest viewpoints." },
  { id: "oregon-coast-florence", slug: "florence-dunes", name: "Florence & the Dunes", kind: "coastal_area", latitude: 43.9826, longitude: -124.0998, summary: "A southern central-coast base pairing Old Town, the Heceta Head area and expansive public dunes." },
  { id: "oregon-coast-coos-bay", slug: "coos-bay-charleston", name: "Coos Bay & Charleston", kind: "coastal_area", latitude: 43.354, longitude: -124.316, summary: "A harbor-and-headlands area where a larger town base meets wave-watching parks and the Cape Arago road." },
  { id: "oregon-coast-bandon", slug: "bandon", name: "Bandon", kind: "town", latitude: 43.119, longitude: -124.408, summary: "A compact South Coast town known for sea stacks, beach viewpoints and a small Old Town." },
  { id: "oregon-coast-port-orford", slug: "port-orford", name: "Port Orford", kind: "town", latitude: 42.7451, longitude: -124.4977, summary: "A quiet working-port pause with exposed headlands and a useful slower-travel break between Bandon and Gold Beach." },
  { id: "oregon-coast-gold-beach", slug: "gold-beach", name: "Gold Beach", kind: "town", latitude: 42.4073, longitude: -124.4218, summary: "A Rogue River gateway with broad beaches and cliff-top scenery on the way toward the far South Coast." },
  { id: "oregon-coast-boardman", slug: "brookings-boardman", name: "Brookings & Boardman", kind: "coastal_area", latitude: 42.0526, longitude: -124.2839, summary: "The far South Coast’s dramatic finish: protected coves, natural bridges and an easy beach-town base." },
] as const;

export const oregonCoastStops = [
  { id: "astoria-riverwalk", slug: "astoria-riverwalk", name: "Astoria Riverwalk", kind: "historic_downtown", areaId: "oregon-coast-astoria", latitude: 46.1883, longitude: -123.8364, typicalDurationMinutes: 90, indoorOutdoor: "mixed", childFit: "good", weatherSensitivity: "medium", summary: "A flexible waterfront walk through Astoria’s working-riverfront history.", preferences: ["city", "historic"] },
  { id: "columbia-river-maritime-museum", slug: "columbia-river-maritime-museum", name: "Columbia River Maritime Museum", kind: "museum", areaId: "oregon-coast-astoria", latitude: 46.1889, longitude: -123.833, typicalDurationMinutes: 120, indoorOutdoor: "indoor", childFit: "good", weatherSensitivity: "low", summary: "An indoor maritime anchor that makes Astoria work in rain or on a slower first day.", preferences: ["city", "ocean"] },
  { id: "fort-stevens-and-peter-iredale", slug: "fort-stevens-peter-iredale", name: "Fort Stevens & Peter Iredale", kind: "park", areaId: "oregon-coast-astoria", latitude: 46.1585, longitude: -123.9652, typicalDurationMinutes: 150, indoorOutdoor: "outdoor", childFit: "good", weatherSensitivity: "medium", summary: "A large coastal park with beach access, historic fort grounds and the visible Peter Iredale shipwreck.", preferences: ["ocean", "forest", "historic"] },
  { id: "haystack-rock", slug: "haystack-rock", name: "Haystack Rock", kind: "viewpoint", areaId: "oregon-coast-cannon-beach", latitude: 45.8848, longitude: -123.9687, typicalDurationMinutes: 75, indoorOutdoor: "outdoor", childFit: "good", weatherSensitivity: "high", summary: "Cannon Beach’s iconic shoreline landmark; tide timing changes what is visible and accessible.", preferences: ["ocean", "animals"] },
  { id: "ecola-state-park", slug: "ecola-state-park", name: "Ecola State Park", kind: "park", areaId: "oregon-coast-cannon-beach", latitude: 45.9185, longitude: -123.9722, typicalDurationMinutes: 120, indoorOutdoor: "outdoor", childFit: "good", weatherSensitivity: "high", summary: "Forested coastal overlooks and beach coves just north of Cannon Beach.", preferences: ["ocean", "forest"] },
  { id: "short-sand-beach", slug: "short-sand-beach", name: "Short Sand Beach", kind: "beach", areaId: "oregon-coast-nehalem-bay", latitude: 45.7631, longitude: -123.9618, typicalDurationMinutes: 120, indoorOutdoor: "outdoor", childFit: "good", weatherSensitivity: "high", summary: "A sheltered beach in Oswald West State Park, framed by coastal forest and popular for an unhurried beach stop.", preferences: ["ocean", "forest"] },
  { id: "nehalem-bay-state-park", slug: "nehalem-bay-state-park", name: "Nehalem Bay State Park", kind: "park", areaId: "oregon-coast-nehalem-bay", latitude: 45.7066, longitude: -123.9324, typicalDurationMinutes: 120, indoorOutdoor: "outdoor", childFit: "good", weatherSensitivity: "medium", summary: "A broad spit between bay and ocean for beach time, gentle walking and a low-pressure reset.", preferences: ["ocean", "forest"] },
  { id: "cape-meares-lighthouse", slug: "cape-meares-lighthouse", name: "Cape Meares Lighthouse", kind: "viewpoint", areaId: "oregon-coast-three-capes", latitude: 45.4871, longitude: -123.9708, typicalDurationMinutes: 75, indoorOutdoor: "outdoor", childFit: "good", weatherSensitivity: "high", summary: "A short lighthouse-and-headland visit on the Three Capes detour.", preferences: ["ocean"] },
  { id: "cape-lookout-trail", slug: "cape-lookout-trail", name: "Cape Lookout Trail", kind: "hike", areaId: "oregon-coast-three-capes", latitude: 45.3444, longitude: -123.9673, typicalDurationMinutes: 210, indoorOutdoor: "outdoor", childFit: "possible", weatherSensitivity: "high", summary: "A longer forested headland hike for travelers who want a dedicated outdoor half-day.", preferences: ["forest", "ocean"] },
  { id: "cape-kiwanda", slug: "cape-kiwanda", name: "Cape Kiwanda", kind: "beach", areaId: "oregon-coast-pacific-city", latitude: 45.2157, longitude: -123.9695, typicalDurationMinutes: 120, indoorOutdoor: "outdoor", childFit: "good", weatherSensitivity: "high", summary: "A dramatic beach-and-dune stop with offshore Haystack Rock and a compact Pacific City base.", preferences: ["ocean"] },
  { id: "cascade-head-lower-trail", slug: "cascade-head-lower-trail", name: "Cascade Head Lower Trail", kind: "hike", areaId: "oregon-coast-lincoln-city", latitude: 45.0705, longitude: -124.0179, typicalDurationMinutes: 180, indoorOutdoor: "outdoor", childFit: "possible", weatherSensitivity: "high", summary: "A headland hike for an active day, separate from the easy beach time in Lincoln City.", preferences: ["forest", "ocean"] },
  { id: "lincoln-city-beach", slug: "lincoln-city-beach", name: "Lincoln City Beach", kind: "beach", areaId: "oregon-coast-lincoln-city", latitude: 44.9584, longitude: -124.0185, typicalDurationMinutes: 120, indoorOutdoor: "outdoor", childFit: "good", weatherSensitivity: "high", summary: "A broad, repeatable beach stop that suits a slower overnight in Lincoln City.", preferences: ["ocean"] },
  { id: "yaquina-head", slug: "yaquina-head", name: "Yaquina Head", kind: "park", areaId: "oregon-coast-newport", latitude: 44.6753, longitude: -124.076, typicalDurationMinutes: 120, indoorOutdoor: "outdoor", childFit: "good", weatherSensitivity: "high", summary: "A lighthouse headland with ocean views, tide pools and a strong wildlife-focused stop near Newport.", preferences: ["ocean", "animals"] },
  { id: "oregon-coast-aquarium", slug: "oregon-coast-aquarium", name: "Oregon Coast Aquarium", kind: "aquarium", areaId: "oregon-coast-newport", latitude: 44.6204, longitude: -124.0473, typicalDurationMinutes: 180, indoorOutdoor: "mixed", childFit: "good", weatherSensitivity: "low", summary: "A substantial indoor-and-outdoor animal anchor that makes Newport useful for families and rainy weather.", preferences: ["animals", "ocean"] },
  { id: "newport-historic-bayfront", slug: "newport-historic-bayfront", name: "Newport Historic Bayfront", kind: "historic_downtown", areaId: "oregon-coast-newport", latitude: 44.6243, longitude: -124.0562, typicalDurationMinutes: 90, indoorOutdoor: "mixed", childFit: "good", weatherSensitivity: "medium", summary: "A working harbor walk with shops, seafood and a flexible lower-effort second stop.", preferences: ["city", "ocean", "historic"] },
  { id: "cape-perpetua-overlook", slug: "cape-perpetua-overlook", name: "Cape Perpetua Overlook", kind: "viewpoint", areaId: "oregon-coast-cape-perpetua", latitude: 44.2777, longitude: -124.108, typicalDurationMinutes: 75, indoorOutdoor: "outdoor", childFit: "good", weatherSensitivity: "high", summary: "A car-accessible high headland viewpoint above the Pacific south of Yachats.", preferences: ["ocean", "forest"] },
  { id: "discovery-loop-trail", slug: "cape-perpetua-discovery-loop", name: "Discovery Loop Trail", kind: "hike", areaId: "oregon-coast-cape-perpetua", latitude: 44.2738, longitude: -124.1106, typicalDurationMinutes: 90, indoorOutdoor: "outdoor", childFit: "possible", weatherSensitivity: "high", summary: "A short interpretive forest trail from the Cape Perpetua visitor-center area.", preferences: ["forest"] },
  { id: "devils-churn", slug: "devils-churn", name: "Devils Churn", kind: "viewpoint", areaId: "oregon-coast-cape-perpetua", latitude: 44.2796, longitude: -124.1131, typicalDurationMinutes: 60, indoorOutdoor: "outdoor", childFit: "good", weatherSensitivity: "high", summary: "A short coastal stop for viewing wave action from maintained overlooks.", preferences: ["ocean"] },
  { id: "heceta-head-lighthouse", slug: "heceta-head-lighthouse", name: "Heceta Head Lighthouse", kind: "viewpoint", areaId: "oregon-coast-florence", latitude: 44.1368, longitude: -124.128, typicalDurationMinutes: 120, indoorOutdoor: "outdoor", childFit: "good", weatherSensitivity: "high", summary: "A lighthouse and beach-viewpoint stop north of Florence with a short walking component.", preferences: ["ocean", "forest"] },
  { id: "oregon-dunes-day-use", slug: "oregon-dunes-day-use", name: "Oregon Dunes Day-Use Area", kind: "park", areaId: "oregon-coast-florence", latitude: 43.9438, longitude: -124.1236, typicalDurationMinutes: 150, indoorOutdoor: "outdoor", childFit: "good", weatherSensitivity: "high", summary: "Public dunes and a walking-focused alternative to motorized recreation south of Florence.", preferences: ["ocean", "forest"] },
  { id: "florence-historic-old-town", slug: "florence-historic-old-town", name: "Florence Historic Old Town", kind: "historic_downtown", areaId: "oregon-coast-florence", latitude: 43.9679, longitude: -124.1066, typicalDurationMinutes: 90, indoorOutdoor: "mixed", childFit: "good", weatherSensitivity: "low", summary: "A compact Siuslaw River waterfront walk that works as the easy part of a Florence day.", preferences: ["city", "ocean", "historic"] },
  { id: "shore-acres-state-park", slug: "shore-acres-state-park", name: "Shore Acres State Park", kind: "park", areaId: "oregon-coast-coos-bay", latitude: 43.3406, longitude: -124.3754, typicalDurationMinutes: 120, indoorOutdoor: "outdoor", childFit: "good", weatherSensitivity: "high", summary: "A formal garden and wave-watching park on the Cape Arago road near Charleston.", preferences: ["ocean", "forest"] },
  { id: "cape-arago-viewpoint", slug: "cape-arago-viewpoint", name: "Cape Arago Viewpoint", kind: "viewpoint", areaId: "oregon-coast-coos-bay", latitude: 43.3041, longitude: -124.4049, typicalDurationMinutes: 60, indoorOutdoor: "outdoor", childFit: "good", weatherSensitivity: "high", summary: "A South Coast headland viewpoint best used as part of a Cape Arago road outing.", preferences: ["ocean", "animals"] },
  { id: "face-rock-scenic-viewpoint", slug: "face-rock-scenic-viewpoint", name: "Face Rock Scenic Viewpoint", kind: "viewpoint", areaId: "oregon-coast-bandon", latitude: 43.1163, longitude: -124.4377, typicalDurationMinutes: 75, indoorOutdoor: "outdoor", childFit: "good", weatherSensitivity: "high", summary: "Bandon’s signature sea-stack viewpoint and an easy beach-edge stop.", preferences: ["ocean"] },
  { id: "bandon-old-town", slug: "bandon-old-town", name: "Bandon Old Town", kind: "historic_downtown", areaId: "oregon-coast-bandon", latitude: 43.1188, longitude: -124.4086, typicalDurationMinutes: 90, indoorOutdoor: "mixed", childFit: "good", weatherSensitivity: "medium", summary: "A small waterfront downtown for a meal, galleries and a lower-effort break from the coast.", preferences: ["city", "ocean", "historic"] },
  { id: "cape-blanco-state-park", slug: "cape-blanco-state-park", name: "Cape Blanco State Park", kind: "park", areaId: "oregon-coast-port-orford", latitude: 42.8404, longitude: -124.5638, typicalDurationMinutes: 120, indoorOutdoor: "outdoor", childFit: "good", weatherSensitivity: "high", summary: "A broad, exposed headland park west of Port Orford with beach and lighthouse access.", preferences: ["ocean", "forest"] },
  { id: "port-orford-heads", slug: "port-orford-heads", name: "Port Orford Heads", kind: "viewpoint", areaId: "oregon-coast-port-orford", latitude: 42.7375, longitude: -124.4978, typicalDurationMinutes: 75, indoorOutdoor: "outdoor", childFit: "good", weatherSensitivity: "high", summary: "A compact headland stop above Port Orford’s working harbor.", preferences: ["ocean"] },
  { id: "cape-sebastian", slug: "cape-sebastian", name: "Cape Sebastian", kind: "viewpoint", areaId: "oregon-coast-gold-beach", latitude: 42.2985, longitude: -124.4374, typicalDurationMinutes: 75, indoorOutdoor: "outdoor", childFit: "good", weatherSensitivity: "high", summary: "A cliff-top South Coast viewpoint between Gold Beach and Port Orford.", preferences: ["ocean", "forest"] },
  { id: "gold-beach-rogue-river", slug: "gold-beach-rogue-river", name: "Gold Beach Rogue Riverfront", kind: "historic_downtown", areaId: "oregon-coast-gold-beach", latitude: 42.4075, longitude: -124.4215, typicalDurationMinutes: 75, indoorOutdoor: "mixed", childFit: "good", weatherSensitivity: "medium", summary: "A practical river-and-ocean pause in the town that connects the Rogue River to the South Coast road trip.", preferences: ["city", "ocean", "historic"] },
  { id: "samuel-h-boardman-corridor", slug: "samuel-h-boardman-corridor", name: "Samuel H. Boardman Scenic Corridor", kind: "park", areaId: "oregon-coast-boardman", latitude: 42.0333, longitude: -124.2185, typicalDurationMinutes: 180, indoorOutdoor: "outdoor", childFit: "possible", weatherSensitivity: "high", summary: "A dramatic chain of viewpoints, coves and short walks along the far South Coast.", preferences: ["ocean", "forest"] },
  { id: "natural-bridges-viewpoint", slug: "natural-bridges-viewpoint", name: "Natural Bridges Viewpoint", kind: "viewpoint", areaId: "oregon-coast-boardman", latitude: 42.088, longitude: -124.2609, typicalDurationMinutes: 60, indoorOutdoor: "outdoor", childFit: "possible", weatherSensitivity: "high", summary: "A Boardman-corridor viewpoint for seeing the coast’s natural sea arches from above.", preferences: ["ocean"] },
  { id: "harris-beach-state-park", slug: "harris-beach-state-park", name: "Harris Beach State Park", kind: "beach", areaId: "oregon-coast-boardman", latitude: 42.0615, longitude: -124.298, typicalDurationMinutes: 120, indoorOutdoor: "outdoor", childFit: "good", weatherSensitivity: "high", summary: "A family-friendly beach base near Brookings with sea stacks and room for a longer unstructured stop.", preferences: ["ocean", "animals"] },
] as const;

export const oregonCoastSources = [
  { id: "travel-oregon-pacific-coast-byway", title: "Pacific Coast Scenic Byway", url: "https://traveloregon.com/things-to-do/trip-ideas/scenic-drives/the-pacific-coast-scenic-byway/", publisherType: "visitor_bureau" },
  { id: "travel-oregon-coast-overview", title: "Oregon Coast", url: "https://traveloregon.com/places-to-go/oregon-coast/", publisherType: "visitor_bureau" },
  { id: "travel-oregon-cannon-beach", title: "Cannon Beach", url: "https://traveloregon.com/places-to-go/cities/cannon-beach/", publisherType: "visitor_bureau" },
  { id: "travel-oregon-newport", title: "Newport", url: "https://traveloregon.com/places-to-go/cities/newport/", publisherType: "visitor_bureau" },
  { id: "travel-oregon-florence", title: "Florence", url: "https://traveloregon.com/places-to-go/cities/florence/", publisherType: "visitor_bureau" },
  { id: "usfs-cape-perpetua", title: "Cape Perpetua Scenic Area", url: "https://www.fs.usda.gov/r06/siuslaw/recreation/cape-perpetua-scenic-area-0", publisherType: "government" },
  { id: "oregon-parks-boardman", title: "Samuel H. Boardman State Scenic Corridor guide", url: "https://oregonstateparks.org/index.cfm?do=main.loadFile&load=_siteFiles%2Fpublications%2F45470_OPRD_Boardman_Brochure%28web%29081813.pdf", publisherType: "government" },
  { id: "oregon-coast-aquarium", title: "Oregon Coast Aquarium", url: "https://aquarium.org/", publisherType: "official" },
  { id: "columbia-river-maritime-museum", title: "Columbia River Maritime Museum", url: "https://www.crmm.org/", publisherType: "official" },
] as const;

export const oregonCoastRoute = {
  id: "oregon-pacific-coast-byway",
  slug: "oregon-pacific-coast-byway",
  name: "Oregon Pacific Coast",
  shape: "linear",
  countryCode: "US",
  minDays: 2,
  maxDays: 4,
  summary: "A north-to-south Oregon Coast planning corridor from Astoria to Brookings. Nearbound turns its connected areas and stops into shorter, realistic trip plans rather than suggesting the full coast at once.",
} as const;

export const oregonCoastTripPlans = [
  {
    id: "north-coast-escape",
    slug: "north-coast-escape",
    name: "North Coast escape",
    summary: "A compact adult-focused overnight around Astoria and Cannon Beach, with enough time for one indoor anchor and one stretch of coast.",
    startAreaId: "oregon-coast-astoria",
    endAreaId: "oregon-coast-cannon-beach",
    minDays: 2,
    minDaysWithChildren: null,
    maxDays: 2,
  },
  {
    id: "north-oregon-coast",
    slug: "north-oregon-coast",
    name: "North Oregon Coast",
    summary: "A fuller Astoria-to-Newport coast trip with room for beaches, a town base and selected anchors instead of racing the whole Oregon shoreline.",
    startAreaId: "oregon-coast-astoria",
    endAreaId: "oregon-coast-newport",
    minDays: 3,
    minDaysWithChildren: 4,
    maxDays: 4,
  },
] as const;

export const oregonCoastRouteLegs = [
  { position: 1, fromAreaId: "oregon-coast-astoria", toAreaId: "oregon-coast-cannon-beach", distanceMiles: 27, driveMinutes: 40 },
  { position: 2, fromAreaId: "oregon-coast-cannon-beach", toAreaId: "oregon-coast-nehalem-bay", distanceMiles: 25, driveMinutes: 35 },
  { position: 3, fromAreaId: "oregon-coast-nehalem-bay", toAreaId: "oregon-coast-three-capes", distanceMiles: 47, driveMinutes: 65 },
  { position: 4, fromAreaId: "oregon-coast-three-capes", toAreaId: "oregon-coast-pacific-city", distanceMiles: 42, driveMinutes: 60 },
  { position: 5, fromAreaId: "oregon-coast-pacific-city", toAreaId: "oregon-coast-lincoln-city", distanceMiles: 25, driveMinutes: 35 },
  { position: 6, fromAreaId: "oregon-coast-lincoln-city", toAreaId: "oregon-coast-newport", distanceMiles: 30, driveMinutes: 45 },
  { position: 7, fromAreaId: "oregon-coast-newport", toAreaId: "oregon-coast-cape-perpetua", distanceMiles: 34, driveMinutes: 50 },
  { position: 8, fromAreaId: "oregon-coast-cape-perpetua", toAreaId: "oregon-coast-florence", distanceMiles: 35, driveMinutes: 50 },
  { position: 9, fromAreaId: "oregon-coast-florence", toAreaId: "oregon-coast-coos-bay", distanceMiles: 50, driveMinutes: 75 },
  { position: 10, fromAreaId: "oregon-coast-coos-bay", toAreaId: "oregon-coast-bandon", distanceMiles: 27, driveMinutes: 40 },
  { position: 11, fromAreaId: "oregon-coast-bandon", toAreaId: "oregon-coast-port-orford", distanceMiles: 57, driveMinutes: 75 },
  { position: 12, fromAreaId: "oregon-coast-port-orford", toAreaId: "oregon-coast-gold-beach", distanceMiles: 49, driveMinutes: 65 },
  { position: 13, fromAreaId: "oregon-coast-gold-beach", toAreaId: "oregon-coast-boardman", distanceMiles: 35, driveMinutes: 50 },
] as const;


export const sourceForOregonCoastStop = (stopId: string) => {
  if (stopId === "columbia-river-maritime-museum") return "columbia-river-maritime-museum";
  if (stopId === "oregon-coast-aquarium") return "oregon-coast-aquarium";
  if (["cape-perpetua-overlook", "discovery-loop-trail", "devils-churn"].includes(stopId)) return "usfs-cape-perpetua";
  if (["samuel-h-boardman-corridor", "natural-bridges-viewpoint"].includes(stopId)) return "oregon-parks-boardman";
  if (["haystack-rock", "ecola-state-park"].includes(stopId)) return "travel-oregon-cannon-beach";
  if (["yaquina-head", "newport-historic-bayfront"].includes(stopId)) return "travel-oregon-newport";
  if (["heceta-head-lighthouse", "oregon-dunes-day-use", "florence-historic-old-town"].includes(stopId)) return "travel-oregon-florence";
  return "travel-oregon-pacific-coast-byway";
};
