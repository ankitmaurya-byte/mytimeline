import { ZodSchema } from 'zod';

export function withValidation<T>(schema: ZodSchema<T>, handler: (req: Request, parsed: T, ...args: any[]) => Promise<Response>) {
    return async (req: Request, ...args: any[]) => {
        const json = await req.json().catch(() => undefined);
        const parsed = await schema.safeParseAsync(json);
        if (!parsed.success) {
            return new Response(JSON.stringify({ message: 'Validation error', issues: parsed.error.issues }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
        return handler(req, parsed.data, ...args);
    };
}


