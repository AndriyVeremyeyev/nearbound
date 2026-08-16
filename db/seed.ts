import { inArray, sql } from "drizzle-orm";

import {
  destinationPreferences,
  destinations,
  origins,
  preferences,
  routeEstimates,
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

type DestinationSeed = typeof destinations.$inferInsert & {
  durationMinutes: number;
  preferenceIds: string[];
};

const destinationSeeds: DestinationSeed[] = [
  {
    id: "point-defiance",
    name: "Point Defiance",
    region: "Tacoma, WA",
    countryCode: "US",
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
  },
  {
    id: "northwest-trek",
    name: "Northwest Trek",
    region: "Eatonville, WA",
    countryCode: "US",
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
  },
  {
    id: "ocean-shores",
    name: "Ocean Shores",
    region: "Washington coast",
    countryCode: "US",
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
  },
  {
    id: "bellingham",
    name: "Bellingham",
    region: "Bellingham, WA",
    countryCode: "US",
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
  },
  {
    id: "alderbrook",
    name: "Alderbrook",
    region: "Hood Canal, WA",
    countryCode: "US",
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
  },
  {
    id: "great-wolf",
    name: "Great Wolf Lodge",
    region: "Grand Mound, WA",
    countryCode: "US",
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
  },
  {
    id: "suncadia",
    name: "Suncadia",
    region: "Cle Elum, WA",
    countryCode: "US",
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
  },
  {
    id: "leavenworth",
    name: "Leavenworth",
    region: "Cascade Mountains, WA",
    countryCode: "US",
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
  },
  {
    id: "vancouver",
    name: "Vancouver Aquarium",
    region: "Vancouver, BC",
    countryCode: "CA",
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
    preferenceIds: ["animals", "city", "ocean"],
  },
  {
    id: "seabrook",
    name: "Seabrook",
    region: "Pacific Beach, WA",
    countryCode: "US",
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
  },
  {
    id: "sequim",
    name: "Sequim",
    region: "Olympic Peninsula, WA",
    countryCode: "US",
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
    preferenceIds: ["animals", "ocean", "resort"],
  },
  {
    id: "long-beach",
    name: "Long Beach",
    region: "Long Beach, WA",
    countryCode: "US",
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
    isDefault: true,
  })
  .onConflictDoUpdate({
    target: origins.id,
    set: {
      name: "Issaquah",
      region: "Washington",
      countryCode: "US",
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

await database.insert(destinationPreferences).values(
  destinationSeeds.flatMap((destination) =>
    destination.preferenceIds.map((preferenceId) => ({
      destinationId: destination.id,
      preferenceId,
    })),
  ),
);

await database
  .insert(routeEstimates)
  .values(
    destinationSeeds.map((destination) => ({
      originId: "issaquah-wa",
      destinationId: destination.id,
      travelMode: "drive",
      durationMinutes: destination.durationMinutes,
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
      sourceType: sql`excluded.source_type`,
      updatedAt: now,
    },
  });

console.log(`Seeded ${destinationSeeds.length} destinations.`);
