import mongoose from 'mongoose';
import redisClient from '../utiles/redisClient.js';
import Job from '../models/Job.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// ✅ Connect to MongoDB
await mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
console.log('✅ Worker connected to MongoDB');

// ✅ Initial log once
console.log('🚀 Worker started and waiting for Redis jobs...');

while (true) {
  try {
    // ✅ Wait for a new job using Redis Stream
    const response = await redisClient.xRead(
      {
        key: 'job-queue',
        id: '0',
      },
      {
        COUNT: 5,
        BLOCK: 5000,
      }
    );

    // 🔁 Just in case, but block:0 means this should rarely happen

    if (!response || !response.length || !response[0].messages.length) {
      console.log("⏳ No jobs yet...");
      continue;
    }

    const message = response[0].messages[0];
    const { request_id, vendor } = message.message;

    console.log(`📥 Picked job: ${request_id} (${vendor})`);

    // ✅ Update job status to "processing"
    await Job.updateOne({ request_id }, { status: 'processing' });

    // ✅ Simulate vendor call
    let result = {};

    if (vendor === 'sync') {
      const vendorRes = await axios.post('http://vendor-sync:6001/vendor-sync', {
        request_id,
      });
      result = vendorRes.data;
    } else {
      // ⏳ Async — wait for webhook to finish the job
      console.log(`⌛ Async job — waiting for webhook: ${request_id}`);

      // ✅ Important: delete from stream to avoid reprocessing
      await redisClient.xDel('job-queue', message.id);
      continue;
    }

    // ✅ Clean response data — remove PII and trim strings
    for (const key in result) {
      if (typeof result[key] === 'string') {
        result[key] = result[key].trim();
      }
    }

    // ✅ Save result to DB and update status
    await Job.updateOne(
      { request_id },
      { status: 'complete', result }
    );

    // ✅ Remove from Redis stream after processing
    await redisClient.xDel('job-queue', message.id);

    console.log(`✅ Job complete: ${request_id}`);
  } catch (err) {
    console.error('❌ Worker error:', err.message);
  }
}
