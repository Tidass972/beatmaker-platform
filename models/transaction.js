const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Beatmaker',
        required: true
    },
    beat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Beat',
        required: true
    },
    licenseType: {
        type: String,
        enum: ['basic', 'premium', 'exclusive'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    transactionId: {
        type: String,
        unique: true,
        required: true
    },
    purchaseDate: {
        type: Date,
        default: Date.now
    },
    contract: {
        agreedToTerms: {
            type: Boolean,
            required: true
        },
        licenseDetails: {
            type: Object,
            required: true
        },
        signatureDate: {
            type: Date,
            default: Date.now
        }
    },
    downloadInfo: {
        downloadCount: {
            type: Number,
            default: 0
        },
        lastDownload: Date,
        downloadLinks: [{
            url: String,
            expiresAt: Date
        }]
    }
});

module.exports = mongoose.model('Transaction', transactionSchema);
