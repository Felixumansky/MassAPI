import { Router } from 'express';
import { supabase } from '../supabase.js';

const router = Router();

// סיכום יומי מלא במכה אחת: פרופיל + ארוחות + מים + טוטאלים
router.get('/summary', async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'חסר פרמטר date' });

    const [profileRes, mealsRes, waterRes] = await Promise.all([
      supabase.from('profile').select('*').eq('id', 1).single(),
      supabase.from('meals').select('*').eq('date', date).order('created_at'),
      supabase.from('water_logs').select('*').eq('date', date).order('created_at'),
    ]);
    if (profileRes.error) throw profileRes.error;
    if (mealsRes.error) throw mealsRes.error;
    if (waterRes.error) throw waterRes.error;

    const meals = mealsRes.data;
    const water = waterRes.data;
    const totals = meals.reduce(
      (acc, m) => ({
        calories: acc.calories + Number(m.calories),
        protein: acc.protein + Number(m.protein),
        carbs: acc.carbs + Number(m.carbs),
        fat: acc.fat + Number(m.fat),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    totals.water_ml = water.reduce((acc, w) => acc + w.amount_ml, 0);

    res.json({ profile: profileRes.data, meals, water, totals });
  } catch (err) {
    next(err);
  }
});

// היסטוריית קלוריות יומית לגרף
router.get('/history', async (req, res, next) => {
  try {
    const days = Math.min(Number(req.query.days) || 7, 90);
    const from = new Date();
    from.setDate(from.getDate() - (days - 1));
    const fromStr = from.toLocaleDateString('en-CA');

    const { data, error } = await supabase
      .from('meals')
      .select('date, calories, protein')
      .gte('date', fromStr)
      .order('date');
    if (error) throw error;

    const byDate = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(from);
      d.setDate(from.getDate() + i);
      byDate[d.toLocaleDateString('en-CA')] = { calories: 0, protein: 0 };
    }
    for (const row of data) {
      if (byDate[row.date]) {
        byDate[row.date].calories += Number(row.calories);
        byDate[row.date].protein += Number(row.protein);
      }
    }
    res.json(Object.entries(byDate).map(([date, v]) => ({ date, ...v })));
  } catch (err) {
    next(err);
  }
});

export default router;
