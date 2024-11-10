const winston = require('winston');
const path = require('path');
require('winston-daily-rotate-file');

const loggerConfig = {
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.DailyRotateFile({
            filename: path.join('logs', 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxSize: '20m',
            maxFiles: '14d',
        }),
        new winston.transports.DailyRotateFile({
            filename: path.join('logs', 'combined-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '14d',
        }),
    ],
};

const logger = winston.createLogger(loggerConfig);

module.exports = { logger };
