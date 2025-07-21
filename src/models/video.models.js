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
        },
        description: {
            type: String,
            required: true,
            // trim: true
        },
        duration: {
            type: Number, // URL of the video file
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
            default: 0,
            required:true
        },
        ispublished: {
            type: Boolean,
            default: false // Video is not published by default
        }
    },{timestamps: true});

videoSchema.plugin(mongooseAggregatePaginate); // Add pagination plugin to the schema   
export const Video = mongoose.model('Video', videoSchema);