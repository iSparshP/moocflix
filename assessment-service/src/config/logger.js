const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Define log levels and colors
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

// Set up winston format
const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(
        ({ timestamp, level, message, service, ...metadata }) => {
            let logMessage = `${timestamp} [${level.toUpperCase()}] ${message}`;
            if (metadata.stack) logMessage += `\n${metadata.stack}`;
            if (Object.keys(metadata).length > 0 && !metadata.stack) {
                logMessage += ` ${JSON.stringify(metadata)}`;
            }
            return logMessage;
        }
    )
);

// Create transports
const transports = [
    // Console transport
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize({ all: true }),
            format
        ),
    }),

    // Rotating file transport for errors
    new DailyRotateFile({
        filename: path.join('logs', 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxSize: '20m',
        maxFiles: '14d',
    }),

    // Rotating file transport for all logs
    new DailyRotateFile({
        filename: path.join('logs', 'combined-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
    }),
];

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels,
    format,
    transports,
    defaultMeta: { service: 'assessment-service' },
});

// Add request logging middleware
const requestLogger = (req, res, next) => {
    logger.info(`${req.method} ${req.url}`, {
        ip: req.ip,
        userId: req.user?.id,
    });
    next();
};

module.exports = { logger, requestLogger };
