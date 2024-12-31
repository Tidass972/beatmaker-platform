const Playlist = require('../models/playlist');
const Beat = require('../models/beat');
const { AppError } = require('../middleware/error.middleware');
const { getSignedUrl } = require('../middleware/upload.middleware');

exports.getFeaturedPlaylists = async (req, res, next) => {
    try {
        const playlists = await Playlist.find({ 
            isPublic: true,
            'followers.0': { $exists: true } 
        })
            .populate('creator', 'firstName lastName artistName profilePicture')
            .populate('beats.beat', '-audioFile')
            .sort('-followers')
            .limit(10);

        res.status(200).json({
            status: 'success',
            results: playlists.length,
            data: { playlists }
        });
    } catch (error) {
        next(error);
    }
};

exports.getTrendingPlaylists = async (req, res, next) => {
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        const playlists = await Playlist.aggregate([
            {
                $match: {
                    isPublic: true,
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $addFields: {
                    followerCount: { $size: '$followers' }
                }
            },
            {
                $sort: { followerCount: -1 }
            },
            {
                $limit: 10
            }
        ]);

        await Playlist.populate(playlists, [
            { path: 'creator', select: 'firstName lastName artistName profilePicture' },
            { path: 'beats.beat', select: '-audioFile' }
        ]);

        res.status(200).json({
            status: 'success',
            results: playlists.length,
            data: { playlists }
        });
    } catch (error) {
        next(error);
    }
};

exports.getPlaylist = async (req, res, next) => {
    try {
        const playlist = await Playlist.findById(req.params.id)
            .populate('creator', 'firstName lastName artistName profilePicture')
            .populate('beats.beat', '-audioFile')
            .populate('followers', 'firstName lastName artistName profilePicture');

        if (!playlist) {
            return next(new AppError('Playlist not found', 404));
        }

        if (!playlist.isPublic && (!req.user || playlist.creator.id !== req.user.id)) {
            return next(new AppError('This playlist is private', 403));
        }

        // Generate preview URLs for beats
        const playlistObj = playlist.toObject();
        for (let item of playlistObj.beats) {
            if (item.beat.audioPreview) {
                item.beat.previewUrl = await getSignedUrl(item.beat.audioPreview);
            }
        }

        res.status(200).json({
            status: 'success',
            data: { playlist: playlistObj }
        });
    } catch (error) {
        next(error);
    }
};

exports.createPlaylist = async (req, res, next) => {
    try {
        const playlist = await Playlist.create({
            name: req.body.name,
            description: req.body.description,
            creator: req.user.id,
            isPublic: req.body.isPublic,
            tags: req.body.tags
        });

        res.status(201).json({
            status: 'success',
            data: { playlist }
        });
    } catch (error) {
        next(error);
    }
};

exports.updatePlaylist = async (req, res, next) => {
    try {
        const playlist = await Playlist.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
                description: req.body.description,
                tags: req.body.tags
            },
            { new: true, runValidators: true }
        );

        if (!playlist) {
            return next(new AppError('Playlist not found', 404));
        }

        res.status(200).json({
            status: 'success',
            data: { playlist }
        });
    } catch (error) {
        next(error);
    }
};

exports.deletePlaylist = async (req, res, next) => {
    try {
        const playlist = await Playlist.findByIdAndDelete(req.params.id);

        if (!playlist) {
            return next(new AppError('Playlist not found', 404));
        }

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        next(error);
    }
};

exports.addBeatToPlaylist = async (req, res, next) => {
    try {
        const playlist = await Playlist.findById(req.params.id);
        const beat = await Beat.findById(req.body.beatId);

        if (!playlist || !beat) {
            return next(new AppError('Playlist or beat not found', 404));
        }

        // Check if beat already exists in playlist
        if (playlist.beats.some(item => item.beat.toString() === beat.id)) {
            return next(new AppError('Beat already exists in playlist', 400));
        }

        playlist.beats.push({
            beat: beat.id,
            addedAt: Date.now()
        });

        await playlist.save();

        res.status(200).json({
            status: 'success',
            data: { playlist }
        });
    } catch (error) {
        next(error);
    }
};

exports.removeBeatFromPlaylist = async (req, res, next) => {
    try {
        const playlist = await Playlist.findById(req.params.id);

        if (!playlist) {
            return next(new AppError('Playlist not found', 404));
        }

        playlist.beats = playlist.beats.filter(
            item => item.beat.toString() !== req.params.beatId
        );

        await playlist.save();

        res.status(200).json({
            status: 'success',
            data: { playlist }
        });
    } catch (error) {
        next(error);
    }
};

exports.reorderPlaylist = async (req, res, next) => {
    try {
        const playlist = await Playlist.findById(req.params.id);

        if (!playlist) {
            return next(new AppError('Playlist not found', 404));
        }

        // Create a map of current beats for easy lookup
        const beatsMap = new Map(
            playlist.beats.map(item => [item.beat.toString(), item])
        );

        // Create new beats array based on provided order
        playlist.beats = req.body.order.map(beatId => {
            const beat = beatsMap.get(beatId);
            if (!beat) {
                throw new AppError(`Beat ${beatId} not found in playlist`, 400);
            }
            return beat;
        });

        await playlist.save();

        res.status(200).json({
            status: 'success',
            data: { playlist }
        });
    } catch (error) {
        next(error);
    }
};

exports.updatePrivacy = async (req, res, next) => {
    try {
        const playlist = await Playlist.findByIdAndUpdate(
            req.params.id,
            { isPublic: req.body.isPublic },
            { new: true }
        );

        if (!playlist) {
            return next(new AppError('Playlist not found', 404));
        }

        res.status(200).json({
            status: 'success',
            data: { playlist }
        });
    } catch (error) {
        next(error);
    }
};

exports.sharePlaylist = async (req, res, next) => {
    try {
        const playlist = await Playlist.findById(req.params.id)
            .populate('creator', 'artistName');

        if (!playlist) {
            return next(new AppError('Playlist not found', 404));
        }

        const shareUrl = `${req.protocol}://${req.get('host')}/playlists/${playlist.id}`;

        res.status(200).json({
            status: 'success',
            data: { 
                shareUrl,
                playlist: {
                    id: playlist.id,
                    name: playlist.name,
                    creator: playlist.creator.artistName,
                    beatsCount: playlist.beats.length
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.followPlaylist = async (req, res, next) => {
    try {
        const playlist = await Playlist.findById(req.params.id);

        if (!playlist) {
            return next(new AppError('Playlist not found', 404));
        }

        if (playlist.followers.includes(req.user.id)) {
            return next(new AppError('You are already following this playlist', 400));
        }

        playlist.followers.push(req.user.id);
        await playlist.save();

        res.status(200).json({
            status: 'success',
            message: 'Successfully followed playlist'
        });
    } catch (error) {
        next(error);
    }
};

exports.unfollowPlaylist = async (req, res, next) => {
    try {
        const playlist = await Playlist.findById(req.params.id);

        if (!playlist) {
            return next(new AppError('Playlist not found', 404));
        }

        playlist.followers = playlist.followers.filter(
            id => id.toString() !== req.user.id
        );
        await playlist.save();

        res.status(200).json({
            status: 'success',
            message: 'Successfully unfollowed playlist'
        });
    } catch (error) {
        next(error);
    }
};

exports.getMyPlaylists = async (req, res, next) => {
    try {
        const playlists = await Playlist.find({ creator: req.user.id })
            .populate('beats.beat', '-audioFile')
            .sort('-createdAt');

        res.status(200).json({
            status: 'success',
            results: playlists.length,
            data: { playlists }
        });
    } catch (error) {
        next(error);
    }
};

exports.getMyFollowedPlaylists = async (req, res, next) => {
    try {
        const playlists = await Playlist.find({
            followers: req.user.id,
            isPublic: true
        })
            .populate('creator', 'firstName lastName artistName profilePicture')
            .populate('beats.beat', '-audioFile')
            .sort('-createdAt');

        res.status(200).json({
            status: 'success',
            results: playlists.length,
            data: { playlists }
        });
    } catch (error) {
        next(error);
    }
};
