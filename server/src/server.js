import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { connectDb } from './config/db.js';
import { seedAdminIfNeeded, seedSampleData } from './config/seed.js';
import router from './routes/index.js';

dotenv.config();
const app = express();

app.use(cors());
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
    await seedSampleData();
    app.listen(PORT, () => {
      console.log(`API listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server', err);
    process.exit(1);
  });
