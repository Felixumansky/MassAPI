import { Router } from 'express';
import { supabase } from '../supabase.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    let query = supabase.from('foods').select('*').order('name');
    if (req.query.q) query = query.ilike('name', `%${req.query.q}%`);
    const { data, error } = await query.limit(50);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, calories_per_100, protein_per_100, carbs_per_100, fat_per_100, default_amount, unit } = req.body;
    if (!name || calories_per_100 == null) {
      return res.status(400).json({ error: 'חובה שם וקלוריות ל-100 גרם' });
    }
    const { data, error } = await supabase
      .from('foods')
      .insert({
        name,
        calories_per_100,
        protein_per_100: protein_per_100 || 0,
        carbs_per_100: carbs_per_100 || 0,
        fat_per_100: fat_per_100 || 0,
        default_amount: default_amount || 100,
        unit: unit || 'גרם',
      })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
