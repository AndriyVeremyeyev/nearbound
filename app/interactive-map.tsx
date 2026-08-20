"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapboxMap, Marker as MapboxMarker } from "mapbox-gl";

import type { ResolvedOrigin } from "@/lib/trips/mapbox-search";
import type { RankedDestination } from "@/lib/trips/types";

type InteractiveMapProps = {
  accessToken?: string;
  origin: ResolvedOrigin;
  destinations: readonly RankedDestination[];
  selectedDestinationId?: string;
  onDestinationSelect: (destinationId: string) => void;
};

function destinationsWithCoordinates(destinations: readonly RankedDestination[]) {
  return destinations.filter(
    (destination): destination is RankedDestination & { latitude: number; longitude: number } =>
      typeof destination.latitude === "number" && typeof destination.longitude === "number",
  );
}

export function InteractiveMap({
  accessToken,
  origin,
  destinations,
  selectedDestinationId,
  onDestinationSelect,
}: InteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const destinationMarkersRef = useRef<MapboxMarker[]>([]);
  const originMarkerRef = useRef<MapboxMarker | null>(null);
  const selectDestinationRef = useRef(onDestinationSelect);
  const [mapReady, setMapReady] = useState(false);

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
    if (!map || !accessToken || !mapReady) return;

    let disposed = false;

    void import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (disposed || mapRef.current !== map) return;

      originMarkerRef.current?.remove();
      for (const marker of destinationMarkersRef.current) marker.remove();
      destinationMarkersRef.current = [];

      const originElement = document.createElement("div");
      originElement.className = "nearbound-map-origin";
      originElement.setAttribute("aria-label", `Starting point: ${origin.label}`);
      originMarkerRef.current = new mapboxgl.Marker({ element: originElement, anchor: "center" })
        .setLngLat([origin.longitude, origin.latitude])
        .addTo(map);

      const mappedDestinations = destinationsWithCoordinates(destinations);
      const bounds = new mapboxgl.LngLatBounds([origin.longitude, origin.latitude], [origin.longitude, origin.latitude]);

      mappedDestinations.forEach((destination, index) => {
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

      if (mappedDestinations.length > 0) {
        map.fitBounds(bounds, { padding: 72, maxZoom: 8.7, duration: 0 });
      } else {
        map.easeTo({ center: [origin.longitude, origin.latitude], zoom: 8, duration: 0 });
      }
    });

    return () => {
      disposed = true;
    };
  }, [accessToken, destinations, mapReady, origin, selectedDestinationId]);

  if (!accessToken) {
    return (
      <div className="map-canvas map-unavailable" role="status">
        <strong>Map preview unavailable</strong>
        <span>Add the browser Mapbox token and restart the dev server.</span>
      </div>
    );
  }

  return <div className="map-canvas" ref={containerRef} aria-label="Interactive map of recommended destinations" />;
}
