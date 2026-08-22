"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapboxMap, Marker as MapboxMarker } from "mapbox-gl";

import type { ResolvedOrigin } from "@/lib/trips/mapbox-search";
import type { RankedDestination } from "@/lib/trips/types";
import {
  planningRegionReviewBounds,
} from "@/lib/catalog/planning-region-drafts";

export type MapRouteLayer = {
  id: string;
  catalogId?: string;
  name: string;
  shape?: "linear" | "loop";
  areas: readonly { id: string; name: string; latitude: number; longitude: number }[];
};

type LoadedRouteGeometry = {
  coordinates: readonly (readonly [number, number])[];
  originKey: string | null;
};

type InteractiveMapProps = {
  accessToken?: string;
  origin: ResolvedOrigin;
  destinations: readonly RankedDestination[];
  routeLayers?: readonly MapRouteLayer[];
  showResultPlaces?: boolean;
  selectedDestinationId?: string;
  onDestinationSelect: (destinationId: string) => void;
};

function destinationsWithCoordinates(destinations: readonly RankedDestination[]) {
  return destinations.filter(
    (destination): destination is RankedDestination & { latitude: number; longitude: number } =>
      typeof destination.latitude === "number" && typeof destination.longitude === "number",
  );
}

const routeColors = ["#167c73", "#ff6b35", "#574b90", "#3f6fa8"];
const EMPTY_ROUTE_LAYERS: readonly MapRouteLayer[] = [];
const planningRegionSourceId = "nearbound-planning-regions-draft-source";
const planningRegionFillId = "nearbound-planning-regions-draft-fill";
const planningRegionOutlineId = "nearbound-planning-regions-draft-outline";
const planningRegionLabelId = "nearbound-planning-regions-draft-label";
const planningRegionBoundaryApiUrl = "/api/planning-region-boundaries";

function routeLayerId(routeId: string, suffix: string) {
  return `nearbound-route-${routeId}-${suffix}`;
}

export function InteractiveMap({
  accessToken,
  origin,
  destinations,
  routeLayers = EMPTY_ROUTE_LAYERS,
  showResultPlaces = true,
  selectedDestinationId,
  onDestinationSelect,
}: InteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const destinationMarkersRef = useRef<MapboxMarker[]>([]);
  const originMarkerRef = useRef<MapboxMarker | null>(null);
  const baseBoundaryVisibilityRef = useRef(new Map<string, "none" | "visible" | undefined>());
  const selectDestinationRef = useRef(onDestinationSelect);
  const [mapReady, setMapReady] = useState(false);
  const [showPlaces, setShowPlaces] = useState(true);
  const [showRoutes, setShowRoutes] = useState(false);
  const [showPlanningRegions, setShowPlanningRegions] = useState(false);
  const [routeGeometries, setRouteGeometries] = useState<Record<string, LoadedRouteGeometry>>({});
  const [loadingRouteIds, setLoadingRouteIds] = useState<string[]>([]);
  const [routeGeometryErrors, setRouteGeometryErrors] = useState<Record<string, string>>({});
  const originKey = `${origin.longitude},${origin.latitude}`;

  useEffect(() => {
    selectDestinationRef.current = onDestinationSelect;
  }, [onDestinationSelect]);

  useEffect(() => {
    if (!accessToken || !containerRef.current || mapRef.current) return;

    let disposed = false;
    let map: MapboxMap | null = null;

    void import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (disposed || !containerRef.current) return;

      mapboxgl.accessToken = accessToken;
      map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/outdoors-v12",
        center: [origin.longitude, origin.latitude],
        zoom: 7.2,
        attributionControl: false,
      });
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
      mapRef.current = map;
      map.on("load", () => {
        if (!disposed) setMapReady(true);
      });
    });

    return () => {
      disposed = true;
      setMapReady(false);
      map?.remove();
      mapRef.current = null;
    };
  }, [accessToken, origin.latitude, origin.longitude]);

  useEffect(() => {
    setRouteGeometries((geometries) => Object.fromEntries(
      Object.entries(geometries).filter(([routeId]) =>
        routeLayers.some((route) => route.id === routeId)
        && routeLayers.find((route) => route.id === routeId)?.shape !== "loop",
      ),
    ));
    setRouteGeometryErrors({});
  }, [originKey, routeLayers]);

  async function loadRouteGeometry(route: MapRouteLayer) {
    const existingGeometry = routeGeometries[route.id];
    if (
      existingGeometry
      && (route.shape !== "loop" || existingGeometry.originKey === originKey)
    ) {
      return;
    }

    setLoadingRouteIds((routeIds) => [...new Set([...routeIds, route.id])]);
    setRouteGeometryErrors((errors) => {
      const { [route.id]: ignored, ...rest } = errors;
      void ignored;
      return rest;
    });

    try {
      const response = await fetch(`/api/route-geometries/${route.catalogId ?? route.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(route.shape === "loop" ? { origin } : {}),
          areaIds: route.areas.map((area) => area.id),
        }),
      });
      const body = await response.json() as {
        coordinates?: unknown;
        error?: string;
      };
      if (!response.ok || !Array.isArray(body.coordinates)) {
        throw new Error(body.error ?? "Route geometry is unavailable.");
      }

      setRouteGeometries((geometries) => ({
        ...geometries,
        [route.id]: {
          coordinates: body.coordinates as readonly (readonly [number, number])[],
          originKey: route.shape === "loop" ? originKey : null,
        },
      }));
    } catch (error) {
      setRouteGeometryErrors((errors) => ({
        ...errors,
        [route.id]: error instanceof Error ? error.message : "Route geometry is unavailable.",
      }));
    } finally {
      setLoadingRouteIds((routeIds) => routeIds.filter((routeId) => routeId !== route.id));
    }
  }

  useEffect(() => {
    if (!showRoutes) return;
    routeLayers.forEach((route) => void loadRouteGeometry(route));
    // Route layers and origin are the inputs to the request; geometry state deliberately
    // stays out of this dependency list so a completed request does not request itself again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originKey, routeLayers, showRoutes]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    for (const route of routeLayers) {
      const sourceId = routeLayerId(route.id, "source");
      const lineId = routeLayerId(route.id, "line");
      const pointId = routeLayerId(route.id, "points");
      const geometry = routeGeometries[route.id];
      const coordinates = geometry
        && (route.shape !== "loop" || geometry.originKey === originKey)
        ? geometry.coordinates
        : route.areas.map((area) => [area.longitude, area.latitude] as const);
      if (coordinates.length < 2) continue;

      if (map.getLayer(lineId)) map.removeLayer(lineId);
      if (map.getLayer(pointId)) map.removeLayer(pointId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);

      map.addSource(sourceId, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: { kind: "route" },
              geometry: { type: "LineString", coordinates },
            },
            ...route.areas.map((area, index) => ({
              type: "Feature" as const,
              properties: { name: area.name, position: index + 1 },
              geometry: {
                type: "Point" as const,
                coordinates: [area.longitude, area.latitude],
              },
            })),
          ],
        },
      });
      const visibility = showRoutes ? "visible" : "none";
      map.addLayer({
        id: lineId,
        type: "line",
        source: sourceId,
        filter: ["==", ["get", "kind"], "route"],
        paint: {
          "line-color": routeColors[routeLayers.indexOf(route) % routeColors.length],
          "line-width": 4,
          "line-opacity": 0.9,
        },
        layout: { visibility, "line-cap": "round", "line-join": "round" },
      });
      map.addLayer({
        id: pointId,
        type: "circle",
        source: sourceId,
        filter: ["!has", "kind"],
        paint: {
          "circle-radius": 5,
          "circle-color": routeColors[routeLayers.indexOf(route) % routeColors.length],
          "circle-stroke-color": "#fffdf8",
          "circle-stroke-width": 2,
        },
        layout: { visibility },
      });
    }

    return () => {
      for (const route of routeLayers) {
        const sourceId = routeLayerId(route.id, "source");
        const lineId = routeLayerId(route.id, "line");
        const pointId = routeLayerId(route.id, "points");
        if (map.getLayer(lineId)) map.removeLayer(lineId);
        if (map.getLayer(pointId)) map.removeLayer(pointId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      }
    };
  }, [mapReady, originKey, routeGeometries, routeLayers, showRoutes]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const savedBoundaryVisibility = baseBoundaryVisibilityRef.current;

    if (!showPlanningRegions) {
      savedBoundaryVisibility.forEach((currentVisibility, layerId) => {
        if (map.getLayer(layerId)) map.setLayoutProperty(layerId, "visibility", currentVisibility ?? "visible");
      });
      savedBoundaryVisibility.clear();
      return;
    }

    if (!map.getSource(planningRegionSourceId)) {
      map.addSource(planningRegionSourceId, {
        type: "geojson",
        data: planningRegionBoundaryApiUrl,
      });
      map.addLayer({
        id: planningRegionFillId,
        type: "fill",
        source: planningRegionSourceId,
        filter: ["==", ["get", "kind"], "boundary"],
        paint: {
          "fill-color": ["get", "color"],
          "fill-opacity": 0.16,
        },
      });
      map.addLayer({
        id: planningRegionOutlineId,
        type: "line",
        source: planningRegionSourceId,
        filter: ["==", ["get", "kind"], "boundary"],
        paint: {
          "line-color": ["get", "color"],
          "line-width": 2,
          "line-opacity": 0.9,
        },
      });
      map.addLayer({
        id: planningRegionLabelId,
        type: "symbol",
        source: planningRegionSourceId,
        filter: ["==", ["get", "kind"], "label"],
        layout: {
          "text-field": ["get", "name"],
          "text-size": 11,
          "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
          "text-max-width": 9,
          "text-allow-overlap": false,
          "text-ignore-placement": false,
        },
        paint: {
          "text-color": "#172c3d",
          "text-halo-color": "#fffdf8",
          "text-halo-width": 1.3,
        },
      });
    }

    [planningRegionFillId, planningRegionOutlineId, planningRegionLabelId].forEach((layerId) => {
      map.setLayoutProperty(layerId, "visibility", "visible");
    });

    const baseBoundaryLayers = (map.getStyle().layers ?? []).filter((layer) =>
      layer.id.includes("boundary") && !layer.id.startsWith("nearbound-"),
    );
    baseBoundaryLayers.forEach((layer) => {
      if (!savedBoundaryVisibility.has(layer.id)) {
        const currentVisibility = map.getLayoutProperty(layer.id, "visibility");
        savedBoundaryVisibility.set(
          layer.id,
          currentVisibility === "none" || currentVisibility === "visible" ? currentVisibility : undefined,
        );
      }
      map.setLayoutProperty(layer.id, "visibility", "none");
    });

    return () => {
      savedBoundaryVisibility.forEach((currentVisibility, layerId) => {
        if (map.getLayer(layerId)) map.setLayoutProperty(layerId, "visibility", currentVisibility ?? "visible");
      });
      savedBoundaryVisibility.clear();
      [planningRegionLabelId, planningRegionOutlineId, planningRegionFillId].forEach((layerId) => {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
      });
      if (map.getSource(planningRegionSourceId)) map.removeSource(planningRegionSourceId);
    };
  }, [mapReady, showPlanningRegions]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !accessToken || !mapReady) return;

    let disposed = false;

    void import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (disposed || mapRef.current !== map) return;

      originMarkerRef.current?.remove();
      for (const marker of destinationMarkersRef.current) marker.remove();
      destinationMarkersRef.current = [];
      const bounds = new mapboxgl.LngLatBounds([origin.longitude, origin.latitude], [origin.longitude, origin.latitude]);

      if (showResultPlaces && showPlaces) {
        const originElement = document.createElement("div");
        originElement.className = "nearbound-map-origin";
        originElement.setAttribute("aria-label", `Starting point: ${origin.label}`);
        originMarkerRef.current = new mapboxgl.Marker({ element: originElement, anchor: "center" })
          .setLngLat([origin.longitude, origin.latitude])
          .addTo(map);

        destinationsWithCoordinates(destinations).forEach((destination, index) => {
          bounds.extend([destination.longitude, destination.latitude]);

          const element = document.createElement("div");
          element.className = "nearbound-map-marker";
          element.innerHTML = `<button type="button" class="${destination.id === selectedDestinationId ? "is-selected" : ""}" aria-label="${destination.name}, ${destination.score}% trip match"><span>${index + 1}</span></button>`;
          element.querySelector("button")?.addEventListener("click", () =>
            selectDestinationRef.current(destination.id),
          );

          const marker = new mapboxgl.Marker({ element, anchor: "bottom" })
            .setLngLat([destination.longitude, destination.latitude])
            .addTo(map);
          destinationMarkersRef.current.push(marker);
        });
      }

      const visibleRoutes = showRoutes ? routeLayers : [];
      if (visibleRoutes.length > 0) {
        visibleRoutes.forEach((route) => route.areas.forEach((area) => {
          bounds.extend([area.longitude, area.latitude]);
        }));
      }

      if (showPlanningRegions) {
        bounds.extend([planningRegionReviewBounds.west, planningRegionReviewBounds.south]);
        bounds.extend([planningRegionReviewBounds.east, planningRegionReviewBounds.north]);
      }

      if ((showResultPlaces && showPlaces) || visibleRoutes.length > 0 || showPlanningRegions) {
        map.fitBounds(bounds, { padding: 72, maxZoom: 8.7, duration: 0 });
      } else {
        map.easeTo({ center: [origin.longitude, origin.latitude], zoom: 8, duration: 0 });
      }
    });

    return () => {
      disposed = true;
    };
  }, [accessToken, destinations, mapReady, origin, routeLayers, selectedDestinationId, showPlaces, showPlanningRegions, showResultPlaces, showRoutes]);

  if (!accessToken) {
    return (
      <div className="map-canvas map-unavailable" role="status">
        <strong>Map preview unavailable</strong>
        <span>Add the browser Mapbox token and restart the dev server.</span>
      </div>
    );
  }

  return (
    <div className="map-canvas map-shell" aria-label="Interactive map of recommended destinations">
      <div className="map-layer-controls" aria-label="Map layers">
        <span>Map layers</span>
        {showResultPlaces && (
          <label>
            <input type="checkbox" checked={showPlaces} onChange={(event) => setShowPlaces(event.target.checked)} />
            Places
          </label>
        )}
        {routeLayers.length > 0 && (
          <label>
            <input
              type="checkbox"
              checked={showRoutes}
              onChange={() => {
                if (showRoutes) {
                  setShowRoutes(false);
                  return;
                }
                setShowRoutes(true);
              }}
            />
            {loadingRouteIds.length > 0
              ? "Drawing routes…"
              : Object.keys(routeGeometryErrors).length > 0
                ? "Routes (some geometry unavailable)"
                : "Routes"}
          </label>
        )}
        <label>
          <input
            type="checkbox"
            checked={showPlanningRegions}
            onChange={(event) => setShowPlanningRegions(event.target.checked)}
          />
          Planning geography (review)
        </label>
      </div>
      <div className="map-render" ref={containerRef} />
    </div>
  );
}
