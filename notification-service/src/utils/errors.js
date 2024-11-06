class NotificationError extends Error {
    constructor(message, statusCode, details = {}) {
        super(message);
        this.name = 'NotificationError';
        this.statusCode = statusCode;
        this.details = details;
    }
}

class KafkaError extends Error {
    constructor(message, details = {}) {
        super(message);
        this.name = 'KafkaError';
        this.details = details;
    }
}

module.exports = {
    NotificationError,
    KafkaError,
};
