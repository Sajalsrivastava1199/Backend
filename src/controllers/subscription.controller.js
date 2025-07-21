import { User } from "../models/user.models";
import { Subscription } from "../models/subscription.models";
import Apiresponse from "../utils/Apiresponse.js";
import asyncHandler from "../utils/asynchandler.js";
import ApiError from "../utils/Apierror.js";
import { isValidObjectId } from "mongoose";

//toggle subscription status
const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelID} = req.body; // Get the channel ID from the request body
    const userId = req.user._id; // Get the user ID from the authenticated user
    if (!isValidObjectId(channelID)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const isSubscribed = await Subscription.findOne({
        subscriber: userId,
        channel: channelID
    });

    if( isSubscribed) {
        // If the user is already subscribed, unsubscribe them
        await Subscription.findOneAndDelete({
            subscriber: userId,
            channel: channelID
        });
        
        res.status(200)
        .json(new Apiresponse(200, "Unsubscribed successfully", {
            isSubscribed: false }))
    } 
    else {
        // If the user is not subscribed, subscribe them
        const newSubscription = await Subscription.create({
            subscriber: userId,
            channel: channelID
        });
        res.status(200)
        .json(new Apiresponse(200, "Subscribed successfully",newSubscription));

        }
    }
)