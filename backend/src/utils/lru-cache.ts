// Simple in-memory LRU cache to accelerate hot read endpoints.
// For production, consider Redis or another distributed cache.

type Entry<V> = { value: V; expiresAt: number };

export class LRUCache<V> {
    private map = new Map<string, Entry<V>>();
    private _max: number;
    private _defaultTtl: number;
    constructor(max = 200, defaultTtlMs = 10_000) {
        this._max = max;
        this._defaultTtl = defaultTtlMs;
    }

    get(key: string): V | undefined {
        const entry = this.map.get(key);
        if (!entry) return undefined;
        if (Date.now() > entry.expiresAt) {
            this.map.delete(key);
            return undefined;
        }
        // refresh LRU ordering
        this.map.delete(key);
        this.map.set(key, entry);
        return entry.value;
    }

    set(key: string, value: V, ttlMs?: number) {
        if (this.map.has(key)) this.map.delete(key);
        this.map.set(key, { value, expiresAt: Date.now() + (ttlMs ?? this._defaultTtl) });
        if (this.map.size > this._max) {
            const first = this.map.keys().next().value;
            if (first) this.map.delete(first);
        }
    }
}

export const globalCache = new LRUCache<any>(300, 8_000);
