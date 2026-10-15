# THE LAST BEACON

**Offline Survival Coordination System**  
“Plan smart. Adapt fast. Reach the beacon.”

THE LAST BEACON is a fictional, local-only survival coordination simulator built for a student hackathon. Aarav and Mira plan a route through a changing city, manage limited supplies, and coordinate their next move toward a fortified settlement.

This is a fictional simulation—not a real emergency-response, navigation, or threat-detection system. Distances and survivor updates are simulated and saved only in the current browser. There is no phone-to-phone synchronization.

## Run locally

From the workspace root:

```bash
pnpm install
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/last-beacon run dev
```

The Replit preview supplies `PORT` and `BASE_PATH` through its workflow. The project uses React, TypeScript, Vite, and browser `localStorage`. Core interactions do not make network requests and do not require an API key, account, or backend.

## Route planner

The city is represented as a weighted graph. Dijkstra's shortest-path algorithm searches from Safehouse to The Last Beacon. A road's cost is its simulated distance plus its danger score multiplied by a configurable danger multiplier. Blocked roads are excluded, so the planner can never select one. Threat changes trigger a fresh route calculation; if no path remains, the app reports that directly.

## Features

- Interactive fictional city map with locations, roads, and threat states.
- Threat-aware route recalculation and a reproducible demo scenario.
- Food, water, medicine, and battery tracking with guarded consumption.
- Local readiness and plan-confirmation controls for Aarav and Mira.
- Rule-based survival advice derived from the current route and supplies.
- Browser persistence and a reset to the original demo scenario.
- Responsive dashboard with explicit fictional, offline, and local-data labels.

## 60–90 second demo

1. Start on the mission overview and point out Day 19, the selected route, and local-only status.
2. Open the map and inventory to show the city graph and initial supplies.
3. Trigger the deterministic threat demonstration and show the route change.
4. Consume one supply and show the inventory and advisor update.
5. Mark Aarav and Mira ready, then confirm the plan.
6. Refresh to show local state persistence.
7. Reset the demo to restore the initial scenario.

## Limitations

- This is a single-browser simulation; it does not sync survivors across devices.
- The map, distances, threat levels, and route are fictional and are not GPS data.
- Threats are user-triggered local scenario changes, not real-world detection.
- Offline reopening depends on the browser having loaded and cached the app; this prototype does not claim full offline installation or service-worker support.
