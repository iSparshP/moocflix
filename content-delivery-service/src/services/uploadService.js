const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const s3 = new AWS.S3();

exports.uploadToS3 = (file) => {
    return new Promise((resolve, reject) => {
        const fileStream = fs.createReadStream(file.path);
        const uploadParams = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: `${Date.now()}-${file.originalname}`,
            Body: fileStream,
            ContentType: file.mimetype,
        };

        s3.upload(uploadParams, (err, data) => {
            if (err) {
                console.error('Error uploading to S3:', err);
                reject(err);
            } else {
                console.log('Upload successful:', data);
                resolve(data);
            }
        });
    });
};

exports.deleteFromS3 = (key) => {
    return new Promise((resolve, reject) => {
        const deleteParams = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
        };

        s3.deleteObject(deleteParams, (err, data) => {
            if (err) {
                console.error('Error deleting from S3:', err);
                reject(err);
            } else {
                console.log('Delete successful:', data);
                resolve(data);
            }
        });
    });
};
