import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    request_id: {
      type: String,
      required: true,
      unique: true,
    },
    payload: {
      type: Object,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'complete', 'failed'],
      default: 'pending',
    },
    result: {
      type: Object,
      default: null,
    },
    vendor: {
      type: String,
      enum: ['sync', 'async'],
      required: true,
    }
  },
  { timestamps: true }
);

const Job = mongoose.model('Job', jobSchema);

export default Job;
