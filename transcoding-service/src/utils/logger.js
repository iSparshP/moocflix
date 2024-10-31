// src/utils/logger.js
const winston = require('winston');
const path = require('path');
const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, colorize, json } = format;

class Logger {
    constructor() {
        const logDir = path.join(process.cwd(), 'logs');
        const environment = process.env.NODE_ENV || 'development';
        const isProduction = environment === 'production';

        // Custom format for console output
        const consoleFormat = printf(
            ({ level, message, timestamp, ...meta }) => {
                const metaStr = Object.keys(meta).length
                    ? JSON.stringify(meta)
                    : '';
                return `${timestamp} [${level}]: ${message} ${metaStr}`;
            }
        );

        this.logger = createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: combine(
                timestamp(),
                isProduction ? json() : combine(colorize(), consoleFormat)
            ),
            transports: [
                // Console transport
                new transports.Console(),

                // File transports
                new transports.File({
                    filename: path.join(logDir, 'error.log'),
                    level: 'error',
                    maxsize: 5242880, // 5MB
                    maxFiles: 5,
                }),
                new transports.File({
                    filename: path.join(logDir, 'combined.log'),
                    maxsize: 5242880,
                    maxFiles: 5,
                }),
            ],
            exceptionHandlers: [
                new transports.File({
                    filename: path.join(logDir, 'exceptions.log'),
                    maxsize: 5242880,
                    maxFiles: 5,
                }),
            ],
        });

        // Track unhandled promise rejections
        process.on('unhandledRejection', (error) => {
            this.error('Unhandled Promise Rejection', { error });
        });
    }

    // Logging methods
    info(message, meta = {}) {
        this.logger.info(message, meta);
    }

    warn(message, meta = {}) {
        this.logger.warn(message, meta);
    }

    error(message, meta = {}) {
        this.logger.error(message, {
            ...meta,
            stack: meta.error?.stack,
        });
    }

    debug(message, meta = {}) {
        this.logger.debug(message, meta);
    }

    // Specialized logging methods
    logJobStart(jobId, profile) {
        this.info('Starting transcoding job', {
            jobId,
            profile,
            event: 'JOB_START',
        });
    }

    logJobComplete(jobId, duration) {
        this.info('Transcoding job completed', {
            jobId,
            duration,
            event: 'JOB_COMPLETE',
        });
    }

    logJobError(jobId, error) {
        this.error('Transcoding job failed', {
            jobId,
            error,
            event: 'JOB_ERROR',
        });
    }

    logMetrics(metrics) {
        this.debug('System metrics', {
            metrics,
            event: 'METRICS',
        });
    }

    logQueueState(queueStats) {
        this.debug('Queue state', {
            stats: queueStats,
            event: 'QUEUE_STATE',
        });
    }

    logAPIRequest(req, res, duration) {
        this.info('API Request', {
            method: req.method,
            path: req.path,
            status: res.statusCode,
            duration,
            event: 'API_REQUEST',
        });
    }
}

const logger = new Logger();
module.exports = logger;
