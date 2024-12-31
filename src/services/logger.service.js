const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');
const { format } = winston;
const config = require('../config/config');

// Custom format for detailed logging
const detailedFormat = format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.metadata(),
    format.json()
);

// Create Elasticsearch transport
const esTransport = new ElasticsearchTransport({
    level: 'info',
    clientOpts: {
        node: config.elasticsearch.node,
        auth: {
            username: config.elasticsearch.username,
            password: config.elasticsearch.password
        }
    },
    indexPrefix: 'beatmaker-logs'
});

// Create Winston logger
const logger = winston.createLogger({
    level: config.env === 'development' ? 'debug' : 'info',
    format: detailedFormat,
    transports: [
        // Console transport for development
        new winston.transports.Console({
            format: format.combine(
                format.colorize(),
                format.simple()
            )
        }),
        // File transport for all environments
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880,
            maxFiles: 5
        }),
        // Elasticsearch transport for production
        ...(config.env === 'production' ? [esTransport] : [])
    ]
});

// Custom logging levels
const CUSTOM_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6
};

// Log decorators
const decorateLog = (level, message, meta = {}) => {
    const decoratedMeta = {
        ...meta,
        timestamp: new Date().toISOString(),
        environment: config.env,
        version: process.env.npm_package_version
    };

    return logger[level](message, decoratedMeta);
};

// Performance monitoring
const startPerformanceTimer = (label) => {
    const start = process.hrtime();
    return {
        end: () => {
            const diff = process.hrtime(start);
            const duration = (diff[0] * 1e9 + diff[1]) / 1e6; // Convert to milliseconds
            logger.info(`Performance: ${label}`, { duration });
            return duration;
        }
    };
};

// Request logging middleware
const requestLogger = (req, res, next) => {
    const timer = startPerformanceTimer(req.url);
    
    // Log request
    logger.http('Incoming request', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('user-agent')
    });

    // Log response
    res.on('finish', () => {
        const duration = timer.end();
        logger.http('Request completed', {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration
        });
    });

    next();
};

// Error logging
const logError = (error, meta = {}) => {
    const errorMeta = {
        ...meta,
        stack: error.stack,
        code: error.code,
        name: error.name
    };

    logger.error(error.message, errorMeta);
};

// Business event logging
const logBusinessEvent = (eventType, data) => {
    logger.info(`Business Event: ${eventType}`, {
        eventType,
        data,
        category: 'business'
    });
};

// Security event logging
const logSecurityEvent = (eventType, data) => {
    logger.warn(`Security Event: ${eventType}`, {
        eventType,
        data,
        category: 'security'
    });
};

// System metrics logging
const logMetrics = (metrics) => {
    logger.info('System Metrics', {
        ...metrics,
        category: 'metrics',
        timestamp: new Date().toISOString()
    });
};

// API metrics logging
const logAPIMetrics = (endpoint, method, duration, statusCode) => {
    logger.info('API Metrics', {
        endpoint,
        method,
        duration,
        statusCode,
        category: 'api_metrics'
    });
};

// Database query logging
const logDBQuery = (operation, collection, duration, query = {}) => {
    logger.debug('Database Query', {
        operation,
        collection,
        duration,
        query: JSON.stringify(query),
        category: 'database'
    });
};

// User activity logging
const logUserActivity = (userId, action, details) => {
    logger.info('User Activity', {
        userId,
        action,
        details,
        category: 'user_activity'
    });
};

module.exports = {
    logger,
    requestLogger,
    logError,
    logBusinessEvent,
    logSecurityEvent,
    logMetrics,
    logAPIMetrics,
    logDBQuery,
    logUserActivity,
    startPerformanceTimer
};
