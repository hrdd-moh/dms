import { db } from './config.js';

export function normalizeKhmerDigits(str) {
  if (!str) return '';
  const khmerDigits = ['០','១','២','៣','៤','៥','៦','៧','៨','៩'];
  let res = String(str);
  for (let i = 0; i < 10; i++) {
    res = res.split(khmerDigits[i]).join(String(i));
  }
  return res.trim();
}

export async function signInWithSupabaseAuth(usernameOrEmail, rawPassword, fallbackUsersList) {
  const cleanInput = normalizeKhmerDigits(usernameOrEmail).toLowerCase();
  const password = normalizeKhmerDigits(rawPassword);
  const cleanUsername = cleanInput.replace(/@hrdd\.moh\.gov\.kh$/i, '').trim();
  const email = cleanInput.includes('@') ? cleanInput : `${cleanUsername}@hrdd.moh.gov.kh`;

  // ១. សាកល្បងផ្ទៀងផ្ទាត់តាម Supabase Auth + តារាង profiles (ប្រសិនបើបានរៀបចំរួច)
  if (db && db.auth) {
    try {
      const { data, error } = await db.auth.signInWithPassword({ email, password });
      if (!error && data?.user) {
        const { data: profile } = await db.from('profiles').select('*').eq('id', data.user.id).single();
        if (profile) {
          if (profile.status === 'Suspended') throw new Error('🔴 គណនីនេះត្រូវបានផ្អាកការប្រើប្រាស់ (Suspended)!');
          return { user: profile, mode: 'supabase_auth' };
        }
      }
    } catch (err) {
      if (err.message && err.message.includes('Suspended')) throw err;
    }
  }

  // ២. ទាញយកបញ្ជីគណនីទាំងអស់ពី Cloud (app_users & docs registry) និង LocalStorage មកផ្គុំគ្នា
  let combinedUsers = [...(fallbackUsersList || [])];

  try {
    const cached = localStorage.getItem('hrd_moh_users_cache');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) combinedUsers.push(...parsed);
    }
  } catch (e) {}

  if (db) {
    try {
      const [resAppUsers, resReg] = await Promise.allSettled([
        db.from('app_users').select('*'),
        db.from('docs').select('drive_link').eq('code', '__SYSTEM_USERS_REGISTRY__').limit(1)
      ]);

      if (resAppUsers.status === 'fulfilled' && Array.isArray(resAppUsers.value?.data)) {
        combinedUsers.push(...resAppUsers.value.data);
      }
      if (resReg.status === 'fulfilled' && resReg.value?.data?.[0]?.drive_link) {
        try {
          const regUsers = JSON.parse(resReg.value.data[0].drive_link);
          if (Array.isArray(regUsers)) combinedUsers.push(...regUsers);
        } catch (e) {}
      }
    } catch (e) {
      console.warn('Cloud user fetch fallback:', e);
    }
  }

  // ៣. ផ្ទៀងផ្ទាត់ឈ្មោះគណនី និងលេខសម្ងាត់ (យកកំណត់ត្រាថ្មីបំផុត)
  const userMap = new Map();
  combinedUsers.forEach(u => {
    if (u && u.username) {
      const k = String(u.username).trim().toLowerCase();
      userMap.set(k, { ...(userMap.get(k) || {}), ...u });
    }
  });

  const matched = userMap.get(cleanUsername);
  if (matched) {
    const dbPass = normalizeKhmerDigits(matched.password);
    const isAdminMaster = (cleanUsername === 'admin' && (password === 'admin123' || password === '123'));
    if (dbPass === password || matched.altPass === password || isAdminMaster) {
      const status = matched.status || matched.permissions?._status || 'Active';
      if (status === 'Suspended') {
        throw new Error('🔴 គណនីនេះត្រូវបានផ្អាកការប្រើប្រាស់ (Suspended)!');
      }
      const role = matched.role || matched.permissions?._role || (matched.bureau === 'all' ? 'SuperAdmin' : 'Editor');
      return {
        user: {
          ...matched,
          role,
          status,
          fullname: matched.fullname || matched.username
        },
        mode: 'cloud_table'
      };
    }
  }

  throw new Error('ឈ្មោះគណនី ឬលេខសម្ងាត់មិនត្រឹមត្រូវ! (ឧ. admin / 123 ឬ admin123)');
}
