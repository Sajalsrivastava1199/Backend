import {Queue} from 'bullmq';
import dotenv from 'dotenv';
dotenv.config();

//create a new queue and scheduler instance for notifications
const notificationQueue = new Queue('notificationQueue', {
    connection:{
        url:`redis://default:${process.env.REDISDB_PASSWORD}@$exciting-sturgeon-35539.upstash.io.6379`,
    }
});

export {notificationQueue}