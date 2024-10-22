const { uploadToS3, deleteFromS3 } = require('../services/uploadService.js');
const { pool, redisClient } = require('../config/db');
const { requestTranscoding } = require('../services/transcodeService.js');
const fs = require('fs');
const path = require('path');

exports.uploadVideo = async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).send('No file uploaded.');
        }

        // Upload file to S3
        const s3Response = await uploadToS3(file);

        // Save metadata to PostgreSQL
        const query =
            'INSERT INTO videos (filename, s3_url) VALUES ($1, $2) RETURNING *';
        const values = [file.originalname, s3Response.Location];
        const result = await pool.query(query, values);

        // Request transcoding via Kafka
        await requestTranscoding(result.rows[0].id);

        res.status(201).send(result.rows[0]);
    } catch (error) {
        console.error('Error uploading video:', error);
        res.status(500).send('Error uploading video.');
    }
};

// content-delivery-service/src/controllers/contentController.js
exports.getCourseVideos = async (req, res) => {
    try {
        const courseId = req.params.courseId;

        // Fetch videos from PostgreSQL
        const query = 'SELECT * FROM videos WHERE course_id = $1';
        const result = await pool.query(query, [courseId]);

        if (result.rows.length === 0) {
            return res.status(404).send('No videos found for this course.');
        }

        res.status(200).send(result.rows);
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
                const query = 'SELECT * FROM videos WHERE id = $1';
                const result = await pool.query(query, [videoId]);

                if (result.rows.length === 0) {
                    return res.status(404).send('Video not found.');
                }

                // Save to cache
                redisClient.setex(
                    videoId,
                    3600,
                    JSON.stringify(result.rows[0])
                );

                res.status(200).send(result.rows[0]);
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
        const query = 'SELECT * FROM videos WHERE id = $1';
        const result = await pool.query(query, [videoId]);

        if (result.rows.length === 0) {
            return res.status(404).send('Video not found.');
        }

        const videoPath = path.join(
            __dirname,
            '../uploads',
            result.rows[0].filename
        );
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
    try {
        const videoId = req.params.videoId;

        // Request transcoding via Kafka
        await requestTranscoding(videoId);

        res.status(200).send('Transcoding requested.');
    } catch (error) {
        console.error('Error requesting transcoding:', error);
        res.status(500).send('Error requesting transcoding.');
    }
};

exports.deleteVideo = async (req, res) => {
    try {
        const videoId = req.params.videoId;

        // Delete from PostgreSQL
        const query = 'DELETE FROM videos WHERE id = $1 RETURNING *';
        const result = await pool.query(query, [videoId]);

        if (result.rows.length === 0) {
            return res.status(404).send('Video not found.');
        }

        // Delete from S3
        const s3Key = result.rows[0].s3_url.split('/').pop();
        await deleteFromS3(s3Key);

        res.status(200).send('Video deleted.');
    } catch (error) {
        console.error('Error deleting video:', error);
        res.status(500).send('Error deleting video.');
    }
};
