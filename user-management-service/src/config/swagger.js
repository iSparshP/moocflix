const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'User Management Service API',
            version: '1.0.0',
            description: 'User management microservice API documentation',
        },
        servers: [
            {
                url: 'http://localhost:3000/api/v1',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        role: {
                            type: 'string',
                            enum: ['student', 'instructor', 'admin'],
                        },
                        notificationPreferences: {
                            type: 'object',
                            properties: {
                                email: { type: 'boolean' },
                                push: { type: 'boolean' },
                            },
                        },
                    },
                },
                Error: {
                    type: 'object',
                    properties: {
                        status: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
        tags: [
            { name: 'Auth', description: 'Authentication endpoints' },
            { name: 'Profile', description: 'User profile management' },
            { name: 'System', description: 'System health and monitoring' },
        ],
    },
    apis: ['./src/routes/*.js', './src/models/*.js'],
};

module.exports = swaggerOptions;
