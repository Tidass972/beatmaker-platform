const stripe = require('stripe')(config.stripe.secretKey);
const Transaction = require('../models/transaction');
const Beat = require('../models/beat');
const { AppError } = require('../middleware/error.middleware');
const { getSignedUrl } = require('../middleware/upload.middleware');
const config = require('../config/config');
const { generateLicenseAgreement } = require('../utils/license');
const sendEmail = require('../utils/email');

exports.createCheckoutSession = async (req, res, next) => {
    try {
        const { beatId, licenseType } = req.body;

        // Get beat and validate availability
        const beat = await Beat.findById(beatId).populate('producer');
        if (!beat) {
            return next(new AppError('Beat not found', 404));
        }

        if (licenseType === 'exclusive' && !beat.licenses.exclusive.isAvailable) {
            return next(new AppError('Exclusive license is no longer available', 400));
        }

        // Calculate price
        const price = beat.licenses[licenseType].price;
        if (beat.promotion.isPromoted && beat.promotion.endDate > Date.now()) {
            price = price * (1 - beat.promotion.discount / 100);
        }

        // Create Stripe session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: req.user.email,
            client_reference_id: beatId,
            metadata: {
                beatId,
                licenseType,
                buyerId: req.user.id,
                sellerId: beat.producer._id.toString()
            },
            line_items: [
                {
                    price_data: {
                        currency: config.stripe.currency,
                        product_data: {
                            name: `${beat.title} - ${licenseType} License`,
                            description: `${licenseType} license for "${beat.title}" by ${beat.producer.artistName}`,
                            images: [beat.coverImage]
                        },
                        unit_amount: Math.round(price * 100)
                    },
                    quantity: 1
                }
            ],
            success_url: `${req.protocol}://${req.get('host')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.protocol}://${req.get('host')}/checkout/cancel`
        });

        res.status(200).json({
            status: 'success',
            data: { sessionId: session.id }
        });
    } catch (error) {
        next(error);
    }
};

exports.handleStripeWebhook = async (req, res, next) => {
    try {
        const signature = req.headers['stripe-signature'];
        const event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            config.stripe.webhookSecret
        );

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            await createTransaction(session);
        }

        res.status(200).json({ received: true });
    } catch (error) {
        next(error);
    }
};

const createTransaction = async (session) => {
    const { beatId, licenseType, buyerId, sellerId } = session.metadata;
    const beat = await Beat.findById(beatId);

    // Create transaction
    const transaction = await Transaction.create({
        beat: beatId,
        buyer: buyerId,
        seller: sellerId,
        licenseType,
        amount: session.amount_total / 100,
        paymentMethod: 'card',
        paymentStatus: 'completed',
        transactionId: session.id,
        contract: {
            agreedToTerms: true,
            licenseDetails: beat.licenses[licenseType],
            signatureDate: new Date()
        }
    });

    // Update beat status if exclusive
    if (licenseType === 'exclusive') {
        beat.licenses.exclusive.isAvailable = false;
        beat.status = 'sold';
        await beat.save();
    }

    // Update stats
    beat.stats.downloads += 1;
    beat.stats.conversion.purchases += 1;
    await beat.save();

    // Send confirmation emails
    await sendPurchaseConfirmation(transaction);
    await sendSaleNotification(transaction);

    return transaction;
};

exports.handleSuccessfulPayment = async (req, res, next) => {
    try {
        const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
        const transaction = await Transaction.findOne({ transactionId: session.id })
            .populate('beat')
            .populate('seller', 'email artistName');

        if (!transaction) {
            return next(new AppError('Transaction not found', 404));
        }

        // Generate download links
        const downloadUrl = await getSignedUrl(transaction.beat.audioFile, 3600); // 1 hour expiry
        transaction.downloadInfo.downloadLinks.push({
            url: downloadUrl,
            expiresAt: new Date(Date.now() + 3600000)
        });
        await transaction.save();

        res.status(200).json({
            status: 'success',
            data: {
                transaction,
                downloadUrl
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.handleCancelledPayment = (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Payment cancelled'
    });
};

exports.getMyPurchases = async (req, res, next) => {
    try {
        const transactions = await Transaction.find({ buyer: req.user.id })
            .populate('beat')
            .populate('seller', 'artistName profilePicture')
            .sort('-purchaseDate');

        res.status(200).json({
            status: 'success',
            results: transactions.length,
            data: { transactions }
        });
    } catch (error) {
        next(error);
    }
};

exports.getMySales = async (req, res, next) => {
    try {
        const transactions = await Transaction.find({ seller: req.user.id })
            .populate('beat')
            .populate('buyer', 'firstName lastName email')
            .sort('-purchaseDate');

        res.status(200).json({
            status: 'success',
            results: transactions.length,
            data: { transactions }
        });
    } catch (error) {
        next(error);
    }
};

exports.downloadBeat = async (req, res, next) => {
    try {
        const transaction = await Transaction.findOne({
            _id: req.params.id,
            buyer: req.user.id
        }).populate('beat');

        if (!transaction) {
            return next(new AppError('Transaction not found', 404));
        }

        // Generate new download link
        const downloadUrl = await getSignedUrl(transaction.beat.audioFile, 3600);
        
        // Update download info
        transaction.downloadInfo.downloadCount += 1;
        transaction.downloadInfo.lastDownload = new Date();
        transaction.downloadInfo.downloadLinks.push({
            url: downloadUrl,
            expiresAt: new Date(Date.now() + 3600000)
        });
        await transaction.save();

        res.status(200).json({
            status: 'success',
            data: { downloadUrl }
        });
    } catch (error) {
        next(error);
    }
};

exports.downloadLicense = async (req, res, next) => {
    try {
        const transaction = await Transaction.findOne({
            _id: req.params.id,
            buyer: req.user.id
        }).populate('beat').populate('seller');

        if (!transaction) {
            return next(new AppError('Transaction not found', 404));
        }

        const licenseAgreement = await generateLicenseAgreement(transaction);

        res.status(200).json({
            status: 'success',
            data: { licenseAgreement }
        });
    } catch (error) {
        next(error);
    }
};

exports.requestRefund = async (req, res, next) => {
    try {
        const transaction = await Transaction.findOne({
            _id: req.params.id,
            buyer: req.user.id,
            paymentStatus: 'completed'
        });

        if (!transaction) {
            return next(new AppError('Transaction not found', 404));
        }

        // Check refund eligibility (e.g., within 24 hours)
        const hoursElapsed = (Date.now() - transaction.purchaseDate) / (1000 * 60 * 60);
        if (hoursElapsed > 24) {
            return next(new AppError('Refund period has expired', 400));
        }

        // Process refund through Stripe
        const refund = await stripe.refunds.create({
            payment_intent: transaction.transactionId
        });

        // Update transaction status
        transaction.paymentStatus = 'refunded';
        await transaction.save();

        // Notify seller
        await sendEmail({
            email: transaction.seller.email,
            subject: 'Refund Processed',
            template: 'refundNotification',
            data: {
                transactionId: transaction.id,
                beatTitle: transaction.beat.title,
                amount: transaction.amount
            }
        });

        res.status(200).json({
            status: 'success',
            data: { refund }
        });
    } catch (error) {
        next(error);
    }
};

exports.createDispute = async (req, res, next) => {
    try {
        const transaction = await Transaction.findOne({
            _id: req.params.id,
            $or: [{ buyer: req.user.id }, { seller: req.user.id }]
        });

        if (!transaction) {
            return next(new AppError('Transaction not found', 404));
        }

        // Create dispute in transaction
        transaction.dispute = {
            reason: req.body.reason,
            description: req.body.description,
            status: 'open',
            createdBy: req.user.id,
            createdAt: new Date()
        };
        await transaction.save();

        // Notify admin
        // TODO: Implement admin notification system

        res.status(200).json({
            status: 'success',
            data: { dispute: transaction.dispute }
        });
    } catch (error) {
        next(error);
    }
};

exports.getSalesStats = async (req, res, next) => {
    try {
        const stats = await Transaction.aggregate([
            {
                $match: {
                    seller: req.user._id,
                    paymentStatus: 'completed'
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$purchaseDate' },
                        month: { $month: '$purchaseDate' }
                    },
                    totalSales: { $sum: 1 },
                    totalRevenue: { $sum: '$amount' },
                    averagePrice: { $avg: '$amount' }
                }
            },
            {
                $sort: { '_id.year': -1, '_id.month': -1 }
            }
        ]);

        res.status(200).json({
            status: 'success',
            data: { stats }
        });
    } catch (error) {
        next(error);
    }
};

const sendPurchaseConfirmation = async (transaction) => {
    await sendEmail({
        email: transaction.buyer.email,
        subject: 'Purchase Confirmation',
        template: 'purchaseConfirmation',
        data: {
            transactionId: transaction.id,
            beatTitle: transaction.beat.title,
            licenseType: transaction.licenseType,
            amount: transaction.amount
        }
    });
};

const sendSaleNotification = async (transaction) => {
    await sendEmail({
        email: transaction.seller.email,
        subject: 'New Sale!',
        template: 'saleNotification',
        data: {
            transactionId: transaction.id,
            beatTitle: transaction.beat.title,
            licenseType: transaction.licenseType,
            amount: transaction.amount
        }
    });
};
