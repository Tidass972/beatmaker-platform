const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const authController = require('../controllers/auth.controller');

// Authentication routes
router.post('/register/beatmaker', authController.registerBeatmaker);
router.post('/register/client', authController.registerClient);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Password management
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);
router.patch('/update-password', protect, authController.updatePassword);

// Email verification
router.post('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', protect, authController.resendVerificationEmail);

// OAuth routes
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleAuthCallback);

router.get('/facebook', authController.facebookAuth);
router.get('/facebook/callback', authController.facebookAuthCallback);

// Token refresh
router.post('/refresh-token', authController.refreshToken);

module.exports = router;
