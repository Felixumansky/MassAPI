# MassAPI 💪

Backend ל-MassApp — מעקב עלייה למסה. Node.js + Express + Supabase.

## התקנה

1. צור פרויקט ב-[Supabase](https://supabase.com) (חינם).
2. ב-Dashboard → SQL Editor → הדבק והרץ את התוכן של `schema.sql`.
3. ב-Dashboard → Project Settings → API → העתק את ה-URL ואת ה-`service_role` key.
4. צור קובץ `.env` (העתק מ-`.env.example`) ומלא את הערכים.
5. התקן והרץ:

```bash
npm install
npm run dev
```

השרת עולה על `http://localhost:4000`. בדיקה: `http://localhost:4000/api/health`

## Endpoints

| Method | Route | תיאור |
|--------|-------|--------|
| GET | `/api/health` | בדיקת חיים + סטטוס DB |
| GET | `/api/summary?date=YYYY-MM-DD` | סיכום יומי מלא |
| GET | `/api/history?days=7` | קלוריות יומיות לגרף |
| GET / PUT | `/api/profile` | יעדים אישיים |
| GET | `/api/foods?q=חיפוש` | קטלוג מאכלים |
| POST | `/api/foods` | מאכל חדש לקטלוג |
| POST | `/api/meals` | רישום ארוחה |
| POST | `/api/meals/:id/duplicate` | שכפול ארוחה לתאריך אחר |
| DELETE | `/api/meals/:id` | מחיקת ארוחה |
| POST | `/api/water` | רישום מים |
| DELETE | `/api/water/:id` | מחיקת רישום מים |
| GET / POST | `/api/weights` | מעקב משקל (upsert לפי יום) |
| GET / PUT | `/api/checkins?date=YYYY-MM-DD` | צ'ק־אין יומי: אימון, שינה, תיאבון והערה |
| GET | `/api/insights?days=30&end=YYYY-MM-DD` | מדדי עקביות ועמידה ביעדים |
