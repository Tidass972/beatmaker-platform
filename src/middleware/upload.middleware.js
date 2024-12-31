const multer = require('multer');
const AWS = require('aws-sdk');
const multerS3 = require('multer-s3');
const path = require('path');
const config = require('../config/config');
const { AppError } = require('./error.middleware');

// Configure AWS
AWS.config.update({
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
    region: config.aws.region
});

const s3 = new AWS.S3();

// File filter function
const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (file.fieldname === 'audio') {
        if (config.upload.allowedAudioFormats.includes(ext)) {
            cb(null, true);
        } else {
            cb(new AppError(`Only ${config.upload.allowedAudioFormats.join(', ')} files are allowed for audio!`, 400), false);
        }
    } else if (file.fieldname === 'image') {
        if (config.upload.allowedImageFormats.includes(ext)) {
            cb(null, true);
        } else {
            cb(new AppError(`Only ${config.upload.allowedImageFormats.join(', ')} files are allowed for images!`, 400), false);
        }
    } else {
        cb(new AppError('Invalid field name', 400), false);
    }
};

// Configure multer for S3 upload
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: config.aws.bucketName,
        acl: 'public-read',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: (req, file, cb) => {
            const folder = file.fieldname === 'audio' ? 'beats' : 'images';
            const fileName = `${folder}/${Date.now()}-${file.originalname}`;
            cb(null, fileName);
        }
    }),
    fileFilter: fileFilter,
    limits: {
        fileSize: config.upload.maxFileSize
    }
});

// Middleware for handling file uploads
exports.uploadBeat = upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'image', maxCount: 1 }
]);

exports.uploadProfilePicture = upload.single('image');

// Middleware for deleting files from S3
exports.deleteFile = async (key) => {
    try {
        await s3.deleteObject({
            Bucket: config.aws.bucketName,
            Key: key
        }).promise();
    } catch (error) {
        throw new AppError('Error deleting file from S3', 500);
    }
};

// Generate signed URL for temporary access
exports.getSignedUrl = async (key, expires = 3600) => {
    try {
        return await s3.getSignedUrlPromise('getObject', {
            Bucket: config.aws.bucketName,
            Key: key,
            Expires: expires
        });
    } catch (error) {
        throw new AppError('Error generating signed URL', 500);
    }
};
