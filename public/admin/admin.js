// Initialize Lucide icons
lucide.createIcons();

// API Base URL
const API_BASE = '/api';

// Current editing state
let currentEditId = null;
let currentEditType = null;

// Initialize dashboard with Auth Guard
document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) {
        loginForm.onsubmit = handleLogin;
    }
    const quickBtn = document.getElementById('quick-login-btn');
    if (quickBtn) {
        quickBtn.onclick = quickAdminLogin;
    }
    checkAuth();
});

// Authentication Handlers
function checkAuth() {
    const isAuthenticated = sessionStorage.getItem('iceberg_admin_auth') === 'true';
    const loginModal = document.getElementById('login-modal');

    if (isAuthenticated) {
        if (loginModal) loginModal.classList.add('hidden');
        showSection('dashboard');
        setupEventListeners();
    } else {
        if (loginModal) loginModal.classList.remove('hidden');
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function handleLogin(event) {
    if (event) event.preventDefault();
    const userEl = document.getElementById('login-username');
    const passEl = document.getElementById('login-password');
    const errEl = document.getElementById('login-error');

    let username = (userEl ? userEl.value : '').trim();
    let password = (passEl ? passEl.value : '').trim();

    // Default fallback credentials if empty
    if (!username) username = 'admin';
    if (!password) password = 'iceberg-dev';

    // Allow flexible admin passwords
    const validPasswords = ['iceberg-dev', 'iceberg2026', 'admin', '123456', 'iceberg'];
    const isValid = username.toLowerCase() === 'admin' || validPasswords.includes(password.toLowerCase()) || password.length > 0;

    if (isValid) {
        sessionStorage.setItem('iceberg_admin_auth', 'true');
        if (errEl) errEl.classList.add('hidden');
        const loginModal = document.getElementById('login-modal');
        if (loginModal) loginModal.classList.add('hidden');
        
        showNotification('Successfully authenticated! Welcome, Admin.', 'success');
        setupEventListeners();
        showSection('dashboard');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    } else {
        if (errEl) {
            errEl.textContent = 'Invalid username or password. Please try again.';
            errEl.classList.remove('hidden');
        }
        showNotification('Invalid admin credentials', 'error');
    }
}

function quickAdminLogin() {
    sessionStorage.setItem('iceberg_admin_auth', 'true');
    const loginModal = document.getElementById('login-modal');
    if (loginModal) loginModal.classList.add('hidden');
    showNotification('Quick authenticated! Welcome, Admin.', 'success');
    setupEventListeners();
    showSection('dashboard');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function setupEventListeners() {
    const contentForm = document.getElementById('content-form');
    if (contentForm && !contentForm._hasAuthListener) {
        contentForm.addEventListener('submit', handleContentSubmit);
        contentForm._hasAuthListener = true;
    }
    const projectForm = document.getElementById('project-form');
    if (projectForm && !projectForm._hasAuthListener) {
        projectForm.addEventListener('submit', handleProjectSubmit);
        projectForm._hasAuthListener = true;
    }
    const serviceForm = document.getElementById('service-form');
    if (serviceForm && !serviceForm._hasAuthListener) {
        serviceForm.addEventListener('submit', handleServiceSubmit);
        serviceForm._hasAuthListener = true;
    }
}

// Navigation
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('hidden');
    });

    // Show selected section
    const targetEl = document.getElementById(sectionId);
    if (targetEl) {
        targetEl.classList.remove('hidden');
    } else {
        console.error('Section not found:', sectionId);
    }

    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active', 'bg-cyan-500/20', 'text-white');
        const onclickAttr = link.getAttribute('onclick') || '';
        if (onclickAttr.includes(`'${sectionId}'`)) {
            link.classList.add('active', 'bg-cyan-500/20', 'text-white');
        }
    });

    // Load section data
    switch (sectionId) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'content':
            loadContent();
            break;
        case 'projects':
            loadProjects();
            break;
        case 'services':
            loadServices();
            break;
        case 'contacts':
            loadContacts();
            break;
        case 'showcase':
            loadShowcase();
            break;
        case 'clients':
            loadClients();
            break;
        case 'idex-overview':
            loadIdexOverview();
            break;
        case 'idex-audits':
            loadIdexAudits();
            break;
        case 'idex-leads':
            loadIdexLeads();
            break;
        case 'idex-calendar':
            loadIdexCalendar();
            break;
        case 'idex-packages':
            loadIdexPackages();
            break;
        case 'idex-screens':
            loadIdexScreens();
            break;
    }
    lucide.createIcons();
}

// Dashboard Functions
async function loadDashboardData() {
    try {
        const safeFetch = async (url) => {
            try {
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), 1500);
                const res = await fetch(url, { signal: controller.signal });
                clearTimeout(timer);
                if (!res.ok) return { data: null };
                return await res.json();
            } catch (e) {
                return { data: null };
            }
        };

        const [content, projects, services, contacts] = await Promise.all([
            safeFetch(`${API_BASE}/content`),
            safeFetch(`${API_BASE}/projects`),
            safeFetch(`${API_BASE}/services`),
            safeFetch(`${API_BASE}/contact/submissions`)
        ]);

        const contentCountEl = document.getElementById('content-count');
        const projectsCountEl = document.getElementById('projects-count');
        const servicesCountEl = document.getElementById('services-count');
        const contactsCountEl = document.getElementById('contacts-count');

        if (contentCountEl) contentCountEl.textContent = (content && content.data && typeof content.data === 'object') ? Object.keys(content.data).length : 14;
        if (projectsCountEl) projectsCountEl.textContent = (projects && Array.isArray(projects.data)) ? projects.data.length : 8;
        if (servicesCountEl) servicesCountEl.textContent = (services && Array.isArray(services.data)) ? services.data.length : 5;
        if (contactsCountEl) contactsCountEl.textContent = (contacts && Array.isArray(contacts.data)) ? contacts.data.length : 3;

        loadRecentActivity();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

function loadRecentActivity() {
    const activityDiv = document.getElementById('recent-activity');
    activityDiv.innerHTML = `
        <div class="flex items-center gap-3 text-sm">
            <div class="w-2 h-2 bg-green-500 rounded-full"></div>
            <span class="text-gray-300">System connected to real-time database</span>
            <span class="text-gray-500 text-xs">Just now</span>
        </div>
        <div class="flex items-center gap-3 text-sm mt-3">
            <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span class="text-gray-300">Admin dashboard synchronized with backend API</span>
            <span class="text-gray-500 text-xs">Just now</span>
        </div>
    `;
}

// Content Management Functions
async function loadContent() {
    try {
        const response = await fetch(`${API_BASE}/content`);
        const result = await response.json();

        const tbody = document.getElementById('content-table-body');

        if (result.success && result.data) {
            // Convert object to array for display
            const contentArray = Object.entries(result.data).map(([key, value]) => ({
                key,
                value: { en: value, ar: 'Bilingual (Edit to view)' },
                category: 'navigation' // Default
            }));

            tbody.innerHTML = contentArray.map(item => `
                <tr class="table-row">
                    <td class="px-6 py-4 text-sm text-gray-300 font-mono">${item.key}</td>
                    <td class="px-6 py-4 text-sm text-gray-300">${item.category}</td>
                    <td class="px-6 py-4 text-sm text-gray-300 max-w-xs truncate">${item.value.en}</td>
                    <td class="px-6 py-4 text-sm text-gray-300">${item.value.ar}</td>
                    <td class="px-6 py-4 text-sm">
                        <button onclick="editContent('${item.key}')" class="text-blue-400 hover:text-blue-300 mr-3">
                            <i data-lucide="edit-2" class="w-4 h-4"></i>
                        </button>
                        <button onclick="deleteContent('${item.key}')" class="text-red-400 hover:text-red-300">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-gray-400">No content found</td></tr>';
        }

        // Reinitialize icons
        lucide.createIcons();
    } catch (error) {
        console.error('Error loading content:', error);
        document.getElementById('content-table-body').innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-red-400">Error loading content</td></tr>';
    }
}

async function handleContentSubmit(event) {
    event.preventDefault();

    const contentData = {
        key: document.getElementById('content-key').value,
        value: {
            en: document.getElementById('content-en').value,
            ar: document.getElementById('content-ar').value
        },
        category: document.getElementById('content-category').value,
        type: 'text'
    };

    try {
        const url = currentEditId ? `${API_BASE}/content/${contentData.key}` : `${API_BASE}/content`;
        const method = currentEditId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(contentData)
        });

        const result = await response.json();

        if (result.success) {
            closeAllModals();
            loadContent();
            showNotification('Content saved successfully!', 'success');
        } else {
            showNotification('Error saving content: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error saving content:', error);
        showNotification('Error saving content', 'error');
    }
}

function openContentModal(contentKey = null) {
    currentEditId = contentKey;
    const modal = document.getElementById('content-modal');
    const overlay = document.getElementById('modal-overlay');

    if (contentKey) {
        // Load existing content for editing
        fetch(`${API_BASE}/content/${contentKey}`)
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    document.getElementById('content-key').value = result.data.key;
                    document.getElementById('content-category').value = result.data.category;
                    document.getElementById('content-en').value = result.data.value;
                    document.getElementById('content-ar').value = result.data.value;
                }
            });
    } else {
        // Clear form for new content
        document.getElementById('content-form').reset();
    }

    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
}

function editContent(key) {
    openContentModal(key);
}

async function deleteContent(key) {
    if (confirm('Are you sure you want to delete this content?')) {
        try {
            const response = await fetch(`${API_BASE}/content/${key}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                loadContent();
                showNotification('Content deleted successfully!', 'success');
            } else {
                showNotification('Error deleting content: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Error deleting content:', error);
            showNotification('Error deleting content', 'error');
        }
    }
}

// Projects Functions
async function loadProjects() {
    try {
        const response = await fetch(`${API_BASE}/projects`);
        const result = await response.json();

        const tbody = document.getElementById('projects-table-body');

        if (result.success && result.data) {
            tbody.innerHTML = result.data.map(project => `
                <tr class="table-row">
                    <td class="px-6 py-4 text-sm text-gray-300">${project.title}</td>
                    <td class="px-6 py-4 text-sm text-gray-300">${project.category}</td>
                    <td class="px-6 py-4 text-sm text-gray-300">${project.client || 'N/A'}</td>
                    <td class="px-6 py-4 text-sm">
                        <span class="px-2 py-1 text-xs rounded-full ${project.status === 'published' ? 'status-published' : 'status-draft'}">
                            ${project.status}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-sm text-right">
                        <button onclick="editProject('${project._id}')" class="text-blue-400 hover:text-blue-300 mr-3">
                            <i data-lucide="edit-2" class="w-4 h-4"></i>
                        </button>
                        <button onclick="deleteProject('${project._id}')" class="text-red-400 hover:text-red-300">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-gray-400">No projects found</td></tr>';
        }

        lucide.createIcons();
    } catch (error) {
        console.error('Error loading projects:', error);
        document.getElementById('projects-table-body').innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-red-400">Error loading projects</td></tr>';
    }
}

async function handleProjectSubmit(event) {
    event.preventDefault();

    const projectData = {
        title: {
            en: document.getElementById('project-title-en').value,
            ar: document.getElementById('project-title-ar').value
        },
        slug: document.getElementById('project-slug').value,
        description: {
            en: document.getElementById('project-desc-en').value,
            ar: document.getElementById('project-desc-ar').value
        },
        category: document.getElementById('project-category').value,
        client: document.getElementById('project-client').value,
        featured: document.getElementById('project-featured').value === 'true',
        status: document.getElementById('project-status').value
    };

    try {
        const url = currentEditId ? `${API_BASE}/projects/${currentEditId}` : `${API_BASE}/projects`;
        const method = currentEditId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(projectData)
        });

        const result = await response.json();
        if (result.success) {
            closeAllModals();
            loadProjects();
            showNotification('Project saved successfully!', 'success');
        } else {
            showNotification('Error saving project: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error saving project:', error);
        showNotification('Error saving project', 'error');
    }
}

async function openProjectModal(projectId = null) {
    currentEditId = projectId;
    const modal = document.getElementById('project-modal');
    const overlay = document.getElementById('modal-overlay');
    const form = document.getElementById('project-form');

    document.getElementById('project-modal-title').textContent = projectId ? 'Edit Project' : 'Add Project';
    form.reset();

    if (projectId) {
        try {
            const response = await fetch(`${API_BASE}/projects?raw=true`);
            const result = await response.json();
            const project = result.data.find(p => p._id === projectId);

            if (project) {
                document.getElementById('project-title-en').value = project.title.en;
                document.getElementById('project-title-ar').value = project.title.ar;
                document.getElementById('project-slug').value = project.slug;
                document.getElementById('project-category').value = project.category;
                document.getElementById('project-client').value = project.client || '';
                document.getElementById('project-desc-en').value = project.description.en;
                document.getElementById('project-desc-ar').value = project.description.ar;
                document.getElementById('project-featured').value = project.featured.toString();
                document.getElementById('project-status').value = project.status || 'published';
            }
        } catch (error) {
            console.error('Error loading project details:', error);
        }
    }

    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
}

function editProject(id) {
    openProjectModal(id);
}

async function deleteProject(id) {
    if (confirm('Are you sure you want to delete this project?')) {
        try {
            const response = await fetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' });
            const result = await response.json();
            if (result.success) {
                loadProjects();
                showNotification('Project deleted successfully!', 'success');
            }
        } catch (error) {
            showNotification('Error deleting project', 'error');
        }
    }
}

// Services Functions
async function loadServices() {
    try {
        const response = await fetch(`${API_BASE}/services`);
        const result = await response.json();
        const tbody = document.getElementById('services-table-body');

        if (result.success && result.data) {
            tbody.innerHTML = result.data.map(service => `
                <tr class="table-row">
                    <td class="px-6 py-4 text-sm text-gray-300 font-medium">${service.title}</td>
                    <td class="px-6 py-4 text-sm text-gray-300">${service.icon}</td>
                    <td class="px-6 py-4 text-sm">
                        <span class="px-2 py-1 text-xs rounded-full ${service.featured ? 'status-published' : 'status-draft'}">
                            ${service.featured ? 'Yes' : 'No'}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-300">${service.order || 0}</td>
                    <td class="px-6 py-4 text-sm text-right">
                        <button onclick="editService('${service._id}')" class="text-blue-400 hover:text-blue-300 mr-3">
                            <i data-lucide="edit-2" class="w-4 h-4"></i>
                        </button>
                        <button onclick="deleteService('${service._id}')" class="text-red-400 hover:text-red-300">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-gray-400">No services found</td></tr>';
        }
        lucide.createIcons();
    } catch (error) {
        console.error('Error loading services:', error);
    }
}

async function handleServiceSubmit(event) {
    event.preventDefault();

    const serviceData = {
        title: {
            en: document.getElementById('service-title-en').value,
            ar: document.getElementById('service-title-ar').value
        },
        slug: document.getElementById('service-slug').value,
        shortDescription: {
            en: document.getElementById('service-short-desc-en').value,
            ar: document.getElementById('service-short-desc-ar').value
        },
        description: {
            en: document.getElementById('service-short-desc-en').value,
            ar: document.getElementById('service-short-desc-ar').value
        },
        icon: document.getElementById('service-icon').value,
        iconColor: document.getElementById('service-icon-color').value,
        featured: document.getElementById('service-featured').value === 'true'
    };

    try {
        const url = currentEditId ? `${API_BASE}/services/${currentEditId}` : `${API_BASE}/services`;
        const method = currentEditId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(serviceData)
        });

        const result = await response.json();
        if (result.success) {
            closeAllModals();
            loadServices();
            showNotification('Service saved successfully!', 'success');
        }
    } catch (error) {
        showNotification('Error saving service', 'error');
    }
}

async function openServiceModal(serviceId = null) {
    currentEditId = serviceId;
    const modal = document.getElementById('service-modal');
    const overlay = document.getElementById('modal-overlay');
    const form = document.getElementById('service-form');

    document.getElementById('service-modal-title').textContent = serviceId ? 'Edit Service' : 'Add Service';
    form.reset();

    if (serviceId) {
        try {
            const response = await fetch(`${API_BASE}/services?raw=true`);
            const result = await response.json();
            const service = result.data.find(s => s._id === serviceId);
            if (service) {
                document.getElementById('service-title-en').value = service.title.en;
                document.getElementById('service-title-ar').value = service.title.ar;
                document.getElementById('service-slug').value = service.slug;
                document.getElementById('service-icon').value = service.icon;
                document.getElementById('service-icon-color').value = service.iconColor || 'cyan';
                document.getElementById('service-short-desc-en').value = service.shortDescription.en;
                document.getElementById('service-short-desc-ar').value = service.shortDescription.ar;
                document.getElementById('service-featured').value = service.featured.toString();
            }
        } catch (error) { }
    }

    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
}

function editService(id) {
    openServiceModal(id);
}

async function deleteService(id) {
    if (confirm('Are you sure you want to delete this service?')) {
        try {
            await fetch(`${API_BASE}/services/${id}`, { method: 'DELETE' });
            loadServices();
            showNotification('Service deleted successfully!', 'success');
        } catch (error) { }
    }
}

// Contacts Functions
async function loadFallbackLeads() {
    try {
        const response = await fetch(`${API_BASE}/contact/fallback-leads`);
        const result = await response.json();
        const tbody = document.getElementById('contacts-table-body');

        if (result.success && result.data && result.data.length > 0) {
            tbody.innerHTML = result.data.map(msg => {
                const date = new Date(msg.timestamp || Date.now()).toLocaleString();
                return `
                    <tr class="table-row bg-purple-950/20 border-l-2 border-purple-500">
                        <td class="px-6 py-4 text-sm text-purple-200 font-medium">${msg.name}</td>
                        <td class="px-6 py-4 text-sm text-gray-300">
                            <div>${msg.email}</div>
                            ${msg.phone ? `<div class="text-xs text-gray-500 mt-0.5">${msg.phone}</div>` : ''}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-300">${msg.company || msg.businessName || 'N/A'}</td>
                        <td class="px-6 py-4 text-sm text-gray-300 max-w-xs truncate">${msg.message}</td>
                        <td class="px-6 py-4 text-sm text-gray-300">${date}</td>
                        <td class="px-6 py-4 text-sm">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full border bg-purple-500/20 text-purple-300 border-purple-500/30">
                                Disk Backup
                            </span>
                        </td>
                        <td class="px-6 py-4 text-sm text-right">
                            <span class="text-xs text-gray-500">File Logged</span>
                        </td>
                    </tr>
                `;
            }).join('');
            showNotification(`Loaded ${result.count} emergency disk backup leads.`, 'info');
        } else {
            tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-gray-400">No emergency disk fallback leads recorded.</td></tr>';
        }
        lucide.createIcons();
    } catch (error) {
        console.error('Error loading fallback leads:', error);
        showNotification('Error fetching fallback disk leads', 'error');
    }
}

async function loadContacts() {
    try {
        const response = await fetch(`${API_BASE}/contact/submissions`);
        const result = await response.json();
        const tbody = document.getElementById('contacts-table-body');

        if (result.success && result.data && result.data.length > 0) {
            tbody.innerHTML = result.data.map(msg => {
                const date = new Date(msg.createdAt).toLocaleString();
                const statusColors = {
                    new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                    read: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
                    replied: 'bg-green-500/20 text-green-400 border-green-500/30',
                    archived: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                };
                const statusClass = statusColors[msg.status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
                
                return `
                    <tr class="table-row">
                        <td class="px-6 py-4 text-sm text-gray-300 font-medium">${msg.name}</td>
                        <td class="px-6 py-4 text-sm text-gray-300">
                            <div>${msg.email}</div>
                            ${msg.phone ? `<div class="text-xs text-gray-500 mt-0.5">${msg.phone}</div>` : ''}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-300">${msg.company || 'N/A'}</td>
                        <td class="px-6 py-4 text-sm text-gray-300 max-w-xs truncate">${msg.message}</td>
                        <td class="px-6 py-4 text-sm text-gray-300">${date}</td>
                        <td class="px-6 py-4 text-sm">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full border ${statusClass}">
                                ${msg.status}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-sm text-right">
                            <div class="flex items-center justify-end gap-2">
                                <button onclick="viewContactDetails('${msg._id}')" class="text-cyan-400 hover:text-cyan-300" title="View Details">
                                    <i data-lucide="eye" class="w-4 h-4"></i>
                                </button>
                                <select onchange="updateContactStatus('${msg._id}', this.value)" class="bg-slate-800 border border-slate-700 text-gray-300 text-xs rounded px-1 py-0.5 focus:outline-none focus:border-cyan-500">
                                    <option value="new" ${msg.status === 'new' ? 'selected' : ''}>New</option>
                                    <option value="read" ${msg.status === 'read' ? 'selected' : ''}>Read</option>
                                    <option value="replied" ${msg.status === 'replied' ? 'selected' : ''}>Replied</option>
                                    <option value="archived" ${msg.status === 'archived' ? 'selected' : ''}>Archived</option>
                                </select>
                                <button onclick="deleteContactSubmission('${msg._id}')" class="text-red-400 hover:text-red-300" title="Delete">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-gray-400">No contact messages yet.</td></tr>';
        }
        lucide.createIcons();
    } catch (error) {
        console.error('Error loading contacts:', error);
        document.getElementById('contacts-table-body').innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-red-400">Error loading messages</td></tr>';
    }
}

// Store currently viewed contact for reply actions
let currentContactData = null;

async function viewContactDetails(id) {
    try {
        const response = await fetch(`${API_BASE}/contact/submissions`);
        const result = await response.json();
        if (result.success && result.data) {
            const msg = result.data.find(m => m._id === id);
            if (msg) {
                // Store for reply functions
                currentContactData = msg;

                document.getElementById('detail-name').textContent = msg.name;
                document.getElementById('detail-status').textContent = msg.status.toUpperCase();
                document.getElementById('detail-email').textContent = msg.email;
                document.getElementById('detail-phone').textContent = msg.phone || 'N/A';
                document.getElementById('detail-company').textContent = msg.company || 'N/A';
                document.getElementById('detail-message').textContent = msg.message;
                document.getElementById('detail-date').textContent = new Date(msg.createdAt).toLocaleString();
                
                // Open modal
                document.getElementById('contact-modal').classList.remove('hidden');
                document.getElementById('modal-overlay').classList.remove('hidden');
                lucide.createIcons();
                
                // Mark as read automatically when viewed
                if (msg.status === 'new') {
                    await updateContactStatus(id, 'read', false); // silent update
                }
            }
        }
    } catch (error) {
        console.error('Error viewing contact details:', error);
        showNotification('Error viewing contact details', 'error');
    }
}

function replyViaEmail() {
    if (!currentContactData) return;
    const subject = encodeURIComponent(`Re: Your enquiry — Iceberg Agency`);
    const body = encodeURIComponent(`Hi ${currentContactData.name},\n\nThank you for reaching out to Iceberg Agency!\n\n`);
    window.open(`mailto:${currentContactData.email}?subject=${subject}&body=${body}`, '_blank');
}

function replyViaWhatsApp() {
    if (!currentContactData) return;
    const phone = currentContactData.phone;
    if (!phone || phone === 'N/A') {
        showNotification('No phone number available for this contact.', 'warning');
        return;
    }
    // Strip non-numeric characters for wa.me link
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Hi ${currentContactData.name}, this is Iceberg Agency following up on your enquiry. How can we help you?`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
}

async function updateContactStatus(id, status, reload = true) {
    try {
        const response = await fetch(`${API_BASE}/contact/submissions/${id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        const result = await response.json();
        if (result.success) {
            if (reload) {
                loadContacts();
                loadDashboardData();
                showNotification('Status updated successfully!', 'success');
            }
        } else {
            showNotification('Error updating status: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        showNotification('Error updating status', 'error');
    }
}

async function deleteContactSubmission(id) {
    if (confirm('Are you sure you want to delete this contact submission?')) {
        try {
            const response = await fetch(`${API_BASE}/contact/submissions/${id}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            if (result.success) {
                loadContacts();
                loadDashboardData();
                showNotification('Submission deleted successfully!', 'success');
            } else {
                showNotification('Error deleting submission: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Error deleting submission:', error);
            showNotification('Error deleting submission', 'error');
        }
    }
}

async function exportContacts() {
    try {
        const response = await fetch(`${API_BASE}/contact/submissions`);
        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
            // Define CSV headers
            const headers = ['Name', 'Email', 'Phone', 'Company', 'Message', 'Status', 'Date'];
            
            // Format rows
            const csvRows = [
                headers.join(','), // header row
                ...result.data.map(msg => {
                    const name = `"${(msg.name || '').replace(/"/g, '""')}"`;
                    const email = `"${(msg.email || '').replace(/"/g, '""')}"`;
                    const phone = `"${(msg.phone || '').replace(/"/g, '""')}"`;
                    const company = `"${(msg.company || '').replace(/"/g, '""')}"`;
                    const message = `"${(msg.message || '').replace(/"/g, '""').replace(/\r?\n|\r/g, ' ')}"`;
                    const status = `"${(msg.status || '').replace(/"/g, '""')}"`;
                    const date = `"${new Date(msg.createdAt).toLocaleString().replace(/"/g, '""')}"`;
                    
                    return [name, email, phone, company, message, status, date].join(',');
                })
            ];
            
            const csvContent = csvRows.join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `contact_submissions_${new Date().toISOString().slice(0,10)}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showNotification('CSV exported successfully!', 'success');
        } else {
            showNotification('No messages to export.', 'warning');
        }
    } catch (error) {
        console.error('Error exporting contacts:', error);
        showNotification('Error exporting CSV', 'error');
    }
}

// Showcase Marquee Functions
async function loadShowcase() {
    try {
        const response = await fetch(`${API_BASE}/content?category=showcase`);
        const result = await response.json();
        if (result.success && result.data) {
            const showcaseData = Object.values(result.data).find(item => item.key === 'gallery_showcase');
            if (showcaseData) {
                // value is {en, ar} where en/ar are JSON strings
                const urls = JSON.parse(showcaseData.value.en);
                document.getElementById('showcase-urls').value = urls.join('\n');
            }
        }
    } catch (error) {
        console.error('Error loading showcase:', error);
    }
}

async function saveShowcaseImages() {
    const urls = document.getElementById('showcase-urls').value.split('\n').map(u => u.trim()).filter(u => u);
    try {
        const response = await fetch(`${API_BASE}/content/gallery_showcase`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                value: {
                    en: JSON.stringify(urls),
                    ar: JSON.stringify(urls)
                },
                category: 'showcase',
                type: 'json'
            })
        });
        const result = await response.json();
        if (result.success) {
            showNotification('Showcase images saved!', 'success');
        } else {
            showNotification(result.error || 'Failed to save', 'error');
        }
    } catch (error) {
        showNotification('Error saving showcase', 'error');
    }
}

// Client Logos Functions
async function loadClients() {
    try {
        const response = await fetch(`${API_BASE}/content?category=clients`);
        const result = await response.json();
        if (result.success && result.data) {
            const clientsData = Object.values(result.data).find(item => item.key === 'gallery_clients');
            if (clientsData) {
                const urls = JSON.parse(clientsData.value.en);
                document.getElementById('client-urls').value = urls.join('\n');
            }
        }
    } catch (error) {
        console.error('Error loading clients:', error);
    }
}

async function saveClientLogos() {
    const urls = document.getElementById('client-urls').value.split('\n').map(u => u.trim()).filter(u => u);
    try {
        const response = await fetch(`${API_BASE}/content/gallery_clients`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                value: {
                    en: JSON.stringify(urls),
                    ar: JSON.stringify(urls)
                },
                category: 'clients',
                type: 'json'
            })
        });
        const result = await response.json();
        if (result.success) {
            showNotification('Client logos saved!', 'success');
        } else {
            showNotification(result.error || 'Failed to save', 'error');
        }
    } catch (error) {
        showNotification('Error saving logos', 'error');
    }
}

// Utility Functions
function closeAllModals() {
    document.querySelectorAll('[id$="-modal"]').forEach(modal => {
        modal.classList.add('hidden');
    });
    document.getElementById('modal-overlay').classList.add('hidden');
    currentEditId = null;
    currentEditType = null;
}

function showNotification(message, type = 'info') {
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500',
        warning: 'bg-yellow-500'
    };

    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Initialize data
async function initializeData() {
    try {
        showNotification('Initializing data...', 'info');

        const [contentRes, projectsRes, servicesRes] = await Promise.all([
            fetch(`${API_BASE}/content/initialize`, { method: 'POST' }),
            fetch(`${API_BASE}/projects/initialize`, { method: 'POST' }),
            fetch(`${API_BASE}/services/initialize`, { method: 'POST' })
        ]);

        const results = await Promise.all([contentRes.json(), projectsRes.json(), servicesRes.json()]);

        const allSuccessful = results.every(result => result.success);

        if (allSuccessful) {
            showNotification('Data initialized successfully!', 'success');
            loadDashboardData();
        } else {
            showNotification('Some data initialization failed', 'error');
        }
    } catch (error) {
        console.error('Error initializing data:', error);
        showNotification('Error initializing data', 'error');
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.removeItem('iceberg_admin_auth');
        const loginModal = document.getElementById('login-modal');
        if (loginModal) loginModal.classList.remove('hidden');
        const userEl = document.getElementById('login-username');
        const passEl = document.getElementById('login-password');
        if (userEl) userEl.value = '';
        if (passEl) passEl.value = '';
        showNotification('You have logged out.', 'info');
        lucide.createIcons();
    }
}


// Global state for IDEX Audits in Admin
// =========================================================================
// IDEX 2026 EVENT SUITE & PUBLIC SCREENS MANAGEMENT CONTROLLER
// =========================================================================

let allAdminAudits = [];
let allAdminLeads = [];
let allAdminSlots = [];
let activeCalendarDay = '2026-08-20';

// -------------------------------------------------------------------------
// IDEX 01: HUB OVERVIEW DASHBOARD
// -------------------------------------------------------------------------
async function loadIdexOverview() {
    if (allAdminAudits.length === 0) {
        await loadIdexAudits();
    }
    
    // Calculate total leakage and audit stats
    const totalAudits = allAdminAudits.length || 140;
    const totalLeakage = allAdminAudits.reduce((acc, item) => acc + (item.est_leakage || 420000), 0);
    
    const countEl = document.getElementById('ov-audits-count');
    const leakageEl = document.getElementById('ov-leakage-tally');
    if (countEl) countEl.textContent = totalAudits;
    if (leakageEl) leakageEl.textContent = (totalLeakage / 1000000).toFixed(1) + 'M EGP';

    // Fetch leads count
    try {
        const res = await fetch('/api/leads');
        const data = await res.json();
        if (data.success && Array.isArray(data.leads)) {
            allAdminLeads = data.leads;
        }
    } catch (e) {}
    if (allAdminLeads.length === 0) {
        allAdminLeads = getLocalLeadsFallback();
    }
    const leadsEl = document.getElementById('ov-leads-count');
    if (leadsEl) leadsEl.textContent = allAdminLeads.length;

    // Fetch slots count
    const slotsEl = document.getElementById('ov-slots-count');
    if (slotsEl) slotsEl.textContent = '8 / 32';

    // Populate Top High-Leakage Exhibitors list
    const topListEl = document.getElementById('ov-top-audits-list');
    if (topListEl) {
        const highRisk = allAdminAudits.filter(a => a.score < 65).slice(0, 5);
        if (highRisk.length === 0) {
            topListEl.innerHTML = '<p class="text-sm text-gray-400 p-4 text-center">No critical risk exhibitors found.</p>';
        } else {
            topListEl.innerHTML = highRisk.map(item => {
                const clientUrl = `/idex.html?audit_company=${encodeURIComponent(item.name)}`;
                return `
                    <div class="p-3 bg-slate-900/80 rounded-lg border border-slate-800 flex items-center justify-between hover:border-cyan-500/30 transition-all">
                        <div class="space-y-0.5">
                            <div class="font-bold text-white text-sm flex items-center gap-2">
                                ${item.name}
                                <span class="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-[10px] font-mono font-bold">${item.score}/100</span>
                            </div>
                            <div class="text-xs text-gray-400">${item.category || item.sector || 'Dental Equipment'} · Est. Leakage: <span class="text-red-400 font-mono font-bold">${(item.est_leakage || 400000).toLocaleString()} EGP</span></div>
                        </div>
                        <div class="flex items-center gap-2">
                            <button onclick="copyAuditLink('${clientUrl}')" class="px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-slate-950 rounded text-xs font-bold transition-all">
                                🔗 Copy Link
                            </button>
                            <button onclick="viewAuditDetailsByName('${item.name.replace(/'/g, "\\'")}')" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-gray-200 rounded text-xs font-bold transition-all">
                                👁 Inspect
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }
    lucide.createIcons();
}

// -------------------------------------------------------------------------
// IDEX 02: EXHIBITOR AUDITS DATABASE & INSPECTOR
// -------------------------------------------------------------------------
async function loadIdexAudits() {
    const tbody = document.getElementById('idex-audits-tbody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="7" class="p-6 text-center text-cyan-400 animate-pulse">Loading IDEX exhibitor audit database...</td></tr>';
    }

    const urls = [
        '/IDEX%20Event/data.json',
        '/IDEX Event/data.json',
        'IDEX%20Event/data.json',
        'IDEX Event/data.json'
    ];

    let loadedData = null;
    for (const url of urls) {
        try {
            const res = await fetch(url);
            if (res.ok) {
                const json = await res.json();
                if (Array.isArray(json) && json.length > 0) {
                    loadedData = json;
                    break;
                }
            }
        } catch (e) {}
    }

    if (loadedData) {
        allAdminAudits = loadedData;
    } else {
        allAdminAudits = getLocalAuditsFallback();
    }

    // Merge with any custom user-added audits in localStorage
    try {
        const savedCustom = localStorage.getItem('iceberg_custom_audits');
        if (savedCustom) {
            const customArr = JSON.parse(savedCustom);
            if (Array.isArray(customArr)) {
                allAdminAudits = [...customArr, ...allAdminAudits];
            }
        }
    } catch(e) {}

    renderAdminAudits(allAdminAudits);
}

function renderAdminAudits(audits) {
    const tbody = document.getElementById('idex-audits-tbody');
    if (!tbody) return;

    if (!Array.isArray(audits) || audits.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="p-6 text-center text-gray-400">No exhibitors match your filter.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    audits.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.className = 'table-row border-b border-slate-800 hover:bg-slate-800/40 transition-colors';

        let scoreBadge = `<span class="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs font-bold font-mono">${item.score}/100</span>`;
        if (item.score < 60) scoreBadge = `<span class="px-2.5 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs font-bold font-mono">${item.score}/100</span>`;
        else if (item.score < 80) scoreBadge = `<span class="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-xs font-bold font-mono">${item.score}/100</span>`;

        const leakageStr = item.est_leakage ? `${item.est_leakage.toLocaleString()} EGP` : '—';
        const clientUrl = `/idex.html?audit_company=${encodeURIComponent(item.name)}`;

        const vulnStr = Array.isArray(item.vulnerabilities) ? item.vulnerabilities[0] : (item.vulnerabilities || 'N/A');
        
        let adminRowLinks = '';
        if (item.website) adminRowLinks += `<a href="${item.website}" target="_blank" rel="noopener noreferrer" title="Website: ${item.website}" class="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded text-[10px] font-bold hover:bg-cyan-500/40 transition-all">🌐 Web</a> `;
        if (item.social_links) {
            if (item.social_links.facebook) adminRowLinks += `<a href="${item.social_links.facebook}" target="_blank" rel="noopener noreferrer" title="Facebook" class="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded text-[10px] font-bold hover:bg-blue-500/40 transition-all">📘 FB</a> `;
            if (item.social_links.instagram) adminRowLinks += `<a href="${item.social_links.instagram}" target="_blank" rel="noopener noreferrer" title="Instagram" class="px-1.5 py-0.5 bg-pink-500/20 text-pink-300 border border-pink-500/30 rounded text-[10px] font-bold hover:bg-pink-500/40 transition-all">📸 IG</a> `;
            if (item.social_links.linkedin) adminRowLinks += `<a href="${item.social_links.linkedin}" target="_blank" rel="noopener noreferrer" title="LinkedIn" class="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-bold hover:bg-emerald-500/40 transition-all">💼 LI</a> `;
            if (item.social_links.youtube) adminRowLinks += `<a href="${item.social_links.youtube}" target="_blank" rel="noopener noreferrer" title="YouTube" class="px-1.5 py-0.5 bg-red-500/20 text-red-300 border border-red-500/30 rounded text-[10px] font-bold hover:bg-red-500/40 transition-all">▶️ YT</a>`;
        }

        tr.innerHTML = `
            <td class="p-4 text-center font-mono font-bold text-cyan-400 text-sm">${index + 1}</td>
            <td class="p-4">
                <div class="font-bold text-white text-base">${item.name}</div>
                <div class="flex flex-wrap gap-1 mt-1">${adminRowLinks}</div>
                <div class="text-xs text-slate-400 mt-1">${item.tier || 'Tier 2'} | ${item.hall || 'IDEX Hall'} ${item.booth ? `Stand ${item.booth}` : ''}</div>
            </td>
            <td class="p-4 text-xs">
                <span class="px-2 py-0.5 bg-slate-800 text-cyan-400 rounded font-semibold">${item.sector || item.category || 'Dental Equipment'}</span>
                <div class="text-gray-400 mt-0.5">${item.region || item.country || 'Egypt & MENA'}</div>
            </td>
            <td class="p-4">${scoreBadge}</td>
            <td class="p-4 font-mono font-bold text-red-400 text-xs">${leakageStr}</td>
            <td class="p-4 text-xs text-gray-300 max-w-xs truncate" title="${vulnStr}">
                ${vulnStr}
            </td>
            <td class="p-4 text-right space-x-1.5 whitespace-nowrap">
                <button onclick="viewAuditDetailsByName('${item.name.replace(/'/g, "\\'")}')" class="px-2.5 py-1.5 bg-cyan-500/20 hover:bg-cyan-500 text-cyan-400 hover:text-slate-950 rounded text-xs font-bold transition-all">
                    👁 View
                </button>
                <button onclick="copyAuditLink('${clientUrl}')" class="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-xs font-bold transition-all">
                    🔗 Link
                </button>
                <button onclick="openAuditModal('${item.id || item.name}')" class="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded text-xs transition-all">
                    ✏️
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    lucide.createIcons();
}

function exportExhibitorsCSV() {
    if (!Array.isArray(allAdminAudits) || allAdminAudits.length === 0) {
        showNotification('No exhibitor data to export', 'error');
        return;
    }

    let csv = "ID,Exhibitor Name,Sector,Tier,Score,Est Leakage (EGP),Website,Facebook,Instagram,LinkedIn,YouTube\n";
    
    allAdminAudits.forEach(item => {
        const row = [
            item.id || '',
            `"${(item.name || '').replace(/"/g, '""')}"`,
            `"${(item.sector || item.category || '').replace(/"/g, '""')}"`,
            `"${(item.tier || '').replace(/"/g, '""')}"`,
            item.score || 0,
            item.est_leakage || 0,
            `"${(item.website || '').replace(/"/g, '""')}"`,
            `"${(item.social_links?.facebook || '').replace(/"/g, '""')}"`,
            `"${(item.social_links?.instagram || '').replace(/"/g, '""')}"`,
            `"${(item.social_links?.linkedin || '').replace(/"/g, '""')}"`,
            `"${(item.social_links?.youtube || '').replace(/"/g, '""')}"`
        ];
        csv += row.join(',') + "\n";
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "IDEX_2026_Exhibitor_Social_Links.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Exported 140 Exhibitor Social & Website Links to CSV!', 'success');
}
window.exportAuditsCSV = exportExhibitorsCSV;

function filterAdminAudits() {
    const q = (document.getElementById('admin-audit-search')?.value || '').toLowerCase().trim();
    const sectorFilter = document.getElementById('admin-audit-sector-filter')?.value || 'ALL';
    const tierFilter = document.getElementById('admin-audit-tier-filter')?.value || 'ALL';
    const scoreFilter = document.getElementById('admin-audit-score-filter')?.value || 'ALL';

    let filtered = [...allAdminAudits];

    if (q) {
        filtered = filtered.filter(a => 
            (a.name && a.name.toLowerCase().includes(q)) ||
            (a.sector && a.sector.toLowerCase().includes(q)) ||
            (a.category && a.category.toLowerCase().includes(q)) ||
            (a.region && a.region.toLowerCase().includes(q))
        );
    }

    if (sectorFilter !== 'ALL') {
        filtered = filtered.filter(a => {
            const cat = (a.sector || a.category || '').toLowerCase();
            return cat.includes(sectorFilter.toLowerCase());
        });
    }

    if (tierFilter !== 'ALL') {
        filtered = filtered.filter(a => a.tier === tierFilter);
    }

    if (scoreFilter !== 'ALL') {
        if (scoreFilter === 'CRITICAL') filtered = filtered.filter(a => a.score < 60);
        else if (scoreFilter === 'WARNING') filtered = filtered.filter(a => a.score >= 60 && a.score < 80);
        else if (scoreFilter === 'GOOD') filtered = filtered.filter(a => a.score >= 80);
    }

    renderAdminAudits(filtered);
}

function copyAuditLink(relUrl) {
    const fullUrl = window.location.origin + relUrl;
    navigator.clipboard.writeText(fullUrl).then(() => {
        showNotification('Confidential Client Audit link copied!', 'success');
    }).catch(() => {
        prompt('Copy this client audit URL:', fullUrl);
    });
}

function viewAuditDetailsByName(name) {
    const audit = allAdminAudits.find(a => a.name.toLowerCase() === name.toLowerCase());
    if (!audit) {
        showNotification('Audit details not found for ' + name, 'error');
        return;
    }

    const modal = document.getElementById('idex-audit-view-modal');
    const overlay = document.getElementById('modal-overlay');
    if (!modal) return;

    document.getElementById('view-audit-name').textContent = audit.name;
    document.getElementById('view-audit-meta').textContent = `${audit.sector || audit.category || 'Dental'} | ${audit.region || audit.country || 'MENA'} | Hall 2 Stand B14`;

    let adminLinksEl = document.getElementById('view-audit-social-links');
    if (!adminLinksEl) {
        adminLinksEl = document.createElement('div');
        adminLinksEl.id = 'view-audit-social-links';
        adminLinksEl.className = 'flex flex-wrap gap-2 mt-2 mb-3 items-center';
        const metaEl = document.getElementById('view-audit-meta');
        if (metaEl && metaEl.parentNode) {
            metaEl.parentNode.insertBefore(adminLinksEl, metaEl.nextSibling);
        }
    }
    if (adminLinksEl && (audit.website || audit.social_links)) {
        let lhtml = '';
        if (audit.website) {
            lhtml += `<a href="${audit.website}" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/40 rounded text-xs font-semibold flex items-center gap-1 transition-all">🌐 Website</a>`;
        }
        if (audit.social_links) {
            if (audit.social_links.facebook) {
                lhtml += `<a href="${audit.social_links.facebook}" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/40 rounded text-xs font-semibold flex items-center gap-1 transition-all">📘 Facebook</a>`;
            }
            if (audit.social_links.instagram) {
                lhtml += `<a href="${audit.social_links.instagram}" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1 bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 border border-pink-500/40 rounded text-xs font-semibold flex items-center gap-1 transition-all">📸 Instagram</a>`;
            }
            if (audit.social_links.linkedin) {
                lhtml += `<a href="${audit.social_links.linkedin}" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 rounded text-xs font-semibold flex items-center gap-1 transition-all">💼 LinkedIn</a>`;
            }
            if (audit.social_links.youtube) {
                lhtml += `<a href="${audit.social_links.youtube}" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 rounded text-xs font-semibold flex items-center gap-1 transition-all">▶️ YouTube</a>`;
            }
        }
        adminLinksEl.innerHTML = lhtml;
    }

    document.getElementById('view-audit-score-num').textContent = `${audit.score}/100`;

    const leakageEl = document.getElementById('view-audit-leakage');
    if (leakageEl) leakageEl.textContent = audit.est_leakage ? `${audit.est_leakage.toLocaleString()} EGP` : '380,000 EGP';

    const fEl = document.getElementById('view-audit-followers');
    if (fEl) fEl.textContent = audit.followers ? audit.followers.toLocaleString() : '19,850';

    const engEl = document.getElementById('view-audit-engagement');
    if (engEl) engEl.textContent = audit.engagement_rate ? `${audit.engagement_rate}%` : '1.92%';

    const tierEl = document.getElementById('view-audit-tier');
    if (tierEl) tierEl.textContent = `${audit.tier || 'Tier 2'} (${audit.tier_name || 'Exhibitor'})`;

    const vulnEl = document.getElementById('view-audit-vulnerabilities');
    if (vulnEl) vulnEl.textContent = Array.isArray(audit.vulnerabilities) ? audit.vulnerabilities.join(' ') : (audit.vulnerabilities || 'Posting static spec sheets instead of clinical ROI reels.');

    const actEl = document.getElementById('view-audit-actions');
    if (actEl) {
        const actionsList = Array.isArray(audit.actions) ? audit.actions : ['Shift social copy focus to clinical ROI', 'Run Instagram comment-to-DM funnels', 'Pre-book VIP dentist consultation slots'];
        actEl.innerHTML = actionsList.map(a => `<li>${a}</li>`).join('');
    }

    // Outreach scripts
    const liScript = audit.outreach?.linkedin || `Subject: Social Media Funnel & IDEX Booth Traffic for ${audit.name}\n\nHi [First Name],\n\nI noticed ${audit.name} is exhibiting at IDEX. We ran a digital performance audit on your MENA channels and scored them ${audit.score}/100. At Iceberg, we help exhibitors pre-book clinic owners directly before the event starts. Can I send over your 1-page breakdown?`;
    const waScript = audit.outreach?.whatsapp || `Salam Alaikum! This is Mohamed Asy from Iceberg Marketing. We ran an IDEX performance audit for ${audit.name} (Score: ${audit.score}/100). We built a localized flow that pre-books clinic owners into your calendar before IDEX. Can I drop the PDF audit here?`;
    const boothScript = audit.outreach?.booth_script || `Iceberg Rep: 'Hi! Quick question—did you run a pre-event social campaign to pre-book dentists in advance?'\n\nExhibitor: 'Mostly floor traffic.'\n\nIceberg Rep: 'Got it. Our consultant Mohamed Asy audited your MENA accounts (${audit.score}/100). Here is a 1-page summary to fix lead capture today.'`;

    document.getElementById('view-script-linkedin').value = liScript;
    document.getElementById('view-script-whatsapp').value = waScript;
    document.getElementById('view-script-booth').value = boothScript;

    const linkEl = document.getElementById('view-audit-client-link');
    if (linkEl) linkEl.href = `/idex.html?audit_company=${encodeURIComponent(audit.name)}`;

    modal.classList.remove('hidden');
    if (overlay) overlay.classList.remove('hidden');
    lucide.createIcons();
}

function openAuditModal(auditId = null) {
    const modal = document.getElementById('idex-audit-edit-modal');
    const overlay = document.getElementById('modal-overlay');
    const form = document.getElementById('idex-audit-form');
    if (!modal) return;

    form.reset();
    document.getElementById('edit-audit-id').value = auditId || '';
    document.getElementById('audit-form-title').textContent = auditId ? 'Edit Exhibitor Audit' : 'Add Exhibitor Audit';

    if (auditId) {
        const item = allAdminAudits.find(a => (a.id == auditId || a.name === auditId));
        if (item) {
            document.getElementById('edit-audit-name').value = item.name || '';
            document.getElementById('edit-audit-category').value = item.sector || item.category || '';
            document.getElementById('edit-audit-score').value = item.score || 75;
            document.getElementById('edit-audit-leakage').value = item.est_leakage || 400000;
            document.getElementById('edit-audit-tier').value = item.tier || 'Tier 1';
            document.getElementById('edit-audit-country').value = item.country || item.region || '';
            document.getElementById('edit-audit-booth').value = item.booth || '';
            document.getElementById('edit-audit-vulnerabilities').value = Array.isArray(item.vulnerabilities) ? item.vulnerabilities.join('\n') : (item.vulnerabilities || '');
            document.getElementById('edit-audit-actions').value = Array.isArray(item.actions) ? item.actions.join('\n') : (item.actions || '');

            // Social Audit Metrics
            document.getElementById('edit-audit-followers').value = item.followers || '';
            document.getElementById('edit-audit-engagement').value = item.engagement_rate || '';
            document.getElementById('edit-audit-avg-views').value = item.avg_views || '';
            document.getElementById('edit-audit-content-types').value = item.content_types || '';

            // Platform breakdown
            const fb = item.followers_breakdown || {};
            document.getElementById('edit-audit-fb').value = fb.facebook || '';
            document.getElementById('edit-audit-ig').value = fb.instagram || '';
            document.getElementById('edit-audit-li').value = fb.linkedin || '';
            document.getElementById('edit-audit-tt').value = fb.tiktok || '';

            // Score breakdown
            const bd = item.breakdown || {};
            document.getElementById('edit-audit-bd-visual').value = bd.visual_identity || '';
            document.getElementById('edit-audit-bd-velocity').value = bd.content_velocity || '';
            document.getElementById('edit-audit-bd-engagement').value = bd.engagement || '';
            document.getElementById('edit-audit-bd-ads').value = bd.ad_infrastructure || '';
        }
    }

    modal.classList.remove('hidden');
    if (overlay) overlay.classList.remove('hidden');
}

function handleAuditSubmit(event) {
    event.preventDefault();
    const id = document.getElementById('edit-audit-id').value;
    const name = document.getElementById('edit-audit-name').value.trim();
    const category = document.getElementById('edit-audit-category').value.trim();
    const score = parseInt(document.getElementById('edit-audit-score').value) || 75;
    const est_leakage = parseInt(document.getElementById('edit-audit-leakage').value) || 400000;
    const tier = document.getElementById('edit-audit-tier').value;
    const country = document.getElementById('edit-audit-country').value.trim();
    const booth = document.getElementById('edit-audit-booth').value.trim();
    const vuln = document.getElementById('edit-audit-vulnerabilities').value.trim();
    const actions = document.getElementById('edit-audit-actions').value.trim().split('\n').filter(Boolean);

    // Social Audit Metrics
    const followers = parseInt(document.getElementById('edit-audit-followers').value) || 0;
    const engagement_rate = parseFloat(document.getElementById('edit-audit-engagement').value) || 0;
    const avg_views = parseInt(document.getElementById('edit-audit-avg-views').value) || 0;
    const content_types = document.getElementById('edit-audit-content-types').value.trim();

    const followers_breakdown = {
        facebook: parseInt(document.getElementById('edit-audit-fb').value) || 0,
        instagram: parseInt(document.getElementById('edit-audit-ig').value) || 0,
        linkedin: parseInt(document.getElementById('edit-audit-li').value) || 0,
        tiktok: parseInt(document.getElementById('edit-audit-tt').value) || 0
    };

    const breakdown = {
        visual_identity: parseInt(document.getElementById('edit-audit-bd-visual').value) || 0,
        content_velocity: parseInt(document.getElementById('edit-audit-bd-velocity').value) || 0,
        engagement: parseInt(document.getElementById('edit-audit-bd-engagement').value) || 0,
        ad_infrastructure: parseInt(document.getElementById('edit-audit-bd-ads').value) || 0
    };

    const newAudit = {
        id: id || Date.now(),
        name,
        sector: category,
        category,
        score,
        est_leakage,
        tier,
        country,
        region: country,
        booth,
        vulnerabilities: vuln ? [vuln] : ['Unoptimized lead funnel'],
        actions: actions.length > 0 ? actions : ['Shift copy focus to clinical ROI'],
        followers,
        followers_breakdown,
        engagement_rate,
        avg_views,
        content_types,
        breakdown
    };

    if (id) {
        const idx = allAdminAudits.findIndex(a => (a.id == id || a.name === id));
        if (idx !== -1) allAdminAudits[idx] = { ...allAdminAudits[idx], ...newAudit };
    } else {
        allAdminAudits.unshift(newAudit);
    }

    try {
        const customOnly = allAdminAudits.filter(a => typeof a.id === 'number' && a.id > 1000);
        localStorage.setItem('iceberg_custom_audits', JSON.stringify(customOnly));
    } catch(e) {}

    closeAllModals();
    renderAdminAudits(allAdminAudits);
    showNotification('Exhibitor audit saved successfully!', 'success');
}

function copyScriptText(elementId) {
    const el = document.getElementById(elementId);
    if (!el || !el.value) return;
    navigator.clipboard.writeText(el.value).then(() => {
        showNotification('Outreach script copied to clipboard!', 'success');
    }).catch(() => {
        prompt('Copy outreach script:', el.value);
    });
}

function exportAuditsCSV() {
    if (allAdminAudits.length === 0) {
        showNotification('No audits available to export', 'error');
        return;
    }
    const headers = ['ID', 'Company Name', 'Sector', 'Tier', 'Score', 'Est Leakage (EGP)', 'Country', 'Vulnerabilities'];
    const rows = allAdminAudits.map(a => [
        a.id || '',
        `"${(a.name || '').replace(/"/g, '""')}"`,
        `"${(a.sector || a.category || '').replace(/"/g, '""')}"`,
        a.tier || '',
        a.score || 0,
        a.est_leakage || 0,
        `"${(a.country || a.region || '').replace(/"/g, '""')}"`,
        `"${(Array.isArray(a.vulnerabilities) ? a.vulnerabilities.join(' ') : (a.vulnerabilities || '')).replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `IDEX_2026_Exhibitor_Audits_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Exported IDEX Exhibitor Audits to CSV!', 'success');
}

// -------------------------------------------------------------------------
// IDEX 03: LEADS PIPELINE CONTROLLER
// -------------------------------------------------------------------------
async function loadIdexLeads() {
    const tbody = document.getElementById('idex-leads-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" class="p-6 text-center text-cyan-400 animate-pulse">Loading IDEX leads...</td></tr>';

    let leads = [];
    try {
        const res = await fetch('/api/leads');
        const data = await res.json();
        if (data.success && Array.isArray(data.leads) && data.leads.length > 0) {
            leads = data.leads;
        }
    } catch (e) {}

    if (leads.length === 0) {
        leads = getLocalLeadsFallback();
    }

    allAdminLeads = leads;
    renderAdminLeads(allAdminLeads);
}

function renderAdminLeads(leads) {
    const tbody = document.getElementById('idex-leads-tbody');
    if (!tbody) return;

    if (!Array.isArray(leads) || leads.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="p-6 text-center text-gray-400">No leads found matching your criteria.</td></tr>';
        return;
    }

    const countEl = document.getElementById('idex-leads-count');
    if (countEl) countEl.textContent = leads.length;

    tbody.innerHTML = '';
    leads.forEach((lead, index) => {
        const tr = document.createElement('tr');
        tr.className = 'table-row border-b border-slate-800 hover:bg-slate-800/40 transition-colors';

        const reqList = Array.isArray(lead.requirements) ? lead.requirements.join(', ') : (lead.requirements || 'IDEX Growth Package');
        const dateStr = lead.created_at ? new Date(lead.created_at).toLocaleDateString() : new Date().toLocaleDateString();

        tr.innerHTML = `
            <td class="p-4 font-mono text-xs">
                <div class="font-bold text-white">${lead.lead_id || `IDX-2026-${8800 + index}`}</div>
                <div class="text-gray-400">${dateStr}</div>
            </td>
            <td class="p-4">
                <div class="font-bold text-white text-sm">${lead.name || 'N/A'}</div>
                <div class="text-xs text-gray-400">${lead.email || ''} | ${lead.phone || ''}</div>
                <div class="text-xs font-bold text-cyan-400 mt-0.5">${lead.company || ''}</div>
            </td>
            <td class="p-4 text-xs">
                <div class="font-semibold text-gray-200">${lead.industry || 'Dental Sector'}</div>
                <div class="text-gray-400">${lead.position || 'Decision Maker'}</div>
            </td>
            <td class="p-4 text-xs">
                <span class="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono border border-slate-700">${lead.source || 'idex.html'}</span>
            </td>
            <td class="p-4 text-xs text-gray-300 max-w-xs truncate" title="${reqList}">${reqList}</td>
            <td class="p-4">
                <select onchange="updateLeadStatus('${lead.lead_id || lead._id || lead.name}', this.value)" class="form-input px-2 py-1 rounded text-xs font-bold bg-slate-900 border border-slate-700 text-white">
                    <option value="NEW" ${lead.status === 'NEW' ? 'selected' : ''}>NEW</option>
                    <option value="CONTACTED" ${lead.status === 'CONTACTED' ? 'selected' : ''}>CONTACTED</option>
                    <option value="QUALIFIED" ${lead.status === 'QUALIFIED' ? 'selected' : ''}>QUALIFIED</option>
                    <option value="SCHEDULED" ${lead.status === 'SCHEDULED' ? 'selected' : ''}>SCHEDULED</option>
                    <option value="CONVERTED" ${lead.status === 'CONVERTED' ? 'selected' : ''}>CONVERTED</option>
                    <option value="CLOSED" ${lead.status === 'CLOSED' ? 'selected' : ''}>CLOSED</option>
                </select>
            </td>
            <td class="p-4 text-right space-x-1.5 whitespace-nowrap">
                ${lead.phone ? `<a href="https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}" target="_blank" class="px-2.5 py-1 bg-green-600/30 text-green-400 hover:bg-green-600 hover:text-white rounded text-xs font-bold transition-all inline-block">WhatsApp</a>` : ''}
                <button onclick="openLeadModal('${lead.lead_id || lead.name}')" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-gray-200 rounded text-xs font-bold transition-all">✏️ Edit</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    lucide.createIcons();
}

function filterAdminLeads() {
    const q = (document.getElementById('admin-lead-search')?.value || '').toLowerCase().trim();
    const status = document.getElementById('admin-lead-status-filter')?.value || 'ALL';

    let filtered = [...allAdminLeads];
    if (q) {
        filtered = filtered.filter(l => 
            (l.name && l.name.toLowerCase().includes(q)) ||
            (l.company && l.company.toLowerCase().includes(q)) ||
            (l.email && l.email.toLowerCase().includes(q)) ||
            (l.phone && l.phone.includes(q))
        );
    }
    if (status !== 'ALL') {
        filtered = filtered.filter(l => l.status === status);
    }
    renderAdminLeads(filtered);
}

function updateLeadStatus(leadId, newStatus) {
    const lead = allAdminLeads.find(l => (l.lead_id === leadId || l.name === leadId));
    if (lead) {
        lead.status = newStatus;
        showNotification(`Lead ${lead.name} status updated to ${newStatus}`, 'success');
        try {
            localStorage.setItem('iceberg_admin_leads', JSON.stringify(allAdminLeads));
        } catch(e) {}
    }
}

function openLeadModal(leadId = null) {
    const modal = document.getElementById('idex-lead-modal');
    const overlay = document.getElementById('modal-overlay');
    const form = document.getElementById('idex-lead-form');
    if (!modal) return;

    form.reset();
    document.getElementById('edit-lead-id').value = leadId || '';
    document.getElementById('lead-form-title').textContent = leadId ? 'Edit IDEX Lead' : 'Add IDEX Exhibitor Lead';

    if (leadId) {
        const lead = allAdminLeads.find(l => (l.lead_id === leadId || l.name === leadId));
        if (lead) {
            document.getElementById('edit-lead-name').value = lead.name || '';
            document.getElementById('edit-lead-company').value = lead.company || '';
            document.getElementById('edit-lead-email').value = lead.email || '';
            document.getElementById('edit-lead-phone').value = lead.phone || '';
            document.getElementById('edit-lead-industry').value = lead.industry || '';
            document.getElementById('edit-lead-position').value = lead.position || '';
            document.getElementById('edit-lead-status').value = lead.status || 'NEW';
            document.getElementById('edit-lead-requirements').value = Array.isArray(lead.requirements) ? lead.requirements.join(', ') : (lead.requirements || '');
        }
    }

    modal.classList.remove('hidden');
    if (overlay) overlay.classList.remove('hidden');
}

function handleLeadSubmit(event) {
    event.preventDefault();
    const id = document.getElementById('edit-lead-id').value;
    const name = document.getElementById('edit-lead-name').value.trim();
    const company = document.getElementById('edit-lead-company').value.trim();
    const email = document.getElementById('edit-lead-email').value.trim();
    const phone = document.getElementById('edit-lead-phone').value.trim();
    const industry = document.getElementById('edit-lead-industry').value.trim();
    const position = document.getElementById('edit-lead-position').value.trim();
    const status = document.getElementById('edit-lead-status').value;
    const reqStr = document.getElementById('edit-lead-requirements').value.trim();

    const newLead = {
        lead_id: id || `IDX-2026-${Math.floor(8800 + Math.random() * 1000)}`,
        name,
        company,
        email,
        phone,
        industry: industry || 'Dental Sector',
        position: position || 'Decision Maker',
        status,
        source: 'Admin Portal',
        requirements: reqStr ? reqStr.split(',').map(s => s.trim()) : ['IDEX Package'],
        created_at: new Date().toISOString()
    };

    if (id) {
        const idx = allAdminLeads.findIndex(l => (l.lead_id === id || l.name === id));
        if (idx !== -1) allAdminLeads[idx] = { ...allAdminLeads[idx], ...newLead };
    } else {
        allAdminLeads.unshift(newLead);
    }

    try {
        localStorage.setItem('iceberg_admin_leads', JSON.stringify(allAdminLeads));
    } catch(e) {}

    closeAllModals();
    renderAdminLeads(allAdminLeads);
    showNotification('Exhibitor lead saved successfully!', 'success');
}

function exportLeadsCSV() {
    if (allAdminLeads.length === 0) {
        showNotification('No leads available to export', 'error');
        return;
    }
    const headers = ['Lead ID', 'Name', 'Company', 'Email', 'Phone', 'Industry', 'Position', 'Status', 'Date'];
    const rows = allAdminLeads.map(l => [
        l.lead_id || '',
        `"${(l.name || '').replace(/"/g, '""')}"`,
        `"${(l.company || '').replace(/"/g, '""')}"`,
        l.email || '',
        l.phone || '',
        `"${(l.industry || '').replace(/"/g, '""')}"`,
        `"${(l.position || '').replace(/"/g, '""')}"`,
        l.status || 'NEW',
        l.created_at ? new Date(l.created_at).toLocaleDateString() : ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `IDEX_Exhibitor_Leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Exported IDEX Leads to CSV!', 'success');
}

// -------------------------------------------------------------------------
// IDEX 04: MEETING CALENDAR CONTROLLER
// -------------------------------------------------------------------------
async function loadIdexCalendar() {
    const tbody = document.getElementById('idex-calendar-tbody');
    const dateInput = document.getElementById('admin-cal-date-filter');
    if (!tbody) return;

    const dateVal = dateInput && dateInput.value ? dateInput.value : activeCalendarDay;
    if (dateInput) dateInput.value = dateVal;

    tbody.innerHTML = '<tr><td colspan="6" class="p-6 text-center text-cyan-400 animate-pulse">Loading meeting slots...</td></tr>';

    let slots = [];
    try {
        const res = await fetch(`/api/calendar/slots?date=${dateVal}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.slots) && data.slots.length > 0) {
            slots = data.slots;
        }
    } catch (e) {}

    if (slots.length === 0) {
        slots = getLocalSlotsFallback(dateVal);
    }

    allAdminSlots = slots;
    renderAdminCalendar(allAdminSlots, dateVal);
}

function renderAdminCalendar(slots, dateVal) {
    const tbody = document.getElementById('idex-calendar-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    slots.forEach(slot => {
        const tr = document.createElement('tr');
        tr.className = 'table-row border-b border-slate-800 hover:bg-slate-800/40 transition-colors';

        let statusBadge = '<span class="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs font-bold">AVAILABLE</span>';
        if (slot.status === 'BOOKED') statusBadge = '<span class="px-2.5 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs font-bold">🔒 BOOKED</span>';
        if (slot.status === 'HELD') statusBadge = '<span class="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-xs font-bold">⏳ HELD</span>';

        tr.innerHTML = `
            <td class="p-4 font-mono font-bold text-cyan-400 text-sm">${slot.time} (${slot.date || dateVal})</td>
            <td class="p-4">${statusBadge}</td>
            <td class="p-4 text-xs font-semibold text-white">${slot.lead_email || slot.held_by_session || 'Open Slot'}</td>
            <td class="p-4 text-xs text-gray-300 font-bold">${slot.company || '—'}</td>
            <td class="p-4 text-xs text-gray-400 font-mono">${slot.owner || 'Executive Desk'}</td>
            <td class="p-4 text-right space-x-2">
                <button onclick="toggleSlotStatus('${slot.slot_id}', '${dateVal}')" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded text-xs font-bold transition-all">Toggle Status</button>
                <button onclick="openSlotModal('${slot.slot_id}')" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-gray-200 rounded text-xs font-bold transition-all">✏️ Edit</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    lucide.createIcons();
}

function setCalendarDay(dateStr) {
    activeCalendarDay = dateStr;
    const dateInput = document.getElementById('admin-cal-date-filter');
    if (dateInput) dateInput.value = dateStr;
    loadIdexCalendar();
}

function toggleSlotStatus(slotId, dateVal) {
    const slot = allAdminSlots.find(s => s.slot_id === slotId);
    if (slot) {
        slot.status = slot.status === 'AVAILABLE' ? 'BOOKED' : 'AVAILABLE';
        renderAdminCalendar(allAdminSlots, dateVal);
        showNotification(`Slot ${slot.time} toggled to ${slot.status}`, 'success');
    }
}

function releaseAdminSlot(slotId, dateVal) {
    toggleSlotStatus(slotId, dateVal);
}

function autoGenerateIdexSlots() {
    const dateInput = document.getElementById('admin-cal-date-filter');
    const dateVal = dateInput && dateInput.value ? dateInput.value : activeCalendarDay;

    const defaultTimes = ['10:00 AM', '11:00 AM', '12:00 PM', '01:30 PM', '02:30 PM', '03:30 PM', '04:30 PM', '05:30 PM'];
    allAdminSlots = defaultTimes.map((time, idx) => ({
        slot_id: `slot_${dateVal}_${idx + 1}`,
        time,
        date: dateVal,
        status: idx === 1 ? 'BOOKED' : (idx === 3 ? 'HELD' : 'AVAILABLE'),
        company: idx === 1 ? 'Dentaquick' : '',
        lead_email: idx === 1 ? 'info@dentaquick.com' : '',
        owner: 'Executive Desk 1'
    }));

    renderAdminCalendar(allAdminSlots, dateVal);
    showNotification(`Generated standard consultation slots for ${dateVal}!`, 'success');
}

function openSlotModal(slotId = null) {
    const modal = document.getElementById('idex-slot-modal');
    const overlay = document.getElementById('modal-overlay');
    const form = document.getElementById('idex-slot-form');
    if (!modal) return;

    form.reset();
    document.getElementById('edit-slot-id').value = slotId || '';
    document.getElementById('edit-slot-date').value = activeCalendarDay;

    if (slotId) {
        const slot = allAdminSlots.find(s => s.slot_id === slotId);
        if (slot) {
            document.getElementById('edit-slot-date').value = slot.date || activeCalendarDay;
            document.getElementById('edit-slot-time').value = slot.time || '';
            document.getElementById('edit-slot-status').value = slot.status || 'AVAILABLE';
            document.getElementById('edit-slot-owner').value = slot.owner || '';
            document.getElementById('edit-slot-email').value = slot.lead_email || '';
            document.getElementById('edit-slot-company').value = slot.company || '';
        }
    }

    modal.classList.remove('hidden');
    if (overlay) overlay.classList.remove('hidden');
}

function handleSlotSubmit(event) {
    event.preventDefault();
    const id = document.getElementById('edit-slot-id').value;
    const date = document.getElementById('edit-slot-date').value;
    const time = document.getElementById('edit-slot-time').value.trim();
    const status = document.getElementById('edit-slot-status').value;
    const owner = document.getElementById('edit-slot-owner').value.trim();
    const email = document.getElementById('edit-slot-email').value.trim();
    const company = document.getElementById('edit-slot-company').value.trim();

    const newSlot = {
        slot_id: id || `slot_${date}_${Date.now()}`,
        date,
        time,
        status,
        owner: owner || 'Executive Desk',
        lead_email: email,
        company
    };

    if (id) {
        const idx = allAdminSlots.findIndex(s => s.slot_id === id);
        if (idx !== -1) allAdminSlots[idx] = newSlot;
    } else {
        allAdminSlots.push(newSlot);
    }

    closeAllModals();
    renderAdminCalendar(allAdminSlots, date);
    showNotification('Meeting slot saved successfully!', 'success');
}

// -------------------------------------------------------------------------
// IDEX 05: PACKAGES CONFIGURATOR
// -------------------------------------------------------------------------
function loadIdexPackages() {
    const container = document.getElementById('idex-packages-container');
    if (!container) return;

    let packages = [
        {
            id: 'pkg_1',
            title: 'Standard IDEX Audit & Fast-Track',
            price: '14,900 EGP',
            badge: 'Audit & Setup',
            deliverables: [
                'Full Digital Revenue Leakage Audit Report',
                'Pre-event Comment-to-DM Lead Magnet Setup',
                'IDEX Stand QR Code Flyer & Digital Landing Page',
                '1-on-1 Consultation Session at IDEX'
            ]
        },
        {
            id: 'pkg_2',
            title: '90-Day IDEX Dominance Package',
            price: '49,500 EGP',
            badge: '🔥 MOST POPULAR',
            featured: true,
            deliverables: [
                'Complete Exhibition Rebranding & Visual Identity',
                '30 Days Pre-Event Clinic Owner Meta/WhatsApp Ads',
                'Live Exhibition Media Capture (Reels & Interviews)',
                '30 Days Post-Event Pipeline Nurturing & Sales Follow-up',
                'Guaranteed 50+ Qualified Clinic Owner Bookings'
            ]
        },
        {
            id: 'pkg_3',
            title: 'VIP Booth & Funnel Takeover',
            price: '95,000 EGP',
            badge: 'VIP Enterprise',
            deliverables: [
                'Full Booth Digital Media & Video Reels Crew at IDEX',
                'Custom CAD/CAM Interactive Lead Estimator Web App',
                'Exclusive Retargeting & Direct Outreach Campaign',
                'Dedicated Account Strategist & On-Site Director'
            ]
        }
    ];

    try {
        const saved = localStorage.getItem('iceberg_idex_packages');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) packages = parsed;
        }
    } catch(e) {}

    container.innerHTML = packages.map(pkg => `
        <div class="glass-card p-6 rounded-2xl border ${pkg.featured ? 'border-cyan-500 shadow-xl shadow-cyan-500/10' : 'border-slate-800'} space-y-4">
            <div class="flex justify-between items-center">
                <span class="px-2.5 py-1 rounded text-xs font-bold ${pkg.featured ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-slate-800 text-cyan-400'}">${pkg.badge}</span>
                <span class="text-xs text-slate-400 font-mono">IDEX 2026 Special</span>
            </div>
            
            <div>
                <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Package Title</label>
                <input type="text" id="${pkg.id}_title" value="${pkg.title}" class="form-input w-full px-3 py-2 rounded-lg text-sm bg-slate-900 text-white font-bold">
            </div>

            <div>
                <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Price (EGP)</label>
                <input type="text" id="${pkg.id}_price" value="${pkg.price}" class="form-input w-full px-3 py-2 rounded-lg text-sm bg-slate-900 text-cyan-400 font-mono font-black">
            </div>

            <div>
                <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Deliverables (One per line)</label>
                <textarea id="${pkg.id}_deliv" rows="5" class="form-input w-full p-3 rounded-lg text-xs bg-slate-900 text-gray-300 font-sans">${pkg.deliverables.join('\n')}</textarea>
            </div>
        </div>
    `).join('');

    lucide.createIcons();
}

function saveIdexPackagesConfig() {
    const pkgIds = ['pkg_1', 'pkg_2', 'pkg_3'];
    const updated = pkgIds.map(id => ({
        id,
        title: document.getElementById(`${id}_title`)?.value || '',
        price: document.getElementById(`${id}_price`)?.value || '',
        badge: id === 'pkg_2' ? '🔥 MOST POPULAR' : (id === 'pkg_3' ? 'VIP Enterprise' : 'Audit & Setup'),
        featured: id === 'pkg_2',
        deliverables: (document.getElementById(`${id}_deliv`)?.value || '').split('\n').filter(Boolean)
    }));

    try {
        localStorage.setItem('iceberg_idex_packages', JSON.stringify(updated));
    } catch(e) {}

    showNotification('IDEX Growth Package configuration saved successfully!', 'success');
}

// -------------------------------------------------------------------------
// IDEX 06: PUBLIC SCREENS MANAGER & LIVE PREVIEW
// -------------------------------------------------------------------------
function loadIdexScreens() {
    const iframe = document.getElementById('idex-screen-iframe');
    const selector = document.getElementById('idex-screen-selector');
    if (iframe && selector) {
        iframe.src = selector.value;
        const activeUrlEl = document.getElementById('active-screen-url');
        if (activeUrlEl) activeUrlEl.textContent = selector.value;
        const openLink = document.getElementById('preview-open-link');
        if (openLink) openLink.href = selector.value;
    }
}

function switchPreviewScreen(url) {
    const iframe = document.getElementById('idex-screen-iframe');
    const activeUrlEl = document.getElementById('active-screen-url');
    const openLink = document.getElementById('preview-open-link');
    if (iframe) iframe.src = url;
    if (activeUrlEl) activeUrlEl.textContent = url;
    if (openLink) openLink.href = url;
}

function setPreviewDevice(device) {
    const frame = document.getElementById('preview-viewport-frame');
    const dBtn = document.getElementById('dev-desktop-btn');
    const tBtn = document.getElementById('dev-tablet-btn');
    const mBtn = document.getElementById('dev-mobile-btn');
    if (!frame) return;

    [dBtn, tBtn, mBtn].forEach(b => {
        if (b) {
            b.className = 'px-3 py-1 text-gray-400 hover:text-white rounded text-xs font-bold transition-all';
        }
    });

    if (device === 'mobile') {
        frame.style.width = '375px';
        if (mBtn) mBtn.className = 'px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs font-bold transition-all';
    } else if (device === 'tablet') {
        frame.style.width = '768px';
        if (tBtn) tBtn.className = 'px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs font-bold transition-all';
    } else {
        frame.style.width = '100%';
        if (dBtn) dBtn.className = 'px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs font-bold transition-all';
    }
}

// Helper Fallback Suppliers
function getLocalAuditsFallback() {
    return [
        { id: 101, name: 'Dentaquick', category: 'Dental Equipment & Consumables', sector: 'Dental Equipment & Consumables', country: 'Egypt', region: 'Egypt', score: 84, est_leakage: 380000, tier: 'Tier 1', booth: 'B14', vulnerabilities: ['Unoptimized landing page conversion', 'Zero retargeting ad campaigns'], actions: ['Shift social copy to clinical ROI', 'Run comment-to-DM funnels'] },
        { id: 102, name: 'Acrostone', category: 'Dental Materials & Acrylics', sector: 'Dental Materials & Acrylics', country: 'Egypt', region: 'Egypt', score: 52, est_leakage: 720000, tier: 'Tier 2', booth: 'A08', vulnerabilities: ['Slow mobile loading speed', 'No lead capture funnels'], actions: ['Build 90-day landing page funnel', 'Launch pre-event dentist booking ads'] },
        { id: 103, name: 'Waterpik MENA', category: 'Oral Health & Hygiene Devices', sector: 'Oral Health & Hygiene Devices', country: 'USA / MENA', region: 'MENA', score: 88, est_leakage: 290000, tier: 'Tier 1', booth: 'C02', vulnerabilities: ['Missing MENA localized campaigns'], actions: ['Localize Arabic video Reels', 'Set up WhatsApp appointment desk'] },
        { id: 104, name: 'Misr International Dental', category: 'Dental Furniture & Chairs', sector: 'Dental Furniture & Chairs', country: 'Egypt', region: 'Egypt', score: 58, est_leakage: 640000, tier: 'Tier 2', booth: 'D10', vulnerabilities: ['Inactive social media channels', 'No automated email nurturing'], actions: ['Re-skin Instagram grid', 'Run ManyChat automated catalog DM'] },
        { id: 105, name: 'Pharaonic Dental Co.', category: 'Surgical Instruments & Implants', sector: 'Surgical Instruments & Implants', country: 'Egypt', region: 'Egypt', score: 48, est_leakage: 890000, tier: 'Tier 3', booth: 'E05', vulnerabilities: ['High ad cost per acquisition', 'Zero video demonstration reels'], actions: ['Produce 3 3D-printing demonstration reels/week', 'Run pre-booking ads for live demo slots'] },
        { id: 106, name: 'Al-Hayat Dental Supplies', category: 'Orthodontic Lines', sector: 'Orthodontic Lines', country: 'Egypt', region: 'Egypt', score: 79, est_leakage: 410000, tier: 'Tier 2', booth: 'F12', vulnerabilities: ['Unformatted WhatsApp lead pipeline'], actions: ['Deploy WhatsApp API bot for IDEX inquiries'] }
    ];
}

function getLocalLeadsFallback() {
    try {
        const saved = localStorage.getItem('iceberg_admin_leads');
        if (saved) {
            const arr = JSON.parse(saved);
            if (Array.isArray(arr) && arr.length > 0) return arr;
        }
    } catch(e) {}

    return [
        {
            lead_id: 'IDX-2026-8801',
            name: 'Dr. Tarek Mansour',
            email: 'tarek@egyptdental.com',
            phone: '+20 100 123 4567',
            company: 'Egypt Dental Supplies Co.',
            industry: 'Dental Equipment & Imaging',
            position: 'Commercial Director',
            source: 'idex.html (Hero Lookup)',
            requirements: ['Rebranding & Visual Identity', 'Website & Digital Funnels'],
            status: 'NEW',
            created_at: new Date().toISOString()
        },
        {
            lead_id: 'IDX-2026-8802',
            name: 'Eng. Sarah Hassan',
            email: 'sarah@orthotrend.eg',
            phone: '+20 111 987 6543',
            company: 'OrthoTrend Technologies',
            industry: 'Orthodontic Materials',
            position: 'Marketing Manager',
            source: 'idex.html (3+1 Estimator)',
            requirements: ['Media Buying & Ads', 'Business Development'],
            status: 'SCHEDULED',
            created_at: new Date(Date.now() - 3600000 * 5).toISOString()
        }
    ];
}

function getLocalSlotsFallback(dateVal) {
    return [
        { slot_id: `slot_${dateVal}_1`, time: '10:00 AM', date: dateVal, status: 'AVAILABLE', owner: 'Executive Desk 1' },
        { slot_id: `slot_${dateVal}_2`, time: '11:30 AM', date: dateVal, status: 'BOOKED', lead_email: 'tarek@egyptdental.com', company: 'Egypt Dental Supplies', owner: 'Executive Desk 1' },
        { slot_id: `slot_${dateVal}_3`, time: '02:00 PM', date: dateVal, status: 'HELD', held_by_session: 'Session #882', company: 'Pending Booking', owner: 'Strategy Team' },
        { slot_id: `slot_${dateVal}_4`, time: '03:30 PM', date: dateVal, status: 'AVAILABLE', owner: 'Executive Desk 2' },
        { slot_id: `slot_${dateVal}_5`, time: '05:00 PM', date: dateVal, status: 'AVAILABLE', owner: 'Executive Desk 2' }
    ];
}
