const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./config');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Content Delivery Service API',
            version: '1.0.0',
            description:
                'API documentation for the MoocFlix Content Delivery Service',
            contact: {
                name: 'API Support',
                email: 'support@moocflix.com',
            },
        },
        servers: [
            {
                url: `http://localhost:${config.app.port}/api/v1`,
                description: 'Development server',
            },
            {
                url: 'https://api.moocflix.com/v1',
                description: 'Production server',
            },
        ],
        tags: [
            {
                name: 'Videos',
                description: 'Video management endpoints',
            },
            {
                name: 'Enrollment',
                description: 'Course enrollment endpoints',
            },
            {
                name: 'Health',
                description: 'Service health check endpoints',
            },
        ],
        components: {
            schemas: {
                Video: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                            description: 'Unique identifier for the video',
                        },
                        filename: {
                            type: 'string',
                            description: 'Original filename of the video',
                        },
                        s3_url: {
                            type: 'string',
                            description: 'S3 URL of the original video',
                        },
                        transcoded_url: {
                            type: 'string',
                            description: 'S3 URL of the transcoded video',
                        },
                        course_id: {
                            type: 'string',
                            format: 'uuid',
                            description: 'Course ID this video belongs to',
                        },
                        status: {
                            type: 'string',
                            enum: [
                                'pending',
                                'transcoding',
                                'completed',
                                'failed',
                            ],
                            description: 'Current status of the video',
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Timestamp when the video was created',
                        },
                        updated_at: {
                            type: 'string',
                            format: 'date-time',
                            description:
                                'Timestamp when the video was last updated',
                        },
                    },
                },
                Error: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            enum: ['error', 'fail'],
                            description: 'Error status',
                        },
                        message: {
                            type: 'string',
                            description: 'Error message',
                        },
                        errors: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'List of specific error messages',
                        },
                    },
                },
                HealthCheck: {
                    type: 'object',
                    properties: {
                        uptime: {
                            type: 'number',
                            description: 'Service uptime in seconds',
                        },
                        timestamp: {
                            type: 'number',
                            description: 'Current timestamp',
                        },
                        services: {
                            type: 'object',
                            properties: {
                                database: {
                                    $ref: '#/components/schemas/ServiceHealth',
                                },
                                redis: {
                                    $ref: '#/components/schemas/ServiceHealth',
                                },
                                kafka: {
                                    $ref: '#/components/schemas/ServiceHealth',
                                },
                            },
                        },
                    },
                },
                ServiceHealth: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            enum: ['healthy', 'unhealthy'],
                            description: 'Health status of the service',
                        },
                        latency: {
                            type: 'number',
                            description:
                                'Service response time in milliseconds',
                        },
                    },
                },
                TranscodingRequest: {
                    type: 'object',
                    required: ['format', 'quality'],
                    properties: {
                        format: {
                            type: 'string',
                            enum: ['mp4', 'hls'],
                            description:
                                'Output format for the transcoded video',
                        },
                        quality: {
                            type: 'string',
                            enum: ['480p', '720p', '1080p'],
                            description:
                                'Output quality for the transcoded video',
                        },
                    },
                },
                VideoUploadResponse: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                        },
                        message: {
                            type: 'string',
                            example: 'Video uploaded successfully',
                        },
                        video: {
                            $ref: '#/components/schemas/Video',
                        },
                    },
                },
                EnrollmentResponse: {
                    type: 'object',
                    properties: {
                        message: {
                            type: 'string',
                            example: 'Enrollment successful',
                        },
                        courseId: {
                            type: 'string',
                            format: 'uuid',
                        },
                        studentId: {
                            type: 'string',
                            format: 'uuid',
                        },
                        videos: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/Video',
                            },
                        },
                    },
                },
            },
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'JWT token for API authentication',
                },
            },
            responses: {
                UnauthorizedError: {
                    description:
                        'Authentication information is missing or invalid',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error',
                            },
                        },
                    },
                },
                ValidationError: {
                    description: 'Validation failed',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    status: {
                                        type: 'string',
                                        example: 'error',
                                    },
                                    message: {
                                        type: 'string',
                                        example: 'Validation failed',
                                    },
                                    errors: {
                                        type: 'array',
                                        items: {
                                            type: 'string',
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                NotFoundError: {
                    description: 'Resource not found',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    status: {
                                        type: 'string',
                                        example: 'error',
                                    },
                                    message: {
                                        type: 'string',
                                        example: 'Resource not found',
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: ['./src/routes/*.js'],
};

const specs = swaggerJsdoc(options);
module.exports = specs;
