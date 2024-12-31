const promClient = require('prom-client');
const os = require('os');
const { logger, logMetrics } = require('./logger.service');

class MonitoringService {
    constructor() {
        // Initialize Prometheus metrics
        this.registry = new promClient.Registry();
        
        // Enable default metrics
        promClient.collectDefaultMetrics({ register: this.registry });

        // Custom metrics
        this.initializeMetrics();

        // Start periodic monitoring
        this.startPeriodicMonitoring();
    }

    initializeMetrics() {
        // API metrics
        this.httpRequestDuration = new promClient.Histogram({
            name: 'http_request_duration_seconds',
            help: 'Duration of HTTP requests in seconds',
            labelNames: ['method', 'route', 'status_code'],
            buckets: [0.1, 0.5, 1, 2, 5]
        });

        // Business metrics
        this.activeUsers = new promClient.Gauge({
            name: 'active_users_total',
            help: 'Total number of active users'
        });

        this.beatUploads = new promClient.Counter({
            name: 'beat_uploads_total',
            help: 'Total number of beat uploads'
        });

        this.beatSales = new promClient.Counter({
            name: 'beat_sales_total',
            help: 'Total number of beat sales',
            labelNames: ['license_type']
        });

        // System metrics
        this.systemMemoryUsage = new promClient.Gauge({
            name: 'system_memory_usage_bytes',
            help: 'System memory usage in bytes'
        });

        this.systemCpuUsage = new promClient.Gauge({
            name: 'system_cpu_usage_percent',
            help: 'System CPU usage percentage'
        });

        // Database metrics
        this.dbOperations = new promClient.Counter({
            name: 'db_operations_total',
            help: 'Total number of database operations',
            labelNames: ['operation', 'collection']
        });

        this.dbLatency = new promClient.Histogram({
            name: 'db_operation_duration_seconds',
            help: 'Database operation duration in seconds',
            labelNames: ['operation', 'collection'],
            buckets: [0.01, 0.05, 0.1, 0.5, 1]
        });

        // Register all metrics
        this.registry.registerMetric(this.httpRequestDuration);
        this.registry.registerMetric(this.activeUsers);
        this.registry.registerMetric(this.beatUploads);
        this.registry.registerMetric(this.beatSales);
        this.registry.registerMetric(this.systemMemoryUsage);
        this.registry.registerMetric(this.systemCpuUsage);
        this.registry.registerMetric(this.dbOperations);
        this.registry.registerMetric(this.dbLatency);
    }

    startPeriodicMonitoring() {
        setInterval(() => {
            this.collectSystemMetrics();
        }, 60000); // Every minute
    }

    async collectSystemMetrics() {
        try {
            // Memory metrics
            const totalMemory = os.totalmem();
            const freeMemory = os.freemem();
            const usedMemory = totalMemory - freeMemory;
            
            this.systemMemoryUsage.set(usedMemory);

            // CPU metrics
            const cpus = os.cpus();
            const cpuUsage = this.calculateCPUUsage(cpus);
            
            this.systemCpuUsage.set(cpuUsage);

            // Log metrics
            logMetrics({
                memory: {
                    total: totalMemory,
                    used: usedMemory,
                    free: freeMemory
                },
                cpu: {
                    usage: cpuUsage,
                    cores: cpus.length
                }
            });
        } catch (error) {
            logger.error('Error collecting system metrics', error);
        }
    }

    calculateCPUUsage(cpus) {
        let totalIdle = 0;
        let totalTick = 0;

        cpus.forEach(cpu => {
            for (const type in cpu.times) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        });

        return ((totalTick - totalIdle) / totalTick) * 100;
    }

    // API monitoring
    recordAPICall(method, route, duration, statusCode) {
        this.httpRequestDuration.labels(method, route, statusCode).observe(duration);
    }

    // Business metrics
    recordBeatUpload() {
        this.beatUploads.inc();
    }

    recordBeatSale(licenseType) {
        this.beatSales.labels(licenseType).inc();
    }

    updateActiveUsers(count) {
        this.activeUsers.set(count);
    }

    // Database monitoring
    recordDBOperation(operation, collection) {
        this.dbOperations.labels(operation, collection).inc();
    }

    recordDBLatency(operation, collection, duration) {
        this.dbLatency.labels(operation, collection).observe(duration);
    }

    // Memory leak detection
    checkMemoryLeaks() {
        const usedMemory = process.memoryUsage();
        const heapUsed = usedMemory.heapUsed / 1024 / 1024; // Convert to MB

        if (heapUsed > 1024) { // Alert if heap usage exceeds 1GB
            logger.warn('Possible memory leak detected', {
                heapUsed: `${heapUsed.toFixed(2)}MB`,
                ...usedMemory
            });
        }
    }

    // Performance monitoring middleware
    performanceMiddleware(req, res, next) {
        const start = process.hrtime();

        res.on('finish', () => {
            const duration = process.hrtime(start);
            const durationInSeconds = duration[0] + duration[1] / 1e9;

            this.recordAPICall(
                req.method,
                req.route?.path || req.path,
                durationInSeconds,
                res.statusCode
            );
        });

        next();
    }

    // Get metrics for Prometheus
    async getMetrics() {
        return await this.registry.metrics();
    }

    // Health check
    async healthCheck() {
        const health = {
            uptime: process.uptime(),
            timestamp: Date.now(),
            memory: process.memoryUsage(),
            cpu: os.cpus(),
            loadavg: os.loadavg(),
            status: 'healthy'
        };

        // Check memory usage
        if (health.memory.heapUsed / health.memory.heapTotal > 0.9) {
            health.status = 'warning';
            health.message = 'High memory usage';
        }

        // Check CPU load
        if (health.loadavg[0] > os.cpus().length * 0.8) {
            health.status = 'warning';
            health.message = 'High CPU load';
        }

        return health;
    }
}

module.exports = new MonitoringService();
