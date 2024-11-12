const AWS = require('aws-sdk');
const { createBreaker } = require('../utils/circuitBreaker');
const Video = require('../models/Video');
const logger = require('../utils/logger');
const config = require('../config/config');
const cacheService = require('./cacheService');
const S3 = require('aws-sdk/clients/s3');

class VideoService {
    constructor() {
        // Initialize AWS services
        this.s3 = new S3({
            region: config.aws.region,
            accessKeyId: config.aws.accessKeyId,
            secretAccessKey: config.aws.secretAccessKey,
        });

        this.mediaConvert = new AWS.MediaConvert({
            region: config.aws.region,
            endpoint: config.aws.mediaConvertEndpoint,
        });

        // Create circuit breakers with actual functions
        this.s3UploadBreaker = createBreaker(
            (params) => this.s3.upload(params).promise(),
            's3-upload',
            {
                timeout: 10000, // 10 seconds
                errorThresholdPercentage: 30,
            }
        );

        this.s3DeleteBreaker = createBreaker(
            (params) => this.s3.deleteObject(params).promise(),
            's3-delete',
            {
                timeout: 5000, // 5 seconds
                errorThresholdPercentage: 30,
            }
        );

        this.mediaConvertBreaker = createBreaker(
            (params) => this.mediaConvert.createJob(params).promise(),
            'mediaconvert',
            {
                timeout: 15000, // 15 seconds
                errorThresholdPercentage: 30,
            }
        );
    }

    async uploadVideo(file, courseId, userId) {
        let s3Response;
        try {
            // Upload to S3
            s3Response = await this.s3UploadBreaker.fire(() =>
                this.s3
                    .upload({
                        Bucket: config.aws.bucketName,
                        Key: `uploads/${Date.now()}-${file.originalname}`,
                        Body: file.buffer,
                        ContentType: file.mimetype,
                    })
                    .promise()
            );

            // Create video record
            const video = await Video.create({
                filename: file.originalname,
                s3_url: s3Response.Location,
                course_id: courseId,
                uploaded_by: userId,
                status: 'pending',
                metadata: {
                    size: file.size,
                    mimetype: file.mimetype,
                    uploadedAt: new Date(),
                },
            });

            // Cache the initial video data
            const cacheKey = cacheService.generateVideoKey(video.id);
            await cacheService.set(cacheKey, {
                id: video.id,
                status: video.status,
                progress: 0,
                metadata: video.metadata,
            });

            // Start transcoding
            await this.startTranscoding(video.id, s3Response.Key);

            return video;
        } catch (error) {
            logger.error('Video upload failed:', error);
            if (s3Response?.Key) {
                await this.cleanupS3Object(s3Response.Key);
            }
            throw error;
        }
    }

    async startTranscoding(videoId, s3Key) {
        try {
            const jobParams = this.createTranscodingJobParams(s3Key, videoId);

            const response = await this.mediaConvertBreaker.fire(() =>
                this.mediaConvert.createJob(jobParams).promise()
            );

            await Video.update(
                {
                    status: 'transcoding',
                    transcoding_job_id: response.Job.Id,
                },
                { where: { id: videoId } }
            );

            logger.info(
                `Transcoding job created for video ${videoId}: ${response.Job.Id}`
            );
        } catch (error) {
            logger.error(
                `Failed to start transcoding for video ${videoId}:`,
                error
            );
            throw error;
        }
    }

    createTranscodingJobParams(inputKey, videoId) {
        return {
            Role: config.aws.mediaConvertRole,
            Settings: {
                InputGroups: [
                    {
                        InputSettings: {
                            FileInput: `s3://${config.aws.bucketName}/${inputKey}`,
                        },
                    },
                ],
                OutputGroups: [
                    // HLS Output
                    {
                        Name: 'HLS',
                        OutputGroupSettings: {
                            Type: 'HLS_GROUP_SETTINGS',
                            HlsGroupSettings: {
                                SegmentLength: 6,
                                MinSegmentLength: 0,
                                Destination: `s3://${config.aws.bucketName}/transcoded/${videoId}/hls/`,
                            },
                        },
                        Outputs: [
                            {
                                Preset: 'System-Avc_16x9_1080p_29_97fps_8500kbps',
                                NameModifier: '1080p',
                            },
                            {
                                Preset: 'System-Avc_16x9_720p_29_97fps_6500kbps',
                                NameModifier: '720p',
                            },
                            {
                                Preset: 'System-Avc_16x9_480p_29_97fps_4000kbps',
                                NameModifier: '480p',
                            },
                        ],
                    },
                    // MP4 Output
                    {
                        Name: 'MP4',
                        OutputGroupSettings: {
                            Type: 'FILE_GROUP_SETTINGS',
                            FileGroupSettings: {
                                Destination: `s3://${config.aws.bucketName}/transcoded/${videoId}/mp4/`,
                            },
                        },
                        Outputs: [
                            {
                                Preset: 'System-Generic_Uhd_Mp4_Hevc_10bit',
                                NameModifier: 'mp4-1080p',
                            },
                        ],
                    },
                    // Add Thumbnail Output Group
                    {
                        Name: 'Thumbnails',
                        OutputGroupSettings: {
                            Type: 'FILE_GROUP_SETTINGS',
                            FileGroupSettings: {
                                Destination: `s3://${config.aws.bucketName}/thumbnails/${videoId}/`,
                            },
                        },
                        Outputs: [
                            {
                                Extension: 'jpg',
                                NameModifier: 'thumbnail',
                                ContainerSettings: {
                                    Container: 'RAW',
                                },
                                VideoDescription: {
                                    ScalingBehavior: 'DEFAULT',
                                    TimecodeInsertion: 'DISABLED',
                                    AntiAlias: 'ENABLED',
                                    Width: 1280,
                                    Height: 720,
                                    CodecSettings: {
                                        Codec: 'FRAME_CAPTURE',
                                        FrameCaptureSettings: {
                                            FramerateNumerator: 1,
                                            FramerateDenominator: 30,
                                            MaxCaptures: 3,
                                            Quality: 80,
                                        },
                                    },
                                },
                            },
                        ],
                    },
                ],
            },
            StatusUpdateInterval: 'SECONDS_10',
            Queue: config.aws.mediaConvertQueue,
        };
    }

    async streamVideo(videoId, quality = '720p') {
        const video = await Video.findByPk(videoId);
        if (!video) {
            throw new Error('Video not found');
        }

        if (video.status !== 'completed') {
            throw new Error('Video is not ready for streaming');
        }

        // Generate signed URLs for streaming
        const hlsUrl = await this.s3UploadBreaker.fire(() =>
            this.s3.getSignedUrlPromise('getObject', {
                Bucket: config.aws.bucketName,
                Key: `transcoded/${videoId}/hls/${quality}/master.m3u8`,
                Expires: 3600, // 1 hour
            })
        );

        return {
            url: hlsUrl,
            type: 'application/x-mpegURL',
            metadata: {
                duration: video.duration,
                quality,
                availableQualities: ['480p', '720p', '1080p'],
            },
        };
    }

    async cleanupS3Object(key) {
        try {
            await this.s3DeleteBreaker.fire(() =>
                this.s3
                    .deleteObject({
                        Bucket: config.aws.bucketName,
                        Key: key,
                    })
                    .promise()
            );
        } catch (error) {
            logger.error('Failed to cleanup S3 object:', error);
        }
    }

    async getVideoStatus(videoId) {
        // Try to get from cache first
        const cacheKey = cacheService.generateVideoKey(videoId);
        const cachedData = await cacheService.get(cacheKey);

        if (cachedData) {
            logger.info(`Cache hit for video ${videoId}`);
            return cachedData;
        }

        // If not in cache, get from database
        const video = await Video.findByPk(videoId);
        if (!video) {
            throw new Error('Video not found');
        }

        const videoData = {
            id: video.id,
            status: video.status,
            progress: video.transcoding_progress,
            error: video.error_message,
            metadata: video.metadata,
        };

        // Cache the result
        await cacheService.set(cacheKey, videoData);

        return videoData;
    }

    async deleteVideo(videoId, userId) {
        const video = await Video.findByPk(videoId);
        if (!video) {
            throw new Error('Video not found');
        }

        if (video.uploaded_by !== userId) {
            throw new Error('Unauthorized to delete this video');
        }

        // Delete from S3
        await this.cleanupS3Object(`uploads/${video.filename}`);
        if (video.transcoded_urls) {
            await this.cleanupTranscodedFiles(videoId);
        }

        // Delete from cache
        const cacheKey = cacheService.generateVideoKey(videoId);
        await cacheService.del(cacheKey);

        // Delete from database
        await video.destroy();
    }

    async cleanupTranscodedFiles(videoId) {
        const objects = await this.s3UploadBreaker.fire(() =>
            this.s3
                .listObjects({
                    Bucket: config.aws.bucketName,
                    Prefix: `transcoded/${videoId}/`,
                })
                .promise()
        );

        if (objects.Contents.length > 0) {
            await this.s3DeleteBreaker.fire(() =>
                this.s3
                    .deleteObjects({
                        Bucket: config.aws.bucketName,
                        Delete: {
                            Objects: objects.Contents.map(({ Key }) => ({
                                Key,
                            })),
                        },
                    })
                    .promise()
            );
        }
    }

    async getThumbnails(videoId) {
        const cacheKey = cacheService.generateVideoKey(videoId);
        const cachedData = await cacheService.get(cacheKey);

        if (cachedData?.thumbnails) {
            return cachedData.thumbnails;
        }

        const video = await Video.findByPk(videoId);
        if (!video) {
            throw new Error('Video not found');
        }

        if (!video.thumbnail_url) {
            throw new Error('Thumbnails not yet generated');
        }

        const thumbnails = {
            url: video.thumbnail_url,
            timestamps: video.thumbnail_timestamps,
        };

        // Cache thumbnails data
        if (cachedData) {
            cachedData.thumbnails = thumbnails;
            await cacheService.set(cacheKey, cachedData);
        }

        return thumbnails;
    }
}

module.exports = new VideoService();
