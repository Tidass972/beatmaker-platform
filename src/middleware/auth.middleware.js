const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { User } = require('../models/user');

exports.protect = async (req, res, next) => {
    try {
        // 1) Get token from header
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'You are not logged in. Please log in to get access.'
            });
        }

        // 2) Verify token
        const decoded = jwt.verify(token, config.jwt.secret);

        // 3) Check if user still exists
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'The user belonging to this token no longer exists.'
            });
        }

        // 4) Check if user changed password after the token was issued
        if (user.changedPasswordAfter && user.changedPasswordAfter(decoded.iat)) {
            return res.status(401).json({
                status: 'error',
                message: 'User recently changed password! Please log in again.'
            });
        }

        // Grant access to protected route
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({
            status: 'error',
            message: 'Invalid token. Please log in again.'
        });
    }
};

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'error',
                message: 'You do not have permission to perform this action'
            });
        }
        next();
    };
};

exports.isBeatmaker = (req, res, next) => {
    if (req.user.role !== 'beatmaker') {
        return res.status(403).json({
            status: 'error',
            message: 'This action is restricted to beatmakers only'
        });
    }
    next();
};

exports.isClient = (req, res, next) => {
    if (req.user.role !== 'client') {
        return res.status(403).json({
            status: 'error',
            message: 'This action is restricted to clients only'
        });
    }
    next();
};

exports.isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            status: 'error',
            message: 'This action is restricted to administrators only'
        });
    }
    next();
};

exports.isOwner = (model) => async (req, res, next) => {
    try {
        const doc = await model.findById(req.params.id);
        if (!doc) {
            return res.status(404).json({
                status: 'error',
                message: 'Document not found'
            });
        }

        if (doc.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                status: 'error',
                message: 'You do not have permission to perform this action'
            });
        }

        req.document = doc;
        next();
    } catch (error) {
        next(error);
    }
};
