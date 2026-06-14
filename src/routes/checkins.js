import { Router } from 'express';
import { supabase } from '../supabase.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'חסר פרמטר date' });

    const { data, error } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('date', date)
      .maybeSingle();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

const VALID_MUSCLES = new Set([
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'core',
]);

router.put('/', async (req, res, next) => {
  try {
    const { date, trained = false, sleep_hours, appetite, note, muscles } = req.body;
    if (!date) return res.status(400).json({ error: 'חובה לבחור תאריך' });
    if (sleep_hours != null && (Number(sleep_hours) < 0 || Number(sleep_hours) > 24)) {
      return res.status(400).json({ error: 'שעות שינה חייבות להיות בין 0 ל-24' });
    }
    if (appetite != null && (!Number.isInteger(Number(appetite)) || Number(appetite) < 1 || Number(appetite) > 5)) {
      return res.status(400).json({ error: 'תיאבון חייב להיות בין 1 ל-5' });
    }
    if (note && note.length > 500) return res.status(400).json({ error: 'הערה ארוכה מדי' });
    if (muscles != null && (!Array.isArray(muscles) || muscles.some((m) => !VALID_MUSCLES.has(m)))) {
      return res.status(400).json({ error: 'קבוצות שרירים לא תקינות' });
    }

    const payload = {
      date,
      trained: Boolean(trained),
      sleep_hours: sleep_hours === '' || sleep_hours == null ? null : Number(sleep_hours),
      appetite: appetite == null ? null : Number(appetite),
      note: note?.trim() || null,
      muscles: trained ? (muscles ?? []) : [],
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('daily_checkins')
      .upsert(payload, { onConflict: 'date' })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
