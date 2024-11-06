const EventEmitter = require('events');
const logger = require('./logger');

class AppEventEmitter extends EventEmitter {
    emit(event, ...args) {
        logger.debug('Event emitted', { event, args });
        super.emit(event, ...args);
    }
}

module.exports = new AppEventEmitter();
