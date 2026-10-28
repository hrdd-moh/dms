
import { db, localDB } from './config.js';
import { signInWithSupabaseAuth } from './auth.js';
import {
  editingState, startEditRecord, cancelEditMode,
  paginationState, paginateArray, renderPaginationBarHTML,
  softDeleteRecord, restoreFromRecycleBin, permanentDeleteRecord,
  updateDispatchStageWorkflow, getDispatchWorkflowHistory,
  runAutoBackupSnapshot, restoreSystemFromJsonFile, getOverdueDispatches
} from './workflow.js';

const BUREAUS = {
  all: { id: 'all', name: 'ការិយាល័យទាំង ៣ (All Bureaus)', shortName: 'ការិយាល័យទាំង ៣', desc: 'ត្រួតពិនិត្យបណ្ណាល័យរួម លិខិតចេញ-ចូល និងការងារជំនាញទាំង ៣ ការិយាល័យ', tabs: [{ id: 'docs', icon: '📚', label: 'បណ្ណាល័យរួម' }, { id: 'dispatch', icon: '🔄', label: 'ឯកសារចេញ-ចូល (ទាំង ៣)' }, { id: 'exams', icon: '🎓', label: 'ការប្រឡងថ្នាក់ជាតិ' }, { id: 'training', icon: '🌐', label: 'បណ្តុះបណ្តាលបន្ត' }, { id: 'certs', icon: '📜', label: 'ចុះបញ្ជីសញ្ញាបត្រ' }] },
  bureau_1: { id: 'bureau_1', name: 'ការិយាល័យបណ្តុះបណ្តាលមុនពេលបម្រើការងារ', shortName: 'ការិយាល័យទី១', desc: 'គ្រប់គ្រងបណ្ណាល័យ លិខិតចេញ-ចូល និងការប្រឡងថ្នាក់ជាតិ', tabs: [{ id: 'docs', icon: '📚', label: 'បណ្ណាល័យរួម' }, { id: 'dispatch', icon: '🔄', label: 'ឯកសារចេញ-ចូល' }, { id: 'exams', icon: '🎓', label: 'ការប្រឡងចូល និងចេញ' }] },
  bureau_2: { id: 'bureau_2', name: 'ការិយាល័យបណ្តុះបណ្តាលបន្ត', shortName: 'ការិយាល័យទី២', desc: 'គ្រប់គ្រងបណ្ណាល័យ លិខិតចេញ-ចូល និងវគ្គបណ្តុះបណ្តាលបន្ត', tabs: [{ id: 'docs', icon: '📚', label: 'បណ្ណាល័យរួម' }, { id: 'dispatch', icon: '🔄', label: 'ឯកសារចេញ-ចូល' }, { id: 'training', icon: '🌐', label: 'បណ្តុះបណ្តាលបន្ត' }] },
  bureau_3: { id: 'bureau_3', name: 'ការិយាល័យចុះបញ្ជិកា និងវិញ្ញាបនបត្រ', shortName: 'ការិយាល័យទី៣', desc: 'គ្រប់គ្រងបណ្ណាល័យ លិខិតចេញ-ចូល និងការចុះបញ្ជីសញ្ញាបត្រ', tabs: [{ id: 'docs', icon: '📚', label: 'បណ្ណាល័យរួម' }, { id: 'dispatch', icon: '🔄', label: 'ឯកសារចេញ-ចូល' }, { id: 'certs', icon: '📜', label: 'ចុះបញ្ជីសញ្ញាបត្រ' }] }
};

const defaultUsers = [
  { id: 1, username: 'admin', password: 'admin123', altPass: '123', fullname: 'ថ្នាក់ដឹកនាំរដ្ឋបាល', role: 'SuperAdmin', status: 'Active', bureau: 'all', permissions: { admin: true } },
  { id: 2, username: 'user1', password: '123', fullname: 'មន្ត្រីមុនពេលបម្រើការងារ', role: 'Editor', status: 'Active', bureau: 'bureau_1', permissions: { admin: false } },
  { id: 3, username: 'user2', password: '123', fullname: 'មន្ត្រីបណ្តុះបណ្តាលបន្ត', role: 'Editor', status: 'Active', bureau: 'bureau_2', permissions: { admin: false } },
  { id: 4, username: 'user3', password: '123', fullname: 'មន្ត្រីចុះបញ្ជិកា', role: 'Editor', status: 'Active', bureau: 'bureau_3', permissions: { admin: false } }
];

let docsData = [], dispatchData = [], examsData = [], trainingData = [], certsData = [];
let currentUser = null;
let activeBureauKey = localStorage.getItem('hrd_moh_active_bureau_cache') || 'all';
let activeTab = 'docs';

function showToast(msg, isWarn = false) {
  const cont = document.getElementById('toast-container');
  if (!cont) return;
  const el = document.createElement('div');
  el.className = `flex items-center gap-2 ${isWarn ? 'bg-amber-600' : 'bg-emerald-600'} text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl`;
  el.innerHTML = `<span>${isWarn ? '⚠️' : '✅'}</span> <span>${msg}</span>`;
  cont.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

async function loadLocalState() {
  docsData = await localDB.docs.reverse().toArray();
  dispatchData = await localDB.dispatches.reverse().toArray();
  trainingData = await localDB.trainings.reverse().toArray();
  examsData = await localDB.exams.reverse().toArray();
  certsData = await localDB.certs.reverse().toArray();
}

async function syncFromSupabase(isManual = false) {
  if (!db) return;
  try {
    const [rDocs, rDisp, rTrain, rExams, rCerts] = await Promise.allSettled([
      db.from('docs').select('*').order('id', { ascending: false }).limit(300),
      db.from('dispatches').select('*').order('id', { ascending: false }).limit(300),
      db.from('trainings').select('*').order('id', { ascending: false }).limit(300),
      db.from('exams').select('*').order('id', { ascending: false }).limit(300),
      db.from('certs').select('*').order('id', { ascending: false }).limit(300)
    ]);

    if (rDocs.status === 'fulfilled' && Array.isArray(rDocs.value?.data)) {
      docsData = rDocs.value.data.map(d => ({ ...d, fileSize: d.file_size || d.fileSize || '1 MB', driveLink: d.drive_link || d.driveLink || '' }));
      await localDB.docs.bulkPut(docsData);
    }
    if (rDisp.status === 'fulfilled' && Array.isArray(rDisp.value?.data)) {
      dispatchData = rDisp.value.data;
      await localDB.dispatches.bulkPut(dispatchData);
    }
    if (rTrain.status === 'fulfilled' && Array.isArray(rTrain.value?.data)) {
      trainingData = rTrain.value.data;
      await localDB.trainings.bulkPut(trainingData);
    }
    if (rExams.status === 'fulfilled' && Array.isArray(rExams.value?.data)) {
      examsData = rExams.value.data;
      await localDB.exams.bulkPut(examsData);
    }
    if (rCerts.status === 'fulfilled' && Array.isArray(rCerts.value?.data)) {
      certsData = rCerts.value.data;
      await localDB.certs.bulkPut(certsData);
    }

    // អាទិភាពទី 7: ធ្វើ Auto-Backup ស្វ័យប្រវត្តិទុកក្នុង IndexedDB
    await runAutoBackupSnapshot({ documents: docsData, dispatches: dispatchData, trainings: trainingData, exams: examsData, certificates: certsData });

    if (currentUser) renderWorkspace();
    if (isManual) showToast('បានធ្វើសមកាលកម្មទិន្នន័យជាមួយ Cloud ជោគជ័យ!');
  } catch (e) {}
}

// ============================================================================
// ការគូរតារាងជាមួយ PAGINATION, EDIT MODE & OVERDUE ALERTS
// ============================================================================
function changePage(tableKey, newPage) {
  if (!paginationState[tableKey]) return;
  paginationState[tableKey].page = Math.max(1, newPage);
  renderWorkspace();
}

function renderDocs() {
  const tbody = document.getElementById('docs-table-body');
  if (!tbody) return;
  const q = (document.getElementById('doc-search')?.value || '').toLowerCase();
  const activeItems = docsData.filter(d => !d.deleted_at && d.code !== '__SYSTEM_USERS_REGISTRY__')
    .filter(d => !q || (d.title && d.title.toLowerCase().includes(q)) || (d.code && d.code.toLowerCase().includes(q)));

  document.getElementById('stat-bureau-docs').innerText = activeItems.length;
  const meta = paginateArray(activeItems, 'docs');

  tbody.innerHTML = meta.pagedItems.map(d => `
    <tr class="hover:bg-emerald-50/60 transition">
      <td class="p-3 font-mono font-bold text-xs">${d.code}</td>
      <td class="p-3 font-bold text-slate-900">${d.title}</td>
      <td class="p-3 text-center"><span class="px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700">${d.category}</span></td>
      <td class="p-3 text-center"><span class="px-2.5 py-0.5 rounded-full text-xs font-bold ${d.driveLink ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">${d.driveLink ? '☁️ In Cloud' : 'Record'}</span></td>
      <td class="p-3 text-xs font-bold text-slate-600">${BUREAUS[d.bureau]?.shortName || d.bureau}</td>
      <td class="p-3 text-center whitespace-nowrap space-x-1.5">
        ${d.driveLink ? `<a href="${d.driveLink}" target="_blank" class="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold">👁️ មើល</a>` : ''}
        <button onclick="window.app.editDoc(${d.id})" class="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold">✏️ កែប្រែ</button>
        <button onclick="window.app.trashRecord('docs', ${d.id})" class="px-2.5 py-1 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold">🗑️ លុប</button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="6" class="p-6 text-center text-slate-400">មិនមានឯកសារឡើយ</td></tr>';

  document.getElementById('docs-pagination-bar').innerHTML = renderPaginationBarHTML('docs', meta, 'window.app.changePage');
}

function renderDispatch() {
  const tbody = document.getElementById('dispatch-table-body');
  if (!tbody) return;
  const q = (document.getElementById('filter-disp-search')?.value || '').toLowerCase();
  const isAdmin = currentUser?.role === 'SuperAdmin' || currentUser?.bureau === 'all';
  const viewBureau = isAdmin ? activeBureauKey : currentUser.bureau;

  const activeItems = dispatchData.filter(d => !d.deleted_at)
    .filter(d => viewBureau === 'all' || d.bureau === viewBureau)
    .filter(d => !q || (d.code && d.code.toLowerCase().includes(q)) || (d.title && d.title.toLowerCase().includes(q)));

  document.getElementById('stat-bureau-disp').innerText = activeItems.filter(d => d.stage !== 'បញ្ចប់រួចរាល់').length;

  // អាទិភាពទី 8: គណនាលិខិតហួសកាលកំណត់ (Overdue Dispatches)
  const overdueList = getOverdueDispatches(activeItems, viewBureau);
  const pill = document.getElementById('overdue-alert-pill');
  if (overdueList.length > 0) {
    pill.classList.remove('hidden');
    document.getElementById('overdue-count-text').innerText = `${overdueList.length} លិខិតហួសកំណត់`;
    document.getElementById('stat-overdue-sub').innerText = `⚠️ មាន ${overdueList.length} លិខិតហួសកំណត់`;
    document.getElementById('stat-overdue-sub').className = 'inline-block mt-1 text-[10px] text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md font-bold';
  } else {
    pill.classList.add('hidden');
  }

  const overdueIds = new Set(overdueList.map(o => o.id));
  const meta = paginateArray(activeItems, 'dispatches');

  tbody.innerHTML = meta.pagedItems.map(d => {
    const isOverdue = overdueIds.has(d.id);
    return `
      <tr class="hover:bg-emerald-50/60 transition ${isOverdue ? 'bg-rose-50/40' : ''}">
        <td class="p-3"><span class="px-2.5 py-0.5 rounded-md text-xs font-bold ${d.type === 'ចូល' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}">${d.type}</span></td>
        <td class="p-3 font-mono font-bold text-xs">${d.code}</td>
        <td class="p-3 font-bold text-slate-900">${d.title} ${isOverdue ? '<span class="ml-1 px-2 py-0.5 bg-rose-600 text-white text-[10px] rounded-full">⚠️ ហួសកំណត់</span>' : ''}</td>
        <td class="p-3 text-center"><span class="px-2.5 py-0.5 rounded-full text-xs font-bold ${d.stage === 'បញ្ចប់រួចរាល់' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-50 text-amber-800 border border-amber-200'}">${d.stage}</span></td>
        <td class="p-3 text-xs font-bold text-emerald-800">${d.location}</td>
        <td class="p-3 text-center font-mono text-xs ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'}">${d.due_date || d.date || '-'}</td>
        <td class="p-3 text-center whitespace-nowrap space-x-1">
          <button onclick="window.app.openWorkflowHistory(${d.id})" class="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold">🕒 ប្រវត្តិ</button>
          <button onclick="window.app.editDispatch(${d.id})" class="px-2 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold">✏️ កែប្រែ</button>
          <button onclick="window.app.trashRecord('dispatches', ${d.id})" class="px-2 py-1 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold">🗑️</button>
        </td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="7" class="p-6 text-center text-slate-400">មិនទាន់មានលិខិតឡើយ</td></tr>';

  document.getElementById('dispatches-pagination-bar').innerHTML = renderPaginationBarHTML('dispatches', meta, 'window.app.changePage');
}

// ============================================================================
// បង្ហាញប្រវត្តិលំហូរលិខិត (STAGE WORKFLOW HISTORY MODAL - អាទិភាពទី 6)
// ============================================================================
async function openWorkflowHistory(dispId) {
  const history = await getDispatchWorkflowHistory(dispId);
  const listEl = document.getElementById('workflow-history-list');
  if (history.length === 0) {
    listEl.innerHTML = '<div class="p-4 text-center text-slate-400">មិនទាន់មានប្រវត្តិផ្លាស់ប្តូរដំណាក់កាលឡើយ</div>';
  } else {
    listEl.innerHTML = history.map(h => `
      <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
        <div class="flex justify-between font-bold text-emerald-800">
          <span>${h.old_stage ? `${h.old_stage} ➔ ` : ''}${h.new_stage}</span>
          <span class="text-[10px] text-slate-400 font-mono">${h.changed_at}</span>
        </div>
        <div class="text-slate-600">📍 ទីតាំង៖ <b>${h.new_location}</b> (ដោយ៖ @${h.changed_by})</div>
      </div>
    `).join('');
  }
  document.getElementById('modal-workflow-history').classList.remove('hidden');
}

// ============================================================================
// EDIT RECORD & FORM SUBMISSION (អាទិភាពទី 2)
// ============================================================================
function renderSideForm() {
  const cont = document.getElementById('side-form-container');
  if (!cont) return;
  if (activeTab === 'dispatch') {
    cont.innerHTML = `
      <form onsubmit="window.app.saveDispatchForm(event)" class="space-y-3 text-xs font-medium">
        <div class="grid grid-cols-2 gap-2">
          <div><label class="block font-bold mb-1">ប្រភេទ</label><select id="f-disp-type" class="w-full border border-slate-300 rounded-xl p-2"><option value="ចូល">📥 ចូល</option><option value="ចេញ">📤 ចេញ</option></select></div>
          <div><label class="block font-bold mb-1">លេខលិខិត *</label><input type="text" id="f-disp-code" required class="w-full border border-slate-300 rounded-xl p-2"></div>
        </div>
        <div><label class="block font-bold mb-1">កម្មវត្ថុ / ខ្លឹមសារ *</label><input type="text" id="f-disp-title" required class="w-full border border-slate-300 rounded-xl p-2"></div>
        <div><label class="block font-bold mb-1">ដំណាក់កាល (Stage Workflow)</label><select id="f-disp-stage" class="w-full border border-slate-300 rounded-xl p-2"><option value="រដ្ឋបាលទទួល">រដ្ឋបាលទទួល</option><option value="កំពុងពិនិត្យបច្ចេកទេស">កំពុងពិនិត្យបច្ចេកទេស</option><option value="រង់ចាំចំណារ/ហត្ថលេខា">រង់ចាំចំណារ/ហត្ថលេខា</option><option value="បញ្ចប់រួចរាល់">បញ្ចប់រួចរាល់</option></select></div>
        <div><label class="block font-bold mb-1">ទីតាំងបច្ចុប្បន្ន</label><select id="f-disp-loc" class="w-full border border-slate-300 rounded-xl p-2"><option value="ការិយាល័យសាមី">ការិយាល័យសាមី</option><option value="ប្រធាននាយកដ្ឋាន (DHRD)">ប្រធាននាយកដ្ឋាន (DHRD)</option><option value="អគ្គនាយកដ្ឋានសុខាភិបាល">អគ្គនាយកដ្ឋានសុខាភិបាល</option><option value="ខុទ្ទកាល័យឯកឧត្តមរដ្ឋមន្ត្រី">ខុទ្ទកាល័យឯកឧត្តមរដ្ឋមន្ត្រី</option></select></div>
        <div class="grid grid-cols-2 gap-2">
          <div><label class="block font-bold mb-1">ថ្ងៃទទួល *</label><input type="date" id="f-disp-date" required class="w-full border border-slate-300 rounded-xl p-2"></div>
          <div><label class="block font-bold text-rose-700 mb-1">⏰ ថ្ងៃផុតកំណត់</label><input type="date" id="f-disp-due" required class="w-full border border-rose-300 rounded-xl p-2 bg-rose-50/30"></div>
        </div>
        <div class="flex gap-2 pt-2">
          <button type="submit" class="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition"><span>➕ រក្សាទុកលិខិត</span></button>
          <button type="button" onclick="window.app.cancelEdit()" class="px-3 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold">✕</button>
        </div>
      </form>
    `;
  } else {
    cont.innerHTML = `
      <form onsubmit="window.app.saveDocForm(event)" class="space-y-3 text-xs font-medium">
        <div><label class="block font-bold mb-1">កូដឯកសារ *</label><input type="text" id="f-doc-code" required class="w-full border border-slate-300 rounded-xl p-2" placeholder="DOC-2026-001"></div>
        <div><label class="block font-bold mb-1">ប្រភេទឯកសារ</label><select id="f-doc-cat" class="w-full border border-slate-300 rounded-xl p-2"><option value="ឯកសារបទដ្ឋាន">ឯកសារបទដ្ឋាន</option><option value="កម្មវិធីបណ្តុះបណ្តាល">កម្មវិធីបណ្តុះបណ្តាល</option><option value="វិញ្ញាសា/របាយការណ៍">វិញ្ញាសា/របាយការណ៍</option><option value="សេចក្តីណែនាំ">សេចក្តីណែនាំ</option></select></div>
        <div><label class="block font-bold mb-1">ចំណងជើងឯកសារ *</label><input type="text" id="f-doc-title" required class="w-full border border-slate-300 rounded-xl p-2"></div>
        <div class="flex gap-2 pt-2">
          <button type="submit" class="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition"><span>➕ រក្សាទុកឯកសារ</span></button>
          <button type="button" onclick="window.app.cancelEdit()" class="px-3 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold">✕</button>
        </div>
      </form>
    `;
  }
}

function editDoc(id) {
  const rec = docsData.find(d => d.id === id);
  if (!rec) return;
  startEditRecord('docs', rec, (r) => {
    document.getElementById('f-doc-code').value = r.code || '';
    document.getElementById('f-doc-cat').value = r.category || 'ឯកសារបទដ្ឋាន';
    document.getElementById('f-doc-title').value = r.title || '';
  });
}

async function saveDocForm(e) {
  e.preventDefault();
  const code = document.getElementById('f-doc-code').value.trim();
  const category = document.getElementById('f-doc-cat').value;
  const title = document.getElementById('f-doc-title').value.trim();

  if (editingState.table === 'docs' && editingState.id) {
    const idx = docsData.findIndex(d => d.id === editingState.id);
    if (idx !== -1) {
      docsData[idx] = { ...docsData[idx], code, category, title };
      await localDB.docs.put(docsData[idx]);
      if (db) await db.from('docs').update({ code, category, title }).eq('id', editingState.id);
      showToast('បានកែប្រែឯកសារជោគជ័យ!');
    }
  } else {
    const newDoc = { id: Math.floor(100000 + Math.random() * 900000000), bureau: activeBureauKey === 'all' ? 'bureau_1' : activeBureauKey, code, category, title, fileSize: '1.0 MB', storage: '☁️ Cloud' };
    docsData.unshift(newDoc);
    await localDB.docs.put(newDoc);
    if (db) await db.from('docs').insert([{ id: newDoc.id, bureau: newDoc.bureau, code, category, title, file_size: '1.0 MB' }]);
    showToast('បានបន្ថែមឯកសារថ្មីជោគជ័យ!');
  }
  cancelEditMode(() => renderSideForm());
  renderDocs();
}

function editDispatch(id) {
  const rec = dispatchData.find(d => d.id === id);
  if (!rec) return;
  startEditRecord('dispatches', rec, (r) => {
    document.getElementById('f-disp-type').value = r.type || 'ចូល';
    document.getElementById('f-disp-code').value = r.code || '';
    document.getElementById('f-disp-title').value = r.title || '';
    document.getElementById('f-disp-stage').value = r.stage || 'រដ្ឋបាលទទួល';
    document.getElementById('f-disp-loc').value = r.location || 'ការិយាល័យសាមី';
    document.getElementById('f-disp-date').value = r.date || '';
    document.getElementById('f-disp-due').value = r.due_date || '';
  });
}

async function saveDispatchForm(e) {
  e.preventDefault();
  const type = document.getElementById('f-disp-type').value;
  const code = document.getElementById('f-disp-code').value.trim();
  const title = document.getElementById('f-disp-title').value.trim();
  const stage = document.getElementById('f-disp-stage').value;
  const location = document.getElementById('f-disp-loc').value;
  const date = document.getElementById('f-disp-date').value;
  const due_date = document.getElementById('f-disp-due').value;

  if (editingState.table === 'dispatches' && editingState.id) {
    await updateDispatchStageWorkflow(editingState.id, stage, location, 'កែប្រែតាមរយៈផ្ទាំង Edit', currentUser?.username);
    const idx = dispatchData.findIndex(d => d.id === editingState.id);
    if (idx !== -1) {
      dispatchData[idx] = { ...dispatchData[idx], type, code, title, stage, location, date, due_date };
      await localDB.dispatches.put(dispatchData[idx]);
      if (db) await db.from('dispatches').update({ type, code, title, stage, location, date, due_date }).eq('id', editingState.id);
      showToast('បានកែប្រែលិខិត និងកត់ត្រាប្រវត្តិដំណាក់កាលជោគជ័យ!');
    }
  } else {
    const newDisp = { id: Math.floor(100000 + Math.random() * 900000000), bureau: activeBureauKey === 'all' ? 'bureau_1' : activeBureauKey, type, code, title, stage, location, date, due_date, assignee: currentUser?.username || 'user' };
    dispatchData.unshift(newDisp);
    await localDB.dispatches.put(newDisp);
    await updateDispatchStageWorkflow(newDisp.id, stage, location, 'ចុះបញ្ជីលិខិតដំបូង', currentUser?.username);
    if (db) await db.from('dispatches').insert([newDisp]);
    showToast('បានកត់ត្រាលិខិតថ្មីជោគជ័យ!');
  }
  cancelEditMode(() => renderSideForm());
  renderDispatch();
}

// ============================================================================
// ធុងសំរាម (RECYCLE BIN) & JSON RESTORE (អាទិភាពទី 4 & 7)
// ============================================================================
async function trashRecord(table, id) {
  if (!confirm('បញ្ជូនកំណត់ត្រានេះទៅក្នុងធុងសំរាម (Recycle Bin)? អ្នកអាចស្តារមកវិញបានគ្រប់ពេល។')) return;
  await softDeleteRecord(table, id, currentUser?.username);
  await loadLocalState();
  renderWorkspace();
  showToast('បានបញ្ជូនទៅធុងសំរាម (Soft Deleted)!');
}

function openSystemModal(tab) {
  const body = document.getElementById('sys-modal-body');
  const modal = document.getElementById('modal-system-tools');
  if (tab === 'recycle') {
    const trashedDocs = docsData.filter(d => d.deleted_at);
    const trashedDisp = dispatchData.filter(d => d.deleted_at);
    body.innerHTML = `
      <h4 class="font-bold text-rose-700 text-sm">🗑️ ធុងសំរាម (Recycle Bin - ការពារការលុបខុស)</h4>
      <div class="space-y-2">
        ${[...trashedDocs.map(x => ({ ...x, _t: 'docs' })), ...trashedDisp.map(x => ({ ...x, _t: 'dispatches' }))].map(item => `
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div><span class="font-bold text-slate-800">${item.title} (${item.code})</span> <span class="text-slate-400 ml-2">លុបនៅ៖ ${item.deleted_at}</span></div>
            <div class="space-x-2">
              <button onclick="window.app.restoreItem('${item._t}', ${item.id})" class="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold">♻️ ស្តារមកវិញ (Restore)</button>
              <button onclick="window.app.hardDeleteItem('${item._t}', ${item.id})" class="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold">❌ លុបដាច់</button>
            </div>
          </div>
        `).join('') || '<p class="text-slate-400 p-4 text-center">ធុងសំរាមទទេស្អាត</p>'}
      </div>
    `;
  } else {
    body.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-2">
          <h4 class="font-bold text-blue-900 text-sm">📥 Export Full System Backup (JSON)</h4>
          <p class="text-blue-700">ទាញយកទិន្នន័យទាំងអស់ទុកជាហ្វាល JSON សុវត្ថិភាព</p>
          <button onclick="window.app.exportBackupJson()" class="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold">📥 Download Backup JSON</button>
        </div>
        <div class="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
          <h4 class="font-bold text-emerald-900 text-sm">📤 Import & Restore JSON (ស្តារប្រព័ន្ធឡើងវិញ)</h4>
          <p class="text-emerald-700">ជ្រើសរើសហ្វាល JSON Backup ដើម្បីបញ្ចូលទិន្នន័យមកវិញ</p>
          <input type="file" id="restore-json-input" accept=".json" onchange="window.app.handleRestoreJson(event)" class="block w-full text-xs">
        </div>
      </div>
    `;
  }
  modal.classList.remove('hidden');
}

async function restoreItem(table, id) {
  await restoreFromRecycleBin(table, id);
  await loadLocalState();
  openSystemModal('recycle');
  renderWorkspace();
  showToast('បានស្តារទិន្នន័យមកវិញជោគជ័យ!');
}

async function hardDeleteItem(table, id) {
  if (!confirm('លុបទិន្នន័យនេះចេញពីប្រព័ន្ធជារៀងរហូតមែនទេ?')) return;
  await permanentDeleteRecord(table, id);
  await loadLocalState();
  openSystemModal('recycle');
  renderWorkspace();
  showToast('បានលុបទិន្នន័យដាច់ជារៀងរហូត!');
}

function exportBackupJson() {
  const payload = { exportedAt: new Date().toISOString(), documents: docsData, dispatches: dispatchData, trainings: trainingData, exams: examsData, certificates: certsData };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  a.download = `HRDD_DMS_BACKUP_${Date.now()}.json`;
  a.click();
}

function handleRestoreJson(e) {
  const file = e.target.files[0];
  if (!file) return;
  restoreSystemFromJsonFile(file, async (ok, err) => {
    if (ok) {
      await loadLocalState();
      renderWorkspace();
      document.getElementById('modal-system-tools').classList.add('hidden');
      showToast('បានស្តារទិន្នន័យពីហ្វាល JSON ជោគជ័យ!');
    } else {
      alert('កំហុសក្នុងការអានហ្វាល JSON: ' + err);
    }
  });
}

// ============================================================================
// WORKSPACE & AUTHENTICATION CONTROLLER
// ============================================================================
function renderWorkspace() {
  const b = BUREAUS[activeBureauKey] || BUREAUS.all;
  document.getElementById('active-bureau-title').innerText = b.name;
  document.getElementById('active-bureau-desc').innerText = b.desc;
  document.getElementById('stat-bureau-badge').innerText = b.shortName;

  document.getElementById('bureau-tabs-nav').innerHTML = b.tabs.map(t => `
    <button onclick="window.app.switchBureauTab('${t.id}')" class="sidebar-nav-btn w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${t.id === activeTab ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-emerald-50'}">
      <span class="text-lg">${t.icon}</span><span class="sidebar-text truncate">${t.label}</span>
    </button>
  `).join('');

  ['docs', 'dispatch', 'exams', 'training', 'certs'].forEach(s => document.getElementById('section-' + s)?.classList.add('hidden'));
  document.getElementById('section-' + activeTab)?.classList.remove('hidden');

  renderSideForm();
  renderDocs();
  renderDispatch();
}

async function handleLogin(e) {
  e.preventDefault();
  const u = document.getElementById('login-username').value.trim();
  const p = document.getElementById('login-password').value.trim();
  try {
    const res = await signInWithSupabaseAuth(u, p, defaultUsers);
    currentUser = res.user;
    localStorage.setItem('hrd_moh_session_cache', JSON.stringify(currentUser));
    document.getElementById('modal-login').classList.add('hidden');
    document.getElementById('app-shell').classList.remove('hidden');
    document.getElementById('current-user-fullname').innerText = currentUser.fullname;
    document.getElementById('current-user-role').innerText = currentUser.role;
    renderWorkspace();
    showToast('ចូលប្រព័ន្ធជោគជ័យ!');
  } catch (err) {
    const errEl = document.getElementById('login-error');
    errEl.innerText = err.message;
    errEl.classList.remove('hidden');
  }
}

function handleLogout() {
  localStorage.removeItem('hrd_moh_session_cache');
  currentUser = null;
  location.reload();
}

// ភ្ជាប់អនុគមន៍ទៅនឹង window.app ដើម្បីឱ្យ HTML អាចហៅប្រើបាន
window.app = {
  handleLogin, handleLogout, syncFromSupabase,
  changeActiveBureau: (k) => { activeBureauKey = k; localStorage.setItem('hrd_moh_active_bureau_cache', k); activeTab = 'docs'; renderWorkspace(); },
  switchBureauTab: (t) => { activeTab = t; renderWorkspace(); },
  toggleSidebarCollapse: () => document.getElementById('app-sidebar')?.classList.toggle('collapsed'),
  changePage, renderDocs, renderDispatch,
  editDoc, saveDocForm, editDispatch, saveDispatchForm,
  cancelEdit: () => cancelEditMode(() => renderSideForm()),
  trashRecord, openWorkflowHistory, openSystemModal,
  restoreItem, hardDeleteItem, exportBackupJson, handleRestoreJson,
  toggleAppLanguage: () => showToast('ប្តូរភាសា (KH/EN)'),
  openProfileModal: () => openSystemModal('settings'),
  toggleScannerModal: () => showToast('មុខងារស្កេន QR Code')
};

window.addEventListener('DOMContentLoaded', async () => {
  await loadLocalState();
  const saved = localStorage.getItem('hrd_moh_session_cache');
  if (saved) {
    currentUser = JSON.parse(saved);
    document.getElementById('modal-login').classList.add('hidden');
    document.getElementById('app-shell').classList.remove('hidden');
    document.getElementById('current-user-fullname').innerText = currentUser.fullname;
    document.getElementById('current-user-role').innerText = currentUser.role;
    renderWorkspace();
  }
  syncFromSupabase(false);
});
