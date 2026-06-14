import { Router } from 'express';
import { supabase } from '../supabase.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    let { data, error } = await supabase.from('profile').select('*').eq('id', 1).maybeSingle();
    if (error) throw error;
    res.json(data ?? {
      id: 1, name: 'אלוף', calorie_target: 3000, protein_target: 160,
      carbs_target: 380, fat_target: 90, water_target_ml: 3000,
      current_weight: null, goal_weight: null,
    });
  } catch (err) {
    next(err);
  }
});

router.put('/', async (req, res, next) => {
  try {
    const allowed = [
      'name',
      'current_weight',
      'goal_weight',
      'calorie_target',
      'protein_target',
      'carbs_target',
      'fat_target',
      'water_target_ml',
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    updates.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('profile')
      .update(updates)
      .eq('id', 1)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
