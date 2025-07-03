import redisClient from '../utiles/redisClient.js';

const response = await redisClient.xRange('job-queue', '-', '+');
console.log("📦 Redis job-queue contents:\n", response);
process.exit();
