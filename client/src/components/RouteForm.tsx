import { useState } from 'react';
import type { FormEvent } from 'react';
import type { SurfacePreference, RouteMode } from '../types';

interface Props {
  startPoint: [number, number] | null;
  endPoint: [number, number] | null;
  isLoop: boolean;
  selectingPoint: 'start' | 'end' | null;
  loading: boolean;
  onSetIsLoop: (isLoop: boolean) => void;
  onSelectPoint: (point: 'start' | 'end' | null) => void;
  onGenerate: (distance: number, surface: SurfacePreference, mode: RouteMode) => void;
  onClear: () => void;
}

export default function RouteForm({
  startPoint,
  endPoint,
  isLoop,
  selectingPoint,
  loading,
  onSetIsLoop,
  onSelectPoint,
  onGenerate,
  onClear,
}: Props) {
  const [distance, setDistance] = useState(3);
  const [surface, setSurface] = useState<SurfacePreference>('mixed');
  const [mode, setMode] = useState<RouteMode>('random');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onGenerate(distance, surface, mode);
  };

  const formatCoord = (point: [number, number] | null) => {
    if (!point) return 'Not set';
    return `${point[1].toFixed(4)}, ${point[0].toFixed(4)}`;
  };

  return (
    <form className="route-form" onSubmit={handleSubmit}>
      <section className="form-section">
        <h3>Route Type</h3>
        <div className="toggle-group">
          <button
            type="button"
            className={`toggle-btn ${isLoop ? 'active' : ''}`}
            onClick={() => onSetIsLoop(true)}
          >
            Loop (same start/end)
          </button>
          <button
            type="button"
            className={`toggle-btn ${!isLoop ? 'active' : ''}`}
            onClick={() => onSetIsLoop(false)}
          >
            Point to Point
          </button>
        </div>
      </section>

      <section className="form-section">
        <h3>Locations</h3>
        <div className="location-row">
          <label>Start:</label>
          <span className="coord-display">{formatCoord(startPoint)}</span>
          <button
            type="button"
            className={`pick-btn ${selectingPoint === 'start' ? 'picking' : ''}`}
            onClick={() => onSelectPoint(selectingPoint === 'start' ? null : 'start')}
          >
            {selectingPoint === 'start' ? 'Picking...' : 'Pick'}
          </button>
        </div>
        {!isLoop && (
          <div className="location-row">
            <label>End:</label>
            <span className="coord-display">{formatCoord(endPoint)}</span>
            <button
              type="button"
              className={`pick-btn ${selectingPoint === 'end' ? 'picking' : ''}`}
              onClick={() => onSelectPoint(selectingPoint === 'end' ? null : 'end')}
            >
              {selectingPoint === 'end' ? 'Picking...' : 'Pick'}
            </button>
          </div>
        )}
      </section>

      <section className="form-section">
        <h3>Distance: {distance} {distance === 1 ? 'mile' : 'miles'}</h3>
        <input
          type="range"
          min="0.5"
          max="26.2"
          step="0.5"
          value={distance}
          onChange={(e) => setDistance(parseFloat(e.target.value))}
          className="distance-slider"
        />
        <div className="distance-labels">
          <span>0.5 mi</span>
          <span>5K</span>
          <span>10K</span>
          <span>Half</span>
          <span>Marathon</span>
        </div>
        <div className="distance-presets">
          <button type="button" onClick={() => setDistance(1)}>1 mi</button>
          <button type="button" onClick={() => setDistance(3.1)}>5K</button>
          <button type="button" onClick={() => setDistance(6.2)}>10K</button>
          <button type="button" onClick={() => setDistance(13.1)}>Half</button>
          <button type="button" onClick={() => setDistance(26.2)}>Marathon</button>
        </div>
      </section>

      <section className="form-section">
        <h3>Surface</h3>
        <div className="radio-group">
          {(['road', 'trail', 'mixed'] as SurfacePreference[]).map((s) => (
            <label key={s} className="radio-label">
              <input
                type="radio"
                name="surface"
                value={s}
                checked={surface === s}
                onChange={() => setSurface(s)}
              />
              <span className="radio-text">{s.charAt(0).toUpperCase() + s.slice(1)}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="form-section">
        <h3>Route Style</h3>
        <div className="toggle-group">
          <button
            type="button"
            className={`toggle-btn ${mode === 'random' ? 'active' : ''}`}
            onClick={() => setMode('random')}
          >
            Random
          </button>
          <button
            type="button"
            className={`toggle-btn ${mode === 'scenic' ? 'active' : ''}`}
            onClick={() => setMode('scenic')}
          >
            Scenic
          </button>
        </div>
        <p className="mode-hint">
          {mode === 'random'
            ? 'Generates a random route — great for exploring new areas'
            : 'Prefers parks, trails, and waterways for a more scenic run'}
        </p>
      </section>

      <div className="form-actions">
        <button
          type="submit"
          className="generate-btn"
          disabled={loading || !startPoint || (!isLoop && !endPoint)}
        >
          {loading ? 'Generating...' : 'Generate Route'}
        </button>
        <button type="button" className="clear-btn" onClick={onClear}>
          Clear
        </button>
      </div>
    </form>
  );
}
