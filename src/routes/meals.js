import { Router } from 'express';
import { supabase } from '../supabase.js';

const router = Router();
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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

router.post('/duplicate-day', async (req, res, next) => {
  try {
    const { source_date, target_date } = req.body;
    if (
      !DATE_PATTERN.test(source_date)
      || !DATE_PATTERN.test(target_date)
      || source_date === target_date
    ) {
      return res.status(400).json({ error: 'חובה לבחור שני תאריכים שונים' });
    }

    const [sourceRes, targetRes] = await Promise.all([
      supabase
        .from('meals')
        .select('meal_type, food_name, amount, unit, calories, protein, carbs, fat')
        .eq('date', source_date)
        .order('created_at'),
      supabase.from('meals').select('id').eq('date', target_date).limit(1),
    ]);
    if (sourceRes.error) throw sourceRes.error;
    if (targetRes.error) throw targetRes.error;
    if (sourceRes.data.length === 0) {
      return res.status(404).json({ error: 'לא נמצאו ארוחות ביום הקודם' });
    }
    if (targetRes.data.length > 0) {
      return res.status(409).json({ error: 'כבר קיימות ארוחות בתאריך היעד' });
    }

    const meals = sourceRes.data.map((meal) => ({ ...meal, date: target_date }));
    const { data, error } = await supabase.from('meals').insert(meals).select();
    if (error) throw error;
    res.status(201).json({ count: data.length, meals: data });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/duplicate', async (req, res, next) => {
  try {
    const { date } = req.body;
    if (!date) return res.status(400).json({ error: 'חובה לבחור תאריך יעד' });

    const { data: source, error: sourceError } = await supabase
      .from('meals')
      .select('meal_type, food_name, amount, unit, calories, protein, carbs, fat')
      .eq('id', req.params.id)
      .single();
    if (sourceError) throw sourceError;

    const { data, error } = await supabase
      .from('meals')
      .insert({ ...source, date })
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
