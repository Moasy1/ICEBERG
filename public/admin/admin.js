// Initialize Lucide icons
lucide.createIcons();

// API Base URL
const API_BASE = '/api';

// Current editing state
let currentEditId = null;
let currentEditType = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function () {
    loadDashboardData();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Content form submission
    document.getElementById('content-form').addEventListener('submit', handleContentSubmit);
    // Project form submission
    document.getElementById('project-form').addEventListener('submit', handleProjectSubmit);
    // Service form submission
    document.getElementById('service-form').addEventListener('submit', handleServiceSubmit);
}

// Navigation
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('hidden');
    });

    // Show selected section
    document.getElementById(sectionId).classList.remove('hidden');

    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Fallback if event is not passed (direct call)
    if (window.event && window.event.target) {
        window.event.target.classList.add('active');
    }

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
    }
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

// Contacts Functions... (existing)

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
        window.location.href = '../index.html';
    }
}
