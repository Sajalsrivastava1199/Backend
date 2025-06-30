import asyncHandler from '../utils/asynchandler.js'; 


const registerUser = asyncHandler(async (req, res) =>{
    // Logic for registering a user
    res.status(200).json({
        message: 'Sajal bro lage raho'
    });
})

export {registerUser};