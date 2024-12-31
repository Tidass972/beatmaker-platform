const { User, Beatmaker, Client } = require('../models/user');
const { AppError } = require('../middleware/error.middleware');
const { deleteFile } = require('../middleware/upload.middleware');

// Helper function to filter allowed fields
const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};

exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({
            status: 'success',
            data: { user }
        });
    } catch (error) {
        next(error);
    }
};

exports.updateMe = async (req, res, next) => {
    try {
        // 1) Create error if user tries to update password
        if (req.body.password) {
            return next(new AppError('This route is not for password updates. Please use /update-password', 400));
        }

        // 2) Filter unwanted fields
        const filteredBody = filterObj(req.body, 'firstName', 'lastName', 'email');
        
        // Add role-specific fields
        if (req.user.role === 'beatmaker') {
            Object.assign(filteredBody, filterObj(req.body, 'artistName', 'description', 'genres', 'socialLinks'));
        } else if (req.user.role === 'client') {
            Object.assign(filteredBody, filterObj(req.body, 'preferences'));
        }

        // 3) Update user document
        const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            status: 'success',
            data: { user: updatedUser }
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteMe = async (req, res, next) => {
    try {
        await User.findByIdAndUpdate(req.user.id, { status: 'inactive' });

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        next(error);
    }
};

exports.updateProfilePicture = async (req, res, next) => {
    try {
        if (!req.file) {
            return next(new AppError('Please upload a file', 400));
        }

        // Delete old profile picture if it exists
        if (req.user.profilePicture && req.user.profilePicture !== 'default-profile.png') {
            await deleteFile(req.user.profilePicture);
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { profilePicture: req.file.key },
            { new: true }
        );

        res.status(200).json({
            status: 'success',
            data: { user: updatedUser }
        });
    } catch (error) {
        next(error);
    }
};

// Beatmaker specific controllers
exports.getAllBeatmakers = async (req, res, next) => {
    try {
        const beatmakers = await Beatmaker.find({ status: 'active' })
            .select('-email -password')
            .sort('-rating.average');

        res.status(200).json({
            status: 'success',
            results: beatmakers.length,
            data: { beatmakers }
        });
    } catch (error) {
        next(error);
    }
};

exports.getBeatmaker = async (req, res, next) => {
    try {
        const beatmaker = await Beatmaker.findById(req.params.id)
            .select('-email -password')
            .populate('beats');

        if (!beatmaker) {
            return next(new AppError('No beatmaker found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: { beatmaker }
        });
    } catch (error) {
        next(error);
    }
};

exports.getBeatmakerBeats = async (req, res, next) => {
    try {
        const beatmaker = await Beatmaker.findById(req.params.id)
            .populate({
                path: 'beats',
                select: '-audioFile'
            });

        if (!beatmaker) {
            return next(new AppError('No beatmaker found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            results: beatmaker.beats.length,
            data: { beats: beatmaker.beats }
        });
    } catch (error) {
        next(error);
    }
};

exports.getBeatmakerStats = async (req, res, next) => {
    try {
        const stats = await Beatmaker.aggregate([
            {
                $match: { _id: req.params.id }
            },
            {
                $lookup: {
                    from: 'transactions',
                    localField: '_id',
                    foreignField: 'seller',
                    as: 'sales'
                }
            },
            {
                $project: {
                    totalSales: { $size: '$sales' },
                    totalRevenue: {
                        $sum: '$sales.amount'
                    },
                    averageRating: '$rating.average',
                    totalBeats: { $size: '$beats' },
                    totalFollowers: { $size: '$followers' }
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

// Following system
exports.followBeatmaker = async (req, res, next) => {
    try {
        const beatmaker = await Beatmaker.findById(req.params.id);
        if (!beatmaker) {
            return next(new AppError('No beatmaker found with that ID', 404));
        }

        if (beatmaker.followers.includes(req.user.id)) {
            return next(new AppError('You are already following this beatmaker', 400));
        }

        beatmaker.followers.push(req.user.id);
        await beatmaker.save();

        res.status(200).json({
            status: 'success',
            message: 'Successfully followed beatmaker'
        });
    } catch (error) {
        next(error);
    }
};

exports.unfollowBeatmaker = async (req, res, next) => {
    try {
        const beatmaker = await Beatmaker.findById(req.params.id);
        if (!beatmaker) {
            return next(new AppError('No beatmaker found with that ID', 404));
        }

        beatmaker.followers = beatmaker.followers.filter(
            id => id.toString() !== req.user.id.toString()
        );
        await beatmaker.save();

        res.status(200).json({
            status: 'success',
            message: 'Successfully unfollowed beatmaker'
        });
    } catch (error) {
        next(error);
    }
};

// Admin controllers
exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find();

        res.status(200).json({
            status: 'success',
            results: users.length,
            data: { users }
        });
    } catch (error) {
        next(error);
    }
};

exports.getUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return next(new AppError('No user found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: { user }
        });
    } catch (error) {
        next(error);
    }
};

exports.updateUser = async (req, res, next) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!user) {
            return next(new AppError('No user found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: { user }
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteUser = async (req, res, next) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return next(new AppError('No user found with that ID', 404));
        }

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        next(error);
    }
};

exports.updateUserStatus = async (req, res, next) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );

        if (!user) {
            return next(new AppError('No user found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: { user }
        });
    } catch (error) {
        next(error);
    }
};
