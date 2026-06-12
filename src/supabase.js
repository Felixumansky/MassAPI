import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;

export const isConfigured = Boolean(url && key && !url.includes('your-project'));

export const supabase = isConfigured ? createClient(url, key) : null;

// Middleware: blocks API calls with a clear Hebrew message until .env is filled
export function requireDb(req, res, next) {
  if (!isConfigured) {
    return res.status(503).json({
      error: 'Supabase לא מוגדר. צור קובץ .env לפי .env.example והרץ את schema.sql ב-Supabase.',
    });
  }
  next();
}
