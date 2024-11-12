const { Sequelize } = require('sequelize');
const logger = require('./logger');

class DBValidator {
    static async testConnection(config) {
        logger.info(
            'Testing database connection with following SSL settings:',
            {
                ssl: config.dialectOptions.ssl,
            }
        );

        const testSequelize = new Sequelize(config.url, {
            logging: (msg) => logger.debug(msg),
            dialectOptions: {
                ssl: {
                    ...config.dialectOptions.ssl,
                    checkServerIdentity: (host, cert) => {
                        logger.info('Server Certificate Info:', {
                            subject: cert.subject,
                            issuer: cert.issuer,
                            valid_from: cert.valid_from,
                            valid_to: cert.valid_to,
                        });
                        return undefined; // Continues the connection
                    },
                },
            },
        });

        try {
            await testSequelize.authenticate();
            logger.info('Test connection successful');
            return true;
        } catch (error) {
            logger.error('Test connection failed:', {
                name: error.name,
                message: error.message,
                code: error.original?.code,
                stack: error.stack,
            });
            return false;
        } finally {
            await testSequelize.close();
        }
    }
}

module.exports = DBValidator;
