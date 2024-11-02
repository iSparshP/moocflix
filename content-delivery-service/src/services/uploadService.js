const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const s3 = new AWS.S3();
const kafka = require('../utils/kafka');
const { createBreaker } = require('../utils/circuitBreaker');
const logger = require('../utils/logger');

// Create circuit breakers for S3 operations
const s3UploadBreaker = createBreaker(
    's3-upload',
    (params) => s3.upload(params).promise(),
    { timeout: 5000 }
);

const s3DeleteBreaker = createBreaker(
    's3-delete',
    (params) => s3.deleteObject(params).promise(),
    { timeout: 3000 }
);

// Add file size validation before upload
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

exports.uploadToS3 = async (file) => {
    if (file.size > MAX_FILE_SIZE) {
        throw new ValidationError('File size exceeds limit');
    }
    return new Promise((resolve, reject) => {
        const fileStream = fs.createReadStream(file.path);
        const uploadParams = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: `${Date.now()}-${file.originalname}`,
            Body: fileStream,
            ContentType: file.mimetype,
        };

        s3UploadBreaker
            .fire(uploadParams)
            .then((data) => {
                logger.info('Upload successful:', data);

                // Send Kafka message for transcoding
                kafka.sendMessage(process.env.KAFKA_TRANSCODE_TOPIC, {
                    videoId: data.Key,
                });

                resolve(data);
            })
            .catch((err) => {
                logger.error('Error uploading to S3:', err);
                reject(err);
            });
    });
};

exports.deleteFromS3 = (key) => {
    const deleteParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
    };

    return s3DeleteBreaker
        .fire(deleteParams)
        .then((data) => {
            logger.info('Delete successful:', data);
            return data;
        })
        .catch((err) => {
            logger.error('Error deleting from S3:', err);
            throw err;
        });
};
