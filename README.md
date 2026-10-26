<!DOCTYPE html>
<html lang="km">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title id="page-title">ប្រព័ន្ធគ្រប់គ្រងការងារ និងឯកសារឌីជីថល V2.1 - DHRD ក្រសួងសុខាភិបាល</title>
  
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Battambang:wght@400;500;600;700&family=Moul&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
  <script src="https://unpkg.com/html5-qrcode" type="text/javascript"></script>

  <style>
    body { font-family: 'Battambang', system-ui, -apple-system, sans-serif; }
    .font-moul { font-family: 'Moul', cursive; }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #f1f5f9; }
    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 9999px; }
    ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
    
    /* UI FIX 1: ជួសជុលបញ្ហាដាច់អក្សរខ្មែរក្នុង Inputs */
    input, textarea, select {
      line-height: 1.625 !important;
      padding-top: 0.6rem !important;
      padding-bottom: 0.6rem !important;
      overflow: visible !important;
    }

    /* UI FIX 2: ពង្រឹងសូចនាករផ្តោតតាមស្តង់ដារ WCAG AA */
    .form-input-focus { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
    .form-input-focus:focus { outline: none; border-color: #059669; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15); }
    .form-input-focus:focus-visible {
      outline: 2px solid #059669;
      outline-offset: 2px;
      border-color: transparent;
    }

    @media print {
      body * { visibility: hidden; }
      #printable-preview-content, #printable-preview-content * { visibility: visible; }
      #printable-preview-content { position: absolute; left: 0; top: 0; width: 100%; border: none; }
    }
  </style>
</head>
<body class="bg-[#f4f7f6] text-slate-800 antialiased min-h-screen flex flex-col selection:bg-emerald-100 selection:text-emerald-900 pb-16 lg:pb-0">

  <!-- UI FIX 3: ដំឡើង Z-Index របស់ Toast កុំឱ្យលាក់នៅក្រោយ Modal -->
  <div id="toast-container" class="fixed top-5 right-5 z-[110] flex flex-col gap-2 pointer-events-none"></div>

  <!-- ================= TOP HEADER BAR ================= -->
  <header id="app-header" class="hidden bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-3">
      
      <div class="flex items-center space-x-3 min-w-0">
        <div class="h-12 w-12 sm:h-13 sm:w-13 min-w-[48px] rounded-2xl border border-emerald-600/20 p-1 flex items-center justify-center bg-emerald-50/40 shadow-xs overflow-hidden shrink-0">
          <img src="Logo MOH_Ok_Background.png" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=MoH&background=059669&color=fff'" alt="MoH Logo" class="h-full w-full object-contain">
        </div>
        <div class="truncate">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="font-bold text-slate-900 text-sm sm:text-base leading-tight">ក្រសួងសុខាភិបាល</span>
            <span class="text-slate-300 hidden sm:inline">|</span>
            <span class="font-bold text-slate-900 text-xs sm:text-base leading-tight">នាយកដ្ឋានអភិវឌ្ឍន៍ធនធានមនុស្ស</span>
            <span class="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">V2.1</span>
          </div>
          <p class="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate mt-0.5">Department of Human Resource Development (DHRD - MoH)</p>
        </div>
      </div>

      <div class="flex items-center space-x-2 sm:space-x-3 shrink-0">
        <button onclick="toggleScannerModal(true)" class="p-2 sm:px-3 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition">
          📷 <span class="hidden md:inline">ស្កេន QR</span>
        </button>

        <div class="relative" id="tools-menu-container">
          <button onclick="toggleToolsMenu()" class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition">
            ⚙️ <span>Tools</span>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
          </button>
          
          <div id="tools-dropdown" class="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-1.5 z-50 hidden">
            <button onclick="openSystemModal('settings')" class="admin-only-item w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2">⚙️ <span>User Management</span></button>
            <button onclick="openSystemModal('location')" class="admin-only-item w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2">🌍 <span>Location (គ្រប់គ្រងប្រទេស)</span></button>
            <button onclick="openSystemModal('files')" class="admin-only-item w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2">📁 <span>File System & Backups</span></button>
            <button onclick="openSystemModal('security')" class="admin-only-item w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2">🛡️ <span>Security Center</span></button>
            <button onclick="openSystemModal('logging')" class="admin-only-item w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-100">📋 <span>Audit Logging</span></button>
            <button onclick="openSystemModal('manual')" class="w-full text-left px-4 py-2 text-xs text-emerald-700 font-bold hover:bg-emerald-50 flex items-center gap-2">📖 <span>User Manual</span></button>
          </div>
        </div>

        <div class="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div class="text-right hidden sm:block leading-tight">
            <div class="text-xs font-bold text-slate-800" id="current-user-fullname">មន្ត្រី</div>
            <div class="text-[10px] text-emerald-700 font-semibold" id="current-user-role">...</div>
          </div>
          <button onclick="handleLogout()" title="ចាកចេញ (Logout)" class="w-9 h-9 rounded-xl bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-600 font-bold flex items-center justify-center text-xs transition">🚪</button>
        </div>
      </div>
    </div>
  </header>

  <!-- ================= MAIN CONTAINER ================= -->
  <main id="app-main" class="hidden max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 w-full flex-1 space-y-6">

    <!-- HERO GREEN BANNER -->
    <div class="bg-gradient-to-r from-[#143e2e] via-[#1b503b] to-[#267355] rounded-3xl p-5 sm:p-7 text-white shadow-md relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-5 border border-emerald-600/30">
      <div class="space-y-1.5 relative z-10 max-w-2xl">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-[11px] font-semibold tracking-wide backdrop-blur-xs border border-white/10">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>ប្រព័ន្ធរដ្ឋបាលឌីជីថល DHRD Smart Workplace V2.1</span>
        </div>
        <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-white font-moul sm:font-sans" id="active-bureau-title">ការិយាល័យជំនាញ</h2>
        <p class="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-light" id="active-bureau-desc">ប្រព័ន្ធគ្រប់គ្រងឯកសារ តាមដានលិខិតចេញ-ចូល និងភារកិច្ចជាក់ស្តែង</p>
      </div>

      <div id="admin-bureau-switch-box" class="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-3.5 sm:w-84 space-y-1.5 relative z-10 shrink-0">
        <label class="block text-[11px] text-emerald-200 font-semibold">🏛️ ការិយាល័យដែលកំពុងប្រតិបត្តិការ៖</label>
        <select id="active-bureau-select" onchange="changeActiveBureau(this.value)" class="w-full bg-[#12392b] text-white text-xs border border-emerald-400/40 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-400 font-medium cursor-pointer">
          <option value="bureau_1">១. ការិយាល័យបណ្តុះបណ្តាលមុនពេលបម្រើការងារ</option>
          <option value="bureau_2">២. ការិយាល័យបណ្តុះបណ្តាលបន្ត</option>
          <option value="bureau_3">៣. ការិយាល័យចុះបញ្ជិកា និងវិញ្ញាបនបត្រ</option>
        </select>
        <p id="bureau-lock-notice" class="text-[10px] text-amber-300 font-medium hidden">🔒 អ្នកត្រូវបានចាក់សោរឱ្យប្រើតែការិយាល័យរបស់អ្នក</p>
      </div>
    </div>

    <!-- METRIC SUMMARY CARDS -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
        <div class="flex items-center justify-between"><p class="text-xs text-slate-500 font-medium">បណ្ណាល័យរួម (៣ ការិយាល័យ)</p><div class="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">📚</div></div>
        <h3 class="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-2" id="stat-bureau-docs">0</h3>
        <span class="inline-block mt-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold">☁️ Cloud Database</span>
      </div>
      <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
        <div class="flex items-center justify-between"><p class="text-xs text-slate-500 font-medium">លិខិតកំពុងរត់ការ</p><div class="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">⏳</div></div>
        <h3 class="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-2" id="stat-bureau-disp">0</h3>
        <span class="inline-block mt-1 text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-semibold">ដំណាក់កាលរដ្ឋបាល</span>
      </div>
      <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
        <div class="flex items-center justify-between"><p class="text-xs text-slate-500 font-medium" id="stat-custom-label">ការងារជំនាញ</p><div class="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold" id="stat-custom-icon">🎯</div></div>
        <h3 class="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-2" id="stat-custom-val">0</h3>
        <span class="inline-block mt-1 text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-semibold">ទិន្នន័យជាក់ស្តែង</span>
      </div>
      <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
        <div class="flex items-center justify-between"><p class="text-xs text-slate-500 font-medium">ការិយាល័យសាមី</p><div class="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">🏢</div></div>
        <h3 class="text-xs sm:text-sm font-bold text-emerald-800 mt-3 truncate" id="stat-bureau-badge">ការិយាល័យទី១</h3>
        <span class="inline-block mt-1 text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-semibold">Active Workspace</span>
      </div>
    </div>

    <!-- DYNAMIC NAVIGATION TABS -->
    <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none" id="bureau-tabs-nav"></div>

    <!-- ================= 2-PANEL SPLIT WORKSPACE ================= -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

      <!-- LEFT PANEL: MAIN DATA TABLE & SEARCH (8 COLS) -->
      <div class="lg:col-span-8 space-y-4">

        <!-- TAB 1: E-LIBRARY TABLE -->
        <div id="section-docs" class="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center gap-2 flex-1">
              <span class="text-slate-400">🔍</span>
              <input type="text" id="doc-search" oninput="renderDocs()" placeholder="ស្វែងរកឯកសារតាមកូដ ឬចំណងជើង..." class="form-input-focus border border-slate-200 rounded-xl px-3.5 py-2 text-xs w-full max-w-sm bg-slate-50/50">
            </div>
            <div class="flex items-center gap-2">
              <button onclick="exportCSV('docs')" id="btn-export-docs" class="perm-download-el px-3.5 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition shadow-2xs">Export as CSV</button>
            </div>
          </div>
          <div class="border border-slate-200 rounded-2xl overflow-x-auto shadow-2xs">
            <table class="w-full text-left text-xs">
              <!-- UI FIX 4: បន្ថែម whitespace-nowrap លើក្បាលតារាង -->
              <thead class="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 whitespace-nowrap">
                <tr>
                  <th class="p-3 w-10 text-center"><input type="checkbox" class="rounded text-emerald-600"></th>
                  <th class="p-3">Doc ID</th>
                  <th class="p-3 min-w-[180px]">ចំណងជើងឯកសារ</th>
                  <th class="p-3 text-center">ប្រភេទ</th>
                  <th class="p-3 text-center">ស្ថានភាព</th>
                  <th class="p-3 text-center">ទំហំ</th>
                  <th class="p-3">ការិយាល័យ</th>
                  <th class="p-3 text-center">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody id="docs-table-body" class="divide-y divide-slate-100 bg-white"></tbody>
            </table>
          </div>
        </div>

        <!-- TAB 2: DISPATCH TABLE -->
        <div id="section-dispatch" class="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4 hidden">
          <div class="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 class="text-sm font-bold text-slate-900">📤📥 តាមដានលិខិតចេញ-ចូល</h3>
            <span class="text-xs text-slate-400">តាមដានដំណាក់កាល និងទីតាំងបច្ចុប្បន្ន</span>
          </div>
          <div class="border border-slate-200 rounded-2xl overflow-x-auto shadow-2xs">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 whitespace-nowrap">
                <tr>
                  <th class="p-3 w-10 text-center"><input type="checkbox" class="rounded text-emerald-600"></th>
                  <th class="p-3">ប្រភេទ</th>
                  <th class="p-3">លេខលិខិត</th>
                  <th class="p-3 min-w-[200px]">កម្មវត្ថុ / ខ្លឹមសារ</th>
                  <th class="p-3 text-center">ដំណាក់កាល</th>
                  <th class="p-3">ទីតាំងបច្ចុប្បន្ន</th>
                  <th class="p-3 text-center">កាលបរិច្ឆេទ</th>
                  <th class="p-3 text-center">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody id="dispatch-table-body" class="divide-y divide-slate-100 bg-white"></tbody>
            </table>
          </div>
        </div>

        <!-- TAB 3A: BUREAU 1 EXAMS TABLE -->
        <div id="section-exams" class="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4 hidden">
          <div class="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 class="text-sm font-bold text-slate-900">🎓 ការប្រឡងចូល និងចេញថ្នាក់ជាតិ</h3>
            <span class="text-xs text-slate-400">កត់ត្រាសម័យប្រឡង និងបេក្ខជន</span>
          </div>
          <div class="border border-slate-200 rounded-2xl overflow-x-auto shadow-2xs">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 whitespace-nowrap">
                <tr>
                  <th class="p-3 w-10 text-center"><input type="checkbox" class="rounded text-emerald-600"></th>
                  <th class="p-3">ប្រភេទ</th>
                  <th class="p-3 min-w-[180px]">ជំនាញ / ឯកទេស</th>
                  <th class="p-3">សម័យប្រឡង</th>
                  <th class="p-3 text-center">បេក្ខជន</th>
                  <th class="p-3 text-center">ស្ថានភាព</th>
                  <th class="p-3 text-center">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody id="exams-table-body" class="divide-y divide-slate-100 bg-white"></tbody>
            </table>
          </div>
        </div>

        <!-- TAB 3B: BUREAU 2 CONTINUING TRAINING TABLE -->
        <div id="section-training" class="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4 hidden">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 class="text-sm font-bold text-slate-900">🌐 របាយការណ៍វគ្គបណ្តុះបណ្តាលបន្ត</h3>
              <p class="text-[11px] text-slate-400">ទិន្នន័យសិក្ខាកាម វគ្គសិក្សា កាលបរិច្ឆេទ និងប្រទេស</p>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              <input type="file" id="import-excel-file" onchange="handleImportExcel(event)" class="hidden" accept=".xlsx, .xls, .csv">
              <button onclick="document.getElementById('import-excel-file').click()" class="perm-upload-el px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs">📥 Import Excel</button>
              <button onclick="exportTrainingExcel()" class="perm-download-el px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs">📊 Excel (.xlsx)</button>
              <button onclick="exportTrainingCSV()" class="perm-download-el px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition">CSV</button>
              <button onclick="openPrintPreviewModal()" class="perm-download-el px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs">👁️ Print / PDF</button>
            </div>
          </div>

          <div class="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80 space-y-2.5 text-xs">
            <div class="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div><input type="text" id="filter-training-search" oninput="renderTrainingList()" placeholder="🔍 ស្វែងរកឈ្មោះ/វគ្គ..." class="form-input-focus w-full border border-slate-200 rounded-xl p-2 bg-white text-xs"></div>
              <div><select id="filter-training-country" onchange="renderTrainingList()" class="form-input-focus w-full border border-slate-200 rounded-xl p-2 bg-white text-xs"><option value="all">ប្រទេសទាំងអស់</option></select></div>
              <div><select id="filter-training-sponsor" onchange="renderTrainingList()" class="form-input-focus w-full border border-slate-200 rounded-xl p-2 bg-white text-xs"><option value="all">អ្នកឧបត្ថម្ភទាំងអស់</option></select></div>
              <div><select id="filter-training-order" onchange="renderTrainingList()" class="form-input-focus w-full border border-slate-200 rounded-xl p-2 bg-white text-xs"><option value="name">ឈ្មោះសិក្ខាកាម (A-Z)</option><option value="country">ប្រទេស (Location)</option><option value="duration">រយៈពេល</option></select></div>
            </div>
          </div>

          <div class="border border-slate-200 rounded-2xl overflow-x-auto shadow-2xs">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 whitespace-nowrap">
                <tr>
                  <th class="p-3 w-10 text-center"><input type="checkbox" class="rounded text-emerald-600"></th>
                  <th class="p-3 min-w-[150px]">ឈ្មោះ</th>
                  <th class="p-3 min-w-[150px]">អង្គភាព</th>
                  <th class="p-3 min-w-[170px]">វគ្គសិក្សា</th>
                  <th class="p-3 text-center">រយៈពេល</th>
                  <th class="p-3 text-center">កាលបរិច្ឆេទ</th>
                  <th class="p-3 text-center">ប្រទេស</th>
                  <th class="p-3">ឧបត្ថម្ភ</th>
                  <th class="p-3 text-center">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody id="training-table-body" class="divide-y divide-slate-100 bg-white"></tbody>
            </table>
          </div>
        </div>

        <!-- TAB 3C: BUREAU 3 CERTS TABLE -->
        <div id="section-certs" class="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4 hidden">
          <div class="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 class="text-sm font-bold text-slate-900">📜 ចុះបញ្ជីការ និងកំណត់លេខសញ្ញាបត្រ</h3>
            <span class="text-xs text-slate-400">កំណត់លេខកូដ និងផ្ទៀងផ្ទាត់ QR</span>
          </div>
          <div class="border border-slate-200 rounded-2xl overflow-x-auto shadow-2xs">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 whitespace-nowrap">
                <tr>
                  <th class="p-3 w-10 text-center"><input type="checkbox" class="rounded text-emerald-600"></th>
                  <th class="p-3">លេខកូដសញ្ញាបត្រ</th>
                  <th class="p-3 min-w-[160px]">ឈ្មោះសាមីខ្លួន</th>
                  <th class="p-3 min-w-[180px]">ប្រភេទសញ្ញាបត្រ</th>
                  <th class="p-3 text-center">កាលបរិច្ឆេទ</th>
                  <th class="p-3">ហត្ថលេខា</th>
                  <th class="p-3 text-center">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody id="certs-table-body" class="divide-y divide-slate-100 bg-white"></tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- RIGHT PANEL: STICKY QUICK ENTRY PANEL -->
      <div class="lg:col-span-4 sticky top-24">
        <div class="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div class="bg-[#1b503b] text-white p-4 text-center">
            <h3 class="font-bold text-sm sm:text-base flex items-center justify-center gap-2" id="side-panel-header-title">
              <span>✍️</span> ផ្ទាំងបញ្ចូលទិន្នន័យរហ័ស
            </h3>
            <p class="text-[11px] text-emerald-100/90 mt-0.5" id="side-panel-header-desc">Quick Entry Panel (Active Bureau)</p>
          </div>
          <div class="p-5 sm:p-6" id="side-form-container"></div>
        </div>
      </div>

    </div>

  </main>

  <!-- ================= MOBILE BOTTOM NAVIGATION ================= -->
  <nav id="app-mobile-nav" class="hidden lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2 z-40 flex items-center justify-around text-xs shadow-lg">
    <button onclick="switchBureauTab('docs')" class="flex flex-col items-center gap-1 text-slate-600 hover:text-emerald-700">
      <span class="text-base">📚</span><span class="text-[10px] font-semibold">បណ្ណាល័យ</span>
    </button>
    <button onclick="switchBureauTab('dispatch')" class="flex flex-col items-center gap-1 text-slate-600 hover:text-emerald-700">
      <span class="text-base">🔄</span><span class="text-[10px] font-semibold">ចេញ-ចូល</span>
    </button>
    <button onclick="switchBureauTab(activeBureauKey === 'bureau_1' ? 'exams' : (activeBureauKey === 'bureau_2' ? 'training' : 'certs'))" class="flex flex-col items-center gap-1 text-emerald-800">
      <span class="text-base">🎯</span><span class="text-[10px] font-bold">ជំនាញ</span>
    </button>
    <button onclick="toggleScannerModal(true)" class="flex flex-col items-center gap-1 text-slate-600 hover:text-emerald-700">
      <span class="text-base">📷</span><span class="text-[10px] font-semibold">ស្កេន QR</span>
    </button>
    <button onclick="openSystemModal('manual')" class="flex flex-col items-center gap-1 text-slate-600 hover:text-emerald-700">
      <span class="text-base">⚙️</span><span class="text-[10px] font-semibold">Tools</span>
    </button>
  </nav>

  <!-- ================= MODALS ================= -->

  <!-- LOGIN MODAL (UI Fix: បន្ថែម ARIA Attributes) -->
  <div id="modal-login" role="dialog" aria-modal="true" aria-labelledby="login-title" class="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-2xl space-y-4 text-center">
      <div class="w-20 h-20 rounded-2xl border border-emerald-600/30 p-1 flex items-center justify-center mx-auto bg-white shadow-xs overflow-hidden">
        <img src="Logo MOH_Ok_Background.png" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=MoH&background=059669&color=fff'" alt="MoH Logo" class="w-full h-full object-contain">
      </div>
      <div>
        <h3 id="login-title" class="text-base font-bold text-slate-900">ចូលប្រព័ន្ធតាមការិយាល័យ V2.1</h3>
        <p class="text-xs text-emerald-800 font-semibold mt-0.5">នាយកដ្ឋានអភិវឌ្ឍន៍ធនធានមនុស្ស - MoH</p>
      </div>
      <form onsubmit="handleLogin(event)" class="space-y-3.5 text-left">
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">ឈ្មោះគណនី (Username)</label>
          <input type="text" id="login-username" required autocomplete="username" class="form-input-focus w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-slate-50/50" placeholder="បញ្ចូលឈ្មោះគណនី...">
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">លេខសម្ងាត់ (Password)</label>
          <div class="relative">
            <input type="password" id="login-password" required autocomplete="current-password" class="form-input-focus w-full border border-slate-200 rounded-xl p-2.5 pr-10 text-xs bg-slate-50/50" placeholder="••••••••">
            <button type="button" onclick="togglePasswordVisibility()" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm">👁️</button>
          </div>
        </div>
        <p id="login-error" class="text-xs text-rose-600 font-medium hidden">ឈ្មោះគណនី ឬលេខសម្ងាត់មិនត្រឹមត្រូវ!</p>
        <button type="submit" class="w-full py-2.5 bg-[#1b503b] hover:bg-[#143e2e] text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer">ចូលប្រព័ន្ធ (Sign In)</button>
      </form>
    </div>
  </div>

  <!-- SYSTEM TOOLS MODAL -->
  <div id="modal-system-tools" role="dialog" aria-modal="true" aria-labelledby="system-tools-title" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-center justify-center p-3 sm:p-4 hidden">
    <div class="bg-white rounded-3xl max-w-5xl w-full p-5 sm:p-7 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
      <div class="flex justify-between items-center border-b border-slate-100 pb-3">
        <h3 id="system-tools-title" class="text-base font-bold text-slate-900 flex items-center gap-2">⚙️ System Tools Dashboard</h3>
        <button onclick="closeSystemModal()" class="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center text-lg leading-none transition">✕</button>
      </div>

      <div class="flex items-center gap-2 border-b border-slate-100 pb-2 overflow-x-auto scrollbar-none text-xs" id="system-tools-nav-bar">
        <button onclick="switchSystemToolTab('settings')" id="systab-settings" class="admin-only-tab px-4 py-2 rounded-xl font-bold bg-[#1b503b] text-white">⚙️ User Management</button>
        <button onclick="switchSystemToolTab('location')" id="systab-location" class="admin-only-tab px-4 py-2 rounded-xl font-bold bg-slate-100 text-slate-600">🌍 Location</button>
        <button onclick="switchSystemToolTab('files')" id="systab-files" class="admin-only-tab px-4 py-2 rounded-xl font-bold bg-slate-100 text-slate-600">📁 File System</button>
        <button onclick="switchSystemToolTab('security')" id="systab-security" class="admin-only-tab px-4 py-2 rounded-xl font-bold bg-slate-100 text-slate-600">🛡️ Security Center</button>
        <button onclick="switchSystemToolTab('logging')" id="systab-logging" class="admin-only-tab px-4 py-2 rounded-xl font-bold bg-slate-100 text-slate-600">📋 Audit Logging</button>
        <button onclick="switchSystemToolTab('manual')" id="systab-manual" class="px-4 py-2 rounded-xl font-bold bg-slate-100 text-slate-600">📖 User Manual</button>
      </div>

      <!-- ផ្នែក User Management & Settings -->
      <div id="syscontent-settings" class="space-y-5 flex-1 overflow-y-auto pr-1">
        <div class="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4">
          <h4 class="text-xs font-bold text-emerald-900 mb-2.5">🔐 ប្ដូរពាក្យសម្ងាត់ផ្ទាល់ខ្លួន (Change Personal Password)</h4>
          <form onsubmit="handleChangePassword(event)" class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
            <div><label class="block text-[10px] font-bold text-slate-600 mb-1">ពាក្យសម្ងាត់ចាស់</label><input type="password" id="old-password" required class="form-input-focus w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-white"></div>
            <div><label class="block text-[10px] font-bold text-slate-600 mb-1">ពាក្យសម្ងាត់ថ្មី</label><input type="password" id="new-password" required class="form-input-focus w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-white"></div>
            <div><button type="submit" class="w-full py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 shadow-xs transition">💾 ផ្លាស់ប្ដូរ Password</button></div>
          </form>
        </div>

        <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-sm font-bold text-slate-800">➕ បង្កើតគណនីមន្ត្រីថ្មី (Create New User)</h4>
            <span class="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-lg">Admin Only</span>
          </div>
          <form onsubmit="handleCreateUser(event)" class="space-y-5">
            <div class="space-y-2">
              <h5 class="text-[11px] font-bold text-slate-700 border-b border-slate-100 pb-1">ផ្នែក A — ព័ត៌មានគណនី (Basic Info)</h5>
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div><label class="block font-semibold mb-1">ឈ្មោះពេញ (Fullname) *</label><input type="text" id="new-user-fullname" required placeholder="ឧ. វេជ្ជ. សុខ វិបុល" class="form-input-focus w-full border border-slate-200 rounded-xl p-2 bg-slate-50"></div>
                <div><label class="block font-semibold mb-1">Username *</label><input type="text" id="new-user-username" required placeholder="vibul.moh" class="form-input-focus w-full border border-slate-200 rounded-xl p-2 bg-slate-50"></div>
                <div><label class="block font-semibold mb-1">លេខសម្ងាត់ (Password) *</label><input type="text" id="new-user-password" required placeholder="••••••••" class="form-input-focus w-full border border-slate-200 rounded-xl p-2 bg-slate-50"></div>
                <div>
                  <label class="block font-semibold mb-1">តួនាទី (Role) *</label>
                  <select id="new-user-role" onchange="handleRolePreset(this.value)" class="form-input-focus w-full border border-slate-200 rounded-xl p-2 bg-slate-50 font-medium text-emerald-800">
                    <option value="Editor">Editor / Officer (មន្ត្រីបញ្ចូលទិន្នន័យ)</option>
                    <option value="Viewer">Viewer / Read Only (អ្នកពិនិត្យ)</option>
                    <option value="Approver">Approver / Auditor (សវនករ)</option>
                    <option value="Admin">System Admin (អ្នកគ្រប់គ្រងប្រព័ន្ធ)</option>
                    <option value="SuperAdmin">Super Admin (ថ្នាក់ដឹកនាំជាន់ខ្ពស់)</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div class="space-y-2">
                <h5 class="text-[11px] font-bold text-slate-700 border-b border-slate-100 pb-1">ផ្នែក B — ការិយាល័យ (Bureau Scope)</h5>
                <select id="new-user-bureau" class="form-input-focus w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-white">
                  <option value="bureau_1">ការិយាល័យមុនពេលបម្រើការងារ</option>
                  <option value="bureau_2">ការិយាល័យបណ្តុះបណ្តាលបន្ត</option>
                  <option value="bureau_3">ការិយាល័យចុះបញ្ជិកា/វិញ្ញាបនបត្រ</option>
                  <option value="all">👑 គ្រប់ការិយាល័យទាំងអស់ (All Bureaus)</option>
                </select>
              </div>
              <div class="space-y-2">
                <h5 class="text-[11px] font-bold text-slate-700 border-b border-slate-100 pb-1">ផ្នែក D — ស្ថានភាពគណនី (Account Status)</h5>
                <select id="new-user-status" class="form-input-focus w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-white font-bold text-slate-700">
                  <option value="Active">🟢 Active (ដំណើរការជាប្រក្រតី)</option>
                  <option value="Suspended">🔴 Suspended (ផ្អាកជាបណ្ដោះអាសន្ន)</option>
                  <option value="Pending">🟡 Pending (រង់ចាំការអនុម័ត)</option>
                </select>
              </div>
            </div>
            <div class="space-y-2">
              <h5 class="text-[11px] font-bold text-slate-700 border-b border-slate-100 pb-1">ផ្នែក C — សិទ្ធិប្រើប្រាស់លម្អិត (Custom Permissions)</h5>
              <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 text-[11px]">
                <label class="flex items-center gap-1.5 p-2 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer"><input type="checkbox" id="perm-read" checked class="text-blue-600 rounded"><span>👁️ Read (មើល)</span></label>
                <label class="flex items-center gap-1.5 p-2 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer"><input type="checkbox" id="perm-create" checked class="text-emerald-600 rounded"><span>✏️ Create (បង្កើត)</span></label>
                <label class="flex items-center gap-1.5 p-2 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer"><input type="checkbox" id="perm-edit" class="text-amber-600 rounded"><span>📝 Edit (កែប្រែ)</span></label>
                <label class="flex items-center gap-1.5 p-2 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer"><input type="checkbox" id="perm-delete" class="text-rose-600 rounded"><span>🗑️ Delete (លុប)</span></label>
                <label class="flex items-center gap-1.5 p-2 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer"><input type="checkbox" id="perm-upload" checked class="text-emerald-600 rounded"><span>📤 Upload </span></label>
                <label class="flex items-center gap-1.5 p-2 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer"><input type="checkbox" id="perm-download" checked class="text-indigo-600 rounded"><span>📥 Download</span></label>
                <label class="flex items-center gap-1.5 p-2 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer"><input type="checkbox" id="perm-export" class="text-purple-600 rounded"><span>📊 Export (CSV/Excel)</span></label>
                <label class="flex items-center gap-1.5 p-2 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer"><input type="checkbox" id="perm-approve" class="text-blue-600 rounded"><span>✅ Approve</span></label>
                <label class="flex items-center gap-1.5 p-2 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer col-span-2 lg:col-span-1"><input type="checkbox" id="perm-admin" class="text-amber-600 rounded"><span>👑 Manage Users</span></label>
              </div>
            </div>
            <div class="flex justify-end pt-2">
              <button type="submit" class="px-6 py-2.5 bg-[#1b503b] text-white rounded-xl text-xs font-bold hover:bg-[#143e2e] shadow-md transition flex items-center gap-2"><span>+ បង្កើតគណនីមន្ត្រីថ្មី</span></button>
            </div>
          </form>
        </div>
        <div class="border border-slate-200 rounded-2xl overflow-hidden text-xs shadow-2xs">
          <table class="w-full text-left">
            <thead class="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th class="p-3">ឈ្មោះ និង Role</th>
                <th class="p-3">Username</th>
                <th class="p-3">ការិយាល័យ</th>
                <th class="p-3">ស្ថានភាព (Status)</th>
                <th class="p-3 text-right">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody id="users-table-body" class="divide-y divide-slate-100 bg-white"></tbody>
          </table>
        </div>
      </div>

      <div id="syscontent-location" class="space-y-4 flex-1 overflow-y-auto pr-1 hidden">
        <div class="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4">
          <h4 class="text-xs font-bold text-slate-800 mb-2.5">➕ បញ្ចូលប្រទេសថ្មី (នឹង Sync ចូល Supabase អូតូ)</h4>
          <form onsubmit="handleAddCountry(event)" class="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end">
            <div><label class="block text-[10px] font-bold text-slate-600 mb-1">លេខកូដ (Code)</label><input type="text" id="new-country-code" required placeholder="ឧ. KH, JP, AU" class="form-input-focus w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-white"></div>
            <div><label class="block text-[10px] font-bold text-slate-600 mb-1">ឈ្មោះជាខ្មែរ (Kh)</label><input type="text" id="new-country-kh" required placeholder="ឧ. កម្ពុជា, ជប៉ុន..." class="form-input-focus w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-white"></div>
            <div><label class="block text-[10px] font-bold text-slate-600 mb-1">ឈ្មោះជាអង់គ្លេស (En)</label><input type="text" id="new-country-en" required placeholder="ឧ. Cambodia, Japan..." class="form-input-focus w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-white"></div>
            <div><button type="submit" class="w-full py-2.5 bg-[#1b503b] text-white rounded-xl text-xs font-bold hover:bg-[#143e2e] shadow-xs transition">+ បន្ថែមប្រទេស</button></div>
          </form>
        </div>
        <div class="border border-slate-200 rounded-2xl overflow-hidden text-xs">
          <table class="w-full text-left">
            <thead class="bg-[#1b503b] text-white font-bold border-b border-slate-200">
              <tr>
                <th class="p-3 w-16">Code</th>
                <th class="p-3">Description (Kh)</th>
                <th class="p-3">Description (En)</th>
                <th class="p-3 text-right">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody id="countries-table-body" class="divide-y divide-slate-100 bg-white"></tbody>
          </table>
        </div>
      </div>

      <div id="syscontent-files" class="space-y-4 flex-1 overflow-y-auto pr-1 hidden">
        <div class="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div>
            <h4 class="text-xs font-bold text-blue-900">💾 ទាញយកទិន្នន័យប្រព័ន្ធទាំងមូល (Full System Backup)</h4>
            <p class="text-[11px] text-blue-700 mt-0.5">ទាញយកឯកសារបណ្ណាល័យ លិខិត និងវគ្គបណ្តុះបណ្តាលជា JSON</p>
          </div>
          <button onclick="backupEntireSystem()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs shrink-0">📥 Export Backup JSON</button>
        </div>
        <div class="border border-slate-200 rounded-2xl overflow-hidden text-xs">
          <div class="p-3.5 bg-slate-100 font-bold text-slate-700 border-b border-slate-200">📂 បញ្ជីឯកសារដែលបានផ្ទុកក្នុងប្រព័ន្ធ និង Google Drive</div>
          <div id="files-system-list" class="divide-y divide-slate-100 max-h-72 overflow-y-auto bg-white"></div>
        </div>
      </div>

      <div id="syscontent-security" class="space-y-3 flex-1 overflow-y-auto pr-1 hidden text-xs">
        <div class="p-5 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-2">
          <h4 class="font-bold text-emerald-900">🛡️ គោលការណ៍សុវត្ថិភាពទិន្នន័យ (Role-Based Access Control)</h4>
          <ul class="list-disc list-inside space-y-1.5 text-slate-700 leading-relaxed">
            <li><strong>Super Admin:</strong> មានសិទ្ធិពេញលេញគ្រប់យ៉ាង គ្រប់គ្រង Users, កំណត់ Roles និង Backup ទិន្នន័យ។</li>
            <li><strong>Admin:</strong> មានសិទ្ធិគ្រប់គ្រងការិយាល័យទាំង ៣ ប៉ុន្តែមិនអាចលុប/ផ្អាកគណនី Super Admin បានទេ។</li>
            <li><strong>Editor:</strong> មានសិទ្ធិវាយបញ្ចូល, Upload, និង Edit ទិន្នន័យក្នុងប្រព័ន្ធ ប៉ុន្តែគ្មានសិទ្ធិ Delete ឡើយ។</li>
            <li><strong>Viewer:</strong> អាចត្រឹមតែ Read និង Download របាយការណ៍ មិនអាចកែប្រែអ្វីបានទេ។</li>
          </ul>
        </div>
      </div>

      <div id="syscontent-logging" class="space-y-3 flex-1 overflow-y-auto pr-1 hidden">
        <div class="flex flex-col sm:flex-row justify-between items-center gap-2 text-xs pb-1">
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <span>🔍</span>
            <input type="text" id="log-search-input" oninput="renderLogsTable()" placeholder="ស្វែងរកតាមសកម្មភាព ឬឈ្មោះមន្ត្រី..." class="form-input-focus border border-slate-200 rounded-xl px-3 py-1.5 text-xs w-full sm:w-72 bg-slate-50">
          </div>
          <button onclick="clearActivityLogs()" class="text-rose-600 hover:underline font-bold self-end sm:self-auto">ជម្រះ Logs ចាស់ៗ</button>
        </div>
        <div class="border border-slate-200 rounded-2xl overflow-hidden text-xs">
          <table class="w-full text-left">
            <thead class="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th class="p-3">កាលបរិច្ឆេទ</th>
                <th class="p-3">មន្ត្រី (User)</th>
                <th class="p-3">សកម្មភាព</th>
                <th class="p-3">គោលដៅ</th>
              </tr>
            </thead>
            <tbody id="logs-table-body" class="divide-y divide-slate-100 bg-white"></tbody>
          </table>
        </div>
      </div>

      <div id="syscontent-manual" class="space-y-3.5 flex-1 overflow-y-auto pr-1 text-xs leading-relaxed text-slate-700">
        <div class="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
          <h4 class="font-bold text-slate-900 text-sm">📖 សៀវភៅណែនាំអ្នកប្រើប្រាស់សង្ខេប V2 (User Manual)</h4>
          <p><strong>១. ផ្ទាំងបញ្ចូលរហ័ស (Quick Entry Panel)៖</strong> អ្នកអាចបញ្ចូលឯកសារ ឬទិន្នន័យបានភ្លាមៗនៅលើផ្ទាំងខាងស្ដាំដៃ ដោយមិនចាំបាច់រង់ចាំបើកផ្ទាំង Pop-up ឡើយ។</p>
          <p><strong>២. ការបង្ហោះឯកសារ៖</strong> ឯកសារត្រូវមានទំហំ ≤ 10MB។ ប្រព័ន្ធនឹងបញ្ជូនទៅផ្ទុកក្នុង Google Drive ស្ថាប័នដោយស្វ័យប្រវត្តិ។</p>
          <p><strong>៣. ការទាញរបាយការណ៍៖</strong> អាច Export ជា Excel (.xlsx) ផ្លូវការ, CSV ឬចុចលើ Preview ដើម្បីផ្ទៀងផ្ទាត់ក្បាលសំបុត្រ និងហត្ថលេខាមុននឹងបោះពុម្ព។</p>
        </div>
      </div>
    </div>
  </div>

  <!-- PRINT PREVIEW & PDF MODAL -->
  <div id="modal-print-preview" role="dialog" aria-modal="true" aria-labelledby="print-title" class="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-[100] flex items-center justify-center p-3 sm:p-6 hidden">
    <div class="bg-white rounded-3xl max-w-5xl w-full p-6 shadow-2xl flex flex-col max-h-[95vh]">
      <div class="flex justify-between items-center pb-3 border-b border-slate-200">
        <h3 id="print-title" class="text-sm font-bold text-slate-900 flex items-center gap-2"><span>👁️</span> ផ្ទាំងមើលជាមុន មុននឹង Print ឬទាញយកជា PDF</h3>
        <div class="flex items-center gap-2">
          <button onclick="executePrintReport()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs">🖨️ បោះពុម្ព / Save ជា PDF</button>
          <button onclick="closePrintPreviewModal()" class="text-slate-400 hover:text-slate-600 text-xl leading-none px-2">✕</button>
        </div>
      </div>
      <div id="printable-preview-content" class="flex-1 overflow-y-auto p-4 sm:p-8 bg-white my-3 border border-slate-200 rounded-2xl text-slate-900 space-y-4">
        <div class="flex justify-between items-start border-b pb-4">
          <div class="flex items-center gap-3">
            <div class="h-16 w-16 min-w-[64px] rounded-2xl border border-emerald-600/30 p-1 flex items-center justify-center bg-white shadow-xs overflow-hidden">
              <img src="Logo MOH_Ok_Background.png" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=MoH&background=059669&color=fff'" alt="MoH Logo" class="h-full w-full object-contain">
            </div>
            <div class="leading-tight">
              <h4 class="font-bold text-xs sm:text-sm text-slate-900">ក្រសួងសុខាភិបាល</h4>
              <p class="text-xs text-slate-700 font-semibold">នាយកដ្ឋានអភិវឌ្ឍន៍ធនធានមនុស្ស</p>
              <p class="text-[11px] text-emerald-800 font-medium">ការិយាល័យបណ្តុះបណ្តាលបន្ត</p>
            </div>
          </div>
          <div class="text-right leading-tight">
            <h4 class="font-moul text-xs text-slate-900">ព្រះរាជាណាចក្រកម្ពុជា</h4>
            <p class="text-xs font-semibold text-slate-800">ជាតិ សាសនា ព្រះមហាក្សត្រ</p>
          </div>
        </div>
        <div class="text-center py-2">
          <h2 class="text-base sm:text-lg font-bold text-slate-900">របាយការណ៍ អំពីវគ្គបណ្តុះបណ្តាលនានា នៃការិយាល័យបណ្តុះបណ្តាលបន្ត</h2>
          <p id="preview-report-subtitle" class="text-xs text-slate-500 mt-1"></p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse border border-slate-300">
            <thead class="bg-slate-100 font-bold whitespace-nowrap">
              <tr>
                <th class="border border-slate-300 p-2 text-center w-10">ល.រ</th>
                <th class="border border-slate-300 p-2">ឈ្មោះ</th>
                <th class="border border-slate-300 p-2">តួនាទី និងអង្គភាព</th>
                <th class="border border-slate-300 p-2">កម្មវិធី ឬឈ្មោះវគ្គសិក្សា</th>
                <th class="border border-slate-300 p-2 text-center">រយៈពេល</th>
                <th class="border border-slate-300 p-2 text-center">កាលបរិច្ឆេទ</th>
                <th class="border border-slate-300 p-2 text-center">ប្រទេស</th>
                <th class="border border-slate-300 p-2">ឧបត្ថម្ភ</th>
              </tr>
            </thead>
            <tbody id="preview-table-body"></tbody>
          </table>
        </div>
        <div class="grid grid-cols-2 pt-8 text-center text-xs">
          <div><p>បានឃើញ និងឯកភាព</p><p class="font-bold mt-1">ប្រធាននាយកដ្ឋានអភិវឌ្ឍន៍ធនធានមនុស្ស</p></div>
          <div><p id="preview-sign-date">រាជធានីភ្នំពេញ, ថ្ងៃទី... ខែ... ឆ្នាំ២០២៦</p><p class="font-bold mt-1">ប្រធានការិយាល័យបណ្តុះបណ្តាលបន្ត</p></div>
        </div>
      </div>
    </div>
  </div>

  <!-- QR SCANNER MODAL -->
  <div id="modal-scanner" role="dialog" aria-modal="true" aria-labelledby="scanner-title" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4 hidden">
    <div class="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-3">
      <div class="flex justify-between items-center border-b border-slate-100 pb-2">
        <h3 id="scanner-title" class="text-sm font-bold text-slate-900">📷 ស្កេនផ្ទៀងផ្ទាត់ QR Code</h3>
        <button onclick="toggleScannerModal(false)" class="text-slate-400 hover:text-slate-600 text-lg leading-none">✕</button>
      </div>
      <div id="reader" class="w-full rounded-2xl overflow-hidden border border-slate-200"></div>
      <div id="scan-result" class="text-xs p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-center font-medium">សូមដាក់កាមេរ៉ាឱ្យចំ QR Code</div>
    </div>
  </div>

  <!-- ================= JAVASCRIPT MASTER CORE ENGINE V2.1 UI/UX UPGRADED ================= -->
  <script>
    const SUPABASE_URL = "https://whcpyxprjozjbhyzjtid.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoY3B5eHByam96amJoeXpqdGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2NzI3MDgsImV4cCI6MjEwODI0ODcwOH0.0gDdi8HvHzXvygjH6DpUeMNdIbChUIN6rL1Cx5OsYME";

    let db = null;
    if (window.supabase) {
      try { db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); } catch (e) { console.warn("Supabase err:", e); }
    }

    async function safeDbExec(promise) {
      if (!db || !promise) return null;
      try { 
        const res = await promise; 
        if (res && res.error) {
            console.error("Cloud DB Error:", res.error);
            alert("⚠️ ការព្រមានពីប្រព័ន្ធ Cloud:\n" + res.error.message + "\n\nទោះជាយ៉ាងណា ទិន្នន័យរបស់អ្នកត្រូវបានរក្សាទុកដោយសុវត្ថិភាពក្នុងកុំព្យូទ័រ (Local) រួចរាល់។");
        }
        return res;
      } catch (err) { console.warn("Db action err:", err); return null; }
    }

    function showToast(message) {
      const container = document.getElementById('toast-container');
      if (!container) return;
      const toast = document.createElement('div');
      toast.className = "flex items-center gap-2 bg-emerald-600 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl transition-all duration-300 translate-y-2 opacity-0 pointer-events-auto";
      toast.innerHTML = `<span>✅</span> <span>${message}</span>`;
      container.appendChild(toast);
      setTimeout(() => toast.classList.remove('translate-y-2', 'opacity-0'), 10);
      setTimeout(() => {
        toast.classList.add('translate-y-2', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }

    const GOOGLE_DRIVE_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbw_ncL4DUer9_BbmX0DJZ72nW_MXGe1T4BX9MJanmEDoFdxHV5o_Mi-lIOYL9PsurvOXA/exec";

    const BUREAUS = {
      bureau_1: { id: 'bureau_1', name: 'ការិយាល័យបណ្តុះបណ្តាលមុនពេលបម្រើការងារ', shortName: 'ការិយាល័យទី១', desc: 'គ្រប់គ្រងបណ្ណាល័យ លិខិតចេញ-ចូល និងការប្រឡងចូល-ចេញថ្នាក់ជាតិ', tabs: [{ id: 'docs', label: '📚 បណ្ណាល័យរួម' }, { id: 'dispatch', label: '🔄 ឯកសារចេញ-ចូល' }, { id: 'exams', label: '🎓 ការប្រឡងចូល និងចេញ' }] },
      bureau_2: { id: 'bureau_2', name: 'ការិយាល័យបណ្តុះបណ្តាលបន្ត', shortName: 'ការិយាល័យទី២', desc: 'គ្រប់គ្រងបណ្ណាល័យ លិខិតចេញ-ចូល និងទិន្នន័យបណ្តុះបណ្តាលក្នុង/ក្រៅប្រទេស', tabs: [{ id: 'docs', label: '📚 បណ្ណាល័យរួម' }, { id: 'dispatch', label: '🔄 ឯកសារចេញ-ចូល' }, { id: 'training', label: '🌐 បណ្តុះបណ្តាលក្នុង/ក្រៅប្រទេស' }] },
      bureau_3: { id: 'bureau_3', name: 'ការិយាល័យចុះបញ្ជិកា និងវិញ្ញាបនបត្រ', shortName: 'ការិយាល័យទី៣', desc: 'គ្រប់គ្រងបណ្ណាល័យ លិខិតចេញ-ចូល និងការចុះបញ្ជីកំណត់លេខសញ្ញាបត្រ', tabs: [{ id: 'docs', label: '📚 បណ្ណាល័យរួម' }, { id: 'dispatch', label: '🔄 ឯកសារចេញ-ចូល' }, { id: 'certs', label: '📜 ចុះបញ្ជី និងលេខសញ្ញាបត្រ' }] }
    };

    const STORAGE_KEYS = {
      DOCS: 'hrd_moh_docs_cache', DISPATCH: 'hrd_moh_disp_cache', EXAMS: 'hrd_moh_exams_cache', TRAINING: 'hrd_moh_train_cache', CERTS: 'hrd_moh_certs_cache', USERS: 'hrd_moh_users_cache', LOGS: 'hrd_moh_logs_cache', COUNTRIES: 'hrd_moh_countries_cache', SESSION: 'hrd_moh_session_cache', ACTIVE_BUREAU: 'hrd_moh_active_bureau_cache'
    };

    function getLocal(k, def) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; } }
    function setLocal(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

    const defaultUsers = [
      { id: 1, username: 'admin', password: 'admin123', fullname: 'ថ្នាក់ដឹកនាំរដ្ឋបាល', role: 'SuperAdmin', status: 'Active', bureau: 'all', permissions: { admin: true, read: true, create: true, edit: true, delete: true, upload: true, download: true, export: true, approve: true } },
      { id: 2, username: 'user1', password: '123', fullname: 'មន្ត្រីមុនពេលបម្រើការងារ', role: 'Editor', status: 'Active', bureau: 'bureau_1', permissions: { admin: false, read: true, create: true, edit: true, delete: false, upload: true, download: true, export: false, approve: false } },
      { id: 3, username: 'user2', password: '123', fullname: 'មន្ត្រីបណ្តុះបណ្តាលបន្ត', role: 'Editor', status: 'Active', bureau: 'bureau_2', permissions: { admin: false, read: true, create: true, edit: true, delete: false, upload: true, download: true, export: false, approve: false } },
      { id: 4, username: 'user3', password: '123', fullname: 'មន្ត្រីចុះបញ្ជិកា', role: 'Editor', status: 'Active', bureau: 'bureau_3', permissions: { admin: false, read: true, create: true, edit: true, delete: false, upload: true, download: true, export: false, approve: false } }
    ];

    function mergeWithCoreUsers(customList) {
      const merged = defaultUsers.map(u => ({ ...u, permissions: { ...u.permissions } }));
      if (Array.isArray(customList)) {
        customList.forEach(cu => {
          if (!cu || !cu.username) return;
          const uname = String(cu.username).trim().toLowerCase();
          const isCore = merged.some(m => m.username.toLowerCase() === uname);
          if (!isCore && cu.password) merged.push({ ...cu, status: cu.status || 'Active', role: cu.role || 'Viewer' });
        });
      }
      return merged;
    }

    const defaultCountries = [{ code: 'KH', kh: 'កម្ពុជា', en: 'Cambodia' }, { code: 'JP', kh: 'ជប៉ុន', en: 'Japan' }, { code: 'MY', kh: 'ម៉ាឡេស៊ី', en: 'Malaysia' }, { code: 'ID', kh: 'ឥណ្ឌូនេស៊ី', en: 'Indonesia' }, { code: 'NZ', kh: 'នូវែលសេឡង់', en: 'New Zealand' }, { code: 'CA', kh: 'កាណាដា', en: 'Canada' }, { code: 'US', kh: 'សហរដ្ឋអាមេរិក', en: 'United States' }, { code: 'AU', kh: 'អូស្រ្តាលី', en: 'Australia' }, { code: 'FR', kh: 'បារាំង', en: 'France' }, { code: 'SG', kh: 'សិង្ហបុរី', en: 'Singapore' }, { code: 'TH', kh: 'ថៃ', en: 'Thailand' }, { code: 'VN', kh: 'វៀតណាម', en: 'Vietnam' }];

    let countriesData = getLocal(STORAGE_KEYS.COUNTRIES, defaultCountries);
    let usersData = mergeWithCoreUsers(getLocal(STORAGE_KEYS.USERS, defaultUsers));
    let auditLogs = getLocal(STORAGE_KEYS.LOGS, []);
    
    let docsData = getLocal(STORAGE_KEYS.DOCS, []);
    let dispatchData = getLocal(STORAGE_KEYS.DISPATCH, []);
    let examsData = getLocal(STORAGE_KEYS.EXAMS, []);
    let trainingData = getLocal(STORAGE_KEYS.TRAINING, []);
    let certsData = getLocal(STORAGE_KEYS.CERTS, []);

    let currentUploadedFile = { name: '', type: 'PDF', size: '', base64: null, rawFile: null };

    function getSessionUser() { try { const v = sessionStorage.getItem(STORAGE_KEYS.SESSION); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
    function setSessionUser(u) { try { if (u) sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(u)); else sessionStorage.removeItem(STORAGE_KEYS.SESSION); } catch (e) {} }

    let currentUser = getSessionUser();
    let activeBureauKey = getLocal(STORAGE_KEYS.ACTIVE_BUREAU, 'bureau_1');
    let activeTab = 'docs';

    function logActivity(action, target) {
      try {
        const now = new Date();
        const logEntry = { id: Date.now(), time: now.toLocaleDateString('km-KH') + ' ' + now.toLocaleTimeString('en-US'), user: currentUser ? (currentUser.fullname + ' (@' + currentUser.username + ')') : 'System', action: action, target: target };
        if (!Array.isArray(auditLogs)) auditLogs = [];
        auditLogs.unshift(logEntry);
        setLocal(STORAGE_KEYS.LOGS, auditLogs);
        if (db) safeDbExec(db.from('audit_logs').insert([logEntry]));
      } catch (err) {}
    }

    function mergeArrays(localArr, remoteArr) {
        if (!remoteArr || !Array.isArray(remoteArr) || remoteArr.length === 0) return localArr;
        const map = new Map();
        localArr.forEach(item => map.set(item.id, item));
        remoteArr.forEach(item => map.set(item.id, item));
        return Array.from(map.values()).sort((a, b) => b.id - a.id);
    }

    function syncFromSupabase() {
      if (!db) return;
      Promise.allSettled([
        db.from('docs').select('*').order('id', { ascending: false }),
        db.from('trainings').select('*').order('id', { ascending: false }),
        db.from('dispatches').select('*').order('id', { ascending: false }),
        db.from('exams').select('*').order('id', { ascending: false }),
        db.from('certs').select('*').order('id', { ascending: false }),
        db.from('countries').select('*'),
        db.from('app_users').select('*')
      ]).then(results => {
        const [rDocs, rTrain, rDisp, rExams, rCerts, rCount, rUsers] = results;

        if (rDocs.status === 'fulfilled' && rDocs.value && rDocs.value.data) {
          const remoteDocs = rDocs.value.data.map(d => ({ id: d.id, bureau: d.bureau, code: d.code, title: d.title, category: d.category, fileSize: d.file_size || d.fileSize || '2.0 MB', fileName: d.file_name || d.fileName || 'document.pdf', driveLink: d.drive_link || d.driveLink || '', storage: d.storage || '☁️ Google Drive', createdBy: d.created_by || d.createdBy || 'user' }));
          docsData = mergeArrays(docsData, remoteDocs); setLocal(STORAGE_KEYS.DOCS, docsData);
        }
        if (rTrain.status === 'fulfilled' && rTrain.value && rTrain.value.data) {
          trainingData = mergeArrays(trainingData, rTrain.value.data); setLocal(STORAGE_KEYS.TRAINING, trainingData);
        }
        if (rDisp.status === 'fulfilled' && rDisp.value && rDisp.value.data) {
          dispatchData = mergeArrays(dispatchData, rDisp.value.data); setLocal(STORAGE_KEYS.DISPATCH, dispatchData);
        }
        if (rExams.status === 'fulfilled' && rExams.value && rExams.value.data) {
          examsData = mergeArrays(examsData, rExams.value.data); setLocal(STORAGE_KEYS.EXAMS, examsData);
        }
        if (rCerts.status === 'fulfilled' && rCerts.value && rCerts.value.data) {
          certsData = mergeArrays(certsData, rCerts.value.data); setLocal(STORAGE_KEYS.CERTS, certsData);
        }
        if (rCount.status === 'fulfilled' && rCount.value && rCount.value.data && rCount.value.data.length > 0) {
          countriesData = rCount.value.data; setLocal(STORAGE_KEYS.COUNTRIES, countriesData);
        }
        if (rUsers.status === 'fulfilled' && rUsers.value && rUsers.value.data && rUsers.value.data.length > 0) {
          usersData = mergeWithCoreUsers(rUsers.value.data); setLocal(STORAGE_KEYS.USERS, usersData);
        }

        if (currentUser && currentUser.username) {
          renderBureauWorkspace(); 
          populateCountryDropdowns();
        }
      }).catch(err => console.warn("Background sync error:", err));
    }

    function checkAuth() {
      const loginModal = document.getElementById('modal-login');
      const appHeader = document.getElementById('app-header');
      const appMain = document.getElementById('app-main');
      const appMobileNav = document.getElementById('app-mobile-nav');

      if (!currentUser || !currentUser.username) {
        if (loginModal) loginModal.classList.remove('hidden');
        if (appHeader) appHeader.classList.add('hidden');
        if (appMain) appMain.classList.add('hidden');
        if (appMobileNav) appMobileNav.classList.add('hidden');
      } else {
        if (loginModal) loginModal.classList.add('hidden');
        if (appHeader) appHeader.classList.remove('hidden');
        if (appMain) appMain.classList.remove('hidden');
        if (appMobileNav) appMobileNav.classList.remove('hidden');

        document.getElementById('current-user-fullname').innerText = currentUser.fullname || currentUser.username;
        const isAdmin = currentUser.permissions?.admin === true || currentUser.role === 'SuperAdmin';
        document.getElementById('current-user-role').innerText = isAdmin ? '👑 Admin' : `🏢 ${BUREAUS[currentUser.bureau]?.shortName}`;

        const selectBox = document.getElementById('active-bureau-select');
        const lockNotice = document.getElementById('bureau-lock-notice');
        if (isAdmin || currentUser.bureau === 'all') {
          if (!BUREAUS[activeBureauKey]) activeBureauKey = 'bureau_1';
          selectBox.value = activeBureauKey;
          selectBox.disabled = false;
          lockNotice.classList.add('hidden');
        } else {
          activeBureauKey = BUREAUS[currentUser.bureau] ? currentUser.bureau : 'bureau_1';
          setLocal(STORAGE_KEYS.ACTIVE_BUREAU, activeBureauKey);
          selectBox.value = activeBureauKey;
          selectBox.disabled = true;
          lockNotice.classList.remove('hidden');
        }
        applyUserPermissionsUI(isAdmin);
        renderBureauWorkspace();
      }
    }

    function applyUserPermissionsUI(isAdmin) {
      const perms = currentUser?.permissions || {};
      document.querySelectorAll('.admin-only-item, .admin-only-tab').forEach(el => el.style.display = perms.admin ? '' : 'none');
      document.querySelectorAll('.perm-upload-el').forEach(el => el.style.display = perms.upload ? '' : 'none');
      document.querySelectorAll('.perm-download-el').forEach(el => el.style.display = perms.download ? '' : 'none');
    }

    function togglePasswordVisibility() {
      const pInput = document.getElementById('login-password');
      pInput.type = (pInput.type === 'password') ? 'text' : 'password';
    }

    function normalizeKhmerDigits(str) {
      if (!str) return '';
      const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
      let res = String(str);
      for (let i = 0; i < 10; i++) res = res.split(khmerDigits[i]).join(String(i));
      return res.trim();
    }

    function handleLogin(e) {
      if (e) e.preventDefault();
      const u = normalizeKhmerDigits(document.getElementById('login-username').value).toLowerCase();
      const p = normalizeKhmerDigits(document.getElementById('login-password').value);
      executeLogin(u, p);
    }

    function executeLogin(u, p) {
      let user = usersData.find(x => x && x.username && String(x.username).trim().toLowerCase() === u && normalizeKhmerDigits(x.password) === p);
      if (user) {
        if (user.status === 'Suspended') {
           const errEl = document.getElementById('login-error');
           errEl.innerText = '🔴 គណនីនេះត្រូវបានផ្អាកការប្រើប្រាស់ (Suspended)!';
           errEl.classList.remove('hidden');
           return;
        }
        currentUser = { ...user, permissions: user.permissions || { admin: false, read: true, upload: true, download: true } };
        setSessionUser(currentUser);
        if (currentUser.bureau && currentUser.bureau !== 'all') activeBureauKey = currentUser.bureau;
        
        document.getElementById('login-error').classList.add('hidden');
        checkAuth();
        showToast('បានចូលប្រព័ន្ធដោយជោគជ័យ!');
        logActivity('ចូលប្រព័ន្ធ', `User @${currentUser.username} (${currentUser.role})`);
      } else {
        const errEl = document.getElementById('login-error');
        errEl.innerText = 'ឈ្មោះគណនី ឬលេខសម្ងាត់មិនត្រឹមត្រូវ!';
        errEl.classList.remove('hidden');
      }
    }

    function handleLogout() {
      if (confirm('តើអ្នកពិតជាចង់ចាកចេញពីប្រព័ន្ធមែនទេ?')) {
        currentUser = null; setSessionUser(null);
        document.getElementById('login-username').value = ''; document.getElementById('login-password').value = '';
        checkAuth();
      }
    }

    function changeActiveBureau(k) { activeBureauKey = k; setLocal(STORAGE_KEYS.ACTIVE_BUREAU, k); activeTab = 'docs'; renderBureauWorkspace(); }
    function switchBureauTab(tId) { activeTab = tId; renderBureauWorkspace(); }

    function renderBureauWorkspace() {
      const b = BUREAUS[activeBureauKey] || BUREAUS.bureau_1;
      document.getElementById('active-bureau-title').innerText = b.name;
      document.getElementById('active-bureau-desc').innerText = b.desc;
      document.getElementById('active-bureau-select').value = activeBureauKey;
      document.getElementById('stat-bureau-badge').innerText = b.shortName;

      document.getElementById('bureau-tabs-nav').innerHTML = b.tabs.map(t => `<button onclick="switchBureauTab('${t.id}')" class="px-4 sm:px-5 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${t.id === activeTab ? 'bg-[#1b503b] text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200'}">${t.label}</button>`).join('');

      ['docs', 'dispatch', 'exams', 'training', 'certs'].forEach(sec => {
        const el = document.getElementById('section-' + sec);
        if (el) el.classList.add('hidden');
      });
      const cSec = document.getElementById('section-' + activeTab);
      if (cSec) cSec.classList.remove('hidden');

      renderSideForm();
      renderDocs(); 
      renderDispatch(); 
      if (activeBureauKey === 'bureau_1') renderExams();
      if (activeBureauKey === 'bureau_2') renderTrainingList();
      if (activeBureauKey === 'bureau_3') renderCerts();
    }
    
    function renderSideForm() {
      const container = document.getElementById('side-form-container');
      const titleEl = document.getElementById('side-panel-header-title');
      const descEl = document.getElementById('side-panel-header-desc');
      if (!container) return;

      if (activeTab === 'training') {
        titleEl.innerHTML = '<span>🌐</span> បញ្ចូលវគ្គបណ្តុះបណ្តាលរហ័ស';
        descEl.innerText = 'Quick Add Continuing Training';
        container.innerHTML = `
          <form id="form-quick-training" onsubmit="handleSaveTraining(event)" class="space-y-3.5 text-xs">
            <div><label class="block text-[11px] font-bold text-slate-700 mb-1">ឈ្មោះសិក្ខាកាម *</label><input type="text" id="train-trainee" required placeholder="ឧ. លោកវេជ្ជ. នង មុន្នីពេជ្យ" class="form-input-focus w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50/50"></div>
            <div><label class="block text-[11px] font-bold text-slate-700 mb-1">តួនាទី និងអង្គភាព *</label><input type="text" id="train-unit" required placeholder="ឧ. មន្ទីរពេទ្យកាល់ម៉ែត" class="form-input-focus w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50/50"></div>
            <div><label class="block text-[11px] font-bold text-slate-700 mb-1">វគ្គសិក្សា *</label><input type="text" id="train-course" required placeholder="ឈ្មោះវគ្គសិក្សា..." class="form-input-focus w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50/50"></div>
            <div class="grid grid-cols-2 gap-2">
              <div><label class="block text-[10px] font-bold text-slate-700 mb-1">រយៈពេល *</label><input type="text" id="train-duration" required placeholder="6M, 1A..." class="form-input-focus w-full border border-slate-200 rounded-xl p-2 bg-slate-50/50"></div>
              <div><label class="block text-[10px] font-bold text-slate-700 mb-1">ប្រភេទ</label><select id="train-scope-input" class="form-input-focus w-full border border-slate-200 rounded-xl p-2 bg-slate-50/50"><option value="International">✈️ ក្រៅប្រទេស</option><option value="Domestic">🇰🇭 ក្នុងប្រទេស</option></select></div>
            </div>
            <div class="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div><label class="block text-[10px] font-bold text-slate-600 mb-0.5">📅 ចាប់ផ្តើម</label><input type="date" id="train-date-start" required class="form-input-focus w-full border border-slate-300 rounded-lg p-1.5 bg-white text-[11px]"></div>
              <div><label class="block text-[10px] font-bold text-slate-600 mb-0.5">📅 បញ្ចប់</label><input type="date" id="train-date-end" required class="form-input-focus w-full border border-slate-300 rounded-lg p-1.5 bg-white text-[11px]"></div>
            </div>
            <div><label class="block text-[11px] font-bold text-slate-700 mb-1">ប្រទេស (Location) *</label><select id="train-country-select" required class="form-input-focus w-full border border-slate-200 rounded-xl p-2.5 bg-white font-medium"></select></div>
            <div><label class="block text-[11px] font-bold text-slate-700 mb-1">ដៃគូឧបត្ថម្ភ (Sponsor) *</label><input type="text" id="train-sponsor-input" required placeholder="ឧ. ទីភ្នាក់ងារជប៉ុន, សាមីខ្លួន..." class="form-input-focus w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50/50"></div>
            <button type="submit" id="btn-save-training" class="w-full py-2.5 bg-[#1b503b] hover:bg-[#143e2e] text-white rounded-xl font-bold shadow-md transition mt-2 flex items-center justify-center gap-1.5"><span>Submit Record / រក្សាទុក</span></button>
          </form>
        `;
        populateCountryDropdowns();
      } else if (activeTab === 'dispatch') {
        titleEl.innerHTML = '<span>🔄</span> កត់ត្រាលិខិតចេញ-ចូលរហ័ស';
        descEl.innerText = 'Quick Add Dispatch Letter';
        container.innerHTML = `
          <form id="form-quick-dispatch" onsubmit="handleSaveDispatch(event)" class="space-y-3.5 text-xs">
            <div class="grid grid-cols-2 gap-2">
              <div><label class="block text-[11px] font-bold text-slate-700 mb-1">ប្រភេទ</label><select id="disp-type" class="form-input-focus w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50/50"><option value="ចូល">📥 ចូល</option><option value="ចេញ">📤 ចេញ</option></select></div>
              <div><label class="block text-[11px] font-bold text-slate-700 mb-1">លេខលិខិត</label><input type="text" id="disp-code" required class="form-input-focus w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50/50" placeholder="ឧ. ១០៨ សខ.អធម"></div>
            </div>
            <div><label class="block text-[11px] font-bold text-slate-700 mb-1">កម្មវត្ថុ / ខ្លឹមសារ</label><input type="text" id="disp-title" required class="form-input-focus w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50/50"></div>
            <div><label class="block text-[11px] font-bold text-slate-700 mb-1">ដំណាក់កាល</label><select id="disp-stage" class="form-input-focus w-full border border-slate-200 rounded-xl p-2.5 bg-white"><option value="រដ្ឋបាលទទួល">រដ្ឋបាលទទួល</option><option value="កំពុងពិនិត្យបច្ចេកទេស">កំពុងពិនិត្យបច្ចេកទេស</option><option value="រង់ចាំចំណារ/ហត្ថលេខា">រង់ចាំចំណារ/ហត្ថលេខា</option><option value="បញ្ចប់រួចរាល់">បញ្ចប់រួចរាល់</option></select></div>
            <div><label class="block text-[11px] font-bold text-slate-700 mb-1">នៅទីណា (ទីតាំង)</label><select id="disp-location" class="form-input-focus w-full border border-slate-200 rounded-xl p-2.5 bg-white"><option value="ការិយាល័យសាមី">ការិយាល័យសាមី</option><option value="ប្រធាននាយកដ្ឋាន (DHRD)">ប្រធាននាយកដ្ឋាន (DHRD)</option><option value="អគ្គនាយកដ្ឋានសុខាភិបាល">អគ្គនាយកដ្ឋានសុខាភិបាល</option><option value="ខុទ្ទកាល័យឯកឧត្តមរដ្ឋមន្ត្រី">ខុទ្ទកាល័យឯកឧត្តមរដ្ឋមន្ត្រី</option><option value="ទីស្តីការគណៈរដ្ឋមន្ត្រី">ទីស្តីការគណៈរដ្ឋមន្ត្រី</option><option value="ក្រសួងមុខងារសាធារណៈ">ក្រសួងមុខងារសាធារណៈ</option></select></div>
            <div class="grid grid-cols-2 gap-2">
              <div><label class="block text-[10px] font-bold text-slate-700 mb-1">កាលបរិច្ឆេទ</label><input type="date" id="disp-date" required class="form-input-focus w-full border border-slate-200 rounded-xl p-2 bg-white"></div>
              <div><label class="block text-[10px] font-bold text-slate-700 mb-1">មន្ត្រីកាន់ការ</label><input type="text" id="disp-assignee" required class="form-input-focus w-full border border-slate-200 rounded-xl p-2 bg-slate-50/50" placeholder="ឈ្មោះមន្ត្រី..."></div>
            </div>
            <button type="submit" id="btn-save-disp" class="w-full py-2.5 bg-[#1b503b] hover:bg-[#143e2e] text-white rounded-xl font-bold shadow-md transition mt-2 flex items-center justify-center gap-1.5"><span>Submit Letter / រក្សាទុក</span></button>
          </form>
        `;
      } else if (activeTab === 'exams') {
        titleEl.innerHTML = '<span>🎓</span> កត់ត្រាសម័យប្រឡងរហ័ស';
        descEl.innerText = 'Quick Add Exam Session';
        container.innerHTML = `
          <form onsubmit="handleSaveExam(event)" class="space-y-3.5 text-xs">
            <div><label class="block mb-1 font-bold text-slate-700">ជំនាញ / ឯកទេស</label><input type="text" id="exam-major" required class="form-input-focus w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50"></div>
            <div><label class="block mb-1 font-bold text-slate-700">ប្រភេទ</label><input type="text" id="exam-type" required class="form-input-focus w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50" placeholder="ប្រឡងចូល / ប្រឡងចេញ"></div>
            <div><label class="block mb-1 font-bold text-slate-700">សម័យប្រឡង</label><input type="text" id="exam-session" required class="form-input-focus w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50"></div>
            <div><label class="block mb-1 font-bold text-slate-700">ចំនួនបេក្ខជនសរុប</label><input type="number" id="exam-candidates" required class="form-input-focus w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50"></div>
            <div><label class="block mb-1 font-bold text-slate-700">ស្ថានភាព</label><input type="text" id="exam-status" required class="form-input-focus w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50" placeholder="កំពុងរៀបចំវិញ្ញាសា"></div>
            <button type="submit" class="w-full py-2.5 bg-[#1b503b] text-white rounded-xl font-bold shadow-md">Submit Exam</button>
          </form>
        `;
      } else if (activeTab === 'certs') {
        titleEl.innerHTML = '<span>📜</span> ចុះបញ្ជីលេខសញ្ញាបត្ររហ័ស';
        descEl.innerText = 'Quick Register Certificate';
        container.innerHTML = `
          <form onsubmit="handleSaveCert(event)" class="space-y-3.5 text-xs">
            <div><label class="block mb-1 font-bold text-slate-700">លេខកូដសញ្ញាបត្រ</label><input type="text" id="cert-num" required class="form-input-focus w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50"></div>
            <div><label class="block mb-1 font-bold text-slate-700">ឈ្មោះសាមីខ្លួន</label><input type="text" id="cert-name" required class="form-input-focus w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50"></div>
            <div><label class="block mb-1 font-bold text-slate-700">ប្រភេទសញ្ញាបត្រ</label><input type="text" id="cert-type" required class="form-input-focus w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50"></div>
            <div><label class="block mb-1 font-bold text-slate-700">កាលបរិច្ឆេទ</label><input type="date" id="cert-date" required class="form-input-focus w-full border border-slate-200 rounded-xl p-2.5 bg-white"></div>
            <div><label class="block mb-1 font-bold text-slate-700">ហត្ថលេខា</label><input type="text" id="cert-signer" required class="form-input-focus w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50" value="ប្រធាននាយកដ្ឋាន"></div>
            <button type="submit" class="w-full py-2.5 bg-[#1b503b] text-white rounded-xl font-bold shadow-md">Submit Certificate</button>
          </form>
        `;
      } else {
        titleEl.innerHTML = '<span>📚</span> បង្ហោះឯកសាររហ័ស (Drive)';
        descEl.innerText = 'Upload Document (Auto Google Drive)';
        container.innerHTML = `
          <form id="form-quick-doc" onsubmit="handleSaveDoc(event)" class="space-y-3.5 text-xs">
            <div id="drop-zone" onclick="document.getElementById('doc-file-input').click()" class="border-2 border-dashed border-emerald-400/80 bg-emerald-50/40 rounded-2xl p-4 text-center cursor-pointer hover:bg-emerald-50/80 transition">
              <input type="file" id="doc-file-input" onchange="handleFileSelected(event)" class="hidden" accept=".pdf,.docx,.doc,.xlsx,.xls,.png,.jpg,.jpeg">
              <p id="file-label" class="text-xs font-bold text-slate-700">ចុចជ្រើសរើសហ្វាល ឬទម្លាក់ចូល</p>
              <p id="file-sublabel" class="text-[10px] text-slate-500 mt-1">គាំទ្រ ≤ 10MB (ហោះចូល Drive អូតូ)</p>
            </div>
            <div><label class="block text-[11px] font-bold text-slate-700 mb-1">កូដឯកសារ *</label><input type="text" id="doc-code" required class="form-input-focus w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50/50" placeholder="DOC-2026-001"></div>
            <div><label class="block text-[11px] font-bold text-slate-700 mb-1">ប្រភេទ</label><select id="doc-category" class="form-input-focus w-full border border-slate-200 rounded-xl p-2.5 bg-white"><option value="ឯកសារបទដ្ឋាន">ឯកសារបទដ្ឋាន</option><option value="កម្មវិធីបណ្តុះបណ្តាល">កម្មវិធីបណ្តុះបណ្តាល</option><option value="វិញ្ញាសា/របាយការណ៍">វិញ្ញាសា/របាយការណ៍</option><option value="សេចក្តីណែនាំ">សេចក្តីណែនាំ</option></select></div>
            <div><label class="block text-[11px] font-bold text-slate-700 mb-1">ចំណងជើងឯកសារ *</label><input type="text" id="doc-title" required class="form-input-focus w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50/50"></div>
            <button type="submit" id="btn-save-doc" class="w-full py-2.5 bg-[#1b503b] hover:bg-[#143e2e] text-white rounded-xl font-bold shadow-md transition mt-2 flex items-center justify-center gap-1.5"><span>Submit Document / រក្សាទុក</span></button>
          </form>
        `;
      }
    }

    function renderDocs() {
      const tbody = document.getElementById('docs-table-body');
      if (!tbody) return;
      const search = (document.getElementById('doc-search')?.value || '').toLowerCase();
      const isAdmin = currentUser?.permissions?.admin === true || currentUser?.role === 'SuperAdmin';
      const filtered = docsData.filter(d => (d.title && d.title.toLowerCase().includes(search)) || (d.code && d.code.toLowerCase().includes(search)) || (d.category && d.category.toLowerCase().includes(search)));
      
      const statDocs = document.getElementById('stat-bureau-docs');
      if(statDocs) statDocs.innerText = filtered.length;

      if (filtered.length === 0) return tbody.innerHTML = '<tr><td colspan="8" class="p-6 text-center text-slate-400">មិនមានឯកសារឡើយ</td></tr>';

      tbody.innerHTML = filtered.map(d => {
        const bTag = BUREAUS[d.bureau] ? BUREAUS[d.bureau].shortName : d.bureau;
        return `
          <tr class="hover:bg-emerald-50/40 transition">
            <td class="p-3 text-center"><input type="checkbox" class="rounded text-emerald-600"></td>
            <td class="p-3 font-mono font-bold text-slate-700">${d.code}</td>
            <td class="p-3 font-bold text-slate-900">${d.title}</td>
            <td class="p-3 text-center"><span class="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">${d.category}</span></td>
            <td class="p-3 text-center"><span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${d.driveLink ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}">${d.driveLink ? 'In Drive' : 'Local'}</span></td>
            <td class="p-3 text-center font-mono text-[11px] text-slate-600">${d.fileSize}</td>
            <td class="p-3 text-slate-600 font-medium">${bTag}</td>
            <td class="p-3 text-center whitespace-nowrap">
              <button onclick="openDocFile('${d.driveLink || ''}', '${d.title}')" class="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold transition">👁️ មើល</button>
              ${isAdmin ? `<button onclick="deleteDoc(${d.id})" class="text-rose-600 hover:text-rose-800 ml-2 font-bold">លុប</button>` : ''}
            </td>
          </tr>
        `;
      }).join('');
    }

    function openDocFile(driveLink, title) {
      if (driveLink) window.open(driveLink, '_blank');
      else alert('📄 ឯកសារគំរូ៖ ' + title + '\n(ឯកសារដែល Upload នឹងបើកសាច់ហ្វាលផ្ទាល់លើ Google Drive)');
    }

    function renderDispatch() {
      const tbody = document.getElementById('dispatch-table-body');
      if (!tbody) return;
      const filtered = dispatchData.filter(d => d.bureau === activeBureauKey);
      const isAdmin = currentUser?.permissions?.admin === true || currentUser?.role === 'SuperAdmin';
      const statDisp = document.getElementById('stat-bureau-disp');
      if(statDisp) statDisp.innerText = filtered.filter(d => d.stage !== 'បញ្ចប់រួចរាល់').length;

      if (filtered.length === 0) return tbody.innerHTML = '<tr><td colspan="8" class="p-6 text-center text-slate-400">មិនទាន់មានលិខិតឡើយ</td></tr>';

      tbody.innerHTML = filtered.map(d => `
        <tr class="hover:bg-emerald-50/40 transition">
          <td class="p-3 text-center"><input type="checkbox" class="rounded text-emerald-600"></td>
          <td class="p-3"><span class="px-2 py-0.5 rounded-md text-[10px] font-bold ${d.type === 'ចូល' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}">${d.type}</span></td>
          <td class="p-3 font-mono font-bold text-slate-800">${d.code}</td>
          <td class="p-3 font-bold text-slate-900">${d.title}</td>
          <td class="p-3 text-center"><span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${d.stage === 'បញ្ចប់រួចរាល់' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-50 text-amber-800 border border-amber-200'}">${d.stage}</span></td>
          <td class="p-3 text-emerald-800 font-semibold">${d.location}</td>
          <td class="p-3 text-center font-mono text-[11px] text-slate-500">${d.date}</td>
          <td class="p-3 text-center">${isAdmin ? `<button onclick="deleteDispatch(${d.id})" class="text-rose-600 hover:text-rose-800 font-bold">លុប</button>` : '<span class="text-slate-300">-</span>'}</td>
        </tr>
      `).join('');
    }

    function renderExams() {
      const tbody = document.getElementById('exams-table-body');
      if (!tbody) return;
      const isAdmin = currentUser?.permissions?.admin === true || currentUser?.role === 'SuperAdmin';
      const statLabel = document.getElementById('stat-custom-label');
      const statVal = document.getElementById('stat-custom-val');
      const statIcon = document.getElementById('stat-custom-icon');
      if(statLabel) statLabel.innerText = 'សម័យប្រឡងសរុប';
      if(statVal) statVal.innerText = examsData.length;
      if(statIcon) statIcon.innerText = '🎓';

      if(examsData.length === 0) return tbody.innerHTML = '<tr><td colspan="7" class="p-6 text-center text-slate-400">មិនមានទិន្នន័យឡើយ</td></tr>';

      tbody.innerHTML = examsData.map(e => `
        <tr class="hover:bg-emerald-50/40 transition">
          <td class="p-3 text-center"><input type="checkbox" class="rounded text-emerald-600"></td>
          <td class="p-3"><span class="px-2 py-0.5 rounded-md text-[10px] font-bold ${e.type && e.type.indexOf('ចេញ') !== -1 ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}">${e.type}</span></td>
          <td class="p-3 font-bold text-slate-900">${e.major}</td>
          <td class="p-3 text-slate-600 font-medium">${e.session}</td>
          <td class="p-3 text-center font-bold text-slate-800">${e.candidates} នាក់</td>
          <td class="p-3 text-center"><span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-700 bg-emerald-50">${e.status}</span></td>
          <td class="p-3 text-center">${isAdmin ? `<button onclick="deleteExam(${e.id})" class="text-rose-600 hover:text-rose-800 font-bold">លុប</button>` : '<span class="text-slate-300">-</span>'}</td>
        </tr>
      `).join('');
    }

    function getFilteredTrainingData() {
      const search = (document.getElementById('filter-training-search')?.value || '').toLowerCase();
      const country = document.getElementById('filter-training-country')?.value || 'all';
      const sponsor = document.getElementById('filter-training-sponsor')?.value || 'all';
      const orderBy = document.getElementById('filter-training-order')?.value || 'name';

      let result = trainingData.filter(t => {
        const matchSearch = !search || (t.trainee && t.trainee.toLowerCase().includes(search)) || (t.course && t.course.toLowerCase().includes(search));
        const matchCountry = (country === 'all' || t.country === country);
        const matchSponsor = (sponsor === 'all' || t.sponsor === sponsor);
        return matchSearch && matchCountry && matchSponsor;
      });

      result.sort((a, b) => {
        if (orderBy === 'country') return String(a.country || '').localeCompare(String(b.country || ''));
        if (orderBy === 'sponsor') return String(a.sponsor || '').localeCompare(String(b.sponsor || ''));
        if (orderBy === 'duration') return String(a.duration || '').localeCompare(String(b.duration || ''));
        return String(a.trainee || '').localeCompare(String(b.trainee || ''));
      });
      return result;
    }

    function renderTrainingList() {
      const tbody = document.getElementById('training-table-body');
      if (!tbody) return;
      populateCountryDropdowns();

      const isAdmin = currentUser?.permissions?.admin === true || currentUser?.role === 'SuperAdmin';
      const sponsorSel = document.getElementById('filter-training-sponsor');
      if (sponsorSel) {
        const curSponsor = sponsorSel.value;
        const sponsors = [...new Set(trainingData.map(t => t.sponsor).filter(Boolean))];
        sponsorSel.innerHTML = '<option value="all">អ្នកឧបត្ថម្ភទាំងអស់</option>' + sponsors.map(s => `<option value="${s}" ${s === curSponsor ? 'selected' : ''}>${s}</option>`).join('');
      }

      const filtered = getFilteredTrainingData();
      const statLabel = document.getElementById('stat-custom-label');
      const statVal = document.getElementById('stat-custom-val');
      const statIcon = document.getElementById('stat-custom-icon');
      if(statLabel) statLabel.innerText = 'វគ្គបណ្តុះបណ្តាល';
      if(statVal) statVal.innerText = filtered.length;
      if(statIcon) statIcon.innerText = '🌐';

      if (filtered.length === 0) return tbody.innerHTML = '<tr><td colspan="9" class="p-6 text-center text-slate-400">មិនមានទិន្នន័យស្របតាមលក្ខខណ្ឌឡើយ</td></tr>';

      tbody.innerHTML = filtered.map((t, idx) => `
        <tr class="hover:bg-emerald-50/40 transition">
          <td class="p-3 text-center"><input type="checkbox" class="rounded text-emerald-600"></td>
          <td class="p-3 font-bold text-slate-900">${t.trainee}</td>
          <td class="p-3 text-slate-700">${t.unit}</td>
          <td class="p-3 text-emerald-950 font-medium">${t.course}</td>
          <td class="p-3 text-center font-bold text-slate-600">${t.duration}</td>
          <td class="p-3 text-center font-mono text-[11px] text-slate-600">${t.dates}</td>
          <td class="p-3 text-center font-semibold text-slate-800"><span class="px-2.5 py-0.5 bg-slate-100 rounded-md">${t.country}</span></td>
          <td class="p-3 text-slate-700">${t.sponsor}</td>
          <td class="p-3 text-center">${isAdmin ? `<button onclick="deleteTraining(${t.id})" class="text-rose-600 hover:text-rose-800 font-bold">លុប</button>` : '<span class="text-slate-300">-</span>'}</td>
        </tr>
      `).join('');
    }

    function renderCerts() {
      const tbody = document.getElementById('certs-table-body');
      if (!tbody) return;
      const isAdmin = currentUser?.permissions?.admin === true || currentUser?.role === 'SuperAdmin';
      const statLabel = document.getElementById('stat-custom-label');
      const statVal = document.getElementById('stat-custom-val');
      const statIcon = document.getElementById('stat-custom-icon');
      if(statLabel) statLabel.innerText = 'សញ្ញាបត្របានចុះបញ្ជី';
      if(statVal) statVal.innerText = certsData.length;
      if(statIcon) statIcon.innerText = '📜';

      if(certsData.length === 0) return tbody.innerHTML = '<tr><td colspan="7" class="p-6 text-center text-slate-400">មិនមានទិន្នន័យឡើយ</td></tr>';

      tbody.innerHTML = certsData.map(c => `
        <tr class="hover:bg-emerald-50/40 transition">
          <td class="p-3 text-center"><input type="checkbox" class="rounded text-emerald-600"></td>
          <td class="p-3 font-mono font-bold text-emerald-800">${c.num}</td>
          <td class="p-3 font-bold text-slate-900">${c.recipient}</td>
          <td class="p-3 text-slate-700 font-medium">${c.type}</td>
          <td class="p-3 text-center font-mono text-[11px] text-slate-500">${c.date}</td>
          <td class="p-3 text-slate-600">${c.signer}</td>
          <td class="p-3 text-center whitespace-nowrap">
            <button onclick="alert('🖨️ បោះពុម្ពសញ្ញាបត្រ៖ ' + '${c.num}')" class="px-2.5 py-1 border border-slate-200 rounded-lg text-xs hover:bg-slate-50 font-semibold transition">🖨️ បោះពុម្ព</button>
            ${isAdmin ? `<button onclick="deleteCert(${c.id})" class="text-rose-600 hover:text-rose-800 font-bold ml-2">លុប</button>` : ''}
          </td>
        </tr>
      `).join('');
    }

    // ====== ACTIONS ======

    function handleFileSelected(e) {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) return alert('⚠️ ឯកសារនេះមានទំហំធំលើស 10MB!');
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
      document.getElementById('file-label').innerHTML = `✅ បានជ្រើសរើស៖ <span class="text-emerald-700 font-bold">${file.name}</span>`;
      document.getElementById('file-sublabel').innerText = `ទំហំ៖ ${sizeMB}`;
      if (!document.getElementById('doc-title').value) document.getElementById('doc-title').value = file.name.replace(/\.[^/.]+$/, "");
      const reader = new FileReader();
      reader.onload = function(evt) { currentUploadedFile = { name: file.name, type: file.type || 'application/octet-stream', size: sizeMB, base64: evt.target.result.split(',')[1], rawFile: file }; };
      reader.readAsDataURL(file);
    }

    async function handleSaveDoc(e) {
      e.preventDefault();
      const saveBtn = document.getElementById('btn-save-doc');
      if (!currentUploadedFile.base64) return alert('សូមជ្រើសរើសហ្វាលឯកសារជាមុនសិន!');

      const newDoc = {
        id: Date.now(), bureau: activeBureauKey,
        code: document.getElementById('doc-code').value.trim(), title: document.getElementById('doc-title').value.trim(), category: document.getElementById('doc-category').value,
        fileSize: currentUploadedFile.size, fileName: currentUploadedFile.name, storage: '☁️ Google Drive', driveLink: '', createdBy: currentUser?.username || 'user'
      };

      docsData.unshift(newDoc); setLocal(STORAGE_KEYS.DOCS, docsData); renderDocs();
      showToast('បានរក្សាទុក និង Upload ឯកសារជោគជ័យ!');
      logActivity('Upload ឯកសារ V2', newDoc.code);

      document.getElementById('doc-code').value = ''; document.getElementById('doc-title').value = '';
      document.getElementById('doc-file-input').value = '';
      document.getElementById('file-label').innerHTML = 'ចុចជ្រើសរើសហ្វាល ឬទម្លាក់ចូល';
      currentUploadedFile = { name: '', type: 'PDF', size: '', base64: null, rawFile: null };

      saveBtn.innerHTML = '<span>✅ រួចរាល់! (Saved)</span>';
      setTimeout(() => saveBtn.innerHTML = '<span>Submit Document / រក្សាទុក</span>', 2500);

      const controller = new AbortController(); const timeoutId = setTimeout(() => controller.abort(), 8000);
      fetch(GOOGLE_DRIVE_WEBHOOK_URL, {
        method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ fileName: newDoc.fileName, mimeType: currentUploadedFile.type, base64: currentUploadedFile.base64 }),
        signal: controller.signal
      }).then(r => r.json()).then(res => {
        clearTimeout(timeoutId);
        if (res.status === 'success' && res.webViewLink) {
          const item = docsData.find(d => d.id === newDoc.id);
          if (item) { item.driveLink = res.webViewLink; setLocal(STORAGE_KEYS.DOCS, docsData); renderDocs(); }
          if (db) safeDbExec(db.from('docs').upsert([{ id: newDoc.id, bureau: newDoc.bureau, code: newDoc.code, title: newDoc.title, category: newDoc.category, file_size: newDoc.fileSize, file_name: newDoc.fileName, drive_link: res.webViewLink, storage: '☁️ Google Drive', created_by: newDoc.createdBy }]));
        }
      }).catch(err => {
        clearTimeout(timeoutId);
        console.warn('Background Drive upload fallback:', err);
      });
    }

    function deleteDoc(id) {
      if (confirm('តើអ្នកចង់លុបឯកសារនេះមែនទេ?')) {
        if (db) safeDbExec(db.from('docs').delete().eq('id', id));
        docsData = docsData.filter(d => d.id !== id); setLocal(STORAGE_KEYS.DOCS, docsData); renderDocs(); showToast('បានលុបឯកសារជោគជ័យ!');
      }
    }

    function formatDateDisplay(dStr) {
      if (!dStr) return ''; const parts = dStr.split('-');
      return parts.length === 3 ? (parts[2] + '/' + parts[1] + '/' + parts[0].slice(-2)) : dStr;
    }

    function handleSaveTraining(e) {
      e.preventDefault();
      const saveBtn = document.getElementById('btn-save-training');
      const dStart = document.getElementById('train-date-start').value; const dEnd = document.getElementById('train-date-end').value;
      const newT = {
        id: Date.now(), trainee: document.getElementById('train-trainee').value.trim(), unit: document.getElementById('train-unit').value.trim(), course: document.getElementById('train-course').value.trim(), duration: document.getElementById('train-duration').value.trim(), scope: document.getElementById('train-scope-input').value, dates: formatDateDisplay(dStart) + '-' + formatDateDisplay(dEnd), country: document.getElementById('train-country-select').value, sponsor: document.getElementById('train-sponsor-input').value.trim()
      };
      trainingData.unshift(newT); setLocal(STORAGE_KEYS.TRAINING, trainingData); renderTrainingList();
      showToast('បានរក្សាទុកវគ្គបណ្តុះបណ្តាលជោគជ័យ!'); logActivity('កត់ត្រាវគ្គបណ្តុះបណ្តាល V2', newT.trainee + ' (' + newT.country + ')');
      if (db) safeDbExec(db.from('trainings').insert([newT]));
      e.target.reset();
      saveBtn.innerHTML = '<span>✅ រួចរាល់! (Saved)</span>'; setTimeout(() => saveBtn.innerHTML = '<span>Submit Record / រក្សាទុក</span>', 2500);
    }
    
    function handleSaveExam(e) {
      e.preventDefault();
      const newE = {
        id: Date.now(), major: document.getElementById('exam-major').value.trim(), type: document.getElementById('exam-type').value.trim(), session: document.getElementById('exam-session').value.trim(), candidates: document.getElementById('exam-candidates').value, status: document.getElementById('exam-status').value.trim()
      };
      examsData.unshift(newE); setLocal(STORAGE_KEYS.EXAMS, examsData); renderExams();
      showToast('បានរក្សាទុកសម័យប្រឡងជោគជ័យ!'); logActivity('កត់ត្រាសម័យប្រឡង', newE.major);
      if (db) safeDbExec(db.from('exams').insert([newE])); e.target.reset();
    }
    
    function handleSaveCert(e) {
      e.preventDefault();
      const newC = {
        id: Date.now(), num: document.getElementById('cert-num').value.trim(), recipient: document.getElementById('cert-name').value.trim(), type: document.getElementById('cert-type').value.trim(), date: document.getElementById('cert-date').value, signer: document.getElementById('cert-signer').value.trim()
      };
      certsData.unshift(newC); setLocal(STORAGE_KEYS.CERTS, certsData); renderCerts();
      showToast('បានចុះបញ្ជីលេខសញ្ញាបត្រជោគជ័យ!'); logActivity('ចុះបញ្ជីសញ្ញាបត្រ', newC.num);
      if (db) safeDbExec(db.from('certs').insert([newC])); e.target.reset();
    }

    function deleteTraining(id) {
      if (confirm('តើអ្នកពិតជាចង់លុបទិន្នន័យសិក្ខាកាមនេះមែនទេ?')) {
        if (db) safeDbExec(db.from('trainings').delete().eq('id', id));
        trainingData = trainingData.filter(t => t.id !== id); setLocal(STORAGE_KEYS.TRAINING, trainingData); renderTrainingList(); showToast('បានលុបទិន្នន័យជោគជ័យ!');
      }
    }

    function handleSaveDispatch(e) {
      e.preventDefault(); const saveBtn = document.getElementById('btn-save-disp');
      const newDisp = {
        id: Date.now(), bureau: activeBureauKey, type: document.getElementById('disp-type').value, code: document.getElementById('disp-code').value.trim(), title: document.getElementById('disp-title').value.trim(), stage: document.getElementById('disp-stage').value, location: document.getElementById('disp-location').value, date: document.getElementById('disp-date').value, assignee: document.getElementById('disp-assignee').value.trim()
      };
      dispatchData.unshift(newDisp); setLocal(STORAGE_KEYS.DISPATCH, dispatchData); renderDispatch();
      showToast('បានកត់ត្រាលិខិតជោគជ័យ!'); logActivity('កត់ត្រាលិខិត', newDisp.code + ' នៅ ' + newDisp.location);
      if (db) safeDbExec(db.from('dispatches').insert([newDisp])); e.target.reset();
      saveBtn.innerHTML = '<span>✅ រួចរាល់! (Saved)</span>'; setTimeout(() => saveBtn.innerHTML = '<span>Submit Letter / រក្សាទុក</span>', 2500);
    }

    function deleteDispatch(id) {
      if (confirm('តើអ្នកចង់លុបកត់ត្រានេះមែនទេ?')) {
        if (db) safeDbExec(db.from('dispatches').delete().eq('id', id));
        dispatchData = dispatchData.filter(d => d.id !== id); setLocal(STORAGE_KEYS.DISPATCH, dispatchData); renderDispatch(); showToast('បានលុបជោគជ័យ!');
      }
    }
    function deleteExam(id) {
      if (confirm('តើអ្នកចង់លុបសម័យប្រឡងនេះមែនទេ?')) {
        if (db) safeDbExec(db.from('exams').delete().eq('id', id));
        examsData = examsData.filter(e => e.id !== id); setLocal(STORAGE_KEYS.EXAMS, examsData); renderExams(); showToast('បានលុបជោគជ័យ!');
      }
    }
    function deleteCert(id) {
      if (confirm('តើអ្នកចង់លុបបញ្ជីនេះមែនទេ?')) {
        if (db) safeDbExec(db.from('certs').delete().eq('id', id));
        certsData = certsData.filter(c => c.id !== id); setLocal(STORAGE_KEYS.CERTS, certsData); renderCerts(); showToast('បានលុបជោគជ័យ!');
      }
    }

    function toggleToolsMenu() { document.getElementById('tools-dropdown').classList.toggle('hidden'); }
    
    // UI FIX 4: មុខងារចុច Escape ដើម្បីបិទ Modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const toolsModal = document.getElementById('modal-system-tools');
        const printModal = document.getElementById('modal-print-preview');
        const scannerModal = document.getElementById('modal-scanner');
        
        if (toolsModal && !toolsModal.classList.contains('hidden')) closeSystemModal();
        else if (printModal && !printModal.classList.contains('hidden')) closePrintPreviewModal();
        else if (scannerModal && !scannerModal.classList.contains('hidden')) toggleScannerModal(false);
      }
    });

    document.addEventListener('click', (e) => {
      const container = document.getElementById('tools-menu-container');
      const dropdown = document.getElementById('tools-dropdown');
      if (container && !container.contains(e.target) && dropdown) {
        dropdown.classList.add('hidden');
      }
    });

    function openSystemModal(tab) {
      tab = tab || 'settings'; document.getElementById('tools-dropdown').classList.add('hidden');
      const isAdmin = currentUser?.permissions?.admin; if (!isAdmin) tab = 'manual';
      document.getElementById('modal-system-tools').classList.remove('hidden'); switchSystemToolTab(tab);
    }
    function closeSystemModal() { document.getElementById('modal-system-tools').classList.add('hidden'); }
    
    function switchSystemToolTab(tab) {
      const isAdmin = currentUser?.permissions?.admin;
      ['settings', 'location', 'files', 'security', 'logging', 'manual'].forEach(t => {
        const c = document.getElementById('syscontent-' + t); const b = document.getElementById('systab-' + t);
        if (c) c.classList.add('hidden');
        if (b) { b.classList.remove('bg-[#1b503b]', 'text-white'); b.classList.add('bg-slate-100', 'text-slate-600'); }
      });
      document.getElementById('syscontent-' + tab)?.classList.remove('hidden');
      const ab = document.getElementById('systab-' + tab);
      if (ab) { ab.classList.add('bg-[#1b503b]', 'text-white'); ab.classList.remove('bg-slate-100', 'text-slate-600'); }
      if (isAdmin) { if (tab === 'settings') renderUsersTable(); if (tab === 'logging') renderLogsTable(); }
    }

    function handleChangePassword(e) {
      e.preventDefault();
      const oldP = normalizeKhmerDigits(document.getElementById('old-password').value);
      const newP = normalizeKhmerDigits(document.getElementById('new-password').value);
      if (normalizeKhmerDigits(currentUser.password) !== oldP) return alert('⚠️ ពាក្យសម្ងាត់ចាស់មិនត្រឹមត្រូវ!');
      currentUser.password = newP; setSessionUser(currentUser);
      const idx = usersData.findIndex(u => u.username.toLowerCase() === currentUser.username.toLowerCase());
      if (idx !== -1) { usersData[idx].password = newP; setLocal(STORAGE_KEYS.USERS, usersData); }
      showToast('បានផ្លាស់ប្ដូរ Password ជោគជ័យ!'); logActivity('ប្ដូរ Password', 'User @' + currentUser.username); e.target.reset();
    }

    function handleRolePreset(role) {
      const isSuper = role === 'SuperAdmin'; const isAdmin = role === 'Admin'; const isApprover = role === 'Approver'; const isEditor = role === 'Editor';
      document.getElementById('perm-read').checked = true;
      document.getElementById('perm-create').checked = (isSuper || isAdmin || isEditor);
      document.getElementById('perm-edit').checked = (isSuper || isAdmin || isEditor);
      document.getElementById('perm-delete').checked = (isSuper || isAdmin);
      document.getElementById('perm-upload').checked = (isSuper || isAdmin || isEditor || isApprover);
      document.getElementById('perm-download').checked = true;
      document.getElementById('perm-export').checked = (isSuper || isAdmin || isApprover);
      document.getElementById('perm-approve').checked = (isSuper || isAdmin || isApprover);
      document.getElementById('perm-admin').checked = (isSuper || isAdmin);
      if (isSuper) document.getElementById('new-user-bureau').value = 'all';
    }

    function handleCreateUser(e) {
      e.preventDefault();
      const uname = document.getElementById('new-user-username').value.trim();
      if (usersData.some(u => u.username.toLowerCase() === uname.toLowerCase())) return alert('Username នេះមានរួចហើយ!');
      const newUser = {
        id: Date.now(), fullname: document.getElementById('new-user-fullname').value.trim(), username: uname, password: document.getElementById('new-user-password').value.trim(), role: document.getElementById('new-user-role').value, bureau: document.getElementById('new-user-bureau').value, status: document.getElementById('new-user-status').value,
        permissions: { admin: document.getElementById('perm-admin').checked, read: document.getElementById('perm-read').checked, create: document.getElementById('perm-create').checked, edit: document.getElementById('perm-edit').checked, delete: document.getElementById('perm-delete').checked, upload: document.getElementById('perm-upload').checked, download: document.getElementById('perm-download').checked, export: document.getElementById('perm-export').checked, approve: document.getElementById('perm-approve').checked }
      };
      if (db) safeDbExec(db.from('app_users').insert([newUser]));
      usersData.unshift(newUser); setLocal(STORAGE_KEYS.USERS, usersData);
      showToast('បានបង្កើតគណនីមន្ត្រីជោគជ័យ!'); logActivity('បង្កើត User ថ្មី', `@${newUser.username} (${newUser.role})`);
      renderUsersTable(); e.target.reset(); handleRolePreset('Editor');
    }

    function toggleUserStatus(id) {
      const idx = usersData.findIndex(x => x.id === id); if (idx === -1) return;
      const u = usersData[idx];
      if (['admin'].includes(u.username.toLowerCase())) return alert('មិនអាចផ្អាកគណនី Super Admin បានទេ!');
      u.status = u.status === 'Active' ? 'Suspended' : 'Active';
      setLocal(STORAGE_KEYS.USERS, usersData); renderUsersTable();
      showToast(`គណនី @${u.username} ត្រូវបានប្តូរទៅជា ${u.status}!`); logActivity(`ប្តូរ Status: ${u.status}`, `@${u.username}`);
    }

    function deleteUser(id) {
      const u = usersData.find(x => x.id === id);
      if (u && ['admin'].includes(u.username.toLowerCase())) return alert('មិនអាចលុបគណនីស្នូលរបស់ប្រព័ន្ធបានឡើយ!');
      if (confirm(`តើអ្នកចង់លុបគណនី @${u.username} មែនទេ?`)) {
        if (db) safeDbExec(db.from('app_users').delete().eq('id', id));
        usersData = usersData.filter(x => x.id !== id); setLocal(STORAGE_KEYS.USERS, usersData); renderUsersTable(); showToast('បានលុបគណនីជោគជ័យ!');
      }
    }

    function renderUsersTable() {
      const tbody = document.getElementById('users-table-body');
      if (!tbody) return;
      tbody.innerHTML = usersData.map(u => {
        const bLabel = u.bureau === 'all' ? '👑 All' : (BUREAUS[u.bureau]?.shortName || u.bureau);
        const isCore = ['admin'].includes(String(u.username).toLowerCase());
        const statusBadge = u.status === 'Active' ? '<span class="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">Active</span>' : (u.status === 'Suspended' ? '<span class="bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold">Suspended</span>' : '<span class="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">Pending</span>');
        return `
          <tr class="hover:bg-emerald-50/40 transition">
            <td class="p-3"><div class="font-bold text-slate-800">${u.fullname}</div><div class="text-[10px] text-slate-500 font-semibold">${u.role || 'User'}</div></td>
            <td class="p-3 font-mono text-emerald-700 font-semibold">@${u.username}</td>
            <td class="p-3"><span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">${bLabel}</span></td>
            <td class="p-3 text-[10px]">${statusBadge}</td>
            <td class="p-3 text-right">
              ${!isCore ? `<button onclick="toggleUserStatus(${u.id})" class="text-amber-600 hover:text-amber-800 font-bold text-[11px] mr-2">${u.status==='Active'?'ផ្អាក (Suspend)':'បើកវិញ (Activate)'}</button><button onclick="deleteUser(${u.id})" class="text-rose-600 hover:underline font-bold text-[11px]">លុប</button>` : '<span class="text-slate-400 text-[11px]">Master Account</span>'}
            </td>
          </tr>
        `;
      }).join('');
    }

    function renderLogsTable() {
      const tbody = document.getElementById('logs-table-body');
      if (!tbody) return;
      const q = document.getElementById('log-search-input')?.value.toLowerCase() || '';
      const filtered = auditLogs.filter(l => !q || (l.action?.toLowerCase().includes(q)) || (l.user?.toLowerCase().includes(q)) || (l.target?.toLowerCase().includes(q)));
      if (filtered.length === 0) return tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-slate-400">មិនមានកំណត់ត្រា Logs ស្របតាមការស្វែងរកឡើយ</td></tr>';
      tbody.innerHTML = filtered.map(l => `<tr class="hover:bg-slate-50 transition"><td class="p-3 text-slate-400 font-mono text-[10px]">${l.time}</td><td class="p-3 font-bold text-slate-700">${l.user}</td><td class="p-3 font-semibold text-emerald-700">${l.action}</td><td class="p-3 text-slate-600">${l.target}</td></tr>`).join('');
    }

    function handleAddCountry(e) { e.preventDefault(); const code = document.getElementById('new-country-code').value.trim().toUpperCase(); const kh = document.getElementById('new-country-kh').value.trim(); const en = document.getElementById('new-country-en').value.trim(); if (countriesData.some(c => c.kh === kh || c.code === code)) return alert('ប្រទេសនេះមានរួចហើយ!'); const newCountry = { code, kh, en }; if (db) safeDbExec(db.from('countries').insert([newCountry])); countriesData.push(newCountry); setLocal(STORAGE_KEYS.COUNTRIES, countriesData); showToast('បានបន្ថែមប្រទេសជោគជ័យ!'); logActivity('បន្ថែមប្រទេស', `ប្រទេស ${kh}`); renderCountriesTable(); populateCountryDropdowns(); e.target.reset(); }
    function deleteCountry(code, idx) { const c = countriesData[idx]; if (confirm(`តើអ្នកចង់លុបប្រទេស "${c.kh}" មែនទេ?`)) { if (db) safeDbExec(db.from('countries').delete().eq('code', code)); countriesData.splice(idx, 1); setLocal(STORAGE_KEYS.COUNTRIES, countriesData); showToast('បានលុបប្រទេសជោគជ័យ!'); logActivity('លុបប្រទេស', `ប្រទេស ${c.kh}`); renderCountriesTable(); populateCountryDropdowns(); } }
    function renderCountriesTable() { const tbody = document.getElementById('countries-table-body'); if (!tbody) return; tbody.innerHTML = countriesData.map((c, idx) => `<tr class="hover:bg-emerald-50/40 transition"><td class="p-3 font-mono font-bold text-slate-700">${c.code}</td><td class="p-3 font-bold text-slate-900">${c.kh}</td><td class="p-3 text-slate-600">${c.en}</td><td class="p-3 text-right"><button onclick="deleteCountry('${c.code}', ${idx})" class="text-rose-600 hover:underline font-bold">លុប</button></td></tr>`).join(''); }
    function populateCountryDropdowns() { const formSel = document.getElementById('train-country-select'); const filterSel = document.getElementById('filter-training-country'); const currentVal = formSel?.value; if (formSel) formSel.innerHTML = '<option value="">-- ជ្រើសរើសប្រទេស --</option>' + countriesData.map(c => `<option value="${c.kh}" ${c.kh === currentVal ? 'selected' : ''}>${c.kh} (${c.en})</option>`).join(''); if (filterSel) filterSel.innerHTML = '<option value="all">ប្រទេសទាំងអស់</option>' + countriesData.map(c => `<option value="${c.kh}">${c.kh}</option>`).join(''); }
    function renderFilesSystemList() { const list = document.getElementById('files-system-list'); if (!list) return; if (docsData.length === 0) return list.innerHTML = '<div class="p-4 text-center text-slate-400">មិនមានឯកសារឡើយ</div>'; list.innerHTML = docsData.map(d => `<div class="p-3.5 flex items-center justify-between hover:bg-slate-50 transition"><div><p class="font-bold text-slate-800 text-xs">${d.title} (${d.code})</p><p class="text-[10px] text-slate-500">ការិយាល័យ៖ ${BUREAUS[d.bureau]?.shortName || d.bureau} | ទំហំ៖ ${d.fileSize}</p></div><span class="text-[10px] px-2.5 py-1 rounded-lg ${d.driveLink ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'} font-mono font-bold">${d.driveLink ? '☁️ Google Drive' : 'Local File'}</span></div>`).join(''); }
    
    function backupEntireSystem() { const fullBackup = { exportedAt: new Date().toISOString(), users: usersData, countries: countriesData, documents: docsData, dispatches: dispatchData, exams: examsData, trainings: trainingData, certificates: certsData }; const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'DHRD_SYSTEM_BACKUP_V2_' + Date.now() + '.json'; a.click(); showToast('បាន Export Backup ជោគជ័យ!'); logActivity('ទាញយក Backup V2', 'JSON Backup'); }
    
    function handleImportExcel(e) {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = function(evt) {
        try {
          const data = new Uint8Array(evt.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          let importedCount = 0; let newItems = [];
          for (let i = 1; i < json.length; i++) {
            const row = json[i];
            if (row && row.length >= 2 && row[1]) {
              const newT = { id: Date.now() + i, trainee: String(row[1] || '').trim(), unit: String(row[2] || 'នាយកដ្ឋាន/មន្ទីរពេទ្យ').trim(), course: String(row[3] || 'វគ្គបណ្តុះបណ្តាល').trim(), duration: String(row[4] || '1 M').trim(), dates: String(row[5] || '01/01/26-01/02/26').trim(), country: String(row[6] || 'ក្នុងប្រទេស').trim(), sponsor: String(row[7] || 'សាមីខ្លួន').trim(), scope: 'International' };
              newItems.push(newT); trainingData.unshift(newT); importedCount++;
            }
          }
          setLocal(STORAGE_KEYS.TRAINING, trainingData); 
          if (db && newItems.length > 0) safeDbExec(db.from('trainings').insert(newItems));
          renderTrainingList();
          showToast(`បាន Import ចូលជោគជ័យចំនួន ${importedCount} ទិន្នន័យ!`); logActivity('Import Excel V2', `បានបញ្ចូលទិន្នន័យចំនួន ${importedCount}`);
        } catch (err) { alert('⚠️ កំហុសក្នុងការអានហ្វាល Excel! សូមពិនិត្យមើលទម្រង់ហ្វាលរបស់អ្នកឡើងវិញ។'); }
        e.target.value = '';
      };
      reader.readAsArrayBuffer(file);
    }

    function exportCSV(type) {
      let csv = "\uFEFFDoc ID,ចំណងជើង,ការិយាល័យ,ប្រភេទ,កាលបរិច្ឆេទ,ទំហំ,កន្លែងផ្ទុក\n";
      docsData.forEach(d => { csv += `"${d.code}","${d.title}","${BUREAUS[d.bureau]?.name || d.bureau}","${d.category}","${d.date}","${d.fileSize}","${d.storage || 'Google Drive'}"\n`; });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = 'dhrd_docs_' + Date.now() + '.csv'; a.click(); showToast('បាន Export CSV ជោគជ័យ!');
    }
    function exportTrainingExcel() {
      const filtered = getFilteredTrainingData();
      const excelRows = filtered.map((t, idx) => ({ "ល.រ": idx + 1, "ឈ្មោះ": t.trainee, "តួនាទី និងអង្គភាព": t.unit, "កម្មវិធី ឬឈ្មោះវគ្គសិក្សា": t.course, "រយៈពេល": t.duration, "កាលបរិច្ឆេទ នៃវគ្គ": t.dates, "ប្រទេស": t.country, "ឧបត្ថម្ភ": t.sponsor }));
      const worksheet = XLSX.utils.json_to_sheet(excelRows); const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "វគ្គបណ្តុះបណ្តាលបន្ត");
      XLSX.writeFile(workbook, 'របាយការណ៍_វគ្គបណ្តុះបណ្តាលបន្ត_' + Date.now() + '.xlsx'); showToast('បាន Export Excel ជោគជ័យ!');
    }
    function exportTrainingCSV() {
      const filtered = getFilteredTrainingData();
      let csv = "\uFEFFល.រ,ឈ្មោះ,តួនាទី និងអង្គភាព,កម្មវិធី ឬឈ្មោះវគ្គសិក្សា,រយៈពេល,កាលបរិច្ឆេទ,ប្រទេស,ឧបត្ថម្ភ\n";
      filtered.forEach((t, idx) => { csv += `"${idx + 1}","${t.trainee}","${t.unit}","${t.course}","${t.duration}","${t.dates}","${t.country}","${t.sponsor}"\n`; });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = 'training_report_' + Date.now() + '.csv'; a.click(); showToast('បាន Export CSV ជោគជ័យ!');
    }
    function openPrintPreviewModal() {
      const filtered = getFilteredTrainingData(); const tbody = document.getElementById('preview-table-body');
      tbody.innerHTML = filtered.map((t, idx) => `<tr><td class="border border-slate-300 p-2 text-center font-bold">${idx + 1}</td><td class="border border-slate-300 p-2 font-bold">${t.trainee}</td><td class="border border-slate-300 p-2">${t.unit}</td><td class="border border-slate-300 p-2">${t.course}</td><td class="border border-slate-300 p-2 text-center">${t.duration}</td><td class="border border-slate-300 p-2 text-center font-mono">${t.dates}</td><td class="border border-slate-300 p-2 text-center font-semibold">${t.country}</td><td class="border border-slate-300 p-2">${t.sponsor}</td></tr>`).join('');
      const now = new Date(); document.getElementById('preview-report-subtitle').innerText = 'ទិន្នន័យសរុប៖ ' + filtered.length + ' នាក់ | ទាញចេញនៅថ្ងៃទី ' + now.toLocaleDateString('km-KH'); document.getElementById('preview-sign-date').innerText = 'រាជធានីភ្នំពេញ, ថ្ងៃទី ' + now.getDate() + ' ខែ ' + (now.getMonth() + 1) + ' ឆ្នាំ២០២៦'; document.getElementById('modal-print-preview').classList.remove('hidden');
    }
    function closePrintPreviewModal() { document.getElementById('modal-print-preview').classList.add('hidden'); }
    function executePrintReport() { window.print(); }

    let html5QrcodeScanner = null;
    function toggleScannerModal(show) {
      const modal = document.getElementById('modal-scanner');
      if (show) {
        modal.classList.remove('hidden');
        if (!html5QrcodeScanner) {
          html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 200 });
          html5QrcodeScanner.render((decodedText) => {
            const cert = certsData.find(c => c.num === decodedText.trim()); const resEl = document.getElementById('scan-result');
            if (cert) { resEl.className = 'text-xs p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold'; resEl.innerHTML = '✅ រកឃើញសញ្ញាបត្រត្រឹមត្រូវ៖<br>' + cert.num + ' - ' + cert.recipient; }
            else { resEl.className = 'text-xs p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800'; resEl.innerHTML = '⚠️ កូដ៖ ' + decodedText + ' (មិនមានក្នុងបញ្ជីឡើយ)'; }
          });
        }
      } else { modal.classList.add('hidden'); }
    }

    // BOOTSTRAP V2.1
    window.addEventListener('DOMContentLoaded', () => {
      checkAuth();
      syncFromSupabase();
    });
  </script>
</body>
</html>
