const AWS = require('aws-sdk');
const logger = require('../utils/logger');
const config = require('../config/config');
const { createBreaker } = require('../utils/circuitBreaker');

// Configure AWS SDK for DO Spaces
const spacesEndpoint = new AWS.Endpoint(config.digitalOcean.spacesEndpoint);
const s3 = new AWS.S3({
    endpoint: spacesEndpoint,
    accessKeyId: config.digitalOcean.accessKeyId,
    secretAccessKey: config.digitalOcean.secretAccessKey,
    region: config.digitalOcean.region,
});

// Create circuit breaker for CDN operations
const cdnBreaker = createBreaker('cdn-operations', (operation) => operation(), {
    timeout: 3000,
});

const CDNService = {
    getSignedUrl: async (videoKey) => {
        try {
            const operation = () =>
                s3.getSignedUrlPromise('getObject', {
                    Bucket: config.digitalOcean.spacesBucket,
                    Key: videoKey,
                    Expires: 3600, // URL expires in 1 hour
                });

            const signedUrl = await cdnBreaker.fire(operation);
            logger.info(`Generated signed URL for video: ${videoKey}`);
            return signedUrl;
        } catch (error) {
            logger.error(
                `Failed to generate signed URL for video ${videoKey}:`,
                error
            );
            throw error;
        }
    },

    invalidateCache: async (videoKey) => {
        try {
            const operation = () =>
                s3
                    .copyObject({
                        Bucket: config.digitalOcean.spacesBucket,
                        CopySource: `${config.digitalOcean.spacesBucket}/${videoKey}`,
                        Key: videoKey,
                        MetadataDirective: 'REPLACE',
                        Metadata: {
                            'cache-invalidated': Date.now().toString(),
                        },
                    })
                    .promise();

            await cdnBreaker.fire(operation);
            logger.info(`Cache invalidated for video: ${videoKey}`);
            return true;
        } catch (error) {
            logger.error(
                `Failed to invalidate cache for video ${videoKey}:`,
                error
            );
            throw error;
        }
    },
};

module.exports = CDNService;
