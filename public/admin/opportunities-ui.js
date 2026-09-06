/**
 * ICEBERG AGENCY — OPPORTUNITIES PIPELINE SPA CONTROLLER
 * Full Kanban CRM & Revenue Forecasting
 */

window.Opportunities = (function () {
  let activeOpportunities = [];
  let currentOpportunity = null;
  let activeTab = 'board';

  const STAGES = [
    { key: 'NEW', label: 'New Lead', color: 'slate' },
    { key: 'QUALIFIED', label: 'Qualified', color: 'blue' },
    { key: 'PROPOSAL', label: 'Proposal Sent', color: 'indigo' },
    { key: 'NEGOTIATION', label: 'In Negotiation', color: 'amber' },
    { key: 'WON', label: 'Closed Won', color: 'emerald' },
    { key: 'LOST', label: 'Closed Lost', color: 'rose' }
  ];

  async function loadBoard() {
    await Promise.all([loadStats(), renderBoard()]);
  }

  async function loadStats() {
    const res = await adminFetch('/api/iams/opportunities/stats');
    if (!res.success) return;

    const s = res.stats;
    const elPipe = document.getElementById('opp-kpi-total-val');
    const elWeight = document.getElementById('opp-kpi-weighted-val');
    const elWin = document.getElementById('opp-kpi-win-rate');
    const elDays = document.getElementById('opp-kpi-avg-days');

    if (elPipe) elPipe.textContent = `$${(s.total_pipeline_value || 0).toLocaleString()}`;
    if (elWeight) elWeight.textContent = `$${(s.total_weighted_value || 0).toLocaleString()}`;
    if (elWin) elWin.textContent = `${s.win_rate_percent || 0}%`;
    if (elDays) elDays.textContent = `${s.avg_days_to_close || 0}d`;
  }

  async function renderBoard() {
    const container = document.getElementById('opp-board-columns');
    if (!container) return;

    const res = await adminFetch('/api/iams/opportunities/board');
    if (!res.success) {
      container.innerHTML = `<div class="col-span-6 text-center py-10 text-rose-400">${res.error || 'Failed to load pipeline.'}</div>`;
      return;
    }

    const { board, column_totals } = res;

    container.innerHTML = STAGES.map(stage => {
      const items = board[stage.key] || [];
      const totals = column_totals[stage.key] || { count: 0, estimated_total: 0, weighted_total: 0 };

      return `
        <div class="flex flex-col bg-slate-900/50 border border-slate-800/80 rounded-2xl p-3 min-w-[280px] max-w-[320px] flex-1">
          <!-- Column Header -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-${stage.color}-400"></span>
              <h4 class="font-bold text-xs uppercase tracking-wider text-white">${stage.label}</h4>
            </div>
            <span class="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-800 text-slate-300">${items.length}</span>
          </div>

          <!-- Column Value Banner -->
          <div class="bg-slate-950/60 rounded-xl p-2 mb-3 border border-slate-800/60 flex justify-between text-[11px] font-mono">
            <span class="text-slate-400">Est: <strong class="text-white">$${totals.estimated_total.toLocaleString()}</strong></span>
            <span class="text-slate-400">Wgt: <strong class="text-cyan-400">$${totals.weighted_total.toLocaleString()}</strong></span>
          </div>

          <!-- Cards Stack -->
          <div class="space-y-3 flex-1 overflow-y-auto max-h-[620px] pr-1" id="opp-col-${stage.key}" ondragover="event.preventDefault()" ondrop="window.Opportunities.handleDrop(event, '${stage.key}')">
            ${items.map(opp => `
              <div draggable="true" ondragstart="window.Opportunities.handleDragStart(event, '${opp.opportunity_id}')" onclick="window.Opportunities.openDetail('${opp.opportunity_id}')" class="glass-card p-3.5 rounded-xl border border-slate-800 hover:border-cyan-500/50 transition cursor-pointer group">
                <div class="flex justify-between items-start mb-1.5">
                  <h5 class="font-bold text-white text-xs group-hover:text-cyan-400 transition line-clamp-1">${opp.name}</h5>
                  <span class="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded">${opp.probability_percent}%</span>
                </div>

                <p class="text-[11px] text-slate-400 line-clamp-1 mb-2.5">${opp.contact_person?.company || opp.industry || 'General'}</p>

                <div class="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs font-mono">
                  <span class="font-bold text-white">${opp.currency} ${(opp.estimated_value || 0).toLocaleString()}</span>
                  <span class="text-[10px] text-slate-400">${opp.expected_close_date ? new Date(opp.expected_close_date).toLocaleDateString() : 'No date'}</span>
                </div>
              </div>
            `).join('')}

            ${items.length === 0 ? '<div class="h-24 flex items-center justify-center border-2 border-dashed border-slate-800/60 rounded-xl text-slate-500 text-xs italic">Drop here</div>' : ''}
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  function handleDragStart(e, oppId) {
    e.dataTransfer.setData('text/plain', oppId);
  }

  async function handleDrop(e, targetStage) {
    e.preventDefault();
    const oppId = e.dataTransfer.getData('text/plain');
    if (!oppId) return;
    await moveStage(oppId, targetStage);
  }

  async function moveStage(id, stage) {
    const res = await adminFetch(`/api/iams/opportunities/${id}/stage`, {
      method: 'POST',
      body: JSON.stringify({ stage })
    });

    if (res.success) {
      showAdminToast(`Moved opportunity to ${stage}`);
      loadBoard();
    } else {
      showAdminToast('Failed to move stage: ' + res.error, 'error');
    }
  }

  async function openDetail(id) {
    const res = await adminFetch(`/api/iams/opportunities/${id}`);
    if (!res.success) {
      showAdminToast('Could not load opportunity: ' + res.error, 'error');
      return;
    }

    currentOpportunity = res.opportunity;
    const opp = currentOpportunity;

    const drawer = document.getElementById('opp-detail-drawer');
    const content = document.getElementById('opp-detail-content');
    if (!drawer || !content) return;

    content.innerHTML = `
      <div class="space-y-6">
        <div class="flex justify-between items-start pb-4 border-b border-slate-800">
          <div>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">${opp.stage}</span>
            <h3 class="text-xl font-bold text-white mt-1.5">${opp.name}</h3>
            <p class="text-xs text-slate-400 font-mono">${opp.opportunity_id} • Source: ${opp.source}</p>
          </div>
          <div class="text-right">
            <div class="text-xl font-mono font-extrabold text-cyan-400">${opp.currency} ${(opp.estimated_value || 0).toLocaleString()}</div>
            <div class="text-xs text-slate-400 font-mono">Weighted: $${(opp.weighted_value || 0).toLocaleString()} (${opp.probability_percent}%)</div>
          </div>
        </div>

        <!-- Stage Progression Bar -->
        <div>
          <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Stage</label>
          <div class="grid grid-cols-6 gap-1">
            ${STAGES.map(s => `
              <button type="button" onclick="window.Opportunities.moveStage('${opp.opportunity_id}', '${s.key}')" class="py-1.5 px-2 rounded-lg text-[10px] font-bold transition ${opp.stage === s.key ? 'bg-cyan-500 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:text-white'}">
                ${s.label}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Contact Person & Details -->
        <div class="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div>
            <div class="text-[10px] uppercase font-bold text-slate-400">Contact Person</div>
            <div class="text-sm font-bold text-white mt-0.5">${opp.contact_person?.name || 'N/A'}</div>
            <div class="text-xs text-slate-400">${opp.contact_person?.email || 'N/A'} • ${opp.contact_person?.phone || ''}</div>
          </div>
          <div>
            <div class="text-[10px] uppercase font-bold text-slate-400">Company & Industry</div>
            <div class="text-sm font-bold text-white mt-0.5">${opp.contact_person?.company || 'N/A'}</div>
            <div class="text-xs text-slate-400">${opp.industry || 'General'}</div>
          </div>
        </div>

        <!-- Convert to Client Action (CEO only) -->
        <div class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
          <div>
            <h5 class="text-sm font-bold text-emerald-300">Convert to Active Client</h5>
            <p class="text-xs text-slate-400">Spawns a full IAMS client account and synchronizes financial ledger.</p>
          </div>
          <button type="button" onclick="window.Opportunities.convertToClient('${opp.opportunity_id}')" class="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20">
            <i data-lucide="user-plus" class="w-4 h-4"></i> Convert Client
          </button>
        </div>

        <!-- Activities Feed -->
        <div>
          <div class="flex justify-between items-center mb-3">
            <h5 class="text-sm font-bold text-white">Activities & History</h5>
            <button type="button" onclick="window.Opportunities.showActivityForm()" class="text-xs text-cyan-400 hover:underline font-bold">+ Log Activity</button>
          </div>

          <div id="opp-activity-form-box" class="hidden mb-4 p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <select id="opp-act-type" class="form-input text-xs bg-slate-950 border-slate-800 rounded-lg p-2 text-slate-200">
                <option value="CALL">Phone Call</option>
                <option value="EMAIL">Email</option>
                <option value="MEETING">Meeting</option>
                <option value="TASK">Follow-up Task</option>
                <option value="NOTE" selected>Internal Note</option>
              </select>
              <input type="date" id="opp-act-due" class="form-input text-xs bg-slate-950 border-slate-800 rounded-lg p-2 text-slate-200">
            </div>
            <textarea id="opp-act-summary" rows="2" placeholder="Summary of interaction..." class="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"></textarea>
            <div class="flex justify-end gap-2">
              <button type="button" onclick="window.Opportunities.hideActivityForm()" class="px-3 py-1.5 text-xs text-slate-400">Cancel</button>
              <button type="button" onclick="window.Opportunities.submitActivity('${opp.opportunity_id}')" class="px-3 py-1.5 text-xs bg-cyan-500 text-white rounded-lg font-bold">Save</button>
            </div>
          </div>

          <div class="space-y-2.5 max-h-60 overflow-y-auto">
            ${(opp.activities || []).length ? opp.activities.map(a => `
              <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex justify-between items-start">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-cyan-300 font-mono">${a.type}</span>
                    <span class="font-bold text-slate-200">${a.summary}</span>
                  </div>
                  <div class="text-[10px] text-slate-500 mt-1">${new Date(a.created_at).toLocaleString()} by ${a.created_by}</div>
                </div>
                ${a.completed_at ? '<span class="text-emerald-400 text-[10px] font-bold">✓ Done</span>' : `
                  <button type="button" onclick="window.Opportunities.completeActivity('${opp.opportunity_id}', '${a.activity_id}')" class="text-[10px] text-slate-400 hover:text-white underline">Mark Done</button>
                `}
              </div>
            `).join('') : '<p class="text-slate-500 text-xs italic py-2">No activity logged yet.</p>'}
          </div>
        </div>
      </div>
    `;

    drawer.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  function closeDetailDrawer() {
    const drawer = document.getElementById('opp-detail-drawer');
    if (drawer) drawer.classList.add('hidden');
  }

  function showActivityForm() {
    const formBox = document.getElementById('opp-activity-form-box');
    if (formBox) formBox.classList.remove('hidden');
  }

  function hideActivityForm() {
    const formBox = document.getElementById('opp-activity-form-box');
    if (formBox) formBox.classList.add('hidden');
  }

  async function submitActivity(oppId) {
    const type = document.getElementById('opp-act-type')?.value;
    const dueDate = document.getElementById('opp-act-due')?.value;
    const summary = document.getElementById('opp-act-summary')?.value;

    if (!summary) {
      showAdminToast('Please provide an activity summary', 'error');
      return;
    }

    const res = await adminFetch(`/api/iams/opportunities/${oppId}/activities`, {
      method: 'POST',
      body: JSON.stringify({ type, summary, due_date: dueDate })
    });

    if (res.success) {
      showAdminToast('Activity logged');
      openDetail(oppId);
      loadBoard();
    } else {
      showAdminToast('Failed to log activity: ' + res.error, 'error');
    }
  }

  async function completeActivity(oppId, actId) {
    const res = await adminFetch(`/api/iams/opportunities/${oppId}/activities/${actId}`, {
      method: 'PATCH'
    });
    if (res.success) {
      showAdminToast('Activity marked completed.');
      openDetail(oppId);
    }
  }

  async function convertToClient(oppId) {
    if (!confirm('Are you sure you want to convert this Opportunity into an active IAMS Client account?')) return;

    const res = await adminFetch(`/api/iams/opportunities/${oppId}/convert`, {
      method: 'POST'
    });

    if (res.success) {
      showAdminToast(res.message);
      closeDetailDrawer();
      loadBoard();
    } else {
      showAdminToast('Conversion failed: ' + res.error, 'error');
    }
  }

  function openCreateModal() {
    const modal = document.getElementById('opp-create-modal');
    if (modal) modal.classList.remove('hidden');
  }

  function closeCreateModal() {
    const modal = document.getElementById('opp-create-modal');
    if (modal) modal.classList.add('hidden');
  }

  async function handleCreateSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('opp-create-name')?.value;
    const company = document.getElementById('opp-create-company')?.value;
    const email = document.getElementById('opp-create-email')?.value;
    const phone = document.getElementById('opp-create-phone')?.value;
    const industry = document.getElementById('opp-create-industry')?.value;
    const estimated_value = document.getElementById('opp-create-value')?.value;
    const currency = document.getElementById('opp-create-currency')?.value;
    const probability_percent = document.getElementById('opp-create-probability')?.value;
    const expected_close_date = document.getElementById('opp-create-date')?.value;
    const source = document.getElementById('opp-create-source')?.value;

    const payload = {
      name,
      industry,
      estimated_value: Number(estimated_value) || 0,
      currency,
      probability_percent: Number(probability_percent) || 20,
      expected_close_date,
      source,
      contact_person: {
        company,
        name,
        email,
        phone
      }
    };

    const res = await adminFetch('/api/iams/opportunities', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res.success) {
      showAdminToast('Opportunity created successfully.');
      closeCreateModal();
      loadBoard();
    } else {
      showAdminToast('Failed to create opportunity: ' + res.error, 'error');
    }
  }

  return {
    loadBoard,
    loadStats,
    openDetail,
    closeDetailDrawer,
    openCreateModal,
    closeCreateModal,
    handleCreateSubmit,
    moveStage,
    showActivityForm,
    hideActivityForm,
    submitActivity,
    completeActivity,
    convertToClient,
    handleDragStart,
    handleDrop
  };
})();
