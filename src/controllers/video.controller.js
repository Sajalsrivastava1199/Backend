import asyncHandler from '../utils/asynchandler.js'; 
import ApiError from "../utils/Apierror.js"; // Import ApiError for error handling
import {User} from "../models/user.models.js"; // Import the User model
import uploadoncloudinary from '../utils/cloudinary.js';
import deleteafromcloudinary from '../utils/Deletecloudinary.js';
import Apiresponse from '../utils/Apiresponse.js';
import { Video } from '../models/video.models.js'; // Import the Video model
import { notificationQueue } from '../queue/notificationQueue.js';
import { notificationWorker, sendNotificationEmail } from '../queue/notificationProcessor.js';
import { isValidObjectId } from 'mongoose';
import { Subscription } from '../models/subscription.models.js';

//getting all videos vased on query,sort and pagination
const getAllVideos = asyncHandler(async (req, res) => {
    const { query, sort, page = 1, limit = 10, sortBy, sortType, userID } = req.query; // Destructure query parameters
})

//get video,upload to cloudinary ,create video document in database
const publishVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body;
    const videLocalePath = req.files.videofile?.[0]?.path; // Get the video file
    const thumbnailLocalePath = req.files.thumbnailfile?.[0]?.path; // Get the thumbnail file 

    if (!videLocalePath) {
        throw new ApiError(400, "Videofile are required");
    }

    if (!thumbnailLocalePath) {
        throw new ApiError(400, "Thumbnail file is required");
    }

    const videofile = await uploadoncloudinary(videLocalePath);
    const thumbnailfile = await uploadoncloudinary(thumbnailLocalePath);

    if (!videofile) {
        throw new ApiError(500, "Failed to upload video on Cloudinary");
    }
    if (!thumbnailfile) {
        throw new ApiError(500, "Failed to upload thumbnail on Cloudinary");
    }

    console.log("Video file uploaded successfully:", videofile);

    const PubVideo = await Video.create(
        {
            videofile: videofile.url,
            title: title,   
            description: description,
            duration: videofile.duration, 
            thumbnailUrl: thumbnailfile.url,
            owner: req.user._id, 
            ispublished: true 
        }
    )

    const contentCreater = req.user._id;
    let emails = ["sajcheeku@gmail.com"]

    try {
        for (const email of emails) {
            await sendNotificationEmail('sendEmail',"New video uploaded", email);
        }
    }catch(error){
        throw new ApiError(500, "Failed to notify subscribers");
    }
    
    return res.status(201)
    .json(new Apiresponse(200,PubVideo, "Video published successfully"));
})

//get video by id
const getVideoById = asyncHandler(async (req, res) => {
    const videoID = req.params;

    if(!isValidObjectId(videoID)){
        throw new ApiError(400, "Invalid video ID");
    }

    //getting video likes and owner details
    const Video = await Video.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(videoID)
            }
        },
        {
            $lookup:{
                from: 'likes',
                localField: '_id',
                foreignField: 'video',
                as: 'likes'
            }
        },
        {
            $lookup:{
                from: 'users',
                localField: 'owner',
                foreignField: '_id',
                as: 'ownerDetails',
                pipeline: [
                    {
                        $lookup:{
                            from: 'subscriptions',
                            localField: '_id',
                            foreignField: 'channel',
                            as: 'subscriptions',
                        }
                    },
                    {
                        $addFields: {
                            subscriberscount: { $size: '$subscriptions' }, // Add subscribers count
                            isSubscribed: {
                                $cond: {
                                    if: { $in: [req.user._id, '$subscriptions.subscriber'] }, // Check if user is subscribed
                                    then: true,
                                    else: false 
                                }
                            }
                        }
                    },
                    {
                        $project:{
                            username: 1,
                            avatar:1,
                            subscriberscount: 1,
                            isSubscribed: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                likesCount: { $size: '$likes' }, // Add likes count
                isLiked: {
                    $cond: {
                        if: { $in: [req.user._id, '$likes.likedBy'] }, // Check if user has liked the video
                        then: true,
                        else: false 
                    }
                }
            }
        },
        {
            $project:{
                "videofile.url": 1,
                title: 1,
                description: 1,
                createdAt: 1,
                owner: 1,
                likesCount: 1,
                isLiked: 1,
                duration: 1,
            }
        }
    ])

    if(!Video){
        throw new ApiError(404, "Failed to fetch video information");
    }

    // Increment views count
    await Video.findByIdAndUpdate(videoID, 
        {
         $inc: { viewsCount: 1 } }, { new: true }
    );

    await User.findByIdAndUpdate(req.user._id,
        {
            $addToSet: { watchHistory: videoID } // Add video ID to viewedVideos array
        }, { new: true }
    );


    return res.status(200)
    .json(new Apiresponse(200, Video, "Video details fetched successfully"));
})

//update video details like title,description,thumbnail
const updateVideoDetails = asyncHandler(async (req, res) => {
    const {videoID} = req.params; // Get video ID from request parameters
    const { title, description } = req.body;
    const thumbnailLocalePath = req.files?.thumbnailfile?.[0]?.path; // Get the thumbnail file

    if (!title || !description) {
        throw new ApiError(400, "Title and description are required");
    }

    if(!isValidObjectId(videoID)){
        throw new ApiError(400, "Invalid video ID");
    }

    const originalVideo = await Video.findById(videoID);
    if (!originalVideo) {
        throw new ApiError(404, "Video not found");
    }

    if(req.user._id.toString() !== originalVideo.owner.toString()) {
        console.log("User ID:", req.user._id);
        console.log("Original Video Owner ID:", originalVideo.owner);
        throw new ApiError(403, "Unauthorized to make the change");
    }

    //Delete old thumbnail url from cloudinary
    const oldThumbnailUrl = originalVideo.thumbnailUrl;
    const newThumbnail = thumbnailLocalePath ? await uploadoncloudinary(thumbnailLocalePath) : null;
    if(!newThumbnail){
        throw new ApiError(500, "Thumbnail not found");
    }

    const updatedVideo = await Video.findByIdAndUpdate(videoID,
        {
            $set: {
                title: title,
                description: description,
                thumbnailUrl: newThumbnail.url // Update thumbnail URL
            }
        }
    )

    if (!updatedVideo) {
        throw new ApiError(500, "Failed to update video , please try again later");
    }

    await deleteafromcloudinary(oldThumbnailUrl); // Delete old thumbnail from Cloudinary
    return res.status(200).json(new Apiresponse(200, updatedVideo, "Video details updated successfully"));

})  

//delete video
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoID } = req.params; // Get video ID from request parameters

    if (!isValidObjectId(videoID)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoID);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (req.user._id.toString() !== video.owner.toString()) {
        throw new ApiError(403, "Unauthorized to make the change");
    }

    // Delete video file from Cloudinary
    await deleteafromcloudinary(video.videofile);

    // Delete thumbnail file from Cloudinary
    await deleteafromcloudinary(video.thumbnailUrl);

    // Delete video document from database
    await Video.findByIdAndDelete(videoID);

    return res.status(200).json(new Apiresponse(200, null, "Video deleted successfully"));
})


//toggle video publish status
const toggleVideoPublishStatus = asyncHandler(async (req, res) => {
    const { videoID } = req.params; // Get video ID from request parameters

    if (!isValidObjectId(videoID)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoID);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (req.user._id.toString() !== video.owner.toString()) {
        throw new ApiError(403, "Unauthorized to make the change");
    }

    // Toggle publish status
    video.ispublished = !video.ispublished;
    await video.save();

    return res.status(200).json(new Apiresponse(200, video, "Video publish status toggled successfully"));
})
