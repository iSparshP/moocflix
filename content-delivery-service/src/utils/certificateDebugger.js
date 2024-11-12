const CertificateDebugger = require('../utils/certificateDebugger');
const DBValidator = require('../utils/dbValidator');
const config = require('../config/config');

async function debugDatabaseConnection() {
    console.log('Starting database connection debugging...');

    await CertificateDebugger.debugPostgresConnection(config.db);
    await DBValidator.testConnection(config.db);
}

// Can be run directly: node src/scripts/debugConnection.js
if (require.main === module) {
    debugDatabaseConnection().catch(console.error);
}

module.exports = debugDatabaseConnection;
