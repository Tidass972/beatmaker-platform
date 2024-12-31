const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['sale', 'comment', 'follow', 'like', 'message', 'system'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    relatedTo: {
        model: {
            type: String,
            enum: ['Beat', 'Comment', 'User', 'Transaction', 'Playlist']
        },
        id: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'relatedTo.model'
        }
    },
    isRead: {
        type: Boolean,
        default: false
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 2592000 // 30 days TTL
    }
});

module.exports = mongoose.model('Notification', notificationSchema);
