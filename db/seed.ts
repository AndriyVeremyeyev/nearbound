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
import {
  CATALOG_REVIEW_DUE_ON,
  CATALOG_VERIFIED_ON,
  oregonCoastAreas,
  oregonCoastRoute,
  oregonCoastRouteLegs,
  oregonCoastSources,
  oregonCoastStops,
  sourceForOregonCoastStop,
} from "./catalog/oregon-coast";

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
    sourceId: sourceForOregonCoastStop(stop.id),
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
