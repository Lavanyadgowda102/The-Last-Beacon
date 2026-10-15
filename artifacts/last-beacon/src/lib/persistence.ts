import { createInitialState, INITIAL_ROADS, LOCATIONS } from './scenario';
import type { MissionState, Road, SurvivorState, SupplyState, ThreatStatus } from './types';

const STORAGE_KEY = 'the-last-beacon-state-v1';
const statuses: ThreatStatus[] = ['safe', 'caution', 'dangerous', 'blocked'];
const validNumber = (value: unknown, max: number) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max;

export function loadState(): MissionState {
  const initial = createInitialState();
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as Partial<MissionState> | null;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.roads)) return initial;
    const supplies = parsed.supplies as SupplyState;
    if (!supplies || !validNumber(supplies.food, 99) || !validNumber(supplies.water, 99) || !validNumber(supplies.medicine, 99) || !validNumber(supplies.battery, 100)) return initial;
    const validRoads: Road[] = INITIAL_ROADS.map((base) => {
      const stored = parsed.roads?.find((item) => item?.id === base.id) as Road | undefined;
      return stored && statuses.includes(stored.status) && typeof stored.blocked === 'boolean' && validNumber(stored.danger, 3)
        ? { ...base, danger: stored.danger, status: stored.status, blocked: stored.blocked || stored.status === 'blocked' }
        : { ...base };
    });
    const people = Array.isArray(parsed.survivors) ? parsed.survivors : [];
    const survivors: SurvivorState[] = initial.survivors.map((person) => {
      const saved = people.find((item) => item?.name === person.name) as SurvivorState | undefined;
      return saved && LOCATIONS.some((location) => location.id === saved.location) && typeof saved.ready === 'boolean' && typeof saved.confirmed === 'boolean'
        ? { ...person, location: saved.location, ready: saved.ready, confirmed: saved.confirmed }
        : person;
    });
    const log = Array.isArray(parsed.log) ? parsed.log.filter((entry) => entry && typeof entry.text === 'string' && typeof entry.time === 'string').slice(0, 12) : initial.log;
    const selectedLocation = LOCATIONS.some((location) => location.id === parsed.selectedLocation) ? parsed.selectedLocation! : null;
    return { ...initial, ...parsed, supplies: { food: supplies.food, water: supplies.water, medicine: supplies.medicine, battery: supplies.battery }, roads: validRoads, survivors, log, selectedLocation, turn: Number.isInteger(parsed.turn) && parsed.turn! >= 0 ? parsed.turn! : 0, dangerMultiplier: validNumber(parsed.dangerMultiplier, 20) && parsed.dangerMultiplier! > 0 ? parsed.dangerMultiplier! : 4 };
  } catch {
    return initial;
  }
}

export function saveState(state: MissionState): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, version: 1 })); } catch { /* Private browsing or storage limits should not break local play. */ }
}
