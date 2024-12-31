const Beat = require('../models/beat');
const { AppError } = require('../middleware/error.middleware');
const { deleteFile, getSignedUrl } = require('../middleware/upload.middleware');

// Helper function for search query building
const buildSearchQuery = (params) => {
    const query = {};
    if (params.genre) query.genre = params.genre;
    if (params.bpm) query.bpm = { $gte: params.bpm - 5, $lte: params.bpm + 5 };
    if (params.key) query.key = params.key;
    if (params.priceRange) {
        query['licenses.basic.price'] = {
            $gte: params.priceRange.min,
            $lte: params.priceRange.max
        };
    }
    if (params.mood) query.mood = { $in: params.mood };
    return query;
};

exports.getAllBeats = async (req, res, next) => {
    try {
        // Build query
        const query = buildSearchQuery(req.query);
        query.status = 'active';

        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 12;
        const skip = (page - 1) * limit;

        // Execute query
        const beats = await Beat.find(query)
            .populate('producer', 'artistName profilePicture rating')
            .select('-audioFile')
            .skip(skip)
            .limit(limit)
            .sort(req.query.sort || '-createdAt');

        // Get total count
        const total = await Beat.countDocuments(query);

        // Generate signed URLs for previews
        const beatsWithUrls = await Promise.all(beats.map(async (beat) => {
            const beatObj = beat.toObject();
            beatObj.previewUrl = await getSignedUrl(beat.audioPreview);
            return beatObj;
        }));

        res.status(200).json({
            status: 'success',
            results: beats.length,
            pagination: {
                current: page,
                total: Math.ceil(total / limit),
                count: total
            },
            data: { beats: beatsWithUrls }
        });
    } catch (error) {
        next(error);
    }
};

exports.searchBeats = async (req, res, next) => {
    try {
        const { q } = req.query;
        if (!q) {
            return next(new AppError('Please provide a search query', 400));
        }

        const beats = await Beat.find(
            { $text: { $search: q } },
            { score: { $meta: 'textScore' } }
        )
            .populate('producer', 'artistName profilePicture rating')
            .select('-audioFile')
            .sort({ score: { $meta: 'textScore' } })
            .limit(20);

        res.status(200).json({
            status: 'success',
            results: beats.length,
            data: { beats }
        });
    } catch (error) {
        next(error);
    }
};

exports.getFeaturedBeats = async (req, res, next) => {
    try {
        const beats = await Beat.find({ 
            status: 'active',
            'promotion.isPromoted': true,
            'promotion.endDate': { $gt: Date.now() }
        })
            .populate('producer', 'artistName profilePicture rating')
            .select('-audioFile')
            .limit(10);

        res.status(200).json({
            status: 'success',
            results: beats.length,
            data: { beats }
        });
    } catch (error) {
        next(error);
    }
};

exports.getBeat = async (req, res, next) => {
    try {
        const beat = await Beat.findById(req.params.id)
            .populate('producer', 'artistName profilePicture rating socialLinks')
            .populate('comments')
            .populate('collaborators.user', 'artistName profilePicture');

        if (!beat) {
            return next(new AppError('No beat found with that ID', 404));
        }

        // Generate signed URL for preview
        const beatObj = beat.toObject();
        beatObj.previewUrl = await getSignedUrl(beat.audioPreview);

        res.status(200).json({
            status: 'success',
            data: { beat: beatObj }
        });
    } catch (error) {
        next(error);
    }
};

exports.createBeat = async (req, res, next) => {
    try {
        if (!req.files.audio || !req.files.image) {
            return next(new AppError('Please provide both audio file and cover image', 400));
        }

        const beatData = {
            ...req.body,
            producer: req.user.id,
            audioFile: req.files.audio[0].key,
            audioPreview: req.files.audio[0].key, // TODO: Generate preview
            coverImage: req.files.image[0].key
        };

        const beat = await Beat.create(beatData);

        res.status(201).json({
            status: 'success',
            data: { beat }
        });
    } catch (error) {
        // Delete uploaded files if beat creation fails
        if (req.files) {
            if (req.files.audio) await deleteFile(req.files.audio[0].key);
            if (req.files.image) await deleteFile(req.files.image[0].key);
        }
        next(error);
    }
};

exports.updateBeat = async (req, res, next) => {
    try {
        const beat = await Beat.findById(req.params.id);
        if (!beat) {
            return next(new AppError('No beat found with that ID', 404));
        }

        // Handle file updates
        if (req.files) {
            if (req.files.audio) {
                await deleteFile(beat.audioFile);
                beat.audioFile = req.files.audio[0].key;
                beat.audioPreview = req.files.audio[0].key; // TODO: Generate preview
            }
            if (req.files.image) {
                await deleteFile(beat.coverImage);
                beat.coverImage = req.files.image[0].key;
            }
        }

        // Update other fields
        Object.assign(beat, req.body);
        await beat.save();

        res.status(200).json({
            status: 'success',
            data: { beat }
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteBeat = async (req, res, next) => {
    try {
        const beat = await Beat.findById(req.params.id);
        if (!beat) {
            return next(new AppError('No beat found with that ID', 404));
        }

        // Delete associated files
        await deleteFile(beat.audioFile);
        await deleteFile(beat.audioPreview);
        await deleteFile(beat.coverImage);

        // Delete beat document
        await beat.remove();

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        next(error);
    }
};

exports.likeBeat = async (req, res, next) => {
    try {
        const beat = await Beat.findById(req.params.id);
        if (!beat) {
            return next(new AppError('No beat found with that ID', 404));
        }

        // Update beat stats
        beat.stats.likes += 1;
        await beat.save();

        // Add to user's favorites
        if (!req.user.favorites.includes(beat.id)) {
            req.user.favorites.push(beat.id);
            await req.user.save();
        }

        res.status(200).json({
            status: 'success',
            message: 'Beat liked successfully'
        });
    } catch (error) {
        next(error);
    }
};

exports.unlikeBeat = async (req, res, next) => {
    try {
        const beat = await Beat.findById(req.params.id);
        if (!beat) {
            return next(new AppError('No beat found with that ID', 404));
        }

        // Update beat stats
        beat.stats.likes = Math.max(0, beat.stats.likes - 1);
        await beat.save();

        // Remove from user's favorites
        req.user.favorites = req.user.favorites.filter(id => id.toString() !== beat.id);
        await req.user.save();

        res.status(200).json({
            status: 'success',
            message: 'Beat unliked successfully'
        });
    } catch (error) {
        next(error);
    }
};

exports.recordPlay = async (req, res, next) => {
    try {
        const beat = await Beat.findById(req.params.id);
        if (!beat) {
            return next(new AppError('No beat found with that ID', 404));
        }

        beat.stats.plays += 1;
        beat.stats.conversion.views += 1;
        await beat.save();

        res.status(200).json({
            status: 'success',
            message: 'Play recorded successfully'
        });
    } catch (error) {
        next(error);
    }
};

exports.getBeatStats = async (req, res, next) => {
    try {
        const stats = await Beat.aggregate([
            {
                $match: { _id: req.params.id }
            },
            {
                $lookup: {
                    from: 'transactions',
                    localField: '_id',
                    foreignField: 'beat',
                    as: 'sales'
                }
            },
            {
                $project: {
                    plays: '$stats.plays',
                    likes: '$stats.likes',
                    downloads: '$stats.downloads',
                    totalSales: { $size: '$sales' },
                    revenue: {
                        $sum: '$sales.amount'
                    },
                    conversionRate: {
                        $multiply: [
                            {
                                $divide: [
                                    { $size: '$sales' },
                                    { $max: ['$stats.conversion.views', 1] }
                                ]
                            },
                            100
                        ]
                    }
                }
            }
        ]);

        res.status(200).json({
            status: 'success',
            data: { stats: stats[0] }
        });
    } catch (error) {
        next(error);
    }
};

exports.updateBeatStatus = async (req, res, next) => {
    try {
        const beat = await Beat.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );

        if (!beat) {
            return next(new AppError('No beat found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: { beat }
        });
    } catch (error) {
        next(error);
    }
};

exports.promoteBeat = async (req, res, next) => {
    try {
        const beat = await Beat.findByIdAndUpdate(
            req.params.id,
            {
                promotion: {
                    isPromoted: true,
                    startDate: Date.now(),
                    endDate: req.body.endDate,
                    discount: req.body.discount
                }
            },
            { new: true }
        );

        if (!beat) {
            return next(new AppError('No beat found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: { beat }
        });
    } catch (error) {
        next(error);
    }
};
