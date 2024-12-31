import mongoose, { Document, Schema } from 'mongoose';

export interface IBeat extends Document {
  title: string;
  producer: mongoose.Types.ObjectId;
  description?: string;
  genre: string[];
  bpm: number;
  key?: string;
  price: number;
  audioFile: string;
  coverImage?: string;
  waveform?: string;
  duration: number;
  tags: string[];
  plays: number;
  likes: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const beatSchema = new Schema<IBeat>({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [2, 'Title must be at least 2 characters long']
  },
  producer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Producer is required']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  genre: [{
    type: String,
    required: [true, 'At least one genre is required']
  }],
  bpm: {
    type: Number,
    required: [true, 'BPM is required'],
    min: [20, 'BPM must be at least 20'],
    max: [999, 'BPM cannot exceed 999']
  },
  key: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  audioFile: {
    type: String,
    required: [true, 'Audio file is required']
  },
  coverImage: {
    type: String,
    default: null
  },
  waveform: {
    type: String,
    default: null
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [0, 'Duration cannot be negative']
  },
  tags: [{
    type: String,
    trim: true
  }],
  plays: {
    type: Number,
    default: 0,
    min: 0
  },
  likes: {
    type: Number,
    default: 0,
    min: 0
  },
  isPublished: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index pour la recherche
beatSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Méthodes virtuelles
beatSchema.virtual('formattedDuration').get(function() {
  const minutes = Math.floor(this.duration / 60);
  const seconds = Math.floor(this.duration % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

export const Beat = mongoose.model<IBeat>('Beat', beatSchema);
