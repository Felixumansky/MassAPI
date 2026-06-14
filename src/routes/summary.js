import { Router } from 'express';
import { supabase } from '../supabase.js';

const router = Router();

// סיכום יומי מלא במכה אחת: פרופיל + ארוחות + מים + טוטאלים
router.get('/summary', async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'חסר פרמטר date' });

    const [profileRes, mealsRes, waterRes] = await Promise.all([
      supabase.from('profile').select('*').eq('id', 1).maybeSingle(),
      supabase.from('meals').select('*').eq('date', date).order('created_at'),
      supabase.from('water_logs').select('*').eq('date', date).order('created_at'),
    ]);
    if (profileRes.error) throw profileRes.error;
    if (mealsRes.error) throw mealsRes.error;
    if (waterRes.error) throw waterRes.error;

    const profile = profileRes.data ?? {
      id: 1, name: 'אלוף', calorie_target: 3000, protein_target: 160,
      carbs_target: 380, fat_target: 90, water_target_ml: 3000,
      current_weight: null, goal_weight: null,
    };

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

    res.json({ profile, meals, water, totals });
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

    const [mealsRes, waterRes] = await Promise.all([
      supabase.from('meals').select('date, calories, protein').gte('date', fromStr).order('date'),
      supabase.from('water_logs').select('date, amount_ml').gte('date', fromStr),
    ]);
    if (mealsRes.error) throw mealsRes.error;
    if (waterRes.error) throw waterRes.error;

    const byDate = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(from);
      d.setDate(from.getDate() + i);
      byDate[d.toLocaleDateString('en-CA')] = { calories: 0, protein: 0, water_ml: 0 };
    }
    for (const row of mealsRes.data) {
      if (byDate[row.date]) {
        byDate[row.date].calories += Number(row.calories);
        byDate[row.date].protein += Number(row.protein);
      }
    }
    for (const row of waterRes.data) {
      if (byDate[row.date]) byDate[row.date].water_ml += Number(row.amount_ml);
    }
    res.json(Object.entries(byDate).map(([date, v]) => ({ date, ...v })));
  } catch (err) {
    next(err);
  }
});

router.get('/insights', async (req, res, next) => {
  try {
    const days = Math.min(Math.max(Number(req.query.days) || 30, 7), 90);
    const end = req.query.end;
    if (!end) return res.status(400).json({ error: 'חסר פרמטר end' });

    const from = new Date(`${end}T12:00:00`);
    if (Number.isNaN(from.getTime())) return res.status(400).json({ error: 'תאריך סיום לא תקין' });
    from.setDate(from.getDate() - (days - 1));
    const fromStr = from.toLocaleDateString('en-CA');

    const [profileRes, mealsRes, waterRes, checkinsRes] = await Promise.all([
      supabase.from('profile').select('calorie_target, protein_target, water_target_ml').eq('id', 1).single(),
      supabase.from('meals').select('date, calories, protein').gte('date', fromStr).lte('date', end),
      supabase.from('water_logs').select('date, amount_ml').gte('date', fromStr).lte('date', end),
      supabase.from('daily_checkins').select('date, trained, sleep_hours, appetite').gte('date', fromStr).lte('date', end),
    ]);
    for (const result of [profileRes, mealsRes, waterRes, checkinsRes]) {
      if (result.error) throw result.error;
    }

    const dates = [];
    const daily = {};
    for (let i = 0; i < days; i++) {
      const date = new Date(`${fromStr}T12:00:00`);
      date.setDate(date.getDate() + i);
      const key = date.toLocaleDateString('en-CA');
      dates.push(key);
      daily[key] = { calories: 0, protein: 0, water_ml: 0 };
    }
    for (const meal of mealsRes.data) {
      daily[meal.date].calories += Number(meal.calories);
      daily[meal.date].protein += Number(meal.protein);
    }
    for (const water of waterRes.data) daily[water.date].water_ml += Number(water.amount_ml);

    const profile = profileRes.data;
    const loggedDays = dates.filter((date) => daily[date].calories > 0);
    const calorieGoalDays = dates.filter(
      (date) => daily[date].calories >= profile.calorie_target * 0.9
    ).length;
    const proteinGoalDays = dates.filter(
      (date) => daily[date].protein >= profile.protein_target * 0.9
    ).length;
    const waterGoalDays = dates.filter(
      (date) => daily[date].water_ml >= profile.water_target_ml
    ).length;

    let currentStreak = 0;
    for (let i = dates.length - 1; i >= 0; i--) {
      if (daily[dates[i]].calories <= 0) break;
      currentStreak++;
    }

    const sleepEntries = checkinsRes.data.filter((row) => row.sleep_hours != null);
    const appetiteEntries = checkinsRes.data.filter((row) => row.appetite != null);
    const average = (rows, key) =>
      rows.length ? Math.round((rows.reduce((sum, row) => sum + Number(row[key]), 0) / rows.length) * 10) / 10 : null;

    const trainedSet = new Set(checkinsRes.data.filter((row) => row.trained).map((row) => row.date));
    const trainingDates = dates.filter((date) => trainedSet.has(date));

    // חלוקת החלון לדליי 7 ימים (rolling מתחילת החלון) — מספר ימי אימון בכל שבוע
    const weeklyTraining = [];
    for (let i = 0; i < dates.length; i += 7) {
      const bucket = dates.slice(i, i + 7);
      weeklyTraining.push({
        start: bucket[0],
        count: bucket.filter((date) => trainedSet.has(date)).length,
      });
    }

    res.json({
      days,
      logged_days: loggedDays.length,
      current_streak: currentStreak,
      calorie_goal_days: calorieGoalDays,
      protein_goal_days: proteinGoalDays,
      water_goal_days: waterGoalDays,
      training_days: trainedSet.size,
      training_dates: trainingDates,
      weekly_training: weeklyTraining,
      average_sleep: average(sleepEntries, 'sleep_hours'),
      average_appetite: average(appetiteEntries, 'appetite'),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
