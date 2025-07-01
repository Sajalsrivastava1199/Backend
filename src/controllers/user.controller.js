import asyncHandler from '../utils/asynchandler.js'; 
import ApiError from "../utils/Apierror.js"; // Import ApiError for error handling
import {User} from "../models/user.models.js"; // Import the User model
import uploadoncloudinary from '../utils/cloudinary.js';
import Apiresponse from '../utils/Apiresponse.js';

const registerUser = asyncHandler(async (req, res) =>{
    // Logic for registering a user
    // res.status(200).json({
    //     message: 'Sajal bro lage raho'
    // });
    //get user details from frontend so we dont have frontend,so we can take that using postman
    //all validations will be done like they are not empty and others
    //checking if user already exists:email and username(both or anyone)
    //checking for images,checking for avatar
    //uploading them to cloudinary,avatar mainly
    //create user object - create entry in db
    //remove password and refresh token from response
    //check for user creation success or failure
    //return response

    const { username, email, fullname, password } = req.body;
    console.log("email:", email);

    // if(fullname===""){//doing this one by one for simplicity
    //     throw new ApiError(400, "Full name is required");
    // }
    if([username, email, fullname, password].some(field => !field)) {
        throw new ApiError(400, "All fields are required");
    }
    if(!email.includes("@")) {
        throw new ApiError(400, "Email shouls have @ symbol");
    }
    const existing_user= await User.findOne({
        $or: [{ username }, { email }] // Check if either username or email already exists
    })
    if(existing_user) {
        throw new ApiError(409, "Username or email already exists");
    }

    const avatarlocalpath = req.files?.avatar?.[0]?.path; // Get the avatar image path from the request
    const coverimagelocalpath = req.files?.coverimage?.[0]?.path; // Get the cover image path from the request
    if(!avatarlocalpath) {
        throw new ApiError(400, "Avatar image is required");
    }
    //further uploading to cloudinary
    const avatar = await uploadoncloudinary(avatarlocalpath);
    const coverimage = coverimagelocalpath ? await uploadoncloudinary(coverimagelocalpath) : null; // Upload cover image if provided
    if(!avatar) {
        throw new ApiError(400, "Failed to upload avatar image");
    }

    const user = await User.create({
        username:username.toLowerCase(), // Store username in lowercase
        email,
        fullname,
        avatar: avatar.url, // Store the Cloudinary URL for the avatar
        coverimage: coverimage ? coverimage.url : null, // Store the Cloudinary URL for the cover image if provided
        password // Password will be hashed in the User model pre-save hook
    })

    //checking for user creation,for every entry done in db ek _id naam ki field add kr dega
    const usercreated = await User.findById(user._id).select("-password -refreshToken"); 
    // Exclude password and refreshToken from the response,to unselect above method is used

    if(!usercreated) {
        throw new ApiError(500, "User creation failed while registering user");
    }
    //we wish that response is send in proper format so utils was also created for that
    //return res.status(201).json({usercreated, message: "User registered successfully"}); this way using apiresponseclass
    return res.status(201).json(
        new Apiresponse(201, usercreated, "User registered successfully")   
    )

})

export {registerUser};  