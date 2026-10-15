import type { Location, MissionState, Road } from './types';

export const LOCATIONS: Location[] = [
  { id: 'safehouse', name: 'Safehouse', x: 82, y: 252, kind: 'START', description: 'Current staging point. Aarav and Mira are together here.' },
  { id: 'depot', name: 'Supply Depot', x: 245, y: 112, kind: 'SUPPLIES', description: 'A small depot with a chance of remaining food and field supplies.' },
  { id: 'bridge', name: 'North Bridge', x: 405, y: 195, kind: 'JUNCTION', description: 'A narrow crossing and critical junction. Conditions can change quickly.' },
  { id: 'hospital', name: 'Old Hospital', x: 252, y: 315, kind: 'MEDICAL', description: 'Abandoned medical wing. Useful for medicine, but exposure is uncertain.' },
  { id: 'market', name: 'Abandoned Market', x: 438, y: 365, kind: 'SUPPLIES', description: 'Scattered food and water may remain among the shuttered stalls.' },
  { id: 'shelter', name: 'Safe Shelter', x: 590, y: 242, kind: 'SAFE ZONE', description: 'A reinforced rest point before the final approach to the Beacon.' },
  { id: 'beacon', name: 'The Last Beacon', x: 750, y: 176, kind: 'DESTINATION', description: 'A fortified settlement. Mission destination and final safe zone.' },
];

export const INITIAL_ROADS: Road[] = [
  { id: 'r-safe-depot', from: 'safehouse', to: 'depot', distance: 3.2, danger: 1, status: 'safe', blocked: false },
  { id: 'r-depot-bridge', from: 'depot', to: 'bridge', distance: 4.1, danger: 2, status: 'caution', blocked: false },
  { id: 'r-safe-hospital', from: 'safehouse', to: 'hospital', distance: 4.6, danger: 1, status: 'safe', blocked: false },
  { id: 'r-hospital-market', from: 'hospital', to: 'market', distance: 3.4, danger: 1, status: 'safe', blocked: false },
  { id: 'r-market-shelter', from: 'market', to: 'shelter', distance: 4.2, danger: 1, status: 'safe', blocked: false },
  { id: 'r-bridge-shelter', from: 'bridge', to: 'shelter', distance: 3.3, danger: 1, status: 'safe', blocked: false },
  { id: 'r-bridge-beacon', from: 'bridge', to: 'beacon', distance: 5.1, danger: 2, status: 'caution', blocked: false },
  { id: 'r-shelter-beacon', from: 'shelter', to: 'beacon', distance: 3.7, danger: 1, status: 'safe', blocked: false },
  { id: 'r-depot-hospital', from: 'depot', to: 'hospital', distance: 3.8, danger: 2, status: 'caution', blocked: false },
  { id: 'r-market-beacon', from: 'market', to: 'beacon', distance: 7.2, danger: 2, status: 'caution', blocked: false },
];

export function createInitialState(): MissionState {
  return {
    supplies: { food: 6, water: 4, medicine: 2, battery: 65 },
    roads: INITIAL_ROADS.map((road) => ({ ...road })),
    survivors: [
      { name: 'Aarav', location: 'safehouse', ready: false, confirmed: false },
      { name: 'Mira', location: 'safehouse', ready: false, confirmed: false },
    ],
    log: [{ id: 1, text: 'Mission initialized. Aarav and Mira staged at Safehouse.', time: 'DAY 19 · 08:00' }],
    turn: 0,
    updatedAt: 'DAY 19 · 08:00',
    selectedLocation: null,
    dangerMultiplier: 4,
  };
}
