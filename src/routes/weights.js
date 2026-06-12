import { Router } from 'express';
import { supabase } from '../supabase.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 90, 365);
    const { data, error } = await supabase
      .from('weight_logs')
      .select('*')
      .order('date', { ascending: true })
      .limit(limit);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// upsert לפי תאריך - שקילה חדשה באותו יום מחליפה את הקודמת
router.post('/', async (req, res, next) => {
  try {
    const { date, weight } = req.body;
    if (!date || !weight || weight <= 0) {
      return res.status(400).json({ error: 'חובה תאריך ומשקל חיובי' });
    }
    const { data, error } = await supabase
      .from('weight_logs')
      .upsert({ date, weight }, { onConflict: 'date' })
      .select()
      .single();
    if (error) throw error;
    // עדכון משקל נוכחי בפרופיל
    await supabase.from('profile').update({ current_weight: weight }).eq('id', 1);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
