import { redisClient , Worker} from "../db/redisndex.js";
import { notificationQueue } from "./notificationQueue.js";
import { sendEmail } from "./notificationEmail.js";
import dotenv from 'dotenv';
import { connect } from "mongoose";
dotenv.config();

const notificationWorker = new Worker('notificationQueue', async job => {
    const { title, message, recipient } = job.data; // Extract data from the job
    sendEmail(recipient ,"New Video Uploaded", message)
},{
    connnection:{url:`redis://default:${process.env.REDISDB_PASSWORD}@$exciting-sturgeon-35539.upstash.io.6379`}
})

async function sendNotificationEmail(type, message, recipient) {
    await notificationQueue.add(type, {
        title: type,
        message: message,
        recipient: recipient
    },{
        attempts:3,
        delay:5000,
    },{
        connection: {
            url: `redis://default:${process.env.REDISDB_PASSWORD}@$exciting-sturgeon-35539.upstash.io.6379`
        }
    });
}

export { sendNotificationEmail, notificationWorker };