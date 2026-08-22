export type TripIdeaMedia = {
  imageUrl: string;
  alt: string;
  attribution: {
    label: string;
    url: string;
  };
};

type TripIdeaMediaKey =
  | { destinationId: string; routeId?: never }
  | { routeId: string; destinationId?: never };

const unsplashAttribution = {
  label: "Photo via Unsplash",
  url: "https://unsplash.com/license",
} as const;

function unsplashPhoto(photoId: string, alt: string): TripIdeaMedia {
  return {
    imageUrl: `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=1400&q=82`,
    alt,
    attribution: unsplashAttribution,
  };
}

// These are representative editorial images, not claims that a photo depicts a
// particular attraction. Keeping them with the catalog identifiers gives every
// trip card a deliberate visual and leaves a single, reviewable place to swap
// in destination-owned photography later.
const mediaByDestinationId: Record<string, TripIdeaMedia> = {
  "point-defiance": unsplashPhoto("photo-1544550285-f813152fb2fd", "A sea lion at the water's edge"),
  "northwest-trek": unsplashPhoto("photo-1516467508483-a7212febe31a", "A bison standing in a green field"),
  "ocean-shores": unsplashPhoto("photo-1507525428034-b723cf961d3e", "Waves rolling onto a sandy beach"),
  bellingham: unsplashPhoto("photo-1494526585095-c41746248156", "A waterfront city seen from the shore"),
  alderbrook: unsplashPhoto("photo-1470252649378-9c29740c9fa8", "A quiet lakeside view between forested hills"),
  "great-wolf": unsplashPhoto("photo-1500051638674-ff996a0ec29e", "A child splashing in a swimming pool"),
  suncadia: unsplashPhoto("photo-1464822759023-fed622ff2c3b", "Mountain ridgelines in warm afternoon light"),
  leavenworth: unsplashPhoto("photo-1483347756197-71ef80e95f73", "An alpine town beneath snowy mountains"),
  vancouver: unsplashPhoto("photo-1559511260-66a654ae982a", "A city skyline beside the water"),
  seabrook: unsplashPhoto("photo-1494526585095-c41746248156", "A calm shoreline at the edge of a coastal town"),
  sequim: unsplashPhoto("photo-1499002238440-d264edd596ec", "Purple flowers growing in a sunlit field"),
  "long-beach": unsplashPhoto("photo-1500530855697-b586d89ba3ee", "A wide beach with low dunes and open sky"),
  "gig-harbor": unsplashPhoto("photo-1500375592092-40eb2168fd21", "Boats gathered in a small harbor"),
  "whidbey-island": unsplashPhoto("photo-1486911278844-a81c5267e227", "A rocky island shoreline beneath a bright sky"),
  "port-townsend": unsplashPhoto("photo-1518005020951-eccb494ad742", "Historic buildings along a waterfront street"),
  "mount-rainier": unsplashPhoto("photo-1500534623283-312aade485b7", "A snow-covered mountain above evergreen forest"),
  "lake-chelan": unsplashPhoto("photo-1439853949127-fa647821eba0", "A clear mountain lake surrounded by ridges"),
  anacortes: unsplashPhoto("photo-1449158743715-0a90ebb6d2d8", "A ferry moving across coastal water"),
};

const mediaByRouteId: Record<string, TripIdeaMedia> = {
  "oregon-pacific-coast-byway": unsplashPhoto("photo-1454496522488-7a8e488e8606", "A rugged Pacific coastline viewed from above"),
  "north-cascades-sr20-loop": unsplashPhoto("photo-1501785888041-af3ef285b470", "A winding mountain road beneath high peaks"),
  "olympic-peninsula-loop": unsplashPhoto("photo-1441974231531-c6227db76b6e", "A mossy trail through dense evergreen forest"),
  "columbia-river-gorge-loop": unsplashPhoto("photo-1432405972618-c60b0225b8f9", "A waterfall flowing through a forested gorge"),
  "mount-rainier-south-loop": unsplashPhoto("photo-1519681393784-d120267933ba", "A dramatic mountain horizon at dusk"),
  "whidbey-island-ferry-loop": unsplashPhoto("photo-1484291470158-b8f8d608850d", "A ferry crossing blue coastal water"),
};

export function getTripIdeaMedia(key: TripIdeaMediaKey): TripIdeaMedia | undefined {
  if ("routeId" in key && key.routeId) {
    return mediaByRouteId[key.routeId];
  }

  return "destinationId" in key && key.destinationId
    ? mediaByDestinationId[key.destinationId]
    : undefined;
}
