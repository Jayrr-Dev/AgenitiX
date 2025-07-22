/**
 * TELEMETRY CLIENT (Placeholder) - In-memory/localStorage implementation
 *
 * • Provides a drop-in interface compatible with future Convex backend
 * • Stores counts per node type & per ISO date in localStorage during development
 * • All methods are NOOP in production until real backend is wired
 * • Centralised here so swapping to Convex means replacing only this file
 *
 * Keywords: telemetry, analytics, placeholder, Convex, node-events
 */

// ---------------------------------------------------------------------------
// Public API types
// ---------------------------------------------------------------------------

export type TelemetryEventName = "node_created" | "node_deleted" | "node_error";

export interface TelemetryPayload {
	nodeId: string;
	nodeKind: string;
	timestamp: number; // Unix epoch ms
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = "agenitix.telemetry";

interface TelemetryStorage {
	// Nested counts: { [eventName]: { [date]: { [nodeKind]: number } } }
	counts: Record<string, Record<string, Record<string, number>>>;
}

const loadStorage = (): TelemetryStorage => {
	if (typeof window === "undefined") return { counts: {} };
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw) return JSON.parse(raw);
	} catch {
		/* ignore */
	}
	return { counts: {} };
};

const saveStorage = (data: TelemetryStorage) => {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	} catch {
		/* ignore */
	}
};

// ---------------------------------------------------------------------------
// Client implementation
// ---------------------------------------------------------------------------

export const TelemetryClient = {
	/**
	 * Send a telemetry event. In dev it increments counters in localStorage.
	 */
	send(event: TelemetryEventName, payload: TelemetryPayload) {
		if (process.env.NODE_ENV !== "development") {
			// TODO: integrate Convex / real backend in production
			return;
		}

		const dateKey = new Date(payload.timestamp).toISOString().slice(0, 10); // YYYY-MM-DD
		const store = loadStorage();

		if (!store.counts[event]) store.counts[event] = {};
		if (!store.counts[event][dateKey]) store.counts[event][dateKey] = {};
		if (!store.counts[event][dateKey][payload.nodeKind])
			store.counts[event][dateKey][payload.nodeKind] = 0;

		store.counts[event][dateKey][payload.nodeKind] += 1;
		saveStorage(store);

		// eslint-disable-next-line no-console
		console.info(
			`📡 [Telemetry] ${event} | ${payload.nodeKind} | ${dateKey} | total:`,
			store.counts[event][dateKey][payload.nodeKind]
		);
	},

	/** Utility to read current counts (development only). */
	getCounts() {
		return loadStorage().counts;
	},
};
