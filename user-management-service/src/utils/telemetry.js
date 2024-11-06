const { NodeSDK } = require('@opentelemetry/sdk-node');
const {
    getNodeAutoInstrumentations,
} = require('@opentelemetry/auto-instrumentations-node');
const { HoneycombSDK } = require('@honeycombio/opentelemetry-node');
const { Resource } = require('@opentelemetry/resources');
const {
    SemanticResourceAttributes,
} = require('@opentelemetry/semantic-conventions');
const logger = require('./logger');

const setupTelemetry = () => {
    try {
        const sdk = new NodeSDK({
            resource: new Resource({
                [SemanticResourceAttributes.SERVICE_NAME]:
                    'user-management-service',
                [SemanticResourceAttributes.SERVICE_VERSION]:
                    process.env.npm_package_version,
                environment: process.env.NODE_ENV || 'development',
            }),
            traceExporter: new HoneycombSDK({
                apiKey: process.env.HONEYCOMB_API_KEY,
                serviceName: 'user-management-service',
            }),
            instrumentations: [
                getNodeAutoInstrumentations({
                    '@opentelemetry/instrumentation-fs': {
                        enabled: false,
                    },
                }),
            ],
        });

        sdk.start()
            .then(() => {
                logger.info('Telemetry initialized successfully');
            })
            .catch((error) => {
                logger.error('Failed to initialize telemetry', {
                    error: error.message,
                });
            });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            sdk.shutdown()
                .then(() => logger.info('Telemetry shut down successfully'))
                .catch((error) =>
                    logger.error('Error shutting down telemetry', {
                        error: error.message,
                    })
                )
                .finally(() => process.exit(0));
        });
    } catch (error) {
        logger.error('Failed to setup telemetry', { error: error.message });
    }
};

module.exports = { setupTelemetry };
