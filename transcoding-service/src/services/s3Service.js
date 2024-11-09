const {
    S3Client,
    GetObjectCommand,
    PutObjectCommand,
} = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const fs = require('fs');
const path = require('path');
const { paths } = require('../config/environment');
const logger = require('../utils/logger');

class S3Service {
    constructor() {
        this.client = new S3Client({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
        });
        this.bucket = process.env.S3_BUCKET_NAME;
    }

    async downloadVideo(videoId) {
        const inputPath = path.join(paths.input, `${videoId}.mp4`);
        const writeStream = fs.createWriteStream(inputPath);

        logger.info(`Downloading video from S3`, { videoId });

        try {
            const command = new GetObjectCommand({
                Bucket: this.bucket,
                Key: `uploads/${videoId}.mp4`,
            });

            const response = await this.client.send(command);

            await new Promise((resolve, reject) => {
                response.Body.pipe(writeStream)
                    .on('error', reject)
                    .on('finish', resolve);
            });

            logger.info(`Video downloaded successfully`, { videoId });
            return inputPath;
        } catch (error) {
            logger.error(`Failed to download video from S3`, {
                videoId,
                error: error.message,
            });
            throw error;
        } finally {
            writeStream.end();
        }
    }

    async uploadVideo(videoId, profile) {
        const outputPath = path.join(paths.output, `${videoId}-${profile}.mp4`);
        const fileStream = fs.createReadStream(outputPath);

        logger.info(`Uploading transcoded video to S3`, { videoId, profile });

        try {
            // Use multipart upload for large files
            const upload = new Upload({
                client: this.client,
                params: {
                    Bucket: this.bucket,
                    Key: `transcoded/${videoId}-${profile}.mp4`,
                    Body: fileStream,
                    ContentType: 'video/mp4',
                    Metadata: {
                        'transcoding-profile': profile,
                        'original-video-id': videoId,
                        'transcoded-date': new Date().toISOString(),
                    },
                },
                queueSize: 4, // number of concurrent uploads
                partSize: 5 * 1024 * 1024, // 5MB part size
            });

            upload.on('httpUploadProgress', (progress) => {
                logger.debug('Upload progress', {
                    videoId,
                    loaded: progress.loaded,
                    total: progress.total,
                });
            });

            await upload.done();

            logger.info(`Video uploaded successfully`, { videoId, profile });
            return `transcoded/${videoId}-${profile}.mp4`;
        } catch (error) {
            logger.error(`Failed to upload video to S3`, {
                videoId,
                error: error.message,
            });
            throw error;
        } finally {
            fileStream.destroy();
        }
    }

    async checkVideoExists(videoId) {
        try {
            const command = new GetObjectCommand({
                Bucket: this.bucket,
                Key: `uploads/${videoId}.mp4`,
            });
            await this.client.send(command);
            return true;
        } catch (error) {
            if (error.name === 'NoSuchKey') {
                return false;
            }
            throw error;
        }
    }

    async cleanup(videoId) {
        try {
            const inputPath = path.join(paths.input, `${videoId}.mp4`);
            const outputPath = path.join(paths.output, `${videoId}-*.mp4`);

            await fs.promises.unlink(inputPath).catch(() => {});

            // Cleanup all transcoded versions
            const files = await fs.promises.readdir(paths.output);
            for (const file of files) {
                if (file.startsWith(`${videoId}-`)) {
                    await fs.promises.unlink(path.join(paths.output, file));
                }
            }
        } catch (error) {
            logger.error(`Error cleaning up files for ${videoId}:`, error);
        }
    }
}

module.exports = new S3Service();
