import express from 'express';
import mongoose, { model } from 'mongoose';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import Job from '../models/Job.js'; 
import redisClient from '../utiles/redisClient.js'; 


dotenv.config();
const app = express();
app.use(express.json());

// ✅ GET /jobs/:request_id
app.get('/jobs/:request_id', async (req, res) => {
  const { request_id } = req.params;

  try {
    const job = await Job.findOne({ request_id });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status === 'complete') {
      return res.json({
        status: 'complete',
        result: job.result,
      });
    }

    return res.json({ status: job.status });
  } catch (err) {
    console.error('Error in GET /jobs/:request_id:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// ✅ POST /jobs
app.post('/jobs', async (req, res) => {
  try {
    const payload = req.body;
    console.log("📥 Incoming job request");

    const request_id = uuidv4();

    // Choose vendor: for now just alternate randomly
    const vendor = Math.random() > 0.5 ? 'sync' : 'async';

    const job = new Job({
      request_id,
      payload,
      vendor,
    });
    // console.log("✅ Job saved to MongoDB");
      try {
        await job.save();
        console.log("✅ Job saved to MongoDB");
      } catch (err) {
        console.error("❌ Error saving job:", err.message);
      }
      
      await redisClient.xAdd('job-queue', '*', {
      request_id,
      vendor,
    });

    res.status(202).json({ request_id });
  } catch (err) {
    console.error('Error in /jobs:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ✅ POST /vendor-webhook/:vendor
app.post('/vendor-webhook/:vendor', async (req, res) => {
  try {
    const { request_id, ...result } = req.body;

    // Clean result (remove PII, trim)
    for (const key in result) {
      if (typeof result[key] === 'string') {
        result[key] = result[key].trim();
      }
    }

    delete result.pii;

    // Update job in MongoDB
    await Job.updateOne(
      { request_id },
      { status: 'complete', result }
    );

    console.log(`✅ Webhook processed for: ${request_id}`);

    res.status(200).json({ message: 'Result saved' });
  } catch (err) {
    console.error('❌ Webhook error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


const PORT = process.env.PORT || 4000;

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
  })
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => console.error('Mongo error:', err));
