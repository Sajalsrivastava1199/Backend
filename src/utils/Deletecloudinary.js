import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';

cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Click 'View API Keys' above to copy your cloud name
        api_key: process.env.CLOUDINARY_API_KEY, // Click 'View API Keys' above to copy your API key
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
    });


const deletefromcloudinary = async (url) => {
    if (!url) return null;

    // Extract public_id from URL: last segment without extension
    const parts = url.split('/');
    const lastPart = parts.pop();                     // e.g. "abc123.jpg"
    const publicId = lastPart.split('.').slice(0, -1).join('.'); // "abc123"

    try {
        const response = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'image',  // ensure correct type
        invalidate: true         // clear CDN cache :contentReference[oaicite:3]{index=3}
        });
        console.log('Deleted old avatar:', response);
        return response;
    } catch (error) {
        console.error('Deletion failed:', error);
        return null;
    }
}

export default deletefromcloudinary;