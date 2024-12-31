const Review = require('../models/review');
const Beat = require('../models/beat');
const User = require('../models/user');
const Transaction = require('../models/transaction');
const { AppError } = require('../middleware/error.middleware');
const notificationService = require('../services/notification.service');

exports.createReview = async (req, res, next) => {
    try {
        // Verify purchase
        const hasPurchased = await Transaction.exists({
            buyer: req.user.id,
            beat: req.params.beatId,
            paymentStatus: 'completed'
        });

        if (!hasPurchased) {
            return next(new AppError('You must purchase this beat to review it', 403));
        }

        // Check if already reviewed
        const existingReview = await Review.findOne({
            author: req.user.id,
            beat: req.params.beatId
        });

        if (existingReview) {
            return next(new AppError('You have already reviewed this beat', 400));
        }

        const review = await Review.create({
            author: req.user.id,
            beat: req.params.beatId,
            rating: req.body.rating,
            comment: req.body.comment
        });

        // Update beat rating
        const beat = await Beat.findById(req.params.beatId);
        const reviews = await Review.find({ beat: req.params.beatId });
        const averageRating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;
        
        beat.stats.rating = averageRating;
        beat.stats.reviewCount = reviews.length;
        await beat.save();

        // Update producer rating
        const producerReviews = await Review.find({ 
            beat: { $in: await Beat.find({ producer: beat.producer }).select('_id') }
        });
        const producerRating = producerReviews.reduce((acc, curr) => acc + curr.rating, 0) / producerReviews.length;
        
        await User.findByIdAndUpdate(beat.producer, {
            rating: producerRating,
            reviewCount: producerReviews.length
        });

        // Notify producer
        await notificationService.createNotification(beat.producer, 'new_review', {
            beat: beat._id,
            review: review._id,
            rating: review.rating,
            reviewer: {
                id: req.user.id,
                name: req.user.artistName || `${req.user.firstName} ${req.user.lastName}`
            }
        });

        res.status(201).json({
            status: 'success',
            data: { review }
        });
    } catch (error) {
        next(error);
    }
};

exports.updateReview = async (req, res, next) => {
    try {
        const review = await Review.findOne({
            _id: req.params.id,
            author: req.user.id
        });

        if (!review) {
            return next(new AppError('Review not found', 404));
        }

        review.rating = req.body.rating || review.rating;
        review.comment = req.body.comment || review.comment;
        review.editedAt = Date.now();
        await review.save();

        // Update beat rating
        const beat = await Beat.findById(review.beat);
        const reviews = await Review.find({ beat: review.beat });
        const averageRating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;
        
        beat.stats.rating = averageRating;
        await beat.save();

        res.status(200).json({
            status: 'success',
            data: { review }
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteReview = async (req, res, next) => {
    try {
        const review = await Review.findOne({
            _id: req.params.id,
            author: req.user.id
        });

        if (!review) {
            return next(new AppError('Review not found', 404));
        }

        await review.remove();

        // Update beat rating
        const beat = await Beat.findById(review.beat);
        const reviews = await Review.find({ beat: review.beat });
        const averageRating = reviews.length > 0
            ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length
            : 0;
        
        beat.stats.rating = averageRating;
        beat.stats.reviewCount = reviews.length;
        await beat.save();

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        next(error);
    }
};

exports.getBeatReviews = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        const reviews = await Review.find({ beat: req.params.beatId })
            .populate('author', 'firstName lastName artistName profilePicture')
            .sort('-createdAt')
            .skip(skip)
            .limit(limit);

        const total = await Review.countDocuments({ beat: req.params.beatId });

        res.status(200).json({
            status: 'success',
            results: reviews.length,
            pagination: {
                current: page,
                total: Math.ceil(total / limit),
                count: total
            },
            data: { reviews }
        });
    } catch (error) {
        next(error);
    }
};

exports.getProducerReviews = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        // Get all beats from producer
        const beats = await Beat.find({ producer: req.params.userId }).select('_id');
        const beatIds = beats.map(beat => beat._id);

        const reviews = await Review.find({ beat: { $in: beatIds } })
            .populate('author', 'firstName lastName artistName profilePicture')
            .populate('beat', 'title coverImage')
            .sort('-createdAt')
            .skip(skip)
            .limit(limit);

        const total = await Review.countDocuments({ beat: { $in: beatIds } });

        res.status(200).json({
            status: 'success',
            results: reviews.length,
            pagination: {
                current: page,
                total: Math.ceil(total / limit),
                count: total
            },
            data: { reviews }
        });
    } catch (error) {
        next(error);
    }
};

exports.reportReview = async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) {
            return next(new AppError('Review not found', 404));
        }

        review.reports.push({
            user: req.user.id,
            reason: req.body.reason,
            details: req.body.details
        });

        if (review.reports.length >= 3) {
            review.status = 'flagged';
        }

        await review.save();

        res.status(200).json({
            status: 'success',
            message: 'Review reported successfully'
        });
    } catch (error) {
        next(error);
    }
};
