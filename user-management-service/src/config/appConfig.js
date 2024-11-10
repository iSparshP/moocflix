const config = {
    app: {
        port: process.env.PORT || 3000,
        env: process.env.NODE_ENV || 'development',
    },
    kafka: {
        brokers: process.env.KAFKA_BROKERS
            ? process.env.KAFKA_BROKERS.split(',')
            : [],
        clientId: 'user-management-service',
        groupId: 'user-management-group',
        connectionTimeout: 5000,
        authenticationTimeout: 10000,
    },
    mongo: {
        uri: process.env.MONGO_URI,
        options: {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
        },
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    },
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: process.env.RATE_LIMIT_MAX || 100,
        message: {
            status: 'error',
            message: 'Too many requests, please try again later',
        },
    },
    auth: {
        saltRounds: 12,
        tokenExpiresIn: '24h',
        passwordMinLength: 8,
    },
    security: {
        helmet: {
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", 'data:', 'https:'],
                },
            },
            referrerPolicy: { policy: 'same-origin' },
        },
        cors: {
            origin: process.env.CORS_ORIGIN || 'https://moocflix.tech',
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization'],
            credentials: true,
        },
        cookieOptions: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            sameSite: 'strict',
        },
    },
    rateLimiter: {
        auth: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 5, // 5 attempts
            message: 'Too many login attempts, please try again later',
        },
        api: {
            windowMs: 15 * 60 * 1000,
            max: process.env.RATE_LIMIT_MAX || 100,
            message: 'Too many requests from this IP',
        },
    },
};

module.exports = config;
