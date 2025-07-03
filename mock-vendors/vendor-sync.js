import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 6001;

app.use(cors());
app.use(express.json());

app.post('/vendor-sync', (req, res) => {
  const { request_id } = req.body;

  // Sample response (vendor data)
  const result = {
    request_id,
    name: '  John Doe  ',
    email: 'john@example.com ',
    phone: '1234567890',
    pii: 'Sensitive Data',
  };

  console.log(`✅ Sync vendor processed: ${request_id}`);

  res.json(result); // Immediate response
});

app.listen(PORT, () => {
  console.log(`🚀 Sync Vendor running at http://localhost:${PORT}`);
});
