const express = require('express');
const router = express.Router();
const { protect, restrictTo, isOwner } = require('../middleware/auth.middleware');
const { uploadProfilePicture } = require('../middleware/upload.middleware');
const userController = require('../controllers/user.controller');

// Profile management
router.get('/me', protect, userController.getMe);
router.patch('/me', protect, uploadProfilePicture, userController.updateMe);
router.delete('/me', protect, userController.deleteMe);

// Profile picture
router.patch('/me/profile-picture', protect, uploadProfilePicture, userController.updateProfilePicture);

// Beatmaker specific routes
router.get('/beatmakers', userController.getAllBeatmakers);
router.get('/beatmakers/:id', userController.getBeatmaker);
router.get('/beatmakers/:id/beats', userController.getBeatmakerBeats);
router.get('/beatmakers/:id/stats', protect, isOwner('User'), userController.getBeatmakerStats);

// Following system
router.post('/beatmakers/:id/follow', protect, userController.followBeatmaker);
router.delete('/beatmakers/:id/unfollow', protect, userController.unfollowBeatmaker);
router.get('/beatmakers/:id/followers', userController.getBeatmakerFollowers);
router.get('/beatmakers/:id/following', userController.getBeatmakerFollowing);

// Client specific routes
router.get('/clients/:id/purchases', protect, isOwner('User'), userController.getClientPurchases);
router.get('/clients/:id/favorites', protect, isOwner('User'), userController.getClientFavorites);
router.get('/clients/:id/playlists', protect, isOwner('User'), userController.getClientPlaylists);

// Admin only routes
router.use(protect, restrictTo('admin'));
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUser);
router.patch('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.patch('/:id/status', userController.updateUserStatus);

module.exports = router;
