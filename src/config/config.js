require('dotenv').config();

module.exports = {
    // Server configuration
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    
    // MongoDB configuration
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/beatmaker-platform',
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }
    },

    // JWT configuration
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    },

    // AWS S3 configuration for file storage
    aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-east-1',
        bucketName: process.env.AWS_BUCKET_NAME
    },

    // Email configuration
    email: {
        from: process.env.EMAIL_FROM || 'noreply@beatmaker-platform.com',
        smtp: {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        }
    },

    // Payment configuration (Stripe)
    stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
        currency: 'usd'
    },

    // File upload limits
    upload: {
        maxFileSize: 50 * 1024 * 1024, // 50MB
        allowedAudioFormats: ['.mp3', '.wav'],
        allowedImageFormats: ['.jpg', '.jpeg', '.png']
    },

    // Redis configuration for caching
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD
    },

    // API rate limiting
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
    }
};
