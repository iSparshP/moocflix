// content-delivery-service/src/controllers/contentController.js
const { uploadToS3, deleteFromS3 } = require('../services/uploadService.js');
const { publishEnrollmentEvent } = require('../services/enrollmentService');
const { redisClient } = require('../config/db');
const { requestTranscoding } = require('../services/transcodeService.js');
const fs = require('fs');
const path = require('path');
const Video = require('../models/Video');

exports.uploadVideo = async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).send('No file uploaded.');
        }

        // Upload file to S3
        const s3Response = await uploadToS3(file);

        // Save metadata to PostgreSQL
        const video = await Video.create({
            filename: file.originalname,
            s3_url: s3Response.Location,
            course_id: req.body.courseId,
        });

        // Request transcoding via Kafka
        await requestTranscoding(video.id);

        res.status(201).send(video);
    } catch (error) {
        console.error('Error uploading video:', error);
        res.status(500).send('Error uploading video.');
    }
};

exports.getCourseVideos = async (req, res) => {
    try {
        const courseId = req.params.courseId;

        // Fetch videos from PostgreSQL
        const videos = await Video.findAll({ where: { course_id: courseId } });

        if (videos.length === 0) {
            return res.status(404).send('No videos found for this course.');
        }

        res.status(200).send(videos);
    } catch (error) {
        console.error('Error fetching course videos:', error);
        res.status(500).send('Error fetching course videos.');
    }
};

exports.fetchVideo = async (req, res) => {
    try {
        const videoId = req.params.videoId;

        // Check cache first
        redisClient.get(videoId, async (err, data) => {
            if (err) throw err;

            if (data) {
                return res.status(200).send(JSON.parse(data));
            } else {
                // Fetch from PostgreSQL
                const video = await Video.findByPk(videoId);

                if (!video) {
                    return res.status(404).send('Video not found.');
                }

                // Save to cache
                redisClient.setex(videoId, 3600, JSON.stringify(video));

                res.status(200).send(video);
            }
        });
    } catch (error) {
        console.error('Error fetching video details:', error);
        res.status(500).send('Error fetching video details.');
    }
};

exports.streamVideo = async (req, res) => {
    try {
        const videoId = req.params.videoId;

        // Fetch video details from PostgreSQL
        const video = await Video.findByPk(videoId);

        if (!video) {
            return res.status(404).send('Video not found.');
        }

        const videoPath = path.join(__dirname, '../uploads', video.filename);
        const stat = fs.statSync(videoPath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

            if (start >= fileSize) {
                res.status(416).send(
                    'Requested range not satisfiable\n' +
                        start +
                        ' >= ' +
                        fileSize
                );
                return;
            }

            const chunksize = end - start + 1;
            const file = fs.createReadStream(videoPath, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'video/mp4',
            };

            res.writeHead(206, head);
            file.pipe(res);
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
            };
            res.writeHead(200, head);
            fs.createReadStream(videoPath).pipe(res);
        }
    } catch (error) {
        console.error('Error streaming video:', error);
        res.status(500).send('Error streaming video.');
    }
};

exports.transcodeVideo = async (req, res) => {
    const { videoId } = req.params;
    try {
        await requestTranscoding(videoId);
        res.status(200).send({
            message: 'Transcoding job requested successfully.',
        });
    } catch (err) {
        console.error('Error requesting transcoding:', err);
        res.status(500).send({ message: 'Error requesting transcoding.' });
    }
};

exports.deleteVideo = async (req, res) => {
    try {
        const videoId = req.params.videoId;

        // Delete from PostgreSQL
        const video = await Video.findByPk(videoId);

        if (!video) {
            return res.status(404).send('Video not found.');
        }

        await video.destroy();

        // Delete from S3
        const s3Key = video.s3_url.split('/').pop();
        await deleteFromS3(s3Key);

        res.status(200).send('Video deleted.');
    } catch (error) {
        console.error('Error deleting video:', error);
        res.status(500).send('Error deleting video.');
    }
};

exports.enrollStudent = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { studentId } = req.body;

        // Validate input
        if (!courseId || !studentId) {
            return res
                .status(400)
                .json({ message: 'Missing required parameters' });
        }

        // Publish enrollment event
        await publishEnrollmentEvent(studentId, courseId);

        // Fetch course videos for immediate access
        const videos = await Video.findAll({
            where: { course_id: courseId },
            attributes: ['id', 'url', 'title'],
        });

        res.status(200).json({
            message: 'Enrollment successful',
            courseId,
            studentId,
            videos,
        });
    } catch (error) {
        console.error('Error processing enrollment:', error);
        res.status(500).json({ message: 'Failed to process enrollment' });
    }
};
