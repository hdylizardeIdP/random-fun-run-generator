import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { RouteResponse } from '../types';

// Fix Leaflet default marker icons (broken by bundlers)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const START_ICON = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'start-marker',
});

const END_ICON = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'end-marker',
});

interface Props {
  startPoint: [number, number] | null;
  endPoint: [number, number] | null;
  route: RouteResponse | null;
  selectingPoint: 'start' | 'end' | null;
  onMapClick: (latlng: { lat: number; lng: number }) => void;
}

export default function RouteMap({ startPoint, endPoint, route, selectingPoint, onMapClick }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const endMarkerRef = useRef<L.Marker | null>(null);
  const routeLayerRef = useRef<L.GeoJSON | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView([39.8283, -98.5795], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Try to get user's location
    map.locate({ setView: true, maxZoom: 14 });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Handle map click events
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handler = (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng);
    };

    map.on('click', handler);
    return () => {
      map.off('click', handler);
    };
  }, [onMapClick]);

  // Update cursor style based on selecting state
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    if (selectingPoint) {
      container.style.cursor = 'crosshair';
    } else {
      container.style.cursor = '';
    }
  }, [selectingPoint]);

  // Update start marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (startMarkerRef.current) {
      startMarkerRef.current.remove();
      startMarkerRef.current = null;
    }

    if (startPoint) {
      const marker = L.marker([startPoint[1], startPoint[0]], { icon: START_ICON })
        .addTo(map)
        .bindPopup('Start');
      startMarkerRef.current = marker;

      if (!routeLayerRef.current) {
        map.setView([startPoint[1], startPoint[0]], Math.max(map.getZoom(), 13));
      }
    }
  }, [startPoint]);

  // Update end marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (endMarkerRef.current) {
      endMarkerRef.current.remove();
      endMarkerRef.current = null;
    }

    if (endPoint) {
      const marker = L.marker([endPoint[1], endPoint[0]], { icon: END_ICON })
        .addTo(map)
        .bindPopup('End');
      endMarkerRef.current = marker;
    }
  }, [endPoint]);

  // Update route display
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }

    if (route) {
      const geoJsonLayer = L.geoJSON(route.geometry, {
        style: {
          color: '#4A90D9',
          weight: 4,
          opacity: 0.8,
        },
      }).addTo(map);

      routeLayerRef.current = geoJsonLayer;

      // Fit map to route bounds
      if (route.bbox) {
        map.fitBounds([
          [route.bbox[1], route.bbox[0]],
          [route.bbox[3], route.bbox[2]],
        ], { padding: [50, 50] });
      } else {
        map.fitBounds(geoJsonLayer.getBounds(), { padding: [50, 50] });
      }
    }
  }, [route]);

  return (
    <div className="map-wrapper">
      {selectingPoint && (
        <div className="map-instruction">
          Click the map to set your <strong>{selectingPoint}</strong> point
        </div>
      )}
      <div ref={mapContainerRef} className="map" />
    </div>
  );
}
