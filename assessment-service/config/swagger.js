// src/config/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'MoocFlix Assessment Service API',
            version: '1.0.0',
            description:
                'API documentation for the assessment microservice handling quizzes and assignments',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server',
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

module.exports = swaggerJsdoc(options);
