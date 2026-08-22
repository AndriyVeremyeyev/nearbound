export type PlanningRegionDraft = {
  id: string;
  name: string;
  description: string;
  color: string;
  labelCoordinates: readonly [number, number];
};

type UnitedStatesCountyMembership = Record<string, readonly string[]>;
type BritishColumbiaDistrictMembership = Record<string, readonly string[]>;

/**
 * Top-level geography for owner review. Its shapes are deliberately not authored
 * here: the map layer retrieves official county and regional-district polygons.
 * A route such as the Columbia River Gorge can cross these regions, so it is a
 * corridor in the catalog rather than a competing top-level polygon.
 */
export const planningRegionDrafts: readonly PlanningRegionDraft[] = [
  {
    id: "puget-sound-islands",
    name: "Puget Sound & Islands",
    description: "Seattle, Tacoma, Kitsap and the island travel zones; Whidbey belongs one level lower as a travel zone.",
    color: "#167c73",
    labelCoordinates: [-122.73, 47.72],
  },
  {
    id: "olympic-peninsula",
    name: "Olympic Peninsula",
    description: "The north shore, mountain and lake districts, west rain forest and Pacific coast travel zones.",
    color: "#4e7a57",
    labelCoordinates: [-123.76, 47.86],
  },
  {
    id: "cascades-north-central-washington",
    name: "Cascades & North-Central Washington",
    description: "Skagit and SR-20, Leavenworth, Lake Chelan and Methow travel zones within one connected mountain region.",
    color: "#536da7",
    labelCoordinates: [-120.72, 48.12],
  },
  {
    id: "south-cascades-southwest-washington",
    name: "South Cascades & Southwest Washington",
    description: "Rainier and St. Helens gateways, forest and coast communities south of Puget Sound.",
    color: "#8b6a42",
    labelCoordinates: [-122.05, 46.45],
  },
  {
    id: "eastern-washington",
    name: "Eastern Washington",
    description: "Spokane, Palouse, Walla Walla and the Columbia Basin — a broad but connected inland region.",
    color: "#a05f45",
    labelCoordinates: [-118.35, 47.15],
  },
  {
    id: "portland-willamette-valley",
    name: "Portland & Willamette Valley",
    description: "Portland, nearby river towns, farms and valley stays; the Gorge remains a cross-region route corridor.",
    color: "#9e6f9e",
    labelCoordinates: [-122.82, 45.12],
  },
  {
    id: "oregon-coast",
    name: "Oregon Coast",
    description: "One region from Astoria to the south coast. North, central and south coast remain travel zones, not top-level regions.",
    color: "#258a9a",
    labelCoordinates: [-124.02, 44.66],
  },
  {
    id: "oregon-cascades-high-desert",
    name: "Oregon Cascades & High Desert",
    description: "The Gorge, high-desert towns and eastern Cascade recreation — a connected natural region beside Portland and the coast.",
    color: "#c08334",
    labelCoordinates: [-121.25, 44.9],
  },
  {
    id: "mainland-british-columbia",
    name: "Mainland British Columbia",
    description: "Metro Vancouver, Fraser Valley, Sea-to-Sky and the Sunshine Coast travel zones.",
    color: "#5c65a5",
    labelCoordinates: [-122.82, 49.45],
  },
  {
    id: "vancouver-island-gulf-islands",
    name: "Vancouver Island & Gulf Islands",
    description: "Victoria, southern and central Vancouver Island, plus ferry-connected Gulf Island travel zones.",
    color: "#497b83",
    labelCoordinates: [-124.15, 49.0],
  },
  {
    id: "north-idaho",
    name: "North Idaho",
    description: "Coeur d'Alene, Sandpoint, Wallace and connected lake-and-mountain travel zones.",
    color: "#736c46",
    labelCoordinates: [-116.58, 47.7],
  },
];

/** County GEOIDs from the official Census layer. No county appears in two regions. */
export const planningRegionUnitedStatesCounties: UnitedStatesCountyMembership = {
  "puget-sound-islands": [
    "53029", "53033", "53035", "53045", "53053", "53055", "53057", "53061", "53067", "53073",
  ],
  "olympic-peninsula": ["53009", "53031"],
  "cascades-north-central-washington": ["53007", "53017", "53037", "53047"],
  "south-cascades-southwest-washington": ["53011", "53015", "53027", "53039", "53041", "53049", "53059", "53069"],
  "eastern-washington": [
    "53001", "53003", "53005", "53013", "53019", "53021", "53023", "53025", "53043", "53051", "53063", "53065", "53071", "53075", "53077",
  ],
  "portland-willamette-valley": ["41003", "41005", "41009", "41043", "41047", "41051", "41053", "41067", "41071"],
  "oregon-coast": ["41007", "41011", "41015", "41019", "41039", "41041", "41057"],
  "oregon-cascades-high-desert": ["41013", "41017", "41027", "41031", "41065"],
  "north-idaho": ["16009", "16017", "16021", "16035", "16049", "16055", "16057", "16061", "16069", "16079"],
};

export const planningRegionBritishColumbiaDistricts: BritishColumbiaDistrictMembership = {
  "mainland-british-columbia": [
    "Fraser Valley Regional District",
    "Metro Vancouver Regional District",
    "Squamish-Lillooet Regional District",
    "Sunshine Coast Regional District",
  ],
  "vancouver-island-gulf-islands": [
    "Regional District of Alberni-Clayoquot",
    "Capital Regional District",
    "Comox Valley Regional District",
    "Cowichan Valley Regional District",
    "Regional District of Nanaimo",
  ],
};

export const planningRegionReviewBounds = {
  west: -125.8,
  south: 42.0,
  east: -115.0,
  north: 51.1,
} as const;

export function emptyPlanningRegionDraftGeoJson() {
  return { type: "FeatureCollection" as const, features: [] };
}
