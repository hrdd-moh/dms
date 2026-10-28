import { db, localDB } from './config.js';
import { authenticateUser } from './auth.js';
import { initResizableTables } from './workflow.js';

let currentUser = null;
let docsData = [];
let activeBureauKey = 'bureau_1';

function checkAuth() {
  const loginModal = document.getElementById('modal-login');
  const appShell = document.getElementById('app-shell');
  
  if (!currentUser || !currentUser.username) {
    if (loginModal) loginModal.classList.remove('hidden');
    if (appShell) appShell.classList.add('hidden');
  } else {
    if (loginModal) loginModal.classList.add('hidden');
    if (appShell) appShell.classList.remove('hidden');
    document.getElementById('current-user-fullname').innerText = currentUser.fullname;
    renderDocs();
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const u = document.getElementById('login-username').value;
  const p = document.getElementById('login-password').value;
  try {
    currentUser = await authenticateUser(u, p);
    localStorage.setItem('hrd_moh_session_cache', JSON.stringify(currentUser));
    checkAuth();
  } catch (err) {
    const errEl = document.getElementById('login-error');
    if (errEl) {
      errEl.innerText = err.message;
      errEl.classList.remove('hidden');
    }
  }
}

function handleLogout() {
  currentUser = null;
  localStorage.removeItem('hrd_moh_session_cache');
  checkAuth();
}

function renderDocs() {
  const tbody = document.getElementById('docs-table-body');
  if (!tbody) return;
  tbody.innerHTML = docsData.map(d => `<tr><td class="p-3">${d.code}</td><td class="p-3">${d.title}</td><td class="p-3">${d.category}</td></tr>`).join('') || '<tr><td colspan="3" class="p-4 text-center text-slate-400">មិនមានឯកសារឡើយ</td></tr>';
}

window.app = {
  handleLogin,
  handleLogout,
  changeActiveBureau: (k) => { activeBureauKey = k; },
  switchBureauTab: () => {}
};

window.addEventListener('DOMContentLoaded', () => {
  try {
    const session = localStorage.getItem('hrd_moh_session_cache');
    if (session) currentUser = JSON.parse(session);
  } catch (e) {}
  checkAuth();
  initResizableTables();
});
