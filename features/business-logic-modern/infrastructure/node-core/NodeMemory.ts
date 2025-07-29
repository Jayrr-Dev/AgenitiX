/* eslint-disable @typescript-eslint/ban-types */
/**
 * NODE MEMORY SYSTEM (v2) — per‑node programmable cache with isolation
 *
 * – Size & entry caps, four eviction strategies, per‑key TTL
 * – Optional persistence via pluggable StorageAdapter (default: localStorage in browser)
 * – Accurate metrics & pressure index
 * – Environment‑agnostic (Node, browser, edge)
 */

import { z } from "zod";

/* ------------------------------------------------------------------ */
/* 0. Browser-compatible EventEmitter                                */
/* ------------------------------------------------------------------ */

class BrowserEventEmitter {
	private listeners = new Map<string, Array<(...args: unknown[]) => void>>();

	on(event: string, listener: (...args: unknown[]) => void): this {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, []);
		}
		this.listeners.get(event)!.push(listener);
		return this;
	}

	emit(event: string, ...args: unknown[]): boolean {
		const eventListeners = this.listeners.get(event);
		if (!eventListeners || eventListeners.length === 0) {
			return false;
		}
		
		eventListeners.forEach(listener => {
			try {
				listener(...args);
			} catch (error) {
				console.error(`Error in event listener for ${event}:`, error);
			}
		});
		
		return true;
	}

	removeAllListeners(event?: string): this {
		if (event) {
			this.listeners.delete(event);
		} else {
			this.listeners.clear();
		}
		return this;
	}

	off(event: string, listener: (...args: unknown[]) => void): this {
		const eventListeners = this.listeners.get(event);
		if (!eventListeners) {
			return this;
		}
		
		const index = eventListeners.indexOf(listener);
		if (index > -1) {
			eventListeners.splice(index, 1);
		}
		
		if (eventListeners.length === 0) {
			this.listeners.delete(event);
		}
		
		return this;
	}
}

/* ------------------------------------------------------------------ */
/* 1. Public config / types                                            */
/* ------------------------------------------------------------------ */

export const NodeMemoryConfigSchema = z.object({
	maxSize: z
		.number()
		.int()
		.positive()
		.default(1024 * 1024), // bytes
	maxEntries: z.number().int().positive().default(1_000),
	defaultTTL: z.number().int().positive().default(3_600_000), // ms
	persistent: z.boolean().default(false),
	evictionPolicy: z.enum(["LRU", "LFU", "FIFO", "TTL"]).default("LRU"),
	analytics: z.boolean().default(true),
	serializer: z.enum(["json", "msgpack"]).default("json"),
});

export type NodeMemoryConfig = z.infer<typeof NodeMemoryConfigSchema>;

export interface MemoryEntry<T = unknown> {
	value: T;
	createdAt: number;
	lastAccessed: number;
	accessCount: number;
	ttl: number | null;
	size: number;
	tags?: string[];
}

export interface MemoryMetrics {
	totalSize: number;
	entryCount: number;
	hit: number;
	miss: number;
	eviction: number;
	lastCleanup: number;
	pressure: number; // max(sizeRatio, countRatio) 0‑1
}

/* ------------------------------------------------------------------ */
/* 2. Pluggable storage adapter                                        */
/* ------------------------------------------------------------------ */

export interface StorageAdapter {
	load(nodeId: string): Promise<Record<string, MemoryEntry> | null>;
	save(nodeId: string, data: Record<string, MemoryEntry>): Promise<void>;
	delete(nodeId: string): Promise<void>;
}

/** Default adapter – browser only (localStorage). No‑op in Node/Edge */
export const LocalStorageAdapter: StorageAdapter = {
	async load(id) {
		if (typeof localStorage === "undefined") {
			return null;
		}
		try {
			return JSON.parse(localStorage.getItem(`node_mem_${id}`) ?? "null");
		} catch {
			return null;
		}
	},
	async save(id, data) {
		if (typeof localStorage !== "undefined") {
			localStorage.setItem(`node_mem_${id}`, JSON.stringify(data));
		}
	},
	async delete(id) {
		if (typeof localStorage !== "undefined") {
			localStorage.removeItem(`node_mem_${id}`);
		}
	},
};

/* ------------------------------------------------------------------ */
/* 3. Main class                                                       */
/* ------------------------------------------------------------------ */

export class NodeMemoryManager extends BrowserEventEmitter {
	private readonly cache = new Map<string, MemoryEntry>();
	private readonly cfg: Required<NodeMemoryConfig>;
	private readonly metrics: MemoryMetrics = {
		totalSize: 0,
		entryCount: 0,
		hit: 0,
		miss: 0,
		eviction: 0,
		lastCleanup: Date.now(),
		pressure: 0,
	};

	private persistQueued = false;
	private cleanupTimer?: ReturnType<typeof setInterval>;

	constructor(
		private readonly nodeId: string,
		cfg: NodeMemoryConfig = {
			maxSize: 0,
			maxEntries: 0,
			defaultTTL: 0,
			persistent: false,
			evictionPolicy: "LRU",
			analytics: false,
			serializer: "json",
		},
		private adapter: StorageAdapter = LocalStorageAdapter
	) {
		super();
		this.cfg = NodeMemoryConfigSchema.parse(cfg) as Required<NodeMemoryConfig>;

		if (this.cfg.persistent) {
			this.adapter.load(nodeId).then((data) => {
				if (data) {
					Object.entries(data).forEach(([k, v]) => this.cache.set(k, v));
					this.recalcMetrics();
				}
			});
		}

		/* periodic TTL cleanup */
		this.cleanupTimer = setInterval(() => this.gc(), 5 * 60_000);
	}

	/* -------------------------------------------------------------- */
	/*  Public API                                                    */
	/* -------------------------------------------------------------- */

	set<T>(key: string, value: T, ttl = this.cfg.defaultTTL): T | undefined {
		this.assertKey(key);

		const serial = this.serialize(value);
		const size = this.byteSize(serial);

		if (size > this.cfg.maxSize) {
			throw new Error("MEMORY_FULL: entry too large");
		}

		/* overwrite handling */
		if (this.cache.has(key)) {
			this.removeEntry(key);
		}

		this.ensureCapacity(size);

		const now = Date.now();
		this.cache.set(key, {
			value,
			createdAt: now,
			lastAccessed: now,
			accessCount: 1,
			ttl,
			size,
		});

		this.metrics.totalSize += size;
		this.metrics.entryCount = this.cache.size;
		this.updatePressure();
		this.emit("set", key);

		this.queuePersist();
		return value;
	}

	get<T>(key: string): T | undefined {
		const e = this.cache.get(key);
		if (!e || this.isExpired(e)) {
			if (e) {
				this.removeEntry(key);
			}
			this.metrics.miss++;
			this.updatePressure();
			this.emit("miss", key);
			return undefined;
		}

		e.lastAccessed = Date.now();
		e.accessCount++;
		this.metrics.hit++;
		this.emit("hit", key);
		return e.value as T;
	}

	has(key: string): boolean {
		return this.get(key) !== undefined;
	}

	delete(key: string): boolean {
		const existed = this.cache.has(key);
		if (existed) {
			this.removeEntry(key);
		}
		return existed;
	}

	clear(): void {
		this.cache.forEach((_, k) => this.cache.delete(k));
		this.recalcMetrics();
		this.queuePersist();
		this.emit("clear");
	}

	compute<T>(key: string, fn: () => Promise<T> | T, ttl?: number): Promise<T> {
		const cached = this.get<T>(key);
		if (cached !== undefined) {
			return Promise.resolve(cached);
		}

		return Promise.resolve(fn()).then((val) => {
			this.set(key, val, ttl);
			return val;
		});
	}

	size(): number {
		return this.metrics.totalSize;
	}

	count(): number {
		return this.cache.size;
	}

	stats(): Readonly<MemoryMetrics> {
		return { ...this.metrics };
	}

	/** remove expired & return freed byte count */
	gc(): { evicted: number; freed: number } {
		let freed = 0;
		let evicted = 0;
		const now = Date.now();

		for (const [k, v] of Array.from(this.cache.entries())) {
			if (this.isExpired(v, now)) {
				this.cache.delete(k);
				freed += v.size;
				evicted++;
			}
		}
		if (freed) {
			this.metrics.totalSize -= freed;
			this.metrics.entryCount = this.cache.size;
			this.metrics.eviction += evicted;
			this.updatePressure();
			this.queuePersist();
			this.emit("gc", { evicted, freed });
		}
		this.metrics.lastCleanup = now;
		return { evicted, freed };
	}

	destroy(): void {
		clearInterval(this.cleanupTimer);
		this.queuePersist(true);
		this.removeAllListeners();
	}

	/* -------------------------------------------------------------- */
	/*  Private helpers                                               */
	/* -------------------------------------------------------------- */

	private assertKey(key: string) {
		if (!key || key.length > 250) {
			throw new Error("INVALID_KEY");
		}
	}

	private serialize(v: unknown): string {
		return this.cfg.serializer === "json" ? JSON.stringify(v) : JSON.stringify(v); // placeholder for msgpack
	}

	private byteSize(str: string): number {
		/* Node & Edge have Buffer; browser has TextEncoder. */
		if (typeof Buffer !== "undefined") {
			return Buffer.byteLength(str);
		}
		return new TextEncoder().encode(str).length;
	}

	private isExpired(e: MemoryEntry, now = Date.now()): boolean {
		return e.ttl !== null && now - e.lastAccessed > e.ttl;
	}

	private removeEntry(key: string) {
		const e = this.cache.get(key);
		if (!e) {
			return;
		}
		this.cache.delete(key);
		this.metrics.totalSize -= e.size;
		this.metrics.entryCount = this.cache.size;
	}

	private ensureCapacity(extraBytes: number) {
		while (
			(this.metrics.totalSize + extraBytes > this.cfg.maxSize ||
				this.cache.size >= this.cfg.maxEntries) &&
			this.cache.size
		) {
			this.evictOne();
		}
	}

	private evictOne() {
		let targetKey: string | undefined;
		const entries = Array.from(this.cache.entries());

		switch (this.cfg.evictionPolicy) {
			case "LFU":
				targetKey = entries.reduce((a, b) => (a[1].accessCount <= b[1].accessCount ? a : b))[0];
				break;
			case "FIFO":
				targetKey = Array.from(this.cache.keys())[0];
				break;
			case "TTL":
				targetKey = entries.filter(([_, v]) => this.isExpired(v)).map(([k]) => k)[0];
				break;
			default:
				targetKey = entries.reduce((a, b) => (a[1].lastAccessed <= b[1].lastAccessed ? a : b))[0];
		}
		if (targetKey) {
			this.removeEntry(targetKey);
			this.metrics.eviction++;
			this.emit("evict", targetKey);
		}
	}

	private recalcMetrics() {
		this.metrics.totalSize = Array.from(this.cache.values()).reduce((acc, e) => acc + e.size, 0);
		this.metrics.entryCount = this.cache.size;
		this.updatePressure();
	}

	private updatePressure() {
		this.metrics.pressure = Math.max(
			this.metrics.totalSize / this.cfg.maxSize,
			this.metrics.entryCount / this.cfg.maxEntries
		);
	}

	/* ---------- persistence (debounced) ---------- */

	private queuePersist(flush = false) {
		if (!this.cfg.persistent) {
			return;
		}
		if (flush) {
			return void this.persistNow();
		}

		if (!this.persistQueued) {
			this.persistQueued = true;
			/* use micro‑task queue to batch multiple writes in same tick */
			queueMicrotask(() => {
				this.persistNow();
				this.persistQueued = false;
			});
		}
	}

	private async persistNow() {
		await this.adapter.save(this.nodeId, Object.fromEntries(this.cache.entries()));
	}
}

/* ------------------------------------------------------------------ */
/* 4. Global manager (singleton)                                       */
/* ------------------------------------------------------------------ */

export class GlobalNodeMemoryManager {
	private readonly map = new Map<string, NodeMemoryManager>();
	constructor(private adapter: StorageAdapter = LocalStorageAdapter) {}

	get(nodeId: string, cfg?: NodeMemoryConfig) {
		if (!this.map.has(nodeId)) {
			this.map.set(nodeId, new NodeMemoryManager(nodeId, cfg, this.adapter));
		}
		return this.map.get(nodeId)!;
	}

	destroy(nodeId: string) {
		this.map.get(nodeId)?.destroy();
		this.map.delete(nodeId);
	}

	gcAll() {
		let freed = 0;
		let evicted = 0;
		this.map.forEach((m) => {
			const r = m.gc();
			freed += r.freed;
			evicted += r.evicted;
		});
		return { freed, evicted };
	}

	totalBytes() {
		return Array.from(this.map.values()).reduce((acc, m) => acc + m.size(), 0);
	}

	metrics() {
		return Object.fromEntries(Array.from(this.map.entries()).map(([id, m]) => [id, m.stats()]));
	}
}

/* Singleton export */
export const globalNodeMemoryManager = new GlobalNodeMemoryManager();

/* ------------------------------------------------------------------ */
/* 5. React hook (unchanged API)                                       */
/* ------------------------------------------------------------------ */

export const useNodeMemory = (
	nodeId: string,
	cfg?: NodeMemoryConfig
): ReturnType<(typeof globalNodeMemoryManager)["get"]> => globalNodeMemoryManager.get(nodeId, cfg);
