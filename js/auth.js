import { db } from './config.js';

export const defaultUsers = [
  { id: 1, username: 'admin', password: 'admin123', altPass: '123', fullname: 'ថ្នាក់ដឹកនាំរដ្ឋបាល', role: 'SuperAdmin', status: 'Active', bureau: 'all', permissions: { admin: true, read: true, create: true, edit: true, delete: true, upload: true, download: true, export: true, approve: true, _role: 'SuperAdmin', _status: 'Active' } },
  { id: 2, username: 'user1', password: '123', fullname: 'មន្ត្រីមុនពេលបម្រើការងារ', role: 'Editor', status: 'Active', bureau: 'bureau_1', permissions: { admin: false, read: true, create: true, edit: true, delete: false, upload: true, download: true, export: false, approve: false, _role: 'Editor', _status: 'Active' } },
  { id: 3, username: 'user2', password: '123', fullname: 'មន្ត្រីបណ្តុះបណ្តាលបន្ត', role: 'Editor', status: 'Active', bureau: 'bureau_2', permissions: { admin: false, read: true, create: true, edit: true, delete: false, upload: true, download: true, export: false, approve: false, _role: 'Editor', _status: 'Active' } },
  { id: 4, username: 'user3', password: '123', fullname: 'មន្ត្រីចុះបញ្ជិកា', role: 'Editor', status: 'Active', bureau: 'bureau_3', permissions: { admin: false, read: true, create: true, edit: true, delete: false, upload: true, download: true, export: false, approve: false, _role: 'Editor', _status: 'Active' } }
];

export function normalizeKhmerDigits(str) {
  if (!str) return '';
  const khmerDigits = ['០','១','២','៣','៤','៥','៦','៧','៨','៩'];
  let res = String(str);
  for (let i = 0; i < 10; i++) res = res.split(khmerDigits[i]).join(String(i));
  return res.trim();
}

export function normalizeUserFromRecord(u) {
  if (!u) return null;
  let p = u.permissions || {};
  if (typeof p === 'string') { try { p = JSON.parse(p); } catch (e) { p = {}; } }
  const roleVal = u.role || p._role || (u.bureau === 'all' ? 'SuperAdmin' : 'Editor');
  const statusVal = u.status || p._status || 'Active';
  return {
    ...u,
    role: roleVal,
    status: statusVal,
    permissions: {
      admin: Boolean(p.admin || u.bureau === 'all' || roleVal === 'SuperAdmin'),
      read: p.read !== false,
      create: Boolean(p.create ?? true),
      edit: Boolean(p.edit ?? true),
      delete: Boolean(p.delete ?? false),
      upload: p.upload !== false,
      download: p.download !== false,
      export: Boolean(p.export ?? false),
      approve: Boolean(p.approve ?? false),
      _role: roleVal,
      _status: statusVal
    }
  };
}

export function mergeUserLists(...lists) {
  const map = new Map();
  defaultUsers.forEach(u => map.set(u.username.toLowerCase(), normalizeUserFromRecord(u)));
  lists.forEach(list => {
    if (!Array.isArray(list)) return;
    list.forEach(u => {
      if (u && u.username && u.password) {
        const k = String(u.username).trim().toLowerCase();
        if (k === 'admin') {
          const defAdmin = map.get('admin');
          map.set('admin', normalizeUserFromRecord({ ...defAdmin, ...u, id: 1, altPass: '123' }));
        } else {
          map.set(k, normalizeUserFromRecord(u));
        }
      }
    });
  });
  return Array.from(map.values());
}

export async function fetchAllCloudUsers() {
  if (!db) return [];
  let fromAppUsers = [], fromDocsRegistry = [], fromAuditLogs = [];
  try {
    const [resUsers, resReg, resLogs] = await Promise.allSettled([
      db.from('app_users').select('*'),
      db.from('docs').select('drive_link').eq('code', '__SYSTEM_USERS_REGISTRY__').limit(1),
      db.from('audit_logs').select('target').eq('user', '__USER_SYNC__').order('id', { ascending: false }).limit(50)
    ]);
    if (resUsers.status === 'fulfilled' && Array.isArray(resUsers.value.data)) fromAppUsers = resUsers.value.data;
    if (resReg.status === 'fulfilled' && Array.isArray(resReg.value.data) && resReg.value.data[0]?.drive_link) {
      try { fromDocsRegistry = JSON.parse(resReg.value.data[0].drive_link); } catch (e) {}
    }
    if (resLogs.status === 'fulfilled' && Array.isArray(resLogs.value.data)) {
      resLogs.value.data.slice().reverse().forEach(row => {
        try { const parsed = JSON.parse(row.target); if (parsed && parsed.username) fromAuditLogs.push(parsed); } catch (e) {}
      });
    }
  } catch (e) {}
  return mergeUserLists(fromDocsRegistry, fromAuditLogs, fromAppUsers);
}

export async function authenticateUser(usernameInput, passwordInput, localUsersList) {
  const u = normalizeKhmerDigits(usernameInput).toLowerCase();
  const p = normalizeKhmerDigits(passwordInput);

  let allUsers = mergeUserLists(localUsersList);
  if (db) {
    try {
      const cloudUsrs = await fetchAllCloudUsers();
      if (cloudUsrs.length > 0) allUsers = mergeUserLists(allUsers, cloudUsrs);
    } catch (e) {}
  }

  const user = allUsers.find(x => x && x.username && String(x.username).trim().toLowerCase() === u && (normalizeKhmerDigits(x.password) === p || (x.altPass && x.altPass === p)));
  if (user) {
    const status = user.status || user.permissions?._status || 'Active';
    if (status === 'Suspended') throw new Error('🔴 គណនីនេះត្រូវបានផ្អាកការប្រើប្រាស់ (Suspended)!');
    return normalizeUserFromRecord(user);
  }
  throw new Error('ឈ្មោះគណនី ឬលេខសម្ងាត់មិនត្រឹមត្រូវ!');
}
