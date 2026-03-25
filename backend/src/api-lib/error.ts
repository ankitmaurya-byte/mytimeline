import { AppError } from '../utils/appError';
import { logger } from './logger';

// Error classification
function classifyError(error: any): { status: number; message: string; isOperational: boolean } {
    // Mongoose validation errors
    if (error.name === 'ValidationError') {
        return {
            status: 400,
            message: 'Validation Error: ' + Object.values(error.errors).map((e: any) => e.message).join(', '),
            isOperational: true
        };
    }

    // Mongoose cast errors (invalid ObjectId, etc.)
    if (error.name === 'CastError') {
        return {
            status: 400,
            message: `Invalid ${error.path}: ${error.value}`,
            isOperational: true
        };
    }

    // Mongoose duplicate key errors
    if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        return {
            status: 409,
            message: `${field} already exists`,
            isOperational: true
        };
    }

    // JWT errors
    if (error.name === 'JsonWebTokenError') {
        return {
            status: 401,
            message: 'Invalid token',
            isOperational: true
        };
    }

    if (error.name === 'TokenExpiredError') {
        return {
            status: 401,
            message: 'Token expired',
            isOperational: true
        };
    }

    // Custom AppError
    if (error instanceof AppError) {
        return {
            status: error.statusCode,
            message: error.message,
            isOperational: error.name === 'AppError' ? true : false
        };
    }

    // Network/connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return {
            status: 503,
            message: 'Service temporarily unavailable',
            isOperational: true
        };
    }

    // Default error
    return {
        status: 500,
        message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : error.message || 'Internal Server Error',
        isOperational: false
    };
}

export function withError(handler: (req: Request | any, ...args: any[]) => Promise<Response>) {
    return async (req: Request | any, ...args: any[]) => {
        try {
            return await handler(req, ...args);
        } catch (err: any) {
            const { status, message, isOperational } = classifyError(err);

            // Log the error with appropriate level
            if (isOperational) {
                logger.warn({
                    err,
                    url: req.url,
                    method: req.method,
                    status,
                    message
                }, 'Operational error');
            } else {
                logger.error({
                    err,
                    url: req.url,
                    method: req.method,
                    status,
                    message,
                    stack: err.stack
                }, 'System error');
            }

            // Add error tracking headers
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'X-Error-Type': isOperational ? 'operational' : 'system'
            };

            // Add request ID if available
            if (req.headers.get('x-request-id')) {
                headers['X-Request-ID'] = req.headers.get('x-request-id')!;
            }

            // Add correlation ID if available
            if (req.headers.get('x-correlation-id')) {
                headers['X-Correlation-ID'] = req.headers.get('x-correlation-id')!;
            }

            // Return appropriate error response
            return new Response(JSON.stringify({
                message,
                status,
                timestamp: new Date().toISOString(),
                path: req.url,
                method: req.method,
                ...(process.env.NODE_ENV === 'development' && {
                    stack: err.stack,
                    details: err.message
                })
            }), {
                status,
                headers
            });
        }
    };
}


