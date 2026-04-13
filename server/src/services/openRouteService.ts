const ORS_BASE_URL = 'https://api.openrouteservice.org';

function getApiKey(): string {
  const key = process.env.ORS_API_KEY;
  if (!key || key === 'your_openrouteservice_api_key_here') {
    throw new Error(
      'OpenRouteService API key not configured. ' +
      'Get a free key at https://openrouteservice.org/dev/#/signup and add it to your .env file.'
    );
  }
  return key;
}

type Surface = 'road' | 'trail' | 'mixed';
type Mode = 'random' | 'scenic';

// Map surface preference to ORS profile
function getProfile(surface: Surface): string {
  switch (surface) {
    case 'trail':
      return 'foot-hiking';
    case 'road':
    case 'mixed':
    default:
      return 'foot-walking';
  }
}

// Build avoid_features based on surface preference
function getAvoidFeatures(surface: Surface): string[] | undefined {
  switch (surface) {
    case 'trail':
      return ['highways', 'steps'];
    case 'road':
      return ['fords'];
    default:
      return undefined;
  }
}

interface RouteResult {
  geometry: GeoJSON.LineString;
  distance: number; // miles
  duration: number; // minutes
  bbox: [number, number, number, number];
}

// Shape of the ORS GeoJSON directions response
interface ORSFeature {
  geometry: GeoJSON.LineString;
  properties: {
    summary: {
      distance: number;
      duration: number;
    };
  };
  bbox?: [number, number, number, number];
}

interface ORSResponse {
  features: ORSFeature[];
  bbox?: [number, number, number, number];
}

// Convert miles to meters
function milesToMeters(miles: number): number {
  return miles * 1609.344;
}

// Convert meters to miles
function metersToMiles(meters: number): number {
  return meters / 1609.344;
}

/**
 * Generate a loop route using ORS round_trip directions.
 */
export async function generateLoopRoute(
  start: [number, number],
  distanceMiles: number,
  surface: Surface,
  mode: Mode,
): Promise<RouteResult> {
  const apiKey = getApiKey();
  const profile = getProfile(surface);
  const distanceMeters = milesToMeters(distanceMiles);

  // Use a random seed for variety; scenic mode uses fewer points for smoother routes
  const seed = Math.floor(Math.random() * 100000);
  const points = mode === 'scenic' ? 3 : Math.max(3, Math.min(8, Math.floor(distanceMiles)));

  const body: Record<string, unknown> = {
    coordinates: [start],
    options: {
      round_trip: {
        length: distanceMeters,
        points: points,
        seed: seed,
      },
    },
    geometry: true,
    format: 'geojson',
  };

  const avoidFeatures = getAvoidFeatures(surface);
  if (avoidFeatures) {
    (body.options as Record<string, unknown>).avoid_features = avoidFeatures;
  }

  const response = await fetch(`${ORS_BASE_URL}/v2/directions/${profile}/geojson`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('ORS API error:', response.status, errorText);
    throw new Error(`Route generation failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json() as ORSResponse;
  const feature = data.features?.[0];

  if (!feature) {
    throw new Error('No route found for the given parameters');
  }

  return {
    geometry: feature.geometry,
    distance: metersToMiles(feature.properties.summary.distance),
    duration: feature.properties.summary.duration / 60, // seconds to minutes
    bbox: data.bbox || feature.bbox || [0, 0, 0, 0],
  };
}

/**
 * Generate a point-to-point route between start and end.
 */
export async function generatePointToPointRoute(
  start: [number, number],
  end: [number, number],
  surface: Surface,
  mode: Mode,
): Promise<RouteResult> {
  const apiKey = getApiKey();
  const profile = getProfile(surface);

  const body: Record<string, unknown> = {
    coordinates: [start, end],
    geometry: true,
    format: 'geojson',
  };

  if (mode === 'scenic') {
    // For scenic mode, request alternative routes and prefer the longer/more varied one
    body.alternative_routes = {
      target_count: 3,
      weight_factor: 1.6,
      share_factor: 0.6,
    };
  }

  const avoidFeatures = getAvoidFeatures(surface);
  if (avoidFeatures) {
    body.options = { avoid_features: avoidFeatures };
  }

  const response = await fetch(`${ORS_BASE_URL}/v2/directions/${profile}/geojson`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('ORS API error:', response.status, errorText);
    throw new Error(`Route generation failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json() as ORSResponse;

  // For scenic mode, pick a random alternative route if available
  let feature: ORSFeature | undefined;
  if (mode === 'scenic' && data.features?.length > 1) {
    const idx = Math.floor(Math.random() * data.features.length);
    feature = data.features[idx];
  } else {
    feature = data.features?.[0];
  }

  if (!feature) {
    throw new Error('No route found between the given points');
  }

  return {
    geometry: feature.geometry,
    distance: metersToMiles(feature.properties.summary.distance),
    duration: feature.properties.summary.duration / 60,
    bbox: data.bbox || feature.bbox || [0, 0, 0, 0],
  };
}
