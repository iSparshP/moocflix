const consul = require('consul')();
const os = require('os');

const registerService = async () => {
    const serviceId = `notification-service-${os.hostname()}`;

    try {
        await consul.agent.service.register({
            id: serviceId,
            name: 'notification-service',
            address: process.env.HOST || 'notification-service',
            port: parseInt(process.env.PORT || '3003'),
            tags: ['v1', 'notification'],
            check: {
                http: 'http://localhost:3003/health',
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
