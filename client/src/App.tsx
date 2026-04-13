import { useState, useCallback } from 'react';
import RouteMap from './components/RouteMap';
import RouteForm from './components/RouteForm';
import RouteInfo from './components/RouteInfo';
import { generateRoute } from './services/api';
import type { RouteResponse, RouteRequest } from './types';

function App() {
  const [startPoint, setStartPoint] = useState<[number, number] | null>(null);
  const [endPoint, setEndPoint] = useState<[number, number] | null>(null);
  const [isLoop, setIsLoop] = useState(true);
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectingPoint, setSelectingPoint] = useState<'start' | 'end' | null>(null);

  const handleMapClick = useCallback(
    (latlng: { lat: number; lng: number }) => {
      if (!selectingPoint) return;

      const point: [number, number] = [latlng.lng, latlng.lat];

      if (selectingPoint === 'start') {
        setStartPoint(point);
        if (!isLoop) {
          setSelectingPoint('end');
        } else {
          setSelectingPoint(null);
        }
      } else {
        setEndPoint(point);
        setSelectingPoint(null);
      }
    },
    [selectingPoint, isLoop],
  );

  const handleGenerate = async (distance: number, surface: RouteRequest['surface'], mode: RouteRequest['mode']) => {
    if (!startPoint) {
      setError('Please select a starting point on the map');
      return;
    }
    if (!isLoop && !endPoint) {
      setError('Please select an ending point on the map');
      return;
    }

    setLoading(true);
    setError(null);
    setRoute(null);

    try {
      const result = await generateRoute({
        start: startPoint,
        end: isLoop ? undefined : endPoint!,
        distance,
        surface,
        mode,
      });
      setRoute(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setStartPoint(null);
    setEndPoint(null);
    setRoute(null);
    setError(null);
    setSelectingPoint(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Fun Run Route Generator</h1>
        <p>Click the map to set your start point, configure your run, and discover new routes!</p>
      </header>

      <div className="app-body">
        <aside className="sidebar">
          <RouteForm
            startPoint={startPoint}
            endPoint={endPoint}
            isLoop={isLoop}
            selectingPoint={selectingPoint}
            loading={loading}
            onSetIsLoop={(loop) => {
              setIsLoop(loop);
              if (loop) setEndPoint(null);
            }}
            onSelectPoint={setSelectingPoint}
            onGenerate={handleGenerate}
            onClear={handleClear}
          />

          {error && <div className="error-banner">{error}</div>}

          {route && <RouteInfo route={route} />}
        </aside>

        <main className="map-container">
          <RouteMap
            startPoint={startPoint}
            endPoint={endPoint}
            route={route}
            selectingPoint={selectingPoint}
            onMapClick={handleMapClick}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
