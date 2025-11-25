import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { connectDb } from './config/db.js';
import { seedAdminIfNeeded, seedSampleData } from './config/seed.js';
import router from './routes/index.js';

dotenv.config();
const app = express();

// Configure CORS to allow Vercel frontend
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://secure-exam-theta.vercel.app'
  ],
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'secure-exam-api' });
});

app.use('/api', router);

const PORT = process.env.PORT || 4000;

connectDb()
  .then(async () => {
    await seedAdminIfNeeded();
    
    // Only seed sample data if explicitly enabled via environment variable
    if (process.env.SEED_SAMPLE_DATA === 'true') {
      await seedSampleData();
    } else {
      const existingExams = await (await import('./models/Exam.js')).Exam.countDocuments();
      if (existingExams === 0) {
        console.log('No exams found in database. Set SEED_SAMPLE_DATA=true to add sample exams.');
      }
    }
    
    app.listen(PORT, () => {
      console.log(`API listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server', err);
    process.exit(1);
  });
