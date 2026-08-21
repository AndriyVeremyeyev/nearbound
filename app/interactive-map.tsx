"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapboxMap, Marker as MapboxMarker } from "mapbox-gl";

import type { ResolvedOrigin } from "@/lib/trips/mapbox-search";
import type { RankedDestination } from "@/lib/trips/types";

export type MapRouteLayer = {
  id: string;
  name: string;
  areas: readonly { id: string; name: string; latitude: number; longitude: number }[];
};

type InteractiveMapProps = {
  accessToken?: string;
  origin: ResolvedOrigin;
  destinations: readonly RankedDestination[];
  routeLayers?: readonly MapRouteLayer[];
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

function routeLayerId(routeId: string, suffix: string) {
  return `nearbound-route-${routeId}-${suffix}`;
}

export function InteractiveMap({
  accessToken,
  origin,
  destinations,
  routeLayers = [],
  selectedDestinationId,
  onDestinationSelect,
}: InteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const destinationMarkersRef = useRef<MapboxMarker[]>([]);
  const originMarkerRef = useRef<MapboxMarker | null>(null);
  const selectDestinationRef = useRef(onDestinationSelect);
  const [mapReady, setMapReady] = useState(false);
  const [showPlaces, setShowPlaces] = useState(true);
  const [visibleRouteIds, setVisibleRouteIds] = useState<string[]>([]);

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
    const map = mapRef.current;
    if (!map || !mapReady) return;

    for (const route of routeLayers) {
      const sourceId = routeLayerId(route.id, "source");
      const lineId = routeLayerId(route.id, "line");
      const pointId = routeLayerId(route.id, "points");
      const coordinates = route.areas.map((area) => [area.longitude, area.latitude]);
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
      const visibility = visibleRouteIds.includes(route.id) ? "visible" : "none";
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
  }, [mapReady, routeLayers, visibleRouteIds]);

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

      if (showPlaces) {
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

      const visibleRoutes = routeLayers.filter((route) => visibleRouteIds.includes(route.id));
      if (visibleRoutes.length > 0) {
        visibleRoutes.forEach((route) => route.areas.forEach((area) => {
          bounds.extend([area.longitude, area.latitude]);
        }));
      }

      if (showPlaces || visibleRoutes.length > 0) {
        map.fitBounds(bounds, { padding: 72, maxZoom: 8.7, duration: 0 });
      } else {
        map.easeTo({ center: [origin.longitude, origin.latitude], zoom: 8, duration: 0 });
      }
    });

    return () => {
      disposed = true;
    };
  }, [accessToken, destinations, mapReady, origin, routeLayers, selectedDestinationId, showPlaces, visibleRouteIds]);

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
        <label>
          <input type="checkbox" checked={showPlaces} onChange={(event) => setShowPlaces(event.target.checked)} />
          Places
        </label>
        {routeLayers.map((route) => (
          <label key={route.id}>
            <input
              type="checkbox"
              checked={visibleRouteIds.includes(route.id)}
              onChange={() => setVisibleRouteIds((visible) =>
                visible.includes(route.id)
                  ? visible.filter((routeId) => routeId !== route.id)
                  : [...visible, route.id],
              )}
            />
            {route.name}
          </label>
        ))}
      </div>
      <div className="map-render" ref={containerRef} />
    </div>
  );
}
