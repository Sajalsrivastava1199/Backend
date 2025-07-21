import asyncHandler from '../utils/asynchandler.js'; 
import ApiError from "../utils/Apierror.js"; // Import ApiError for error handling
import uploadoncloudinary from '../utils/cloudinary.js';
import deleteafromcloudinary from '../utils/Deletecloudinary.js';
import Apiresponse from '../utils/Apiresponse.js';
import { Comment } from '../models/comment.models.js'; // Import the Comment model
import { Video } from '../models/video.models.js'; // Import the Video model
import { isValidObjectId } from 'mongoose';

//get all comments for a video
const getAllComments = asyncHandler(async (req, res) => {
    const { videoID } = req.params; // Get videoID from request parameters
    const { page = 1, limit = 10 } = req.query; // Get pagination parameters
    if (!isValidObjectId(videoID)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const comments = await Comment.aggregate([
        {
            $match:{
                video: new mongoose.Types.ObjectID(videoID) // Match comments for the specified video
            }
        },
        {
            $skip: (page - 1) * limit // Skip comments for pagination   
        },
        {
            $project:{
                content:1,
            }
        },
        {
            $limit: parseInt(limit) // Limit the number of comments returned
        }
    ])

    if(!comments) {
        throw new ApiError(404, "No comments found for this video");
    }   


    res.status(200).json(new Apiresponse(200, "Comments retrieved successfully", comments));    
})


//add a comment to a video
const addcomment = asyncHandler(async (req, res) => {
    const userID = req.user._id; // Get user ID from request,jWT takes care of this
    const {videoID} = req.params; // Get video ID from request parameters
    const {content} = req.body; // Get comment content from request body
    if(!isValidObjectId(videoID)) {
        throw new ApiError(400, "Invalid video ID");
    }
    if(!content) {
        throw new ApiError(400, "Comment content is required");
    }

    const video = await Video.findById(videoID); // Find the video by ID
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const newcomment = await Comment.create({
        content:content,
        video: new mongoose.Types.ObjectId(videoID), // Create a new comment with the video ID
        owner: new mongoose.Types.ObjectId(userID) // Associate the comment with the user
    })

    return res.status(201).json(new Apiresponse(201, "Comment added successfully", newcomment));
})

//update a comment
const updatecomment = asyncHandler(async (req, res) => {
    const {commentID} = req.params; // Get comment ID from request parameters
    const {content} = req.body; // Get updated content from request body

    if(!isValidObjectId(commentID)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    if(!content) {
        throw new ApiError(400, "Comment content is required");
    }

    const originalComment = await Comment.findById(commentID); // Find the original comment by ID
    if (!originalComment) {
        throw new ApiError(404, "Comment not found");
    }

    if( originalComment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this comment");
    }

    const updatedcomment = await Comment.findByIdAndUpdate(commentID,
        {
            $set: {
                content: content // Update the comment content
            }
        },
        {
            new:true// Return the updated comment
        }
    )

    return res.status(200).json(new Apiresponse(200, "Comment updated successfully", updatedcomment));
})

//delete a comment
const deletecomment = asyncHandler(async (req, res) => {
    const {commentID} = req.params;

    if(!isValidObjectId(commentID)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const comment = await Comment.findById(commentID); // Find the comment by ID
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if(comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this comment");
    }

    await Comment.findByIdAndDelete(commentID); // Delete the comment by ID
    return res.status(200).json(new Apiresponse(200, "Comment deleted successfully", null));
})

export {
    getAllComments,
    addcomment,
    updatecomment,  
    deletecomment
};