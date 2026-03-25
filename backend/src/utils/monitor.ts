#!/usr/bin/env ts-node

import { isDatabaseHealthy, getConnectionStats } from '../config/database.config';

interface SystemMetrics {
    timestamp: string;
    uptime: number;
    memory: {
        rss: string;
        heapTotal: string;
        heapUsed: string;
        external: string;
    };
    database: {
        healthy: boolean;
        stats: any;
    };
}

function formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

function getSystemMetrics(): SystemMetrics {
    const memUsage = process.memoryUsage();

    return {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: {
            rss: formatBytes(memUsage.rss),
            heapTotal: formatBytes(memUsage.heapTotal),
            heapUsed: formatBytes(memUsage.heapUsed),
            external: formatBytes(memUsage.external)
        },
        database: {
            healthy: isDatabaseHealthy(),
            stats: getConnectionStats()
        }
    };
}

function displayMetrics(metrics: SystemMetrics) {
    console.clear();
    console.log('🔄 Timeline Backend Monitor');
    console.log('='.repeat(40));
    console.log(`📅 Time: ${metrics.timestamp}`);
    console.log(`⏱️  Uptime: ${Math.floor(metrics.uptime / 3600)}h ${Math.floor((metrics.uptime % 3600) / 60)}m ${Math.floor(metrics.uptime % 60)}s`);
    console.log('');
    console.log('💾 Memory Usage:');
    console.log(`  RSS: ${metrics.memory.rss}`);
    console.log(`  Heap Total: ${metrics.memory.heapTotal}`);
    console.log(`  Heap Used: ${metrics.memory.heapUsed}`);
    console.log(`  External: ${metrics.memory.external}`);
    console.log('');
    console.log('🗄️  Database:');
    console.log(`  Status: ${metrics.database.healthy ? '✅ Healthy' : '❌ Unhealthy'}`);
    console.log(`  State: ${metrics.database.stats.readyStateText}`);
    console.log(`  Host: ${metrics.database.stats.host}:${metrics.database.stats.port}`);
    console.log(`  Database: ${metrics.database.stats.name}`);
}

// Main monitoring loop
function startMonitoring(intervalMs: number = 5000) {
    console.log(`🚀 Starting monitoring with ${intervalMs}ms interval...`);
    console.log('Press Ctrl+C to stop\n');

    // Initial display
    displayMetrics(getSystemMetrics());

    // Set up interval
    const monitorInterval = setInterval(() => {
        try {
            displayMetrics(getSystemMetrics());
        } catch (error) {
            console.error('❌ Monitoring error:', error);
        }
    }, intervalMs);

    // Graceful shutdown
    process.on('SIGINT', () => {
        clearInterval(monitorInterval);
        console.log('\n🛑 Monitoring stopped');
        process.exit(0);
    });
}

// Run if called directly
if (require.main === module) {
    const interval = process.argv[2] ? parseInt(process.argv[2]) : 5000;
    startMonitoring(interval);
}

export { getSystemMetrics, startMonitoring };



















