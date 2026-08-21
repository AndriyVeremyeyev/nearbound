import { inArray, or, sql } from "drizzle-orm";

import {
  destinationPreferences,
  destinations,
  areaStops,
  areas,
  catalogEvidence,
  catalogSources,
  hikeDetails,
  origins,
  preferences,
  routeWaypoints,
  routes,
  routeEstimates,
  routeLegs,
  sourceReferences,
  stopPreferences,
  stops,
} from "./schema";
import { loadLocalEnvironment } from "./load-local-env";

const preferenceSeeds = [
  { id: "ocean", label: "Ocean", sortOrder: 1 },
  { id: "animals", label: "Animals", sortOrder: 2 },
  { id: "city", label: "City", sortOrder: 3 },
  { id: "resort", label: "Easy resort", sortOrder: 4 },
  { id: "mountains", label: "Mountains", sortOrder: 5 },
  { id: "forest", label: "Forest", sortOrder: 6 },
];

type DestinationSourceSeed = Pick<
  typeof sourceReferences.$inferInsert,
  "title" | "url" | "sourceType" | "confidence" | "notes"
>;

type DestinationSeed = typeof destinations.$inferInsert & {
  durationMinutes: number;
  preferenceIds: string[];
  usesFerry?: boolean;
  crossesBorder?: boolean;
  sourceReference: DestinationSourceSeed;
};

const SOURCE_VERIFIED_ON = "2026-08-19";

const destinationSeeds: DestinationSeed[] = [
  {
    id: "point-defiance",
    name: "Point Defiance",
    region: "Tacoma, WA",
    countryCode: "US",
    latitude: 47.3041,
    longitude: -122.5275,
    minDays: 1,
    maxDays: 2,
    familyFit: 10,
    weatherBackup: 9,
    summary:
      "A zoo and two aquariums in one compact day, with a carousel and a real indoor fallback.",
    anchor:
      "Pacific Seas Aquarium before lunch; Kids’ Zone after the toddler break.",
    stay: "Make it a day trip, or choose a Tacoma hotel with a pool.",
    caution: "Arrive early and keep the afternoon intentionally light.",
    published: true,
    durationMinutes: 72,
    preferenceIds: ["animals", "ocean", "city"],
    sourceReference: {
      title: "Point Defiance Zoo & Aquarium",
      url: "https://www.pdza.org/",
      sourceType: "official",
      confidence: "high",
      notes: "Official attraction website used for the visitor-planning anchor.",
    },
  },
  {
    id: "northwest-trek",
    name: "Northwest Trek",
    region: "Eatonville, WA",
    countryCode: "US",
    latitude: 46.8648,
    longitude: -122.2332,
    minDays: 1,
    maxDays: 2,
    familyFit: 10,
    weatherBackup: 6,
    summary:
      "The strongest big-animal day trip without putting the family car inside an animal enclosure.",
    anchor:
      "Discovery Tram first, then Kids’ Trek while everyone still has energy.",
    stay: "Usually best as a day trip from home.",
    caution:
      "Tram times are first come, first served—opening time matters.",
    published: true,
    durationMinutes: 108,
    preferenceIds: ["animals", "forest", "mountains"],
    sourceReference: {
      title: "Northwest Trek Wildlife Park",
      url: "https://www.nwtrek.org/",
      sourceType: "official",
      confidence: "high",
      notes: "Official attraction website used for the visitor-planning anchor.",
    },
  },
  {
    id: "ocean-shores",
    name: "Ocean Shores",
    region: "Washington coast",
    countryCode: "US",
    latitude: 46.9737,
    longitude: -124.1563,
    minDays: 2,
    maxDays: 4,
    familyFit: 9,
    weatherBackup: 7,
    summary:
      "A simple ocean reset: repeatable beach time, room for naps, and no pressure to sightsee.",
    anchor:
      "One unhurried beach window, then pool or playroom after the nap.",
    stay: "Oyhut Bay cottage or condo with a kitchen and separate sleep space.",
    caution:
      "Wind and cold water make the quality of the house more important than the view.",
    published: true,
    durationMinutes: 174,
    preferenceIds: ["ocean", "resort"],
    sourceReference: {
      title: "Tourism Ocean Shores",
      url: "https://tourismoceanshores.com/",
      sourceType: "official",
      confidence: "high",
      notes: "Official visitor guide used for destination framing.",
    },
  },
  {
    id: "bellingham",
    name: "Bellingham",
    region: "Bellingham, WA",
    countryCode: "US",
    latitude: 48.7519,
    longitude: -122.4787,
    minDays: 1,
    maxDays: 3,
    familyFit: 8,
    weatherBackup: 9,
    summary:
      "A forgiving mix of waterfront, a small marine center, playgrounds, food, and rain-safe options.",
    anchor:
      "Marine Life Center plus Boulevard Park; Fairhaven becomes the easy second stop.",
    stay: "Waterfront hotel or a Fairhaven base within walking distance of dinner.",
    caution: "The marine center is a bonus, not a full-size aquarium.",
    published: true,
    durationMinutes: 132,
    preferenceIds: ["city", "ocean", "animals", "forest"],
    sourceReference: {
      title: "Visit Bellingham",
      url: "https://www.bellingham.org/",
      sourceType: "official",
      confidence: "high",
      notes: "Official visitor guide used for destination framing.",
    },
  },
  {
    id: "alderbrook",
    name: "Alderbrook",
    region: "Hood Canal, WA",
    countryCode: "US",
    latitude: 47.3495,
    longitude: -123.1518,
    minDays: 2,
    maxDays: 4,
    familyFit: 9,
    weatherBackup: 8,
    summary:
      "The comfortable-waterfront option: one base, a pool, easy meals, and small outings instead of a checklist.",
    anchor:
      "Resort morning, one short Hood Canal outing, then back for the pool.",
    stay: "A two-bedroom cottage with kitchen access and room for four real sleepers.",
    caution: "Confirm pool access for the exact rate before paying.",
    published: true,
    durationMinutes: 132,
    preferenceIds: ["ocean", "resort", "forest"],
    sourceReference: {
      title: "Alderbrook Resort & Spa",
      url: "https://www.alderbrookresort.com/",
      sourceType: "official",
      confidence: "high",
      notes: "Official property website used for the stay recommendation.",
    },
  },
  {
    id: "great-wolf",
    name: "Great Wolf Lodge",
    region: "Grand Mound, WA",
    countryCode: "US",
    latitude: 46.7955,
    longitude: -123.0109,
    minDays: 1,
    maxDays: 3,
    familyFit: 9,
    weatherBackup: 10,
    summary:
      "A high-certainty bad-weather reset where the hotel itself is the trip.",
    anchor:
      "One water-park session, a quiet break, then only low-key resort activities.",
    stay: "Family suite away from elevators, with a protected toddler nap window.",
    caution: "It can be overstimulating; plan an explicit quiet exit route.",
    published: true,
    durationMinutes: 96,
    preferenceIds: ["resort", "city"],
    sourceReference: {
      title: "Great Wolf Lodge Grand Mound",
      url: "https://www.greatwolf.com/grand-mound",
      sourceType: "official",
      confidence: "high",
      notes: "Official property website used for the stay recommendation.",
    },
  },
  {
    id: "suncadia",
    name: "Suncadia",
    region: "Cle Elum, WA",
    countryCode: "US",
    latitude: 47.2099,
    longitude: -121.0107,
    minDays: 2,
    maxDays: 4,
    familyFit: 9,
    weatherBackup: 8,
    summary:
      "The easiest mountain-resort switch: short drive, pool-centered stay, and no need to chase attractions.",
    anchor:
      "Pool first; add Roslyn or one easy outdoor stop only if energy is good.",
    stay: "Condo or vacation home with a kitchen and verified pool access.",
    caution:
      "Amenities vary by booking channel—verify what is actually included.",
    published: true,
    durationMinutes: 90,
    preferenceIds: ["resort", "mountains", "forest"],
    sourceReference: {
      title: "Suncadia Resort",
      url: "https://suncadia.com/",
      sourceType: "official",
      confidence: "high",
      notes: "Official property website used for the stay recommendation.",
    },
  },
  {
    id: "leavenworth",
    name: "Leavenworth",
    region: "Cascade Mountains, WA",
    countryCode: "US",
    latitude: 47.5962,
    longitude: -120.6615,
    minDays: 2,
    maxDays: 4,
    familyFit: 8,
    weatherBackup: 7,
    summary:
      "A walkable town, reliable food, family lodging, and mountain scenery without making hiking the whole trip.",
    anchor:
      "Front Street and Waterfront Park, with mini-golf or pool as the child anchor.",
    stay: "A family condo with a kitchen and separate bedroom.",
    caution:
      "US-2 traffic and winter pass conditions can change the equation fast.",
    published: true,
    durationMinutes: 162,
    preferenceIds: ["city", "mountains", "resort"],
    sourceReference: {
      title: "Leavenworth Chamber of Commerce",
      url: "https://leavenworth.org/",
      sourceType: "official",
      confidence: "high",
      notes: "Official visitor guide used for destination framing.",
    },
  },
  {
    id: "vancouver",
    name: "Vancouver Aquarium",
    region: "Vancouver, BC",
    countryCode: "CA",
    latitude: 49.3000,
    longitude: -123.1300,
    minDays: 2,
    maxDays: 4,
    familyFit: 10,
    weatherBackup: 10,
    summary:
      "The best full-size aquarium within a long-drive weekend, backed by a genuinely kid-friendly city.",
    anchor:
      "Aquarium as the only must-do; Stanley Park and the hotel pool stay optional.",
    stay: "Suite near Stanley Park with a kitchen and parking included.",
    caution:
      "Passports, border variability, and parking make this a two-night trip.",
    published: true,
    durationMinutes: 198,
    crossesBorder: true,
    preferenceIds: ["animals", "city", "ocean"],
    sourceReference: {
      title: "Vancouver Aquarium",
      url: "https://www.vanaqua.org/",
      sourceType: "official",
      confidence: "high",
      notes: "Official attraction website used for the visitor-planning anchor.",
    },
  },
  {
    id: "seabrook",
    name: "Seabrook",
    region: "Pacific Beach, WA",
    countryCode: "US",
    latitude: 47.0123,
    longitude: -124.1612,
    minDays: 3,
    maxDays: 4,
    familyFit: 9,
    weatherBackup: 9,
    summary:
      "A beach town designed around the stay: full house, pools, playgrounds, food, and ocean on foot.",
    anchor:
      "Beach in the morning, a protected quiet block, then pool or playground.",
    stay: "Official vacation rental with kitchen, laundry, and confirmed pool access.",
    caution:
      "For a three-hour-plus drive, the extra day is what makes the trip feel easy.",
    published: true,
    durationMinutes: 204,
    preferenceIds: ["ocean", "resort"],
    sourceReference: {
      title: "Seabrook Washington",
      url: "https://www.seabrookwa.com/",
      sourceType: "official",
      confidence: "high",
      notes: "Official destination website used for the stay recommendation.",
    },
  },
  {
    id: "sequim",
    name: "Sequim",
    region: "Olympic Peninsula, WA",
    countryCode: "US",
    latitude: 48.0795,
    longitude: -123.1018,
    minDays: 2,
    maxDays: 3,
    familyFit: 8,
    weatherBackup: 6,
    summary:
      "Animals, a drier climate, and a manageable waterfront base on the Olympic Peninsula.",
    anchor:
      "Olympic Game Farm or waterfront—not both as mandatory anchors.",
    stay: "Hotel or cottage in Sequim with simple meals nearby.",
    caution: "Drive-through animals can scratch mirrors or bodywork.",
    published: true,
    durationMinutes: 156,
    usesFerry: true,
    preferenceIds: ["animals", "ocean", "resort"],
    sourceReference: {
      title: "Olympic Game Farm",
      url: "https://olygamefarm.com/",
      sourceType: "official",
      confidence: "high",
      notes: "Official attraction website used for the visitor-planning anchor.",
    },
  },
  {
    id: "long-beach",
    name: "Long Beach",
    region: "Long Beach, WA",
    countryCode: "US",
    latitude: 46.3523,
    longitude: -124.0543,
    minDays: 2,
    maxDays: 4,
    familyFit: 8,
    weatherBackup: 7,
    summary:
      "A classic long beach, kites, and a compact tourist town that earns the drive with an overnight stay.",
    anchor:
      "Kites and beach time, with the town as the weather fallback.",
    stay: "Beach hotel or cottage with a real second sleeping zone.",
    caution: "Too far for a satisfying same-day return with small children.",
    published: true,
    durationMinutes: 210,
    preferenceIds: ["ocean", "resort", "city"],
    sourceReference: {
      title: "Washington's Evergreen Coast",
      url: "https://www.evergreencoastwa.com/",
      sourceType: "official",
      confidence: "high",
      notes: "Official visitor guide used for destination framing.",
    },
  },
  {
    id: "gig-harbor",
    name: "Gig Harbor",
    region: "Gig Harbor, WA",
    countryCode: "US",
    latitude: 47.3293,
    longitude: -122.5801,
    minDays: 1,
    maxDays: 2,
    familyFit: 8,
    weatherBackup: 6,
    summary:
      "An easy waterfront reset with a walkable harbor, parks, and enough food stops to keep a family day loose.",
    anchor:
      "Harborfront walk and one museum or park stop—leave the rest of the afternoon unscheduled.",
    stay: "Make it a day trip, or book one night close to the harbor.",
    caution:
      "Tacoma Narrows traffic can erase the advantage of the short distance on peak weekends.",
    published: true,
    durationMinutes: 78,
    preferenceIds: ["ocean", "city"],
    sourceReference: {
      title: "Visit Gig Harbor",
      url: "https://visitgigharbor.com/",
      sourceType: "official",
      confidence: "high",
      notes: "Official visitor guide used for destination framing.",
    },
  },
  {
    id: "whidbey-island",
    name: "Whidbey Island",
    region: "South Whidbey, WA",
    countryCode: "US",
    latitude: 48.0409,
    longitude: -122.4085,
    minDays: 1,
    maxDays: 3,
    familyFit: 8,
    weatherBackup: 6,
    summary:
      "A real island change of pace without a long vacation: beaches, small towns, forest, and one unavoidable ferry decision.",
    anchor:
      "Choose one Langley or beach stop, then leave room for the ferry and an unhurried meal.",
    stay: "A cottage or inn near Langley keeps the second day simple.",
    caution:
      "Ferry waits and weekend sailing demand can make a short itinerary feel rushed.",
    published: true,
    durationMinutes: 108,
    usesFerry: true,
    preferenceIds: ["ocean", "forest", "city"],
    sourceReference: {
      title: "Whidbey and Camano Islands",
      url: "https://whidbeycamanoislands.com/",
      sourceType: "official",
      confidence: "high",
      notes: "Official visitor guide used for destination framing.",
    },
  },
  {
    id: "port-townsend",
    name: "Port Townsend",
    region: "Olympic Peninsula, WA",
    countryCode: "US",
    latitude: 48.1181,
    longitude: -122.7604,
    minDays: 2,
    maxDays: 3,
    familyFit: 8,
    weatherBackup: 7,
    summary:
      "A historic waterfront town that pairs beaches and Fort Worden with restaurants, bookstores, and an easy overnight rhythm.",
    anchor:
      "Fort Worden or the waterfront—not both as a packed checklist—then dinner near Water Street.",
    stay: "Stay within town so the car can rest after arrival.",
    caution:
      "The peninsula drive earns an overnight; do not treat this as a casual late-afternoon outing.",
    published: true,
    durationMinutes: 150,
    preferenceIds: ["ocean", "city", "forest"],
    sourceReference: {
      title: "Enjoy Port Townsend",
      url: "https://enjoypt.com/",
      sourceType: "official",
      confidence: "high",
      notes: "Official visitor guide used for destination framing.",
    },
  },
  {
    id: "mount-rainier",
    name: "Mount Rainier National Park",
    region: "Ashford, WA",
    countryCode: "US",
    latitude: 46.7585,
    longitude: -121.8795,
    minDays: 1,
    maxDays: 3,
    familyFit: 7,
    weatherBackup: 3,
    summary:
      "The high-payoff mountain day: ancient forest and big scenery when conditions cooperate, with little indoor fallback.",
    anchor:
      "Pick one short family-friendly trail and a picnic; treat the biggest views as a bonus, not a promise.",
    stay: "Ashford works for an early start and an unhurried return the next morning.",
    caution:
      "Road access, parking, and mountain weather can change quickly—verify the park status before leaving.",
    published: true,
    durationMinutes: 150,
    preferenceIds: ["mountains", "forest"],
    sourceReference: {
      title: "Mount Rainier National Park",
      url: "https://www.nps.gov/mora/index.htm",
      sourceType: "official",
      confidence: "high",
      notes: "National Park Service source used for visitor-planning context.",
    },
  },
  {
    id: "lake-chelan",
    name: "Lake Chelan",
    region: "Chelan, WA",
    countryCode: "US",
    latitude: 47.8405,
    longitude: -120.0160,
    minDays: 2,
    maxDays: 4,
    familyFit: 8,
    weatherBackup: 8,
    summary:
      "A sunny lake-resort weekend with water time, a compact town, and enough easy activities to make a longer drive worthwhile.",
    anchor:
      "Choose one beach or water block, then use the waterfront and pool as the low-effort second act.",
    stay: "A condo or resort with a kitchen and swim access makes the two-night minimum work.",
    caution:
      "The drive is long for a one-night reset, and summer lodging fills early.",
    published: true,
    durationMinutes: 210,
    preferenceIds: ["resort", "mountains", "city"],
    sourceReference: {
      title: "Lake Chelan Chamber of Commerce",
      url: "https://www.lakechelan.com/",
      sourceType: "official",
      confidence: "high",
      notes: "Official visitor guide used for destination framing.",
    },
  },
  {
    id: "anacortes",
    name: "Anacortes",
    region: "Fidalgo Island, WA",
    countryCode: "US",
    latitude: 48.5126,
    longitude: -122.6127,
    minDays: 1,
    maxDays: 3,
    familyFit: 8,
    weatherBackup: 6,
    summary:
      "A compact Salish Sea town with beaches, trails, and a real island feel—without needing a ferry for the destination itself.",
    anchor:
      "Washington Park or Cap Sante, then a short waterfront dinner instead of trying to chase every viewpoint.",
    stay: "A downtown or waterfront base supports an easy second day.",
    caution:
      "Windy coastal weather can narrow the outdoor plan, and this is not a substitute for a San Juan itinerary.",
    published: true,
    durationMinutes: 132,
    preferenceIds: ["ocean", "forest", "city"],
    sourceReference: {
      title: "Experience Anacortes",
      url: "https://www.anacortes.org/about-anacortes/",
      sourceType: "official",
      confidence: "high",
      notes: "Official visitor guide used for destination framing.",
    },
  },
];

loadLocalEnvironment();

const CATALOG_VERIFIED_ON = "2026-08-21";
const CATALOG_REVIEW_DUE_ON = "2027-02-21";

const oregonCoastAreas = [
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

const oregonCoastStops = [
  { id: "astoria-riverwalk", slug: "astoria-riverwalk", name: "Astoria Riverwalk", kind: "historic_downtown", areaId: "oregon-coast-astoria", latitude: 46.1883, longitude: -123.8364, typicalDurationMinutes: 90, indoorOutdoor: "mixed", childFit: "good", weatherSensitivity: "medium", summary: "A flexible waterfront walk through Astoria’s working-riverfront history.", preferences: ["city"] },
  { id: "columbia-river-maritime-museum", slug: "columbia-river-maritime-museum", name: "Columbia River Maritime Museum", kind: "museum", areaId: "oregon-coast-astoria", latitude: 46.1889, longitude: -123.833, typicalDurationMinutes: 120, indoorOutdoor: "indoor", childFit: "good", weatherSensitivity: "low", summary: "An indoor maritime anchor that makes Astoria work in rain or on a slower first day.", preferences: ["city", "ocean"] },
  { id: "fort-stevens-and-peter-iredale", slug: "fort-stevens-peter-iredale", name: "Fort Stevens & Peter Iredale", kind: "park", areaId: "oregon-coast-astoria", latitude: 46.1585, longitude: -123.9652, typicalDurationMinutes: 150, indoorOutdoor: "outdoor", childFit: "good", weatherSensitivity: "medium", summary: "A large coastal park with beach access, historic fort grounds and the visible Peter Iredale shipwreck.", preferences: ["ocean", "forest"] },
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
  { id: "newport-historic-bayfront", slug: "newport-historic-bayfront", name: "Newport Historic Bayfront", kind: "historic_downtown", areaId: "oregon-coast-newport", latitude: 44.6243, longitude: -124.0562, typicalDurationMinutes: 90, indoorOutdoor: "mixed", childFit: "good", weatherSensitivity: "medium", summary: "A working harbor walk with shops, seafood and a flexible lower-effort second stop.", preferences: ["city", "ocean"] },
  { id: "cape-perpetua-overlook", slug: "cape-perpetua-overlook", name: "Cape Perpetua Overlook", kind: "viewpoint", areaId: "oregon-coast-cape-perpetua", latitude: 44.2777, longitude: -124.108, typicalDurationMinutes: 75, indoorOutdoor: "outdoor", childFit: "good", weatherSensitivity: "high", summary: "A car-accessible high headland viewpoint above the Pacific south of Yachats.", preferences: ["ocean", "forest"] },
  { id: "discovery-loop-trail", slug: "cape-perpetua-discovery-loop", name: "Discovery Loop Trail", kind: "hike", areaId: "oregon-coast-cape-perpetua", latitude: 44.2738, longitude: -124.1106, typicalDurationMinutes: 90, indoorOutdoor: "outdoor", childFit: "possible", weatherSensitivity: "high", summary: "A short interpretive forest trail from the Cape Perpetua visitor-center area.", preferences: ["forest"] },
  { id: "devils-churn", slug: "devils-churn", name: "Devils Churn", kind: "viewpoint", areaId: "oregon-coast-cape-perpetua", latitude: 44.2796, longitude: -124.1131, typicalDurationMinutes: 60, indoorOutdoor: "outdoor", childFit: "good", weatherSensitivity: "high", summary: "A short coastal stop for viewing wave action from maintained overlooks.", preferences: ["ocean"] },
  { id: "heceta-head-lighthouse", slug: "heceta-head-lighthouse", name: "Heceta Head Lighthouse", kind: "viewpoint", areaId: "oregon-coast-florence", latitude: 44.1368, longitude: -124.128, typicalDurationMinutes: 120, indoorOutdoor: "outdoor", childFit: "good", weatherSensitivity: "high", summary: "A lighthouse and beach-viewpoint stop north of Florence with a short walking component.", preferences: ["ocean", "forest"] },
  { id: "oregon-dunes-day-use", slug: "oregon-dunes-day-use", name: "Oregon Dunes Day-Use Area", kind: "park", areaId: "oregon-coast-florence", latitude: 43.9438, longitude: -124.1236, typicalDurationMinutes: 150, indoorOutdoor: "outdoor", childFit: "good", weatherSensitivity: "high", summary: "Public dunes and a walking-focused alternative to motorized recreation south of Florence.", preferences: ["ocean", "forest"] },
  { id: "florence-historic-old-town", slug: "florence-historic-old-town", name: "Florence Historic Old Town", kind: "historic_downtown", areaId: "oregon-coast-florence", latitude: 43.9679, longitude: -124.1066, typicalDurationMinutes: 90, indoorOutdoor: "mixed", childFit: "good", weatherSensitivity: "low", summary: "A compact Siuslaw River waterfront walk that works as the easy part of a Florence day.", preferences: ["city", "ocean"] },
  { id: "shore-acres-state-park", slug: "shore-acres-state-park", name: "Shore Acres State Park", kind: "park", areaId: "oregon-coast-coos-bay", latitude: 43.3406, longitude: -124.3754, typicalDurationMinutes: 120, indoorOutdoor: "outdoor", childFit: "good", weatherSensitivity: "high", summary: "A formal garden and wave-watching park on the Cape Arago road near Charleston.", preferences: ["ocean", "forest"] },
  { id: "cape-arago-viewpoint", slug: "cape-arago-viewpoint", name: "Cape Arago Viewpoint", kind: "viewpoint", areaId: "oregon-coast-coos-bay", latitude: 43.3041, longitude: -124.4049, typicalDurationMinutes: 60, indoorOutdoor: "outdoor", childFit: "good", weatherSensitivity: "high", summary: "A South Coast headland viewpoint best used as part of a Cape Arago road outing.", preferences: ["ocean", "animals"] },
  { id: "face-rock-scenic-viewpoint", slug: "face-rock-scenic-viewpoint", name: "Face Rock Scenic Viewpoint", kind: "viewpoint", areaId: "oregon-coast-bandon", latitude: 43.1163, longitude: -124.4377, typicalDurationMinutes: 75, indoorOutdoor: "outdoor", childFit: "good", weatherSensitivity: "high", summary: "Bandon’s signature sea-stack viewpoint and an easy beach-edge stop.", preferences: ["ocean"] },
  { id: "bandon-old-town", slug: "bandon-old-town", name: "Bandon Old Town", kind: "historic_downtown", areaId: "oregon-coast-bandon", latitude: 43.1188, longitude: -124.4086, typicalDurationMinutes: 90, indoorOutdoor: "mixed", childFit: "good", weatherSensitivity: "medium", summary: "A small waterfront downtown for a meal, galleries and a lower-effort break from the coast.", preferences: ["city", "ocean"] },
  { id: "cape-blanco-state-park", slug: "cape-blanco-state-park", name: "Cape Blanco State Park", kind: "park", areaId: "oregon-coast-port-orford", latitude: 42.8404, longitude: -124.5638, typicalDurationMinutes: 120, indoorOutdoor: "outdoor", childFit: "good", weatherSensitivity: "high", summary: "A broad, exposed headland park west of Port Orford with beach and lighthouse access.", preferences: ["ocean", "forest"] },
  { id: "port-orford-heads", slug: "port-orford-heads", name: "Port Orford Heads", kind: "viewpoint", areaId: "oregon-coast-port-orford", latitude: 42.7375, longitude: -124.4978, typicalDurationMinutes: 75, indoorOutdoor: "outdoor", childFit: "good", weatherSensitivity: "high", summary: "A compact headland stop above Port Orford’s working harbor.", preferences: ["ocean"] },
  { id: "cape-sebastian", slug: "cape-sebastian", name: "Cape Sebastian", kind: "viewpoint", areaId: "oregon-coast-gold-beach", latitude: 42.2985, longitude: -124.4374, typicalDurationMinutes: 75, indoorOutdoor: "outdoor", childFit: "good", weatherSensitivity: "high", summary: "A cliff-top South Coast viewpoint between Gold Beach and Port Orford.", preferences: ["ocean", "forest"] },
  { id: "gold-beach-rogue-river", slug: "gold-beach-rogue-river", name: "Gold Beach Rogue Riverfront", kind: "historic_downtown", areaId: "oregon-coast-gold-beach", latitude: 42.4075, longitude: -124.4215, typicalDurationMinutes: 75, indoorOutdoor: "mixed", childFit: "good", weatherSensitivity: "medium", summary: "A practical river-and-ocean pause in the town that connects the Rogue River to the South Coast road trip.", preferences: ["city", "ocean"] },
  { id: "samuel-h-boardman-corridor", slug: "samuel-h-boardman-corridor", name: "Samuel H. Boardman Scenic Corridor", kind: "park", areaId: "oregon-coast-boardman", latitude: 42.0333, longitude: -124.2185, typicalDurationMinutes: 180, indoorOutdoor: "outdoor", childFit: "possible", weatherSensitivity: "high", summary: "A dramatic chain of viewpoints, coves and short walks along the far South Coast.", preferences: ["ocean", "forest"] },
  { id: "natural-bridges-viewpoint", slug: "natural-bridges-viewpoint", name: "Natural Bridges Viewpoint", kind: "viewpoint", areaId: "oregon-coast-boardman", latitude: 42.088, longitude: -124.2609, typicalDurationMinutes: 60, indoorOutdoor: "outdoor", childFit: "possible", weatherSensitivity: "high", summary: "A Boardman-corridor viewpoint for seeing the coast’s natural sea arches from above.", preferences: ["ocean"] },
  { id: "harris-beach-state-park", slug: "harris-beach-state-park", name: "Harris Beach State Park", kind: "beach", areaId: "oregon-coast-boardman", latitude: 42.0615, longitude: -124.298, typicalDurationMinutes: 120, indoorOutdoor: "outdoor", childFit: "good", weatherSensitivity: "high", summary: "A family-friendly beach base near Brookings with sea stacks and room for a longer unstructured stop.", preferences: ["ocean", "animals"] },
] as const;

const oregonCoastSources = [
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

const oregonCoastRoute = {
  id: "oregon-pacific-coast-byway",
  slug: "oregon-pacific-coast-byway",
  name: "Oregon Pacific Coast",
  shape: "linear",
  countryCode: "US",
  minDays: 6,
  maxDays: 10,
  summary: "A north-to-south Oregon Coast road trip from Astoria to Brookings. Its 14 areas and optional anchors can support a slower coast reset or a more active multi-stop itinerary.",
} as const;

const oregonCoastRouteLegs = [
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

const { getDatabase } = await import("@/lib/db/client");
const database = getDatabase();
const now = new Date();

await database
  .insert(preferences)
  .values(preferenceSeeds)
  .onConflictDoUpdate({
    target: preferences.id,
    set: {
      label: sql`excluded.label`,
      sortOrder: sql`excluded.sort_order`,
    },
  });

await database
  .insert(origins)
  .values({
    id: "issaquah-wa",
    name: "Issaquah",
    region: "Washington",
    countryCode: "US",
    latitude: 47.5301,
    longitude: -122.0326,
    isDefault: true,
  })
  .onConflictDoUpdate({
    target: origins.id,
    set: {
      name: "Issaquah",
      region: "Washington",
      countryCode: "US",
      latitude: 47.5301,
      longitude: -122.0326,
      isDefault: true,
    },
  });

await database
  .insert(destinations)
  .values(
    destinationSeeds.map((destination) => ({
      id: destination.id,
      name: destination.name,
      region: destination.region,
      countryCode: destination.countryCode,
      latitude: destination.latitude,
      longitude: destination.longitude,
      minDays: destination.minDays,
      maxDays: destination.maxDays,
      familyFit: destination.familyFit,
      weatherBackup: destination.weatherBackup,
      summary: destination.summary,
      anchor: destination.anchor,
      stay: destination.stay,
      caution: destination.caution,
      published: destination.published,
      updatedAt: now,
    })),
  )
  .onConflictDoUpdate({
    target: destinations.id,
    set: {
      name: sql`excluded.name`,
      region: sql`excluded.region`,
      countryCode: sql`excluded.country_code`,
      latitude: sql`excluded.latitude`,
      longitude: sql`excluded.longitude`,
      minDays: sql`excluded.min_days`,
      maxDays: sql`excluded.max_days`,
      familyFit: sql`excluded.family_fit`,
      weatherBackup: sql`excluded.weather_backup`,
      summary: sql`excluded.summary`,
      anchor: sql`excluded.anchor`,
      stay: sql`excluded.stay`,
      caution: sql`excluded.caution`,
      published: sql`excluded.published`,
      updatedAt: now,
    },
  });

const destinationIds = destinationSeeds.map((destination) => destination.id);

await database
  .delete(destinationPreferences)
  .where(inArray(destinationPreferences.destinationId, destinationIds));

await database
  .delete(sourceReferences)
  .where(inArray(sourceReferences.destinationId, destinationIds));

await database.insert(destinationPreferences).values(
  destinationSeeds.flatMap((destination) =>
    destination.preferenceIds.map((preferenceId) => ({
      destinationId: destination.id,
      preferenceId,
    })),
  ),
);

await database.insert(sourceReferences).values(
  destinationSeeds.map((destination) => ({
    destinationId: destination.id,
    ...destination.sourceReference,
    lastVerifiedAt: SOURCE_VERIFIED_ON,
    updatedAt: now,
  })),
);

await database
  .insert(routeEstimates)
  .values(
    destinationSeeds.map((destination) => ({
      originId: "issaquah-wa",
      destinationId: destination.id,
      travelMode: "drive",
      durationMinutes: destination.durationMinutes,
      usesFerry: destination.usesFerry ?? false,
      crossesBorder: destination.crossesBorder ?? false,
      sourceType: "curated",
      updatedAt: now,
    })),
  )
  .onConflictDoUpdate({
    target: [
      routeEstimates.originId,
      routeEstimates.destinationId,
      routeEstimates.travelMode,
    ],
    set: {
      durationMinutes: sql`excluded.duration_minutes`,
      usesFerry: sql`excluded.uses_ferry`,
      crossesBorder: sql`excluded.crosses_border`,
      sourceType: sql`excluded.source_type`,
      updatedAt: now,
    },
  });

const oregonCoastAreaIds = oregonCoastAreas.map((area) => area.id);
const oregonCoastStopIds = oregonCoastStops.map((stop) => stop.id);

await database
  .insert(routes)
  .values({
    ...oregonCoastRoute,
    published: true,
    lastVerifiedAt: CATALOG_VERIFIED_ON,
    reviewDueAt: CATALOG_REVIEW_DUE_ON,
    updatedAt: now,
  })
  .onConflictDoUpdate({
    target: routes.id,
    set: {
      slug: sql`excluded.slug`,
      name: sql`excluded.name`,
      shape: sql`excluded.shape`,
      countryCode: sql`excluded.country_code`,
      minDays: sql`excluded.min_days`,
      maxDays: sql`excluded.max_days`,
      summary: sql`excluded.summary`,
      published: sql`excluded.published`,
      lastVerifiedAt: sql`excluded.last_verified_at`,
      reviewDueAt: sql`excluded.review_due_at`,
      updatedAt: now,
    },
  });

await database
  .insert(areas)
  .values(
    oregonCoastAreas.map((area) => ({
      ...area,
      countryCode: "US",
      regionCode: "OR",
      published: true,
      lastVerifiedAt: CATALOG_VERIFIED_ON,
      reviewDueAt: CATALOG_REVIEW_DUE_ON,
      updatedAt: now,
    })),
  )
  .onConflictDoUpdate({
    target: areas.id,
    set: {
      slug: sql`excluded.slug`,
      name: sql`excluded.name`,
      kind: sql`excluded.kind`,
      countryCode: sql`excluded.country_code`,
      regionCode: sql`excluded.region_code`,
      latitude: sql`excluded.latitude`,
      longitude: sql`excluded.longitude`,
      summary: sql`excluded.summary`,
      published: sql`excluded.published`,
      lastVerifiedAt: sql`excluded.last_verified_at`,
      reviewDueAt: sql`excluded.review_due_at`,
      updatedAt: now,
    },
  });

await database
  .insert(stops)
  .values(
    oregonCoastStops.map((stop) => {
      const { areaId, preferences: stopPreferenceIds, ...catalogStop } = stop;

      void areaId;
      void stopPreferenceIds;

      return {
        ...catalogStop,
        bookingRequired: false,
        published: true,
        lastVerifiedAt: CATALOG_VERIFIED_ON,
        reviewDueAt: CATALOG_REVIEW_DUE_ON,
        updatedAt: now,
      };
    }),
  )
  .onConflictDoUpdate({
    target: stops.id,
    set: {
      slug: sql`excluded.slug`,
      name: sql`excluded.name`,
      kind: sql`excluded.kind`,
      latitude: sql`excluded.latitude`,
      longitude: sql`excluded.longitude`,
      typicalDurationMinutes: sql`excluded.typical_duration_minutes`,
      indoorOutdoor: sql`excluded.indoor_outdoor`,
      childFit: sql`excluded.child_fit`,
      bookingRequired: sql`excluded.booking_required`,
      weatherSensitivity: sql`excluded.weather_sensitivity`,
      summary: sql`excluded.summary`,
      published: sql`excluded.published`,
      lastVerifiedAt: sql`excluded.last_verified_at`,
      reviewDueAt: sql`excluded.review_due_at`,
      updatedAt: now,
    },
  });

await database
  .delete(catalogEvidence)
  .where(
    or(
      inArray(catalogEvidence.areaId, oregonCoastAreaIds),
      inArray(catalogEvidence.stopId, oregonCoastStopIds),
      inArray(catalogEvidence.routeId, [oregonCoastRoute.id]),
    ),
  );

await database
  .delete(routeWaypoints)
  .where(inArray(routeWaypoints.routeId, [oregonCoastRoute.id]));

await database
  .delete(routeLegs)
  .where(inArray(routeLegs.routeId, [oregonCoastRoute.id]));

await database
  .delete(areaStops)
  .where(inArray(areaStops.areaId, oregonCoastAreaIds));

await database
  .delete(stopPreferences)
  .where(inArray(stopPreferences.stopId, oregonCoastStopIds));

await database
  .delete(hikeDetails)
  .where(inArray(hikeDetails.stopId, oregonCoastStopIds));

await database
  .insert(catalogSources)
  .values(
    oregonCoastSources.map((source) => ({
      ...source,
      lastCheckedAt: CATALOG_VERIFIED_ON,
      status: "active",
      updatedAt: now,
    })),
  )
  .onConflictDoUpdate({
    target: catalogSources.id,
    set: {
      title: sql`excluded.title`,
      url: sql`excluded.url`,
      publisherType: sql`excluded.publisher_type`,
      lastCheckedAt: sql`excluded.last_checked_at`,
      status: sql`excluded.status`,
      updatedAt: now,
    },
  });

await database.insert(areaStops).values(
  oregonCoastStops.map((stop) => ({
    areaId: stop.areaId,
    stopId: stop.id,
    role: "primary",
  })),
);

await database.insert(stopPreferences).values(
  oregonCoastStops.flatMap((stop) =>
    stop.preferences.map((preferenceId, index) => ({
      stopId: stop.id,
      preferenceId,
      strength: index === 0 ? "primary" : "secondary",
    })),
  ),
);

const oregonCoastRouteWaypoints = oregonCoastAreas.flatMap((area, areaIndex) => [
  {
    routeId: oregonCoastRoute.id,
    position: areaIndex * 10 + 1,
    areaId: area.id,
    role: areaIndex === 0 ? "gateway" : "overnight",
    optional: false,
  },
  ...oregonCoastStops
    .filter((stop) => stop.areaId === area.id)
    .map((stop, stopIndex) => ({
      routeId: oregonCoastRoute.id,
      position: areaIndex * 10 + stopIndex + 2,
      stopId: stop.id,
      role: stopIndex === 0 ? "anchor" : "detour",
      optional: stopIndex > 0,
    })),
]);

await database.insert(routeWaypoints).values(oregonCoastRouteWaypoints);

await database.insert(routeLegs).values(
  oregonCoastRouteLegs.map((leg) => ({
    ...leg,
    routeId: oregonCoastRoute.id,
    sourceType: "curated",
    lastVerifiedAt: CATALOG_VERIFIED_ON,
    reviewDueAt: CATALOG_REVIEW_DUE_ON,
  })),
);

const sourceForStop = (stopId: string) => {
  if (stopId === "columbia-river-maritime-museum") return "columbia-river-maritime-museum";
  if (stopId === "oregon-coast-aquarium") return "oregon-coast-aquarium";
  if (["cape-perpetua-overlook", "discovery-loop-trail", "devils-churn"].includes(stopId)) return "usfs-cape-perpetua";
  if (["samuel-h-boardman-corridor", "natural-bridges-viewpoint"].includes(stopId)) return "oregon-parks-boardman";
  if (["haystack-rock", "ecola-state-park"].includes(stopId)) return "travel-oregon-cannon-beach";
  if (["yaquina-head", "newport-historic-bayfront"].includes(stopId)) return "travel-oregon-newport";
  if (["heceta-head-lighthouse", "oregon-dunes-day-use", "florence-historic-old-town"].includes(stopId)) return "travel-oregon-florence";
  return "travel-oregon-pacific-coast-byway";
};

await database.insert(catalogEvidence).values([
  {
    sourceId: "travel-oregon-pacific-coast-byway",
    routeId: oregonCoastRoute.id,
    claimType: "route_scope",
    note: "Travel Oregon documents the Pacific Coast Scenic Byway as the state-spanning coastal road route.",
    confidence: "high",
    verifiedAt: CATALOG_VERIFIED_ON,
    reviewDueAt: CATALOG_REVIEW_DUE_ON,
    updatedAt: now,
  },
  ...oregonCoastAreas.map((area) => ({
    sourceId: "travel-oregon-coast-overview",
    areaId: area.id,
    claimType: "area_scope",
    note: "Included as a curated overnight or planning area on the Oregon Coast pilot route.",
    confidence: "medium",
    verifiedAt: CATALOG_VERIFIED_ON,
    reviewDueAt: CATALOG_REVIEW_DUE_ON,
    updatedAt: now,
  })),
  ...oregonCoastStops.map((stop) => ({
    sourceId: sourceForStop(stop.id),
    stopId: stop.id,
    claimType: "visitor_anchor",
    note: "Included as a curated anchor or optional detour for the Oregon Coast pilot route.",
    confidence: "medium",
    verifiedAt: CATALOG_VERIFIED_ON,
    reviewDueAt: CATALOG_REVIEW_DUE_ON,
    updatedAt: now,
  })),
]);

console.log(
  `Seeded ${destinationSeeds.length} destinations, ${oregonCoastAreas.length} Oregon Coast areas, and ${oregonCoastStops.length} Oregon Coast stops.`,
);
