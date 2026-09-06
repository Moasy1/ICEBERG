/**
 * ICEBERG AGENCY — AUDIT, BEHAVIOR & DATABASE CENTER UI CONTROLLERS
 * Unified administrative client engine
 */

// Helper API Fetcher for Admin
async function adminFetch(endpoint, options = {}) {
  const token = sessionStorage.getItem('iceberg_admin_token') || 'demo_token';
  const headers = {
    'Content-Type': 'application/json',
    'x-demo-admin': 'true',
    ...(options.headers || {})
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(endpoint, { ...options, headers });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('[Admin API Error]:', err);
    return { success: false, error: err.message };
  }
}

function showAdminToast(msg, type = 'success') {
  if (window.IAMS && typeof window.IAMS.showToast === 'function') {
    window.IAMS.showToast(msg, type);
    return;
  }
  const toast = document.createElement('div');
  const bg = type === 'success' ? 'bg-emerald-500/90 border-emerald-400' : 'bg-rose-500/90 border-rose-400';
  toast.className = `fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white font-medium border shadow-2xl backdrop-blur-md transition-all duration-300 flex items-center gap-2 ${bg}`;
  toast.innerHTML = `<span>${msg}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. AUDIT CENTER CONTROLLER
// ─────────────────────────────────────────────────────────────────────────────
window.AuditCenter = (function () {
  let currentLogs = [];
  let currentPage = 1;
  let activeTab = 'logs';

  async function loadOverview() {
    await Promise.all([loadSummaryKPIs(), loadLogs(1)]);
  }

  async function loadSummaryKPIs() {
    const res = await adminFetch('/api/iams/audit/summary');
    if (res.success && res.summary) {
      const s = res.summary;
      const elToday = document.getElementById('audit-kpi-today');
      const elCritical = document.getElementById('audit-kpi-critical');
      const elTopUser = document.getElementById('audit-kpi-top-user');
      const elMostEdited = document.getElementById('audit-kpi-most-edited');

      if (elToday) elToday.textContent = s.events_today;
      if (elCritical) elCritical.textContent = s.critical_this_week;
      if (elTopUser) elTopUser.textContent = s.top_user?.email ? s.top_user.email.split('@')[0] : 'None';
      if (elMostEdited) elMostEdited.textContent = s.most_edited_entity?.type || 'None';
    }
  }

  async function loadLogs(page = 1) {
    currentPage = page;
    const severity = document.getElementById('audit-filter-severity')?.value || '';
    const entityType = document.getElementById('audit-filter-entity')?.value || '';
    const q = document.getElementById('audit-filter-search')?.value || '';

    let url = `/api/iams/audit?page=${page}&limit=25`;
    if (severity) url += `&severity=${encodeURIComponent(severity)}`;
    if (entityType) url += `&entity_type=${encodeURIComponent(entityType)}`;
    if (q) url += `&q=${encodeURIComponent(q)}`;

    const tbody = document.getElementById('audit-logs-tbody');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-slate-400">Loading audit trail...</td></tr>`;
    }

    const res = await adminFetch(url);
    if (!res.success) {
      if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-rose-400 font-semibold">${res.error || 'Failed to load logs. CEO privilege required.'}</td></tr>`;
      return;
    }

    currentLogs = res.logs || [];
    renderLogsTable(currentLogs, res.total, res.page, res.total_pages);
  }

  function renderLogsTable(logs, total, page, totalPages) {
    const tbody = document.getElementById('audit-logs-tbody');
    const pageInfo = document.getElementById('audit-page-info');
    if (pageInfo) pageInfo.textContent = `Page ${page} of ${totalPages || 1} (${total} events)`;

    if (!tbody) return;

    if (!logs.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-slate-400">No audit events match criteria.</td></tr>`;
      return;
    }

    tbody.innerHTML = logs.map(log => {
      let sevBadge = 'bg-slate-800 text-slate-300 border-slate-700';
      if (log.severity === 'WARN') sevBadge = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      if (log.severity === 'CRITICAL') sevBadge = 'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse';

      const timeStr = new Date(log.created_at).toLocaleString();
      const userStr = log.user_email || 'system';

      return `
        <tr class="hover:bg-slate-800/40 border-b border-slate-800/60 transition cursor-pointer" onclick="window.AuditCenter.showDiffModal('${log.log_id}')">
          <td class="py-3 px-4 text-xs font-mono text-slate-400 whitespace-nowrap">${timeStr}</td>
          <td class="py-3 px-4 text-xs">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border ${sevBadge}">${log.severity || 'INFO'}</span>
          </td>
          <td class="py-3 px-4 text-xs font-medium text-slate-200">${userStr}</td>
          <td class="py-3 px-4 text-xs font-mono text-cyan-400">${log.action}</td>
          <td class="py-3 px-4 text-xs text-slate-300">
            <span class="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-[10px] font-bold">${log.entity_type}</span>
            <span class="text-slate-400 font-mono text-[11px] ml-1.5">${log.entity_id}</span>
          </td>
          <td class="py-3 px-4 text-xs text-slate-400 font-mono">${log.ip_address || '-'}</td>
        </tr>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  function showDiffModal(logId) {
    const log = currentLogs.find(l => l.log_id === logId);
    if (!log) return;

    const modal = document.getElementById('audit-diff-modal');
    const content = document.getElementById('audit-diff-content');
    if (!modal || !content) return;

    const diff = log.details?.diff || {};
    const hasAdded = diff.added && Object.keys(diff.added).length > 0;
    const hasRemoved = diff.removed && Object.keys(diff.removed).length > 0;
    const hasChanged = diff.changed && Object.keys(diff.changed).length > 0;

    let diffHtml = '';

    if (hasAdded || hasRemoved || hasChanged) {
      diffHtml = `
        <div class="space-y-4">
          ${hasChanged ? `
            <div>
              <h5 class="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">Changed Fields</h5>
              <div class="bg-slate-900/90 rounded-xl p-3 border border-amber-500/20 font-mono text-xs space-y-2">
                ${Object.entries(diff.changed).map(([k, v]) => `
                  <div class="border-b border-slate-800/80 pb-1.5">
                    <span class="text-slate-300 font-bold">${k}:</span>
                    <div class="text-rose-400 ml-4">- ${JSON.stringify(v.before)}</div>
                    <div class="text-emerald-400 ml-4">+ ${JSON.stringify(v.after)}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${hasAdded ? `
            <div>
              <h5 class="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">Added Fields</h5>
              <pre class="bg-slate-900/90 rounded-xl p-3 border border-emerald-500/20 font-mono text-xs text-emerald-300 overflow-x-auto">${JSON.stringify(diff.added, null, 2)}</pre>
            </div>
          ` : ''}

          ${hasRemoved ? `
            <div>
              <h5 class="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2">Removed Fields</h5>
              <pre class="bg-slate-900/90 rounded-xl p-3 border border-rose-500/20 font-mono text-xs text-rose-300 overflow-x-auto">${JSON.stringify(diff.removed, null, 2)}</pre>
            </div>
          ` : ''}
        </div>
      `;
    } else {
      diffHtml = `
        <div class="text-center py-4 text-slate-400 text-xs italic">
          No structured field diff recorded for this action.
        </div>
      `;
    }

    content.innerHTML = `
      <div class="mb-4 pb-3 border-b border-slate-800 flex justify-between items-start">
        <div>
          <span class="px-2 py-0.5 rounded text-[10px] font-bold border ${log.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'}">${log.severity}</span>
          <h4 class="text-lg font-bold text-white mt-1">${log.action}</h4>
          <p class="text-xs text-slate-400">${new Date(log.created_at).toLocaleString()} • ${log.user_email} • IP: ${log.ip_address || 'Unknown'}</p>
        </div>
        <div class="text-right text-xs">
          <span class="text-slate-400">Entity:</span> <strong class="text-slate-200">${log.entity_type}</strong>
          <div class="font-mono text-slate-400 text-[11px]">${log.entity_id}</div>
        </div>
      </div>

      <div class="space-y-4">
        ${diffHtml}

        <div>
          <h5 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Raw Details & Metadata</h5>
          <pre class="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300 text-xs font-mono overflow-x-auto max-h-48">${JSON.stringify(log.details || {}, null, 2)}</pre>
        </div>

        ${log.before ? `
          <div>
            <h5 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Complete Before Snapshot</h5>
            <pre class="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-400 text-xs font-mono overflow-x-auto max-h-36">${JSON.stringify(log.before, null, 2)}</pre>
          </div>
        ` : ''}

        ${log.after ? `
          <div>
            <h5 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Complete After Snapshot</h5>
            <pre class="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-400 text-xs font-mono overflow-x-auto max-h-36">${JSON.stringify(log.after, null, 2)}</pre>
          </div>
        ` : ''}
      </div>
    `;

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  function closeDiffModal() {
    const modal = document.getElementById('audit-diff-modal');
    if (modal) modal.classList.add('hidden');
  }

  async function loadSuspicious() {
    const container = document.getElementById('audit-suspicious-list');
    if (!container) return;
    container.innerHTML = `<div class="text-center py-6 text-slate-400">Scanning for threat signatures...</div>`;

    const res = await adminFetch('/api/iams/audit/suspicious');
    if (!res.success) {
      container.innerHTML = `<div class="text-rose-400 p-4">${res.error || 'Failed to query threat signatures.'}</div>`;
      return;
    }

    const { failed_logins, deletions, critical_alerts, warnings } = res.suspicious;

    container.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Failed Logins -->
        <div class="glass-card p-5 rounded-2xl border border-rose-500/20">
          <div class="flex items-center gap-2 mb-3">
            <i data-lucide="shield-alert" class="w-5 h-5 text-rose-400"></i>
            <h4 class="font-bold text-white text-sm">Failed Authentication Attempts (${failed_logins.length})</h4>
          </div>
          <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
            ${failed_logins.length ? failed_logins.map(l => `
              <div class="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs flex justify-between items-center">
                <div>
                  <div class="font-semibold text-rose-300">${l.entity_id}</div>
                  <div class="text-[10px] text-slate-400">${new Date(l.created_at).toLocaleString()} • IP: ${l.ip_address}</div>
                </div>
                <span class="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold">FAILED</span>
              </div>
            `).join('') : '<p class="text-slate-400 text-xs italic py-2">No failed logins detected in last 7 days.</p>'}
          </div>
        </div>

        <!-- Deletions -->
        <div class="glass-card p-5 rounded-2xl border border-amber-500/20">
          <div class="flex items-center gap-2 mb-3">
            <i data-lucide="trash-2" class="w-5 h-5 text-amber-400"></i>
            <h4 class="font-bold text-white text-sm">Entity Deletions (${deletions.length})</h4>
          </div>
          <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
            ${deletions.length ? deletions.map(l => `
              <div class="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs flex justify-between items-center">
                <div>
                  <div class="font-semibold text-amber-300">${l.action} • ${l.entity_type}</div>
                  <div class="text-[10px] text-slate-400">${l.user_email} • ${new Date(l.created_at).toLocaleDateString()}</div>
                </div>
                <span class="font-mono text-slate-400 text-[10px]">${l.entity_id}</span>
              </div>
            `).join('') : '<p class="text-slate-400 text-xs italic py-2">No deletion actions in last 7 days.</p>'}
          </div>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  }

  function exportLogs(format = 'csv') {
    const severity = document.getElementById('audit-filter-severity')?.value || '';
    const entityType = document.getElementById('audit-filter-entity')?.value || '';
    const q = document.getElementById('audit-filter-search')?.value || '';
    const token = sessionStorage.getItem('iceberg_admin_token') || 'demo_token';

    let url = `/api/iams/audit/export?format=${format}`;
    if (severity) url += `&severity=${encodeURIComponent(severity)}`;
    if (entityType) url += `&entity_type=${encodeURIComponent(entityType)}`;
    if (q) url += `&q=${encodeURIComponent(q)}`;

    // Trigger secure download
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-demo-admin': 'true'
      }
    })
      .then(res => res.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `audit_logs_${Date.now()}.${format}`;
        a.click();
        showAdminToast(`Exported audit logs as ${format.toUpperCase()}`);
      })
      .catch(err => {
        showAdminToast('Failed to export logs: ' + err.message, 'error');
      });
  }

  function switchTab(tab) {
    activeTab = tab;
    document.querySelectorAll('.audit-tab-btn').forEach(btn => {
      btn.classList.remove('bg-cyan-500/20', 'text-cyan-400', 'border-cyan-500/30');
      btn.classList.add('text-slate-400', 'border-transparent');
    });
    const activeBtn = document.getElementById(`audit-tab-${tab}`);
    if (activeBtn) {
      activeBtn.classList.add('bg-cyan-500/20', 'text-cyan-400', 'border-cyan-500/30');
      activeBtn.classList.remove('text-slate-400', 'border-transparent');
    }

    const logView = document.getElementById('audit-view-logs');
    const suspView = document.getElementById('audit-view-suspicious');

    if (tab === 'logs') {
      if (logView) logView.classList.remove('hidden');
      if (suspView) suspView.classList.add('hidden');
      loadLogs(1);
    } else if (tab === 'suspicious') {
      if (logView) logView.classList.add('hidden');
      if (suspView) suspView.classList.remove('hidden');
      loadSuspicious();
    }
  }

  return {
    loadOverview,
    loadLogs,
    loadSuspicious,
    showDiffModal,
    closeDiffModal,
    exportLogs,
    switchTab
  };
})();

// ─────────────────────────────────────────────────────────────────────────────
// 2. BEHAVIOR CENTER CONTROLLER
// ─────────────────────────────────────────────────────────────────────────────
window.BehaviorCenter = (function () {
  async function loadOverview() {
    await Promise.all([loadDAU(), loadUserRoster(), loadFeatureAdoption(), loadHeatmap()]);
  }

  async function loadDAU() {
    const res = await adminFetch('/api/iams/behavior/dau');
    if (!res.success) return;

    const currentDauEl = document.getElementById('behavior-kpi-dau');
    if (currentDauEl) currentDauEl.textContent = res.current_dau || 0;

    const chartContainer = document.getElementById('behavior-dau-chart');
    if (!chartContainer) return;

    const series = res.series || [];
    if (!series.length) {
      chartContainer.innerHTML = `<div class="text-center py-12 text-slate-400">No telemetry data recorded yet.</div>`;
      return;
    }

    // Pure SVG Line Chart Render
    const maxVal = Math.max(...series.map(s => s.active_users), 5);
    const width = 600;
    const height = 140;
    const padding = 20;

    const points = series.map((s, i) => {
      const x = padding + (i / Math.max(1, series.length - 1)) * (width - 2 * padding);
      const y = height - padding - (s.active_users / maxVal) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');

    chartContainer.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" class="w-full h-36 overflow-visible">
        <defs>
          <linearGradient id="dauGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.0"/>
          </linearGradient>
        </defs>
        <polyline fill="none" stroke="#06b6d4" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${points}" />
        ${series.map((s, i) => {
          const x = padding + (i / Math.max(1, series.length - 1)) * (width - 2 * padding);
          const y = height - padding - (s.active_users / maxVal) * (height - 2 * padding);
          return `<circle cx="${x}" cy="${y}" r="3.5" fill="#38bdf8" stroke="#0f172a" stroke-width="2"><title>${s.date}: ${s.active_users} DAU</title></circle>`;
        }).join('')}
      </svg>
    `;
  }

  async function loadUserRoster() {
    const tbody = document.getElementById('behavior-roster-tbody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-slate-400">Loading user activity matrix...</td></tr>`;

    const res = await adminFetch('/api/iams/behavior/users');
    if (!res.success) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-rose-400">${res.error || 'Failed to load user roster.'}</td></tr>`;
      return;
    }

    const users = res.users || [];
    tbody.innerHTML = users.map(u => {
      const lastSeenStr = u.last_seen ? new Date(u.last_seen).toLocaleDateString() : 'Never';
      return `
        <tr class="hover:bg-slate-800/40 border-b border-slate-800/60 transition">
          <td class="py-3 px-4">
            <div class="font-bold text-white text-xs">${u.full_name}</div>
            <div class="text-[11px] text-slate-400 font-mono">${u.email}</div>
          </td>
          <td class="py-3 px-4 text-xs font-mono text-cyan-400 font-bold">${u.events_this_week}</td>
          <td class="py-3 px-4 text-xs font-mono text-slate-300">${u.top_action}</td>
          <td class="py-3 px-4 text-xs text-slate-400">${lastSeenStr}</td>
          <td class="py-3 px-4">
            <div class="flex items-center gap-2">
              <div class="w-16 bg-slate-800 h-2 rounded-full overflow-hidden">
                <div class="bg-cyan-500 h-full rounded-full" style="width: ${u.productivity_score}%"></div>
              </div>
              <span class="text-xs font-bold text-cyan-300 font-mono">${u.productivity_score}</span>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  async function loadFeatureAdoption() {
    const container = document.getElementById('behavior-features-container');
    if (!container) return;

    const res = await adminFetch('/api/iams/behavior/features');
    if (!res.success) return;

    const features = res.features || [];
    container.innerHTML = features.map(f => `
      <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
        <div class="flex justify-between items-center mb-1.5">
          <span class="text-xs font-bold text-slate-200">${f.name}</span>
          <span class="text-xs font-mono font-bold text-cyan-400">${f.adoption_percent}%</span>
        </div>
        <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div class="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500" style="width: ${f.adoption_percent}%"></div>
        </div>
      </div>
    `).join('');
  }

  async function loadHeatmap() {
    const container = document.getElementById('behavior-heatmap-grid');
    if (!container) return;

    const res = await adminFetch('/api/iams/behavior/heatmap');
    if (!res.success) return;

    const { grid, max_count, days } = res;
    const maxVal = Math.max(max_count, 1);

    let html = '<div class="grid grid-cols-25 gap-1 text-[9px] font-mono">';
    // Header hours
    html += '<div class="text-slate-500">Day</div>';
    for (let h = 0; h < 24; h++) {
      html += `<div class="text-slate-500 text-center">${h}</div>`;
    }

    // Days rows
    days.forEach((d, dayIndex) => {
      html += `<div class="text-slate-400 font-bold py-1">${d}</div>`;
      for (let h = 0; h < 24; h++) {
        const val = grid[dayIndex][h];
        const intensity = Math.min(1, val / maxVal);
        let bg = 'bg-slate-900/40 border border-slate-800/40';
        if (val > 0) {
          bg = `bg-cyan-500/${Math.max(20, Math.round(intensity * 90))} border border-cyan-500/40`;
        }
        html += `<div class="h-6 rounded flex items-center justify-center text-[8px] text-white ${bg}" title="${d} ${h}:00 - ${val} actions">${val ? val : ''}</div>`;
      }
    });

    html += '</div>';
    container.innerHTML = html;
  }

  return {
    loadOverview,
    loadDAU,
    loadUserRoster,
    loadFeatureAdoption,
    loadHeatmap
  };
})();

// ─────────────────────────────────────────────────────────────────────────────
// 3. DATABASE CENTER CONTROLLER
// ─────────────────────────────────────────────────────────────────────────────
window.DatabaseCenter = (function () {
  let activeCollection = null;
  let currentDocs = [];
  let currentPage = 1;

  async function loadCollections() {
    const container = document.getElementById('db-collections-grid');
    if (!container) return;

    container.innerHTML = `<div class="col-span-3 text-center py-10 text-slate-400">Inspecting database models...</div>`;

    const res = await adminFetch('/api/iams/database/collections');
    if (!res.success) {
      container.innerHTML = `<div class="col-span-3 text-rose-400 p-6 text-center font-bold">${res.error || 'Failed to inspect collections. CEO privilege required.'}</div>`;
      return;
    }

    const collections = res.collections || [];

    // KPI count
    const kpiTotal = document.getElementById('db-kpi-collections');
    if (kpiTotal) kpiTotal.textContent = collections.length;

    let totalDocs = collections.reduce((sum, c) => sum + (c.document_count || 0), 0);
    const kpiDocs = document.getElementById('db-kpi-docs');
    if (kpiDocs) kpiDocs.textContent = totalDocs.toLocaleString();

    container.innerHTML = collections.map(c => `
      <div class="glass-card p-5 rounded-2xl border ${c.is_protected ? 'border-amber-500/30' : 'border-slate-800'} hover:border-cyan-500/50 transition flex flex-col justify-between">
        <div>
          <div class="flex justify-between items-start mb-2">
            <h4 class="font-bold text-white text-base">${c.model_name}</h4>
            ${c.is_protected ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">PROTECTED</span>' : ''}
          </div>
          <p class="text-xs text-slate-400 font-mono mb-4">collection: ${c.collection_name}</p>
          <div class="flex gap-4 text-xs font-mono mb-4">
            <div><span class="text-slate-400">Docs:</span> <strong class="text-cyan-400 font-bold">${c.document_count.toLocaleString()}</strong></div>
            <div><span class="text-slate-400">Indexes:</span> <strong class="text-slate-200">${c.index_count}</strong></div>
          </div>
        </div>
        <div class="flex items-center gap-2 pt-3 border-t border-slate-800/80">
          <button type="button" onclick="window.DatabaseCenter.browseCollection('${c.model_name}')" class="flex-1 py-1.5 px-3 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs font-bold hover:bg-cyan-500/30 transition flex items-center justify-center gap-1">
            <i data-lucide="table" class="w-3.5 h-3.5"></i> Browse
          </button>
          <button type="button" onclick="window.DatabaseCenter.exportCollection('${c.model_name}', 'csv')" title="Export CSV" class="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition">
            <i data-lucide="download" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  async function browseCollection(name, page = 1) {
    activeCollection = name;
    currentPage = page;

    const modal = document.getElementById('db-browse-modal');
    const titleEl = document.getElementById('db-browse-title');
    const tbody = document.getElementById('db-browse-tbody');
    const pageInfo = document.getElementById('db-browse-page');

    if (titleEl) titleEl.textContent = `Collection: ${name}`;
    if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-slate-400">Loading documents...</td></tr>`;
    if (modal) modal.classList.remove('hidden');

    const q = document.getElementById('db-browse-search')?.value || '';
    let url = `/api/iams/database/collections/${name}/documents?page=${page}&limit=20`;
    if (q) url += `&q=${encodeURIComponent(q)}`;

    const res = await adminFetch(url);
    if (!res.success) {
      if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-rose-400">${res.error || 'Failed to load documents.'}</td></tr>`;
      return;
    }

    currentDocs = res.documents || [];
    if (pageInfo) pageInfo.textContent = `Page ${res.page} of ${res.total_pages || 1} (${res.total} total)`;

    if (!currentDocs.length) {
      if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-slate-400">No documents found.</td></tr>`;
      return;
    }

    // Dynamic headers based on keys
    const sampleKeys = Object.keys(currentDocs[0]).filter(k => k !== '__v').slice(0, 4);

    if (tbody) {
      tbody.innerHTML = currentDocs.map(d => {
        const id = d._id || d.id || d.lead_id || d.task_id;
        return `
          <tr class="hover:bg-slate-800/40 border-b border-slate-800/60 transition">
            <td class="py-2.5 px-3 text-xs font-mono text-cyan-400">${String(id).substr(0, 16)}...</td>
            ${sampleKeys.slice(1).map(k => `
              <td class="py-2.5 px-3 text-xs text-slate-300 font-mono truncate max-w-xs">
                ${typeof d[k] === 'object' ? JSON.stringify(d[k]).substr(0, 40) + '...' : String(d[k] || '-')}
              </td>
            `).join('')}
            <td class="py-2.5 px-3 text-xs text-right space-x-1.5 whitespace-nowrap">
              <button type="button" onclick="window.DatabaseCenter.viewDoc('${name}', '${id}')" class="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white text-[11px] font-semibold">View JSON</button>
              <button type="button" onclick="window.DatabaseCenter.editDoc('${name}', '${id}')" class="px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-[11px] font-semibold">Edit</button>
            </td>
          </tr>
        `;
      }).join('');
    }

    if (window.lucide) window.lucide.createIcons();
  }

  async function viewDoc(collectionName, docId) {
    const res = await adminFetch(`/api/iams/database/collections/${collectionName}/documents/${docId}`);
    if (!res.success) {
      showAdminToast('Could not load document: ' + res.error, 'error');
      return;
    }

    const modal = document.getElementById('db-doc-modal');
    const textarea = document.getElementById('db-doc-json');
    const saveBtn = document.getElementById('db-doc-save-btn');
    const titleEl = document.getElementById('db-doc-title');

    if (titleEl) titleEl.textContent = `Document Viewer: ${collectionName}`;
    if (textarea) {
      textarea.value = JSON.stringify(res.document, null, 2);
      textarea.readOnly = true;
    }
    if (saveBtn) saveBtn.classList.add('hidden');
    if (modal) modal.classList.remove('hidden');
  }

  async function editDoc(collectionName, docId) {
    const res = await adminFetch(`/api/iams/database/collections/${collectionName}/documents/${docId}`);
    if (!res.success) {
      showAdminToast('Could not load document: ' + res.error, 'error');
      return;
    }

    const modal = document.getElementById('db-doc-modal');
    const textarea = document.getElementById('db-doc-json');
    const saveBtn = document.getElementById('db-doc-save-btn');
    const titleEl = document.getElementById('db-doc-title');

    if (titleEl) titleEl.textContent = `Document Editor: ${collectionName}`;
    if (textarea) {
      textarea.value = JSON.stringify(res.document, null, 2);
      textarea.readOnly = false;
    }
    if (saveBtn) {
      saveBtn.classList.remove('hidden');
      saveBtn.onclick = async () => {
        try {
          const parsed = JSON.parse(textarea.value);
          const updateRes = await adminFetch(`/api/iams/database/collections/${collectionName}/documents/${docId}`, {
            method: 'PATCH',
            body: JSON.stringify(parsed)
          });
          if (updateRes.success) {
            showAdminToast('Document updated successfully.');
            modal.classList.add('hidden');
            browseCollection(collectionName, currentPage);
          } else {
            showAdminToast('Update failed: ' + updateRes.error, 'error');
          }
        } catch (err) {
          showAdminToast('Invalid JSON: ' + err.message, 'error');
        }
      };
    }
    if (modal) modal.classList.remove('hidden');
  }

  function closeBrowseModal() {
    const modal = document.getElementById('db-browse-modal');
    if (modal) modal.classList.add('hidden');
  }

  function closeDocModal() {
    const modal = document.getElementById('db-doc-modal');
    if (modal) modal.classList.add('hidden');
  }

  function exportCollection(name, format = 'csv') {
    const token = sessionStorage.getItem('iceberg_admin_token') || 'demo_token';
    const url = `/api/iams/database/export/${name}?format=${format}`;

    fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-demo-admin': 'true'
      }
    })
      .then(res => res.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${name}_export_${Date.now()}.${format}`;
        a.click();
        showAdminToast(`Exported collection ${name}`);
      })
      .catch(err => {
        showAdminToast('Export failed: ' + err.message, 'error');
      });
  }

  async function exportAll() {
    const token = sessionStorage.getItem('iceberg_admin_token') || 'demo_token';
    showAdminToast('Compiling full database backup...');

    fetch('/api/iams/database/export/all', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-demo-admin': 'true'
      }
    })
      .then(res => res.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `iceberg_full_db_backup_${Date.now()}.json`;
        a.click();
        showAdminToast('Full database export downloaded successfully.');
      })
      .catch(err => {
        showAdminToast('Export all failed: ' + err.message, 'error');
      });
  }

  async function loadHealth() {
    const container = document.getElementById('db-health-container');
    if (!container) return;

    const res = await adminFetch('/api/iams/database/health');
    if (!res.success) return;

    const h = res.health;
    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div class="text-[10px] uppercase font-bold text-slate-400">DB Status</div>
          <div class="text-xl font-bold text-emerald-400 mt-1">${h.connection_state}</div>
        </div>
        <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div class="text-[10px] uppercase font-bold text-slate-400">Total Collections</div>
          <div class="text-xl font-bold text-cyan-400 mt-1">${h.total_collections}</div>
        </div>
        <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div class="text-[10px] uppercase font-bold text-slate-400">Total Documents</div>
          <div class="text-xl font-bold text-white mt-1">${h.total_documents.toLocaleString()}</div>
        </div>
        <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div class="text-[10px] uppercase font-bold text-slate-400">Writes in Last Hour</div>
          <div class="text-xl font-bold text-amber-400 mt-1">${h.writes_last_hour}</div>
        </div>
      </div>
      <h5 class="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Collection Volume Breakdown</h5>
      <div class="space-y-2 max-h-60 overflow-y-auto">
        ${h.collection_breakdown.map(c => `
          <div class="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/40 border border-slate-800 text-xs font-mono">
            <span class="text-slate-200">${c.collection} (${c.model})</span>
            <span class="text-cyan-400 font-bold">${c.count.toLocaleString()} docs</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  async function listBackups() {
    const container = document.getElementById('db-backups-container');
    if (!container) return;

    const res = await adminFetch('/api/iams/database/backups');
    if (!res.success) return;

    const diskBackups = res.disk_backups || [];
    const snapshots = res.snapshots || [];

    container.innerHTML = `
      <div class="space-y-4">
        <div>
          <h5 class="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">On-Disk Append-Only Backup Streams</h5>
          <div class="space-y-2">
            ${diskBackups.map(b => `
              <div class="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                <div>
                  <div class="font-bold text-white font-mono">${b.filename}</div>
                  <div class="text-slate-400 text-[10px]">Modified: ${new Date(b.last_modified).toLocaleString()} • ${(b.size_bytes / 1024).toFixed(1)} KB</div>
                </div>
                <a href="/api/iams/database/backups/${b.filename}/download" target="_blank" class="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs font-bold transition flex items-center gap-1.5">
                  <i data-lucide="download" class="w-3.5 h-3.5"></i> Download
                </a>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  }

  function switchTab(tab) {
    document.querySelectorAll('.db-tab-btn').forEach(btn => {
      btn.classList.remove('bg-cyan-500/20', 'text-cyan-400', 'border-cyan-500/30');
      btn.classList.add('text-slate-400', 'border-transparent');
    });
    const activeBtn = document.getElementById(`db-tab-${tab}`);
    if (activeBtn) {
      activeBtn.classList.add('bg-cyan-500/20', 'text-cyan-400', 'border-cyan-500/30');
      activeBtn.classList.remove('text-slate-400', 'border-transparent');
    }

    const collView = document.getElementById('db-view-collections');
    const healthView = document.getElementById('db-view-health');
    const backupsView = document.getElementById('db-view-backups');

    if (tab === 'collections') {
      if (collView) collView.classList.remove('hidden');
      if (healthView) healthView.classList.add('hidden');
      if (backupsView) backupsView.classList.add('hidden');
      loadCollections();
    } else if (tab === 'health') {
      if (collView) collView.classList.add('hidden');
      if (healthView) healthView.classList.remove('hidden');
      if (backupsView) backupsView.classList.add('hidden');
      loadHealth();
    } else if (tab === 'backups') {
      if (collView) collView.classList.add('hidden');
      if (healthView) healthView.classList.add('hidden');
      if (backupsView) backupsView.classList.remove('hidden');
      listBackups();
    }
  }

  return {
    loadCollections,
    browseCollection,
    viewDoc,
    editDoc,
    exportCollection,
    exportAll,
    loadHealth,
    listBackups,
    closeBrowseModal,
    closeDocModal,
    switchTab
  };
})();
