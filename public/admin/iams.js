/**
 * ICEBERG AGENCY — INTERNAL ACCOUNTS MANAGEMENT SYSTEM (IAMS)
 * Client-side Controller & UI State Engine
 */

window.IAMS = (function() {
  let clientsData = [];
  let currentClientDetail = null;
  let activeKanbanBoard = null;
  let invoicesData = [];
  let summaryMetrics = null;

  // Helper for API calls with token
  async function apiFetch(endpoint, options = {}) {
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
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('[IAMS API Error]:', err);
      return { success: false, error: err.message };
    }
  }

  // Toast Notification Helper
  function showToast(msg, type = 'success') {
    const toast = document.createElement('div');
    const bg = type === 'success' ? 'bg-emerald-500/90 border-emerald-400' : 'bg-rose-500/90 border-rose-400';
    toast.className = `fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white font-medium border shadow-2xl backdrop-blur-md transition-all duration-300 flex items-center gap-2 ${bg}`;
    toast.innerHTML = `<i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}" class="w-5 h-5"></i> <span>${msg}</span>`;
    document.body.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();
    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // 1. Initialize and load Executive Summary & Clients
  async function loadOverview() {
    const summaryRes = await apiFetch('/api/iams/analytics/summary');
    if (summaryRes.success) {
      summaryMetrics = summaryRes.metrics;
      renderMetrics(summaryMetrics);
    }

    const clientsRes = await apiFetch('/api/iams/clients');
    if (clientsRes.success) {
      clientsData = clientsRes.clients || [];
      renderClientsTable(clientsData);
    }
  }

  function renderMetrics(m) {
    if (!m) return;
    const mrrEl = document.getElementById('iams-mrr-metric');
    if (mrrEl) {
      mrrEl.textContent = `${m.mrr.formatted_usd} and ${m.mrr.formatted_egp}`;
    }
    const retainersEl = document.getElementById('iams-active-retainers-metric');
    if (retainersEl) {
      retainersEl.textContent = `${m.clients.active_retainers} Clients`;
    }
    const churnEl = document.getElementById('iams-churn-metric');
    if (churnEl) {
      churnEl.textContent = `${m.clients.churn_rate_percent}%`;
    }
    const marginEl = document.getElementById('iams-margin-metric');
    if (marginEl) {
      marginEl.textContent = `${m.operations.gross_margin_percent}% Margin`;
    }
  }

  function renderClientsTable(list) {
    const tbody = document.getElementById('iams-clients-tbody');
    if (!tbody) return;

    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-10 text-gray-400">No client accounts found. Click "Add Client Account" or convert an inbound lead.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(c => {
      const isUSD = c.financials?.currency === 'USD';
      const retainerFormatted = isUSD
        ? `$${Number(c.financials?.monthly_retainer || 0).toLocaleString()} USD`
        : `${Number(c.financials?.monthly_retainer || 0).toLocaleString()} EGP`;

      let statusBadgeClass = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      if (c.status === 'ACTIVE_RETAINER') statusBadgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      else if (c.status === 'ONBOARDING') statusBadgeClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      else if (c.status === 'PAUSED') statusBadgeClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20';

      const amName = c.account_manager_id?.full_name || 'Sarah Jenkins';

      return `
        <tr class="table-row border-b border-slate-800/80 transition-colors">
          <td class="py-3.5 px-4 font-semibold text-white">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                ${c.company_name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <a href="javascript:void(0)" onclick="IAMS.openClientDetail('${c.client_id}')" class="hover:text-cyan-400 transition-colors">
                  ${c.company_name}
                </a>
                <div class="text-[11px] text-gray-400 font-normal">${c.contact_person?.name || ''}</div>
              </div>
            </div>
          </td>
          <td class="py-3.5 px-4">
            <span class="px-2.5 py-1 text-xs rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-medium">
              ${c.industry || 'General'}
            </span>
          </td>
          <td class="py-3.5 px-4 text-xs text-gray-300">
            <div class="flex items-center gap-2">
              <i data-lucide="user-check" class="w-3.5 h-3.5 text-cyan-400"></i>
              ${amName}
            </div>
          </td>
          <td class="py-3.5 px-4 font-semibold text-white text-xs">
            ${retainerFormatted}
          </td>
          <td class="py-3.5 px-4">
            <span class="px-2.5 py-1 text-[11px] font-semibold rounded-full border ${statusBadgeClass}">
              ${c.status.replace('_', ' ')}
            </span>
          </td>
          <td class="py-3.5 px-4 text-right">
            <div class="flex items-center justify-end gap-2">
              <button onclick="IAMS.openClientDetail('${c.client_id}')" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition-colors" title="View Dossier">
                <i data-lucide="external-link" class="w-4 h-4"></i>
              </button>
              <button onclick="IAMS.openClientAccessModal('${c.client_id}', '${(c.company_name || '').replace(/'/g, "\\'")}')" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-400 transition-colors" title="Manage Client User & Portal">
                <i data-lucide="shield-check" class="w-4 h-4"></i>
              </button>
              <button onclick="IAMS.generatePortalLink('${c.client_id}')" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 transition-colors" title="Generate Magic Link">
                <i data-lucide="key" class="w-4 h-4"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  // 2. Client Detail Dossier
  async function openClientDetail(clientId) {
    const res = await apiFetch(`/api/iams/clients/${clientId}`);
    if (!res.success) {
      showToast(res.error || 'Failed to open client dossier', 'error');
      return;
    }

    currentClientDetail = res;
    const c = res.client;

    const detailContainer = document.getElementById('iams-client-detail');
    if (!detailContainer) return;

    // Header values
    document.getElementById('cd-company-name').textContent = c.company_name;
    document.getElementById('cd-status-badge').textContent = c.status.replace('_', ' ');
    document.getElementById('cd-retainer').textContent = c.financials.currency === 'USD'
      ? `$${Number(c.financials.monthly_retainer).toLocaleString()} USD / mo`
      : `${Number(c.financials.monthly_retainer).toLocaleString()} EGP / mo`;
    document.getElementById('cd-am').textContent = c.account_manager_id?.full_name || 'Sarah Jenkins';
    document.getElementById('cd-contact-email').textContent = c.contact_person?.email || 'N/A';
    document.getElementById('cd-contact-phone').textContent = c.contact_person?.whatsapp_number || c.contact_person?.phone || 'N/A';

    // Tax Information
    document.getElementById('cd-tax-id').textContent = c.corporate_tax_info?.tax_id_number || 'Not Registered';
    document.getElementById('cd-cr').textContent = c.corporate_tax_info?.commercial_register || 'Not Registered';

    // Retainer Quotas
    const q = c.retainer_quotas || {};
    const quotaHtml = `
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
          <div class="text-[11px] text-gray-400">Reels Quota</div>
          <div class="text-sm font-bold text-white mt-0.5">${q.monthly_reels?.consumed || 0} / ${q.monthly_reels?.allocated || 0}</div>
        </div>
        <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
          <div class="text-[11px] text-gray-400">Posts Quota</div>
          <div class="text-sm font-bold text-white mt-0.5">${q.monthly_posts?.consumed || 0} / ${q.monthly_posts?.allocated || 0}</div>
        </div>
        <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
          <div class="text-[11px] text-gray-400">Dev Hours</div>
          <div class="text-sm font-bold text-white mt-0.5">${q.monthly_dev_hours?.consumed || 0} / ${q.monthly_dev_hours?.allocated || 0} h</div>
        </div>
        <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
          <div class="text-[11px] text-gray-400">SEO Articles</div>
          <div class="text-sm font-bold text-white mt-0.5">${q.monthly_seo_articles?.consumed || 0} / ${q.monthly_seo_articles?.allocated || 0}</div>
        </div>
      </div>
    `;
    document.getElementById('cd-quotas-container').innerHTML = quotaHtml;

    // Render linked deliverables / tasks
    const tasksListEl = document.getElementById('cd-tasks-list');
    if (tasksListEl) {
      if (!res.tasks.length) {
        tasksListEl.innerHTML = `<div class="text-xs text-gray-400 py-3">No active sprint tasks for this client.</div>`;
      } else {
        tasksListEl.innerHTML = res.tasks.map(t => `
          <div class="p-3 rounded-xl bg-slate-900/70 border border-slate-800/90 flex items-center justify-between">
            <div>
              <div class="text-xs font-semibold text-white">${t.title}</div>
              <div class="text-[10px] text-gray-400 mt-0.5">Priority: <span class="text-cyan-400 font-bold">${t.priority}</span> | Logged: ${t.time_tracking?.actual_hours || 0}h</div>
            </div>
            <span class="px-2 py-0.5 text-[10px] rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-semibold">${t.status}</span>
          </div>
        `).join('');
      }
    }

    // Render Invoices History
    const invoicesListEl = document.getElementById('cd-invoices-list');
    if (invoicesListEl) {
      if (!res.invoices.length) {
        invoicesListEl.innerHTML = `<div class="text-xs text-gray-400 py-3">No billing history recorded yet.</div>`;
      } else {
        invoicesListEl.innerHTML = res.invoices.map(inv => `
          <div class="p-3 rounded-xl bg-slate-900/70 border border-slate-800/90 flex items-center justify-between">
            <div>
              <div class="text-xs font-semibold text-white">${inv.invoice_number}</div>
              <div class="text-[10px] text-gray-400">${new Date(inv.dates.issue_date).toLocaleDateString()}</div>
            </div>
            <div class="text-right">
              <div class="text-xs font-bold text-white">${inv.currency} ${Number(inv.financial_breakdown?.net_payable_amount || inv.total_amount).toLocaleString()}</div>
              <span class="px-2 py-0.5 text-[10px] rounded-full font-bold ${inv.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}">${inv.status}</span>
            </div>
          </div>
        `).join('');
      }
    }

    if (window.showSection) window.showSection('iams-client-detail');
    if (window.lucide) window.lucide.createIcons();
  }

  // 3. Sprint Kanban Board
  async function loadKanban() {
    const res = await apiFetch('/api/iams/tasks/board');
    if (res.success) {
      activeKanbanBoard = res.board;
      renderKanbanColumns(res.board);
    }
  }

  function renderKanbanColumns(board) {
    const columns = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
    columns.forEach(col => {
      const container = document.getElementById(`kanban-col-${col.toLowerCase().replace('_', '-')}`);
      if (!container) return;

      const tasks = board[col] || [];
      document.getElementById(`kanban-count-${col.toLowerCase().replace('_', '-')}`).textContent = tasks.length;

      if (!tasks.length) {
        container.innerHTML = `<div class="p-4 text-center text-xs text-gray-500 border border-dashed border-slate-800 rounded-xl">No tasks in ${col.replace('_', ' ')}</div>`;
        return;
      }

      container.innerHTML = tasks.map(t => {
        let priorityColor = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
        if (t.priority === 'CRITICAL') priorityColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
        else if (t.priority === 'HIGH') priorityColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';

        const clientName = t.client_id?.company_name || 'Client';
        const specialist = t.assigned_to_id?.full_name || 'Unassigned';

        return `
          <div class="glass-card p-3.5 rounded-xl border border-slate-800/90 shadow-md hover:border-cyan-500/40 transition-all space-y-2.5">
            <div class="flex items-center justify-between">
              <span class="px-2 py-0.5 text-[10px] font-bold rounded-full border ${priorityColor}">
                ${t.priority}
              </span>
              <span class="text-[10px] text-gray-400 truncate max-w-[120px] font-medium">${clientName}</span>
            </div>
            <h4 class="text-xs font-semibold text-white leading-snug">${t.title}</h4>
            <div class="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px] text-gray-400">
              <div class="flex items-center gap-1.5">
                <i data-lucide="clock" class="w-3 h-3 text-cyan-400"></i>
                <span>${t.time_tracking?.actual_hours || 0}h / ${t.time_tracking?.estimated_hours || 0}h</span>
              </div>
              <div class="flex items-center gap-1">
                <select onchange="IAMS.updateTaskStatus('${t.task_id}', this.value)" class="text-[10px] bg-slate-900 border border-slate-700 text-cyan-400 rounded px-1.5 py-0.5">
                  <option value="BACKLOG" ${t.status === 'BACKLOG' ? 'selected' : ''}>Backlog</option>
                  <option value="TODO" ${t.status === 'TODO' ? 'selected' : ''}>To Do</option>
                  <option value="IN_PROGRESS" ${t.status === 'IN_PROGRESS' ? 'selected' : ''}>In Progress</option>
                  <option value="IN_REVIEW" ${t.status === 'IN_REVIEW' ? 'selected' : ''}>In Review</option>
                  <option value="DONE" ${t.status === 'DONE' ? 'selected' : ''}>Done</option>
                </select>
              </div>
            </div>
          </div>
        `;
      }).join('');
    });

    if (window.lucide) window.lucide.createIcons();
  }

  async function updateTaskStatus(taskId, newStatus) {
    const res = await apiFetch(`/api/iams/tasks/${taskId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    });

    if (res.success) {
      showToast(`Task moved to ${newStatus.replace('_', ' ')}`);
      loadKanban();
    } else {
      showToast(res.error || 'Failed to update task status', 'error');
    }
  }

  // 4. Financial Invoices Ledger
  async function loadInvoices() {
    const res = await apiFetch('/api/iams/invoices');
    if (res.success) {
      invoicesData = res.invoices || [];
      renderInvoicesTable(invoicesData, res.summary);
    }
  }

  function renderInvoicesTable(list, summary) {
    if (summary) {
      document.getElementById('inv-total-invoiced').textContent = `$${summary.invoiced.USD.toLocaleString()} USD / ${summary.invoiced.EGP.toLocaleString()} EGP`;
      document.getElementById('inv-collected-mtd').textContent = `$${summary.collected.USD.toLocaleString()} USD`;
      document.getElementById('inv-overdue-balance').textContent = `$${summary.overdue.USD.toLocaleString()} USD`;
    }

    const tbody = document.getElementById('iams-invoices-tbody');
    if (!tbody) return;

    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center py-10 text-gray-400">No invoices recorded. Click "Create New Invoice" to generate one.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(inv => {
      const netAmount = inv.financial_breakdown?.net_payable_amount || inv.total_amount || 0;
      let statusBadge = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      if (inv.status === 'PAID') statusBadge = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      else if (inv.status === 'OVERDUE') statusBadge = 'bg-rose-500/10 text-rose-400 border-rose-500/20';

      return `
        <tr class="table-row border-b border-slate-800/80 transition-colors text-xs">
          <td class="py-3.5 px-4 font-mono font-bold text-white">${inv.invoice_number}</td>
          <td class="py-3.5 px-4 font-semibold text-white">${inv.client_id?.company_name || 'Direct Client'}</td>
          <td class="py-3.5 px-4 text-gray-400">${new Date(inv.dates.issue_date).toLocaleDateString()}</td>
          <td class="py-3.5 px-4 text-gray-400">${new Date(inv.dates.due_date).toLocaleDateString()}</td>
          <td class="py-3.5 px-4 font-bold text-white">${inv.currency} ${Number(netAmount).toLocaleString()}</td>
          <td class="py-3.5 px-4">
            <span class="px-2 py-0.5 rounded text-[10px] bg-slate-800 border border-slate-700 text-slate-300 font-semibold">${inv.payment_details?.method || 'INSTAPAY'}</span>
          </td>
          <td class="py-3.5 px-4">
            <span class="px-2.5 py-1 text-[11px] font-bold rounded-full border ${statusBadge}">${inv.status}</span>
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  // 5. Generate Client Portal Magic Link
  async function generatePortalLink(clientId) {
    const res = await apiFetch(`/api/iams/auth/generate-client-magic-link/${clientId}`, {
      method: 'POST'
    });

    if (res.success) {
      navigator.clipboard.writeText(res.portal_url);
      showToast('Client Magic Link copied to clipboard! (Valid for 7 days)');
    } else {
      showToast(res.error || 'Failed to generate magic link', 'error');
    }
  }

  // 6. Lead Conversion Action Trigger
  async function convertLeadModal(leadId) {
    const monthlyRetainer = prompt('Enter agreed monthly retainer amount: (e.g. 3500 for USD or 85000 for EGP)', '3500');
    if (monthlyRetainer === null) return;

    const res = await apiFetch(`/api/iams/clients/convert-lead/${leadId}`, {
      method: 'POST',
      body: JSON.stringify({ monthly_retainer: Number(monthlyRetainer) || 0 })
    });

    if (res.success) {
      showToast(`Lead converted to active account: ${res.client.company_name}`);
      loadOverview();
    } else {
      showToast(res.error || 'Failed to convert lead', 'error');
    }
  }

  // 7. Manage Client User & Portal Modal
  async function openClientAccessModal(clientId, companyName) {
    let modal = document.getElementById('admin-client-access-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'admin-client-access-modal';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="p-6 rounded-2xl bg-slate-900 border border-slate-700 max-w-xl w-full text-slate-200 shadow-2xl space-y-5 relative">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <div class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 inline-block">CLIENT AUTH & PORTAL ACCESS</div>
            <h3 class="text-base font-bold text-white mt-1">${companyName || 'Client'}</h3>
          </div>
          <button onclick="document.getElementById('admin-client-access-modal').classList.add('hidden')" class="text-slate-400 hover:text-white">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <div id="cam-body-content" class="text-xs space-y-4">
          <div class="text-center py-6 text-slate-400">Loading client user assignments...</div>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();

    // Fetch existing users and client projects
    const [usersRes, projectsRes] = await Promise.all([
      apiFetch('/api/iams/client-portal/admin/users'),
      apiFetch(`/api/iams/projects?client_id=${clientId}`)
    ]);

    const users = usersRes.success ? (usersRes.users || []).filter(u => u.assigned_client_id === clientId) : [];
    const projects = projectsRes.success ? (projectsRes.projects || []) : [];

    const defaultSlug = (companyName || 'client').toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 15);
    const suggestedUsername = `client_${defaultSlug}`;

    const bodyContent = document.getElementById('cam-body-content');
    if (!bodyContent) return;

    bodyContent.innerHTML = `
      ${users.length > 0 ? `
        <div class="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div class="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
            <i data-lucide="check-circle" class="w-3.5 h-3.5"></i> Active Client Account Configured
          </div>
          ${users.map(u => `
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-slate-300">
              <div>
                <span class="font-bold text-white">@${u.username}</span>
                <span class="text-slate-500 text-[11px]">(${u.email})</span>
                <div class="text-[10px] text-slate-400 mt-0.5">Project ID: <span class="font-mono text-cyan-300">${u.assigned_project_id || 'Global'}</span></div>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <a href="/portal" target="_blank" class="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-semibold transition flex items-center gap-1">
                  <i data-lucide="external-link" class="w-3 h-3"></i> Open Portal
                </a>
              </div>
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
          No dedicated username account configured for this client yet. Create one below to grant scoped portal access.
        </div>
      `}

      <!-- Form to Set or Update User -->
      <form onsubmit="IAMS.submitCreateClientUser(event, '${clientId}')" class="space-y-3 pt-2">
        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-300">
          ${users.length > 0 ? 'Update Credentials or Create Additional User' : 'Create Client Username & Credentials'}
        </h4>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] font-semibold text-slate-400 mb-1">Username (Login ID)</label>
            <input type="text" id="cam-username" required value="${suggestedUsername}"
              class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400 transition">
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-400 mb-1">Password</label>
            <input type="text" id="cam-password" required value="iceberg2026"
              class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400 transition font-mono">
          </div>
        </div>

        <div>
          <label class="block text-[11px] font-semibold text-slate-400 mb-1">Assigned Operational Project</label>
          <select id="cam-project-id" required class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white">
            ${projects.length > 0 ? projects.map(p => `
              <option value="${p.project_id}">${p.title} (${p.service_category || 'Active'})</option>
            `).join('') : `
              <option value="prj_${defaultSlug}_main">Main Retainer Project (${defaultSlug})</option>
            `}
          </select>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3">
          <button type="button" onclick="document.getElementById('admin-client-access-modal').classList.add('hidden')" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition">
            Close
          </button>
          <button type="submit" id="cam-submit-btn" class="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition flex items-center gap-1.5 shadow-lg shadow-purple-600/30">
            <i data-lucide="key" class="w-3.5 h-3.5"></i> Save Client Credentials
          </button>
        </div>
      </form>
    `;

    if (window.lucide) window.lucide.createIcons();
  }

  async function submitCreateClientUser(e, clientId) {
    e.preventDefault();
    const username = document.getElementById('cam-username')?.value?.trim();
    const password = document.getElementById('cam-password')?.value?.trim();
    const projectId = document.getElementById('cam-project-id')?.value;
    const btn = document.getElementById('cam-submit-btn');

    if (!username || !password || !projectId) {
      showToast('Please fill all credential fields.', 'error');
      return;
    }

    if (btn) { btn.disabled = true; btn.classList.add('opacity-75'); }

    const res = await apiFetch('/api/iams/client-portal/admin/create-client-user', {
      method: 'POST',
      body: JSON.stringify({
        username,
        password,
        project_id: projectId,
        client_id: clientId
      })
    });

    if (btn) { btn.disabled = false; btn.classList.remove('opacity-75'); }

    if (res.success) {
      showToast(res.message);
      openClientAccessModal(clientId, username);
    } else {
      showToast(res.error || 'Failed to save client credentials', 'error');
    }
  }

  return {
    loadOverview,
    openClientDetail,
    loadKanban,
    updateTaskStatus,
    loadInvoices,
    generatePortalLink,
    convertLeadModal,
    openClientAccessModal,
    submitCreateClientUser
  };
})();
