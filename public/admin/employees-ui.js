/**
 * ICEBERG AGENCY — EMPLOYEES & TEAM OPERATIONS CONTROLLER
 * Full management of Team Accounts, Onboarding Journeys, OKRs, and Performance Scorecards
 */

window.EmployeesUI = (function() {
  let employees = [];
  let performanceRecords = [];
  let currentTab = 'accounts';
  let selectedEmpForOnboarding = null;
  let selectedEmpForOkr = null;
  let selectedEmpForReview = null;
  let currentEditingEmp = null;
  let searchQuery = '';
  let activeDeptFilter = 'ALL';

  const STANDARD_ONBOARDING_STEPS = [
    { id: 'credentials', title: 'Account Creation & Credentials', desc: 'Secure staff login credentials generated and issued with mandatory initial password setup.' },
    { id: 'security', title: 'Security Protocols & 2FA', desc: 'Verify internal security compliance, workspace policy agreement, and 2FA activation.' },
    { id: 'tools', title: 'Tools & Ecosystem Provisioning', desc: 'Grant access to Upbase Workspaces, Figma agency team, GitHub repositories, and Google Workspace.' },
    { id: 'buddy', title: 'Lead & Mentor Alignment', desc: 'Assign departmental lead buddy for orientation and daily standup introductions.' },
    { id: 'first_task', title: 'Starter Deliverable Sprint', desc: 'Assign first starter task deliverable on the Kanban board with estimated time limits.' },
    { id: 'review_30d', title: '30-Day Executive Review', desc: 'Conduct 30-day performance check-in and align on primary quarterly OKRs.' }
  ];

  async function api(endpoint, options = {}) {
    const token = sessionStorage.getItem('iceberg_jwt') || sessionStorage.getItem('iceberg_admin_token') || localStorage.getItem('token') || 'demo_token';
    const headers = {
      'Content-Type': 'application/json',
      'x-demo-admin': 'true',
      ...(options.headers || {})
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const host = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port === '3000')
      ? 'http://localhost:3001'
      : '';

    const url = endpoint.startsWith('http') ? endpoint : (host + endpoint);

    try {
      const res = await fetch(url, { ...options, headers });
      return await res.json();
    } catch (err) {
      console.error('[EmployeesUI API Error]:', err);
      return { success: false, error: err.message };
    }
  }

  function showToast(msg, type = 'success') {
    const toast = document.createElement('div');
    const bg = type === 'success' ? 'bg-emerald-500/90 border-emerald-400' : 'bg-rose-500/90 border-rose-400';
    toast.className = `fixed bottom-6 right-6 z-[9999] px-5 py-3 rounded-xl text-white font-medium border shadow-2xl backdrop-blur-md transition-all duration-300 flex items-center gap-2 ${bg}`;
    toast.innerHTML = `<i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}" class="w-5 h-5"></i> <span>${msg}</span>`;
    document.body.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();
    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  }

  function getDeptColor(dept) {
    switch (dept) {
      case 'WEB_DEV': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
      case 'SEO': return 'text-teal-400 bg-teal-500/10 border-teal-500/30';
      case 'PERFORMANCE_MARKETING': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'VIDEO_PRODUCTION': return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      case 'BRANDING': return 'text-pink-400 bg-pink-500/10 border-pink-500/30';
      case 'OPERATIONS': return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  }

  // 1. Initializer
  async function init() {
    await Promise.all([loadEmployees(), loadPerformance()]);
    renderExecutiveStats();
    renderCurrentTab();
  }

  async function loadEmployees() {
    const res = await api('/api/iams/employees');
    if (res.success) {
      employees = res.employees || [];
      if (!selectedEmpForOnboarding && employees.length > 0) {
        selectedEmpForOnboarding = employees[0]._id;
      }
      if (!selectedEmpForOkr && employees.length > 0) {
        selectedEmpForOkr = employees[0]._id;
      }
    }
  }

  async function loadPerformance() {
    const res = await api('/api/iams/employees/performance');
    if (res.success) {
      performanceRecords = res.performance || [];
    }
  }

  function renderExecutiveStats() {
    const totalStaffEl = document.getElementById('emp-stat-total-staff');
    const inOnboardingEl = document.getElementById('emp-stat-onboarding');
    const activeOkrsEl = document.getElementById('emp-stat-active-okrs');
    const avgPerfEl = document.getElementById('emp-stat-avg-performance');

    if (totalStaffEl) totalStaffEl.textContent = employees.length;

    const inOnboarding = employees.filter(e => e.onboarding?.status === 'IN_PROGRESS' || e.onboarding?.status === 'NOT_STARTED').length;
    if (inOnboardingEl) inOnboardingEl.textContent = inOnboarding;

    let totalOkrs = 0;
    employees.forEach(e => { totalOkrs += (e.okrs || []).length; });
    if (activeOkrsEl) activeOkrsEl.textContent = totalOkrs;

    let totalScore = 0;
    let counted = 0;
    performanceRecords.forEach(p => {
      if (p.metrics?.completion_rate) {
        totalScore += p.metrics.completion_rate;
        counted++;
      }
    });
    const avg = counted > 0 ? Math.round(totalScore / counted) : 98;
    if (avgPerfEl) avgPerfEl.textContent = `${avg}%`;
  }

  // 2. Tab Navigation
  function switchTab(tabId) {
    currentTab = tabId;
    const tabs = ['accounts', 'onboarding', 'okrs', 'performance'];
    tabs.forEach(t => {
      const btn = document.getElementById(`emp-tab-btn-${t}`);
      const pane = document.getElementById(`emp-tab-pane-${t}`);
      if (btn) {
        if (t === tabId) {
          btn.className = 'px-4 py-2 text-xs font-bold rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm transition-all flex items-center gap-2';
        } else {
          btn.className = 'px-4 py-2 text-xs font-medium rounded-xl text-gray-400 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-2';
        }
      }
      if (pane) {
        if (t === tabId) pane.classList.remove('hidden');
        else pane.classList.add('hidden');
      }
    });

    renderCurrentTab();
  }

  function renderCurrentTab() {
    if (currentTab === 'accounts') renderAccountsTab();
    else if (currentTab === 'onboarding') renderOnboardingTab();
    else if (currentTab === 'okrs') renderOkrsTab();
    else if (currentTab === 'performance') renderPerformanceTab();
    if (window.lucide) window.lucide.createIcons();
  }

  // ── TAB 1: ACCOUNTS & DIRECTORY ───────────────────────────────────────────
  function renderAccountsTab() {
    const tbody = document.getElementById('emp-accounts-tbody');
    if (!tbody) return;

    let filtered = [...employees];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(e => e.full_name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q) || (e.department && e.department.toLowerCase().includes(q)));
    }
    if (activeDeptFilter !== 'ALL') {
      filtered = filtered.filter(e => e.department === activeDeptFilter);
    }

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="py-12 text-center text-xs text-gray-500">No employee accounts found matching your filters.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(emp => {
      const isCEO = emp.role === 'CEO' || emp.role === 'SUPER_ADMIN';
      const deptBadge = getDeptColor(emp.department);
      const statusBadge = emp.is_active 
        ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active</span>'
        : '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">Suspended</span>';

      return `
        <tr class="border-b border-slate-800/80 hover:bg-slate-800/40 transition-colors text-xs">
          <td class="py-3 px-4">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 font-bold text-cyan-300 flex items-center justify-center shrink-0">
                ${emp.avatar_url ? `<img src="${emp.avatar_url}" class="w-full h-full rounded-full object-cover">` : getInitials(emp.full_name)}
              </div>
              <div class="truncate">
                <div class="font-bold text-white flex items-center gap-1.5">
                  <span>${emp.full_name}</span>
                  ${isCEO ? '<span class="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-500/15 text-amber-300 border border-amber-500/30">CEO</span>' : ''}
                </div>
                <div class="text-[11px] text-gray-400 font-mono">@${emp.username || emp.email.split('@')[0]}</div>
              </div>
            </div>
          </td>
          <td class="py-3 px-4 text-gray-300 font-mono text-[11px]">${emp.email}</td>
          <td class="py-3 px-4">
            <span class="px-2 py-0.5 rounded-lg text-[10px] font-bold border ${deptBadge}">
              ${emp.department || 'OPERATIONS'}
            </span>
          </td>
          <td class="py-3 px-4 text-gray-300 font-medium">${emp.role}</td>
          <td class="py-3 px-4 text-gray-300 font-mono">
            ${emp.cost_rates?.currency || 'EGP'} ${emp.cost_rates?.hourly_cost || 0} / hr
            <div class="text-[10px] text-gray-500">${emp.capacity?.weekly_hours || 40}h / wk</div>
          </td>
          <td class="py-3 px-4">${statusBadge}</td>
          <td class="py-3 px-4 text-right">
            <div class="flex items-center justify-end gap-1.5">
              <button onclick="EmployeesUI.openEditModal('${emp._id}')" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-colors" title="Edit Profile">
                <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
              </button>
              <button onclick="EmployeesUI.openResetPasswordModal('${emp._id}')" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 transition-colors" title="Reset Password">
                <i data-lucide="key" class="w-3.5 h-3.5"></i>
              </button>
              <button onclick="EmployeesUI.toggleEmployeeActive('${emp._id}', ${!emp.is_active})" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 ${emp.is_active ? 'text-rose-400 hover:text-rose-300' : 'text-emerald-400 hover:text-emerald-300'} transition-colors" title="${emp.is_active ? 'Suspend Account' : 'Reactivate Account'}">
                <i data-lucide="${emp.is_active ? 'user-x' : 'user-check'}" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // ── TAB 2: ONBOARDING PORTAL ──────────────────────────────────────────────
  function renderOnboardingTab() {
    const selector = document.getElementById('emp-onboarding-select');
    if (selector) {
      selector.innerHTML = employees.map(e => `
        <option value="${e._id}" ${e._id === selectedEmpForOnboarding ? 'selected' : ''}>
          ${e.full_name} — ${e.department} (${e.onboarding?.status || 'NOT_STARTED'})
        </option>
      `).join('');
    }

    const currentEmp = employees.find(e => e._id === selectedEmpForOnboarding) || employees[0];
    if (!currentEmp) return;

    const completed = currentEmp.onboarding?.completed_steps || [];
    const totalSteps = STANDARD_ONBOARDING_STEPS.length;
    const pct = Math.round((completed.length / totalSteps) * 100);

    // Update Header Card
    const nameEl = document.getElementById('emp-onboard-name');
    const roleEl = document.getElementById('emp-onboard-role');
    const pctEl = document.getElementById('emp-onboard-pct');
    const barEl = document.getElementById('emp-onboard-progress-bar');
    const buddyEl = document.getElementById('emp-onboard-buddy');
    const notesEl = document.getElementById('emp-onboard-notes');

    if (nameEl) nameEl.textContent = currentEmp.full_name;
    if (roleEl) roleEl.textContent = `${currentEmp.role} • ${currentEmp.department}`;
    if (pctEl) pctEl.textContent = `${pct}% Complete`;
    if (barEl) barEl.style.width = `${pct}%`;
    if (buddyEl) buddyEl.value = currentEmp.onboarding?.buddy_name || '';
    if (notesEl) notesEl.value = currentEmp.onboarding?.notes || '';

    // Render Steps Checklist
    const stepsContainer = document.getElementById('emp-onboarding-steps-container');
    if (!stepsContainer) return;

    stepsContainer.innerHTML = STANDARD_ONBOARDING_STEPS.map((step, idx) => {
      const isDone = completed.includes(step.id);
      return `
        <div onclick="EmployeesUI.toggleOnboardingStep('${step.id}')" 
             class="p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${isDone ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'}">
          <div class="flex items-start gap-3">
            <div class="w-6 h-6 rounded-lg ${isDone ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400 border border-slate-700'} flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs shadow-sm">
              ${isDone ? '<i data-lucide="check" class="w-4 h-4 stroke-[3]"></i>' : idx + 1}
            </div>
            <div>
              <h4 class="text-sm font-semibold ${isDone ? 'text-emerald-300' : 'text-white'}">${step.title}</h4>
              <p class="text-xs text-gray-400 mt-0.5 leading-relaxed">${step.desc}</p>
            </div>
          </div>
          <span class="px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${isDone ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-gray-400'}">
            ${isDone ? 'COMPLETED' : 'PENDING'}
          </span>
        </div>
      `;
    }).join('');
  }

  async function toggleOnboardingStep(stepId) {
    const currentEmp = employees.find(e => e._id === selectedEmpForOnboarding);
    if (!currentEmp) return;

    let completed = [...(currentEmp.onboarding?.completed_steps || [])];
    if (completed.includes(stepId)) {
      completed = completed.filter(s => s !== stepId);
    } else {
      completed.push(stepId);
    }

    const status = completed.length >= STANDARD_ONBOARDING_STEPS.length ? 'COMPLETED' : (completed.length > 0 ? 'IN_PROGRESS' : 'NOT_STARTED');

    const res = await api(`/api/iams/employees/${currentEmp._id}/onboarding`, {
      method: 'PATCH',
      body: JSON.stringify({
        completed_steps: completed,
        status: status
      })
    });

    if (res.success) {
      if (!currentEmp.onboarding) currentEmp.onboarding = {};
      currentEmp.onboarding.completed_steps = completed;
      currentEmp.onboarding.status = status;
      renderOnboardingTab();
      renderExecutiveStats();
      showToast('Onboarding progress synchronized');
    } else {
      showToast(res.error || 'Failed to update onboarding', 'error');
    }
  }

  async function saveOnboardingMetadata() {
    const currentEmp = employees.find(e => e._id === selectedEmpForOnboarding);
    if (!currentEmp) return;

    const buddyName = document.getElementById('emp-onboard-buddy')?.value || '';
    const notes = document.getElementById('emp-onboard-notes')?.value || '';

    const res = await api(`/api/iams/employees/${currentEmp._id}/onboarding`, {
      method: 'PATCH',
      body: JSON.stringify({
        buddy_name: buddyName,
        notes: notes
      })
    });

    if (res.success) {
      if (!currentEmp.onboarding) currentEmp.onboarding = {};
      currentEmp.onboarding.buddy_name = buddyName;
      currentEmp.onboarding.notes = notes;
      showToast('Onboarding notes & buddy saved');
    } else {
      showToast(res.error || 'Failed to save notes', 'error');
    }
  }

  // ── TAB 3: OKRS & GOALS ENGINE ────────────────────────────────────────────
  function renderOkrsTab() {
    const selector = document.getElementById('emp-okr-select');
    if (selector) {
      selector.innerHTML = employees.map(e => `
        <option value="${e._id}" ${e._id === selectedEmpForOkr ? 'selected' : ''}>
          ${e.full_name} (${(e.okrs || []).length} OKRs)
        </option>
      `).join('');
    }

    const currentEmp = employees.find(e => e._id === selectedEmpForOkr) || employees[0];
    if (!currentEmp) return;

    const okrs = currentEmp.okrs || [];
    const container = document.getElementById('emp-okrs-list-container');
    if (!container) return;

    if (!okrs.length) {
      container.innerHTML = `
        <div class="col-span-full p-12 text-center border border-dashed border-slate-800 rounded-2xl">
          <i data-lucide="target" class="w-10 h-10 text-cyan-400/50 mx-auto mb-3"></i>
          <h4 class="text-sm font-semibold text-white">No OKRs active for ${currentEmp.full_name}</h4>
          <p class="text-xs text-gray-400 mt-1 max-w-md mx-auto">Establish measurable quarterly objectives and key results to steer focus and alignment.</p>
          <button onclick="EmployeesUI.openCreateOkrModal('${currentEmp._id}')" class="mt-4 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-xs rounded-xl shadow-md hover:from-cyan-500 hover:to-blue-500 transition-all inline-flex items-center gap-1.5">
            <i data-lucide="plus" class="w-4 h-4"></i> Create First OKR
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = okrs.map(okr => {
      let statusColor = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      if (okr.status === 'ACHIEVED') statusColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      else if (okr.status === 'AT_RISK') statusColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      else if (okr.status === 'BEHIND') statusColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';

      return `
        <div class="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/30 transition-all space-y-4 shadow-lg">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">${okr.quarter || 'Q1-2026'}</span>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-800/60">${okr.category || 'DELIVERY'}</span>
              </div>
              <h3 class="text-sm font-bold text-white leading-snug">${okr.objective}</h3>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusColor}">
                ${okr.status}
              </span>
              <button onclick="EmployeesUI.deleteOkr('${currentEmp._id}', '${okr.okr_id}')" class="text-gray-500 hover:text-rose-400 p-1" title="Remove OKR">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>

          <!-- Overall Progress -->
          <div>
            <div class="flex items-center justify-between text-xs font-semibold mb-1">
              <span class="text-gray-400">Objective Progress</span>
              <span class="text-cyan-400 font-mono">${okr.progress}%</span>
            </div>
            <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div class="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-500" style="width: ${okr.progress}%"></div>
            </div>
          </div>

          <!-- Key Results List -->
          <div class="space-y-2 pt-2 border-t border-slate-800/80">
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Key Results</span>
            ${(okr.key_results || []).map(kr => {
              const krPct = Math.min(100, Math.round((kr.current / (kr.target || 1)) * 100));
              return `
                <div class="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1.5 text-xs">
                  <div class="flex items-center justify-between">
                    <span class="text-slate-200 font-medium truncate pr-2">${kr.text}</span>
                    <span class="font-mono text-cyan-300 font-bold shrink-0">${kr.current} / ${kr.target} ${kr.unit}</span>
                  </div>
                  <div class="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div class="bg-cyan-400 h-1.5 rounded-full" style="width: ${krPct}%"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  // ── TAB 4: SPECIALIST PERFORMANCE & KPIS ──────────────────────────────────
  function renderPerformanceTab() {
    const container = document.getElementById('emp-performance-container');
    if (!container) return;

    if (!performanceRecords.length) {
      container.innerHTML = `<div class="col-span-full py-12 text-center text-xs text-gray-500">No performance records computed yet.</div>`;
      return;
    }

    container.innerHTML = performanceRecords.map(rec => {
      const m = rec.metrics;
      const stars = '★'.repeat(Math.round(m.avg_rating)) + '☆'.repeat(5 - Math.round(m.avg_rating));

      return `
        <div class="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-4 shadow-xl">
          <!-- Specialist Header -->
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 text-cyan-300 font-bold flex items-center justify-center shrink-0 shadow-md">
                ${rec.avatar_url ? `<img src="${rec.avatar_url}" class="w-full h-full rounded-full object-cover">` : getInitials(rec.full_name)}
              </div>
              <div>
                <h4 class="font-bold text-white text-sm flex items-center gap-1.5">
                  <span>${rec.full_name}</span>
                </h4>
                <div class="text-[11px] text-gray-400">${rec.role} • <span class="text-cyan-400">${rec.department}</span></div>
              </div>
            </div>
            <button onclick="EmployeesUI.openReviewModal('${rec._id}', '${rec.full_name}')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-semibold flex items-center gap-1 transition-all">
              <i data-lucide="star" class="w-3.5 h-3.5 text-amber-400"></i> Appraise
            </button>
          </div>

          <!-- Score Metrics Grid -->
          <div class="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-800/80">
            <div class="p-2 rounded-xl bg-slate-950/70 border border-slate-800/60">
              <div class="text-[10px] text-gray-500 uppercase font-mono">Completion</div>
              <div class="text-base font-bold text-emerald-400 font-mono mt-0.5">${m.completion_rate}%</div>
              <div class="text-[9px] text-gray-400">${m.completed_tasks} / ${m.total_tasks} done</div>
            </div>
            <div class="p-2 rounded-xl bg-slate-950/70 border border-slate-800/60">
              <div class="text-[10px] text-gray-500 uppercase font-mono">On-Time</div>
              <div class="text-base font-bold text-cyan-400 font-mono mt-0.5">${m.on_time_rate}%</div>
              <div class="text-[9px] text-gray-400">${m.in_progress_tasks} in sprint</div>
            </div>
            <div class="p-2 rounded-xl bg-slate-950/70 border border-slate-800/60">
              <div class="text-[10px] text-gray-500 uppercase font-mono">Efficiency</div>
              <div class="text-base font-bold text-amber-400 font-mono mt-0.5">${m.efficiency_score}%</div>
              <div class="text-[9px] text-gray-400">${m.actual_hours}h tracked</div>
            </div>
          </div>

          <!-- Executive Rating & Reviews -->
          <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <div class="flex items-center gap-1.5">
              <span class="text-amber-400 font-bold text-sm tracking-widest">${stars}</span>
              <span class="font-mono text-gray-300 font-bold">${m.avg_rating}</span>
            </div>
            <span class="text-gray-500 text-[11px]">${m.reviews_count} CEO appraisals</span>
          </div>

          ${rec.recent_reviews?.length ? `
            <div class="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-gray-300 space-y-1">
              <div class="text-[10px] font-mono text-gray-400 flex items-center justify-between">
                <span>Latest Appraisal (${new Date(rec.recent_reviews[rec.recent_reviews.length - 1].date).toLocaleDateString()}):</span>
                <span class="text-amber-400 font-bold">★ ${rec.recent_reviews[rec.recent_reviews.length - 1].rating}/5</span>
              </div>
              <p class="text-gray-300 italic text-[11px]">"${rec.recent_reviews[rec.recent_reviews.length - 1].notes}"</p>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  // ── MODAL ACTIONS & CRUD ──────────────────────────────────────────────────
  function openCreateModal() {
    const modal = document.getElementById('emp-create-modal');
    if (modal) modal.classList.remove('hidden');
    generateRandomPassword();
  }

  function closeCreateModal() {
    const modal = document.getElementById('emp-create-modal');
    if (modal) modal.classList.add('hidden');
  }

  function generateRandomPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const input = document.getElementById('emp-create-password');
    if (input) input.value = pwd;
  }

  async function submitCreateEmployee(e) {
    if (e) e.preventDefault();
    const name = document.getElementById('emp-create-name')?.value;
    const email = document.getElementById('emp-create-email')?.value;
    const username = document.getElementById('emp-create-username')?.value;
    const password = document.getElementById('emp-create-password')?.value;
    const role = document.getElementById('emp-create-role')?.value;
    const department = document.getElementById('emp-create-department')?.value;
    const hourlyCost = document.getElementById('emp-create-rate')?.value;
    const weeklyHours = document.getElementById('emp-create-capacity')?.value;
    const buddy = document.getElementById('emp-create-buddy')?.value;

    if (!name || !email || !password) {
      showToast('Please fill in required fields (Name, Email, Password)', 'error');
      return;
    }

    const btn = document.getElementById('emp-create-submit-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Creating...'; }

    const res = await api('/api/iams/employees', {
      method: 'POST',
      body: JSON.stringify({
        full_name: name,
        email,
        username,
        password,
        role,
        department,
        cost_rates: { hourly_cost: Number(hourlyCost) || 350, currency: 'EGP' },
        capacity: { weekly_hours: Number(weeklyHours) || 40 },
        onboarding_buddy: buddy
      })
    });

    if (btn) { btn.disabled = false; btn.textContent = 'Create Employee Account'; }

    if (res.success) {
      showToast(res.message || 'Employee created successfully');
      closeCreateModal();
      await init();
    } else {
      showToast(res.error || 'Failed to create account', 'error');
    }
  }

  function openEditModal(empId) {
    const emp = employees.find(e => e._id === empId);
    if (!emp) return;
    currentEditingEmp = emp;

    document.getElementById('emp-edit-id').value = emp._id;
    document.getElementById('emp-edit-name').value = emp.full_name;
    document.getElementById('emp-edit-role').value = emp.role;
    document.getElementById('emp-edit-dept').value = emp.department || 'OPERATIONS';
    document.getElementById('emp-edit-rate').value = emp.cost_rates?.hourly_cost || 0;
    document.getElementById('emp-edit-capacity').value = emp.capacity?.weekly_hours || 40;

    const modal = document.getElementById('emp-edit-modal');
    if (modal) modal.classList.remove('hidden');
  }

  function closeEditModal() {
    const modal = document.getElementById('emp-edit-modal');
    if (modal) modal.classList.add('hidden');
  }

  async function submitEditEmployee(e) {
    if (e) e.preventDefault();
    const id = document.getElementById('emp-edit-id')?.value;
    const name = document.getElementById('emp-edit-name')?.value;
    const role = document.getElementById('emp-edit-role')?.value;
    const department = document.getElementById('emp-edit-dept')?.value;
    const rate = document.getElementById('emp-edit-rate')?.value;
    const capacity = document.getElementById('emp-edit-capacity')?.value;

    const res = await api(`/api/iams/employees/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        full_name: name,
        role,
        department,
        cost_rates: { hourly_cost: Number(rate) },
        capacity: { weekly_hours: Number(capacity) }
      })
    });

    if (res.success) {
      showToast('Profile updated successfully');
      closeEditModal();
      await init();
    } else {
      showToast(res.error || 'Failed to update profile', 'error');
    }
  }

  function openResetPasswordModal(empId) {
    const emp = employees.find(e => e._id === empId);
    if (!emp) return;

    document.getElementById('emp-reset-id').value = emp._id;
    document.getElementById('emp-reset-label').textContent = `Set new password for ${emp.full_name} (${emp.email})`;

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#';
    let pwd = '';
    for (let i = 0; i < 9; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    document.getElementById('emp-reset-new-password').value = pwd;

    const modal = document.getElementById('emp-reset-password-modal');
    if (modal) modal.classList.remove('hidden');
  }

  function closeResetPasswordModal() {
    const modal = document.getElementById('emp-reset-password-modal');
    if (modal) modal.classList.add('hidden');
  }

  async function submitResetPassword(e) {
    if (e) e.preventDefault();
    const id = document.getElementById('emp-reset-id')?.value;
    const newPwd = document.getElementById('emp-reset-new-password')?.value;

    if (!newPwd || newPwd.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    const res = await api(`/api/iams/employees/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ new_password: newPwd })
    });

    if (res.success) {
      showToast(res.message || 'Password reset successfully');
      closeResetPasswordModal();
    } else {
      showToast(res.error || 'Failed to reset password', 'error');
    }
  }

  async function toggleEmployeeActive(empId, shouldBeActive) {
    const res = await api(`/api/iams/employees/${empId}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: shouldBeActive })
    });

    if (res.success) {
      showToast(`Account ${shouldBeActive ? 'reactivated' : 'suspended'}`);
      await init();
    } else {
      showToast(res.error || 'Failed to toggle account status', 'error');
    }
  }

  // OKR Modals
  function openCreateOkrModal(empId) {
    selectedEmpForOkr = empId;
    const modal = document.getElementById('emp-create-okr-modal');
    if (modal) modal.classList.remove('hidden');
  }

  function closeCreateOkrModal() {
    const modal = document.getElementById('emp-create-okr-modal');
    if (modal) modal.classList.add('hidden');
  }

  async function submitCreateOkr(e) {
    if (e) e.preventDefault();
    const objective = document.getElementById('emp-okr-input-obj')?.value;
    const category = document.getElementById('emp-okr-input-cat')?.value;
    const quarter = document.getElementById('emp-okr-input-quarter')?.value;
    const kr1Text = document.getElementById('emp-okr-kr1-text')?.value;
    const kr1Target = document.getElementById('emp-okr-kr1-target')?.value;
    const kr2Text = document.getElementById('emp-okr-kr2-text')?.value;
    const kr2Target = document.getElementById('emp-okr-kr2-target')?.value;

    if (!objective) {
      showToast('Objective statement is required', 'error');
      return;
    }

    const krs = [];
    if (kr1Text) krs.push({ text: kr1Text, current: 0, target: Number(kr1Target) || 100, unit: '%' });
    if (kr2Text) krs.push({ text: kr2Text, current: 0, target: Number(kr2Target) || 10, unit: 'Items' });

    const res = await api(`/api/iams/employees/${selectedEmpForOkr}/okrs`, {
      method: 'POST',
      body: JSON.stringify({
        objective,
        category,
        quarter,
        key_results: krs
      })
    });

    if (res.success) {
      showToast('OKR established successfully');
      closeCreateOkrModal();
      await init();
    } else {
      showToast(res.error || 'Failed to create OKR', 'error');
    }
  }

  async function deleteOkr(empId, okrId) {
    if (!confirm('Are you sure you want to remove this OKR?')) return;
    const res = await api(`/api/iams/employees/${empId}/okrs/${okrId}`, { method: 'DELETE' });
    if (res.success) {
      showToast('OKR removed');
      await init();
    } else {
      showToast(res.error || 'Failed to delete OKR', 'error');
    }
  }

  // Review Modals
  function openReviewModal(empId, name) {
    selectedEmpForReview = empId;
    document.getElementById('emp-review-label').textContent = `Record CEO Appraisal for ${name}`;
    const modal = document.getElementById('emp-review-modal');
    if (modal) modal.classList.remove('hidden');
  }

  function closeReviewModal() {
    const modal = document.getElementById('emp-review-modal');
    if (modal) modal.classList.add('hidden');
  }

  async function submitReview(e) {
    if (e) e.preventDefault();
    const rating = document.getElementById('emp-review-rating')?.value;
    const notes = document.getElementById('emp-review-notes')?.value;
    const category = document.getElementById('emp-review-category')?.value;

    const res = await api(`/api/iams/employees/${selectedEmpForReview}/reviews`, {
      method: 'POST',
      body: JSON.stringify({
        rating: Number(rating) || 5,
        notes: notes || 'Met all performance benchmarks.',
        category: category || 'Quarterly Appraisal'
      })
    });

    if (res.success) {
      showToast('Appraisal recorded');
      closeReviewModal();
      await init();
    } else {
      showToast(res.error || 'Failed to record appraisal', 'error');
    }
  }

  function setDeptFilter(dept) {
    activeDeptFilter = dept;
    renderAccountsTab();
  }

  function setSearch(query) {
    searchQuery = query;
    renderAccountsTab();
  }

  function selectOnboardingEmployee(empId) {
    selectedEmpForOnboarding = empId;
    renderOnboardingTab();
    if (window.lucide) window.lucide.createIcons();
  }

  function selectOkrEmployee(empId) {
    selectedEmpForOkr = empId;
    renderOkrsTab();
    if (window.lucide) window.lucide.createIcons();
  }

  return {
    init,
    switchTab,
    openCreateModal,
    closeCreateModal,
    generateRandomPassword,
    submitCreateEmployee,
    openEditModal,
    closeEditModal,
    submitEditEmployee,
    openResetPasswordModal,
    closeResetPasswordModal,
    submitResetPassword,
    toggleEmployeeActive,
    selectOnboardingEmployee,
    toggleOnboardingStep,
    saveOnboardingMetadata,
    selectOkrEmployee,
    openCreateOkrModal,
    closeCreateOkrModal,
    submitCreateOkr,
    deleteOkr,
    openReviewModal,
    closeReviewModal,
    submitReview,
    setDeptFilter,
    setSearch
  };
})();
