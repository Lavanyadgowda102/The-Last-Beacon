import type { Location, LocationId, Road } from '../lib/types';
import type { RouteResult } from '../lib/route';

type Props = { locations: Location[]; roads: Road[]; route: RouteResult; selected: LocationId | null; onSelect: (id: LocationId) => void; onRoadSelect: (road: Road) => void };
export function CityMap({ locations, roads, route, selected, onSelect, onRoadSelect }: Props) {
  const routeIds = new Set(route?.roads.map((road) => road.id) ?? []);
  const byId = new Map(locations.map((location) => [location.id, location]));
  return <div className="map-wrap">
    <svg className="map-svg" viewBox="0 0 830 450" role="img" aria-label="Interactive simulated city map with route and threat conditions">
      <defs><pattern id="mapDots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#273237"/></pattern></defs>
      <rect x="0" y="0" width="830" height="450" fill="url(#mapDots)" />
      {[60,145,230,315,400].map((y) => <path key={`h${y}`} className="map-grid" d={`M20 ${y} H810`} />)}
      {[110,250,390,530,670,800].map((x) => <path key={`v${x}`} className="map-grid" d={`M${x} 28 V420`} />)}
      <path d="M35 90 C160 45 224 160 340 131 S518 45 795 82 M22 395 C174 346 300 426 464 407 S681 338 810 382" fill="none" stroke="#25343a" strokeWidth="18" opacity=".35" />
      {roads.map((road) => {
        const a = byId.get(road.from); const b = byId.get(road.to); if (!a || !b) return null;
        return <g key={road.id} data-testid={`map-road-group-${road.id}`}>
          <path d={`M${a.x} ${a.y} L${b.x} ${b.y}`} className={`map-road ${road.status} ${routeIds.has(road.id) ? 'selected' : ''}`} onClick={() => onRoadSelect(road)} tabIndex={0} role="button" aria-label={`${a.name} to ${b.name}, ${road.distance.toFixed(1)} simulated kilometers, ${road.status}`} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onRoadSelect(road); }} data-testid={`map-road-${road.id}`} />
          <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 8} fill="#81908d" fontSize="9" fontFamily="DM Mono,monospace" textAnchor="middle">{road.distance.toFixed(1)}</text>
        </g>;
      })}
      {locations.map((location) => <g key={location.id} className={`map-node ${selected === location.id ? 'selected' : ''} ${location.id === 'safehouse' ? 'start' : ''} ${location.id === 'beacon' ? 'destination' : ''}`} onClick={() => onSelect(location.id)} tabIndex={0} role="button" aria-label={`Select ${location.name}`} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onSelect(location.id); }} data-testid={`map-location-${location.id}`}>
        <circle className="node-halo" cx={location.x} cy={location.y} r="13" /><circle cx={location.x} cy={location.y} r="4" fill={location.id === 'beacon' ? '#70e0ac' : '#9be0c0'} />
        <text x={location.x} y={location.y + 31}>{location.name}</text>
      </g>)}
      <text x="33" y="33" fill="#5e716f" fontSize="9" fontFamily="DM Mono,monospace" letterSpacing="1.6">GREYLINE DISTRICT · SIMULATED GRID</text>
      <text x="786" y="422" fill="#5e716f" fontSize="8" fontFamily="DM Mono,monospace" textAnchor="end">N ↑</text>
    </svg>
  </div>;
}
