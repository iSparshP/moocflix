const consul = require('consul')();
const os = require('os');

const registerService = async () => {
    const serviceId = `content-delivery-${os.hostname()}`;

    try {
        await consul.agent.service.register({
            id: serviceId,
            name: 'content-delivery',
            address: process.env.HOST || 'content-delivery',
            port: parseInt(process.env.PORT || '3006'),
            tags: ['v1', 'content'],
            check: {
                http: 'http://localhost:3006/api/v1/health/liveness',
                interval: '15s',
            },
        });

        console.log('Successfully registered with Consul');

        process.on('SIGINT', async () => {
            try {
                await consul.agent.service.deregister(serviceId);
                console.log('Successfully deregistered from Consul');
                process.exit();
            } catch (err) {
                console.error('Error deregistering from Consul:', err);
                process.exit(1);
            }
        });
    } catch (err) {
        console.error('Error registering with Consul:', err);
        throw err;
    }
};

module.exports = { registerService };
