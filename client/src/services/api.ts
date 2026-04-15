import type { RouteRequest, RouteResponse } from '../types';

const API_BASE = '/api';

export async function generateRoute(request: RouteRequest): Promise<RouteResponse> {
  const response = await fetch(`${API_BASE}/routes/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to generate route' }));
    throw new Error(error.message || 'Failed to generate route');
  }

  return response.json();
}
