// content-delivery-service/transcoding-jobs/transcodeJob.js
const { Kafka } = require('kafkajs');
const AWS = require('aws-sdk');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');

const kafka = new Kafka({
    clientId: 'transcoding-service',
    brokers: [process.env.KAFKA_BROKER],
});
const consumer = kafka.consumer({ groupId: 'transcoding-group' });
const producer = kafka.producer();

const s3 = new AWS.S3();

const transcodeVideo = async (videoUrl) => {
    // Download video from S3
    const videoStream = s3
        .getObject({ Bucket: process.env.S3_BUCKET, Key: videoUrl })
        .createReadStream();

    // Transcode video using FFmpeg
    ffmpeg(videoStream)
        .outputOptions('-c:v libx264', '-preset fast', '-crf 22')
        .save(`/tmp/${videoUrl}`)
        .on('end', async () => {
            // Upload transcoded video back to S3
            const params = {
                Bucket: process.env.S3_BUCKET,
                Key: `transcoded/${videoUrl}`,
                Body: fs.createReadStream(`/tmp/${videoUrl}`),
            };
            await s3.upload(params).promise();

            // Send Kafka message for transcoding completion
            await producer.connect();
            await producer.send({
                topic: 'VideoTranscoded',
                messages: [
                    {
                        value: JSON.stringify({
                            videoUrl: `transcoded/${videoUrl}`,
                        }),
                    },
                ],
            });
            await producer.disconnect();
        });
};

const run = async () => {
    await consumer.connect();
    await consumer.subscribe({
        topic: 'Transcoding-Request',
        fromBeginning: true,
    });

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const { videoUrl } = JSON.parse(message.value.toString());
            await transcodeVideo(videoUrl);
        },
    });
};

run().catch(console.error);
