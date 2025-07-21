import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema({
    comment:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment', // Reference to the Comment model
        required: true // Comment is required for each like
    },
    video:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video', // Reference to the Video model
        required: true // Video is required for each like
    },
    likedBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model, who liked the comment
        required: true // User is required for each like
    },
    tweet:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tweet', // Reference to the Tweet model, if applicable
        required: false // Tweet is optional for each like
    }
},{timestamps: true });

export const Like = mongoose.model('Like', likeSchema);