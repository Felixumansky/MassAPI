import { Router } from 'express';
import { supabase } from '../supabase.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    let query = supabase.from('foods').select('*').order('name');
    if (req.query.q) query = query.ilike('name', `%${req.query.q}%`);
    const { data, error } = await query.limit(200);
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
    const trimmedName = String(name).trim();
    const values = {
      name: trimmedName,
      calories_per_100,
      protein_per_100: protein_per_100 || 0,
      carbs_per_100: carbs_per_100 || 0,
      fat_per_100: fat_per_100 || 0,
      default_amount: default_amount || 100,
      unit: unit || 'גרם',
    };

    // מניעת כפילויות: אם כבר קיים מאכל באותו שם (ללא תלות באותיות גדולות/קטנות)
    // מעדכנים אותו בפרטים החדשים במקום ליצור רשומה כפולה.
    const { data: existing, error: lookupError } = await supabase
      .from('foods')
      .select('id')
      .ilike('name', trimmedName)
      .limit(1);
    if (lookupError) throw lookupError;

    if (existing && existing.length > 0) {
      const { data, error } = await supabase
        .from('foods')
        .update(values)
        .eq('id', existing[0].id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    const { data, error } = await supabase
      .from('foods')
      .insert(values)
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
