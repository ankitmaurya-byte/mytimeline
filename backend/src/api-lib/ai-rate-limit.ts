// AI-specific dual-layer rate limiting (burst token bucket + sustained sliding window)
// In-memory implementation; extend to Redis if desired later.

interface BucketRecord { tokens: number; lastRefill: number; }
interface SlidingRecord { timestamps: number[]; }

interface AiRateLimitConfig {
  burstCapacity: number;
  burstRefillRate: number;    // tokens per second
  sustainedWindowMs: number;  // sliding window length
  sustainedMax: number;       // max requests per window
}

const bucketStore = new Map<string, BucketRecord>();
const slidingStore = new Map<string, SlidingRecord>();

export interface AiRateLimitResult {
  allowed: boolean;
  retryAfter?: number; // seconds
  burstRemaining?: number;
  sustainedRemaining?: number;
}

function getConfig(providerActive: boolean): AiRateLimitConfig {
  if (providerActive) {
    return {
      burstCapacity: parseInt(process.env.AI_BURST_CAPACITY || '5', 10),
      burstRefillRate: parseFloat(process.env.AI_BURST_REFILL_RATE || '0.2'),
      sustainedWindowMs: parseInt(process.env.AI_SUSTAINED_WINDOW_MS || (60 * 60 * 1000).toString(), 10),
      sustainedMax: parseInt(process.env.AI_SUSTAINED_MAX || '40', 10),
    };
  }
  return {
    burstCapacity: parseInt(process.env.AI_BURST_CAPACITY || '15', 10),
    burstRefillRate: parseFloat(process.env.AI_BURST_REFILL_RATE || '0.5'),
    sustainedWindowMs: parseInt(process.env.AI_SUSTAINED_WINDOW_MS || (60 * 60 * 1000).toString(), 10),
    sustainedMax: parseInt(process.env.AI_SUSTAINED_MAX || '120', 10),
  };
}

export function aiRateLimit(userKey: string, providerActive: boolean): AiRateLimitResult {
  const cfg = getConfig(providerActive);
  const now = Date.now();

  // Burst bucket logic
  const bucket = bucketStore.get(userKey) || { tokens: cfg.burstCapacity, lastRefill: now };
  if (!bucketStore.has(userKey)) bucketStore.set(userKey, bucket);
  const elapsed = (now - bucket.lastRefill) / 1000;
  if (elapsed > 0) {
    const refill = elapsed * cfg.burstRefillRate;
    if (refill > 0) {
      bucket.tokens = Math.min(cfg.burstCapacity, bucket.tokens + refill);
      bucket.lastRefill = now;
    }
  }
  if (bucket.tokens < 1) {
    const needed = 1 - bucket.tokens;
    const seconds = needed / cfg.burstRefillRate;
    return { allowed: false, retryAfter: Math.max(1, Math.ceil(seconds)), burstRemaining: 0, sustainedRemaining: 0 };
  }
  bucket.tokens -= 1; // consume one

  // Sustained sliding window logic
  const sliding = slidingStore.get(userKey) || { timestamps: [] };
  if (!slidingStore.has(userKey)) slidingStore.set(userKey, sliding);
  const cutoff = now - cfg.sustainedWindowMs;
  sliding.timestamps = sliding.timestamps.filter(ts => ts >= cutoff);
  if (sliding.timestamps.length >= cfg.sustainedMax) {
    // revert burst token
    bucket.tokens = Math.min(cfg.burstCapacity, bucket.tokens + 1);
    const oldest = sliding.timestamps[0];
    const retryMs = (oldest + cfg.sustainedWindowMs) - now;
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil(retryMs / 1000)),
      burstRemaining: Math.floor(bucket.tokens),
      sustainedRemaining: 0,
    };
  }
  sliding.timestamps.push(now);

  return {
    allowed: true,
    burstRemaining: Math.floor(bucket.tokens),
    sustainedRemaining: Math.max(0, cfg.sustainedMax - sliding.timestamps.length),
  };
}

export function aiRateLimitHeaders(res: Response, info: AiRateLimitResult) {
  if (info.burstRemaining !== undefined) res.headers.set('X-AI-RateLimit-Burst-Remaining', String(info.burstRemaining));
  if (info.sustainedRemaining !== undefined) res.headers.set('X-AI-RateLimit-Sustained-Remaining', String(info.sustainedRemaining));
  return res;
}
