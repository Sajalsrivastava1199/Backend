import asyncHandler from '../utils/asynchandler.js'; 
import ApiError from "../utils/Apierror.js"; // Import ApiError for error handling
import {User} from "../models/user.models.js"; // Import the User model
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
    
})

export {registerUser};  