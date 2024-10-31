// src/constants/profiles.js

/**
 * Video transcoding profiles with predefined settings
 * @typedef {Object} TranscodingProfile
 * @property {string} videoBitrate - Video bitrate (e.g., "1000k")
 * @property {string} audioBitrate - Audio bitrate (e.g., "128k")
 * @property {string} description - Profile description
 */

const TRANSCODING_PROFILES = {
    default: {
        videoBitrate: '1000k',
        audioBitrate: '128k',
        description: 'Standard quality profile for general use',
        resolution: '720p',
    },
    high: {
        videoBitrate: '2000k',
        audioBitrate: '192k',
        description: 'High quality profile for premium content',
        resolution: '1080p',
    },
    low: {
        videoBitrate: '500k',
        audioBitrate: '64k',
        description: 'Low quality profile for mobile devices',
        resolution: '480p',
    },
};

/**
 * Validates if a profile exists
 * @param {string} profileName - Name of the profile to validate
 * @returns {boolean} - True if profile exists
 */
const isValidProfile = (profileName) => {
    return Object.keys(TRANSCODING_PROFILES).includes(profileName);
};

/**
 * Gets profile settings or returns default profile
 * @param {string} profileName - Name of the profile
 * @returns {TranscodingProfile} - Profile settings
 */
const getProfile = (profileName) => {
    return TRANSCODING_PROFILES[profileName] || TRANSCODING_PROFILES.default;
};

module.exports = {
    TRANSCODING_PROFILES,
    isValidProfile,
    getProfile,
};
