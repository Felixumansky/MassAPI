import { Router } from 'express';
import { supabase } from '../supabase.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'חסר פרמטר date' });
    const { data, error } = await supabase
      .from('water_logs')
      .select('*')
      .eq('date', date)
      .order('created_at');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { date, amount_ml } = req.body;
    if (!date || !amount_ml || amount_ml <= 0) {
      return res.status(400).json({ error: 'חובה תאריך וכמות מים חיובית' });
    }
    const { data, error } = await supabase
      .from('water_logs')
      .insert({ date, amount_ml })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { error } = await supabase.from('water_logs').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
