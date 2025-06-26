import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"; 

const videoSchema = new mongoose.Schema(
    {
        videofile:{
            type: String, // URL of the video file
            required: true
        },
        title: {
            type: String,
            required: true,
            // trim: true,
            // lowercase: true,
            // index: true // This will create an index on the title field
        },
        description: {
            type: String,
            required: true,
            // trim: true
        },
        videoUrl: {
            type: String, // URL of the video file
            required: true
        },
        thumbnailUrl: {
            type: String, // URL of the thumbnail image
            required: true
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Reference to the User model
            required: true // Owner is required for each video  
        },
        viewsCount: {
            type: Number,
            default: 0
        },
        ispublished: {
            type: Boolean,
            default: false // Video is not published by default
        },  
        likesCount: {
            type: Number,
            default: 0
        },
        duration: {
            type: Number,
            required: true // Duration in seconds
        },
        commentsCount: {
            type: Number,
            default: 0
        }
    },{timestamps: true});

videoSchema.plugin(mongooseAggregatePaginate); // Add pagination plugin to the schema   
export const Video = mongoose.model('Video', videoSchema);