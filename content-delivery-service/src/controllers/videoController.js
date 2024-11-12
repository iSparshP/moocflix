const videoService = require('../services/videoService');
const { ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');
const { publishEnrollmentEvent } = require('../services/enrollmentService');

class VideoController {
    async uploadVideo(req, res, next) {
        try {
            const { courseId } = req.params;
            const userId = req.user.id;
            const file = req.file;

            if (!file) {
                throw new ValidationError('No video file provided');
            }

            const video = await videoService.uploadVideo(
                file,
                courseId,
                userId
            );
            res.status(201).json({
                message: 'Video upload initiated successfully',
                video,
            });
        } catch (error) {
            next(error);
        }
    }

    async getVideo(req, res, next) {
        try {
            const { videoId } = req.params;
            const { quality } = req.query;

            const streamingData = await videoService.streamVideo(
                videoId,
                quality
            );
            res.json(streamingData);
        } catch (error) {
            next(error);
        }
    }

    async getCourseVideos(req, res, next) {
        try {
            const { courseId } = req.params;
            const videos = await videoService.getCourseVideos(courseId);

            if (!videos.length) {
                throw new ValidationError('No videos found for this course');
            }

            res.json(videos);
        } catch (error) {
            next(error);
        }
    }

    async getVideoStatus(req, res, next) {
        try {
            const { videoId } = req.params;
            const video = await videoService.getVideoStatus(videoId);
            res.json(video);
        } catch (error) {
            next(error);
        }
    }

    async deleteVideo(req, res, next) {
        try {
            const { videoId } = req.params;
            const userId = req.user.id;

            await videoService.deleteVideo(videoId, userId);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    async getThumbnails(req, res, next) {
        try {
            const { videoId } = req.params;
            const thumbnails = await videoService.getThumbnails(videoId);
            res.json(thumbnails);
        } catch (error) {
            next(error);
        }
    }

    async enrollStudent(req, res, next) {
        try {
            const { courseId } = req.params;
            const { studentId } = req.body;

            if (!courseId || !studentId) {
                throw new ValidationError('Missing required parameters');
            }

            // Publish enrollment event
            await publishEnrollmentEvent(studentId, courseId);

            // Fetch course videos for immediate access
            const videos = await videoService.getCourseVideos(courseId);

            res.status(200).json({
                message: 'Enrollment successful',
                courseId,
                studentId,
                videos,
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new VideoController();
