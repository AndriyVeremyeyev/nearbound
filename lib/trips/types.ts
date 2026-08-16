export type Preference = string;

export type PreferenceOption = {
  id: Preference;
  label: string;
};

export type Destination = {
  id: string;
  name: string;
  region: string;
  hours: number;
  usesFerry: boolean;
  crossesBorder: boolean;
  minDays: number;
  maxDays: number;
  preferences: Preference[];
  familyFit: number;
  weatherBackup: number;
  summary: string;
  anchor: string;
  stay: string;
  caution: string;
};

export type TripCriteria = {
  maxDriveHours: number;
  days: number;
  children: number;
  preferences: Preference[];
  allowFerryRoutes: boolean;
  allowBorderCrossings: boolean;
  hideVisited: boolean;
  visitedDestinationIds: readonly string[];
};

export type RankedDestination = Destination & {
  score: number;
  preferenceMatches: number;
};

export type ExclusionReason =
  | "drive-time"
  | "trip-length"
  | "ferry"
  | "border"
  | "visited";

export type ExcludedDestination = {
  destination: Destination;
  reasons: ExclusionReason[];
};

export type RecommendationResult = {
  recommendations: RankedDestination[];
  exclusions: ExcludedDestination[];
};

export type DestinationCatalog = {
  destinations: Destination[];
  preferenceOptions: PreferenceOption[];
};
