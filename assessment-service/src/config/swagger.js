const swaggerJsdoc = require('swagger-jsdoc');
const { env } = require('./env');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'MoocFlix Assessment Service API',
            version: '1.0.0',
            description:
                'API documentation for the assessment microservice handling quizzes and assignments',
            contact: {
                name: 'API Support',
                email: 'support@moocflix.com',
            },
        },
        servers: [
            {
                url: env.API_URL,
                description: 'Development server',
            },
            {
                url: env.PROD_API_URL,
                description: 'Production server',
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
                Error: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            example: 'error',
                        },
                        message: {
                            type: 'string',
                            example: 'Error message',
                        },
                    },
                },
                HealthCheck: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            example: 'up',
                        },
                        timestamp: {
                            type: 'string',
                            format: 'date-time',
                        },
                    },
                },
                Quiz: {
                    type: 'object',
                    properties: {
                        title: { type: 'string' },
                        description: { type: 'string' },
                        questions: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    questionText: { type: 'string' },
                                    options: {
                                        type: 'array',
                                        items: { type: 'string' },
                                    },
                                    correctAnswer: { type: 'string' },
                                    points: { type: 'number' },
                                },
                            },
                        },
                        dueDate: { type: 'string', format: 'date-time' },
                        courseId: { type: 'string' },
                        duration: { type: 'number' },
                    },
                },
                Assignment: {
                    type: 'object',
                    properties: {
                        title: { type: 'string' },
                        description: { type: 'string' },
                        dueDate: { type: 'string', format: 'date-time' },
                        courseId: { type: 'string' },
                    },
                },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerSpec };
