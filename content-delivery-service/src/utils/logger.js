const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const config = require('../config/config');

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Define colors for each level
winston.addColors({
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
});

// Define the format
const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Define transport for file logging
const fileRotateTransport = new DailyRotateFile({
    filename: 'logs/content-delivery-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format,
});

// Create the logger
const logger = winston.createLogger({
    level: config.app.env === 'development' ? 'debug' : 'info',
    levels,
    format,
    transports: [
        // Write all logs to console
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize({ all: true }),
                winston.format.printf(
                    (info) => `${info.timestamp} ${info.level}: ${info.message}`
                )
            ),
        }),
        // Write all logs to rotating files
        fileRotateTransport,
    ],
});

// Create a stream object for Morgan middleware
logger.stream = {
    write: (message) => logger.http(message.trim()),
};

module.exports = logger;
