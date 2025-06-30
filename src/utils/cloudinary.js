import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';

cloudinary.config({ 
        cloud_name: 'process.env.CLOUDINARY_CLOUD_NAME', // Click 'View API Keys' above to copy your cloud name
        api_key: 'process.env.CLOUDINARY_API_KEY', // Click 'View API Keys' above to copy your API key
        api_secret: 'process.env.CLOUDINARY_SECRET' // Click 'View API Keys' above to copy your API secret
    });



const uploadoncloudinary = async (filePath) => {
    try {
        if(!filePath) {
            throw new Error('File path is required for upload');
        }   
        const result = await cloudinary.uploader.upload(filePath, {
            folder: 'your_folder_name', // Optional: specify a folder in Cloudinary
            resource_type: 'auto' // Automatically detect the resource type (image, video, etc.)
        });
        //file has been uploaded successfully
        console.log('File uploaded successfully:', result.url); 
        return result; // Return the result of the upload
    } catch (error) {
        fs.unlinkSync(filePath); // Delete the file from local storage after upload as upload failed
        console.error('Error uploading file to Cloudinary:', error);
        return null; // Return the result of the upload
    }
}   

export default uploadoncloudinary;  