import { LOCATIONS } from './scenario';
import type { MissionState } from './types';
import type { RouteResult } from './route';

export type Advice = { severity: 'critical' | 'warning' | 'steady'; title: string; reason: string; action: string };
export function getAdvice(state: MissionState, route: RouteResult): Advice {
  const { supplies } = state;
  if (!route) return { severity: 'critical', title: 'No valid route to destination', reason: 'Every possible connection to The Last Beacon is blocked in the current local map.', action: 'Review blocked roads in Threat Monitor and reopen a viable connection before movement.' };
  const dangerous = route.roads.filter((road) => road.status === 'dangerous');
  if (dangerous.length) return { severity: 'critical', title: 'Selected route crosses danger', reason: `${dangerous.map((road) => road.id.replaceAll('r-', '').replaceAll('-', ' → ')).join(', ')} is marked dangerous in the current simulation.`, action: 'Recalculate and compare an alternate path before confirming the plan.' };
  if (supplies.water <= 1) return { severity: 'warning', title: 'Conserve water', reason: `Water is at ${supplies.water} ${supplies.water === 1 ? 'unit' : 'units'}; the current inventory is low.`, action: 'Avoid nonessential movement and consider the Abandoned Market as an optional resupply stop.' };
  if (supplies.food <= 2) return { severity: 'warning', title: 'Food reserves are low', reason: `Food is at ${supplies.food} units.`, action: 'Keep the shortest practical route and consider the Abandoned Market.' };
  if (supplies.medicine === 0) return { severity: 'warning', title: 'No medicine remaining', reason: 'Medicine inventory is empty.', action: 'Avoid unnecessary exposure; Old Hospital is the simulated medical supply location.' };
  if (supplies.battery <= 15) return { severity: 'warning', title: 'Battery reserve is low', reason: `Battery is at ${supplies.battery}%. Each device operation uses 5 percentage points.`, action: 'Limit device operations to essential route and coordination updates.' };
  const next = LOCATIONS.find((location) => location.id === route.locations[1]);
  return { severity: 'steady', title: `Next move: ${next?.name ?? 'Hold position'}`, reason: `The current route is ${route.distance.toFixed(1)} simulated km with no dangerous or blocked segments.`, action: 'Confirm the plan with both survivors before starting the next leg.' };
}
