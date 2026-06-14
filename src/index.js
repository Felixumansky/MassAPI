import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { requireDb, isConfigured } from './supabase.js';
import profileRouter from './routes/profile.js';
import foodsRouter from './routes/foods.js';
import mealsRouter from './routes/meals.js';
import waterRouter from './routes/water.js';
import weightsRouter from './routes/weights.js';
import summaryRouter from './routes/summary.js';
import checkinsRouter from './routes/checkins.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true, db: isConfigured ? 'connected' : 'not-configured' });
});

app.use('/api', requireDb);
app.use('/api/profile', profileRouter);
app.use('/api/foods', foodsRouter);
app.use('/api/meals', mealsRouter);
app.use('/api/water', waterRouter);
app.use('/api/weights', weightsRouter);
app.use('/api/checkins', checkinsRouter);
app.use('/api', summaryRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'שגיאת שרת' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`MassAPI running on http://localhost:${port}`);
  if (!isConfigured) {
    console.warn('⚠ Supabase לא מוגדר — צור .env לפי .env.example');
  }
});
