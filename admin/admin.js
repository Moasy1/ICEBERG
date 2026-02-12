// Initialize Lucide icons
lucide.createIcons();

// API Base URL
const API_BASE = '/api';

// Current editing state
let currentEditId = null;
let currentEditType = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Content form submission
    document.getElementById('content-form').addEventListener('submit', handleContentSubmit);
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
    event.target.classList.add('active');
    
    // Load section data
    switch(sectionId) {
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
    }
}

// Dashboard Functions
async function loadDashboardData() {
    try {
        const [contentRes, projectsRes, servicesRes] = await Promise.all([
            fetch(`${API_BASE}/content`),
            fetch(`${API_BASE}/projects`),
            fetch(`${API_BASE}/services`)
        ]);
        
        const content = await contentRes.json();
        const projects = await projectsRes.json();
        const services = await servicesRes.json();
        
        document.getElementById('content-count').textContent = content.data ? Object.keys(content.data).length : 0;
        document.getElementById('projects-count').textContent = projects.data ? projects.data.length : 0;
        document.getElementById('services-count').textContent = services.data ? services.data.length : 0;
        document.getElementById('contacts-count').textContent = '0'; // Will implement later
        
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
            <span class="text-gray-300">System initialized successfully</span>
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
                value: { en: value, ar: value },
                category: 'general' // Default category
            }));
            
            tbody.innerHTML = contentArray.map(item => `
                <tr class="table-row">
                    <td class="px-6 py-4 text-sm text-gray-300">${item.key}</td>
                    <td class="px-6 py-4 text-sm text-gray-300">${item.category}</td>
                    <td class="px-6 py-4 text-sm text-gray-300">${item.value.en}</td>
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

async function editContent(key) {
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
                    <td class="px-6 py-4 text-sm text-gray-300">${project.client}</td>
                    <td class="px-6 py-4 text-sm">
                        <span class="px-2 py-1 text-xs rounded-full ${project.status === 'published' ? 'status-published' : 'status-draft'}">
                            ${project.status}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-sm">
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

function openProjectModal() {
    showNotification('Project editor coming soon!', 'info');
}

function editProject(id) {
    showNotification('Project editor coming soon!', 'info');
}

async function deleteProject(id) {
    if (confirm('Are you sure you want to delete this project?')) {
        try {
            const response = await fetch(`${API_BASE}/projects/${id}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                loadProjects();
                showNotification('Project deleted successfully!', 'success');
            } else {
                showNotification('Error deleting project: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Error deleting project:', error);
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
                    <td class="px-6 py-4 text-sm text-gray-300">${service.title}</td>
                    <td class="px-6 py-4 text-sm text-gray-300">${service.icon}</td>
                    <td class="px-6 py-4 text-sm">
                        <span class="px-2 py-1 text-xs rounded-full ${service.featured ? 'status-published' : 'status-draft'}">
                            ${service.featured ? 'Yes' : 'No'}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-300">${service.order}</td>
                    <td class="px-6 py-4 text-sm">
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
        document.getElementById('services-table-body').innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-red-400">Error loading services</td></tr>';
    }
}

function openServiceModal() {
    showNotification('Service editor coming soon!', 'info');
}

function editService(id) {
    showNotification('Service editor coming soon!', 'info');
}

async function deleteService(id) {
    if (confirm('Are you sure you want to delete this service?')) {
        try {
            const response = await fetch(`${API_BASE}/services/${id}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                loadServices();
                showNotification('Service deleted successfully!', 'success');
            } else {
                showNotification('Error deleting service: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Error deleting service:', error);
            showNotification('Error deleting service', 'error');
        }
    }
}

// Contacts Functions
async function loadContacts() {
    const tbody = document.getElementById('contacts-table-body');
    tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-gray-400">Contact messages will appear here</td></tr>';
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
