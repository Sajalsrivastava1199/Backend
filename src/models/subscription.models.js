import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
    subscriber:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model,one who is subscribing
    },
    channel:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model, the channel being subscribed to    
    }
},{timestamps: true});

export const Subscription = mongoose.model('Subscription', subscriptionSchema);