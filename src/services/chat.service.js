const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const Message = require('../models/message');
const Conversation = require('../models/conversation');
const User = require('../models/user');
const config = require('../config/config');
const notificationService = require('./notification.service');

class ChatService {
    constructor() {
        this.clients = new Map();
        this.init();
    }

    init() {
        this.wss = new WebSocket.Server({ 
            port: config.chat.port,
            verifyClient: this.verifyClient
        });

        this.wss.on('connection', (ws, req) => {
            const userId = req.user.id;
            this.clients.set(userId, ws);

            ws.on('message', async (data) => {
                try {
                    const message = JSON.parse(data);
                    await this.handleMessage(userId, message);
                } catch (error) {
                    console.error('Error handling message:', error);
                }
            });

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

    async handleMessage(senderId, { type, conversationId, content, recipientId }) {
        switch (type) {
            case 'message':
                await this.sendMessage(senderId, conversationId, content);
                break;
            case 'start_conversation':
                await this.startConversation(senderId, recipientId);
                break;
            case 'typing':
                await this.broadcastTypingStatus(conversationId, senderId, true);
                break;
            case 'stop_typing':
                await this.broadcastTypingStatus(conversationId, senderId, false);
                break;
        }
    }

    async sendMessage(senderId, conversationId, content) {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            throw new Error('Conversation not found');
        }

        const message = await Message.create({
            conversation: conversationId,
            sender: senderId,
            content,
            sentAt: new Date()
        });

        // Update conversation
        conversation.lastMessage = message._id;
        conversation.updatedAt = new Date();
        await conversation.save();

        // Send to all participants
        const messageData = await this.formatMessage(message);
        conversation.participants.forEach(participantId => {
            if (participantId.toString() !== senderId) {
                this.sendToUser(participantId, {
                    type: 'new_message',
                    data: messageData
                });

                // Send notification if user is offline
                const ws = this.clients.get(participantId.toString());
                if (!ws || ws.readyState !== WebSocket.OPEN) {
                    notificationService.createNotification(participantId, 'new_message', {
                        conversationId,
                        sender: {
                            id: senderId,
                            name: messageData.sender.name
                        },
                        preview: content.substring(0, 50)
                    });
                }
            }
        });
    }

    async startConversation(userId1, userId2) {
        // Check if conversation already exists
        const existingConv = await Conversation.findOne({
            participants: { $all: [userId1, userId2] }
        });

        if (existingConv) {
            return existingConv;
        }

        // Create new conversation
        const conversation = await Conversation.create({
            participants: [userId1, userId2],
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Notify participants
        [userId1, userId2].forEach(userId => {
            this.sendToUser(userId, {
                type: 'conversation_created',
                data: conversation
            });
        });

        return conversation;
    }

    async broadcastTypingStatus(conversationId, userId, isTyping) {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;

        conversation.participants.forEach(participantId => {
            if (participantId.toString() !== userId) {
                this.sendToUser(participantId, {
                    type: 'typing_status',
                    data: {
                        conversationId,
                        userId,
                        isTyping
                    }
                });
            }
        });
    }

    sendToUser(userId, data) {
        const ws = this.clients.get(userId.toString());
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        }
    }

    async formatMessage(message) {
        await message.populate([
            { path: 'sender', select: 'firstName lastName artistName profilePicture' },
            { path: 'conversation' }
        ]);

        return {
            id: message._id,
            content: message.content,
            sender: {
                id: message.sender._id,
                name: message.sender.artistName || `${message.sender.firstName} ${message.sender.lastName}`,
                picture: message.sender.profilePicture
            },
            conversation: message.conversation._id,
            sentAt: message.sentAt,
            readBy: message.readBy
        };
    }

    async markAsRead(userId, messageIds) {
        await Message.updateMany(
            { _id: { $in: messageIds } },
            { $addToSet: { readBy: userId } }
        );
    }

    async getConversations(userId, query = {}) {
        const { page = 1, limit = 20 } = query;
        const conversations = await Conversation.find({ participants: userId })
            .populate('participants', 'firstName lastName artistName profilePicture')
            .populate('lastMessage')
            .sort('-updatedAt')
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Conversation.countDocuments({ participants: userId });

        return {
            conversations,
            pagination: {
                current: page,
                total: Math.ceil(total / limit),
                count: total
            }
        };
    }

    async getMessages(conversationId, query = {}) {
        const { page = 1, limit = 50 } = query;
        const messages = await Message.find({ conversation: conversationId })
            .populate('sender', 'firstName lastName artistName profilePicture')
            .sort('-sentAt')
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Message.countDocuments({ conversation: conversationId });

        return {
            messages: messages.reverse(),
            pagination: {
                current: page,
                total: Math.ceil(total / limit),
                count: total
            }
        };
    }
}

module.exports = new ChatService();
