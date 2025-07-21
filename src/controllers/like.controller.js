import { isValidObjectId } from 'mongoose';
import { Like } from '../models/like.model.js';
import ApiError from '../utils/Apierror.js';
import Apiresponse from '../utils/Apiresponse.js';
import asyncHandler from '../utils/asynchandler.js';

//toggle video like
const togglevideoLike = asyncHandler(async (req, res) => {
    const userID = req.user._id; // Get user ID from request, JWT takes care of this
    const { videoID } = req.params; // Get video ID from request parameters

    if(!isValidObjectId(videoID)) {
        throw new ApiError(400, "Invalid video ID");
    }   

    // Check if the user has already liked the video
    const existingLike = await Like.findOne({ video: videoID, owner: userID });

    if (existingLike) {
        // If the like exists, remove it
        await Like.deleteOne({ _id: existingLike._id });
        return res.status(200).json(new Apiresponse(200, "Like removed successfully"));
    } else {
        // If the like does not exist, create a new one
        const newLike = await new Like({
            video: videoID,
            owner: userID
        });
        await newLike.save();
        return res.status(201).json(new Apiresponse(201, "Video liked successfully", newLike));
    }
})

//toggle comment like
const togglecommentLike = asyncHandler(async (req, res) => {
    const {commentID} = req.params; // Get comment ID from request parameters
    const userID = req.user._id; // Get user ID from request, JWT takes care of this

    if(!isValidObjectId(commentID)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const existingLike = await Like.findOne({ comment: commentID, likedBy: userID });
    if (existingLike) {
        // If the like exists, remove it
        await Like.deleteOne({ _id: existingLike._id });
        return res.status(200).json(new Apiresponse(200, "Comment like removed successfully"));
    } else {
        // If the like does not exist, create a new one
        const newLike = await new Like({
            comment: commentID,
            likedBy: userID
        });
        await newLike.save();
        return res.status(201).json(new Apiresponse(201, "Comment liked successfully", newLike));
    }
})

//toggle tweet like
const toggletweetLike = asyncHandler(async (req, res) => {
    const {tweetID} = req.params; // Get tweet ID from request parameters
    const userID = req.user._id; // Get user ID from request, JWT takes care of this
    if(!isValidObjectId(tweetID)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    const existingLike = await Like.findOne({ tweet: tweetID, likedBy: userID });
    if (existingLike) {
        // If the like exists, remove it
        await Like.deleteOne({ _id: existingLike._id });
        return res.status(200).json(new Apiresponse(200, "Tweet like removed successfully"));
    } else {
        // If the like does not exist, create a new one
        const newLike = await new Like({
            tweet: tweetID,
            likedBy: userID 
        })
        await newLike.save();
        return res.status(201).json(new Apiresponse(201, "Tweet liked successfully", newLike));
    }
})

//aggregating liked videos based on user id
const getLikedVideos = asyncHandler(async (req, res) => {
    const userID = req.user._id; // Get user ID from request, JWT takes care of this

    const likedVideoAggregation = [
        {
            $match:{
                likedBy: new mongoose.Types.ObjectId(userID) // Match likes by the user ID
            }
        },
        {
            $lookup: 
            {
                from: 'videos', // Join with the videos collection
                localField: 'video',
                foreignField: '_id',
                as: 'likedvideos',
                pipeline:[
                    {
                        $lookup:{
                            from: 'users', // Join with the users collection to get video owner details
                            localField: 'owner',
                            foreignField: '_id',
                            as: 'ownerDetails',
                        }
                    },
                    {
                        $unwind: '$ownerDetails' // Unwind the owner details array
                    }
                ]
            }
        },
        {
            $unwind: '$likedvideos' // Unwind the liked videos array
        },
        {
            $project: {
                _id:0,
                $likedvideos: {
                    _id:1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    thumbnailUrl: 1,
                    owner:{
                        username:1,
                        fullname: 1,
                        "avatar.url": 1
                    },
                    viewsCount: 1,
                    ispublished: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    "videofile.url": 1, // Include the video file URL
                    "thumbnailUrl.url": 1 // Include the thumbnail URL
                }
            }
        }
    ]

    return res.status(200).json(new Apiresponse(200, "Liked videos retrieved successfully", likedVideoAggregation));    

})

