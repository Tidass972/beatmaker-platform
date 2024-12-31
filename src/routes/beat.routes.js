const express = require('express');
const router = express.Router();
const { protect, isBeatmaker, isOwner } = require('../middleware/auth.middleware');
const { uploadBeat } = require('../middleware/upload.middleware');
const beatController = require('../controllers/beat.controller');

// Public routes
router.get('/', beatController.getAllBeats);
router.get('/search', beatController.searchBeats);
router.get('/featured', beatController.getFeaturedBeats);
router.get('/genres', beatController.getGenres);
router.get('/:id', beatController.getBeat);
router.get('/:id/similar', beatController.getSimilarBeats);

// Protected routes
router.use(protect);

// Interaction routes
router.post('/:id/like', beatController.likeBeat);
router.delete('/:id/unlike', beatController.unlikeBeat);
router.post('/:id/play', beatController.recordPlay);
router.get('/:id/comments', beatController.getBeatComments);
router.post('/:id/comments', beatController.addComment);

// Beatmaker only routes
router.use(isBeatmaker);
router.post('/', uploadBeat, beatController.createBeat);
router.patch('/:id', isOwner('Beat'), uploadBeat, beatController.updateBeat);
router.delete('/:id', isOwner('Beat'), beatController.deleteBeat);

// Beat management
router.patch('/:id/status', isOwner('Beat'), beatController.updateBeatStatus);
router.patch('/:id/promote', isOwner('Beat'), beatController.promoteBeat);
router.post('/:id/stems', isOwner('Beat'), uploadBeat, beatController.uploadStems);

// Analytics
router.get('/:id/stats', isOwner('Beat'), beatController.getBeatStats);
router.get('/my/stats', beatController.getMyBeatsStats);

// License management
router.patch('/:id/licenses', isOwner('Beat'), beatController.updateLicenses);
router.get('/:id/licenses/history', isOwner('Beat'), beatController.getLicenseHistory);

// Collaboration
router.post('/:id/collaborators', isOwner('Beat'), beatController.addCollaborator);
router.delete('/:id/collaborators/:userId', isOwner('Beat'), beatController.removeCollaborator);

module.exports = router;
