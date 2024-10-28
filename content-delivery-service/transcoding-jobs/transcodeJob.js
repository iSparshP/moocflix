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
    try {
        // Download video from S3
        const videoStream = s3
            .getObject({ Bucket: process.env.S3_BUCKET, Key: videoUrl })
            .createReadStream();

        // Transcode video using FFmpeg
        const transcodedPath = `/tmp/${videoUrl.split('/').pop()}-transcoded.mp4`;
        await new Promise((resolve, reject) => {
            ffmpeg(videoStream)
                .outputOptions('-c:v libx264', '-preset fast', '-crf 22')
                .save(transcodedPath)
                .on('end', resolve)
                .on('error', reject);
        });

        // Upload transcoded video back to S3
        const transcodedStream = fs.createReadStream(transcodedPath);
        const transcodedKey = `transcoded/${videoUrl.split('/').pop()}`;
        await s3
            .upload({
                Bucket: process.env.S3_BUCKET,
                Key: transcodedKey,
                Body: transcodedStream,
            })
            .promise();

        // Send Kafka message for transcoding completion
        await producer.connect();
        await producer.send({
            topic: 'VideoTranscoded',
            messages: [
                {
                    value: JSON.stringify({
                        videoUrl: transcodedKey,
                    }),
                },
            ],
        });
        await producer.disconnect();

        console.log(`Transcoding completed for video: ${videoUrl}`);
    } catch (error) {
        console.error(`Error transcoding video ${videoUrl}:`, error);
        throw error;
    }
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
