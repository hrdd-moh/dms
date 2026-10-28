import { db, localDB } from './config.js';
import { authenticateUser, fetchAllCloudUsers, mergeUserLists, normalizeUserFromRecord, normalizeKhmerDigits } from './auth.js';
import { initResizableTables } from './workflow.js';

const GOOGLE_DRIVE_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbw_ncL4DUer9_BbmX0DJZ72nW_MXGe1T4BX9MJanmEDoFdxHV5o_Mi-lIOYL9PsurvOXA/exec";
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const MAX_RENDER_ROWS = 100;
const SYSTEM_USER_REGISTRY_ID = 999999999;
const SYSTEM_USER_REGISTRY_CODE = "__SYSTEM_USERS_REGISTRY__";

const defaultCountries = [
  { code: 'KH', kh: 'កម្ពុជា', en: 'Cambodia' }, { code: 'JP', kh: 'ជប៉ុន', en: 'Japan' },
  { code: 'MY', kh: 'ម៉ាឡេស៊ី', en: 'Malaysia' }, { code: 'ID', kh: 'ឥណ្ឌូនេស៊ី', en: 'Indonesia' },
  { code: 'NZ', kh: 'នូវែលសេឡង់', en: 'New Zealand' }, { code: 'CA', kh: 'កាណាដា', en: 'Canada' },
  { code: 'US', kh: 'សហរដ្ឋអាមេរិក', en: 'United States' }, { code: 'AU', kh: 'អូស្រ្តាលី', en: 'Australia' },
  { code: 'FR', kh: 'បារាំង', en: 'France' }, { code: 'SG', kh: 'សិង្ហបុរី', en: 'Singapore' },
  { code: 'TH', kh: 'ថៃ', en: 'Thailand' }, { code: 'VN', kh: 'វៀតណាម', en: 'Vietnam' }
];

const BUREAUS = {
  bureau_1: { id: 'bureau_1', name: 'ការិយាល័យបណ្តុះបណ្តាលមុនពេលបម្រើការងារ', shortName: 'ការិយាល័យទី១', desc: 'គ្រប់គ្រងបណ្ណាល័យ លិខិតចេញ-ចូល និងការប្រឡងចូល-ចេញថ្នាក់ជាតិ', tabs: [{ id: 'docs', label: '📚 បណ្ណាល័យរួម' }, { id: 'dispatch', label: '🔄 ឯកសារចេញ-ចូល' }, { id: 'exams', label: '🎓 ការប្រឡងចូល និងចេញ' }] },
  bureau_2: { id: 'bureau_2', name: 'ការិយាល័យបណ្តុះបណ្តាលបន្ត', shortName: 'ការិយាល័យទី២', desc: 'គ្រប់គ្រងបណ្ណាល័យ លិខិតចេញ-ចូល និងទិន្នន័យបណ្តុះបណ្តាលក្នុង/ក្រៅប្រទេស', tabs: [{ id: 'docs', label: '📚 បណ្ណាល័យរួម' }, { id: 'dispatch', label: '🔄 ឯកសារចេញ-ចូល' }, { id: 'training', label: '🌐 បណ្តុះបណ្តាលបន្ត' }] },
  bureau_3: { id: 'bureau_3', name: 'ការិយាល័យចុះបញ្ជិកា និងវិញ្ញាបនបត្រ', shortName: 'ការិយាល័យទី៣', desc: 'គ្រប់គ្រងបណ្ណាល័យ លិខិតចេញ-ចូល និងការចុះបញ្ជីកំណត់លេខសញ្ញាបត្រ', tabs: [{ id: 'docs', label: '📚 បណ្ណាល័យរួម' }, { id: 'dispatch', label: '🔄 ឯកសារចេញ-ចូល' }, { id: 'certs', label: '📜 ចុះបញ្ជីសញ្ញាបត្រ' }] }
};

let docsData = [], dispatchData = [], examsData = [], trainingData = [], certsData = [];
let countriesData = [...defaultCountries];
let usersData = [];
let auditLogs = [];
let currentUploadedFile = { name: '', type: 'PDF', size: '', base64: null, dataUrl: null, rawFile: null };
let currentViewingDoc = null;
let currentUser = null;
let activeBureauKey = localStorage.getItem('hrd_moh_active_bureau_cache') || 'bureau_1';
let activeTab = 'docs';

function showToast(message, isWarning = false) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  const bgClass = isWarning ? 'bg-amber-600' : 'bg-emerald-600';
  const icon = isWarning ? '⚠️' : '✅';
  toast.className = `flex items-center gap-3 ${bgClass} text-white text-sm font-bold px-5 py-4 rounded-2xl shadow-xl transition-all duration-300`;
  toast.innerHTML = `<span class="text-xl">${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

async function safeDbExec(promise) {
  if (!db || !promise) return null;
  try { return await promise; } catch (err) { return null; }
}

function logActivity(action, target) {
  try {
    const now = new Date();
    const logEntry = { id: Math.floor(100000 + Math.random()*1900000000), time: now.toLocaleDateString('km-KH') + ' ' + now.toLocaleTimeString('en-US'), user: currentUser ? (currentUser.fullname + ' (@' + currentUser.username + ')') : 'System', action: action, target: target };
    auditLogs.unshift(logEntry);
    localDB.logs.put(logEntry).catch(()=>{});
    if (db) safeDbExec(db.from('audit_logs').insert([logEntry]));
  } catch (err) {}
}

async function initLocalDB() {
  try {
    const rawDocs = await localDB.docs.orderBy('id').reverse().toArray();
    docsData = rawDocs.filter(d => d.code !== SYSTEM_USER_REGISTRY_CODE);
    trainingData = await localDB.trainings.orderBy('id').reverse().toArray();
    dispatchData = await localDB.dispatches.orderBy('id').reverse().toArray();
    examsData = await localDB.exams.orderBy('id').reverse().toArray();
    certsData = await localDB.certs.orderBy('id').reverse().toArray();
    const rawLogs = await localDB.logs.orderBy('id').reverse().toArray();
    auditLogs = rawLogs.filter(l => l.user !== '__USER_SYNC__');
    
    const c = await localDB.countries.toArray();
    if (c.length > 0) countriesData = c;
    
    const u = await localDB.users.toArray();
    let legacyUsers = [];
    try { const leg = localStorage.getItem('hrd_moh_users_cache'); if (leg) legacyUsers = JSON.parse(leg); } catch(e){}
    usersData = mergeUserLists(legacyUsers, u);
  } catch (e) {}
  
  try { 
    const v = localStorage.getItem('hrd_moh_session_cache'); 
    currentUser = v ? JSON.parse(v) : null; 
  } catch(e){}
  
  checkAuth();
  initResizableTables();
  await syncFromSupabase(false);
  setInterval(() => syncFromSupabase(false), 15000);
}

async function syncToLocalDB(tableName, remoteData) {
  if (!Array.isArray(remoteData)) return;
  try {
    if (tableName === 'docs') {
      const existingLocal = await localDB.docs.toArray();
      const localMap = new Map(existingLocal.map(item => [item.id, item]));
      remoteData = remoteData.map(r => {
        const loc = localMap.get(r.id);
        return { ...r, driveLink: r.driveLink || loc?.driveLink || '', fileDataUrl: loc?.fileDataUrl || r.fileDataUrl || null, mimeType: loc?.mimeType || r.mimeType || '' };
      });
    }
    await localDB[tableName].clear();
    if (remoteData.length > 0) await localDB[tableName].bulkPut(remoteData);
  } catch (e) {}

  const sorted = [...remoteData].sort((a, b) => (b.id || 0) - (a.id || 0));
  if(tableName === 'docs') docsData = sorted.filter(d => d.code !== SYSTEM_USER_REGISTRY_CODE);
  if(tableName === 'trainings') trainingData = sorted;
  if(tableName === 'dispatches') dispatchData = sorted;
  if(tableName === 'exams') examsData = sorted;
  if(tableName === 'certs') certsData = sorted;
}

async function syncFromSupabase(isManual = false) {
  if (!db) return;
  const syncIcon = document.getElementById('sync-btn-icon');
  if(syncIcon) syncIcon.classList.add('animate-spin');
  
  try {
    const results = await Promise.allSettled([
      db.from('docs').select('*').order('id', { ascending: false }).limit(300),
      db.from('trainings').select('*').order('id', { ascending: false }).limit(300),
      db.from('dispatches').select('*').order('id', { ascending: false }).limit(300),
      db.from('exams').select('*').order('id', { ascending: false }).limit(300),
      db.from('certs').select('*').order('id', { ascending: false }).limit(300),
      db.from('countries').select('*'),
      fetchAllCloudUsers(),
      db.from('audit_logs').select('*').order('id', { ascending: false }).limit(200)
    ]);

    const [rDocs, rTrain, rDisp, rExams, rCerts, rCount, rCloudUsers, rLogs] = results;

    if (rDocs.status === 'fulfilled' && rDocs.value && !rDocs.value.error && Array.isArray(rDocs.value.data)) {
      const remoteDocs = rDocs.value.data.filter(d => d.code !== SYSTEM_USER_REGISTRY_CODE).map(d => ({
        id: d.id, bureau: d.bureau || 'bureau_1', code: d.code || '', title: d.title || '', category: d.category || 'ឯកសារបទដ្ឋាន', fileSize: d.file_size || d.fileSize || '1.0 MB', fileName: d.file_name || d.fileName || 'document.pdf', driveLink: d.drive_link || d.driveLink || '', storage: d.storage || '☁️ Cloud Storage', createdBy: d.created_by || d.createdBy || 'user'
      }));
      await syncToLocalDB('docs', remoteDocs);
    }
    if (rTrain.status === 'fulfilled' && rTrain.value && !rTrain.value.error && Array.isArray(rTrain.value.data)) await syncToLocalDB('trainings', rTrain.value.data);
    if (rDisp.status === 'fulfilled' && rDisp.value && !rDisp.value.error && Array.isArray(rDisp.value.data)) await syncToLocalDB('dispatches', rDisp.value.data);
    if (rExams.status === 'fulfilled' && rExams.value && !rExams.value.error && Array.isArray(rExams.value.data)) await syncToLocalDB('exams', rExams.value.data);
    if (rCerts.status === 'fulfilled' && rCerts.value && !rCerts.value.error && Array.isArray(rCerts.value.data)) await syncToLocalDB('certs', rCerts.value.data);
    if (rCount.status === 'fulfilled' && rCount.value && !rCount.value.error && Array.isArray(rCount.value.data) && rCount.value.data.length > 0) {
      countriesData = rCount.value.data;
      await localDB.countries.clear();
      await localDB.countries.bulkPut(countriesData);
    }
    if (rCloudUsers.status === 'fulfilled' && Array.isArray(rCloudUsers.value)) {
      usersData = mergeUserLists(usersData, rCloudUsers.value);
      await localDB.users.clear();
      await localDB.users.bulkPut(usersData);
      localStorage.setItem('hrd_moh_users_cache', JSON.stringify(usersData));
      if (!document.getElementById('modal-system-tools').classList.contains('hidden')) renderUsersTable();
    }
    if (rLogs.status === 'fulfilled' && rLogs.value && !rLogs.value.error && Array.isArray(rLogs.value.data)) {
      auditLogs = rLogs.value.data.filter(l => l.user !== '__USER_SYNC__');
    }

    if (currentUser && currentUser.username) {
      renderTablesAndStatsOnly();
      populateCountryDropdowns();
    }
    if(isManual) showToast("បានធ្វើសមកាលកម្មទិន្នន័យជាមួយ Cloud ជោគជ័យ!");
  } catch (err) {}
  finally { if(syncIcon) syncIcon.classList.remove('animate-spin'); }
}

function checkAuth() {
  const loginModal = document.getElementById('modal-login'); 
  const appHeader = document.getElementById('app-header'); 
  const appMain = document.getElementById('app-main'); 
  const appFooter = document.getElementById('app-footer');
  const appMobileNav = document.getElementById('app-mobile-nav');
  
  if (!currentUser || !currentUser.username) {
    if (loginModal) loginModal.classList.remove('hidden'); 
    if (appHeader) appHeader.classList.add('hidden'); 
    if (appMain) appMain.classList.add('hidden'); 
    if (appFooter) appFooter.classList.add('hidden');
    if (appMobileNav) appMobileNav.classList.add('hidden');
  } else {
    if (loginModal) loginModal.classList.add('hidden'); 
    if (appHeader) appHeader.classList.remove('hidden'); 
    if (appMain) appMain.classList.remove('hidden'); 
    if (appFooter) appFooter.classList.remove('hidden');
    if (appMobileNav) appMobileNav.classList.remove('hidden');
    
    const fn = currentUser.fullname || currentUser.username;
    document.getElementById('current-user-fullname').innerText = fn;
    const isAdmin = currentUser.permissions?.admin === true || currentUser.role === 'SuperAdmin' || currentUser.bureau === 'all';
    document.getElementById('current-user-role').innerText = isAdmin ? '👑 Admin' : `🏢 ${BUREAUS[currentUser.bureau]?.shortName || 'មន្ត្រី'}`;
    document.getElementById('header-avatar-initials').innerText = fn.charAt(0).toUpperCase();
    
    const selectBox = document.getElementById('active-bureau-select'); const lockNotice = document.getElementById('bureau-lock-notice');
    if (isAdmin) {
      if (!BUREAUS[activeBureauKey]) activeBureauKey = 'bureau_1';
      selectBox.value = activeBureauKey; selectBox.disabled = false; lockNotice.classList.add('hidden');
    } else {
      activeBureauKey = BUREAUS[currentUser.bureau] ? currentUser.bureau : 'bureau_1';
      localStorage.setItem('hrd_moh_active_bureau_cache', activeBureauKey); selectBox.value = activeBureauKey; selectBox.disabled = true; lockNotice.classList.remove('hidden');
    }
    applyUserPermissionsUI(isAdmin);
    renderBureauWorkspace();
  }
}

function applyUserPermissionsUI(isAdmin) {
  const perms = currentUser?.permissions || { read: true, upload: true, download: true };
  document.querySelectorAll('.admin-only-item').forEach(el => el.style.display = (perms.admin || isAdmin) ? '' : 'none');
  document.querySelectorAll('.perm-upload-el').forEach(el => el.style.display = (perms.upload || isAdmin) ? '' : 'none');
  document.querySelectorAll('.perm-download-el').forEach(el => el.style.display = (perms.download || isAdmin) ? '' : 'none');
}

async function handleLogin(e) {
  if (e) e.preventDefault();
  const u = document.getElementById('login-username').value;
  const p = document.getElementById('login-password').value;
  try {
    currentUser = await authenticateUser(u, p, usersData);
    localStorage.setItem('hrd_moh_session_cache', JSON.stringify(currentUser));
    if (currentUser.bureau && currentUser.bureau !== 'all') activeBureauKey = currentUser.bureau;
    document.getElementById('login-error').classList.add('hidden');
    checkAuth();
    showToast('ចូលប្រព័ន្ធជោគជ័យ!');
    logActivity('ចូលប្រព័ន្ធ', `User @${currentUser.username}`);
    syncFromSupabase(false);
  } catch (err) {
    const errEl = document.getElementById('login-error');
    errEl.innerText = err.message;
    errEl.classList.remove('hidden');
  }
}

function handleLogout() {
  if (confirm('តើអ្នកពិតជាចង់ចាកចេញពីប្រព័ន្ធមែនទេ?')) {
    currentUser = null;
    localStorage.removeItem('hrd_moh_session_cache');
    checkAuth();
  }
}

function changeActiveBureau(k) { activeBureauKey = k; localStorage.setItem('hrd_moh_active_bureau_cache', k); activeTab = 'docs'; renderBureauWorkspace(); }
function switchBureauTab(tId) { activeTab = tId; renderBureauWorkspace(); }

function renderTablesAndStatsOnly() {
  renderDocs();
  renderDispatch();
  if (activeBureauKey === 'bureau_1') renderExams();
  if (activeBureauKey === 'bureau_2') renderTrainingList();
  if (activeBureauKey === 'bureau_3') renderCerts();
  initResizableTables();
}

function renderBureauWorkspace() {
  const b = BUREAUS[activeBureauKey] || BUREAUS.bureau_1;
  document.getElementById('active-bureau-title').innerText = b.name; 
  document.getElementById('active-bureau-desc').innerText = b.desc;
  document.getElementById('active-bureau-select').value = activeBureauKey; 
  document.getElementById('stat-bureau-badge').innerText = b.shortName;
  document.getElementById('bureau-tabs-nav').innerHTML = b.tabs.map(t => `<button onclick="window.app.switchBureauTab('${t.id}')" class="px-5 py-3 rounded-xl text-sm font-bold transition whitespace-nowrap form-input-focus ${t.id === activeTab ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700'}">${t.label}</button>`).join('');
  
  ['docs', 'dispatch', 'exams', 'training', 'certs'].forEach(sec => { const el = document.getElementById('section-' + sec); if (el) el.classList.add('hidden'); });
  const cSec = document.getElementById('section-' + activeTab); if (cSec) cSec.classList.remove('hidden');
  
  renderSideForm();
  renderTablesAndStatsOnly();
}

function renderSideForm() {
  const container = document.getElementById('side-form-container'); const titleEl = document.getElementById('side-panel-header-title'); const descEl = document.getElementById('side-panel-header-desc');
  if (!container) return;
  if (activeTab === 'training') {
    titleEl.innerHTML = '<span class="text-2xl">🌐</span> បញ្ចូលវគ្គបណ្តុះបណ្តាលរហ័ស'; descEl.innerText = 'Quick Add Continuing Training';
    container.innerHTML = `
      <form onsubmit="window.app.handleSaveTraining(event)" class="space-y-4 text-sm font-medium">
        <div><label class="block text-xs font-bold text-slate-700 mb-1.5">ឈ្មោះសិក្ខាកាម *</label><input type="text" id="train-trainee" required placeholder="ឈ្មោះ..." class="form-input-focus w-full border border-slate-300 rounded-xl p-3 bg-slate-50/50"></div>
        <div><label class="block text-xs font-bold text-slate-700 mb-1.5">តួនាទី និងអង្គភាព *</label><input type="text" id="train-unit" required placeholder="អង្គភាព..." class="form-input-focus w-full border border-slate-300 rounded-xl p-3 bg-slate-50/50"></div>
        <div><label class="block text-xs font-bold text-slate-700 mb-1.5">វគ្គសិក្សា *</label><input type="text" id="train-course" required placeholder="វគ្គសិក្សា..." class="form-input-focus w-full border border-slate-300 rounded-xl p-3 bg-slate-50/50"></div>
        <div class="grid grid-cols-2 gap-3"><div><label class="block text-xs font-bold text-slate-700 mb-1.5">រយៈពេល *</label><input type="text" id="train-duration" required placeholder="6M, 1A..." class="form-input-focus w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50/50"></div><div><label class="block text-xs font-bold text-slate-700 mb-1.5">ប្រភេទ</label><select id="train-scope-input" class="form-input-focus w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50/50"><option value="International">✈️ ក្រៅប្រទេស</option><option value="Domestic">🇰🇭 ក្នុងប្រទេស</option></select></div></div>
        <div class="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200"><div><label class="block text-xs font-bold text-slate-600 mb-1">📅 ចាប់ផ្តើម</label><input type="date" id="train-date-start" required class="form-input-focus w-full border border-slate-300 rounded-lg p-2 bg-white text-xs"></div><div><label class="block text-xs font-bold text-slate-600 mb-1">📅 បញ្ចប់</label><input type="date" id="train-date-end" required class="form-input-focus w-full border border-slate-300 rounded-lg p-2 bg-white text-xs"></div></div>
        <div><label class="block text-xs font-bold text-slate-700 mb-1.5">ប្រទេស (Location) *</label><select id="train-country-select" required class="form-input-focus w-full border border-slate-300 rounded-xl p-3 bg-white font-bold"></select></div>
        <div><label class="block text-xs font-bold text-slate-700 mb-1.5">ដៃគូឧបត្ថម្ភ (Sponsor) *</label><input type="text" id="train-sponsor-input" required placeholder="ឧបត្ថម្ភ..." class="form-input-focus w-full border border-slate-300 rounded-xl p-3 bg-slate-50/50"></div>
        <button type="submit" id="btn-save-training" class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md transition mt-3 form-input-focus"><span>រក្សាទុក</span></button>
      </form>
    `;
    populateCountryDropdowns();
  } else if (activeTab === 'dispatch') {
    titleEl.innerHTML = '<span class="text-2xl">🔄</span> កត់ត្រាលិខិតចេញ-ចូល'; descEl.innerText = 'Quick Add Dispatch Letter';
    container.innerHTML = `
      <form onsubmit="window.app.handleSaveDispatch(event)" class="space-y-4 text-sm font-medium">
        <div class="grid grid-cols-2 gap-3"><div><label class="block text-xs font-bold text-slate-700 mb-1.5">ប្រភេទ</label><select id="disp-type" class="form-input-focus w-full border border-slate-300 rounded-xl p-3 bg-slate-50/50"><option value="ចូល">📥 ចូល</option><option value="ចេញ">📤 ចេញ</option></select></div><div><label class="block text-xs font-bold text-slate-700 mb-1.5">លេខលិខិត</label><input type="text" id="disp-code" required class="form-input-focus w-full border border-slate-300 rounded-xl p-3 bg-slate-50/50" placeholder="លេខលិខិត"></div></div>
        <div><label class="block text-xs font-bold text-slate-700 mb-1.5">កម្មវត្ថុ / ខ្លឹមសារ</label><input type="text" id="disp-title" required class="form-input-focus w-full border border-slate-300 rounded-xl p-3 bg-slate-50/50"></div>
        <div><label class="block text-xs font-bold text-slate-700 mb-1.5">ដំណាក់កាល</label><select id="disp-stage" class="form-input-focus w-full border border-slate-300 rounded-xl p-3 bg-white"><option value="រដ្ឋបាលទទួល">រដ្ឋបាលទទួល</option><option value="កំពុងពិនិត្យបច្ចេកទេស">កំពុងពិនិត្យបច្ចេកទេស</option><option value="រង់ចាំចំណារ/ហត្ថលេខា">រង់ចាំចំណារ/ហត្ថលេខា</option><option value="បញ្ចប់រួចរាល់">បញ្ចប់រួចរាល់</option></select></div>
        <div><label class="block text-xs font-bold text-slate-700 mb-1.5">នៅទីណា (ទីតាំង)</label><select id="disp-location" class="form-input-focus w-full border border-slate-300 rounded-xl p-3 bg-white"><option value="ការិយាល័យសាមី">ការិយាល័យសាមី</option><option value="ប្រធាននាយកដ្ឋាន (DHRD)">ប្រធាននាយកដ្ឋាន (DHRD)</option><option value="អគ្គនាយកដ្ឋានសុខាភិបាល">អគ្គនាយកដ្ឋានសុខាភិបាល</option><option value="ខុទ្ទកាល័យឯកឧត្តមរដ្ឋមន្ត្រី">ខុទ្ទកាល័យឯកឧត្តមរដ្ឋមន្ត្រី</option></select></div>
        <div class="grid grid-cols-2 gap-3"><div><label class="block text-xs font-bold text-slate-700 mb-1.5">កាលបរិច្ឆេទ</label><input type="date" id="disp-date" required class="form-input-focus w-full border border-slate-300 rounded-xl p-2.5 bg-white"></div><div><label class="block text-xs font-bold text-slate-700 mb-1.5">មន្ត្រីកាន់ការ</label><input type="text" id="disp-assignee" required class="form-input-focus w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50/50" placeholder="ឈ្មោះមន្ត្រី"></div></div>
        <button type="submit" id="btn-save-disp" class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md transition mt-3 form-input-focus"><span>រក្សាទុក</span></button>
      </form>
    `;
  } else if (activeTab === 'exams') {
    titleEl.innerHTML = '<span class="text-2xl">🎓</span> កត់ត្រាសម័យប្រឡង'; descEl.innerText = 'Quick Add Exam Session';
    container.innerHTML = `
      <form onsubmit="window.app.handleSaveExam(event)" class="space-y-4 text-sm font-medium">
        <div><label class="block text-xs mb-1.5 font-bold text-slate-700">ជំនាញ / ឯកទេស</label><input type="text" id="exam-major" required class="form-input-focus w-full border border-slate-300 rounded-xl p-3 bg-slate-50"></div>
        <div><label class="block text-xs mb-1.5 font-bold text-slate-700">ប្រភេទ</label><input type="text" id="exam-type" required class="form-input-focus w-full border border-slate-300 rounded-xl p-3 bg-slate-50" placeholder="ប្រឡងចូល / ប្រឡងចេញ"></div>
        <div><label class="block text-xs mb-1.5 font-bold text-slate-700">សម័យប្រឡង</label><input type="text" id="exam-session" required class="form-input-focus w-full border border-slate-300 rounded-xl p-3 bg-slate-50"></div>
        <div><label class="block text-xs mb-1.5 font-bold text-slate-700">ចំនួនបេក្ខជនសរុប</label><input type="number" id="exam-candidates" required class="form-input-focus w-full border border-slate-300 rounded-xl p-3 bg-slate-50"></div>
        <div><label class="block text-xs mb-1.5 font-bold text-slate-700">ស្ថានភាព</label><input type="text" id="exam-status" required class="form-input-focus w-full border border-slate-300 rounded-xl p-3 bg-slate-50" value="កំពុងរៀបចំវិញ្ញាសា"></div>
        <button type="submit" class="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-md form-input-focus text-sm mt-3">រក្សាទុក</button>
      </form>
    `;
  } else if (activeTab === 'certs') {
    titleEl.innerHTML = '<span class="text-2xl">📜</span> ចុះបញ្ជីសញ្ញាបត្រ'; descEl.innerText = 'Quick Register Certificate';
    container.innerHTML = `
      <form onsubmit="window.app.handleSaveCert(event)" class="space-y-4 text-sm font-medium">
        <div><label class="block text-xs mb-1.5 font-bold text-slate-700">លេខកូដសញ្ញាបត្រ</label><input type="text" id="cert-num" required class="form-input-focus w-full border border-slate-300 rounded-xl p-3 bg-slate-50"></div>
        <div><label class="block text-xs mb-1.5 font-bold text-slate-700">ឈ្មោះសាមីខ្លួន</label><input type="text" id="cert-name" required class="form-input-focus w-full border border-slate-300 rounded-xl p-3 bg-slate-50"></div>
        <div><label class="block text-xs mb-1.5 font-bold text-slate-700">ប្រភេទសញ្ញាបត្រ</label><input type="text" id="cert-type" required class="form-input-focus w-full border border-slate-300 rounded-xl p-3 bg-slate-50"></div>
        <div><label class="block text-xs mb-1.5 font-bold text-slate-700">កាលបរិច្ឆេទ</label><input type="date" id="cert-date" required class="form-input-focus w-full border border-slate-300 rounded-xl p-3 bg-white"></div>
        <div><label class="block text-xs mb-1.5 font-bold text-slate-700">ហត្ថលេខា</label><input type="text" id="cert-signer" required class="form-input-focus w-full border border-slate-300 rounded-xl p-3 bg-slate-50" value="ប្រធាននាយកដ្ឋាន"></div>
        <button type="submit" class="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-md form-input-focus text-sm mt-3">រក្សាទុក</button>
      </form>
    `;
  } else {
    titleEl.innerHTML = '<span class="text-2xl">📚</span> បង្ហោះឯកសាររហ័ស (Cloud)'; descEl.innerText = 'Upload Document';
    container.innerHTML = `
      <form onsubmit="window.app.handleSaveDoc(event)" class="space-y-4 text-sm font-medium">
        <div id="drop-zone" tabindex="0" onclick="document.getElementById('doc-file-input').click()" class="form-input-focus border-2 border-dashed border-emerald-400 bg-emerald-50 rounded-2xl p-5 text-center cursor-pointer hover:bg-emerald-100 transition">
          <input type="file" id="doc-file-input" onchange="window.app.handleFileSelected(event)" class="hidden" accept=".pdf,.docx,.doc,.xlsx,.xls,.png,.jpg,.jpeg">
          <p id="file-label" class="text-sm font-bold text-slate-700">ចុចជ្រើសរើសហ្វាល ឬទម្លាក់ចូល</p>
          <p id="file-sublabel" class="text-xs text-rose-500 font-bold mt-1">ទំហំគាំទ្រ ≤ 8MB</p>
        </div>
        <div><label class="block text-xs font-bold text-slate-700 mb-1.5">កូដឯកសារ *</label><input type="text" id="doc-code" required class="form-input-focus w-full border border-slate-300 rounded-xl p-3 bg-slate-50/50" placeholder="DOC-2026-001"></div>
        <div><label class="block text-xs font-bold text-slate-700 mb-1.5">ប្រភេទ</label><select id="doc-category" class="form-input-focus w-full border border-slate-300 rounded-xl p-3 bg-white"><option value="ឯកសារបទដ្ឋាន">ឯកសារបទដ្ឋាន</option><option value="កម្មវិធីបណ្តុះបណ្តាល">កម្មវិធីបណ្តុះបណ្តាល</option><option value="វិញ្ញាសា/របាយការណ៍">វិញ្ញាសា/របាយការណ៍</option><option value="សេចក្តីណែនាំ">សេចក្តីណែនាំ</option></select></div>
        <div><label class="block text-xs font-bold text-slate-700 mb-1.5">ចំណងជើងឯកសារ *</label><input type="text" id="doc-title" required class="form-input-focus w-full border border-slate-300 rounded-xl p-3 bg-slate-50/50" placeholder="ចំណងជើង..."></div>
        <button type="submit" id="btn-save-doc" class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md transition mt-3 form-input-focus"><span>រក្សាទុក</span></button>
      </form>
    `;
  }
}

function resetDocFilters() {
  document.getElementById('doc-search').value = '';
  document.getElementById('filter-doc-category').value = 'all';
  document.getElementById('filter-doc-bureau').value = 'all';
  renderDocs();
}

function renderDocs() {
  const tbody = document.getElementById('docs-table-body'); if (!tbody) return;
  const search = (document.getElementById('doc-search')?.value || '').toLowerCase();
  const catFilter = document.getElementById('filter-doc-category')?.value || 'all';
  const bureauFilter = document.getElementById('filter-doc-bureau')?.value || 'all';
  const isAdmin = currentUser?.permissions?.admin === true || currentUser?.role === 'SuperAdmin' || currentUser?.bureau === 'all';

  let filtered = docsData.filter(d => d.code !== SYSTEM_USER_REGISTRY_CODE).filter(d => {
    const matchSearch = !search || (d.title && d.title.toLowerCase().includes(search)) || (d.code && d.code.toLowerCase().includes(search));
    const matchCat = (catFilter === 'all' || d.category === catFilter);
    const matchBureau = (bureauFilter === 'all' || d.bureau === bureauFilter);
    return matchSearch && matchCat && matchBureau;
  });

  document.getElementById('stat-bureau-docs').innerText = filtered.length;
  const limited = filtered.slice(0, MAX_RENDER_ROWS);
  if (limited.length === 0) return tbody.innerHTML = '<tr><td colspan="6" class="p-6 text-center text-slate-400">មិនមានឯកសារឡើយ</td></tr>';

  tbody.innerHTML = limited.map(d => {
    const bTag = BUREAUS[d.bureau] ? BUREAUS[d.bureau].shortName : d.bureau;
    return `
      <tr class="hover:bg-emerald-50 transition">
        <td class="p-3.5 font-mono font-bold text-slate-700 text-sm whitespace-nowrap">${d.code}</td>
        <td class="p-3.5 font-bold text-slate-900 text-sm">${d.title}</td>
        <td class="p-3.5 text-center whitespace-nowrap"><span class="px-3 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700">${d.category}</span></td>
        <td class="p-3.5 text-center whitespace-nowrap"><span class="px-3 py-1 rounded-full text-xs font-bold ${d.driveLink ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">${d.driveLink ? '☁️ In Drive' : 'Cloud Record'}</span></td>
        <td class="p-3.5 text-center font-mono text-xs text-slate-600 whitespace-nowrap">${d.fileSize}</td>
        <td class="p-3.5 text-center whitespace-nowrap">
          <button onclick="window.app.openDocViewerById(${d.id})" class="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition">👁️ មើល / Print</button>
          ${isAdmin ? `<button onclick="window.app.deleteDoc(${d.id})" class="text-rose-600 font-bold text-xs ml-2">លុប</button>` : ''}
        </td>
      </tr>
    `;
  }).join('');
}

function openDocViewerById(docId) {
  const doc = docsData.find(d => d.id === docId); if (!doc) return;
  currentViewingDoc = doc;
  document.getElementById('doc-viewer-title').innerText = `📄 ${doc.title} (${doc.code})`;
  document.getElementById('doc-viewer-meta').innerText = `ប្រភេទ៖ ${doc.category} | ទំហំ៖ ${doc.fileSize}`;
  const bodyEl = document.getElementById('doc-viewer-body');
  const dlBtn = document.getElementById('doc-viewer-download');

  if (doc.fileDataUrl) {
    dlBtn.href = doc.fileDataUrl; dlBtn.download = doc.fileName || `${doc.code}.pdf`; dlBtn.classList.remove('hidden');
    bodyEl.innerHTML = `<iframe src="${doc.fileDataUrl}" class="w-full h-full rounded-xl bg-white border-0 shadow-sm"></iframe>`;
  } else if (doc.driveLink && doc.driveLink.startsWith('http')) {
    dlBtn.href = doc.driveLink; dlBtn.target = "_blank"; dlBtn.classList.remove('hidden');
    bodyEl.innerHTML = `<iframe src="${doc.driveLink.includes('drive.google.com') ? doc.driveLink.replace(/\/view(\?.*)?$/, '/preview') : doc.driveLink}" class="w-full h-full rounded-xl bg-white border-0 shadow-sm"></iframe>`;
  } else {
    dlBtn.classList.add('hidden');
    bodyEl.innerHTML = `<div class="bg-white p-6 rounded-2xl shadow-sm text-center"><h2>${doc.title}</h2><p class="font-mono mt-2">${doc.code}</p></div>`;
  }
  document.getElementById('modal-doc-viewer').classList.remove('hidden');
}

function printCurrentDoc() {
  if (!currentViewingDoc) return;
  if (currentViewingDoc.fileDataUrl) {
    const win = window.open('', '_blank');
    win.document.write(`<html><body><iframe src="${currentViewingDoc.fileDataUrl}" style="width:100vw;height:100vh;border:none;" onload="this.contentWindow.print();"></iframe></body></html>`);
    win.document.close();
  } else { window.print(); }
}

function renderDispatch() {
  const tbody = document.getElementById('dispatch-table-body'); if (!tbody) return;
  const isAdmin = currentUser?.permissions?.admin === true || currentUser?.role === 'SuperAdmin' || currentUser?.bureau === 'all';
  const viewBureau = isAdmin ? activeBureauKey : currentUser.bureau;
  const bureauItems = dispatchData.filter(d => d.bureau === viewBureau);
  document.getElementById('stat-bureau-disp').innerText = bureauItems.filter(d => d.stage !== 'បញ្ចប់រួចរាល់').length;

  if (bureauItems.length === 0) return tbody.innerHTML = '<tr><td colspan="7" class="p-6 text-center text-slate-400">មិនទាន់មានលិខិតឡើយ</td></tr>';

  tbody.innerHTML = bureauItems.map(d => `
    <tr class="hover:bg-emerald-50 transition">
      <td class="p-3.5 whitespace-nowrap"><span class="px-3 py-1 rounded-md text-xs font-bold ${d.type === 'ចូល' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}">${d.type}</span></td>
      <td class="p-3.5 font-mono font-bold text-slate-800 text-sm whitespace-nowrap">${d.code}</td>
      <td class="p-3.5 font-bold text-slate-900 text-sm">${d.title}</td>
      <td class="p-3.5 text-center whitespace-nowrap"><span class="px-3 py-1 rounded-full text-xs font-bold ${d.stage === 'បញ្ចប់រួចរាល់' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-50 text-amber-800 border'}">${d.stage}</span></td>
      <td class="p-3.5 text-emerald-800 font-bold text-xs whitespace-nowrap">${d.location}</td>
      <td class="p-3.5 text-center font-mono text-xs text-slate-500 whitespace-nowrap">${d.date}</td>
      <td class="p-3.5 text-center whitespace-nowrap">${isAdmin ? `<button onclick="window.app.deleteDispatch(${d.id})" class="text-rose-600 font-bold text-xs">លុប</button>` : '-'}</td>
    </tr>
  `).join('');
}

function renderExams() {
  const tbody = document.getElementById('exams-table-body'); if (!tbody) return;
  document.getElementById('stat-custom-label').innerText = 'សម័យប្រឡងសរុប'; document.getElementById('stat-custom-val').innerText = examsData.length; document.getElementById('stat-custom-icon').innerText = '🎓';
  if (examsData.length === 0) return tbody.innerHTML = '<tr><td colspan="6" class="p-6 text-center text-slate-400">មិនមានទិន្នន័យឡើយ</td></tr>';
  tbody.innerHTML = examsData.map(e => `
    <tr class="hover:bg-emerald-50 transition">
      <td class="p-3.5"><span class="px-3 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-800">${e.type}</span></td>
      <td class="p-3.5 font-bold text-slate-900 text-sm">${e.major}</td>
      <td class="p-3.5 text-slate-600 font-bold text-sm">${e.session}</td>
      <td class="p-3.5 text-center font-bold text-slate-800 text-sm">${e.candidates} នាក់</td>
      <td class="p-3.5 text-center"><span class="px-3 py-1 rounded-full text-xs font-bold text-emerald-700 bg-emerald-50">${e.status}</span></td>
      <td class="p-3.5 text-center"><button onclick="window.app.deleteExam(${e.id})" class="text-rose-600 font-bold text-xs">លុប</button></td>
    </tr>
  `).join('');
}

function renderTrainingList() {
  const tbody = document.getElementById('training-table-body'); if (!tbody) return;
  document.getElementById('stat-custom-label').innerText = 'វគ្គបណ្តុះបណ្តាល'; document.getElementById('stat-custom-val').innerText = trainingData.length; document.getElementById('stat-custom-icon').innerText = '🌐';
  if (trainingData.length === 0) return tbody.innerHTML = '<tr><td colspan="8" class="p-6 text-center text-slate-400">មិនមានទិន្នន័យឡើយ</td></tr>';
  tbody.innerHTML = trainingData.map(t => `
    <tr class="hover:bg-emerald-50 transition">
      <td class="p-3.5 font-bold text-slate-900 text-sm">${t.trainee}</td>
      <td class="p-3.5 text-slate-700 text-sm">${t.unit}</td>
      <td class="p-3.5 text-emerald-900 font-bold text-sm">${t.course}</td>
      <td class="p-3.5 text-center font-bold text-slate-700 text-sm">${t.duration}</td>
      <td class="p-3.5 text-center font-mono text-xs text-slate-600">${t.dates}</td>
      <td class="p-3.5 text-center font-bold text-slate-800 text-sm"><span class="px-3 py-1 bg-slate-100 rounded-md">${t.country}</span></td>
      <td class="p-3.5 text-slate-700 text-sm">${t.sponsor}</td>
      <td class="p-3.5 text-center"><button onclick="window.app.deleteTraining(${t.id})" class="text-rose-600 font-bold text-xs">លុប</button></td>
    </tr>
  `).join('');
}

function renderCerts() {
  const tbody = document.getElementById('certs-table-body'); if (!tbody) return;
  document.getElementById('stat-custom-label').innerText = 'សញ្ញាបត្របានចុះបញ្ជី'; document.getElementById('stat-custom-val').innerText = certsData.length; document.getElementById('stat-custom-icon').innerText = '📜';
  if (certsData.length === 0) return tbody.innerHTML = '<tr><td colspan="6" class="p-6 text-center text-slate-400">មិនមានទិន្នន័យឡើយ</td></tr>';
  tbody.innerHTML = certsData.map(c => `
    <tr class="hover:bg-emerald-50 transition">
      <td class="p-3.5 font-mono font-bold text-emerald-800 text-sm">${c.num}</td>
      <td class="p-3.5 font-bold text-slate-900 text-sm">${c.recipient}</td>
      <td class="p-3.5 text-slate-700 font-bold text-sm">${c.type}</td>
      <td class="p-3.5 text-center font-mono text-xs text-slate-500">${c.date}</td>
      <td class="p-3.5 text-slate-700 text-sm">${c.signer}</td>
      <td class="p-3.5 text-center"><button onclick="window.app.deleteCert(${c.id})" class="text-rose-600 font-bold text-xs">លុប</button></td>
    </tr>
  `).join('');
}

// Actions & Tools
function handleFileSelected(e) {
  const file = e.target.files[0]; if (!file) return;
  if (file.size > MAX_FILE_SIZE) { alert('⚠️ ឯកសារធំលើស 8MB!'); e.target.value = ''; return; }
  const sizeMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
  document.getElementById('file-label').innerHTML = `✅ បានជ្រើសរើស៖ <span class="text-emerald-700 font-bold">${file.name}</span>`;
  if (!document.getElementById('doc-title').value) document.getElementById('doc-title').value = file.name.replace(/\.[^/.]+$/, "");
  const reader = new FileReader();
  reader.onload = function(evt) { currentUploadedFile = { name: file.name, type: file.type || 'application/pdf', size: sizeMB, dataUrl: evt.target.result, base64: evt.target.result.split(',')[1], rawFile: file }; };
  reader.readAsDataURL(file);
}

async function handleSaveDoc(e) {
  e.preventDefault();
  if (!currentUploadedFile.rawFile && !currentUploadedFile.base64) return alert('សូមជ្រើសរើសហ្វាលឯកសារជាមុនសិន!');
  let cloudFileUrl = '';
  const docId = Math.floor(100000 + Math.random()*1900000000);
  if (db && currentUploadedFile.rawFile) {
    try {
      const ext = (currentUploadedFile.name.split('.').pop() || 'pdf').toLowerCase();
      const path = `bureau_docs/${docId}_${Date.now()}.${ext}`;
      const { data } = await db.storage.from('documents').upload(path, currentUploadedFile.rawFile, { upsert: true });
      if (data) { const { data: pub } = db.storage.from('documents').getPublicUrl(path); if (pub) cloudFileUrl = pub.publicUrl; }
    } catch(err){}
  }
  const newDoc = { id: docId, bureau: activeBureauKey, code: document.getElementById('doc-code').value.trim(), title: document.getElementById('doc-title').value.trim(), category: document.getElementById('doc-category').value, fileSize: currentUploadedFile.size, fileName: currentUploadedFile.name, fileDataUrl: currentUploadedFile.dataUrl, storage: cloudFileUrl ? '☁️ Cloud Storage' : '☁️ Google Drive', driveLink: cloudFileUrl, createdBy: currentUser?.username || 'user' };
  docsData.unshift(newDoc); await localDB.docs.put(newDoc); renderDocs();
  if (db) await safeDbExec(db.from('docs').upsert([{ id: newDoc.id, bureau: newDoc.bureau, code: newDoc.code, title: newDoc.title, category: newDoc.category, file_size: newDoc.fileSize, file_name: newDoc.fileName, drive_link: cloudFileUrl, storage: newDoc.storage, created_by: newDoc.createdBy }]));
  showToast('បានបង្ហោះឯកសារជោគជ័យ!'); logActivity('Upload ឯកសារ', newDoc.code);
  renderSideForm();
}

async function deleteDoc(id) { if (confirm('លុបឯកសារនេះ?')) { if (db) await safeDbExec(db.from('docs').delete().eq('id', id)); await localDB.docs.delete(id); docsData = docsData.filter(d => d.id !== id); renderDocs(); showToast('បានលុប!'); } }
async function handleSaveTraining(e) { e.preventDefault(); const newT = { id: Math.floor(100000 + Math.random()*1900000000), trainee: document.getElementById('train-trainee').value.trim(), unit: document.getElementById('train-unit').value.trim(), course: document.getElementById('train-course').value.trim(), duration: document.getElementById('train-duration').value.trim(), scope: document.getElementById('train-scope-input').value, dates: document.getElementById('train-date-start').value + '-' + document.getElementById('train-date-end').value, country: document.getElementById('train-country-select').value, sponsor: document.getElementById('train-sponsor-input').value.trim() }; trainingData.unshift(newT); await localDB.trainings.put(newT); renderTrainingList(); if (db) await safeDbExec(db.from('trainings').insert([newT])); showToast('បានរក្សាទុក!'); renderSideForm(); }
async function deleteTraining(id) { if (confirm('លុប?')) { if (db) await safeDbExec(db.from('trainings').delete().eq('id', id)); await localDB.trainings.delete(id); trainingData = trainingData.filter(t => t.id !== id); renderTrainingList(); showToast('លុបជោគជ័យ'); } }
async function handleSaveDispatch(e) { e.preventDefault(); const newD = { id: Math.floor(100000 + Math.random()*1900000000), bureau: activeBureauKey, type: document.getElementById('disp-type').value, code: document.getElementById('disp-code').value.trim(), title: document.getElementById('disp-title').value.trim(), stage: document.getElementById('disp-stage').value, location: document.getElementById('disp-location').value, date: document.getElementById('disp-date').value, assignee: document.getElementById('disp-assignee').value.trim() }; dispatchData.unshift(newD); await localDB.dispatches.put(newD); renderDispatch(); if (db) await safeDbExec(db.from('dispatches').insert([newD])); showToast('បានរក្សាទុក!'); renderSideForm(); }
async function deleteDispatch(id) { if (confirm('លុប?')) { if (db) await safeDbExec(db.from('dispatches').delete().eq('id', id)); await localDB.dispatches.delete(id); dispatchData = dispatchData.filter(d => d.id !== id); renderDispatch(); showToast('លុបជោគជ័យ'); } }
async function handleSaveExam(e) { e.preventDefault(); const newE = { id: Math.floor(100000 + Math.random()*1900000000), major: document.getElementById('exam-major').value.trim(), type: document.getElementById('exam-type').value.trim(), session: document.getElementById('exam-session').value.trim(), candidates: Number(document.getElementById('exam-candidates').value), status: document.getElementById('exam-status').value.trim() }; examsData.unshift(newE); await localDB.exams.put(newE); renderExams(); if (db) await safeDbExec(db.from('exams').insert([newE])); showToast('បានរក្សាទុក!'); renderSideForm(); }
async function deleteExam(id) { if (confirm('លុប?')) { if (db) await safeDbExec(db.from('exams').delete().eq('id', id)); await localDB.exams.delete(id); examsData = examsData.filter(e => e.id !== id); renderExams(); showToast('លុបជោគជ័យ'); } }
async function handleSaveCert(e) { e.preventDefault(); const newC = { id: Math.floor(100000 + Math.random()*1900000000), num: document.getElementById('cert-num').value.trim(), recipient: document.getElementById('cert-name').value.trim(), type: document.getElementById('cert-type').value.trim(), date: document.getElementById('cert-date').value, signer: document.getElementById('cert-signer').value.trim() }; certsData.unshift(newC); await localDB.certs.put(newC); renderCerts(); if (db) await safeDbExec(db.from('certs').insert([newC])); showToast('បានរក្សាទុក!'); renderSideForm(); }
async function deleteCert(id) { if (confirm('លុប?')) { if (db) await safeDbExec(db.from('certs').delete().eq('id', id)); await localDB.certs.delete(id); certsData = certsData.filter(c => c.id !== id); renderCerts(); showToast('លុបជោគជ័យ'); } }

// System Tools & Modals
function openSystemModal(tab) {
  tab = tab || 'settings';
  document.getElementById('modal-system-tools').classList.remove('hidden');
  switchSystemToolTab(tab);
}
function switchSystemToolTab(tab) {
  ['settings', 'location', 'files', 'security', 'logging', 'manual'].forEach(t => {
    document.getElementById('syscontent-' + t)?.classList.add('hidden');
    const b = document.getElementById('systab-' + t); if (b) { b.classList.remove('bg-emerald-600', 'text-white'); b.classList.add('bg-slate-100', 'text-slate-600'); }
  });
  document.getElementById('syscontent-' + tab)?.classList.remove('hidden');
  const ab = document.getElementById('systab-' + tab); if (ab) { ab.classList.add('bg-emerald-600', 'text-white'); ab.classList.remove('bg-slate-100', 'text-slate-600'); }
  if (tab === 'settings') renderUsersTable();
  if (tab === 'location') renderCountriesTable();
  if (tab === 'files') renderFilesSystemList();
  if (tab === 'logging') renderLogsTable();
}

function openProfileModal() {
  if (!currentUser) return;
  document.getElementById('profile-modal-fullname').innerText = currentUser.fullname;
  document.getElementById('profile-modal-username').innerText = '@' + currentUser.username;
  document.getElementById('profile-modal-bureau').innerText = BUREAUS[currentUser.bureau]?.name || currentUser.bureau || 'គ្រប់ការិយាល័យ';
  document.getElementById('modal-user-profile').classList.remove('hidden');
}

async function changePasswordFromProfile() {
  const oldP = normalizeKhmerDigits(document.getElementById('profile-old-pwd').value);
  const newP = normalizeKhmerDigits(document.getElementById('profile-new-pwd').value);
  if (normalizeKhmerDigits(currentUser.password) !== oldP && currentUser.altPass !== oldP) return alert('ពាក្យសម្ងាត់ចាស់មិនត្រឹមត្រូវ!');
  currentUser.password = newP; localStorage.setItem('hrd_moh_session_cache', JSON.stringify(currentUser));
  const idx = usersData.findIndex(u => u.username.toLowerCase() === currentUser.username.toLowerCase());
  if (idx !== -1) { usersData[idx].password = newP; await localDB.users.put(usersData[idx]); localStorage.setItem('hrd_moh_users_cache', JSON.stringify(usersData)); }
  showToast('បានប្តូរ Password ជោគជ័យ!'); document.getElementById('modal-user-profile').classList.add('hidden');
}

function renderUsersTable() {
  const tbody = document.getElementById('users-table-body'); if (!tbody) return;
  tbody.innerHTML = usersData.map(u => `<tr class="hover:bg-slate-50"><td class="p-3 font-bold">${u.fullname}</td><td class="p-3 font-mono">@${u.username}</td><td class="p-3">${u.bureau}</td><td class="p-3 text-right"><button onclick="window.app.deleteUser(${u.id})" class="text-rose-600 font-bold">លុប</button></td></tr>`).join('');
}
async function handleCreateUser(e) {
  e.preventDefault();
  const newUser = { id: Math.floor(100000 + Math.random()*1900000000), fullname: document.getElementById('new-user-fullname').value.trim(), username: document.getElementById('new-user-username').value.trim(), password: document.getElementById('new-user-password').value.trim(), bureau: document.getElementById('new-user-bureau').value, role: 'Editor', status: 'Active' };
  usersData.push(newUser); await localDB.users.put(newUser); localStorage.setItem('hrd_moh_users_cache', JSON.stringify(usersData));
  renderUsersTable(); showToast('បង្កើតមន្ត្រីជោគជ័យ!'); e.target.reset();
}
async function deleteUser(id) {
  usersData = usersData.filter(u => u.id !== id); await localDB.users.delete(id); localStorage.setItem('hrd_moh_users_cache', JSON.stringify(usersData)); renderUsersTable(); showToast('លុបជោគជ័យ');
}

function renderCountriesTable() {
  const tbody = document.getElementById('countries-table-body'); if (!tbody) return;
  tbody.innerHTML = countriesData.map((c, i) => `<tr><td class="p-3 font-mono">${c.code}</td><td class="p-3 font-bold">${c.kh}</td><td class="p-3">${c.en}</td><td class="p-3 text-right"><button onclick="window.app.deleteCountry('${c.code}', ${i})" class="text-rose-600 font-bold">លុប</button></td></tr>`).join('');
}
async function handleAddCountry(e) {
  e.preventDefault(); const c = { code: document.getElementById('new-country-code').value.trim().toUpperCase(), kh: document.getElementById('new-country-kh').value.trim(), en: document.getElementById('new-country-en').value.trim() };
  countriesData.push(c); await localDB.countries.put(c); renderCountriesTable(); populateCountryDropdowns(); showToast('បន្ថែមប្រទេសជោគជ័យ'); e.target.reset();
}
async function deleteCountry(code, i) { countriesData.splice(i, 1); await localDB.countries.delete(code); renderCountriesTable(); populateCountryDropdowns(); showToast('លុបជោគជ័យ'); }
function populateCountryDropdowns() {
  const s = document.getElementById('train-country-select'); if (s) s.innerHTML = countriesData.map(c => `<option value="${c.kh}">${c.kh} (${c.en})</option>`).join('');
}
function renderFilesSystemList() {
  const list = document.getElementById('files-system-list'); if (!list) return;
  list.innerHTML = docsData.map(d => `<div class="p-3 flex justify-between"><span>${d.title} (${d.code})</span><button onclick="window.app.openDocViewerById(${d.id})" class="text-emerald-700 font-bold">មើល</button></div>`).join('');
}
function backupEntireSystem() {
  const b = { users: usersData, countries: countriesData, documents: docsData, dispatches: dispatchData, trainings: trainingData };
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(b, null, 2)], { type: 'application/json' })); a.download = `Backup_${Date.now()}.json`; a.click(); showToast('Backup ជោគជ័យ!');
}
function renderLogsTable() {
  const tbody = document.getElementById('logs-table-body'); if (!tbody) return;
  tbody.innerHTML = auditLogs.map(l => `<tr><td class="p-3 font-mono">${l.time}</td><td class="p-3 font-bold">${l.user}</td><td class="p-3 text-emerald-700 font-bold">${l.action}</td><td class="p-3">${l.target}</td></tr>`).join('');
}
async function clearActivityLogs() { await localDB.logs.clear(); auditLogs = []; renderLogsTable(); showToast('ជម្រះ Logs រួចរាល់'); }

function exportCSV() {
  let csv = "\uFEFFDoc ID,Title,Category,Size\n";
  docsData.forEach(d => { csv += `"${d.code}","${d.title}","${d.category}","${d.fileSize}"\n`; });
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' })); a.download = 'docs.csv'; a.click(); showToast('Export CSV ជោគជ័យ');
}
function exportTrainingExcel() {
  const rows = trainingData.map((t, i) => ({ "ល.រ": i+1, "ឈ្មោះ": t.trainee, "អង្គភាព": t.unit, "វគ្គសិក្សា": t.course, "រយៈពេល": t.duration, "ប្រទេស": t.country, "ឧបត្ថម្ភ": t.sponsor }));
  const ws = XLSX.utils.json_to_sheet(rows); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Training"); XLSX.writeFile(wb, "training.xlsx"); showToast('Export Excel ជោគជ័យ');
}
function openPrintPreviewModal() {
  const tbody = document.getElementById('printable-preview-content');
  tbody.innerHTML = `<table class="w-full border-collapse border"><thead><tr class="bg-slate-100"><th class="border p-2">ល.រ</th><th class="border p-2">ឈ្មោះ</th><th class="border p-2">វគ្គសិក្សា</th><th class="border p-2">ប្រទេស</th></tr></thead><tbody>` + trainingData.map((t, i) => `<tr><td class="border p-2 text-center">${i+1}</td><td class="border p-2 font-bold">${t.trainee}</td><td class="border p-2">${t.course}</td><td class="border p-2 text-center">${t.country}</td></tr>`).join('') + `</tbody></table>`;
  document.getElementById('modal-print-preview').classList.remove('hidden');
}

let html5QrcodeScanner = null;
function toggleScannerModal(show) {
  const m = document.getElementById('modal-scanner');
  if (show) {
    m.classList.remove('hidden');
    if (!html5QrcodeScanner) {
      html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 200 });
      html5QrcodeScanner.render(txt => { document.getElementById('scan-result').innerText = '✅ លទ្ធផល QR: ' + txt; });
    }
  } else { m.classList.add('hidden'); }
}

// Attach to window.app
window.app = {
  handleLogin, handleLogout, syncFromSupabase,
  changeActiveBureau, switchBureauTab,
  toggleSidebarCollapse: () => document.getElementById('app-sidebar')?.classList.toggle('collapsed'),
  resetDocFilters, renderDocs, openDocViewerById, deleteDoc,
  openDocViewerModal: () => {}, closeDocViewerModal: () => {}, printCurrentDoc,
  renderDispatch, deleteDispatch, renderExams, deleteExam,
  renderTrainingList, deleteTraining, renderCerts, deleteCert,
  handleFileSelected, handleSaveDoc, handleSaveTraining, handleSaveDispatch, handleSaveExam, handleSaveCert,
  openSystemModal, switchSystemToolTab, openProfileModal, changePasswordFromProfile,
  renderUsersTable, handleCreateUser, deleteUser,
  renderCountriesTable, handleAddCountry, deleteCountry,
  renderFilesSystemList, backupEntireSystem, renderLogsTable, clearActivityLogs,
  exportCSV, exportTrainingExcel, openPrintPreviewModal, toggleScannerModal
};

window.addEventListener('DOMContentLoaded', async () => {
  await initLocalDB();
  
  // បង្ខំឱ្យពិនិត្យមើល Session ឱ្យបានត្រឹមត្រូវ បើគ្មាន User ទេ ត្រូវបង្ហាញផ្ទាំង Login ភ្លាម
  try {
    const sessionStr = localStorage.getItem('hrd_moh_session_cache');
    if (sessionStr) {
      currentUser = JSON.parse(sessionStr);
      checkAuth();
    } else {
      checkAuth(); // ហៅមុខងារ checkAuth ដើម្បីបើក Modal Login ស្វ័យប្រវត្តិ
    }
  } catch (e) {
    checkAuth();
  }
});
