import mongoose from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const commentSchema = new mongoose.Schema({
    content: {
        type: String,// Content of the comment
        required: true, 
        trim: true 
    },
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video',
        required: true 
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
},{timestamps: true });

commentSchema.plugin(mongooseAggregatePaginate); // Add pagination plugin to the schema
export const Comment = mongoose.model('Comment', commentSchema);