import { Router } from 'express';
import { supabase } from '../supabase.js';
import { hashPassword, verifyPassword, signToken } from '../auth.js';

const router = Router();

function readCreds(body) {
  const email = String(body?.email || '').trim().toLowerCase();
  const password = String(body?.password || '');
  if (!email || !email.includes('@')) return { error: 'אימייל לא תקין' };
  if (password.length < 6) return { error: 'הסיסמה חייבת להכיל לפחות 6 תווים' };
  return { email, password };
}

router.post('/register', async (req, res, next) => {
  try {
    const creds = readCreds(req.body);
    if (creds.error) return res.status(400).json({ error: creds.error });

    const password_hash = await hashPassword(creds.password);
    const { data, error } = await supabase
      .from('users')
      .insert({ email: creds.email, password_hash })
      .select('id, email')
      .single();
    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'אימייל זה כבר רשום' });
      throw error;
    }
    res.status(201).json({ token: signToken(data), user: { id: data.id, email: data.email } });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const creds = readCreds(req.body);
    if (creds.error) return res.status(400).json({ error: creds.error });

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password_hash')
      .eq('email', creds.email)
      .maybeSingle();
    if (error) throw error;
    if (!user || !(await verifyPassword(creds.password, user.password_hash))) {
      return res.status(401).json({ error: 'אימייל או סיסמה שגויים' });
    }
    res.json({ token: signToken(user), user: { id: user.id, email: user.email } });
  } catch (err) {
    next(err);
  }
});

// JWT חסר-מצב — ההתנתקות מתבצעת בצד הלקוח (מחיקת ה-token). נשמר לשם סימטריית ה-API.
router.post('/logout', (req, res) => {
  res.json({ ok: true });
});

export default router;
