/**
 * ICEBERG Client Suite — Frontend SPA Controller
 * Handles client authentication, onboarding brief, checklists, deliverable sign-offs, and add-on applications.
 */

const PortalApp = (() => {
  let authToken = localStorage.getItem('iceberg_client_token') || null;
  let currentProject = null;
  let currentClient = null;
  let currentUser = null;
  let activeTab = 'overview';
  let currentAddonCurrency = 'USD';
  let activeReviewTaskId = null;
  let activeAddonSlug = null;
  let cachedAddons = [];
  let chatPollTimer = null;

  // ── DEMO PREVIEW STATE ───────────────────────────────────────────────────
  const DEMO_STATE = {
    brief: {
      status: 'IN_REVIEW',
      brand_overview: {
        brand_story: 'Brand Alpha is a premier direct-to-consumer luxury brand redefining modern lifestyle apparel with sustainable, organic textiles and bespoke design.',
        value_proposition: 'Artisanal tailoring, sustainable luxury, and guaranteed perfect fit.',
        industry_niche: 'Luxury Direct-to-Consumer Fashion'
      },
      target_audience: {
        primary_persona: 'High-earning urban professionals aged 25-45 valuing refined minimalist aesthetics.',
        pain_points: ['Fast fashion degradation', 'Lack of supply-chain sustainability transparency', 'Inconsistent sizing']
      },
      scope_and_objectives: {
        primary_goal: 'ECOMMERCE_SALES',
        target_kpis: '4.5x ROAS on Meta ads, 15,000 monthly orders, <1s mobile load speed'
      },
      creative_guidelines: {
        visual_style: 'MINIMAL_LUXURY',
        brand_colors: '#070b14, #06b6d4, #10b981',
        benchmark_urls: 'https://apple.com, https://stripe.com, https://linear.app'
      },
      brand_assets: {
        shared_drive_url: 'https://drive.google.com/drive/folders/iceberg-brand-alpha-demo',
        guidelines_doc_url: 'https://figma.com/@iceberg/brand-alpha-tokens',
        technical_access_notes: 'Meta Pixel ID: 981248912 | Shopify Plus Storefront Active'
      }
    },
    deliverables: [
      {
        task_id: 'tsk_hero_motion_demo',
        title: 'Hero Video Reels & High-ROAS Ad Creative Suite (Batch 1)',
        description: '5 scripted short-form videos with motion graphics, sound design, and hook variations.',
        status: 'IN_REVIEW',
        revision_rounds_count: 1,
        max_free_revisions: 2,
        current_version: {
          version_number: 2,
          client_status: 'PENDING_REVIEW',
          asset_url: 'https://icebergma.com',
          client_feedback: null
        }
      },
      {
        task_id: 'tsk_landing_page_demo',
        title: 'High-Converting Mobile Landing Page & Fast Checkout Funnel',
        description: 'Sub-second mobile-first storefront landing page with integrated Meta CAPI tracking and A/B test split.',
        status: 'IN_REVIEW',
        revision_rounds_count: 0,
        max_free_revisions: 2,
        current_version: {
          version_number: 1,
          client_status: 'PENDING_REVIEW',
          asset_url: 'https://icebergma.com',
          client_feedback: null
        }
      },
      {
        task_id: 'tsk_brand_system_demo',
        title: 'Design System & Typography Token Architecture',
        description: 'Complete Figma master design system with components, responsive grids, and dark theme tokens.',
        status: 'DONE',
        revision_rounds_count: 0,
        max_free_revisions: 2,
        current_version: {
          version_number: 1,
          client_status: 'APPROVED',
          asset_url: '#',
          client_feedback: 'Approved by Creative Director'
        }
      }
    ],
    onboardingMilestones: [
      { title: 'Project Kickoff & Strategic Goal Setting', category: 'ONBOARDING', status: 'DONE' },
      { title: 'Meta CAPI Server-Side & Google Analytics Setup', category: 'TRACKING', status: 'DONE' },
      { title: 'Brand Vision & Creative Tone Sign-off', category: 'CREATIVE', status: 'DONE' },
      { title: 'Customer Persona & Competitor Benchmarking', category: 'STRATEGY', status: 'IN_PROGRESS' },
      { title: 'Staging Environment & DNS Verification', category: 'TECHNICAL', status: 'TODO' }
    ],
    messages: [
      { sender_role: 'Account Director', sender_name: 'Karim Hegazi', text: 'Welcome to your Iceberg Client Suite! We have uploaded Version 2 of your Hero Video Ads for review.', created_at: new Date(Date.now() - 3600000).toISOString() },
      { sender_role: 'Lead Specialist', sender_name: 'Amr Mansour', text: 'Your Meta CAPI tracking and server-side events are active and hitting 9.8/10 Event Match Quality.', created_at: new Date(Date.now() - 1800000).toISOString() }
    ],
    appliedAddons: []
  };

  // ── API HELPER ─────────────────────────────────────────────────────────────
  async function apiFetch(endpoint, options = {}) {
    const isDemo = localStorage.getItem('iceberg_demo_active') === 'true';

    // Handle demo mock endpoints seamlessly
    if (isDemo) {
      if (endpoint === '/api/iams/client-portal/me') {
        return {
          success: true,
          user: currentUser || { full_name: 'Demo Client', username: 'demo_guest' },
          client: currentClient || { company_name: 'Brand Alpha Group' },
          project: currentProject || { title: 'Brand Alpha — Global Scale & Creative Sprint', category: 'PERFORMANCE_MARKETING' }
        };
      }
      if (endpoint === '/api/iams/client-portal/dashboard' || endpoint === '/api/iams/client-portal/overview') {
        const pendingCount = DEMO_STATE.deliverables.filter(d => d.current_version?.client_status === 'PENDING_REVIEW').length;
        const approvedCount = DEMO_STATE.deliverables.filter(d => d.current_version?.client_status === 'APPROVED').length;
        return {
          success: true,
          project: currentProject,
          metrics: {
            completed_deliverables: approvedCount,
            pending_client_approvals: pendingCount,
            brief_completion: 92
          },
          recent_assets: DEMO_STATE.deliverables.map(d => ({
            task_title: d.title,
            version: d.current_version?.version_number || 1,
            preview_type: 'Deliverable',
            client_status: d.current_version?.client_status || 'IN_REVIEW',
            asset_url: d.current_version?.asset_url || '#'
          })),
          contacts: {
            account_manager: {
              full_name: 'Karim Hegazi',
              phone: '+201000000000',
              email: 'accounts@icebergma.com'
            },
            lead_specialist: {
              full_name: 'Amr Mansour',
              department: 'Performance & Web Architecture'
            }
          }
        };
      }
      if (endpoint === '/api/iams/client-portal/brief') {
        if (options.method === 'POST') {
          return { success: true, message: 'Brief saved successfully in demo mode.' };
        }
        return { success: true, brief: DEMO_STATE.brief };
      }
      if (endpoint === '/api/iams/client-portal/checklists') {
        return {
          success: true,
          onboarding_tasks: DEMO_STATE.onboardingMilestones,
          deliverables: DEMO_STATE.deliverables
        };
      }
      if (endpoint === '/api/iams/client-portal/addons') {
        return {
          success: true,
          catalog: cachedAddons.length > 0 ? cachedAddons : [
            {
              slug: 'landing-page-sprint',
              category: 'Web & CRO',
              title: 'High-Converting Landing Page Sprint',
              description: 'Bespoke, high-velocity landing page designed for Meta & Google ads. Sub-second load times and integrated tracking.',
              deliverables: ['Custom UX/UI Wireframe', 'Responsive Front-End Code', 'Meta CAPI Setup', 'A/B Test Structure'],
              turnaround_days: 7,
              price_usd: 1450,
              price_egp: 72000,
              icon: 'layout-grid',
              featured: true
            },
            {
              slug: 'meta-ads-scaling-pack',
              category: 'Performance Marketing',
              title: 'Meta & TikTok Performance Scaling Pack',
              description: 'Comprehensive paid acquisition campaign setup. Full creative testing matrix and ROAS-focused budget allocation.',
              deliverables: ['10 High-Performing Ad Creatives', 'Video Motion Hooks', 'Conversion API Tracking', 'Weekly Performance Dashboard'],
              turnaround_days: 10,
              price_usd: 1800,
              price_egp: 89000,
              icon: 'trending-up',
              featured: true
            },
            {
              slug: 'viral-reels-batch',
              category: 'Creative Production',
              title: 'Viral Video & Reels Batch (5 Videos)',
              description: 'High-impact short-form videos tailored for Instagram Reels, TikTok, and YouTube Shorts.',
              deliverables: ['5 Scripted Concepts', 'Motion Graphics', 'Sound Design', 'Optimized Captions'],
              turnaround_days: 8,
              price_usd: 950,
              price_egp: 47000,
              icon: 'video',
              featured: false
            }
          ],
          requests: DEMO_STATE.appliedAddons
        };
      }
      if (endpoint === '/api/iams/client-portal/addons/apply') {
        const body = JSON.parse(options.body || '{}');
        DEMO_STATE.appliedAddons.push({
          request_id: 'req_demo_' + Date.now(),
          addon_slug: body.addon_slug,
          urgency: body.urgency,
          currency: body.currency,
          client_notes: body.client_notes,
          status: 'PENDING_REVIEW',
          created_at: new Date().toISOString()
        });
        return { success: true, message: 'Add-on request submitted successfully!' };
      }
      if (endpoint === '/api/iams/client-portal/deliverables/review') {
        const body = JSON.parse(options.body || '{}');
        const target = DEMO_STATE.deliverables.find(d => d.task_id === body.task_id);
        if (target && target.current_version) {
          if (body.action === 'APPROVE') {
            target.current_version.client_status = 'APPROVED';
            target.status = 'DONE';
          } else {
            target.current_version.client_status = 'CHANGES_REQUESTED';
            target.current_version.client_feedback = body.feedback_notes;
            target.revision_rounds_count = (target.revision_rounds_count || 0) + 1;
          }
        }
        return { success: true, message: 'Deliverable review processed.' };
      }
      if (endpoint === '/api/iams/client-portal/messages') {
        if (options.method === 'POST') {
          const body = JSON.parse(options.body || '{}');
          DEMO_STATE.messages.push({
            sender_role: 'Client (You)',
            sender_name: currentUser?.full_name || 'Client',
            text: body.text,
            created_at: new Date().toISOString()
          });
          return { success: true };
        }
        return { success: true, messages: DEMO_STATE.messages };
      }
    }

    const headers = {
      'Content-Type': 'application/json',
      ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
      ...(options.headers || {})
    };

    try {
      const res = await fetch(endpoint, { ...options, headers });
      const data = await res.json();
      if (res.status === 401 || res.status === 403) {
        if (data.error && data.error.includes('expired') || res.status === 401) {
          logout(false);
        }
      }
      return data;
    } catch (err) {
      console.warn(`[Portal API Network Notice] ${endpoint}:`, err.message);
      return { success: false, error: 'Network error or service offline.' };
    }
  }

  // ── TOAST NOTIFICATIONS ───────────────────────────────────────────────────
  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const isError = type === 'error';
    toast.className = `px-4 py-3 rounded-xl text-xs font-semibold shadow-xl flex items-center gap-2 border pointer-events-auto transition-all transform duration-300 translate-y-2 opacity-0 ${
      isError 
        ? 'bg-rose-950/90 text-rose-200 border-rose-500/40 shadow-rose-950/40' 
        : 'bg-slate-900/95 text-cyan-300 border-cyan-500/40 shadow-cyan-950/40'
    }`;
    toast.innerHTML = `
      <i data-lucide="${isError ? 'alert-triangle' : 'check-circle'}" class="w-4 h-4 shrink-0"></i>
      <span>${message}</span>
    `;
    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // ── INITIALIZATION ─────────────────────────────────────────────────────────
  async function init() {
    // Check URL parameters for direct token / magic-link (e.g. /portal?token=...)
    const urlParams = new URLSearchParams(window.location.search);
    const queryToken = urlParams.get('token');

    if (queryToken) {
      authToken = queryToken;
      localStorage.setItem('iceberg_client_token', queryToken);
      // Clean URL query
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (authToken) {
      await verifySession();
    } else {
      showAuthView();
    }

    if (window.lucide) window.lucide.createIcons();
  }

  // ── SESSION MANAGEMENT ─────────────────────────────────────────────────────
  async function verifySession() {
    const res = await apiFetch('/api/iams/client-portal/me');
    if (res.success) {
      currentUser = res.user;
      currentProject = res.project;
      currentClient = res.client;
      showMainView();
      await loadDashboard();
    } else {
      logout(false);
    }
  }

  function showAuthView() {
    document.getElementById('auth-view')?.classList.remove('hidden');
    document.getElementById('portal-main-view')?.classList.add('hidden');
    document.body.classList.remove('has-mobile-dock');
    if (window.lucide) window.lucide.createIcons();
  }

  function showMainView() {
    document.getElementById('auth-view')?.classList.add('hidden');
    document.getElementById('portal-main-view')?.classList.remove('hidden');
    document.body.classList.add('has-mobile-dock');

    const isDemo = localStorage.getItem('iceberg_demo_active') === 'true';
    const demoBadge = document.getElementById('demo-mode-indicator');
    if (demoBadge) {
      if (isDemo) demoBadge.classList.remove('hidden');
      else demoBadge.classList.add('hidden');
    }

    // Populate Top Header
    document.getElementById('hdr-company-name').textContent = currentClient?.company_name || 'Client Project';
    document.getElementById('hdr-user-fullname').textContent = currentUser?.full_name || 'Client';
    document.getElementById('hdr-user-username').textContent = `@${currentUser?.username || 'user'}`;
    document.getElementById('hdr-avatar-init').textContent = (currentUser?.full_name || 'C').charAt(0).toUpperCase();

    if (currentProject) {
      document.getElementById('hdr-project-title').textContent = currentProject.title;
      document.getElementById('hdr-project-category').textContent = (currentProject.category || 'Agency Project').replace('_', ' ');
    }

    if (window.lucide) window.lucide.createIcons();
  }

  function loginDemo() {
    currentUser = {
      user_id: 'usr_demo_client_preview',
      username: 'demo_client',
      full_name: 'Sarah Jenkins (Demo)',
      role: 'ClientGuest',
      email: 'client@demo.icebergma.com'
    };
    currentClient = {
      client_id: 'cli_demo_brand',
      company_name: 'Brand Alpha Group',
      industry: 'Luxury Retail & E-Commerce'
    };
    currentProject = {
      project_id: 'prj_demo_alpha',
      title: 'Brand Alpha — Global Scale & Creative Sprint',
      category: 'PERFORMANCE MARKETING',
      status: 'ACTIVE_SPRINT'
    };
    authToken = 'demo_token_preview';
    localStorage.setItem('iceberg_client_token', authToken);
    localStorage.setItem('iceberg_demo_active', 'true');
    showToast('Entering Interactive Client Suite Demo Preview!');
    showMainView();
    loadDashboard();
  }

  async function handleLogin(e) {
    e.preventDefault();
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    const errorBox = document.getElementById('login-error-msg');
    const errorText = document.getElementById('login-error-text');
    const submitBtn = document.getElementById('login-submit-btn');

    errorBox.classList.add('hidden');
    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-75');

    const res = await apiFetch('/api/iams/client-portal/login', {
      method: 'POST',
      body: JSON.stringify({
        username: usernameInput.value.trim(),
        password: passwordInput.value
      })
    });

    submitBtn.disabled = false;
    submitBtn.classList.remove('opacity-75');

    if (res.success && res.token) {
      authToken = res.token;
      localStorage.setItem('iceberg_client_token', authToken);
      currentUser = res.user;
      showToast('Welcome to your project workspace!');
      await verifySession();
    } else {
      errorText.textContent = res.error || 'Authentication failed. Please verify credentials.';
      errorBox.classList.remove('hidden');
    }
  }

  function logout(showNotice = true) {
    if (chatPollTimer) {
      clearInterval(chatPollTimer);
      chatPollTimer = null;
    }
    authToken = null;
    localStorage.removeItem('iceberg_client_token');
    currentProject = null;
    currentClient = null;
    currentUser = null;
    if (showNotice) showToast('Signed out of project suite.');
    showAuthView();
  }

  function togglePasswordVisibility() {
    const input = document.getElementById('login-password');
    const icon = document.getElementById('pwd-toggle-icon');
    if (!input) return;

    if (input.type === 'password') {
      input.type = 'text';
      icon?.setAttribute('data-lucide', 'eye-off');
    } else {
      input.type = 'password';
      icon?.setAttribute('data-lucide', 'eye');
    }
    if (window.lucide) window.lucide.createIcons();
  }

  // ── TAB NAVIGATION ─────────────────────────────────────────────────────────
  function switchTab(tabName) {
    activeTab = tabName;

    // Clear background chat polling if leaving chat
    if (chatPollTimer) {
      clearInterval(chatPollTimer);
      chatPollTimer = null;
    }

    // Update active tab button styles (top nav)
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.classList.remove('active', 'text-cyan-400');
      btn.classList.add('text-slate-400');
    });
    const activeBtn = document.getElementById(`tab-btn-${tabName}`);
    if (activeBtn) {
      activeBtn.classList.add('active');
      activeBtn.classList.remove('text-slate-400');
      activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }

    // Update mobile app dock buttons
    document.querySelectorAll('.mobile-dock-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    const activeDockBtn = document.getElementById(`dock-btn-${tabName}`);
    if (activeDockBtn) {
      activeDockBtn.classList.add('active');
    }

    // Toggle Tab Views
    const tabViews = ['overview', 'brief', 'checklists', 'addons', 'messages'];
    tabViews.forEach(v => {
      const el = document.getElementById(`tab-view-${v}`);
      if (el) {
        if (v === tabName) {
          el.classList.remove('hidden');
        } else {
          el.classList.add('hidden');
        }
      }
    });

    // Lazy load tab data
    if (tabName === 'overview') loadDashboard();
    if (tabName === 'brief') loadBrief();
    if (tabName === 'checklists') loadChecklists();
    if (tabName === 'addons') loadAddons();
    if (tabName === 'messages') {
      loadMessages();
      // Auto-poll every 3.5 seconds while viewing Team Stream
      chatPollTimer = setInterval(loadMessages, 3500);
    }

    // Scroll to top of content container smoothly on tab switch
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (window.lucide) window.lucide.createIcons();
  }

  // ── TAB 1: OVERVIEW DASHBOARD ──────────────────────────────────────────────
  async function loadDashboard() {
    const res = await apiFetch('/api/iams/client-portal/overview');
    if (!res.success) {
      showToast(res.error || 'Failed to load overview data', 'error');
      return;
    }

    const { project, client, metrics, contacts } = res;

    // Banner details
    document.getElementById('ov-project-title').textContent = project.title || 'Client Project';
    document.getElementById('ov-category-pill').textContent = (project.category || 'AGENCY PROJECT').replace('_', ' ');
    document.getElementById('ov-status-pill').textContent = (project.status || 'ACTIVE').replace('_', ' ');

    if (project.days_remaining !== null) {
      document.getElementById('ov-days-left').innerHTML = `
        <i data-lucide="clock" class="w-3.5 h-3.5 text-cyan-400"></i>
        <span>${project.days_remaining} Days to Target Launch</span>
      `;
    }

    // Velocity / Progress
    const pct = project.progress_percentage || 0;
    document.getElementById('ov-progress-pct').textContent = `${pct}%`;
    document.getElementById('ov-progress-bar').style.width = `${pct}%`;
    document.getElementById('ov-completed-count').textContent = `${metrics.completed_deliverables} of ${metrics.total_deliverables} deliverables signed off`;

    // Metrics Cards
    document.getElementById('stat-completed-num').textContent = metrics.completed_deliverables;
    document.getElementById('stat-pending-num').textContent = metrics.pending_client_approvals;
    document.getElementById('stat-brief-score').textContent = `${metrics.brief_completion || 0}%`;

    // Badges in Header tabs & Mobile Dock
    const briefBadge = document.getElementById('tab-brief-badge');
    const dockBriefBadge = document.getElementById('dock-brief-badge');
    if (briefBadge) briefBadge.textContent = `${metrics.brief_completion || 0}%`;
    if (dockBriefBadge) dockBriefBadge.textContent = `${metrics.brief_completion || 0}%`;

    const pendingBadge = document.getElementById('tab-pending-badge');
    const dockPendingBadge = document.getElementById('dock-pending-badge');
    const pendingApprovals = metrics.pending_client_approvals || 0;
    if (pendingBadge) {
      if (pendingApprovals > 0) {
        pendingBadge.textContent = pendingApprovals;
        pendingBadge.classList.remove('hidden');
      } else {
        pendingBadge.classList.add('hidden');
      }
    }
    if (dockPendingBadge) {
      if (pendingApprovals > 0) {
        dockPendingBadge.textContent = pendingApprovals;
        dockPendingBadge.classList.remove('hidden');
      } else {
        dockPendingBadge.classList.add('hidden');
      }
    }

    // Assigned Team
    if (contacts?.account_manager) {
      document.getElementById('team-am-name').textContent = contacts.account_manager.full_name;
      const waBtn = document.getElementById('btn-am-whatsapp');
      if (waBtn) {
        const phoneClean = contacts.account_manager.phone.replace(/[^0-9]/g, '');
        waBtn.href = `https://wa.me/${phoneClean}?text=Hello%20${encodeURIComponent(contacts.account_manager.full_name)}%2C%20checking%20in%20regarding%20our%20Iceberg%20project.`;
      }
      const emailBtn = document.getElementById('btn-am-email');
      if (emailBtn) emailBtn.href = `mailto:${contacts.account_manager.email}`;
    }

    if (contacts?.lead_specialist) {
      document.getElementById('team-lead-name').textContent = contacts.lead_specialist.full_name;
      document.getElementById('team-lead-dept').textContent = contacts.lead_specialist.department.replace('_', ' ');
    }

    // Project External Hub Links
    const links = project.links || {};
    toggleLinkButton('link-staging', links.staging_url);
    toggleLinkButton('link-figma', links.figma_url);
    toggleLinkButton('link-drive', links.drive_folder);

    // Recent deliverables list on Overview
    renderOverviewDeliverables(res.recent_assets || []);

    if (window.lucide) window.lucide.createIcons();
  }

  function toggleLinkButton(id, url) {
    const el = document.getElementById(id);
    if (!el) return;
    if (url && url !== '#' && url.trim().length > 4) {
      el.href = url;
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  }

  function renderOverviewDeliverables(assets) {
    const container = document.getElementById('ov-deliverables-list');
    if (!container) return;

    if (!assets || assets.length === 0) {
      container.innerHTML = `
        <div class="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center text-xs text-slate-400">
          <i data-lucide="inbox" class="w-6 h-6 mx-auto mb-1.5 text-slate-600"></i>
          Sprint deliverables in production. First milestone review will appear here shortly.
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = assets.map(a => {
      const isApproved = a.client_status === 'APPROVED';
      const isPending = a.client_status === 'PENDING_REVIEW';
      const badgeClass = isApproved ? 'badge-emerald' : isPending ? 'badge-amber' : 'badge-cyan';
      const statusText = isApproved ? 'Approved' : isPending ? 'Action Required' : 'In Review';

      return `
        <div class="glass-card-interactive p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
              <i data-lucide="file-check" class="w-4 h-4"></i>
            </div>
            <div>
              <div class="text-xs font-bold text-white flex items-center gap-2">
                ${a.task_title}
                <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">v${a.version}</span>
              </div>
              <div class="text-[11px] text-slate-400 mt-0.5">Asset Type: ${a.preview_type || 'Deliverable'}</div>
            </div>
          </div>

          <div class="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeClass}">
              ${statusText}
            </span>
            ${a.asset_url && a.asset_url !== '#' ? `
              <a href="${a.asset_url}" target="_blank" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 transition" title="Preview Asset">
                <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
              </a>
            ` : ''}
            <button onclick="PortalApp.switchTab('checklists')" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition">
              Review
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  // ── TAB 2: ONBOARDING BRIEF STUDIO ─────────────────────────────────────────
  async function loadBrief() {
    const res = await apiFetch('/api/iams/client-portal/brief');
    if (!res.success) {
      showToast(res.error || 'Failed to load brief', 'error');
      return;
    }

    const b = res.brief;

    // Status Tag
    const tag = document.getElementById('brief-status-tag');
    if (tag) {
      tag.textContent = (b.status || 'DRAFT').replace('_', ' ');
      tag.className = `text-xs font-bold px-2 py-0.5 rounded-full ${
        b.status === 'APPROVED' ? 'badge-emerald' : b.status === 'SUBMITTED' ? 'badge-cyan' : 'badge-amber'
      }`;
    }

    // Populate Fields
    setInputValue('bf-brand-story', b.brand_overview?.brand_story);
    setInputValue('bf-value-prop', b.brand_overview?.value_proposition);
    setInputValue('bf-industry', b.brand_overview?.industry_niche);
    setInputValue('bf-target-persona', b.target_audience?.primary_persona);
    setInputValue('bf-pain-points', (b.target_audience?.pain_points || []).join(', '));
    setInputValue('bf-primary-goal', b.scope_and_objectives?.primary_goal || 'LEAD_GENERATION');
    setInputValue('bf-target-kpis', b.scope_and_objectives?.target_kpis);
    setInputValue('bf-visual-style', b.creative_preferences?.visual_style || 'MINIMAL_LUXURY');
    setInputValue('bf-brand-colors', (b.creative_preferences?.brand_colors || []).join(', '));
    setInputValue('bf-benchmarks', (b.creative_preferences?.competitor_benchmarks || []).map(c => c.url || c.name).join(', '));
    setInputValue('bf-drive-url', b.assets_and_access?.drive_folder_url);
    setInputValue('bf-guidelines-url', b.assets_and_access?.brand_guidelines_url);
    setInputValue('bf-access-notes', b.assets_and_access?.notes);
  }

  function setInputValue(id, val) {
    const el = document.getElementById(id);
    if (el && val !== undefined && val !== null) el.value = val;
  }

  async function saveBrief(isSubmit = false) {
    const payload = {
      action: isSubmit ? 'SUBMIT' : 'SAVE',
      brand_overview: {
        brand_story: document.getElementById('bf-brand-story')?.value || '',
        value_proposition: document.getElementById('bf-value-prop')?.value || '',
        industry_niche: document.getElementById('bf-industry')?.value || ''
      },
      target_audience: {
        primary_persona: document.getElementById('bf-target-persona')?.value || '',
        pain_points: (document.getElementById('bf-pain-points')?.value || '').split(',').map(s => s.trim()).filter(Boolean)
      },
      scope_and_objectives: {
        primary_goal: document.getElementById('bf-primary-goal')?.value || 'LEAD_GENERATION',
        target_kpis: document.getElementById('bf-target-kpis')?.value || ''
      },
      creative_preferences: {
        visual_style: document.getElementById('bf-visual-style')?.value || 'MINIMAL_LUXURY',
        brand_colors: (document.getElementById('bf-brand-colors')?.value || '').split(',').map(s => s.trim()).filter(Boolean),
        competitor_benchmarks: (document.getElementById('bf-benchmarks')?.value || '').split(',').map(s => ({ url: s.trim() })).filter(c => c.url)
      },
      assets_and_access: {
        drive_folder_url: document.getElementById('bf-drive-url')?.value || '',
        brand_guidelines_url: document.getElementById('bf-guidelines-url')?.value || '',
        notes: document.getElementById('bf-access-notes')?.value || ''
      }
    };

    const res = await apiFetch('/api/iams/client-portal/brief', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });

    if (res.success) {
      showToast(isSubmit ? 'Brief submitted for Creative Director review!' : 'Draft progress saved.');
      loadBrief();
      loadDashboard();
    } else {
      showToast(res.error || 'Failed to save brief', 'error');
    }
  }

  // ── TAB 3: CHECKLISTS & DELIVERABLE APPROVALS ──────────────────────────────
  async function loadChecklists() {
    const res = await apiFetch('/api/iams/client-portal/checklists');
    if (!res.success) {
      showToast(res.error || 'Failed to load checklists', 'error');
      return;
    }

    // 1. Onboarding Checklist
    const onbContainer = document.getElementById('onboarding-checklist-items');
    if (onbContainer) {
      onbContainer.innerHTML = (res.onboarding_checklist || []).map(item => `
        <div class="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-6 h-6 rounded-lg ${item.is_completed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-500'} flex items-center justify-center shrink-0">
              <i data-lucide="${item.is_completed ? 'check' : 'circle'}" class="w-3.5 h-3.5"></i>
            </div>
            <div>
              <div class="text-xs font-bold ${item.is_completed ? 'text-slate-300' : 'text-white'}">
                ${item.title}
              </div>
              <div class="text-[11px] text-slate-400 mt-0.5">${item.description}</div>
            </div>
          </div>

          <div class="shrink-0 flex items-center gap-2">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${item.is_completed ? 'badge-emerald' : 'badge-amber'}">
              ${item.badge}
            </span>
            ${item.link_tab ? `
              <button onclick="PortalApp.switchTab('${item.link_tab}')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 transition">
                Open
              </button>
            ` : ''}
          </div>
        </div>
      `).join('');
    }

    // 2. Sprint Deliverables Grid
    const delivContainer = document.getElementById('sprint-deliverables-grid');
    if (delivContainer) {
      if (!res.deliverables || res.deliverables.length === 0) {
        delivContainer.innerHTML = `
          <div class="md:col-span-2 text-center py-12 glass-panel text-slate-400 text-xs">
            <i data-lucide="check-circle-2" class="w-8 h-8 text-cyan-500/40 mx-auto mb-2"></i>
            All active deliverables are in progress or signed off. Check back soon for new milestone reviews.
          </div>
        `;
      } else {
        delivContainer.innerHTML = res.deliverables.map(d => {
          const v = d.current_version;
          const isApproved = v?.client_status === 'APPROVED' || d.status === 'DONE';
          const isPending = v && v.client_status === 'PENDING_REVIEW';
          const isRevision = v && v.client_status === 'CHANGES_REQUESTED';

          const badgeClass = isApproved ? 'badge-emerald' : isPending ? 'badge-amber' : isRevision ? 'badge-purple' : 'badge-cyan';
          const statusLabel = isApproved ? 'Approved & Signed Off' : isPending ? 'Action Required' : isRevision ? 'Revisions In Progress' : 'In Production';

          return `
            <div class="glass-panel p-5 space-y-4 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between gap-2 mb-2">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeClass}">
                    ${statusLabel}
                  </span>
                  <span class="text-[10px] text-slate-400 font-mono">Revisions: ${d.revision_rounds_count} / ${d.max_free_revisions}</span>
                </div>

                <h4 class="text-sm font-bold text-white font-display">${d.title}</h4>
                <p class="text-xs text-slate-400 mt-1 leading-relaxed">${d.description || 'Sprint deliverable awaiting review.'}</p>
              </div>

              ${v ? `
                <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-slate-400 font-medium flex items-center gap-1.5">
                      <i data-lucide="file" class="w-3.5 h-3.5 text-cyan-400"></i> Version ${v.version_number}
                    </span>
                    ${v.asset_url && v.asset_url !== '#' ? `
                      <a href="${v.asset_url}" target="_blank" class="text-cyan-400 hover:underline flex items-center gap-1 font-semibold">
                        Inspect Asset <i data-lucide="external-link" class="w-3 h-3"></i>
                      </a>
                    ` : ''}
                  </div>
                  ${v.client_feedback ? `
                    <div class="text-[11px] text-amber-300/90 italic border-l-2 border-amber-500 pl-2">
                      Feedback: "${v.client_feedback}"
                    </div>
                  ` : ''}
                </div>
              ` : ''}

              <!-- Actions -->
              <div class="pt-2 border-t border-slate-800/80 flex items-center justify-end gap-2">
                ${!isApproved ? `
                  <button onclick="PortalApp.openRevisionModal('${d.task_id}', '${escapeHtml(d.title)}')" class="px-3.5 py-1.5 rounded-lg btn-ghost text-xs font-semibold text-amber-300 flex items-center gap-1">
                    <i data-lucide="edit-3" class="w-3 h-3"></i> Request Revision
                  </button>
                  <button onclick="PortalApp.openApproveModal('${d.task_id}', '${escapeHtml(d.title)}')" class="px-4 py-1.5 rounded-lg btn-cyan text-xs font-bold text-slate-950 flex items-center gap-1">
                    <i data-lucide="check" class="w-3.5 h-3.5"></i> Approve
                  </button>
                ` : `
                  <span class="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <i data-lucide="check-circle" class="w-3.5 h-3.5"></i> Deliverable Finalized
                  </span>
                `}
              </div>
            </div>
          `;
        }).join('');
      }
    }

    if (window.lucide) window.lucide.createIcons();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ── DELIVERABLE REVIEW MODALS ──────────────────────────────────────────────
  function openApproveModal(taskId, title) {
    activeReviewTaskId = taskId;
    document.getElementById('app-task-title').textContent = title;
    openModal('modal-approve');
  }

  function openRevisionModal(taskId, title) {
    activeReviewTaskId = taskId;
    document.getElementById('rev-task-title').textContent = title;
    document.getElementById('rev-feedback-text').value = '';
    openModal('modal-revision');
  }

  async function submitDeliverableReview(action) {
    if (!activeReviewTaskId) return;

    let feedback = '';
    if (action === 'REQUEST_REVISION') {
      feedback = document.getElementById('rev-feedback-text')?.value || '';
      if (feedback.trim().length < 5) {
        showToast('Please enter constructive feedback for the revision.', 'error');
        return;
      }
    }

    const res = await apiFetch(`/api/iams/client-portal/deliverables/${activeReviewTaskId}/review`, {
      method: 'POST',
      body: JSON.stringify({ action, feedback })
    });

    if (res.success) {
      showToast(res.message);
      closeModal('modal-approve');
      closeModal('modal-revision');
      loadChecklists();
      loadDashboard();
    } else {
      showToast(res.error || 'Failed to submit review', 'error');
    }
  }

  // ── TAB 4: ADD-ON SERVICES MARKETPLACE ─────────────────────────────────────
  async function loadAddons() {
    const res = await apiFetch('/api/iams/client-portal/addons');
    if (res.success) {
      cachedAddons = res.services || [];
      renderAddonCatalog();
    }
    await loadMyRequests();
  }

  function setAddonCurrency(cur) {
    currentAddonCurrency = cur;
    document.getElementById('cur-btn-usd')?.classList.toggle('bg-cyan-500/20', cur === 'USD');
    document.getElementById('cur-btn-usd')?.classList.toggle('text-cyan-300', cur === 'USD');
    document.getElementById('cur-btn-egp')?.classList.toggle('bg-cyan-500/20', cur === 'EGP');
    document.getElementById('cur-btn-egp')?.classList.toggle('text-cyan-300', cur === 'EGP');
    renderAddonCatalog();
  }

  function renderAddonCatalog() {
    const container = document.getElementById('addons-catalog-grid');
    if (!container) return;

    container.innerHTML = cachedAddons.map(svc => {
      const priceStr = currentAddonCurrency === 'USD'
        ? `$${svc.price_usd.toLocaleString()} USD`
        : `${svc.price_egp.toLocaleString()} EGP`;

      return `
        <div class="glass-panel p-6 flex flex-col justify-between space-y-5 hover:border-purple-500/40 transition">
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full badge-purple">${svc.category}</span>
              <span class="text-xs text-slate-400 flex items-center gap-1">
                <i data-lucide="calendar" class="w-3 h-3 text-cyan-400"></i> ${svc.turnaround_days} Days
              </span>
            </div>

            <h4 class="text-base font-extrabold font-display text-white">${svc.title}</h4>
            <p class="text-xs text-slate-400 leading-relaxed">${svc.description}</p>

            <div class="space-y-1.5 pt-2">
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Scope Inclusions:</span>
              <ul class="text-[11px] text-slate-300 space-y-1">
                ${(svc.deliverables || []).map(d => `
                  <li class="flex items-center gap-1.5">
                    <i data-lucide="check" class="w-3 h-3 text-emerald-400 shrink-0"></i>
                    <span>${d}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          </div>

          <div class="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
            <div>
              <div class="text-[10px] text-slate-400">Starting at</div>
              <div class="text-sm font-extrabold text-cyan-400 font-display">${priceStr}</div>
            </div>

            <button onclick="PortalApp.openAddonModal('${svc.slug}')" class="px-4 py-2 rounded-xl btn-cyan text-xs font-bold text-slate-950 flex items-center gap-1.5">
              <span>Apply</span>
              <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  function openAddonModal(slug) {
    const svc = cachedAddons.find(s => s.slug === slug);
    if (!svc) return;

    activeAddonSlug = slug;
    document.getElementById('apply-addon-title').textContent = svc.title;
    document.getElementById('apply-addon-category').textContent = svc.category;

    const price = currentAddonCurrency === 'USD'
      ? `$${svc.price_usd.toLocaleString()} USD`
      : `${svc.price_egp.toLocaleString()} EGP`;
    document.getElementById('apply-addon-price').textContent = price;
    document.getElementById('apply-addon-currency').value = currentAddonCurrency;
    document.getElementById('apply-addon-notes').value = '';

    openModal('modal-addon-apply');
  }

  async function submitAddonApplication() {
    if (!activeAddonSlug) return;

    const notes = document.getElementById('apply-addon-notes')?.value || '';
    const urgency = document.getElementById('apply-addon-urgency')?.value || 'STANDARD';
    const currency = document.getElementById('apply-addon-currency')?.value || 'USD';

    const res = await apiFetch('/api/iams/client-portal/addons/apply', {
      method: 'POST',
      body: JSON.stringify({
        service_slug: activeAddonSlug,
        custom_requirements: notes,
        timeline_preference: urgency,
        currency
      })
    });

    if (res.success) {
      showToast(res.message);
      closeModal('modal-addon-apply');
      loadMyRequests();
    } else {
      showToast(res.error || 'Failed to submit application', 'error');
    }
  }

  async function loadMyRequests() {
    const res = await apiFetch('/api/iams/client-portal/my-requests');
    const container = document.getElementById('my-requests-list');
    if (!container) return;

    if (!res.success || !res.requests || res.requests.length === 0) {
      container.innerHTML = `
        <div class="text-center py-6 text-slate-500 text-xs">
          No add-on requests submitted yet. Browse our catalog above to request sprints.
        </div>
      `;
      return;
    }

    container.innerHTML = res.requests.map(r => `
      <div class="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3">
        <div>
          <div class="text-xs font-bold text-white">${r.title}</div>
          <div class="text-[11px] text-slate-400 mt-0.5 truncate max-w-md">${r.description || 'Add-on service request'}</div>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <span class="text-xs font-extrabold text-cyan-400 font-display">${r.additional_fee ? `${r.additional_fee.toLocaleString()} ${r.currency}` : ''}</span>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === 'APPROVED' ? 'badge-emerald' : 'badge-amber'}">
            ${r.status}
          </span>
        </div>
      </div>
    `).join('');
  }

  // ── TAB 5: TEAM STREAM (PROJECT MESSAGING) ─────────────────────────────────
  async function loadMessages() {
    const res = await apiFetch('/api/iams/client-portal/messages');
    const container = document.getElementById('project-chat-stream');
    if (!container) return;

    const msgs = res.messages || res.data || [];

    if (!res.success || !Array.isArray(msgs) || msgs.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 text-slate-500 text-xs">
          <i data-lucide="message-square" class="w-8 h-8 text-slate-600 mx-auto mb-2"></i>
          This is your private project stream. Leave questions, ideas, or feedback for your account team.
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    const isFirstLoad = container.children.length <= 1;
    const wasNearBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + 80;

    container.innerHTML = msgs.map(m => {
      const isClientSender = m.sender?.role === 'ClientGuest' || m.sender?.user_id === currentUser?.user_id;

      return `
        <div class="flex flex-col ${isClientSender ? 'items-end' : 'items-start'}">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[11px] font-bold ${isClientSender ? 'text-cyan-400' : 'text-purple-400'}">
              ${escapeHtml(m.sender?.full_name || 'Team Member')}
            </span>
            <span class="text-[10px] text-slate-500">
              ${new Date(m.created_at || m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div class="max-w-md p-3 rounded-2xl text-xs leading-relaxed ${
            isClientSender 
              ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-100 rounded-tr-none shadow-sm shadow-cyan-950/20' 
              : 'bg-slate-900 border border-slate-700/80 text-slate-200 rounded-tl-none shadow-sm'
          }">
            ${escapeHtml(m.text)}
          </div>
        </div>
      `;
    }).join('');

    if (isFirstLoad || wasNearBottom) {
      container.scrollTop = container.scrollHeight;
    }
    if (window.lucide) window.lucide.createIcons();
  }

  async function sendChatMessage(e) {
    e.preventDefault();
    const input = document.getElementById('chat-input-text');
    if (!input || !input.value.trim()) return;

    const text = input.value.trim();
    input.value = '';

    const res = await apiFetch('/api/iams/client-portal/messages', {
      method: 'POST',
      body: JSON.stringify({ text })
    });

    if (res.success) {
      loadMessages();
    } else {
      showToast(res.error || 'Failed to send message', 'error');
    }
  }

  // ── MODAL HELPERS ─────────────────────────────────────────────────────────
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
      if (window.lucide) window.lucide.createIcons();
    }
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('hidden');
  }

  // Public Exports
  return {
    init,
    showToast,
    handleLogin,
    loginDemo,
    logout,
    togglePasswordVisibility,
    switchTab,
    saveBrief,
    openApproveModal,
    openRevisionModal,
    submitDeliverableReview,
    setAddonCurrency,
    openAddonModal,
    submitAddonApplication,
    sendChatMessage,
    closeModal
  };
})();

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  PortalApp.init();
});
