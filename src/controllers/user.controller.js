import asyncHandler from '../utils/asynchandler.js'; 
import ApiError from "../utils/Apierror.js"; // Import ApiError for error handling
import {User} from "../models/user.models.js"; // Import the User model
import uploadoncloudinary from '../utils/cloudinary.js';
import Apiresponse from '../utils/Apiresponse.js';
import jwt from 'jsonwebtoken'; // Importing jwt for token generation
import deleteafterupdateavatar from '../utils/Deletecloudinary.js'; // Importing delete function for avatar updates


const generateaccessandrefreshtoken = async(userid)=>{
    try {
    const user= await User.findById(userid);
    const accesstoken= user.generateAccessToken(); // Generate access token
    const refreshtoken= user.generateRefreshToken(); // Generate refresh token
    user.refreshToken = refreshtoken; // Store the refresh token in the user document
    await user.save(); // Save the user document with the new refresh token   
    return { accesstoken, refreshtoken }; // Return both tokens
    }catch (error) {
        console.error("Error generating access and refresh tokens:", error);
        throw new ApiError(500, "Failed to generate access and refresh tokens");
    }
}

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
    console.log("req body is",req.body)

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

    console.log(req.files); // Log the files received in the request

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

const loginuser = asyncHandler(async (req, res) => {
    // Logic for logging in a user
    //take username and password from req.body
    //check if user exists with that username or email
    //if user exists,check if password is correct
    //if password is correct,generate access token and refresh token
    //send cookies with tokens
    //if password is incorrect,throw error
    const { email,username, password } = req.body;//depends
    console.log("email:", email);

    if(!(email || username)) {
        throw new ApiError(400, "Email or username are required for login");
    }
    //database in diff continent so await will be used
    const user = await User.findOne({
        $or: [username ? { username: username.toLowerCase() } : null,email ? { email } : null
        ].filter(Boolean) // removes `null` entries from the query
    });
    
    if(!user){
        throw new ApiError(404, "User not found with this username or email");
    }

    //check if password is correct
    const isPasswordMatch = await user.isPasswordMatch(password);
    if(!isPasswordMatch) {
        throw new ApiError(401, "Incorrect password");
    }

    //generate access token and refresh token
    const { accesstoken, refreshtoken } = await generateaccessandrefreshtoken(user._id);

    //send cookies with tokens
    //till here user ke ander refresh token empty hai kyunki 
    // jo refrence hai vo upr vale user ka refrence jis smaay tokens generate ni hua tha,
    // so we will need uypdated reference of user and remove passwords and refresh token from response
    const loggedinuser = await User.findById(user._id).select("-password -refreshToken");

    //Now sending cookies with tokens,some options are set for security
    const options = {
        httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
        secure: true,//by default anyone can modify at frontend,
        // so setting secure to true and httponly makes it that it is modifiable at backend only
    };

    return res
        .status(200)
        .cookie("accesstoken", accesstoken, options) // Set access token cookie
        .cookie("refreshtoken", refreshtoken, options) // Set refresh token cookie
        .json(new Apiresponse(200, loggedinuser, "User logged in successfully")); // Return response with user data 

});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, 
        {
            $set: { refreshToken: undefined } // Clear the refresh token
        }, // Clear the refresh token
        {
            new: true // Return the updated user document
        }
        
    )  
    
    const options = {
    httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
    secure: true,//by default anyone can modify at frontend,
    // so setting secure to true and httponly makes it that it is modifiable at backend only
    }         
    return res
        .status(200)
        .clearCookie("accesstoken", options) // Clear access token cookie
        .clearCookie("refreshtoken", options) // Clear refresh token cookie
        .json(new Apiresponse(200, null, "User logged out successfully")); // Return response with success message
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingrefreshtoken = req.cookies.refreshtoken || req.body.refreshtoken 
    if(!incomingrefreshtoken) {
        throw new ApiError(401, "Unauthorizesd request:Refresh token is required for refreshing access token");
    }
    // Verify the refresh token
    const decodedtoken=jwt.verify(incomingrefreshtoken, process.env.REFRESH_TOKEN_SECRET)

    // Find the user associated with the refresh token
    const user = await User.findById(decodedtoken?._id);
    if(!user) {
        throw new ApiError(404, "User not found with this refresh token");
    }

    // Check if the refresh token matches the one stored in the user document
    if(user?.refreshToken !== incomingrefreshtoken) {
        throw new ApiError(401, "Invalid refresh token,it is expired or used");
    }

    //it has ot be sent in cookies so options are set
    const options = {
        httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
        secure: true, // Ensures the cookie is sent over HTTPS only 
    }

    //generating new access token and refresh token
    const { accesstoken, newRefreshtoken } = await generateaccessandrefreshtoken(user._id);

    return res
    .status(200)
    .cookie("accesstoken", accesstoken, options) // Set new access token cookie
    .cookie("refreshtoken",newRefreshtoken, options) // Set new refresh token cookie
    .json(
        new Apiresponse(
            200,
            {
                accesstoken, // Return the new access token
                refreshtoken: newRefreshtoken // Return the new refresh token
            }, 
            "Access token refreshed successfully") // Return response with success message
    )

})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    //user has to be finded,tbhi toh field mn jake password verify ho pyga,if user is able to change password then
    //he is already logged in,agr auth.middleware chla h toh cnfrm req.user=user hai and vhns eid mil jygi

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordMatch(oldPassword);
    if(!isPasswordCorrect) {
        throw new ApiError(401, "Incorrect old password");
    }
        
    //so now old password is correct,so we can change password
    user.password = newPassword; // Set the new password
    await user.save({validateBeforeSave:false}); // Save the updated user document

    return res.status(200).json(
        new Apiresponse(200, null, "Password changed successfully") // Return response with success message
    ); 
       
}) 

//Suppose hamein current user lena hai,we need to get current user details,so if user is logged in we can get that
const getCurrentUser = asyncHandler(async (req, res) => {
    //req.user is set by auth middleware
    if(!req.user) {
        throw new ApiError(401, "Unauthorized request: User not logged in");
    }
    // Exclude password and refreshToken from the response
    const currentUser = await User.findById(req.user._id).select("-password -refreshToken");
    
    if(!currentUser) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
        new Apiresponse(200, currentUser, "Current user details retrieved successfully") // Return response with user details
    );
})

//Updating details
const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullname,email}= req.body;

    if(!fullname || !email) {
        throw new ApiError(400, "Full name and email are required to update account details");
    }

    // Find the user by ID and update the account details
    const user = await User.findByIdAndUpdate(
        req.user._id, // Use the user ID from the request object
        {
            $set: { 
                fullname,//either this
                email:email//or this
            }
        }, // Update the fullname and email fields
        { new: true} // Return the updated document and run validators
    )
    //removing password
    const updateduserdetails = await User.findById(req.user?._id).select("-password"); 

    return res.status(200).json(
        new Apiresponse(200, updateduserdetails, "Account details updated successfully") // Return response with updated user details
    );

})

//Updating files,2 middlewares would be used,multer and person who is logged in can only update
const updateAvatar = asyncHandler(async (req, res) => {
    const avatarlocalpath = req.file?.path // Get the uploaded file path from the request

    if(!avatarlocalpath) {
        throw new ApiError(400, "Avatar image is required for update");
    }
    // Upload the avatar image to Cloudinary
    const avatar = await uploadoncloudinary(avatarlocalpath);
    if(!avatar.url) {
        throw new ApiError(400, "Failed to upload avatar image");
    }


    //Todo:delete old image from Cloudinary
    // If you want to delete the old avatar image from Cloudinary, you can do so here
    // For example, you can store the public ID of the old image in the user model
    const existingUser = await User.findById(req.user._id);
    if (existingUser?.avatar) {
        await deleteAfterUpdateAvatar(existingUser.avatar);
    }



    // Update the user's avatar in the database
    const user = await User.findByIdAndUpdate(
        req.user._id, // Use the user ID from the request object
        {
            $set: { avatar: avatar.url } // Update the avatar field with the Cloudinary URL
        },
        { new: true } // Return the updated document    
    ).select("-password "); // Exclude password from the response

    return res.status(200).json(
        new Apiresponse(200, user, "Avatar updated successfully") // Return response with updated user details
    );
    
})
//Similarly to done for updating cover image


const getUserChannelProfile = asyncHandler(async (req, res) => {
    //when we goto any channel we use its url so we will use params
    const {username} = req.params// Get the username from the request parameters

    if(!username?.trim()) {
        throw new ApiError(400, "Username is required to get user channel profile");
    }
    // Find the user by username
    //const user = await User.find({ username})
    //if done by above we will fetch one document and do aggregation
    //Directly aggregation can also be done ,pipeline are written like User.aggregate([],[],[]) 
    // and returns array of objects
    const channel = await User.aggregate([
        {
            $match: { username: username?.toLowerCase() } // Match the user by username
        },//now lookup to be done on that one documenet(supposing it CAC)
        // Lookup to get the channel details,we will get its subscribers
        {
            $lookup:{
                from:"subscriptions", // Collection to join with
                localfield:"_id", // Field from the User collection
                foreignField:"channel", // Field from the Subscription collection,to get subscribers count
                as:"subscribers" // Name of the field to add in the output document
            }
        },
        //Lookup to get the subscriberdetails,we will get its channel details(how many channel have user subscribed)
        {
            $lookup: {
                from: "subscriptions", // Collection to join with
                localField: "_id", // Field from the User collection
                foreignField: "subscriber", // Field from the Subscription collection,to get channels subscribed by user
                as: "subscribedtoChannels" // Name of the field to add in the output document
            }
        },//More additional fields are needed to be added,here subscribers and subscribedtocount is added
        {
            $addFields: {
                subscribersCount: { $size: "$subscribers" }, // Count of subscribers
                subscribedToChannelsCount: { $size: "$subscribedtoChannels" }, // Count of channels subscribed by user
                isSubscribed:{
                    $cond:{
                        if: {
                            $in: [req.user?._id, "$subscribers.subscriber"] // Check if the user is subscribed to this channel
                        },
                        then: true, // User is subscribed
                        else: false // User is not subscribed
                    }
                }
            }
        },
        {
            $project: {
                password: 0, // Exclude password from the output
                refreshToken: 0, // Exclude refresh token from the output
                __v: 0 // Exclude version key from the output
            }
        }

    ])

    //if channel is not found
    if(!channel || channel.length === 0) {
        throw new ApiError(404, "Channel not found with this username");
    }

    // Return the channel profile with subscribers and subscription details
    return res.status(200).json(
        new Apiresponse(200, channel[0], "User channel profile retrieved successfully") // Return response with channel profile
    );


})

const getwatchinghistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id:new mongoose.Types.ObjectID(req.user._id) // Match the user by ID
            }
        },
        {
            $lookup:{
                from:"videos", // Collection to join with
                localField:"watchHistory", // Field from the User collection
                foreignField:"_id", // Field from the Video collection
                as:"watchHistoryVideos", // Name of the field to add in the output document
                pipeline: [
                    {
                        $lookup: {
                            from: "users", // Collection to join with for user details
                            localField: "owner", // Field from the Video collection
                            foreignField: "_id", // Field from the User collection
                            as: "ownerDetails", // Name of the field to add in the output document
                            pipeline: [
                                {
                                    $project:{
                                        fullname:1, // Include only the fullname field from the owner details
                                        username:1, // Include only the username field from the owner details
                                        avatar:1 // Include only the avatar field from the owner details
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        } 
    ])

    if(!user || user.length === 0) {
        throw new ApiError(404, "User not found or no watch history available");
    }

    // Return the user's watch history with video details
    return res
    .status(200)
    .json(
        new Apiresponse(200, user[0].watchHistoryVideos, "User watch history retrieved successfully") // Return response with watch history videos
    );

})

export {
    registerUser,
    loginuser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    changeCurrentPassword,
    generateaccessandrefreshtoken,
    updateAccountDetails,
    updateAvatar,
    getUserChannelProfile,
    getwatchinghistory
};  