import 'server-only';
/**
 * Central error handling wrapper for API route handlers.
 * Ensures consistent JSON error responses and server-side logging.
 */
import { AppError } from '../../../src/utils/appError';
import { logger } from './logger';

export function withError(handler: (req: Request, ...args: any[]) => Promise<Response>) {
    return async (req: Request, ...args: any[]) => {
        try {
            return await handler(req, ...args);
        } catch (err: any) {
            const status = err instanceof AppError ? err.statusCode : 500;
            const message = err?.message || 'Internal Server Error';
            logger.error({ err, url: req.url }, 'API error');
            return new Response(JSON.stringify({ message }), {
                status,
                headers: { 'Content-Type': 'application/json' },
            });
        }
    };
}


