import { createClient } from 'redis';
import pkg from 'bullmq';
const { Queue, Worker, QueueScheduler } = pkg;
let redisClient;

const connectRedisDB = async () => {
    try{
        redisClient = createClient({
            url: `rediss://default:${process.env.REDIS_PASSWORD}@exciting-sturgeon-35539.upstash.io:6379`,
        });
        redisClient.on('error', (err) => {
            console.error('Redis connection error:', err);
        });
        await redisClient.connect();
    } catch (error) {
        console.error('Failed to connect to Redis:', error);
    }
}

export {connectRedisDB, redisClient, Queue, Worker, QueueScheduler};    