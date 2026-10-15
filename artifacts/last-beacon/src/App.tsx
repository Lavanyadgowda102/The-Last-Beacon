import { useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, Battery, Check, ChevronRight, Compass, Crosshair, HeartPulse, Map,
  MapPin, Navigation, Package, Radio, RotateCcw, Shield, ShieldAlert, Signal, Utensils, Droplets,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CityMap } from '@/components/CityMap';
import { getAdvice } from '@/lib/advisor';
import { loadState, saveState } from '@/lib/persistence';
import { LOCATIONS, INITIAL_ROADS, createInitialState } from '@/lib/scenario';
import { findRoute, routeReason } from '@/lib/route';
import type { LocationId, MissionState, Road, ThreatStatus } from '@/lib/types';

type NavItem = { id: string; label: string; icon: LucideIcon };
const NAV: NavItem[] = [
  { id: 'overview', label: 'Mission Overview', icon: Crosshair },
  { id: 'map', label: 'City Map', icon: Map },
  { id: 'route', label: 'Route Planner', icon: Navigation },
  { id: 'supplies', label: 'Supplies', icon: Package },
  { id: 'threats', label: 'Threat Monitor', icon: ShieldAlert },
  { id: 'survivors', label: 'Coordination', icon: Radio },
  { id: 'advisor', label: 'Survival Advisor', icon: Activity },
];
const RESOURCE_INFO: { key: keyof MissionState['supplies']; title: string; icon: LucideIcon; maximum: number; unit: string; action: string }[] = [
  { key: 'food', title: 'Food', icon: Utensils, maximum: 8, unit: 'units', action: 'Consume 1' },
  { key: 'water', title: 'Water', icon: Droplets, maximum: 8, unit: 'units', action: 'Consume 1' },
  { key: 'medicine', title: 'Medicine', icon: HeartPulse, maximum: 5, unit: 'units', action: 'Use 1' },
  { key: 'battery', title: 'Battery', icon: Battery, maximum: 100, unit: '%', action: 'Device op −5%' },
];
const timeTag = (turn: number) => `DAY 19 · TURN ${String(turn).padStart(2, '0')}`;
const locationName = (id: LocationId) => LOCATIONS.find((location) => location.id === id)?.name ?? id;
const friendlyRoad = (road: Road) => `${locationName(road.from)} — ${locationName(road.to)}`;

function App() {
  const [state, setState] = useState<MissionState>(() => loadState());
  const [active, setActive] = useState('overview');
  const [toast, setToast] = useState('');
  const [selectedRoadId, setSelectedRoadId] = useState<string | null>(null);
  const route = useMemo(() => findRoute(state.roads, 'safehouse', 'beacon', state.dangerMultiplier), [state.roads, state.dangerMultiplier]);
  const advice = useMemo(() => getAdvice(state, route), [state, route]);
  const selectedLocation = LOCATIONS.find((location) => location.id === state.selectedLocation);
  const selectedRoad = state.roads.find((road) => road.id === selectedRoadId);
  const threatening = state.roads.filter((road) => road.status === 'dangerous' || road.blocked);
  const riskCount = state.roads.filter((road) => road.status === 'dangerous' || road.blocked).length;

  useEffect(() => { saveState(state); }, [state]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const record = (text: string) => {
    setState((current) => {
      const turn = current.turn + 1;
      const updatedAt = timeTag(turn);
      return { ...current, turn, updatedAt, log: [{ id: Date.now(), text, time: updatedAt }, ...current.log].slice(0, 12) };
    });
  };
  const update = (change: (current: MissionState) => MissionState, message?: string) => {
    setState((current) => change(current));
    if (message) { record(message); setToast(message); }
  };
  const goTo = (id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const recalculate = () => { record(route ? `Route recalculated: ${route.distance.toFixed(1)} simulated km to The Last Beacon.` : 'Route recalculated: no valid route reaches The Last Beacon.'); setToast(route ? 'Route recalculated from current road conditions.' : 'No unblocked route available.'); };
  const changeThreat = (roadId: string, status: ThreatStatus) => {
    update((current) => ({ ...current, roads: current.roads.map((road) => road.id === roadId ? { ...road, status, blocked: status === 'blocked', danger: status === 'safe' ? 0 : status === 'caution' ? 1 : status === 'dangerous' ? 3 : road.danger } : road) }), `${friendlyRoad(state.roads.find((road) => road.id === roadId)!)} set to ${status}.`);
  };
  const demoThreat = () => {
    if (!route || route.roads.length === 0) {
      setToast('No current route to disrupt. Reopen a road first.');
      return;
    }
    const roadIds = new Set(route.roads.map((road) => road.id));
    update((current) => ({ ...current, roads: current.roads.map((road) => roadIds.has(road.id) ? { ...road, status: 'blocked', blocked: true } : road) }),
      `DEMO: blocked ${route.roads.length} current-route segment${route.roads.length === 1 ? '' : 's'} to force an alternate.`);
    setToast('Demo threat applied. Blocked roads are removed from the route calculation.');
  };
  const updateThreats = () => {
    const target = state.roads.find((road) => road.status === 'safe') ?? state.roads[state.turn % state.roads.length];
    if (!target) return;
    const nextStatus: ThreatStatus = target.status === 'safe' ? 'caution' : target.status === 'caution' ? 'dangerous' : target.status === 'dangerous' ? 'blocked' : 'safe';
    const danger = nextStatus === 'safe' ? 0 : nextStatus === 'caution' ? 1 : nextStatus === 'dangerous' ? 3 : target.danger;
    update((current) => ({ ...current, roads: current.roads.map((road) => road.id === target.id ? { ...road, status: nextStatus, danger, blocked: nextStatus === 'blocked' } : road) }), `Local threat update: ${friendlyRoad(target)} is now ${nextStatus}.`);
  };
  const reset = (whole: boolean) => {
    if (whole) {
      setState(createInitialState());
      setToast('Demo restored to initial values.');
    } else {
      update((current) => ({ ...current, roads: INITIAL_ROADS.map((road) => ({ ...road })) }), 'Threat scenario reset to initial road conditions.');
      setToast('Road scenario restored to initial conditions.');
    }
    setSelectedRoadId(null);
  };
  const supplyAction = (key: keyof MissionState['supplies']) => {
    const current = state.supplies[key];
    if (current <= 0) return;
    update((previous) => ({ ...previous, supplies: { ...previous.supplies, [key]: Math.max(0, key === 'battery' ? current - 5 : current - 1) } }), key === 'battery' ? 'Device operation simulated. Battery −5 percentage points.' : `${key[0].toUpperCase()}${key.slice(1)} used. Inventory updated.`);
  };
  const survivorUpdate = (name: 'Aarav' | 'Mira', field: 'ready' | 'confirmed') => {
    const currentPerson = state.survivors.find((person) => person.name === name)!;
    const nextValue = !currentPerson[field];
    update((previous) => ({ ...previous, survivors: previous.survivors.map((person) => person.name === name ? { ...person, [field]: nextValue } : person) }), `${name} ${field === 'ready' ? (nextValue ? 'marked ready' : 'readiness withdrawn') : (nextValue ? 'confirmed the plan' : 'plan confirmation withdrawn')}.`);
  };
  const confirmGroup = () => {
    const allConfirmed = state.survivors.every((person) => person.confirmed);
    update((previous) => ({ ...previous, survivors: previous.survivors.map((person) => ({ ...person, confirmed: !allConfirmed })) }), allConfirmed ? 'Plan confirmation cleared for both survivors.' : 'Plan confirmed locally for Aarav and Mira.');
  };

  const renderNav = (mobile = false) => <nav className={mobile ? 'mobile-nav' : 'nav-list'} aria-label="Dashboard sections">
    {NAV.map(({ id, label, icon: Icon }) => <button key={id} className={`${mobile ? '' : 'nav-item'} ${active === id ? 'active' : ''}`} onClick={() => goTo(id)} data-testid={`nav-${id}`} aria-current={active === id ? 'page' : undefined}>
      <Icon size={mobile ? 18 : 16} strokeWidth={1.8} /><span className={mobile ? 'nav-mobile-label' : ''}>{mobile ? ({ overview: 'Mission', map: 'Map', route: 'Route', supplies: 'Supply', threats: 'Threat', survivors: 'Team', advisor: 'Advisor' }[id]) : label}</span>
    </button>)}
  </nav>;

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Radio size={20} /></div><div><div className="brand-title">THE LAST BEACON</div><div className="brand-sub">OFFLINE SURVIVAL COORDINATION</div></div></div>
      <div className="nav-caption">Operations</div>{renderNav()}
      <div className="sidebar-bottom">
        <div className="offline-card"><span className="offline-dot" /> LOCAL SYSTEM ACTIVE<br />All map, threat, and survivor data is simulated and saved only on this device.</div>
        <div className="side-footer">BUILD 19.04 · FICTIONAL SCENARIO</div>
      </div>
    </aside>
    <main className="main-area">
      <header className="topbar">
        <div className="top-status"><span className="offline-dot" /> OFFLINE · LOCAL DATA <span className="sim-label">SIMULATION ONLY</span></div>
        <div className="top-right"><span className="day-chip">DAY 19</span><button className="reset-btn" onClick={() => reset(true)} data-testid="button-reset-demo"><RotateCcw size={12} /> Reset Demo</button></div>
      </header>

      <section id="overview" className="page-section">
        <div className="page-head">
          <div><div className="eyebrow">GREYLINE DISTRICT / MISSION 019</div><h1 className="page-title">Plan smart. Adapt fast. Reach the beacon.</h1><p className="tagline">Aarav and Mira are moving toward a safer horizon.</p></div>
          <div className="simulated-note">FICTIONAL CITY · ALL VALUES SIMULATED</div>
        </div>
        <div className="dashboard-grid">
          <div className="stack">
            <section id="map" className="panel page-section" aria-label="Interactive City Map">
              <div className="panel-pad">
                <div className="panel-head"><div><h2 className="panel-title"><MapPin size={15} /> Interactive City Map</h2><div className="subtle" style={{ marginTop: 5 }}>Select any location or road to inspect local conditions.</div></div><span className="status-pill safe">LIVE SIM STATE</span></div>
              </div>
              <CityMap locations={LOCATIONS} roads={state.roads} route={route} selected={state.selectedLocation} onSelect={(id) => update((current) => ({ ...current, selectedLocation: id }))} onRoadSelect={(road) => { setSelectedRoadId(road.id); update((current) => ({ ...current, selectedLocation: null })); }} />
              <div className="map-legend">
                {[['safe', 'Safe'], ['caution', 'Caution'], ['dangerous', 'Dangerous'], ['blocked', 'Blocked'], ['route', 'Selected route']].map(([klass, label]) => <span className="legend-item" key={klass}><i className={`legend-dot ${klass}`} />{label}</span>)}
              </div>
              <div className="map-info">
                <div>{selectedLocation ? <><strong data-testid="text-selected-location">{selectedLocation.name}</strong><span className="location-status"> · {selectedLocation.kind}</span><p>{selectedLocation.description}</p></> : selectedRoad ? <><strong data-testid="text-selected-road">{friendlyRoad(selectedRoad)}</strong><p>{selectedRoad.distance.toFixed(1)} simulated km · danger {selectedRoad.danger}/3 · {selectedRoad.status}{selectedRoad.blocked ? ' · excluded from route' : ''}</p></> : <><strong>Route origin <span style={{ color: '#69d69e' }}>Safehouse</span> <ChevronRight size={12} /> destination <span style={{ color: '#69d69e' }}>The Last Beacon</span></strong><p>Road lengths are simulated planning values, not real-world distances.</p></>}</div>
                <button className="icon-btn" aria-label="Clear map selection" onClick={() => { setSelectedRoadId(null); update((current) => ({ ...current, selectedLocation: null })); }} data-testid="button-clear-selection"><Crosshair size={15} /></button>
              </div>
            </section>

            <section id="route" className="panel page-section">
              <div className="panel-pad">
                <div className="panel-head"><div><h2 className="panel-title"><Navigation size={15} /> Route Planner</h2><div className="subtle" style={{ marginTop: 5 }}>Dijkstra route engine · blocked roads excluded</div></div><button className="btn primary" onClick={recalculate} data-testid="button-recalculate-route"><RotateCcw size={13} /> Recalculate Route</button></div>
                {route ? <>
                  <div className="route-summary"><div><div className="metric-label">SELECTED ROUTE DISTANCE</div><div className="route-distance" data-testid="text-route-distance">{route.distance.toFixed(1)} <span style={{ fontSize: 10 }}>sim km</span></div></div><span className="status-pill safe">{route.roads.length} ROAD LEGS</span></div>
                  <div className="route-steps" data-testid="route-stops">{route.locations.map((id, index) => <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>{index > 0 && <span className="route-arrow">→</span>}<span className="route-stop">{locationName(id)}</span></span>)}</div>
                  <div className="reason" data-testid="text-route-reason">{routeReason(route, state.dangerMultiplier)}</div>
                </> : <div className="empty-state" data-testid="empty-no-route"><ShieldAlert size={20} /><p>No valid route to The Last Beacon. No blocked road is included in a route.</p><button className="btn ghost" onClick={() => goTo('threats')}>Review road conditions</button></div>}
                <div className="route-settings"><label className="metric-label" htmlFor="danger-multiplier">DANGER WEIGHT ×{state.dangerMultiplier}</label><input id="danger-multiplier" type="range" min="1" max="8" value={state.dangerMultiplier} onChange={(event) => update((current) => ({ ...current, dangerMultiplier: Number(event.target.value) }))} data-testid="input-danger-multiplier" /><span className="subtle">Higher = safer route preference</span></div>
              </div>
            </section>

            <section id="supplies" className="panel page-section">
              <div className="panel-pad">
                <div className="panel-head"><div><h2 className="panel-title"><Package size={15} /> Supply Inventory</h2><div className="subtle" style={{ marginTop: 5 }}>Local inventory · actions update advisor immediately</div></div><span className="status-pill safe">PERSISTED LOCALLY</span></div>
                <div className="stat-row">{RESOURCE_INFO.map(({ key, title, icon: Icon, maximum, unit, action }) => {
                  const value = state.supplies[key]; const low = key === 'battery' ? value <= 15 : value <= (key === 'medicine' ? 0 : 2);
                  return <div key={key} className={`resource-card ${low ? 'low' : ''}`} data-testid={`card-resource-${key}`}>
                    <div className="resource-top"><span className="resource-name">{title}</span><Icon size={14} /></div>
                    <div className="resource-value" data-testid={`text-resource-${key}`}>{value}<span className="resource-unit"> {unit}</span></div>
                    <div className="meter"><span style={{ width: `${Math.min(100, value / maximum * 100)}%` }} /></div>
                    <div className="resource-actions"><button className="btn ghost" disabled={value <= 0} onClick={() => supplyAction(key)} data-testid={`button-use-${key}`}>{action}</button></div>
                  </div>;
                })}</div>
                {(state.supplies.water <= 1 || state.supplies.food <= 2 || state.supplies.medicine === 0 || state.supplies.battery <= 15) && <div className="alert-line"><AlertTriangle size={15} /><span>Low-resource warning: {state.supplies.water <= 1 ? 'water reserve is low. ' : ''}{state.supplies.food <= 2 ? 'food reserve is low. ' : ''}{state.supplies.medicine === 0 ? 'medicine is exhausted. ' : ''}{state.supplies.battery <= 15 ? 'battery is low. ' : ''}Actions remain disabled when a resource reaches zero.</span></div>}
              </div>
            </section>
          </div>
          <div className="stack">
            <section className="panel panel-pad" aria-label="Mission status">
              <div className="panel-head"><h2 className="panel-title"><Shield size={15} /> Mission Overview</h2><span className="status-pill safe">DAY 19</span></div>
              <div className="eyebrow">OBJECTIVE</div><div style={{ fontSize: 18, fontWeight: 800, marginTop: 6, color: '#e5eeea' }}>Reach The Last Beacon</div>
              <p className="local-warning" style={{ margin: '7px 0 14px' }}>Two survivors. One shared plan. No network required.</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #2c353b', paddingTop: 12, gap: 10 }}>
                <div><div className="metric-label">SURVIVORS</div><strong style={{ fontSize: 13 }}>2 / 2 together</strong></div>
                <div><div className="metric-label">ROAD THREATS</div><strong style={{ color: riskCount ? '#efc06b' : '#7cdaa9', fontSize: 13 }} data-testid="text-threat-count">{riskCount} roads</strong></div>
              </div>
            </section>
            <section id="advisor" className="panel panel-pad page-section">
              <div className="panel-head"><h2 className="panel-title"><Compass size={15} /> Survival Advisor</h2><span className="subtle">RULE-BASED</span></div>
              <div className="advisor-card" data-testid="card-advisor">
                <div className={`advisor-severity ${advice.severity}`}><span className="offline-dot" style={{ background: advice.severity === 'critical' ? '#ee8078' : advice.severity === 'warning' ? '#e8ba5c' : undefined }} />{advice.severity} · LOCAL RULE</div>
                <div className="advisor-title" data-testid="text-advisor-title">{advice.title}</div>
                <p className="advisor-copy" data-testid="text-advisor-reason">{advice.reason}</p>
                <div className="advisor-action"><strong>Recommended:</strong> {advice.action}</div>
              </div>
              <p className="local-warning" style={{ marginBottom: 0 }}>Transparent rules read the current route, road states, supplies, and confirmation state. Not AI or real-world guidance.</p>
            </section>
            <section id="threats" className="panel panel-pad page-section">
              <div className="panel-head"><div><h2 className="panel-title"><ShieldAlert size={15} /> Threat Monitor</h2><div className="subtle" style={{ marginTop: 5 }}>All threat states are simulated locally.</div></div></div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                <button className="btn primary" onClick={demoThreat} disabled={!route} data-testid="button-demo-threat"><AlertTriangle size={13} /> Demo: block current route</button>
                <button className="btn ghost" onClick={updateThreats} data-testid="button-update-threats"><Activity size={13} /> Update Threats</button>
              </div>
              <div className="threat-list">{state.roads.map((road) => <div className="threat-row" key={road.id} data-testid={`row-threat-${road.id}`}>
                <div style={{ minWidth: 0 }}><div className="road-name">{friendlyRoad(road)}</div><div className="road-meta">{road.distance.toFixed(1)} sim km · danger {road.danger}/3</div></div>
                <div className="road-controls"><span className={`status-pill ${road.status}`}>{road.status}</span><select aria-label={`Set ${friendlyRoad(road)} threat state`} value={road.status} onChange={(event) => changeThreat(road.id, event.target.value as ThreatStatus)} data-testid={`select-road-state-${road.id}`}>
                  {(['safe', 'caution', 'dangerous', 'blocked'] as ThreatStatus[]).map((status) => <option key={status} value={status}>{status}</option>)}
                </select></div>
              </div>)}</div>
              <div className="alert-line" style={{ borderColor: '#313c42', background: '#1a2227', color: '#a9b8b3' }}><Signal size={14} /><span>{riskCount ? `${riskCount} road${riskCount === 1 ? '' : 's'} currently dangerous or blocked.` : 'No roads currently dangerous or blocked.'} Latest local update: {state.updatedAt}. {threatening.length ? `${threatening.length} affected segment${threatening.length === 1 ? '' : 's'} excluded or flagged.` : 'No flagged segments.'}</span></div>
              <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => reset(false)} data-testid="button-reset-scenario"><RotateCcw size={13} /> Reset Scenario</button>
            </section>
            <section id="survivors" className="panel panel-pad page-section">
              <div className="panel-head"><div><h2 className="panel-title"><Radio size={15} /> Survivor Coordination</h2><div className="subtle" style={{ marginTop: 5 }}>Shared local dashboard state · no phone-to-phone sync</div></div><button className="btn primary" onClick={confirmGroup} data-testid="button-confirm-plan"><Check size={13} /> {state.survivors.every((person) => person.confirmed) ? 'Clear Confirmations' : 'Confirm Plan'}</button></div>
              <div className="survivor-grid">{state.survivors.map((person) => <article className="survivor-card" key={person.name} data-testid={`card-survivor-${person.name.toLowerCase()}`}>
                <div className="survivor-top"><div><div className="survivor-name">{person.name}</div><div className="survivor-detail" style={{ marginTop: 4 }}>At {locationName(person.location)}</div></div><div className="survivor-avatar">{person.name.slice(0, 1)}</div></div>
                <div style={{ display: 'flex', gap: 6, margin: '10px 0' }}><span className={`status-pill ${person.confirmed ? 'ready' : 'pending'}`}>{person.confirmed ? 'CONFIRMED' : 'PENDING'}</span><span className={`status-pill ${person.ready ? 'ready' : 'pending'}`}>{person.ready ? 'READY' : 'NOT READY'}</span></div>
                <div className="survivor-action">{route ? `Next action: ${locationName(route.locations[1] ?? 'beacon')} via the selected route.` : 'Next action: hold at Safehouse until a route is available.'}</div>
                <div className="survivor-buttons"><button className={`btn ${person.ready ? 'ghost' : ''}`} onClick={() => survivorUpdate(person.name, 'ready')} data-testid={`button-ready-${person.name.toLowerCase()}`}>{person.ready ? 'Undo Ready' : 'Mark Ready'}</button><button className="btn ghost" onClick={() => survivorUpdate(person.name, 'confirmed')} data-testid={`button-confirm-${person.name.toLowerCase()}`}>{person.confirmed ? 'Unconfirm' : 'Confirm Plan'}</button></div>
              </article>)}</div>
              <div className="alert-line" style={{ borderColor: '#303b42', background: '#192126', color: '#abb8b4' }}><Radio size={14} /><span>Coordination changes are stored on this device only. Separate phones do not synchronize.</span></div>
            </section>
            <section className="panel panel-pad page-section">
              <div className="panel-head"><h2 className="panel-title"><Activity size={15} /> Recent Activity</h2><span className="subtle">LOCAL LOG · {state.log.length} EVENTS</span></div>
              {state.log.length ? <div className="activity">{state.log.map((entry) => <div className="activity-item" key={entry.id} data-testid={`log-entry-${entry.id}`}><i className="activity-dot" /><span>{entry.text}</span><time className="activity-time">{entry.time}</time></div>)}</div> : <div className="empty-state"><p>No local activity yet.</p></div>}
            </section>
          </div>
        </div>
        <footer className="local-warning" style={{ marginTop: 22, padding: '14px 4px', borderTop: '1px solid #273038' }}>THE LAST BEACON is a fictional hackathon simulation. Distances, threats, survival information, and coordination states are simulated and local-only. Not an emergency service, real navigation, or a communication tool.</footer>
      </section>
    </main>
    {renderNav(true)}
    {toast && <div className="toast-msg" role="status" data-testid="status-toast">{toast}</div>}
  </div>;
}

export default App;
