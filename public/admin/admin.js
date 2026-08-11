// Initialize Lucide icons
lucide.createIcons();

// API Base URL
const API_BASE = '/api';

// Current editing state
let currentEditId = null;
let currentEditType = null;

// Initialize dashboard with Auth Guard
document.addEventListener('DOMContentLoaded', function () {
    checkAuth();
});

// Authentication Handlers
function checkAuth() {
    const isAuthenticated = sessionStorage.getItem('iceberg_admin_auth') === 'true';
    const loginModal = document.getElementById('login-modal');

    if (isAuthenticated) {
        if (loginModal) loginModal.classList.add('hidden');
        loadDashboardData();
        setupEventListeners();
    } else {
        if (loginModal) loginModal.classList.remove('hidden');
    }
    lucide.createIcons();
}

function handleLogin(event) {
    if (event) event.preventDefault();
    const userEl = document.getElementById('login-username');
    const passEl = document.getElementById('login-password');
    const errEl = document.getElementById('login-error');

    const username = (userEl ? userEl.value : '').trim();
    const password = (passEl ? passEl.value : '').trim();

    if (username.toLowerCase() === 'admin' && password === 'iceberg-dev') {
        sessionStorage.setItem('iceberg_admin_auth', 'true');
        if (errEl) errEl.classList.add('hidden');
        const loginModal = document.getElementById('login-modal');
        if (loginModal) loginModal.classList.add('hidden');
        loadDashboardData();
        setupEventListeners();
        showNotification('Successfully authenticated! Welcome, Admin.', 'success');
        lucide.createIcons();
    } else {
        if (errEl) {
            errEl.textContent = 'Invalid username or password. Please try again.';
            errEl.classList.remove('hidden');
        }
        showNotification('Invalid admin credentials', 'error');
    }
}

// Setup event listeners
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
        case 'idex-audits':
            loadIdexAudits();
            break;
        case 'idex-leads':
            loadIdexLeads();
            break;
        case 'idex-calendar':
            loadIdexCalendar();
            break;
    }
    lucide.createIcons();
}

// Dashboard Functions
async function loadDashboardData() {
    try {
        const [contentRes, projectsRes, servicesRes, contactsRes] = await Promise.all([
            fetch(`${API_BASE}/content`),
            fetch(`${API_BASE}/projects`),
            fetch(`${API_BASE}/services`),
            fetch(`${API_BASE}/contact/submissions`)
        ]);

        const content = await contentRes.json();
        const projects = await projectsRes.json();
        const services = await servicesRes.json();
        const contacts = await contactsRes.json();

        document.getElementById('content-count').textContent = content.data ? Object.keys(content.data).length : 0;
        document.getElementById('projects-count').textContent = projects.data ? projects.data.length : 0;
        document.getElementById('services-count').textContent = services.data ? services.data.length : 0;
        document.getElementById('contacts-count').textContent = contacts.data ? contacts.data.length : 0;

        // Load recent activity
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
let allAdminAudits = [];

async function loadIdexAudits() {
    const tbody = document.getElementById('idex-audits-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" class="p-6 text-center text-cyan-400 animate-pulse">Loading IDEX exhibitor audit database...</td></tr>';

    try {
        const res = await fetch('/IDEX Event/data.json');
        allAdminAudits = await res.json();
        renderAdminAudits(allAdminAudits);
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-6 text-center text-red-400">Failed to load exhibitor database.</td></tr>';
    }
}

function renderAdminAudits(audits) {
    const tbody = document.getElementById('idex-audits-tbody');
    if (!tbody) return;

    if (!Array.isArray(audits) || audits.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-6 text-center text-gray-400">No exhibitors match your filter.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    audits.forEach(item => {
        const tr = document.createElement('tr');
        tr.className = 'table-row border-b border-slate-800 hover:bg-slate-800/40 transition-colors';

        let scoreBadge = `<span class="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs font-bold font-mono">${item.score}/100</span>`;
        if (item.score < 60) scoreBadge = `<span class="px-2.5 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs font-bold font-mono">${item.score}/100</span>`;
        else if (item.score < 80) scoreBadge = `<span class="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-xs font-bold font-mono">${item.score}/100</span>`;

        const leakageStr = item.est_leakage ? `${item.est_leakage.toLocaleString()} EGP` : '—';
        const clientUrl = `/IDEX Event/index.html?company=${encodeURIComponent(item.name)}`;

        tr.innerHTML = `
            <td class="p-4">
                <div class="font-bold text-white text-base">${item.name}</div>
                <div class="text-xs text-slate-400">${item.hall || 'IDEX 2026 Hall'} | Stand ${item.booth || 'TBD'}</div>
            </td>
            <td class="p-4 text-xs">
                <span class="px-2 py-0.5 bg-slate-800 text-cyan-400 rounded font-semibold">${item.category || 'Dental Equipment'}</span>
                <div class="text-gray-400 mt-0.5">${item.country || 'International'}</div>
            </td>
            <td class="p-4">${scoreBadge}</td>
            <td class="p-4 font-mono font-bold text-red-400 text-xs">${leakageStr}</td>
            <td class="p-4 text-xs text-gray-300 max-w-xs truncate" title="${item.vulnerabilities ? item.vulnerabilities[0] : ''}">
                ${item.vulnerabilities ? item.vulnerabilities[0] : 'N/A'}
            </td>
            <td class="p-4 text-right space-x-2">
                <button onclick="copyAuditLink('${clientUrl}')" class="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500 text-cyan-400 hover:text-slate-950 rounded text-xs font-bold transition-all">
                    🔗 Copy Link
                </button>
                <a href="${clientUrl}" target="_blank" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-gray-200 rounded text-xs font-bold transition-all">
                    👁 View Audit
                </a>
            </td>
        `;
        tbody.appendChild(tr);
    });
    lucide.createIcons();
}

function filterAdminAudits() {
    const q = (document.getElementById('admin-audit-search')?.value || '').toLowerCase().trim();
    if (!q) {
        renderAdminAudits(allAdminAudits);
        return;
    }
    const filtered = allAdminAudits.filter(a => 
        (a.name && a.name.toLowerCase().includes(q)) ||
        (a.category && a.category.toLowerCase().includes(q)) ||
        (a.country && a.country.toLowerCase().includes(q))
    );
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

// Updated IDEX Leads function with Fallback Sample Data
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

    // Fallback active demonstration records if MongoDB has no entries yet
    if (leads.length === 0) {
        leads = [
            {
                lead_id: 'IDX-2026-8801',
                name: 'Dr. Tarek Mansour',
                email: 'tarek@egyptdental.com',
                phone: '+20 100 123 4567',
                company: 'Egypt Dental Supplies Co.',
                industry: 'Dental Equipment & Imaging',
                position: 'Commercial Director',
                source: 'idex.html (Hero Lookup)',
                requirements: ['Rebranding & Visual Identity', 'Website & Digital Funnels', 'Exhibition Printing'],
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
                requirements: ['Media Buying & Ads', 'Business Development & Consulting'],
                status: 'SCHEDULED',
                created_at: new Date(Date.now() - 3600000 * 5).toISOString()
            }
        ];
    }

    const countEl = document.getElementById('idex-leads-count');
    if (countEl) countEl.textContent = leads.length;

    tbody.innerHTML = '';
    leads.forEach(lead => {
        const tr = document.createElement('tr');
        tr.className = 'table-row border-b border-slate-800 hover:bg-slate-800/40 transition-colors';

        const reqList = Array.isArray(lead.requirements) ? lead.requirements.join(', ') : (lead.requirements || 'IDEX Audit Package');
        const dateStr = lead.created_at ? new Date(lead.created_at).toLocaleDateString() : new Date().toLocaleDateString();

        let statusBadge = '<span class="px-2 py-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded text-xs font-bold">NEW</span>';
        if (lead.status === 'SCHEDULED') statusBadge = '<span class="px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-xs font-bold">SCHEDULED</span>';

        tr.innerHTML = `
            <td class="p-4 font-mono text-xs">
                <div class="font-bold text-white">${lead.lead_id || 'IDEX Lead'}</div>
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
                <span class="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono border border-slate-700">${lead.source || 'idex'}</span>
            </td>
            <td class="p-4 text-xs text-gray-300 max-w-xs truncate" title="${reqList}">${reqList}</td>
            <td class="p-4">${statusBadge}</td>
            <td class="p-4 text-right space-x-2">
                ${lead.phone ? `<a href="https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}" target="_blank" class="px-2.5 py-1 bg-green-600/30 text-green-400 hover:bg-green-600 hover:text-white rounded text-xs font-bold transition-all inline-block">WhatsApp</a>` : ''}
                ${lead.email ? `<a href="mailto:${lead.email}" class="px-2.5 py-1 bg-blue-600/30 text-blue-400 hover:bg-blue-600 hover:text-white rounded text-xs font-bold transition-all inline-block">Email</a>` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });
    lucide.createIcons();
}

// Updated IDEX Calendar function with Fallback Sample Data
async function loadIdexCalendar() {
    const tbody = document.getElementById('idex-calendar-tbody');
    const dateInput = document.getElementById('admin-cal-date-filter');
    if (!tbody) return;

    const dateVal = dateInput && dateInput.value ? dateInput.value : new Date().toISOString().split('T')[0];
    if (dateInput && !dateInput.value) dateInput.value = dateVal;

    tbody.innerHTML = '<tr><td colspan="6" class="p-6 text-center text-cyan-400 animate-pulse">Loading meeting slots...</td></tr>';

    let slots = [];
    try {
        const res = await fetch(`/api/calendar/slots?date=${dateVal}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.slots) && data.slots.length > 0) {
            slots = data.slots;
        }
    } catch (e) {}

    // Fallback demonstration schedule slots if none returned for date
    if (slots.length === 0) {
        slots = [
            { slot_id: 'slot_1', time: '10:00 AM', date: dateVal, status: 'AVAILABLE', owner: 'Strategy Team' },
            { slot_id: 'slot_2', time: '11:30 AM', date: dateVal, status: 'BOOKED', lead_email: 'tarek@egyptdental.com', company: 'Egypt Dental Supplies', owner: 'Executive Desk' },
            { slot_id: 'slot_3', time: '02:00 PM', date: dateVal, status: 'HELD', held_by_session: 'Session #882', company: 'Pending Booking', owner: 'Strategy Team' },
            { slot_id: 'slot_4', time: '03:30 PM', date: dateVal, status: 'AVAILABLE', owner: 'Strategy Team' },
            { slot_id: 'slot_5', time: '05:00 PM', date: dateVal, status: 'AVAILABLE', owner: 'Strategy Team' }
        ];
    }

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
            <td class="p-4 text-xs text-gray-400 font-mono">${slot.owner || 'Sales Team'}</td>
            <td class="p-4 text-right">
                ${slot.status !== 'AVAILABLE' ? `<button onclick="releaseAdminSlot('${slot.slot_id}', '${dateVal}')" class="px-3 py-1 bg-red-600/30 text-red-400 hover:bg-red-600 hover:text-white rounded text-xs font-bold transition-all">Clear Slot</button>` : '<span class="text-xs text-slate-500 font-bold">Ready</span>'}
            </td>
        `;
        tbody.appendChild(tr);
    });
    lucide.createIcons();
}
