const Redis = require('ioredis');
const config = require('../config/config');
const { logger } = require('./logger.service');

class CacheService {
    constructor() {
        this.client = new Redis({
            host: config.redis.host,
            port: config.redis.port,
            password: config.redis.password,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            }
        });

        this.client.on('error', (error) => {
            logger.error('Redis Client Error:', error);
        });

        this.client.on('connect', () => {
            logger.info('Redis Client Connected');
        });

        // Default TTL in seconds
        this.DEFAULT_TTL = 3600; // 1 hour
    }

    /**
     * Set a key-value pair in cache
     */
    async set(key, value, ttl = this.DEFAULT_TTL) {
        try {
            const serializedValue = JSON.stringify(value);
            await this.client.setex(key, ttl, serializedValue);
            return true;
        } catch (error) {
            logger.error('Cache Set Error:', error);
            return false;
        }
    }

    /**
     * Get a value from cache
     */
    async get(key) {
        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            logger.error('Cache Get Error:', error);
            return null;
        }
    }

    /**
     * Delete a key from cache
     */
    async del(key) {
        try {
            await this.client.del(key);
            return true;
        } catch (error) {
            logger.error('Cache Delete Error:', error);
            return false;
        }
    }

    /**
     * Clear all cache
     */
    async clear() {
        try {
            await this.client.flushall();
            return true;
        } catch (error) {
            logger.error('Cache Clear Error:', error);
            return false;
        }
    }

    /**
     * Get multiple values at once
     */
    async mget(keys) {
        try {
            const values = await this.client.mget(keys);
            return values.map(value => value ? JSON.parse(value) : null);
        } catch (error) {
            logger.error('Cache Multi Get Error:', error);
            return [];
        }
    }

    /**
     * Set multiple key-value pairs
     */
    async mset(entries, ttl = this.DEFAULT_TTL) {
        try {
            const pipeline = this.client.pipeline();
            
            entries.forEach(([key, value]) => {
                pipeline.setex(key, ttl, JSON.stringify(value));
            });

            await pipeline.exec();
            return true;
        } catch (error) {
            logger.error('Cache Multi Set Error:', error);
            return false;
        }
    }

    /**
     * Cache decorator for functions
     */
    cacheDecorator(prefix, ttl = this.DEFAULT_TTL) {
        return function (target, propertyKey, descriptor) {
            const originalMethod = descriptor.value;

            descriptor.value = async function (...args) {
                const key = `${prefix}:${JSON.stringify(args)}`;
                
                // Try to get from cache
                const cached = await this.get(key);
                if (cached) {
                    return cached;
                }

                // If not in cache, execute method
                const result = await originalMethod.apply(this, args);
                
                // Store in cache
                await this.set(key, result, ttl);
                
                return result;
            };

            return descriptor;
        };
    }

    /**
     * Cache middleware for Express routes
     */
    routeCache(ttl = this.DEFAULT_TTL) {
        return async (req, res, next) => {
            const key = `route:${req.originalUrl}`;
            
            try {
                const cached = await this.get(key);
                if (cached) {
                    return res.json(cached);
                }

                // Store original send
                const originalSend = res.send;

                // Override send
                res.send = async function(body) {
                    try {
                        await this.set(key, JSON.parse(body), ttl);
                    } catch (error) {
                        logger.error('Route Cache Error:', error);
                    }
                    
                    originalSend.call(this, body);
                };

                next();
            } catch (error) {
                logger.error('Route Cache Middleware Error:', error);
                next();
            }
        };
    }

    /**
     * Invalidate cache by pattern
     */
    async invalidatePattern(pattern) {
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(keys);
            }
            return true;
        } catch (error) {
            logger.error('Cache Pattern Invalidation Error:', error);
            return false;
        }
    }

    /**
     * Get cache stats
     */
    async getStats() {
        try {
            const info = await this.client.info();
            return info;
        } catch (error) {
            logger.error('Cache Stats Error:', error);
            return null;
        }
    }

    /**
     * Handle cache race condition with locks
     */
    async getOrSetWithLock(key, fn, ttl = this.DEFAULT_TTL) {
        const lockKey = `lock:${key}`;
        const lockTtl = 5; // 5 seconds lock

        try {
            // Try to get from cache first
            const cached = await this.get(key);
            if (cached) {
                return cached;
            }

            // Try to acquire lock
            const acquired = await this.client.set(lockKey, 1, 'EX', lockTtl, 'NX');
            if (!acquired) {
                // Wait and retry if lock is held
                await new Promise(resolve => setTimeout(resolve, 100));
                return this.getOrSetWithLock(key, fn, ttl);
            }

            // Execute function
            const result = await fn();
            
            // Store in cache
            await this.set(key, result, ttl);
            
            // Release lock
            await this.del(lockKey);
            
            return result;
        } catch (error) {
            // Release lock on error
            await this.del(lockKey);
            throw error;
        }
    }
}

module.exports = new CacheService();
