import mongoose from 'mongoose';
import {DB_NAME} from '../constants.js';

const connectDB = async () => {
    try {
        const connectinst=await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
        console.log('MongoDB connected successfully:', connectinst.connection.host);     
        // connectinst → the whole connection object.
        // .connection → an object inside that gives connection-specific info.
        // .host → tells you which host (server) you're connected to.   
    } catch (error) {
        console.error('MongoDB connection failed:', error);
        process.exit(1); // Exit the process with failure
    }
}

export default connectDB;