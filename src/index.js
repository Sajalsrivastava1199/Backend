//require("dotenv").config({path: ".env"});
//above line or using import dotenv from dotenv



import dotenv from "dotenv";
/*import mongooose from "mongoose"
import DB_NAME from "./constants"; id db connection code have been written here then we would have needed it here*/
import express from "express";
const app = express();//app is your backend server.
import connectDB from "./db/index.js"; // Import the connectDB function from db/index.js



dotenv.config({
     path: ".env" 
}); // Load environment variables from .env file

connectDB()// Call the function to connect to MongoDB
.then(() => {
    app.on('error', (error) => {
            console.error("Error in Express server:", error);
            throw error; // Exit the process with failure
        });
    app.listen(process.env.PORT||8000,()=>{
        console.log(`Server is running on port ${process.env.PORT||8000}`); 
    })
})
.catch((error) => {
    console.error("MongoDB connection failed:", error);
});









/*
//Better approach to connect to MongoDB IIFE or normal function also can be used
;(async()=>{
    try {
        await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`, {
        });
        app.on('error', (error) => {
            console.error("Error in Express server:", error);
            throw error; // Exit the process with failure
        });
        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        });
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        throw error // Exit the process with failure
    }
})()*/