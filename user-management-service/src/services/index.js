// src/services/index.js
const kafka = require('../config/kafka');

module.exports = {
    courseService: require('./courseService'),
    notificationService: require('./notificationService'),
    kafkaConsumer: require('./kafkaConsumer'),
    // Export specific kafka methods instead of whole module
    kafkaProducer: {
        sendMessage: kafka.sendMessage,
        produceUserRegisteredEvent: kafka.produceUserRegisteredEvent,
    },
};
