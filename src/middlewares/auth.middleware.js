import asyncHandler from "../utils/asynchandler.js";
import ApiError from "../utils/Apierror.js"; // Import ApiError for error handling
import jwt from "jsonwebtoken";
import {User} from "../models/user.models.js"; // Import the User model

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try{
        //request has cookies access from cookieparser in app.js
        const token = req.cookies?.accesstoken || req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }
        //after getting token,verify it is correct or not
        // userSchema.methods.generateAcessToken = function() {
        //     return jwt.sign(
        //         { 
        //             _id: this._id ,
        //             username: this.username, 
        //             email: this.email, 
        //             fullname: this.fullname
        //             // The above commented line is not needed as we are not using these fields in the token payload
        //         }, 
        //         process.env.ACCESS_TOKEN_SECRET, { expiresIn   : process.env.ACCESS_TOKEN_EXPIRY || '15m'    });
        // }

        //so above id,username,email,fullname details will be needed back and decoded using JWT,
        // so import jwt from 'jsonwebtoken'done;

        const decodedtoken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        //decoding user id fron the token
        const user = await User.findById(decodedtoken._id).select("-password -refreshToken")

        if (!user) {
            return res.status(401).json({ message: "Invalid Access Token" });
        }

        req.user = user; // Attach the user to the request object for further use
        next(); // Call the next middleware or route handler
    } catch (error) {
        throw new ApiError(401, error?.message || "Unauthorized: Invalid token");
    }

})