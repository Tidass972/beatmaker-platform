const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Notification = require('../models/notification');
const config = require('../config/config');

class NotificationService {
    constructor() {
        this.clients = new Map();
        this.init();
    }

    init() {
        this.wss = new WebSocket.Server({ 
            port: config.websocket.port,
            verifyClient: this.verifyClient
        });

        this.wss.on('connection', (ws, req) => {
            const userId = req.user.id;
            this.clients.set(userId, ws);

            ws.on('close', () => {
                this.clients.delete(userId);
            });
        });
    }

    verifyClient(info, callback) {
        const token = info.req.headers['sec-websocket-protocol'];
        if (!token) {
            return callback(false, 401, 'Unauthorized');
        }

        try {
            const decoded = jwt.verify(token, config.jwt.secret);
            info.req.user = decoded;
            callback(true);
        } catch (err) {
            callback(false, 401, 'Invalid token');
        }
    }

    async createNotification(userId, type, data) {
        try {
            const notification = await Notification.create({
                user: userId,
                type,
                data,
                createdAt: new Date()
            });

            this.sendNotification(userId, notification);
            return notification;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }

    sendNotification(userId, notification) {
        const ws = this.clients.get(userId);
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(notification));
        }
    }

    async markAsRead(userId, notificationId) {
        try {
            await Notification.findByIdAndUpdate(notificationId, {
                read: true,
                readAt: new Date()
            });
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    }

    async getUserNotifications(userId, query = {}) {
        try {
            const { page = 1, limit = 20, unreadOnly = false } = query;
            const filter = { user: userId };
            if (unreadOnly) {
                filter.read = false;
            }

            const notifications = await Notification.find(filter)
                .sort('-createdAt')
                .skip((page - 1) * limit)
                .limit(limit);

            const total = await Notification.countDocuments(filter);

            return {
                notifications,
                pagination: {
                    current: page,
                    total: Math.ceil(total / limit),
                    count: total
                }
            };
        } catch (error) {
            console.error('Error getting user notifications:', error);
            throw error;
        }
    }

    // Notification templates
    async notifyNewFollower(userId, followerId) {
        const follower = await User.findById(followerId).select('artistName profilePicture');
        await this.createNotification(userId, 'new_follower', {
            follower: {
                id: follower._id,
                name: follower.artistName,
                picture: follower.profilePicture
            }
        });
    }

    async notifyNewSale(userId, transactionData) {
        await this.createNotification(userId, 'new_sale', {
            transaction: transactionData
        });
    }

    async notifyNewComment(userId, beatId, commentData) {
        await this.createNotification(userId, 'new_comment', {
            beat: beatId,
            comment: commentData
        });
    }

    async notifyLicenseExpiry(userId, licenseData) {
        await this.createNotification(userId, 'license_expiry', {
            license: licenseData
        });
    }

    async notifyPromotionStart(userId, beatId) {
        await this.createNotification(userId, 'promotion_start', {
            beat: beatId
        });
    }

    async notifySystemUpdate(message, userIds = []) {
        if (userIds.length === 0) {
            const users = await User.find().select('_id');
            userIds = users.map(user => user._id);
        }

        for (const userId of userIds) {
            await this.createNotification(userId, 'system_update', {
                message
            });
        }
    }
}

module.exports = new NotificationService();
