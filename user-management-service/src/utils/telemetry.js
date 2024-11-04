const opentelemetry = require('@opentelemetry/sdk-node');
const {
    getNodeAutoInstrumentations,
} = require('@opentelemetry/auto-instrumentations-node');
const { HoneycombSDK } = require('@honeycombio/opentelemetry-node');

const setupTelemetry = () => {
    const sdk = new HoneycombSDK({
        apiKey: process.env.HONEYCOMB_API_KEY,
        serviceName: 'user-management-service',
        instrumentations: [getNodeAutoInstrumentations()],
    });

    sdk.start();
};

module.exports = { setupTelemetry };
