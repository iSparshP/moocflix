const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const { paths } = require('../config/env');
const logger = require('../utils/logger');

class S3Service {
    constructor() {
        this.s3 = new AWS.S3({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION,
        });
        this.bucket = process.env.S3_BUCKET_NAME;
    }

    async downloadVideo(videoId) {
        const inputPath = path.join(paths.input, `${videoId}.mp4`);
        const writeStream = fs.createWriteStream(inputPath);

        logger.info(`Downloading video from S3`, { videoId });

        try {
            const s3Stream = this.s3
                .getObject({
                    Bucket: this.bucket,
                    Key: `uploads/${videoId}.mp4`,
                })
                .createReadStream();

            await new Promise((resolve, reject) => {
                s3Stream
                    .pipe(writeStream)
                    .on('error', reject)
                    .on('finish', resolve);
            });

            logger.info(`Video downloaded successfully`, { videoId });
            return inputPath;
        } catch (error) {
            logger.error(`Failed to download video from S3`, {
                videoId,
                error,
            });
            throw error;
        }
    }

    async uploadVideo(videoId, profile) {
        const outputPath = path.join(paths.output, `${videoId}-${profile}.mp4`);
        const fileStream = fs.createReadStream(outputPath);

        logger.info(`Uploading transcoded video to S3`, { videoId, profile });

        try {
            await this.s3
                .upload({
                    Bucket: this.bucket,
                    Key: `transcoded/${videoId}-${profile}.mp4`,
                    Body: fileStream,
                    ContentType: 'video/mp4',
                })
                .promise();

            logger.info(`Video uploaded successfully`, { videoId, profile });
            return `transcoded/${videoId}-${profile}.mp4`;
        } catch (error) {
            logger.error(`Failed to upload video to S3`, { videoId, error });
            throw error;
        }
    }
}

module.exports = new S3Service();
