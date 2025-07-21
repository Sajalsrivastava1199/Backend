import { isValidObjectId } from 'mongoose';
import { Tweet } from '../models/tweet.models.js';
import { User } from '../models/user.models.js';
import asyncHandler from '../utils/asynchandler.js'; 
import ApiError from "../utils/Apierror.js"; 
import Apiresponse from '../utils/Apiresponse.js';

// Create a new tweet
const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body; // Get tweet content from request body
    const userID = req.user._id; // Get user ID from request, JWT takes care of this
    if (!content) {
        throw new ApiError(400, "Tweet content is required");
    }

    const newTweet = await Tweet.create({
        content,
        owner: userID // Associate the tweet with the user
    });

    if (!newTweet) {
        throw new ApiError(500, "Failed to create tweet");
    }
    res.status(201).json(new Apiresponse(201, "Tweet created successfully", newTweet));
})

//get user tweets
const getUserTweets = asyncHandler(async (req, res) => {
    const userID = req.params.id
    if (!isValidObjectId(userID)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const userTweets = await Tweet.aggregate({
        $match: { owner: new mongoose.Types.ObjectId(userID) } // Match tweets by user ID
    })

    return res.status(200).json(new Apiresponse(200, "User tweets retrieved successfully", userTweets));
})

// update a tweet
const updateTweet = asyncHandler(async (req, res) => {
    const {content} = req.body; // Get updated content from request body
    const tweetID = req.params.id; // Get tweet ID from request parameters

    if (!isValidObjectId(tweetID)) {
        throw new ApiError(400, "Invalid tweet ID");
    }
    if (!content) {
        throw new ApiError(400, "Tweet content is required");
    }

    const originalTweet = await Tweet.findById(tweetID); // Find the original tweet by ID
    if (!originalTweet) {
        throw new ApiError(404, "Tweet not found");
    }
    if (originalTweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this tweet");
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(tweetID,
        { content },
        { new: true } // Return the updated tweet
    );
    
    if (!updatedTweet) {
        throw new ApiError(500, "Failed to update tweet");
    }
    return res.status(200).json(new Apiresponse(200, "Tweet updated successfully", updatedTweet));
})

// delete a tweet
const deleteTweet = asyncHandler(async (req, res) => {
    const TweetID = req.params.id; // Get tweet ID from request parameters
    const userID = req.user._id; // Get user ID from request, JWT takes care of this
    if (!isValidObjectId(TweetID)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    const tweet = await Tweet.findById(TweetID); // Find the tweet by ID
    if (!tweet) {   
        throw new ApiError(404, "Tweet not found");
    }
    if (tweet.owner.toString() !== userID.toString()) {
        throw new ApiError(403, "You are not authorized to delete this tweet");
    }
    await Tweet.findByIdAndDelete(TweetID); // Delete the tweet by ID
    return res.status(200).json(new Apiresponse(200, "Tweet deleted successfully"));
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet }
    