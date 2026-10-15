import { LOCATIONS } from './scenario';
import type { LocationId, Road, ThreatStatus } from './types';

export type RouteResult = { locations: LocationId[]; roads: Road[]; distance: number; cost: number } | null;

// Dijkstra works well here because all simulated road costs are positive.
// We compare total cost, while separately adding distance for the displayed estimate.
export function findRoute(roads: Road[], start: LocationId, end: LocationId, dangerMultiplier: number): RouteResult {
  const remaining = new Set(LOCATIONS.map((location) => location.id));
  const costs = new Map<LocationId, number>();
  const distances = new Map<LocationId, number>();
  const previous = new Map<LocationId, { node: LocationId; road: Road }>();
  LOCATIONS.forEach((location) => { costs.set(location.id, Infinity); distances.set(location.id, 0); });
  costs.set(start, 0);
  while (remaining.size) {
    let current: LocationId | null = null;
    remaining.forEach((id) => {
      if (current === null || (costs.get(id) ?? Infinity) < (costs.get(current) ?? Infinity)) current = id;
    });
    if (!current || !Number.isFinite(costs.get(current))) break;
    remaining.delete(current);
    if (current === end) break;
    roads.filter((road) => !road.blocked && (road.from === current || road.to === current)).forEach((road) => {
      const next = road.from === current ? road.to : road.from;
      if (!remaining.has(next)) return;
      const edgeCost = road.distance + road.danger * dangerMultiplier;
      const nextCost = (costs.get(current!) ?? Infinity) + edgeCost;
      if (nextCost < (costs.get(next) ?? Infinity)) {
        costs.set(next, nextCost);
        distances.set(next, (distances.get(current!) ?? 0) + road.distance);
        previous.set(next, { node: current!, road });
      }
    });
  }
  if (!Number.isFinite(costs.get(end))) return null;
  const locations: LocationId[] = [end];
  const pathRoads: Road[] = [];
  let cursor = end;
  while (cursor !== start) {
    const step = previous.get(cursor);
    if (!step) return null;
    pathRoads.unshift(step.road);
    cursor = step.node;
    locations.unshift(cursor);
  }
  return { locations, roads: pathRoads, distance: distances.get(end) ?? 0, cost: costs.get(end) ?? 0 };
}

export const threatStatusForDanger = (danger: number): ThreatStatus => danger <= 1 ? 'safe' : danger === 2 ? 'caution' : 'dangerous';

export function routeReason(route: RouteResult, multiplier: number): string {
  if (!route) return 'No connected, unblocked route reaches The Last Beacon. Review road conditions before moving.';
  const risky = route.roads.filter((road) => road.status === 'dangerous' || road.status === 'blocked').length;
  const cautious = route.roads.filter((road) => road.status === 'caution').length;
  if (risky) return `Lowest available cost with ${risky} dangerous segment${risky > 1 ? 's' : ''}; danger is weighted ×${multiplier}. Consider a safer alternative.`;
  return `Lowest weighted cost among open roads${cautious ? `, including ${cautious} caution segment${cautious > 1 ? 's' : ''}` : ''}. Danger penalty ×${multiplier}.`;
}
