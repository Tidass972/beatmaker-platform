const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Schéma de base pour tous les utilisateurs
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    profilePicture: {
        type: String,
        default: 'default-profile.png'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    role: {
        type: String,
        enum: ['beatmaker', 'client', 'admin'],
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    lastLogin: Date,
    notifications: {
        email: {
            marketing: { type: Boolean, default: true },
            messages: { type: Boolean, default: true },
            purchases: { type: Boolean, default: true }
        },
        push: {
            enabled: { type: Boolean, default: true },
            token: String
        }
    },
    location: {
        country: String,
        city: String,
        timezone: String
    },
    language: {
        type: String,
        default: 'en'
    }
}, { discriminatorKey: 'userType' });

// Méthode pour hacher le mot de passe avant de sauvegarder
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Schéma spécifique pour les Beatmakers
const beatmakerSchema = new mongoose.Schema({
    artistName: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    genres: [{
        type: String,
        trim: true
    }],
    beats: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Beat'
    }],
    rating: {
        average: {
            type: Number,
            default: 0
        },
        count: {
            type: Number,
            default: 0
        }
    },
    socialLinks: {
        youtube: String,
        instagram: String,
        soundcloud: String,
        twitter: String,
        website: String
    },
    equipment: [{
        type: {
            type: String,
            enum: ['daw', 'plugin', 'hardware']
        },
        name: String,
        description: String
    }],
    achievements: [{
        title: String,
        description: String,
        date: Date,
        icon: String
    }],
    analytics: {
        totalSales: { type: Number, default: 0 },
        monthlyListens: { type: Number, default: 0 },
        revenue: {
            total: { type: Number, default: 0 },
            monthly: { type: Number, default: 0 }
        }
    },
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
});

// Schéma spécifique pour les Clients
const clientSchema = new mongoose.Schema({
    purchasedBeats: [{
        beat: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Beat'
        },
        purchaseDate: {
            type: Date,
            default: Date.now
        },
        licenseType: {
            type: String,
            enum: ['basic', 'premium', 'exclusive']
        },
        transaction: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Transaction'
        }
    }],
    favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Beat'
    }],
    cart: [{
        beat: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Beat'
        },
        licenseType: {
            type: String,
            enum: ['basic', 'premium', 'exclusive']
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    playlists: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Playlist'
    }],
    preferences: {
        favoriteGenres: [String],
        priceRange: {
            min: Number,
            max: Number
        },
        newsletter: {
            type: Boolean,
            default: true
        }
    },
    paymentMethods: [{
        type: {
            type: String,
            enum: ['card', 'paypal']
        },
        isDefault: Boolean,
        lastFour: String,
        expiryDate: String
    }],
    purchaseHistory: {
        totalSpent: { type: Number, default: 0 },
        beatsPurchased: { type: Number, default: 0 },
        lastPurchase: Date
    }
});

// Modèle de base User
const User = mongoose.model('User', userSchema);

// Création des modèles spécifiques
const Beatmaker = User.discriminator('Beatmaker', beatmakerSchema);
const Client = User.discriminator('Client', clientSchema);

module.exports = {
    User,
    Beatmaker,
    Client
};
