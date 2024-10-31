// src/tasks/cleanupTask.js
const cleanup = require('../services/cleanupService');

const CLEANUP_INTERVAL = process.env.CLEANUP_INTERVAL_MINUTES || 30;

async function runCleanup() {
    console.log('Starting periodic cleanup task...');
    const result = await cleanup.cleanupStaleFiles();
    console.log(
        `Cleanup completed: ${result.cleanedFiles} files removed, ${result.freedSpaceBytes} bytes freed`
    );
}

// Run cleanup periodically
setInterval(runCleanup, CLEANUP_INTERVAL * 60 * 1000);

// Run initial cleanup
runCleanup();
