export const SUPABASE_URL = "https://whcpyxprjozjbhyzjtid.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoY3B5eHByam96amJoeXpqdGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2NzI3MDgsImV4cCI6MjEwODI0ODcwOH0.0gDdi8HvHzXvygjH6DpUeMNdIbChUIN6rL1Cx5OsYME";

export const db = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// បង្កើត Object បម្រុងទុក (Fallback) ប្រសិនបើ Incognito បិទ IndexedDB
let tempDexie = null;
try {
  tempDexie = new Dexie("DHRD_DB_V4");
  tempDexie.version(2).stores({
    docs: 'id, bureau, code, title, category, fileSize, fileName, storage, createdBy',
    trainings: 'id, trainee, unit, course, duration, dates, country, sponsor',
    dispatches: 'id, bureau, type, code, title, stage, location, date, assignee',
    exams: 'id, major, type, session, candidates, status',
    certs: 'id, num, recipient, type, date, signer',
    countries: 'code, kh, en',
    users: 'id, username',
    logs: 'id, time, user, action'
  });
} catch(e) {
  console.warn("⚠️ Incognito Mode Blocked IndexedDB. Using RAM Fallback.");
}
export const localDB = tempDexie;
