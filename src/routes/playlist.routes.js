const express = require('express');
const router = express.Router();
const { protect, isOwner } = require('../middleware/auth.middleware');
const playlistController = require('../controllers/playlist.controller');

// Public routes
router.get('/featured', playlistController.getFeaturedPlaylists);
router.get('/trending', playlistController.getTrendingPlaylists);
router.get('/:id', playlistController.getPlaylist);

// Protected routes
router.use(protect);

// Playlist management
router.post('/', playlistController.createPlaylist);
router.patch('/:id', isOwner('Playlist'), playlistController.updatePlaylist);
router.delete('/:id', isOwner('Playlist'), playlistController.deletePlaylist);

// Playlist content
router.post('/:id/beats', isOwner('Playlist'), playlistController.addBeatToPlaylist);
router.delete('/:id/beats/:beatId', isOwner('Playlist'), playlistController.removeBeatFromPlaylist);
router.patch('/:id/beats/reorder', isOwner('Playlist'), playlistController.reorderPlaylist);

// Playlist sharing and collaboration
router.patch('/:id/privacy', isOwner('Playlist'), playlistController.updatePrivacy);
router.post('/:id/share', isOwner('Playlist'), playlistController.sharePlaylist);
router.post('/:id/collaborators', isOwner('Playlist'), playlistController.addCollaborator);
router.delete('/:id/collaborators/:userId', isOwner('Playlist'), playlistController.removeCollaborator);

// Playlist interaction
router.post('/:id/follow', playlistController.followPlaylist);
router.delete('/:id/unfollow', playlistController.unfollowPlaylist);
router.get('/:id/followers', playlistController.getPlaylistFollowers);

// User playlists
router.get('/my/playlists', playlistController.getMyPlaylists);
router.get('/my/followed', playlistController.getMyFollowedPlaylists);

module.exports = router;
