const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, Beatmaker, Client } = require('../models/user');
const { AppError } = require('../middleware/error.middleware');
const config = require('../config/config');
const sendEmail = require('../utils/email');

const signToken = (id) => {
    return jwt.sign({ id }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn
    });
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        httpOnly: true,
        secure: config.nodeEnv === 'production'
    };

    res.cookie('jwt', token, cookieOptions);

    user.password = undefined; // Remove password from output

    res.status(statusCode).json({
        status: 'success',
        token,
        data: { user }
    });
};

exports.registerBeatmaker = async (req, res, next) => {
    try {
        const newUser = await Beatmaker.create({
            email: req.body.email,
            password: req.body.password,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            artistName: req.body.artistName,
            role: 'beatmaker'
        });

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        newUser.emailVerificationToken = crypto
            .createHash('sha256')
            .update(verificationToken)
            .digest('hex');
        newUser.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
        await newUser.save();

        // Send verification email
        const verificationURL = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${verificationToken}`;
        await sendEmail({
            email: newUser.email,
            subject: 'Please verify your email address',
            template: 'emailVerification',
            data: {
                name: newUser.firstName,
                url: verificationURL
            }
        });

        createSendToken(newUser, 201, res);
    } catch (error) {
        next(error);
    }
};

exports.registerClient = async (req, res, next) => {
    try {
        const newUser = await Client.create({
            email: req.body.email,
            password: req.body.password,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            role: 'client'
        });

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        newUser.emailVerificationToken = crypto
            .createHash('sha256')
            .update(verificationToken)
            .digest('hex');
        newUser.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
        await newUser.save();

        // Send verification email
        const verificationURL = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${verificationToken}`;
        await sendEmail({
            email: newUser.email,
            subject: 'Please verify your email address',
            template: 'emailVerification',
            data: {
                name: newUser.firstName,
                url: verificationURL
            }
        });

        createSendToken(newUser, 201, res);
    } catch (error) {
        next(error);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return next(new AppError('Please provide email and password', 400));
        }

        const user = await User.findOne({ email }).select('+password');

        if (!user || !(await user.comparePassword(password))) {
            return next(new AppError('Incorrect email or password', 401));
        }

        // Update last login
        user.lastLogin = Date.now();
        await user.save({ validateBeforeSave: false });

        createSendToken(user, 200, res);
    } catch (error) {
        next(error);
    }
};

exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    res.status(200).json({ status: 'success' });
};

exports.forgotPassword = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return next(new AppError('There is no user with that email address', 404));
        }

        const resetToken = user.createPasswordResetToken();
        await user.save({ validateBeforeSave: false });

        const resetURL = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;

        await sendEmail({
            email: user.email,
            subject: 'Your password reset token (valid for 10 minutes)',
            template: 'passwordReset',
            data: {
                name: user.firstName,
                url: resetURL
            }
        });

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email'
        });
    } catch (error) {
        next(error);
    }
};

exports.resetPassword = async (req, res, next) => {
    try {
        const hashedToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return next(new AppError('Token is invalid or has expired', 400));
        }

        user.password = req.body.password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        createSendToken(user, 200, res);
    } catch (error) {
        next(error);
    }
};

exports.updatePassword = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('+password');

        if (!(await user.comparePassword(req.body.currentPassword))) {
            return next(new AppError('Your current password is wrong', 401));
        }

        user.password = req.body.newPassword;
        await user.save();

        createSendToken(user, 200, res);
    } catch (error) {
        next(error);
    }
};

exports.verifyEmail = async (req, res, next) => {
    try {
        const hashedToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        const user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!user) {
            return next(new AppError('Token is invalid or has expired', 400));
        }

        user.emailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save({ validateBeforeSave: false });

        createSendToken(user, 200, res);
    } catch (error) {
        next(error);
    }
};

exports.resendVerificationEmail = async (req, res, next) => {
    try {
        if (req.user.emailVerified) {
            return next(new AppError('Email is already verified', 400));
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');
        req.user.emailVerificationToken = crypto
            .createHash('sha256')
            .update(verificationToken)
            .digest('hex');
        req.user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
        await req.user.save({ validateBeforeSave: false });

        const verificationURL = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${verificationToken}`;

        await sendEmail({
            email: req.user.email,
            subject: 'Please verify your email address',
            template: 'emailVerification',
            data: {
                name: req.user.firstName,
                url: verificationURL
            }
        });

        res.status(200).json({
            status: 'success',
            message: 'Verification email sent'
        });
    } catch (error) {
        next(error);
    }
};

// OAuth handlers
exports.googleAuth = (req, res, next) => {
    // Implement Google OAuth
};

exports.googleAuthCallback = (req, res, next) => {
    // Handle Google OAuth callback
};

exports.facebookAuth = (req, res, next) => {
    // Implement Facebook OAuth
};

exports.facebookAuthCallback = (req, res, next) => {
    // Handle Facebook OAuth callback
};

exports.refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return next(new AppError('Please provide refresh token', 400));
        }

        const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
        const user = await User.findById(decoded.id);

        if (!user) {
            return next(new AppError('The user belonging to this token no longer exists', 401));
        }

        createSendToken(user, 200, res);
    } catch (error) {
        next(error);
    }
};
