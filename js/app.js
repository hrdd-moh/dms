import { db, localDB } from './config.js';
import { authenticateUser } from './auth.js';

let docsData = [], dispatchData = [];
let currentUser = null;
let activeBureauKey = 'all';
let activeTab = 'docs';

const BUREAUS = {
  all: { id: 'all', name: 'ការិយាល័យទាំង ៣ (All Bureaus)', shortName: 'ការិយាល័យទាំង ៣', desc: 'ត្រួតពិនិត្យទិន្នន័យរួមនៃការិយាល័យទាំង ៣', tabs: [{ id: 'docs', icon: '📚', label: 'បណ្ណាល័យរួម' }, { id: 'dispatch', icon: '🔄', label: 'លិខិតចេញ-ចូល' }] },
  bureau_1: { id: 'bureau_1', name: 'ការិយាល័យបណ្តុះបណ្តាលមុនពេលបម្រើការងារ', shortName: 'ការិយាល័យទី១', desc: 'គ្រប់គ្រងបណ្ណាល័យ និងលិខិត', tabs: [{ id: 'docs', icon: '📚', label: 'បណ្ណាល័យរួម' }, { id: 'dispatch', icon: '🔄', label: 'លិខិតចេញ-ចូល' }] },
  bureau_2: { id: 'bureau_2', name: 'ការិយាល័យបណ្តុះបណ្តាលបន្ត', shortName: 'ការិយាល័យទី២', desc: 'គ្រប់គ្រងបណ្ណាល័យ និងលិខិត', tabs: [{ id: 'docs', icon: '📚', label: 'បណ្ណាល័យរួម' }, { id: 'dispatch', icon: '🔄', label: 'លិខិតចេញ-ចូល' }] },
  bureau_3: { id: 'bureau_3', name: 'ការិយាល័យចុះបញ្ជិកា និងវិញ្ញាបនបត្រ', shortName: 'ការិយាល័យទី៣', desc: 'គ្រប់គ្រងបណ្ណាល័យ និងលិខិត', tabs: [{ id: 'docs', icon: '📚', label: 'បណ្ណាល័យរួម' }, { id: 'dispatch', icon: '🔄', label: 'លិខិតចេញ-ចូល' }] }
};

function showToast(msg) {
  const cont = document.getElementById('toast-container');
  if (!cont) return;
  const el = document.createElement('div');
  el.className = 'bg-emerald-600 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl';
  el.innerHTML = `✅ ${msg}`;
  cont.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

async function loadLocalState() {
  try {
    docsData = await localDB.docs.reverse().toArray();
    dispatchData = await localDB.dispatches.reverse().toArray();
  } catch (e) {}
}

async function syncFromSupabase() {
  if (!db) return;
  try {
    const [rDocs, rDisp] = await Promise.all([
      db.from('docs').select('*').order('id', { ascending: false }).limit(200),
      db.from('dispatches').select('*').order('id', { ascending: false }).limit(200)
    ]);
    if (rDocs.data) docsData = rDocs.data;
    if (rDisp.data) dispatchData = rDisp.data;
    renderWorkspace();
  } catch (e) {}
}

function renderWorkspace() {
  const b = BUREAUS[activeBureauKey] || BUREAUS.all;
  const titleEl = document.getElementById('active-bureau-title');
  const descEl = document.getElementById('active-bureau-desc');
  const badgeEl = document.getElementById('stat-bureau-badge');
  const navEl = document.getElementById('bureau-tabs-nav');

  if (titleEl) titleEl.innerText = b.name;
  if (descEl) descEl.innerText = b.desc;
  if (badgeEl) badgeEl.innerText = b.shortName;

  if (navEl) {
    navEl.innerHTML = b.tabs.map(t => `
      <button onclick="window.app.switchBureauTab('${t.id}')" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${t.id === activeTab ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-emerald-50'}">
        <span class="text-lg">${t.icon}</span><span>${t.label}</span>
      </button>
    `).join('');
  }

  ['docs', 'dispatch'].forEach(s => document.getElementById('section-' + s)?.classList.add('hidden'));
  document.getElementById('section-' + activeTab)?.classList.remove('hidden');

  renderDocs();
  renderDispatch();
}

function renderDocs() {
  const tbody = document.getElementById('docs-table-body');
  if (!tbody) return;
  const filtered = docsData.filter(d => !d.deleted_at);
  const statDocs = document.getElementById('stat-bureau-docs');
  if (statDocs) statDocs.innerText = filtered.length;

  tbody.innerHTML = filtered.map(d => `
    <tr class="hover:bg-emerald-50/60 transition">
      <td class="p-3 font-mono font-bold text-xs">${d.code || '-'}</td>
      <td class="p-3 font-bold text-slate-900">${d.title || ''}</td>
      <td class="p-3 text-center"><span class="px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700">${d.category || 'ឯកសារ'}</span></td>
      <td class="p-3 text-center"><span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Cloud</span></td>
      <td class="p-3 text-center">
        ${d.drive_link ? `<a href="${d.drive_link}" target="_blank" class="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold">👁️ មើល</a>` : '-'}
      </td>
    </tr>
  `).join('') || '<tr><td colspan="5" class="p-6 text-center text-slate-400">មិនមានឯកសារឡើយ</td></tr>';
}

function renderDispatch() {
  const tbody = document.getElementById('dispatch-table-body');
  if (!tbody) return;
  const filtered = dispatchData.filter(d => !d.deleted_at);
  const statDisp = document.getElementById('stat-bureau-disp');
  if (statDisp) statDisp.innerText = filtered.length;

  tbody.innerHTML = filtered.map(d => `
    <tr class="hover:bg-emerald-50/60 transition">
      <td class="p-3"><span class="px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-100 text-blue-800">${d.type || 'ចូល'}</span></td>
      <td class="p-3 font-mono font-bold text-xs">${d.code || '-'}</td>
      <td class="p-3 font-bold text-slate-900">${d.title || ''}</td>
      <td class="p-3 text-center"><span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800">${d.stage || 'រដ្ឋបាល'}</span></td>
      <td class="p-3 text-xs font-bold text-emerald-800">${d.location || 'ការិយាល័យ'}</td>
    </tr>
  `).join('') || '<tr><td colspan="5" class="p-6 text-center text-slate-400">មិនទាន់មានលិខិតឡើយ</td></tr>';
}

async function handleLogin(e) {
  e.preventDefault();
  const u = document.getElementById('login-username').value;
  const p = document.getElementById('login-password').value;
  try {
    currentUser = await authenticateUser(u, p);
    localStorage.setItem('hrd_moh_session', JSON.stringify(currentUser));
    document.getElementById('modal-login').classList.add('hidden');
    document.getElementById('app-shell').classList.remove('hidden');
    document.getElementById('current-user-fullname').innerText = currentUser.fullname;
    document.getElementById('current-user-role').innerText = currentUser.role;
    renderWorkspace();
    showToast('ចូលប្រព័ន្ធជោគជ័យ!');
    syncFromSupabase();
  } catch (err) {
    const errEl = document.getElementById('login-error');
    if (errEl) {
      errEl.innerText = err.message;
      errEl.classList.remove('hidden');
    }
  }
}

window.app = {
  handleLogin,
  changeActiveBureau: (k) => { activeBureauKey = k; activeTab = 'docs'; renderWorkspace(); },
  switchBureauTab: (t) => { activeTab = t; renderWorkspace(); },
  toggleSidebarCollapse: () => document.getElementById('app-sidebar')?.classList.toggle('collapsed'),
  renderDocs, syncFromSupabase
};

window.addEventListener('DOMContentLoaded', async () => {
  await loadLocalState();
  const session = localStorage.getItem('hrd_moh_session');
  if (session) {
    currentUser = JSON.parse(session);
    document.getElementById('modal-login').classList.add('hidden');
    document.getElementById('app-shell').classList.remove('hidden');
    document.getElementById('current-user-fullname').innerText = currentUser.fullname;
    document.getElementById('current-user-role').innerText = currentUser.role;
    renderWorkspace();
    syncFromSupabase();
  }
});
