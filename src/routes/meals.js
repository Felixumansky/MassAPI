import { Router } from 'express';
import { supabase } from '../supabase.js';

const router = Router();
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

router.get('/', async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'חסר פרמטר date' });
    const { data, error } = await supabase
      .from('meals')
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
    const { date, meal_type, food_name, amount, unit, calories, protein, carbs, fat } = req.body;
    if (!date || !food_name || calories == null) {
      return res.status(400).json({ error: 'חובה תאריך, שם מאכל וקלוריות' });
    }
    if (!MEAL_TYPES.includes(meal_type)) {
      return res.status(400).json({ error: 'סוג ארוחה לא תקין' });
    }
    const { data, error } = await supabase
      .from('meals')
      .insert({
        date,
        meal_type,
        food_name,
        amount: amount || null,
        unit: unit || 'גרם',
        calories,
        protein: protein || 0,
        carbs: carbs || 0,
        fat: fat || 0,
      })
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
    const { error } = await supabase.from('meals').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
