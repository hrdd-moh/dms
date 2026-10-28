import { db, localDB } from './config.js';
import { authenticateUser, defaultUsers } from './auth.js';
import { initResizableTables } from './workflow.js';

let currentUser = null, docsData = [], dispatchData = [], examsData = [], trainingData = [], certsData = [];
let activeBureauKey = 'bureau_1', activeTab = 'docs';

const BUREAUS = {
  all: { name: 'គ្រប់ការិយាល័យ', shortName: 'ទាំងអស់', tabs: [{ id: 'docs', label: 'បណ្ណាល័យរួម' }, { id: 'dispatch', label: 'លិខិតចេញ-ចូល' }] },
  bureau_1: { name: 'ការិយាល័យទី១', shortName: 'ការិយាល័យទី១', tabs: [{ id: 'docs', label: 'បណ្ណាល័យរួម' }, { id: 'dispatch', label: 'លិខិតចេញ-ចូល' }, { id: 'exams', label: 'ប្រឡងចូល/ចេញ' }] },
  bureau_2: { name: 'ការិយាល័យទី២', shortName: 'ការិយាល័យទី២', tabs: [{ id: 'docs', label: 'បណ្ណាល័យរួម' }, { id: 'dispatch', label: 'លិខិតចេញ-ចូល' }, { id: 'training', label: 'បណ្តុះបណ្តាល' }] },
  bureau_3: { name: 'ការិយាល័យទី៣', shortName: 'ការិយាល័យទី៣', tabs: [{ id: 'docs', label: 'បណ្ណាល័យរួម' }, { id: 'dispatch', label: 'លិខិតចេញ-ចូល' }, { id: 'certs', label: 'សញ្ញាបត្រ' }] }
};

function showToast(msg) {
  const container = document.getElementById('toast-container'); if (!container) return;
  const t = document.createElement('div'); t.className = 'bg-emerald-600 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl';
  t.innerHTML = `✅ ${msg}`; container.appendChild(t); setTimeout(() => t.remove(), 3000);
}

// ប្រព័ន្ធការពារការគាំងក្នុង Incognito Mode
async function loadLocalDB() {
  if (localDB) {
    try {
      const d = await localDB.docs.toArray(); if (d) docsData = d;
      const t = await localDB.trainings.toArray(); if (t) trainingData = t;
      const disp = await localDB.dispatches.toArray(); if (disp) dispatchData = disp;
      const e = await localDB.exams.toArray(); if (e) examsData = e;
      const c = await localDB.certs.toArray(); if (c) certsData = c;
    } catch (e) { console.warn("Incognito IndexedDB Blocked. ដំណើរការធម្មតា។"); }
  }
}

async function syncFromSupabase(manual = false) {
  if (!db) return;
  try {
    const [rDocs, rDisp, rExam, rTrain, rCert] = await Promise.all([
      db.from('docs').select('*').limit(200), db.from('dispatches').select('*').limit(200),
      db.from('exams').select('*').limit(200), db.from('trainings').select('*').limit(200), db.from('certs').select('*').limit(200)
    ]);
    if (rDocs.data) { docsData = rDocs.data; if(localDB) try { await localDB.docs.bulkPut(docsData); } catch(e){} }
    if (rDisp.data) { dispatchData = rDisp.data; if(localDB) try { await localDB.dispatches.bulkPut(dispatchData); } catch(e){} }
    if (rExam.data) { examsData = rExam.data; if(localDB) try { await localDB.exams.bulkPut(examsData); } catch(e){} }
    if (rTrain.data) { trainingData = rTrain.data; if(localDB) try { await localDB.trainings.bulkPut(trainingData); } catch(e){} }
    if (rCert.data) { certsData = rCert.data; if(localDB) try { await localDB.certs.bulkPut(certsData); } catch(e){} }
    renderBureauWorkspace();
    if(manual) showToast("សមកាលកម្មទិន្នន័យជោគជ័យ!");
  } catch (e) {}
}

function checkAuth() {
  const loginModal = document.getElementById('modal-login'), appShell = document.getElementById('app-shell');
  if (!currentUser) {
    if (loginModal) loginModal.classList.remove('hidden');
    if (appShell) appShell.classList.add('hidden');
  } else {
    if (loginModal) loginModal.classList.add('hidden');
    if (appShell) appShell.classList.remove('hidden');
    document.getElementById('current-user-fullname').innerText = currentUser.fullname;
    
    if (currentUser.bureau !== 'all') {
      activeBureauKey = currentUser.bureau;
      document.getElementById('active-bureau-select').value = activeBureauKey;
      document.getElementById('active-bureau-select').disabled = true;
    } else {
      document.getElementById('active-bureau-select').disabled = false;
    }
    renderBureauWorkspace();
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const u = document.getElementById('login-username').value;
  const p = document.getElementById('login-password').value;
  try {
    currentUser = authenticateUser(u, p);
    localStorage.setItem('hrd_moh_session_cache', JSON.stringify(currentUser));
    checkAuth(); showToast('ចូលប្រព័ន្ធជោគជ័យ!'); syncFromSupabase(false);
  } catch (err) {
    const errEl = document.getElementById('login-error');
    if (errEl) { errEl.innerText = err.message; errEl.classList.remove('hidden'); }
  }
}

function renderBureauWorkspace() {
  const b = BUREAUS[activeBureauKey] || BUREAUS.bureau_1;
  document.getElementById('active-bureau-title').innerText = b.name;
  
  document.getElementById('bureau-tabs-nav').innerHTML = b.tabs.map(t => `<button onclick="window.app.switchBureauTab('${t.id}')" class="w-full flex px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${t.id === activeTab ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-emerald-50'}">${t.label}</button>`).join('');
  
  ['docs', 'dispatch', 'exams', 'training', 'certs'].forEach(s => { const el = document.getElementById('section-' + s); if(el) el.classList.add('hidden'); });
  const sel = document.getElementById('section-' + activeTab); if(sel) sel.classList.remove('hidden');
  
  renderSideForm(); renderDocs(); renderDispatch(); renderExams(); renderTraining(); renderCerts();
  initResizableTables();
}

function renderSideForm() {
  const cont = document.getElementById('side-form-container'); if(!cont) return;
  if (activeTab === 'training') cont.innerHTML = `<form onsubmit="window.app.saveTraining(event)" class="space-y-3"><input type="text" id="t-name" required placeholder="ឈ្មោះ" class="w-full border rounded-lg p-2"><button type="submit" class="w-full py-2 bg-emerald-600 text-white rounded-lg">រក្សាទុក</button></form>`;
  else if (activeTab === 'exams') cont.innerHTML = `<form onsubmit="window.app.saveExam(event)" class="space-y-3"><input type="text" id="e-major" required placeholder="ជំនាញ" class="w-full border rounded-lg p-2"><button type="submit" class="w-full py-2 bg-emerald-600 text-white rounded-lg">រក្សាទុក</button></form>`;
  else if (activeTab === 'certs') cont.innerHTML = `<form onsubmit="window.app.saveCert(event)" class="space-y-3"><input type="text" id="c-num" required placeholder="កូដសញ្ញាបត្រ" class="w-full border rounded-lg p-2"><button type="submit" class="w-full py-2 bg-emerald-600 text-white rounded-lg">រក្សាទុក</button></form>`;
  else if (activeTab === 'dispatch') cont.innerHTML = `<form onsubmit="window.app.saveDispatch(event)" class="space-y-3"><input type="text" id="d-code" required placeholder="លេខលិខិត" class="w-full border rounded-lg p-2"><button type="submit" class="w-full py-2 bg-emerald-600 text-white rounded-lg">រក្សាទុក</button></form>`;
  else cont.innerHTML = `<form onsubmit="window.app.saveDoc(event)" class="space-y-3"><input type="text" id="doc-code" required placeholder="កូដឯកសារ" class="w-full border rounded-lg p-2"><button type="submit" class="w-full py-2 bg-emerald-600 text-white rounded-lg">រក្សាទុក</button></form>`;
}

function renderDocs() {
  const tb = document.getElementById('docs-table-body'); if(!tb) return;
  document.getElementById('stat-bureau-docs').innerText = docsData.length;
  tb.innerHTML = docsData.map(d => `<tr><td class="p-3">${d.code}</td><td class="p-3">${d.title||'ឯកសារ'}</td><td class="p-3">${d.category||'ទូទៅ'}</td><td class="p-3">Cloud</td><td class="p-3"><button onclick="window.app.deleteItem('docs', ${d.id})" class="text-rose-600">លុប</button></td></tr>`).join('') || `<tr><td colspan="5" class="p-4 text-center">គ្មានឯកសារ</td></tr>`;
}
function renderDispatch() {
  const tb = document.getElementById('dispatch-table-body'); if(!tb) return;
  document.getElementById('stat-bureau-disp').innerText = dispatchData.length;
  tb.innerHTML = dispatchData.map(d => `<tr><td class="p-3">ចូល</td><td class="p-3">${d.code}</td><td class="p-3">លិខិត</td><td class="p-3">រដ្ឋបាល</td><td class="p-3"><button onclick="window.app.deleteItem('dispatches', ${d.id})" class="text-rose-600">លុប</button></td></tr>`).join('');
}
function renderExams() { const tb = document.getElementById('exams-table-body'); if(tb) tb.innerHTML = examsData.map(e => `<tr><td class="p-3">ប្រឡង</td><td class="p-3">${e.major}</td><td class="p-3">2026</td><td class="p-3">100</td><td class="p-3 text-rose-600 cursor-pointer" onclick="window.app.deleteItem('exams', ${e.id})">លុប</td></tr>`).join(''); }
function renderTraining() { const tb = document.getElementById('training-table-body'); if(tb) tb.innerHTML = trainingData.map(t => `<tr><td class="p-3">${t.trainee}</td><td class="p-3">អង្គភាព</td><td class="p-3">វគ្គ</td><td class="p-3">កម្ពុជា</td><td class="p-3 text-rose-600 cursor-pointer" onclick="window.app.deleteItem('trainings', ${t.id})">លុប</td></tr>`).join(''); }
function renderCerts() { const tb = document.getElementById('certs-table-body'); if(tb) tb.innerHTML = certsData.map(c => `<tr><td class="p-3">${c.num}</td><td class="p-3">មន្ត្រី</td><td class="p-3">សញ្ញាបត្រ</td><td class="p-3 text-rose-600 cursor-pointer" onclick="window.app.deleteItem('certs', ${c.id})">លុប</td></tr>`).join(''); }

async function saveDoc(e) { e.preventDefault(); const n = { id: Date.now(), code: document.getElementById('doc-code').value }; docsData.push(n); if(db) await db.from('docs').insert([n]); renderDocs(); showToast('ជោគជ័យ'); }
async function saveDispatch(e) { e.preventDefault(); const n = { id: Date.now(), code: document.getElementById('d-code').value }; dispatchData.push(n); if(db) await db.from('dispatches').insert([n]); renderDispatch(); showToast('ជោគជ័យ'); }
async function saveExam(e) { e.preventDefault(); const n = { id: Date.now(), major: document.getElementById('e-major').value }; examsData.push(n); if(db) await db.from('exams').insert([n]); renderExams(); showToast('ជោគជ័យ'); }
async function saveTraining(e) { e.preventDefault(); const n = { id: Date.now(), trainee: document.getElementById('t-name').value }; trainingData.push(n); if(db) await db.from('trainings').insert([n]); renderTraining(); showToast('ជោគជ័យ'); }
async function saveCert(e) { e.preventDefault(); const n = { id: Date.now(), num: document.getElementById('c-num').value }; certsData.push(n); if(db) await db.from('certs').insert([n]); renderCerts(); showToast('ជោគជ័យ'); }

async function deleteItem(table, id) {
  if(!confirm('លុបទិន្នន័យនេះ?')) return;
  if(db) await db.from(table).delete().eq('id', id);
  if(table==='docs') docsData = docsData.filter(x=>x.id!==id);
  if(table==='dispatches') dispatchData = dispatchData.filter(x=>x.id!==id);
  if(table==='exams') examsData = examsData.filter(x=>x.id!==id);
  if(table==='trainings') trainingData = trainingData.filter(x=>x.id!==id);
  if(table==='certs') certsData = certsData.filter(x=>x.id!==id);
  renderBureauWorkspace(); showToast('លុបជោគជ័យ');
}

window.app = {
  handleLogin, handleLogout: () => { currentUser = null; localStorage.removeItem('hrd_moh_session_cache'); checkAuth(); },
  changeActiveBureau: (k) => { activeBureauKey = k; activeTab = 'docs'; renderBureauWorkspace(); },
  switchBureauTab: (t) => { activeTab = t; renderBureauWorkspace(); },
  toggleSidebarCollapse: () => document.getElementById('app-sidebar')?.classList.toggle('collapsed'),
  syncFromSupabase, saveDoc, saveDispatch, saveExam, saveTraining, saveCert, deleteItem,
  exportCSV: () => { showToast('Exporting...'); }, exportTrainingExcel: () => { showToast('Exporting Excel...'); },
  openPrintPreviewModal: () => { document.getElementById('modal-print-preview').classList.remove('hidden'); },
  openSystemModal: (t) => { document.getElementById('modal-system-tools').classList.remove('hidden'); },
  switchSystemToolTab: (t) => { ['settings','location','files','logging'].forEach(x => document.getElementById('syscontent-'+x)?.classList.add('hidden')); document.getElementById('syscontent-'+t)?.classList.remove('hidden'); },
  openProfileModal: () => { document.getElementById('profile-modal-username').innerText = '@'+currentUser.username; document.getElementById('modal-user-profile').classList.remove('hidden'); },
  toggleScannerModal: (v) => { if(v) document.getElementById('modal-scanner').classList.remove('hidden'); else document.getElementById('modal-scanner').classList.add('hidden'); }
};

window.addEventListener('DOMContentLoaded', async () => {
  // ប្រព័ន្ធការពារការគាំងនៅពេល Load ដំបូង
  try {
    await loadLocalDB();
    const session = localStorage.getItem('hrd_moh_session_cache');
    if (session) currentUser = JSON.parse(session);
  } catch (e) {
    console.error("Local Error", e);
  } finally {
    // ធានាថាទោះគាំងអ្វីក៏ដោយ ក៏ផ្ទាំង Login ឬ Dashboard ត្រូវតែបង្ហាញចេញមក
    checkAuth(); 
  }
});
