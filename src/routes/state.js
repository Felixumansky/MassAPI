import { Router } from 'express';
import { supabase } from '../supabase.js';
import { requireAuth } from '../auth.js';

const router = Router();
router.use(requireAuth);

// מחזיר את ה-state המסונכרן של המשתמש (ריק אם עוד לא נשמר)
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('user_state')
      .select('state, updated_at')
      .eq('user_id', req.user.id)
      .maybeSingle();
    if (error) throw error;
    res.json({ state: data?.state ?? {}, updatedAt: data?.updated_at ?? null });
  } catch (err) {
    next(err);
  }
});

// שומר (upsert) את כל ה-state בבת אחת — last-write-wins
router.put('/', async (req, res, next) => {
  try {
    const state = req.body && typeof req.body === 'object' ? req.body : {};
    const updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('user_state')
      .upsert({ user_id: req.user.id, state, updated_at }, { onConflict: 'user_id' })
      .select('updated_at')
      .single();
    if (error) throw error;
    res.json({ ok: true, updatedAt: data.updated_at });
  } catch (err) {
    next(err);
  }
});

export default router;
