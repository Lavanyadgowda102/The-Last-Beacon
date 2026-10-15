export type ThreatStatus = 'safe' | 'caution' | 'dangerous' | 'blocked';
export type LocationId = 'safehouse' | 'depot' | 'bridge' | 'hospital' | 'market' | 'shelter' | 'beacon';
export type Road = { id: string; from: LocationId; to: LocationId; distance: number; danger: number; status: ThreatStatus; blocked: boolean };
export type SupplyState = { food: number; water: number; medicine: number; battery: number };
export type SurvivorState = { name: 'Aarav' | 'Mira'; location: LocationId; ready: boolean; confirmed: boolean };
export type ActivityEntry = { id: number; text: string; time: string };
export type MissionState = { supplies: SupplyState; roads: Road[]; survivors: SurvivorState[]; log: ActivityEntry[]; turn: number; updatedAt: string; selectedLocation: LocationId | null; dangerMultiplier: number; version?: number };
export type Location = { id: LocationId; name: string; x: number; y: number; kind: string; description: string };
