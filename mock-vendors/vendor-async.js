import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const PORT = 6002;

app.use(cors());
app.use(express.json());

// Vendor async endpoint
app.post('/vendor-async', async (req, res) => {
  const { request_id } = req.body;

  console.log(`📩 Async vendor received request: ${request_id}`);

  // Immediately respond (simulate async ack)
  res.status(202).json({ message: 'Accepted', request_id });

  // Simulate vendor processing delay
  setTimeout(async () => {
    const result = {
      request_id,
      name: '  Async Person ',
      email: 'async@example.com ',
      pii: 'Sensitive Info',
    };

    // Send result to your webhook
    try {
      await axios.post(`http://localhost:4000/vendor-webhook/async`, result);
      console.log(`✅ Sent webhook for: ${request_id}`);
    } catch (err) {
      console.error(`❌ Webhook failed for ${request_id}:`, err.message);
    }
  }, 3000); // simulate 3 sec delay
});

app.listen(PORT, () => {
  console.log(`🚀 Async Vendor running at http://localhost:${PORT}`);
});
