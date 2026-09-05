/**
 * ICEBERG Upbase Workspaces, Projects & Modular Tool Engine
 * Controls Kanban, LexoRank Tasks, Async Messages, Rich Docs, Bookmarks, and Chat
 */

window.WorkspacesState = {
  workspaces: [],
  currentWorkspaceId: null,
  projects: [],
  currentProjectId: null,
  activeTool: 'kanban', // 'kanban' | 'tasks' | 'messages' | 'docs' | 'bookmarks' | 'chat'
  tasks: [],
  topics: [],
  activeTopic: null,
  docs: [],
  activeDoc: null,
  bookmarks: [],
  chatMessages: [],
  draggedTaskId: null
};

// Default Fallback Datasets (Zero-latency offline-first resilience)
const DEFAULT_FALLBACK_WORKSPACES = [
  {
    workspace_id: 'ws_iceberg_master',
    name: 'ICEBERG Master Workspace',
    description: 'Primary agency workspace for client sprints and internal delivery',
    created_at: new Date().toISOString()
  }
];

const DEFAULT_FALLBACK_PROJECTS = [
  {
    project_id: 'prj_dentaquik',
    workspace_id: 'ws_iceberg_master',
    name: 'DentaQuik (Growth & Funnel)',
    description: 'B2B dental e-commerce funnel, paid media campaigns, and conversion rate optimization.',
    color: '#06b6d4',
    icon: 'folder',
    category: 'Development',
    client_id: 'client_dentaquik'
  },
  {
    project_id: 'prj_musical_bag',
    workspace_id: 'ws_iceberg_master',
    name: 'Musical Bag (E-Commerce & Brand)',
    description: 'Brand identity, Shopify experience, and high-fidelity product storytelling.',
    color: '#ec4899',
    icon: 'folder',
    category: 'Branding',
    client_id: 'client_musical_bag'
  },
  {
    project_id: 'prj_call_worship',
    workspace_id: 'ws_iceberg_master',
    name: 'The Call For Whorship (Media Campaign)',
    description: 'Spiritual multimedia platform, video production, and community engagement rollouts.',
    color: '#8b5cf6',
    icon: 'folder',
    category: 'Media Production',
    client_id: 'client_the_call_for_worship'
  },
  {
    project_id: 'prj_drum_shop',
    workspace_id: 'ws_iceberg_master',
    name: 'Drum Shop (Omnichannel Retainer)',
    description: 'Full-service social media retainer, studio shoots, and in-store event promotions.',
    color: '#f59e0b',
    icon: 'folder',
    category: 'Social Media',
    client_id: 'client_drum_shop'
  },
  {
    project_id: 'prj_ghost_note',
    workspace_id: 'ws_iceberg_master',
    name: 'Ghost Note (Creative & Social)',
    description: 'Independent record label branding, release campaigns, and merchandise design.',
    color: '#10b981',
    icon: 'folder',
    category: 'Creative Design',
    client_id: 'client_ghost_note'
  },
  {
    project_id: 'prj_golden_perfume',
    workspace_id: 'ws_iceberg_master',
    name: 'Golden Perfume (Luxury Brand Launch)',
    description: 'Luxury fragrance packaging, 3D bottle modeling, and Middle East launch PR.',
    color: '#eab308',
    icon: 'folder',
    category: 'Branding',
    client_id: 'client_golden_perfume'
  },
  {
    project_id: 'prj_acrostone',
    workspace_id: 'ws_iceberg_master',
    name: 'Acrostone & Waterpik (B2B Distribution)',
    description: 'Medical supply wholesale portal, distributor catalogs, and CRM integration.',
    color: '#3b82f6',
    icon: 'folder',
    category: 'Development',
    client_id: 'client_acrostone'
  },
  {
    project_id: 'prj_sprint_14',
    workspace_id: 'ws_iceberg_master',
    name: 'Sprint 14: Omni-Channel Q4 Launch',
    description: 'Agency-wide Q4 campaigns, influencer activations, and multi-brand holiday push.',
    color: '#6366f1',
    icon: 'folder',
    category: 'Marketing Strategy',
    client_id: 'client_internal'
  },
  {
    project_id: 'prj_iceberg_internal',
    workspace_id: 'ws_iceberg_master',
    name: 'Iceberg (Internal Operations & Dev)',
    description: 'Core agency infrastructure, website improvements, client portal, and automation bots.',
    color: '#06b6d4',
    icon: 'folder',
    category: 'Development',
    client_id: 'client_iceberg'
  }
];

const DEFAULT_FALLBACK_TASKS = {
  prj_dentaquik: [
    { task_id: 'task_dq_1', project_id: 'prj_dentaquik', title: 'Audit Shopify checkout funnel drop-off points', status: 'TODO', priority: 'HIGH', due_date: '2026-09-08', duration_minutes: 60, position: '0|hzzzzz:', subtasks: [{ title: 'Review Hotjar recordings', completed: true }, { title: 'Map abandoned checkout steps', completed: false }] },
    { task_id: 'task_dq_2', project_id: 'prj_dentaquik', title: 'Design high-converting mobile product page layout', status: 'IN_PROGRESS', priority: 'URGENT', due_date: '2026-09-07', duration_minutes: 90, position: '0|i00000:', subtasks: [{ title: 'Figma wireframes', completed: true }, { title: 'Client review', completed: false }] },
    { task_id: 'task_dq_3', project_id: 'prj_dentaquik', title: 'Set up Meta & TikTok Ads retargeting catalog', status: 'REVIEW', priority: 'MEDIUM', due_date: '2026-09-09', duration_minutes: 45, position: '0|i00008:', subtasks: [] },
    { task_id: 'task_dq_4', project_id: 'prj_dentaquik', title: 'Connect Klaviyo B2B wholesale onboarding flow', status: 'DONE', priority: 'LOW', due_date: '2026-09-05', duration_minutes: 30, position: '0|i00010:', subtasks: [{ title: 'Welcome series live', completed: true }] }
  ],
  prj_musical_bag: [
    { task_id: 'task_mb_1', project_id: 'prj_musical_bag', title: 'Refine packaging typography & metallic foil spec', status: 'IN_PROGRESS', priority: 'HIGH', due_date: '2026-09-08', duration_minutes: 60, position: '0|hzzzzz:', subtasks: [] },
    { task_id: 'task_mb_2', project_id: 'prj_musical_bag', title: 'Render 3D product turntable video in Blender', status: 'TODO', priority: 'MEDIUM', due_date: '2026-09-10', duration_minutes: 120, position: '0|i00000:', subtasks: [] },
    { task_id: 'task_mb_3', project_id: 'prj_musical_bag', title: 'Brand guidelines book print approval', status: 'DONE', priority: 'URGENT', due_date: '2026-09-04', duration_minutes: 45, position: '0|i00008:', subtasks: [] }
  ],
  prj_call_worship: [
    { task_id: 'task_cw_1', project_id: 'prj_call_worship', title: 'Soundtrack mastering for episode 04 documentary', status: 'TODO', priority: 'HIGH', due_date: '2026-09-09', duration_minutes: 90, position: '0|hzzzzz:', subtasks: [] },
    { task_id: 'task_cw_2', project_id: 'prj_call_worship', title: 'Color grading on 4K multi-cam concert footage', status: 'IN_PROGRESS', priority: 'URGENT', due_date: '2026-09-07', duration_minutes: 180, position: '0|i00000:', subtasks: [] },
    { task_id: 'task_cw_3', project_id: 'prj_call_worship', title: 'YouTube premiere campaign & community countdown', status: 'DONE', priority: 'MEDIUM', due_date: '2026-09-03', duration_minutes: 30, position: '0|i00008:', subtasks: [] }
  ],
  prj_drum_shop: [
    { task_id: 'task_ds_1', project_id: 'prj_drum_shop', title: 'Weekly TikTok / Reels batch shoot scheduling', status: 'TODO', priority: 'MEDIUM', due_date: '2026-09-08', duration_minutes: 60, position: '0|hzzzzz:', subtasks: [] },
    { task_id: 'task_ds_2', project_id: 'prj_drum_shop', title: 'Cymbal demo video edit & motion graphics title', status: 'IN_PROGRESS', priority: 'HIGH', due_date: '2026-09-07', duration_minutes: 75, position: '0|i00000:', subtasks: [] }
  ],
  prj_ghost_note: [
    { task_id: 'task_gn_1', project_id: 'prj_ghost_note', title: 'Vinyl cover design typography proofing', status: 'TODO', priority: 'HIGH', due_date: '2026-09-08', duration_minutes: 60, position: '0|hzzzzz:', subtasks: [] },
    { task_id: 'task_gn_2', project_id: 'prj_ghost_note', title: 'Release announcement teaser animation in After Effects', status: 'IN_PROGRESS', priority: 'URGENT', due_date: '2026-09-07', duration_minutes: 90, position: '0|i00000:', subtasks: [] }
  ],
  prj_golden_perfume: [
    { task_id: 'task_gp_1', project_id: 'prj_golden_perfume', title: '3D luxury bottle render with amber liquid refractions', status: 'IN_PROGRESS', priority: 'HIGH', due_date: '2026-09-08', duration_minutes: 120, position: '0|hzzzzz:', subtasks: [] },
    { task_id: 'task_gp_2', project_id: 'prj_golden_perfume', title: 'Bilingual luxury press kit copy in English & Arabic', status: 'REVIEW', priority: 'MEDIUM', due_date: '2026-09-09', duration_minutes: 45, position: '0|i00000:', subtasks: [] }
  ],
  prj_acrostone: [
    { task_id: 'task_ac_1', project_id: 'prj_acrostone', title: 'Sync B2B distributor catalog pricing with ERP', status: 'TODO', priority: 'HIGH', due_date: '2026-09-09', duration_minutes: 60, position: '0|hzzzzz:', subtasks: [] },
    { task_id: 'task_ac_2', project_id: 'prj_acrostone', title: 'Distributor portal multi-tier login & permissions test', status: 'DONE', priority: 'MEDIUM', due_date: '2026-09-04', duration_minutes: 30, position: '0|i00008:', subtasks: [] }
  ],
  prj_sprint_14: [
    { task_id: 'task_sp_1', project_id: 'prj_sprint_14', title: 'Finalize Q4 cross-brand influencer briefs', status: 'TODO', priority: 'URGENT', due_date: '2026-09-08', duration_minutes: 60, position: '0|hzzzzz:', subtasks: [] },
    { task_id: 'task_sp_2', project_id: 'prj_sprint_14', title: 'Ad creative matrix review with creative director', status: 'IN_PROGRESS', priority: 'HIGH', due_date: '2026-09-07', duration_minutes: 45, position: '0|i00000:', subtasks: [] },
    { task_id: 'task_sp_3', project_id: 'prj_sprint_14', title: 'Performance tracking dashboard QA & UTM parameters', status: 'REVIEW', priority: 'MEDIUM', due_date: '2026-09-09', duration_minutes: 30, position: '0|i00008:', subtasks: [] },
    { task_id: 'task_sp_4', project_id: 'prj_sprint_14', title: 'Omni-channel kickoff deck alignment with leadership', status: 'DONE', priority: 'HIGH', due_date: '2026-09-02', duration_minutes: 60, position: '0|i00010:', subtasks: [] }
  ],
  prj_iceberg_internal: [
    { task_id: 'task_ib_1', project_id: 'prj_iceberg_internal', title: 'Upgrade Upbase offline resilience & client syncing', status: 'IN_PROGRESS', priority: 'URGENT', due_date: '2026-09-06', duration_minutes: 60, position: '0|hzzzzz:', subtasks: [{ title: 'Sync project lists', completed: true }, { title: 'Add offline fallback', completed: true }] },
    { task_id: 'task_ib_2', project_id: 'prj_iceberg_internal', title: 'Verify bilingual Arabic/English translations on admin', status: 'REVIEW', priority: 'MEDIUM', due_date: '2026-09-08', duration_minutes: 40, position: '0|i00000:', subtasks: [] },
    { task_id: 'task_ib_3', project_id: 'prj_iceberg_internal', title: 'Deploy CMS projects two-way link to production', status: 'DONE', priority: 'HIGH', due_date: '2026-09-05', duration_minutes: 30, position: '0|i00008:', subtasks: [] }
  ]
};

const DEFAULT_FALLBACK_TOPICS = [
  {
    topic_id: 'top_1',
    title: 'Sprint 14 Launch Architecture & Client Roadmaps',
    category: 'ARCHITECTURE',
    content_html: '<p>Welcome to the unified project space. Check all deliverables, brand specs, and upcoming production milestones here.</p>',
    author: { full_name: 'Lead Director' },
    is_pinned: true,
    replies_count: 3,
    last_activity_at: new Date().toISOString()
  }
];

const DEFAULT_FALLBACK_DOCS = [
  {
    doc_id: 'doc_1',
    title: 'Project Scope & Creative Brief',
    content_html: '<h2>Creative Strategy</h2><p>Establish high-converting brand presence and seamless omnichannel customer journey.</p><h3>Key Deliverables</h3><ul><li>High-fidelity Brand UI</li><li>Omnichannel Paid Media Assets</li><li>B2B Conversion Funnels</li></ul>',
    version_history: [{ version_number: 1, created_at: new Date().toISOString() }]
  }
];

const DEFAULT_FALLBACK_BOOKMARKS = [
  {
    bookmark_id: 'bm_1',
    url: 'https://www.figma.com',
    title: 'Figma Brand System & UI Assets',
    domain: 'figma.com',
    image_url: ''
  },
  {
    bookmark_id: 'bm_2',
    url: 'https://drive.google.com',
    title: 'Master Assets & 4K Renders',
    domain: 'drive.google.com',
    image_url: ''
  }
];

const DEFAULT_FALLBACK_CHAT = [
  {
    message_id: 'msg_1',
    sender: { full_name: 'Iceberg Lead' },
    text: 'Welcome team! Tasks and Kanban cards have been loaded for this sprint.',
    created_at: new Date().toISOString(),
    reactions: [{ emoji: '🚀', count: 4 }]
  }
];

// Initialize Upbase Workspaces Suite
async function initUpbaseWorkspaces() {
  // 1. Immediately apply fallback data so user NEVER sees "Loading Workspaces..."
  if (!window.WorkspacesState.workspaces || window.WorkspacesState.workspaces.length === 0) {
    window.WorkspacesState.workspaces = [...DEFAULT_FALLBACK_WORKSPACES];
  }
  if (!window.WorkspacesState.currentWorkspaceId) {
    window.WorkspacesState.currentWorkspaceId = window.WorkspacesState.workspaces[0].workspace_id;
  }
  if (!window.WorkspacesState.projects || window.WorkspacesState.projects.length === 0) {
    window.WorkspacesState.projects = [...DEFAULT_FALLBACK_PROJECTS];
  }
  if (!window.WorkspacesState.currentProjectId && window.WorkspacesState.projects.length > 0) {
    window.WorkspacesState.currentProjectId = window.WorkspacesState.projects[0].project_id;
  }

  // Preload fallback tasks if none loaded
  if ((!window.WorkspacesState.tasks || window.WorkspacesState.tasks.length === 0) && window.WorkspacesState.currentProjectId) {
    window.WorkspacesState.tasks = [...(DEFAULT_FALLBACK_TASKS[window.WorkspacesState.currentProjectId] || DEFAULT_FALLBACK_TASKS.prj_dentaquik || [])];
  }

  // 2. Synchronous zero-latency render of UI elements
  renderWorkspaceSelector();
  renderProjectsSidebar();
  renderToolTabsUI();
  await loadCurrentToolContent();

  // 3. Asynchronously sync with API (resilient background load)
  await loadWorkspacesList();
}

// Helper aliases for UI rendering
function renderActiveProjectTools() {
  renderToolTabsUI();
}

// Load Workspaces list
async function loadWorkspacesList() {
  try {
    const res = await fetch('/api/iams/workspaces', {
      headers: {
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      }
    });
    if (!res.ok) {
      renderWorkspaceSelector();
      await loadWorkspaceProjects();
      return;
    }
    const result = await res.json();
    if (result.success && Array.isArray(result.data) && result.data.length > 0) {
      window.WorkspacesState.workspaces = result.data;
      if (!window.WorkspacesState.currentWorkspaceId || !result.data.find(w => w.workspace_id === window.WorkspacesState.currentWorkspaceId)) {
        window.WorkspacesState.currentWorkspaceId = result.data[0].workspace_id;
      }
      renderWorkspaceSelector();
      await loadWorkspaceProjects();
    } else {
      renderWorkspaceSelector();
      await loadWorkspaceProjects();
    }
  } catch (err) {
    console.warn('Operating in offline-first mode for workspaces:', err);
    renderWorkspaceSelector();
    await loadWorkspaceProjects();
  }
}

async function createInitialDefaultWorkspace() {
  try {
    const res = await fetch('/api/iams/workspaces', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      },
      body: JSON.stringify({
        name: 'ICEBERG Master Workspace',
        description: 'Primary agency workspace for client sprints and internal delivery'
      })
    });
    if (res.ok) {
      const result = await res.json();
      if (result.success && result.data) {
        window.WorkspacesState.currentWorkspaceId = result.data.workspace_id;
        await loadWorkspacesList();
      }
    }
  } catch (e) {
    console.warn('Default workspace server setup skipped, using local fallback:', e);
  }
}

// Render Workspace Selector dropdown
function renderWorkspaceSelector() {
  const select = document.getElementById('upbase-workspace-select');
  if (!select) return;

  const workspaces = (window.WorkspacesState.workspaces && window.WorkspacesState.workspaces.length > 0)
    ? window.WorkspacesState.workspaces
    : DEFAULT_FALLBACK_WORKSPACES;

  select.innerHTML = workspaces.map(ws => `
    <option value="${ws.workspace_id}" ${ws.workspace_id === window.WorkspacesState.currentWorkspaceId ? 'selected' : ''}>
      ${escapeHtml(ws.name)}
    </option>
  `).join('');
}

// Switch Workspace
async function switchWorkspace(wsId) {
  window.WorkspacesState.currentWorkspaceId = wsId;
  window.WorkspacesState.currentProjectId = null;
  await loadWorkspaceProjects();
}

// Load Projects under current workspace
async function loadWorkspaceProjects() {
  const wsId = window.WorkspacesState.currentWorkspaceId;
  if (!wsId) return;

  try {
    const res = await fetch(`/api/iams/workspaces/${wsId}/projects`, {
      headers: {
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      }
    });
    if (!res.ok) {
      if (!window.WorkspacesState.projects || window.WorkspacesState.projects.length === 0) {
        window.WorkspacesState.projects = [...DEFAULT_FALLBACK_PROJECTS];
      }
      if (!window.WorkspacesState.currentProjectId && window.WorkspacesState.projects.length > 0) {
        window.WorkspacesState.currentProjectId = window.WorkspacesState.projects[0].project_id;
      }
      renderProjectsSidebar();
      renderActiveProjectTools();
      return;
    }
    const result = await res.json();
    if (result.success && Array.isArray(result.data) && result.data.length > 0) {
      window.WorkspacesState.projects = result.data;
      if (!window.WorkspacesState.currentProjectId || !result.data.find(p => p.project_id === window.WorkspacesState.currentProjectId)) {
        window.WorkspacesState.currentProjectId = result.data[0].project_id;
      }
      renderProjectsSidebar();
      renderActiveProjectTools();
      await loadCurrentToolContent();
    } else {
      if (!window.WorkspacesState.projects || window.WorkspacesState.projects.length === 0) {
        window.WorkspacesState.projects = [...DEFAULT_FALLBACK_PROJECTS];
      }
      renderProjectsSidebar();
      renderActiveProjectTools();
    }
  } catch (err) {
    console.warn('Using offline fallback projects:', err);
    if (!window.WorkspacesState.projects || window.WorkspacesState.projects.length === 0) {
      window.WorkspacesState.projects = [...DEFAULT_FALLBACK_PROJECTS];
    }
    renderProjectsSidebar();
    renderActiveProjectTools();
  }
}

// Render Projects in sidebar list
function renderProjectsSidebar() {
  const container = document.getElementById('upbase-projects-list');
  if (!container) return;

  const projects = window.WorkspacesState.projects;
  if (projects.length === 0) {
    container.innerHTML = `
      <div class="text-xs text-slate-500 py-4 text-center px-2">
        <p class="mb-2">No project lists created yet.</p>
        <button type="button" onclick="openCreateProjectModal()" class="w-full py-2 px-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs rounded-xl border border-cyan-500/30 font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm">
          <span>+</span> Create First Project
        </button>
      </div>`;
    return;
  }

  container.innerHTML = projects.map(p => `
    <button onclick="selectProject('${p.project_id}')" class="w-full text-left flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${p.project_id === window.WorkspacesState.currentProjectId ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'}">
      <div class="flex items-center gap-2.5 truncate">
        <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${p.color || '#06b6d4'};"></span>
        <span class="truncate">${escapeHtml(p.name)}</span>
      </div>
    </button>
  `).join('');
}

// Select a Project
async function selectProject(prjId) {
  window.WorkspacesState.currentProjectId = prjId;
  renderProjectsSidebar();
  renderActiveProjectTools();
  await loadCurrentToolContent();
}

// Switch Active Tool Tab
function switchProjectTool(toolKey) {
  window.WorkspacesState.activeTool = toolKey;
  renderToolTabsUI();
  loadCurrentToolContent();
}

// Render Project Tool Tabs header
function renderToolTabsUI() {
  const currentPrj = window.WorkspacesState.projects.find(p => p.project_id === window.WorkspacesState.currentProjectId);
  if (!currentPrj) return;

  const prjTitleEl = document.getElementById('upbase-project-title');
  if (prjTitleEl) {
    prjTitleEl.innerHTML = `<span class="w-3 h-3 rounded-full inline-block mr-2" style="background-color: ${currentPrj.color || '#06b6d4'};"></span>${escapeHtml(currentPrj.name)}`;
  }

  const tools = [
    { key: 'kanban', label: 'Kanban Board', icon: 'kanban' },
    { key: 'tasks', label: 'List View', icon: 'check-square' },
    { key: 'messages', label: 'Messages', icon: 'message-square' },
    { key: 'docs', label: 'Docs', icon: 'file-text' },
    { key: 'bookmarks', label: 'Bookmarks', icon: 'bookmark' },
    { key: 'chat', label: 'Chat Stream', icon: 'messages-square' }
  ];

  const tabsContainer = document.getElementById('upbase-tool-tabs');
  if (tabsContainer) {
    tabsContainer.innerHTML = tools.map(t => {
      const isActive = window.WorkspacesState.activeTool === t.key;
      return `
        <button onclick="switchProjectTool('${t.key}')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${isActive ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200 border border-transparent'}">
          <i data-lucide="${t.icon}" class="w-4 h-4"></i>
          ${t.label}
        </button>
      `;
    }).join('');
    if (window.lucide) window.lucide.createIcons();
  }
}

// Load content depending on current active tool
async function loadCurrentToolContent() {
  renderToolTabsUI();
  const tool = window.WorkspacesState.activeTool;
  const prjId = window.WorkspacesState.currentProjectId;
  if (!prjId) return;

  // Hide all panels
  ['kanban', 'tasks', 'messages', 'docs', 'bookmarks', 'chat'].forEach(k => {
    const el = document.getElementById(`upbase-panel-${k}`);
    if (el) el.classList.add('hidden');
  });

  const activePanel = document.getElementById(`upbase-panel-${tool}`);
  if (activePanel) activePanel.classList.remove('hidden');

  if (tool === 'kanban' || tool === 'tasks') {
    await loadWorkspaceTasks();
  } else if (tool === 'messages') {
    await loadProjectMessages();
  } else if (tool === 'docs') {
    await loadProjectDocs();
  } else if (tool === 'bookmarks') {
    await loadProjectBookmarks();
  } else if (tool === 'chat') {
    await loadProjectChat();
  }
}

// ==========================================
// 1. KANBAN & TASKS (LEXORANK FRACTIONAL INDEXING)
// ==========================================

async function loadWorkspaceTasks() {
  const wsId = window.WorkspacesState.currentWorkspaceId || 'ws_iceberg_master';
  const prjId = window.WorkspacesState.currentProjectId;
  if (!prjId) return;

  try {
    const res = await fetch(`/api/iams/workspaces/${wsId}/tasks?project_id=${prjId}`, {
      headers: {
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      }
    });
    if (res.ok) {
      const result = await res.json();
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        window.WorkspacesState.tasks = result.data;
      } else if (!window.WorkspacesState.tasks || window.WorkspacesState.tasks.length === 0 || window.WorkspacesState.tasks.every(t => t.project_id !== prjId)) {
        window.WorkspacesState.tasks = [...(DEFAULT_FALLBACK_TASKS[prjId] || DEFAULT_FALLBACK_TASKS.prj_dentaquik || [])];
      }
    } else {
      if (!window.WorkspacesState.tasks || window.WorkspacesState.tasks.length === 0 || window.WorkspacesState.tasks.every(t => t.project_id !== prjId)) {
        window.WorkspacesState.tasks = [...(DEFAULT_FALLBACK_TASKS[prjId] || DEFAULT_FALLBACK_TASKS.prj_dentaquik || [])];
      }
    }
  } catch (err) {
    console.warn('Operating in offline-first mode for tasks:', err);
    if (!window.WorkspacesState.tasks || window.WorkspacesState.tasks.length === 0 || window.WorkspacesState.tasks.every(t => t.project_id !== prjId)) {
      window.WorkspacesState.tasks = [...(DEFAULT_FALLBACK_TASKS[prjId] || DEFAULT_FALLBACK_TASKS.prj_dentaquik || [])];
    }
  }

  if (window.WorkspacesState.activeTool === 'kanban') {
    renderKanbanColumns();
  } else {
    renderTaskListView();
  }
}

function renderKanbanColumns() {
  const columns = [
    { id: 'TODO', title: 'To Do', color: '#64748b' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: '#06b6d4' },
    { id: 'REVIEW', title: 'Review', color: '#f59e0b' },
    { id: 'DONE', title: 'Done', color: '#10b981' }
  ];

  columns.forEach(col => {
    const container = document.getElementById(`kanban-col-${col.id.toLowerCase()}`);
    const countBadge = document.getElementById(`kanban-count-${col.id.toLowerCase()}`);
    if (!container) return;

    const colTasks = window.WorkspacesState.tasks.filter(t => t.status === col.id);
    if (countBadge) countBadge.innerText = colTasks.length;

    container.innerHTML = colTasks.map(t => `
      <div class="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 cursor-grab transition-all shadow-md group relative"
           draggable="true"
           ondragstart="handleKanbanDragStart(event, '${t.task_id}')"
           onclick="openTaskDetailsModal('${t.task_id}')">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[10px] font-mono px-2 py-0.5 rounded-md ${t.priority === 'HIGH' || t.priority === 'URGENT' ? 'bg-rose-950/60 text-rose-400 border border-rose-800/40' : 'bg-slate-800 text-slate-400'}">${t.priority}</span>
          ${t.due_date ? `<span class="text-[10px] text-slate-400 font-mono">📅 ${t.due_date}</span>` : ''}
        </div>
        <h4 class="text-xs font-bold text-slate-100 group-hover:text-cyan-400 transition-colors mb-2">${escapeHtml(t.title)}</h4>
        
        ${t.subtasks && t.subtasks.length > 0 ? `
          <div class="flex items-center gap-1.5 text-[10px] text-slate-400 mb-2">
            <i data-lucide="check-square" class="w-3 h-3 text-cyan-400"></i>
            <span>${t.subtasks.filter(st => st.completed).length}/${t.subtasks.length} subtasks</span>
          </div>
        ` : ''}

        <div class="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[10px] text-slate-500">
          <span>Pos: <code class="text-cyan-400 font-mono">${(t.position || '').substring(0, 8)}</code></span>
          <span class="text-slate-400 font-mono">${t.duration_minutes || 30}m</span>
        </div>
      </div>
    `).join('');
  });

  if (window.lucide) window.lucide.createIcons();
}

function handleKanbanDragStart(event, taskId) {
  window.WorkspacesState.draggedTaskId = taskId;
  event.dataTransfer.setData('text/plain', taskId);
}

function handleKanbanDragOver(event) {
  event.preventDefault();
}

async function handleKanbanDrop(event, targetStatus) {
  event.preventDefault();
  const taskId = window.WorkspacesState.draggedTaskId || event.dataTransfer.getData('text/plain');
  if (!taskId) return;

  const targetTask = window.WorkspacesState.tasks.find(t => t.task_id === taskId);
  if (targetTask) {
    targetTask.status = targetStatus;
    targetTask.position = '0|' + Date.now().toString(36);
  }
  renderKanbanColumns();

  const wsId = window.WorkspacesState.currentWorkspaceId || 'ws_iceberg_master';
  const colTasks = window.WorkspacesState.tasks.filter(t => t.status === targetStatus);
  const lastTask = colTasks[colTasks.length - 1];

  try {
    await fetch(`/api/iams/workspaces/${wsId}/tasks/${taskId}/reorder`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      },
      body: JSON.stringify({
        prev_position: lastTask ? lastTask.position : null,
        next_position: null,
        target_status: targetStatus
      })
    });
  } catch (err) {
    console.warn('Reorder server notice (local update retained):', err);
  }
}

// Quick Add Task
async function createQuickTask(e) {
  if (e) e.preventDefault();
  const titleInput = document.getElementById('new-task-title');
  if (!titleInput || !titleInput.value.trim()) return;

  const wsId = window.WorkspacesState.currentWorkspaceId || 'ws_iceberg_master';
  const prjId = window.WorkspacesState.currentProjectId || 'prj_dentaquik';
  const title = titleInput.value.trim();

  // Optimistic local add
  const newTask = {
    task_id: 'task_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    project_id: prjId,
    workspace_id: wsId,
    title,
    priority: 'MEDIUM',
    status: 'TODO',
    duration_minutes: 30,
    due_date: new Date().toISOString().split('T')[0],
    position: '0|' + Date.now().toString(36),
    subtasks: []
  };
  window.WorkspacesState.tasks.push(newTask);
  titleInput.value = '';

  if (window.WorkspacesState.activeTool === 'kanban') {
    renderKanbanColumns();
  } else {
    renderTaskListView();
  }

  try {
    await fetch(`/api/iams/workspaces/${wsId}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      },
      body: JSON.stringify({
        project_id: prjId,
        title,
        priority: 'MEDIUM',
        status: 'TODO'
      })
    });
  } catch (err) {
    console.warn('Task server sync notice (saved locally):', err);
  }
}

// ==========================================
// 2. ASYNC MESSAGES (BASECAMP STYLE)
// ==========================================

async function loadProjectMessages() {
  const wsId = window.WorkspacesState.currentWorkspaceId;
  const prjId = window.WorkspacesState.currentProjectId;

  try {
    const res = await fetch(`/api/iams/messages?project_id=${prjId}`, {
      headers: {
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      }
    });
    if (res.ok) {
      const result = await res.json();
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        window.WorkspacesState.topics = result.data;
      } else {
        window.WorkspacesState.topics = [...DEFAULT_FALLBACK_TOPICS];
      }
    } else {
      window.WorkspacesState.topics = [...DEFAULT_FALLBACK_TOPICS];
    }
  } catch (err) {
    console.warn('Using offline fallback topics:', err);
    window.WorkspacesState.topics = [...DEFAULT_FALLBACK_TOPICS];
  }
  renderMessagesTopicList();
}

function renderMessagesTopicList() {
  const container = document.getElementById('upbase-messages-list');
  if (!container) return;

  const topics = window.WorkspacesState.topics;
  if (topics.length === 0) {
    container.innerHTML = `<div class="text-xs text-slate-500 py-6 text-center">No discussion topics posted yet. Start an async conversation!</div>`;
    return;
  }

  container.innerHTML = topics.map(top => `
    <div onclick="openTopicThreadModal('${top.topic_id}')" class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all">
      <div class="flex items-center justify-between mb-2">
        <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">${top.category}</span>
        <span class="text-[10px] text-slate-400 font-mono">${new Date(top.last_activity_at).toLocaleDateString()}</span>
      </div>
      <h3 class="text-sm font-bold text-white mb-2 flex items-center gap-2">
        ${top.is_pinned ? '📌 ' : ''}${escapeHtml(top.title)}
      </h3>
      <div class="text-xs text-slate-400 line-clamp-2 mb-3">
        ${escapeHtml(top.content_html.replace(/<[^>]*>?/gm, ''))}
      </div>
      <div class="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-800/60">
        <span class="text-slate-300 font-medium">By ${escapeHtml(top.author?.full_name || 'Team')}</span>
        <span class="text-cyan-400 font-semibold flex items-center gap-1">
          <i data-lucide="message-square" class="w-3.5 h-3.5"></i> ${top.replies_count || 0} replies
        </span>
      </div>
    </div>
  `).join('');

  if (window.lucide) window.lucide.createIcons();
}

// Post new async message topic
async function postNewTopic(e) {
  if (e) e.preventDefault();
  const title = document.getElementById('new-topic-title')?.value;
  const content = document.getElementById('new-topic-content')?.value;
  const category = document.getElementById('new-topic-category')?.value || 'GENERAL';

  if (!title || !content) return;

  const wsId = window.WorkspacesState.currentWorkspaceId;
  const prjId = window.WorkspacesState.currentProjectId;

  try {
    const res = await fetch('/api/iams/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      },
      body: JSON.stringify({
        project_id: prjId,
        title,
        content_html: `<p>${escapeHtml(content).replace(/\n/g, '<br>')}</p>`,
        category
      })
    });
    const result = await res.json();
    if (result.success) {
      document.getElementById('new-topic-title').value = '';
      document.getElementById('new-topic-content').value = '';
      closeAllModals();
      await loadProjectMessages();
    }
  } catch (err) {
    console.error('Failed to post topic:', err);
  }
}

// ==========================================
// 3. COLLABORATIVE RICH-TEXT DOCS
// ==========================================

async function loadProjectDocs() {
  const wsId = window.WorkspacesState.currentWorkspaceId;
  const prjId = window.WorkspacesState.currentProjectId;

  try {
    const res = await fetch(`/api/iams/docs?project_id=${prjId}`, {
      headers: {
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      }
    });
    if (res.ok) {
      const result = await res.json();
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        window.WorkspacesState.docs = result.data;
      } else {
        window.WorkspacesState.docs = [...DEFAULT_FALLBACK_DOCS];
      }
    } else {
      window.WorkspacesState.docs = [...DEFAULT_FALLBACK_DOCS];
    }
  } catch (err) {
    console.warn('Using offline fallback docs:', err);
    window.WorkspacesState.docs = [...DEFAULT_FALLBACK_DOCS];
  }
  renderDocsGrid();
}

function renderDocsGrid() {
  const container = document.getElementById('upbase-docs-grid');
  if (!container) return;

  const docs = window.WorkspacesState.docs;
  if (docs.length === 0) {
    container.innerHTML = `<div class="text-xs text-slate-500 py-6 text-center col-span-full">No wiki docs created for this project yet.</div>`;
    return;
  }

  container.innerHTML = docs.map(d => `
    <div onclick="openDocEditorModal('${d.doc_id}')" class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all shadow-md group">
      <div class="flex items-center justify-between mb-3">
        <div class="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
          <i data-lucide="file-text" class="w-4 h-4"></i>
        </div>
        <span class="text-[10px] text-slate-500 font-mono">v${d.current_version}</span>
      </div>
      <h3 class="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors mb-2">${escapeHtml(d.title)}</h3>
      <div class="text-xs text-slate-400 line-clamp-2 mb-4">
        ${escapeHtml(d.content_html ? d.content_html.replace(/<[^>]*>?/gm, '') : 'Structured documentation')}
      </div>
      <div class="flex items-center justify-between text-[10px] text-slate-500 pt-3 border-t border-slate-800/60">
        <span>By ${escapeHtml(d.last_edited_by || 'Team')}</span>
        <span>${new Date(d.updated_at).toLocaleDateString()}</span>
      </div>
    </div>
  `).join('');

  if (window.lucide) window.lucide.createIcons();
}

// Create new rich document
async function createNewDoc() {
  const title = prompt('Enter document title:');
  if (!title) return;

  const wsId = window.WorkspacesState.currentWorkspaceId;
  const prjId = window.WorkspacesState.currentProjectId;

  try {
    const res = await fetch('/api/iams/docs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      },
      body: JSON.stringify({
        project_id: prjId,
        title,
        content_html: '<h2>Project Wiki & Architecture</h2><p>Document technical specs, client guidelines, or sprint notes here...</p>'
      })
    });
    const result = await res.json();
    if (result.success) {
      await loadProjectDocs();
      openDocEditorModal(result.data.doc_id);
    }
  } catch (e) {
    console.error('Failed to create doc:', e);
  }
}

// Open and edit document
async function openDocEditorModal(docId) {
  try {
    const res = await fetch(`/api/iams/docs/${docId}`, {
      headers: {
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      }
    });
    const result = await res.json();
    if (result.success) {
      window.WorkspacesState.activeDoc = result.data;
      const modal = document.getElementById('upbase-doc-modal');
      const titleInput = document.getElementById('doc-editor-title');
      const bodyInput = document.getElementById('doc-editor-body');
      const versionList = document.getElementById('doc-version-history');

      if (titleInput) titleInput.value = result.data.title;
      if (bodyInput) bodyInput.value = result.data.content_html;

      if (versionList && result.data.version_history) {
        versionList.innerHTML = result.data.version_history.map(v => `
          <div class="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <div>
              <span class="font-bold text-cyan-400 font-mono">v${v.version_number}</span>
              <span class="text-slate-400 text-[10px] ml-2">${new Date(v.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            <button onclick="restoreDocVersion('${docId}', ${v.version_number})" class="text-[10px] text-emerald-400 hover:underline">Restore</button>
          </div>
        `).join('');
      }

      if (modal) modal.classList.remove('hidden');
    }
  } catch (err) {
    console.error('Failed to open doc modal:', err);
  }
}

// Save document changes
async function saveDocChanges() {
  const doc = window.WorkspacesState.activeDoc;
  if (!doc) return;

  const title = document.getElementById('doc-editor-title')?.value;
  const content_html = document.getElementById('doc-editor-body')?.value;

  try {
    const res = await fetch(`/api/iams/docs/${doc.doc_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      },
      body: JSON.stringify({
        title,
        content_html,
        create_snapshot: true
      })
    });
    const result = await res.json();
    if (result.success) {
      alert('Document and version snapshot saved!');
      closeAllModals();
      await loadProjectDocs();
    }
  } catch (e) {
    console.error('Failed to save doc:', e);
  }
}

// Restore previous doc version
async function restoreDocVersion(docId, versionNumber) {
  try {
    const res = await fetch(`/api/iams/docs/${docId}/restore/${versionNumber}`, {
      method: 'POST',
      headers: {
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      }
    });
    const result = await res.json();
    if (result.success) {
      alert(`Restored version ${versionNumber}`);
      await openDocEditorModal(docId);
      await loadProjectDocs();
    }
  } catch (e) {
    console.error('Failed to restore doc:', e);
  }
}

// ==========================================
// 4. BOOKMARKS & OPENGRAPH PREVIEW
// ==========================================

async function loadProjectBookmarks() {
  const wsId = window.WorkspacesState.currentWorkspaceId;
  const prjId = window.WorkspacesState.currentProjectId;

  try {
    const res = await fetch(`/api/iams/bookmarks?project_id=${prjId}`, {
      headers: {
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      }
    });
    if (res.ok) {
      const result = await res.json();
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        window.WorkspacesState.bookmarks = result.data;
      } else {
        window.WorkspacesState.bookmarks = [...DEFAULT_FALLBACK_BOOKMARKS];
      }
    } else {
      window.WorkspacesState.bookmarks = [...DEFAULT_FALLBACK_BOOKMARKS];
    }
  } catch (err) {
    console.warn('Using offline fallback bookmarks:', err);
    window.WorkspacesState.bookmarks = [...DEFAULT_FALLBACK_BOOKMARKS];
  }
  renderBookmarksGrid();
}

function renderBookmarksGrid() {
  const container = document.getElementById('upbase-bookmarks-grid');
  if (!container) return;

  const bmarks = window.WorkspacesState.bookmarks;
  if (bmarks.length === 0) {
    container.innerHTML = `<div class="text-xs text-slate-500 py-6 text-center col-span-full">No bookmarked links yet. Add your Figma, GitHub, or client resource links!</div>`;
    return;
  }

  container.innerHTML = bmarks.map(b => `
    <a href="${escapeHtml(b.url)}" target="_blank" rel="noopener noreferrer" class="block p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 transition-all shadow-md group">
      ${b.image_url ? `
        <div class="h-28 w-full rounded-xl overflow-hidden mb-3 bg-slate-950">
          <img src="${escapeHtml(b.image_url)}" alt="Preview" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
        </div>
      ` : ''}
      <div class="flex items-center gap-2 mb-1.5">
        ${b.favicon_url ? `<img src="${escapeHtml(b.favicon_url)}" class="w-4 h-4 rounded-sm" onerror="this.style.display='none'">` : '<i data-lucide="globe" class="w-4 h-4 text-cyan-400"></i>'}
        <span class="text-[10px] text-cyan-400 font-mono truncate">${escapeHtml(b.domain || b.url)}</span>
      </div>
      <h4 class="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-1 mb-1">${escapeHtml(b.title)}</h4>
      <p class="text-[11px] text-slate-400 line-clamp-2 mb-2">${escapeHtml(b.description || '')}</p>
    </a>
  `).join('');

  if (window.lucide) window.lucide.createIcons();
}

// Add Bookmark
async function addProjectBookmark(e) {
  if (e) e.preventDefault();
  const url = document.getElementById('new-bookmark-url')?.value;
  const title = document.getElementById('new-bookmark-title')?.value;
  if (!url) return;

  const wsId = window.WorkspacesState.currentWorkspaceId;
  const prjId = window.WorkspacesState.currentProjectId;

  try {
    const res = await fetch('/api/iams/bookmarks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      },
      body: JSON.stringify({
        project_id: prjId,
        url,
        title: title || undefined
      })
    });
    const result = await res.json();
    if (result.success) {
      document.getElementById('new-bookmark-url').value = '';
      closeAllModals();
      await loadProjectBookmarks();
    }
  } catch (err) {
    console.error('Failed to add bookmark:', err);
  }
}

// ==========================================
// 5. REAL-TIME CHAT STREAM
// ==========================================

async function loadProjectChat() {
  const wsId = window.WorkspacesState.currentWorkspaceId;
  const prjId = window.WorkspacesState.currentProjectId;

  try {
    const res = await fetch(`/api/iams/chat/messages?project_id=${prjId}`, {
      headers: {
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      }
    });
    if (res.ok) {
      const result = await res.json();
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        window.WorkspacesState.chatMessages = result.data;
      } else {
        window.WorkspacesState.chatMessages = [...DEFAULT_FALLBACK_CHAT];
      }
    } else {
      window.WorkspacesState.chatMessages = [...DEFAULT_FALLBACK_CHAT];
    }
  } catch (e) {
    console.warn('Using offline fallback chat messages:', e);
    window.WorkspacesState.chatMessages = [...DEFAULT_FALLBACK_CHAT];
  }
  renderChatStream();
}

function renderChatStream() {
  const container = document.getElementById('upbase-chat-stream');
  if (!container) return;

  const msgs = window.WorkspacesState.chatMessages;
  if (msgs.length === 0) {
    container.innerHTML = `<div class="text-xs text-slate-500 py-6 text-center">No chat messages yet in this project channel.</div>`;
    return;
  }

  container.innerHTML = msgs.map(m => `
    <div class="flex items-start gap-3 group">
      <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm">
        ${escapeHtml(m.sender?.full_name ? m.sender.full_name.substring(0, 2).toUpperCase() : 'US')}
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-xs font-bold text-slate-200">${escapeHtml(m.sender?.full_name || 'Team Member')}</span>
          <span class="text-[10px] text-slate-500 font-mono">${new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        </div>
        <div class="text-xs text-slate-300 bg-slate-900/80 p-3 rounded-2xl border border-slate-800/80 inline-block max-w-xl">
          ${escapeHtml(m.text)}
        </div>
        <div class="flex items-center gap-1.5 mt-1.5">
          ${m.reactions && m.reactions.length > 0 ? m.reactions.map(r => `
            <button onclick="reactToChatMessage('${m.message_id}', '${r.emoji}')" class="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-[11px] font-medium text-slate-300 hover:border-cyan-400">
              ${r.emoji} ${r.count}
            </button>
          `).join('') : ''}
          <button onclick="reactToChatMessage('${m.message_id}', '👍')" class="opacity-0 group-hover:opacity-100 px-1.5 py-0.5 rounded text-[11px] text-slate-400 hover:text-cyan-400">👍</button>
          <button onclick="reactToChatMessage('${m.message_id}', '🚀')" class="opacity-0 group-hover:opacity-100 px-1.5 py-0.5 rounded text-[11px] text-slate-400 hover:text-cyan-400">🚀</button>
          <button onclick="reactToChatMessage('${m.message_id}', '❤️')" class="opacity-0 group-hover:opacity-100 px-1.5 py-0.5 rounded text-[11px] text-slate-400 hover:text-cyan-400">❤️</button>
        </div>
      </div>
    </div>
  `).join('');

  container.scrollTop = container.scrollHeight;
}

// Send chat message
async function sendChatMessage(e) {
  if (e) e.preventDefault();
  const input = document.getElementById('chat-input-text');
  if (!input || !input.value.trim()) return;

  const wsId = window.WorkspacesState.currentWorkspaceId;
  const prjId = window.WorkspacesState.currentProjectId;

  try {
    const res = await fetch('/api/iams/chat/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      },
      body: JSON.stringify({
        project_id: prjId,
        text: input.value.trim()
      })
    });
    const result = await res.json();
    if (result.success) {
      input.value = '';
      window.WorkspacesState.chatMessages.push(result.data);
      renderChatStream();
    }
  } catch (err) {
    console.error('Failed to send message:', err);
  }
}

// React to chat message
async function reactToChatMessage(msgId, emoji) {
  try {
    const res = await fetch(`/api/iams/chat/messages/${msgId}/react`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      },
      body: JSON.stringify({ emoji })
    });
    const result = await res.json();
    if (result.success) {
      await loadProjectChat();
    }
  } catch (e) {
    console.error('Failed to react:', e);
  }
}

// ==========================================
// CREATE PROJECT MODAL & ENGINE
// ==========================================

// Open Create Project Modal
async function openCreateProjectModal() {
  const modal = document.getElementById('upbase-create-project-modal');
  const overlay = document.getElementById('modal-overlay');
  if (!modal) return;

  // Reset inputs
  const nameInput = document.getElementById('upbase-new-proj-name');
  if (nameInput) nameInput.value = '';

  const descInput = document.getElementById('upbase-new-proj-desc');
  if (descInput) descInput.value = '';

  const cmsLinkSelect = document.getElementById('upbase-new-proj-link-cms');
  if (cmsLinkSelect) cmsLinkSelect.value = '';

  const categorySelect = document.getElementById('upbase-new-proj-category');
  if (categorySelect) categorySelect.value = 'branding';

  const syncCmsCheck = document.getElementById('upbase-new-proj-sync-cms');
  if (syncCmsCheck) syncCmsCheck.checked = false;

  // Reset color radio to cyan
  const defaultColor = document.querySelector('input[name="proj_color"][value="#06b6d4"]');
  if (defaultColor) defaultColor.checked = true;

  // Reset icon
  const iconSelect = document.getElementById('upbase-new-proj-icon');
  if (iconSelect) iconSelect.value = 'briefcase';

  // Check all tools by default
  ['tool-opt-kanban', 'tool-opt-tasks', 'tool-opt-messages', 'tool-opt-docs', 'tool-opt-bookmarks', 'tool-opt-chat'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.checked = true;
  });

  // Populate existing agency portfolio projects & clients
  await populateCMSProjectsOptions();
  await populateClientOptions();

  if (overlay) overlay.classList.remove('hidden');
  modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();

  if (nameInput) setTimeout(() => nameInput.focus(), 60);
}

// Populate CMS Projects dropdown so user can link or align their workspace project
async function populateCMSProjectsOptions() {
  const select = document.getElementById('upbase-new-proj-link-cms');
  if (!select) return;

  try {
    const token = sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '';
    const res = await fetch('/api/projects?status=all&limit=100', {
      headers: {
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${token}`
      }
    });
    const result = await res.json();
    if (result.success && Array.isArray(result.data)) {
      window.WorkspacesState.cmsProjects = result.data;
      
      select.innerHTML = '<option value="">-- Create Custom Project or Pick Existing Portfolio --</option>' +
        result.data.map(p => {
          const title = typeof p.title === 'object' ? (p.title.en || p.title.ar || 'Project') : (p.title || 'Project');
          const client = p.client ? ` [${p.client}]` : '';
          const category = p.category ? ` (${p.category})` : '';
          return `<option value="${p._id}">${escapeHtml(title + client + category)}</option>`;
        }).join('');
    }
  } catch (err) {
    console.warn('Could not prefetch CMS projects for modal:', err);
  }
}

// When user selects an existing CMS portfolio project, auto-fill fields
function onSelectExistingCMSProject(cmsId) {
  if (!cmsId || !window.WorkspacesState.cmsProjects) return;
  const project = window.WorkspacesState.cmsProjects.find(p => String(p._id) === String(cmsId));
  if (!project) return;

  const title = typeof project.title === 'object' ? (project.title.en || project.title.ar || '') : (project.title || '');
  const desc = typeof project.description === 'object' ? (project.description.en || project.description.ar || '') : (project.description || '');

  const nameInput = document.getElementById('upbase-new-proj-name');
  if (nameInput && title) nameInput.value = title;

  const descInput = document.getElementById('upbase-new-proj-desc');
  if (descInput && desc) descInput.value = desc;

  // Match or add client option
  const clientSelect = document.getElementById('upbase-new-proj-client');
  if (clientSelect && project.client) {
    let found = false;
    for (let opt of clientSelect.options) {
      if (opt.value.toLowerCase() === project.client.toLowerCase() || opt.text.toLowerCase().includes(project.client.toLowerCase())) {
        clientSelect.value = opt.value;
        found = true;
        break;
      }
    }
    if (!found) {
      const opt = document.createElement('option');
      opt.value = project.client;
      opt.textContent = project.client;
      clientSelect.appendChild(opt);
      clientSelect.value = project.client;
    }
  }

  // Category
  const categorySelect = document.getElementById('upbase-new-proj-category');
  if (categorySelect && project.category) {
    categorySelect.value = project.category;
  }

  // Select harmonious theme color & icon based on category
  const categoryColors = {
    'branding': '#8b5cf6', // purple
    'web-development': '#06b6d4', // cyan
    'social-media': '#ec4899', // pink
    'seo': '#10b981', // emerald
    'video-photography': '#f59e0b', // amber
    'omnichannel': '#06b6d4'
  };

  const targetColor = categoryColors[project.category] || '#06b6d4';
  const colorRadio = document.querySelector(`input[name="proj_color"][value="${targetColor}"]`);
  if (colorRadio) colorRadio.checked = true;

  const iconSelect = document.getElementById('upbase-new-proj-icon');
  if (iconSelect) {
    if (project.category === 'branding') iconSelect.value = 'sparkles';
    else if (project.category === 'web-development') iconSelect.value = 'rocket';
    else if (project.category === 'video-photography') iconSelect.value = 'disc';
    else iconSelect.value = 'briefcase';
  }

  // Auto-check sync checkbox since it is tied to an existing project
  const syncCheck = document.getElementById('upbase-new-proj-sync-cms');
  if (syncCheck) syncCheck.checked = true;
}

// Populate Client options dynamically
async function populateClientOptions() {
  const select = document.getElementById('upbase-new-proj-client');
  if (!select) return;

  try {
    const token = sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '';
    const res = await fetch('/api/iams/clients?limit=100', {
      headers: {
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${token}`
      }
    });
    const result = await res.json();
    const existingValues = new Set(Array.from(select.options).map(o => o.value.toLowerCase()));

    // Add clients from IAMS Clients table
    if (result.success && Array.isArray(result.clients)) {
      result.clients.forEach(c => {
        const clientName = c.name || c.company_name;
        if (clientName && !existingValues.has(clientName.toLowerCase())) {
          const opt = document.createElement('option');
          opt.value = clientName;
          opt.textContent = clientName;
          select.appendChild(opt);
          existingValues.add(clientName.toLowerCase());
        }
      });
    }

    // Add clients from CMS Projects list
    if (window.WorkspacesState.cmsProjects) {
      window.WorkspacesState.cmsProjects.forEach(p => {
        if (p.client && !existingValues.has(p.client.toLowerCase())) {
          const opt = document.createElement('option');
          opt.value = p.client;
          opt.textContent = p.client;
          select.appendChild(opt);
          existingValues.add(p.client.toLowerCase());
        }
      });
    }
  } catch (err) {
    // Non-critical: defaults in HTML will be used
  }
}

// Handle Create Project Form Submission
async function handleCreateProjectSubmit(e) {
  if (e) e.preventDefault();

  const nameInput = document.getElementById('upbase-new-proj-name');
  const descInput = document.getElementById('upbase-new-proj-desc');
  const clientSelect = document.getElementById('upbase-new-proj-client');
  const categorySelect = document.getElementById('upbase-new-proj-category');
  const cmsLinkSelect = document.getElementById('upbase-new-proj-link-cms');
  const syncCmsCheck = document.getElementById('upbase-new-proj-sync-cms');
  const iconSelect = document.getElementById('upbase-new-proj-icon');
  const colorRadio = document.querySelector('input[name="proj_color"]:checked');
  const submitBtn = document.getElementById('upbase-create-proj-submit-btn');

  const name = nameInput ? nameInput.value.trim() : '';
  if (!name) {
    if (typeof showNotification === 'function') showNotification('Please enter a project space name', 'error');
    else alert('Please enter a project space name');
    return;
  }

  const wsId = window.WorkspacesState.currentWorkspaceId;
  if (!wsId) {
    if (typeof showNotification === 'function') showNotification('No active workspace selected. Please select a workspace first.', 'error');
    return;
  }

  const enabledTools = {
    kanban: !!document.getElementById('tool-opt-kanban')?.checked,
    tasks: !!document.getElementById('tool-opt-tasks')?.checked,
    messages: !!document.getElementById('tool-opt-messages')?.checked,
    docs: !!document.getElementById('tool-opt-docs')?.checked,
    bookmarks: !!document.getElementById('tool-opt-bookmarks')?.checked,
    chat: !!document.getElementById('tool-opt-chat')?.checked,
    calendar: true,
    files: true
  };

  const clientVal = clientSelect && clientSelect.value ? clientSelect.value : null;
  const categoryVal = categorySelect ? categorySelect.value : 'branding';
  let cmsProjectId = cmsLinkSelect && cmsLinkSelect.value ? cmsLinkSelect.value : null;

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="inline-block animate-spin mr-1.5">&#9696;</span> Creating...`;
  }

  const token = sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '';

  // Optional: Also sync/publish as public CMS portfolio project if requested and not linked yet
  if (syncCmsCheck && syncCmsCheck.checked && !cmsProjectId) {
    try {
      const cmsRes = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: { en: name, ar: name },
          slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36),
          description: { en: descInput ? descInput.value.trim() : name, ar: descInput ? descInput.value.trim() : name },
          category: categoryVal,
          client: clientVal || 'Iceberg Agency',
          status: 'published'
        })
      });
      const cmsResult = await cmsRes.json();
      if (cmsResult.success && cmsResult.data) {
        cmsProjectId = cmsResult.data._id;
        if (typeof loadProjects === 'function') loadProjects();
      }
    } catch (err) {
      console.warn('CMS Portfolio project auto-sync notice:', err);
    }
  }

  const payload = {
    name,
    description: descInput ? descInput.value.trim() : '',
    color: colorRadio ? colorRadio.value : '#06b6d4',
    icon: iconSelect ? iconSelect.value : 'folder',
    client_id: clientVal,
    category: categoryVal,
    cms_project_id: cmsProjectId,
    enabled_tools: enabledTools
  };

  let createdProject = null;
  try {
    const res = await fetch(`/api/iams/workspaces/${wsId}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const result = await res.json();
      if (result.success && result.data) {
        createdProject = result.data;
      }
    }
  } catch (err) {
    console.warn('Project creation server sync notice (creating locally):', err);
  }

  if (!createdProject) {
    createdProject = {
      project_id: 'prj_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      workspace_id: wsId,
      name: payload.name,
      description: payload.description,
      color: payload.color,
      icon: payload.icon,
      category: payload.category,
      client_id: payload.client_id,
      cms_project_id: payload.cms_project_id,
      enabled_tools: payload.enabled_tools
    };
  }

  if (!window.WorkspacesState.projects.some(p => p.project_id === createdProject.project_id)) {
    window.WorkspacesState.projects.push(createdProject);
  }

  if (typeof closeAllModals === 'function') {
    closeAllModals();
  } else {
    document.getElementById('upbase-create-project-modal')?.classList.add('hidden');
    document.getElementById('modal-overlay')?.classList.add('hidden');
  }

  if (typeof showNotification === 'function') {
    showNotification(`Project "${createdProject.name}" created and aligned with agency portfolio!`, 'success');
  }

  renderProjectsSidebar();
  await selectProject(createdProject.project_id);

  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<i data-lucide="plus" class="w-4 h-4"></i> Create Project Space`;
    if (window.lucide) window.lucide.createIcons();
  }
}

// Helper escape
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

window.initUpbaseWorkspaces = initUpbaseWorkspaces;
window.switchWorkspace = switchWorkspace;
window.selectProject = selectProject;
window.switchProjectTool = switchProjectTool;
window.handleKanbanDragStart = handleKanbanDragStart;
window.handleKanbanDragOver = handleKanbanDragOver;
window.handleKanbanDrop = handleKanbanDrop;
window.createQuickTask = createQuickTask;
window.postNewTopic = postNewTopic;
window.createNewDoc = createNewDoc;
window.openDocEditorModal = openDocEditorModal;
window.saveDocChanges = saveDocChanges;
window.restoreDocVersion = restoreDocVersion;
window.addProjectBookmark = addProjectBookmark;
window.sendChatMessage = sendChatMessage;
window.reactToChatMessage = reactToChatMessage;
window.openCreateProjectModal = openCreateProjectModal;
window.onSelectExistingCMSProject = onSelectExistingCMSProject;
window.handleCreateProjectSubmit = handleCreateProjectSubmit;

// Auto-initialize immediately on script load so UI is instant and never hangs on "Loading..."
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initUpbaseWorkspaces();
    });
  } else {
    initUpbaseWorkspaces();
  }
}

