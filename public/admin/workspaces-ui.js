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

// Initialize Upbase Workspaces Suite
async function initUpbaseWorkspaces() {
  await loadWorkspacesList();
}

// Load Workspaces list
async function loadWorkspacesList() {
  try {
    const res = await fetch('/api/iams/workspaces', {
      headers: {
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    });
    const result = await res.json();
    if (result.success && result.data.length > 0) {
      window.WorkspacesState.workspaces = result.data;
      if (!window.WorkspacesState.currentWorkspaceId) {
        window.WorkspacesState.currentWorkspaceId = result.data[0].workspace_id;
      }
      renderWorkspaceSelector();
      await loadWorkspaceProjects();
    } else {
      // Create initial starter workspace if none exists
      await createInitialDefaultWorkspace();
    }
  } catch (err) {
    console.error('Failed to load workspaces:', err);
  }
}

async function createInitialDefaultWorkspace() {
  try {
    const res = await fetch('/api/iams/workspaces', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: JSON.stringify({
        name: 'ICEBERG Master Workspace',
        description: 'Primary agency workspace for client sprints and internal delivery'
      })
    });
    const result = await res.json();
    if (result.success) {
      window.WorkspacesState.currentWorkspaceId = result.data.workspace_id;
      await loadWorkspacesList();
    }
  } catch (e) {
    console.error('Failed to create default workspace:', e);
  }
}

// Render Workspace Selector dropdown
function renderWorkspaceSelector() {
  const select = document.getElementById('upbase-workspace-select');
  if (!select) return;

  select.innerHTML = window.WorkspacesState.workspaces.map(ws => `
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
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    });
    const result = await res.json();
    if (result.success) {
      window.WorkspacesState.projects = result.data;
      if (!window.WorkspacesState.currentProjectId && result.data.length > 0) {
        window.WorkspacesState.currentProjectId = result.data[0].project_id;
      }
      renderProjectsSidebar();
      renderActiveProjectTools();
    }
  } catch (err) {
    console.error('Failed to load workspace projects:', err);
  }
}

// Render Projects in sidebar list
function renderProjectsSidebar() {
  const container = document.getElementById('upbase-projects-list');
  if (!container) return;

  const projects = window.WorkspacesState.projects;
  if (projects.length === 0) {
    container.innerHTML = `<div class="text-xs text-slate-500 py-3 text-center">No project lists created yet.</div>`;
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
  const wsId = window.WorkspacesState.currentWorkspaceId;
  const prjId = window.WorkspacesState.currentProjectId;
  try {
    const res = await fetch(`/api/iams/workspaces/${wsId}/tasks?project_id=${prjId}`, {
      headers: {
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    });
    const result = await res.json();
    if (result.success) {
      window.WorkspacesState.tasks = result.data;
      if (window.WorkspacesState.activeTool === 'kanban') {
        renderKanbanColumns();
      } else {
        renderTaskListView();
      }
    }
  } catch (err) {
    console.error('Failed to load tasks:', err);
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

  const wsId = window.WorkspacesState.currentWorkspaceId;
  const colTasks = window.WorkspacesState.tasks.filter(t => t.status === targetStatus);
  const lastTask = colTasks[colTasks.length - 1];

  try {
    const res = await fetch(`/api/iams/workspaces/${wsId}/tasks/${taskId}/reorder`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: JSON.stringify({
        prev_position: lastTask ? lastTask.position : null,
        next_position: null,
        target_status: targetStatus
      })
    });
    const result = await res.json();
    if (result.success) {
      await loadWorkspaceTasks();
    }
  } catch (err) {
    console.error('Failed to reorder task:', err);
  }
}

// Quick Add Task
async function createQuickTask(e) {
  if (e) e.preventDefault();
  const titleInput = document.getElementById('new-task-title');
  if (!titleInput || !titleInput.value.trim()) return;

  const wsId = window.WorkspacesState.currentWorkspaceId;
  const prjId = window.WorkspacesState.currentProjectId;

  try {
    const res = await fetch(`/api/iams/workspaces/${wsId}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: JSON.stringify({
        project_id: prjId,
        title: titleInput.value.trim(),
        priority: 'MEDIUM',
        status: 'TODO'
      })
    });
    const result = await res.json();
    if (result.success) {
      titleInput.value = '';
      await loadWorkspaceTasks();
    }
  } catch (err) {
    console.error('Failed to create task:', err);
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
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    });
    const result = await res.json();
    if (result.success) {
      window.WorkspacesState.topics = result.data;
      renderMessagesTopicList();
    }
  } catch (err) {
    console.error('Failed to load messages:', err);
  }
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
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
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
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    });
    const result = await res.json();
    if (result.success) {
      window.WorkspacesState.docs = result.data;
      renderDocsGrid();
    }
  } catch (err) {
    console.error('Failed to load docs:', err);
  }
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
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
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
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
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
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
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
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
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
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    });
    const result = await res.json();
    if (result.success) {
      window.WorkspacesState.bookmarks = result.data;
      renderBookmarksGrid();
    }
  } catch (err) {
    console.error('Failed to load bookmarks:', err);
  }
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
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
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
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    });
    const result = await res.json();
    if (result.success) {
      window.WorkspacesState.chatMessages = result.data;
      renderChatStream();
    }
  } catch (e) {
    console.error('Failed to load chat:', e);
  }
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
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
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
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
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
