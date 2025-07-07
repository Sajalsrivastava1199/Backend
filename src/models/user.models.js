import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';  

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            unique: true,
           // index: true // This will create an index on the name field
        },
        email: {
            type: String,
            required: true,
           // unique: true,
            trim: true,
            lowercase: true
        },
        fullname: {
            type: String,
            required: true,
            trim: true,
           // index: true // This will create an index on the fullname field
        },
        avatar: {
            type: String,//cloudinary url:3rd party service to store images
            required: true,
        },
        coverimage: {
            type: String,//cloudinary url:3rd party service to store images
        },
        watchhistory: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Video' // Reference to the Video model
        }],
        password: {
            type: String,
            required: [true,'Password is required'],
        }, 
        refreshToken: {
            type: String
        },
    },{timestamps: true});


userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next(); // Only hash the password if it has been modified
    this.password = await bcrypt.hash(this.password, 10); // Hash the password before saving
    next();
}); 

userSchema.methods.isPasswordMatch = async function(password) {
    return await bcrypt.compare(password, this.password); // Compare the entered password with the hashed password
};


userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        { 
            _id: this._id ,
            username: this.username, 
            email: this.email, 
            fullname: this.fullname
            // The above commented line is not needed as we are not using these fields in the token payload
        }, 
        process.env.ACCESS_TOKEN_SECRET, { expiresIn   : process.env.ACCESS_TOKEN_EXPIRY || '15m'    });
}

userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        {
             _id: this._id 
        },
        process.env.REFRESH_TOKEN_SECRET, { expiresIn   : process.env.REFRESH_TOKEN_EXPIRY || '7d'    });
}

export const User = mongoose.model('User', userSchema); 