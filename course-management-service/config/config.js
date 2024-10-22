const kafkaConfig = require('./kafka');

module.exports = {
    kafka: kafkaConfig,
    userManagementServiceURL: process.env.USER_MANAGEMENT_SERVICE_URL,
};
