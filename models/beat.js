const mongoose = require('mongoose');

const beatSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    producer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Beatmaker',
        required: true
    },
    audioFile: {
        type: String,
        required: true
    },
    audioPreview: {
        type: String,
        required: true
    },
    coverImage: {
        type: String,
        default: 'default-cover.jpg'
    },
    description: {
        type: String,
        trim: true
    },
    genre: [{
        type: String,
        required: true
    }],
    subGenres: [{
        type: String
    }],
    bpm: {
        type: Number,
        required: true
    },
    key: {
        type: String
    },
    mood: [{
        type: String
    }],
    tags: [{
        type: String,
        trim: true
    }],
    instruments: [{
        type: String
    }],
    licenses: {
        basic: {
            price: Number,
            rights: [String],
            features: [{
                name: String,
                included: Boolean
            }],
            maxDistributionCopies: Number
        },
        premium: {
            price: Number,
            rights: [String],
            features: [{
                name: String,
                included: Boolean
            }],
            maxDistributionCopies: Number
        },
        exclusive: {
            price: Number,
            rights: [String],
            features: [{
                name: String,
                included: Boolean
            }],
            isAvailable: {
                type: Boolean,
                default: true
            }
        }
    },
    stats: {
        plays: {
            type: Number,
            default: 0
        },
        downloads: {
            type: Number,
            default: 0
        },
        likes: {
            type: Number,
            default: 0
        },
        shares: {
            type: Number,
            default: 0
        },
        playlists: {
            type: Number,
            default: 0
        },
        conversion: {
            views: { type: Number, default: 0 },
            purchases: { type: Number, default: 0 }
        }
    },
    waveform: {
        data: [Number],
        width: Number,
        height: Number
    },
    stems: {
        available: {
            type: Boolean,
            default: false
        },
        tracks: [{
            name: String,
            file: String
        }]
    },
    collaborators: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Beatmaker'
        },
        role: String,
        share: Number
    }],
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['draft', 'active', 'sold', 'hidden'],
        default: 'active'
    },
    metadata: {
        duration: Number,
        fileSize: Number,
        format: String,
        bitrate: Number,
        sampleRate: Number
    },
    promotion: {
        isPromoted: {
            type: Boolean,
            default: false
        },
        startDate: Date,
        endDate: Date,
        discount: Number
    }
});

// Indexation pour la recherche
beatSchema.index({ 
    title: 'text', 
    description: 'text', 
    tags: 'text',
    genre: 'text',
    mood: 'text'
});

module.exports = mongoose.model('Beat', beatSchema);
