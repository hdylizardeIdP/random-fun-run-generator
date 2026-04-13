export type SurfacePreference = 'road' | 'trail' | 'mixed';
export type RouteMode = 'random' | 'scenic';

export interface RouteRequest {
  start: [number, number]; // [lng, lat]
  end?: [number, number]; // [lng, lat] - omit for loop routes
  distance: number; // in miles
  surface: SurfacePreference;
  mode: RouteMode;
}

export interface RouteResponse {
  geometry: GeoJSON.LineString;
  distance: number; // actual distance in miles
  duration: number; // estimated duration in minutes
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
}

export interface MapClickEvent {
  latlng: {
    lat: number;
    lng: number;
  };
}
