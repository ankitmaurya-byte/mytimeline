import mongoose from 'mongoose';
import { cacheService } from './cache.service';

interface QueryMetrics {
    collection: string;
    operation: string;
    duration: number;
    timestamp: Date;
    query: any;
    resultSize?: number;
}

interface PerformanceStats {
    totalQueries: number;
    averageQueryTime: number;
    slowQueries: number;
    cacheHitRate: number;
    collections: Record<string, any>;
}

class PerformanceService {
    private metrics: QueryMetrics[] = [];
    private readonly MAX_METRICS = 1000; // Keep last 1000 queries
    private readonly SLOW_QUERY_THRESHOLD = 100; // 100ms threshold

    constructor() {
        this.setupMongooseMonitoring();
    }

    /**
     * Setup mongoose query monitoring
     */
    private setupMongooseMonitoring() {
        // Monitor all mongoose operations
        mongoose.set('debug', (collectionName, methodName, ...methodArgs) => {
            const startTime = Date.now();

            // Only monitor if database connection is available
            if (mongoose.connection.db) {
                try {
                    // Create a promise to track completion
                    const originalMethod = mongoose.connection.db.collection(collectionName)[methodName];
                    if (typeof originalMethod === 'function') {
                        const originalMethodRef = originalMethod.bind(mongoose.connection.db.collection(collectionName));

                        // Wrap the method to track performance
                        mongoose.connection.db.collection(collectionName)[methodName] = async (...args: any[]) => {
                            const start = Date.now();
                            try {
                                const result = await originalMethodRef(...args);
                                const duration = Date.now() - start;

                                this.recordQuery({
                                    collection: collectionName,
                                    operation: methodName,
                                    duration,
                                    timestamp: new Date(),
                                    query: args[0] || {},
                                    resultSize: Array.isArray(result) ? result.length : undefined,
                                });

                                return result;
                            } catch (error) {
                                const duration = Date.now() - start;
                                this.recordQuery({
                                    collection: collectionName,
                                    operation: methodName,
                                    duration,
                                    timestamp: new Date(),
                                    query: args[0] || {},
                                });
                                throw error;
                            }
                        };
                    }
                } catch (error) {
                    // Silently fail if monitoring setup fails
                    console.debug('Performance monitoring setup failed for collection:', collectionName);
                }
            }
        });
    }

    /**
     * Record a query metric
     */
    private recordQuery(metric: QueryMetrics) {
        this.metrics.push(metric);

        // Keep only the last MAX_METRICS queries
        if (this.metrics.length > this.MAX_METRICS) {
            this.metrics = this.metrics.slice(-this.MAX_METRICS);
        }

        // Log slow queries
        if (metric.duration > this.SLOW_QUERY_THRESHOLD) {
            console.warn(`🐌 Slow query detected: ${metric.collection}.${metric.operation} took ${metric.duration}ms`);
            console.warn(`Query:`, JSON.stringify(metric.query, null, 2));
        }
    }

    /**
     * Get performance statistics
     */
    getPerformanceStats(): PerformanceStats {
        if (this.metrics.length === 0) {
            return {
                totalQueries: 0,
                averageQueryTime: 0,
                slowQueries: 0,
                cacheHitRate: 0,
                collections: {},
            };
        }

        const totalQueries = this.metrics.length;
        const totalTime = this.metrics.reduce((sum, m) => sum + m.duration, 0);
        const averageQueryTime = totalTime / totalQueries;
        const slowQueries = this.metrics.filter(m => m.duration > this.SLOW_QUERY_THRESHOLD).length;

        // Group by collection
        const collections: Record<string, any> = {};
        this.metrics.forEach(metric => {
            if (!collections[metric.collection]) {
                collections[metric.collection] = {
                    totalQueries: 0,
                    averageTime: 0,
                    totalTime: 0,
                    operations: {},
                };
            }

            const collection = collections[metric.collection];
            collection.totalQueries++;
            collection.totalTime += metric.duration;

            if (!collection.operations[metric.operation]) {
                collection.operations[metric.operation] = {
                    count: 0,
                    totalTime: 0,
                    averageTime: 0,
                };
            }

            const operation = collection.operations[metric.operation];
            operation.count++;
            operation.totalTime += metric.duration;
        });

        // Calculate averages
        Object.values(collections).forEach((collection: any) => {
            collection.averageTime = collection.totalTime / collection.totalQueries;
            Object.values(collection.operations).forEach((op: any) => {
                op.averageTime = op.totalTime / op.count;
            });
        });

        return {
            totalQueries,
            averageQueryTime,
            slowQueries,
            cacheHitRate: 0, // TODO: Implement cache hit rate tracking
            collections,
        };
    }

    /**
     * Get slow queries
     */
    getSlowQueries(threshold: number = this.SLOW_QUERY_THRESHOLD): QueryMetrics[] {
        return this.metrics
            .filter(m => m.duration > threshold)
            .sort((a, b) => b.duration - a.duration);
    }

    /**
     * Get queries by collection
     */
    getQueriesByCollection(collectionName: string): QueryMetrics[] {
        return this.metrics.filter(m => m.collection === collectionName);
    }

    /**
     * Get queries by operation type
     */
    getQueriesByOperation(operation: string): QueryMetrics[] {
        return this.metrics.filter(m => m.operation === operation);
    }

    /**
     * Clear metrics
     */
    clearMetrics(): void {
        this.metrics = [];
    }

    /**
     * Get database connection stats
     */
    getConnectionStats() {
        const connection = mongoose.connection;
        return {
            readyState: connection.readyState,
            host: connection.host,
            port: connection.port,
            name: connection.name,
            // Note: poolSize properties are deprecated in newer mongoose versions
            poolSize: 'deprecated',
            maxPoolSize: 'deprecated',
            minPoolSize: 'deprecated',
        };
    }

    /**
     * Get index usage statistics
     */
    async getIndexStats(): Promise<any> {
        try {
            if (!mongoose.connection.db) {
                return { error: 'Database not connected' };
            }

            const collections = await mongoose.connection.db.listCollections().toArray();
            const indexStats: any = {};

            for (const collection of collections) {
                try {
                    const stats = await mongoose.connection.db
                        .collection(collection.name)
                        .aggregate([
                            { $indexStats: {} }
                        ]).toArray();

                    indexStats[collection.name] = stats;
                } catch (error) {
                    // Some collections might not support $indexStats
                    indexStats[collection.name] = { error: 'Not supported' };
                }
            }

            return indexStats;
        } catch (error) {
            console.error('Error getting index stats:', error);
            return null;
        }
    }

    /**
     * Health check
     */
    async healthCheck(): Promise<boolean> {
        try {
            const stats = this.getPerformanceStats();
            const connectionStats = this.getConnectionStats();

            return (
                connectionStats.readyState === 1 && // Connected
                stats.averageQueryTime < 1000 && // Average query time < 1s
                stats.slowQueries < stats.totalQueries * 0.1 // Less than 10% slow queries
            );
        } catch (error) {
            return false;
        }
    }
}

export const performanceService = new PerformanceService();
export default performanceService;
