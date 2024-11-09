const validateNumber = (value, min, max, defaultValue) => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= min && num <= max ? num : defaultValue;
};

const limits = {
    maxConcurrentJobs: validateNumber(
        process.env.MAX_CONCURRENT_JOBS,
        1,
        10,
        2
    ),
    maxMemoryUsage: validateNumber(
        process.env.MAX_MEMORY_USAGE,
        0.1,
        0.95,
        0.8
    ),
    maxCpuUsage: validateNumber(process.env.MAX_CPU_USAGE, 0.1, 0.95, 0.9),
    maxDiskUsage: validateNumber(process.env.MAX_DISK_USAGE, 0.1, 0.95, 0.9),
    queueSizeLimit: {
        high: validateNumber(process.env.HIGH_QUEUE_LIMIT, 1, 1000, 100),
        normal: validateNumber(process.env.NORMAL_QUEUE_LIMIT, 1, 1000, 200),
        low: validateNumber(process.env.LOW_QUEUE_LIMIT, 1, 1000, 300),
    },
};

const retry = {
    maxAttempts: validateNumber(process.env.MAX_RETRY_ATTEMPTS, 1, 10, 3),
    backoffMultiplier: 1.5,
    initialDelay: 1000,
};

module.exports = {
    limits,
    retry,
};
