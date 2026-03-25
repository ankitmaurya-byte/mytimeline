import 'server-only';
type RateLimitOptions = {
    windowMs: number;
    max: number;
    key?: (req: Request) => string | Promise<string>;
};

const memoryStore = new Map<string, { count: number; expiresAt: number }>();

export function withRateLimit(handler: (req: Request, ...args: any[]) => Promise<Response>, options: RateLimitOptions) {
    const { windowMs, max, key } = options;
    return async (req: Request, ...args: any[]) => {
        const clientKey = (key ? await key(req) : req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || 'global') as string;
        const now = Date.now();
        const record = memoryStore.get(clientKey);
        if (!record || record.expiresAt < now) {
            memoryStore.set(clientKey, { count: 1, expiresAt: now + windowMs });
        } else {
            record.count += 1;
            if (record.count > max) {
                const retryAfter = Math.max(0, Math.ceil((record.expiresAt - now) / 1000));
                return new Response(JSON.stringify({ message: 'Too Many Requests' }), {
                    status: 429,
                    headers: { 'Retry-After': String(retryAfter), 'Content-Type': 'application/json' },
                });
            }
            memoryStore.set(clientKey, record);
        }
        return handler(req, ...args);
    };
}


