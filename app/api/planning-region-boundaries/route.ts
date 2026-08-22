import {
  planningRegionBritishColumbiaDistricts,
  planningRegionDrafts,
  planningRegionUnitedStatesCounties,
} from "@/lib/catalog/planning-region-drafts";

export const revalidate = 60 * 60 * 24 * 7;

const CENSUS_COUNTIES_URL = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/1/query";
const BRITISH_COLUMBIA_DISTRICTS_URL = "https://delivery.maps.gov.bc.ca/arcgis/rest/services/mpcm/bcgwpub/MapServer/474/query";
const ARCGIS_GEOMETRY_UNION_URL = "https://utility.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer/union";

type Position = readonly [number, number];
type Ring = readonly Position[];
type PolygonCoordinates = readonly Ring[];

type SourceFeature = {
  type: "Feature";
  geometry: unknown;
  properties?: Record<string, unknown>;
};

type SourceFeatureCollection = {
  type: "FeatureCollection";
  features: SourceFeature[];
};

type ArcGisPolygon = { rings: PolygonCoordinates };

type ArcGisUnionResponse = {
  geometryType?: unknown;
  geometry?: ArcGisPolygon;
};

function isFeatureCollection(value: unknown): value is SourceFeatureCollection {
  return Boolean(
    value
    && typeof value === "object"
    && (value as { type?: unknown }).type === "FeatureCollection"
    && Array.isArray((value as { features?: unknown }).features),
  );
}

function buildQueryUrl(baseUrl: string, parameters: Record<string, string>) {
  const url = new URL(baseUrl);
  Object.entries(parameters).forEach(([name, value]) => url.searchParams.set(name, value));
  return url;
}

async function fetchOfficialGeoJson(url: URL) {
  const response = await fetch(url, { next: { revalidate } });
  if (!response.ok) throw new Error(`Official boundary source returned ${response.status}.`);
  const body: unknown = await response.json();
  if (!isFeatureCollection(body)) throw new Error("Official boundary source returned an unexpected format.");
  return body;
}

function regionByUnitedStatesCounty() {
  const regions = new Map<string, string>();
  Object.entries(planningRegionUnitedStatesCounties).forEach(([regionId, countyIds]) => {
    countyIds.forEach((countyId) => regions.set(countyId, regionId));
  });
  return regions;
}

function regionByBritishColumbiaDistrict() {
  const regions = new Map<string, string>();
  Object.entries(planningRegionBritishColumbiaDistricts).forEach(([regionId, districts]) => {
    districts.forEach((district) => regions.set(district, regionId));
  });
  return regions;
}

function polygonRings(geometry: unknown): PolygonCoordinates | null {
  if (!geometry || typeof geometry !== "object") return null;
  const candidate = geometry as { type?: unknown; coordinates?: unknown };
  if (!Array.isArray(candidate.coordinates)) return null;
  if (candidate.type === "Polygon") return candidate.coordinates as PolygonCoordinates;
  if (candidate.type === "MultiPolygon") return candidate.coordinates.flat() as PolygonCoordinates;
  return null;
}

function signedRingArea(ring: Ring) {
  return ring.slice(0, -1).reduce((area, point, index) => {
    const nextPoint = ring[index + 1];
    return nextPoint ? area + point[0] * nextPoint[1] - nextPoint[0] * point[1] : area;
  }, 0) / 2;
}

function pointIsInsideRing(point: Position, ring: Ring) {
  let isInside = false;
  for (let index = 0, previousIndex = ring.length - 1; index < ring.length; previousIndex = index++) {
    const [longitude, latitude] = ring[index];
    const [previousLongitude, previousLatitude] = ring[previousIndex];
    const crossesLatitude = (latitude > point[1]) !== (previousLatitude > point[1]);
    if (crossesLatitude && point[0] < ((previousLongitude - longitude) * (point[1] - latitude)) / (previousLatitude - latitude) + longitude) {
      isInside = !isInside;
    }
  }
  return isInside;
}

function arcGisRingsToGeoJson(rings: PolygonCoordinates) {
  const exteriorRings = rings.filter((ring) => signedRingArea(ring) < 0);
  const holeRings = rings.filter((ring) => signedRingArea(ring) >= 0);
  const outerRings = exteriorRings.length > 0 ? exteriorRings : rings;
  const polygons = outerRings.map((outerRing) => [Array.from(outerRing).reverse()]);

  if (exteriorRings.length > 0) {
    holeRings.forEach((holeRing) => {
      const polygonIndex = outerRings.findIndex((outerRing) => pointIsInsideRing(holeRing[0], outerRing));
      if (polygonIndex >= 0) polygons[polygonIndex].push(Array.from(holeRing).reverse());
    });
  }

  return polygons.length === 1
    ? { type: "Polygon" as const, coordinates: polygons[0] }
    : { type: "MultiPolygon" as const, coordinates: polygons };
}

async function unionRegionGeometry(sourceFeatures: readonly SourceFeature[]) {
  const geometries = sourceFeatures.map((feature) => polygonRings(feature.geometry)).filter(
    (rings): rings is PolygonCoordinates => rings !== null,
  ).map((rings) => ({ rings }));
  if (geometries.length === 0) throw new Error("A planning region has no polygon geometry.");

  const body = new URLSearchParams({
    f: "json",
    sr: "4326",
    geometries: JSON.stringify({ geometryType: "esriGeometryPolygon", geometries }),
  });
  const response = await fetch(ARCGIS_GEOMETRY_UNION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) throw new Error(`Geometry union source returned ${response.status}.`);
  const result: ArcGisUnionResponse = await response.json();
  if (result.geometryType !== "esriGeometryPolygon" || !result.geometry?.rings) {
    throw new Error("Geometry union source returned an unexpected format.");
  }
  return arcGisRingsToGeoJson(result.geometry.rings);
}

async function unionFeatureForRegion(regionId: string, sourceFeatures: readonly SourceFeature[]) {
  const region = planningRegionDrafts.find((candidate) => candidate.id === regionId);
  if (!region) return null;
  return {
    type: "Feature" as const,
    properties: {
      id: region.id,
      name: region.name,
      description: region.description,
      color: region.color,
      kind: "boundary",
    },
    geometry: await unionRegionGeometry(sourceFeatures),
  };
}

export async function GET() {
  try {
    const [unitedStatesCounties, britishColumbiaDistricts] = await Promise.all([
      fetchOfficialGeoJson(buildQueryUrl(CENSUS_COUNTIES_URL, {
        where: "STATE IN ('53','41','16')",
        outFields: "GEOID",
        returnGeometry: "true",
        outSR: "4326",
        f: "geojson",
      })),
      fetchOfficialGeoJson(buildQueryUrl(BRITISH_COLUMBIA_DISTRICTS_URL, {
        where: `ADMIN_AREA_NAME IN (${Object.values(planningRegionBritishColumbiaDistricts).flat().map((district) => `'${district}'`).join(",")})`,
        outFields: "ADMIN_AREA_NAME",
        returnGeometry: "true",
        outSR: "4326",
        f: "geojson",
      })),
    ]);

    const countyRegions = regionByUnitedStatesCounty();
    const britishColumbiaRegions = regionByBritishColumbiaDistrict();
    const unitedStatesFeaturesByRegion = new Map<string, SourceFeature[]>();
    const britishColumbiaFeaturesByRegion = new Map<string, SourceFeature[]>();
    unitedStatesCounties.features.forEach((feature) => {
      const countyId = feature.properties?.GEOID;
      const regionId = typeof countyId === "string" ? countyRegions.get(countyId) : null;
      if (!regionId) return;
      const features = unitedStatesFeaturesByRegion.get(regionId) ?? [];
      features.push(feature);
      unitedStatesFeaturesByRegion.set(regionId, features);
    });
    britishColumbiaDistricts.features.forEach((feature) => {
      const districtName = feature.properties?.ADMIN_AREA_NAME;
      const regionId = typeof districtName === "string" ? britishColumbiaRegions.get(districtName) : null;
      if (!regionId) return;
      const features = britishColumbiaFeaturesByRegion.get(regionId) ?? [];
      features.push(feature);
      britishColumbiaFeaturesByRegion.set(regionId, features);
    });
    const boundaryFeatures = (await Promise.all(planningRegionDrafts.map((region) => {
      const sourceFeatures = britishColumbiaFeaturesByRegion.get(region.id)
        ?? unitedStatesFeaturesByRegion.get(region.id)
        ?? [];
      return unionFeatureForRegion(region.id, sourceFeatures);
    }))).filter((feature): feature is NonNullable<typeof feature> => feature !== null);

    const labelFeatures = planningRegionDrafts.map((region) => ({
      type: "Feature" as const,
      properties: { id: region.id, name: region.name, kind: "label" },
      geometry: { type: "Point" as const, coordinates: region.labelCoordinates },
    }));

    return Response.json(
      { type: "FeatureCollection", features: [...boundaryFeatures, ...labelFeatures] },
      { headers: { "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400" } },
    );
  } catch {
    return Response.json(
      { error: "Planning-region boundaries are temporarily unavailable." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
