"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapboxMap, Marker as MapboxMarker } from "mapbox-gl";

type TripMapArea = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

type TripIdeaMapProps = {
  accessToken?: string;
  areas: readonly TripMapArea[];
};

export function TripIdeaMap({ accessToken, areas }: TripIdeaMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markersRef = useRef<MapboxMarker[]>([]);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!accessToken || !containerRef.current || mapRef.current || areas.length === 0) return;

    let disposed = false;
    let map: MapboxMap | null = null;

    void import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (disposed || !containerRef.current) return;

      mapboxgl.accessToken = accessToken;
      map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/outdoors-v12",
        center: [areas[0].longitude, areas[0].latitude],
        zoom: 7,
        attributionControl: false,
      });
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
      map.on("load", () => {
        if (!disposed) setMapReady(true);
      });
      mapRef.current = map;
    });

    return () => {
      disposed = true;
      setMapReady(false);
      map?.remove();
      mapRef.current = null;
    };
  }, [accessToken, areas]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !accessToken || !mapReady) return;

    let disposed = false;

    void import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (disposed || mapRef.current !== map) return;

      for (const marker of markersRef.current) marker.remove();
      markersRef.current = [];

      const bounds = new mapboxgl.LngLatBounds(
        [areas[0].longitude, areas[0].latitude],
        [areas[0].longitude, areas[0].latitude],
      );
      const coordinates = areas.map((area) => [area.longitude, area.latitude]);

      if (map.getLayer("trip-idea-route-line")) {
        map.removeLayer("trip-idea-route-line");
      }
      if (map.getSource("trip-idea-route")) {
        map.removeSource("trip-idea-route");
      }
      if (coordinates.length > 1) {
        map.addSource("trip-idea-route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates },
          },
        });
        map.addLayer({
          id: "trip-idea-route-line",
          type: "line",
          source: "trip-idea-route",
          paint: {
            "line-color": "#1d7a71",
            "line-width": 4,
            "line-opacity": 0.82,
          },
        });
      }

      areas.forEach((area, index) => {
        bounds.extend([area.longitude, area.latitude]);
        const element = document.createElement("div");
        element.className = `trip-idea-map-marker${index === 0 ? " is-start" : ""}`;
        element.setAttribute("aria-label", `${index + 1}. ${area.name}`);
        element.textContent = String(index + 1);

        const marker = new mapboxgl.Marker({ element, anchor: "center" })
          .setLngLat([area.longitude, area.latitude])
          .addTo(map);
        markersRef.current.push(marker);
      });

      map.fitBounds(bounds, { padding: 72, maxZoom: 9, duration: 0 });
    });

    return () => {
      disposed = true;
    };
  }, [accessToken, areas, mapReady]);

  if (!accessToken) {
    return (
      <div className="trip-idea-map trip-idea-map-unavailable" role="status">
        <strong>Map preview unavailable</strong>
        <span>Add the browser Mapbox token and restart the dev server.</span>
      </div>
    );
  }

  return <div className="trip-idea-map" ref={containerRef} aria-label="Map of this trip idea" />;
}
