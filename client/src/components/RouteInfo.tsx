import type { RouteResponse } from '../types';

interface Props {
  route: RouteResponse;
}

export default function RouteInfo({ route }: Props) {
  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hrs === 0) return `${mins} min`;
    return `${hrs}h ${mins}m`;
  };

  const formatPace = (distanceMiles: number, durationMinutes: number) => {
    if (distanceMiles === 0) return '--';
    const paceMin = durationMinutes / distanceMiles;
    const mins = Math.floor(paceMin);
    const secs = Math.round((paceMin - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')} /mi`;
  };

  return (
    <div className="route-info">
      <h3>Generated Route</h3>
      <div className="route-stats">
        <div className="stat">
          <span className="stat-label">Distance</span>
          <span className="stat-value">{route.distance.toFixed(2)} mi</span>
        </div>
        <div className="stat">
          <span className="stat-label">Est. Duration</span>
          <span className="stat-value">{formatDuration(route.duration)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Est. Pace</span>
          <span className="stat-value">{formatPace(route.distance, route.duration)}</span>
        </div>
      </div>
    </div>
  );
}
