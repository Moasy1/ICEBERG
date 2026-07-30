// CMS Integration for Iceberg Agency Website
// This file handles dynamic content loading from the backend API

class CMSManager {
    constructor() {
        this.apiBase = '/api';
        this.cache = new Map();
        this.currentLang = 'en';
        this.content = {};
        this.projects = [];
        this.services = [];
    }

    // Initialize CMS and load all content
    async initialize() {
        console.log('CMS Manager initializing...');
        try {
            await Promise.all([
                this.loadContent(),
                this.loadProjects(),
                this.loadServices()
            ]);
            this.updateFrontend();
            console.log('CMS initialized successfully');
        } catch (error) {
            console.error('CMS initialization failed:', error);
            // Fallback to static content if CMS fails
            this.loadFallbackContent();
        }
    }

    // Load general content
    async loadContent() {
        try {
            const response = await fetch(`${this.apiBase}/content?lang=${this.currentLang}`);
            const result = await response.json();

            if (result.success) {
                this.content = result.data;
            } else {
                console.error('API returned error:', result.error);
                this.loadFallbackContent();
            }
        } catch (error) {
            console.error('Error loading content:', error);
            this.loadFallbackContent();
        }
    }

    // Load projects
    async loadProjects() {
        try {
            const response = await fetch(`${this.apiBase}/projects?lang=${this.currentLang}&status=published`);
            const result = await response.json();

            if (result.success) {
                this.projects = result.data;
            }
        } catch (error) {
            console.error('Error loading projects:', error);
        }
    }

    // Load services
    async loadServices() {
        try {
            const response = await fetch(`${this.apiBase}/services?lang=${this.currentLang}&status=published`);
            const result = await response.json();

            if (result.success) {
                this.services = result.data;
            }
        } catch (error) {
            console.error('Error loading services:', error);
        }
    }

    // Update frontend with CMS content
    updateFrontend() {
        this.updateNavigation();
        this.updateHeroSection();
        this.updateServicesSection();
        this.updateProjectsSection();
        this.updateShowcaseSection();
        this.updateClientsSection();
        this.updateContactSection();
        this.updateFooter();
    }

    // Update navigation content
    updateNavigation() {
        const navItems = [
            'nav_services', 'nav_process', 'nav_work', 'nav_about', 'nav_contact'
        ];

        navItems.forEach(item => {
            const elements = document.querySelectorAll(`[data-i18n="${item}"]`);
            elements.forEach(el => {
                if (this.content[item]) {
                    el.textContent = this.content[item];
                }
            });
        });
    }

    // Update hero section
    updateHeroSection() {
        const heroElements = {
            'hero_badge': '.hero-badges span',
            'hero_title_1': '.hero-content h1 span:first-child',
            'hero_title_2': '.hero-content .ice-gradient-text',
            'hero_subtitle': '.hero-content p'
        };

        Object.entries(heroElements).forEach(([key, selector]) => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (this.content[key]) {
                    el.textContent = this.content[key];
                }
            });
        });
    }

    // Update services section dynamically
    updateServicesSection() {
        const servicesContainer = document.querySelector('#services .grid');
        if (!servicesContainer || this.services.length === 0) return;

        servicesContainer.innerHTML = this.services.map((service, index) => `
            <div class="service-card glass-card p-8 rounded-2xl hover:bg-white/5 transition-all duration-300 group cursor-pointer border-t-2 border-transparent hover:border-cyan-400 ${index === 1 ? 'md:mt-8' : ''}">
                <div class="w-14 h-14 bg-${service.iconColor || 'cyan'}-600/20 rounded-xl flex items-center justify-center text-${service.iconColor || 'cyan'}-400 mb-6 group-hover:scale-110 transition-transform">
                    <i data-lucide="${service.icon}" class="w-7 h-7"></i>
                </div>
                <h3 class="text-xl font-bold mb-3">${service.title}</h3>
                <p class="text-gray-400 leading-relaxed">${service.shortDescription}</p>
            </div>
        `).join('');

        // Reinitialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    // Update projects section dynamically
    updateProjectsSection() {
        const projectsContainer = document.querySelector('#portfolio .grid');
        if (!projectsContainer || this.projects.length === 0) return;

        projectsContainer.innerHTML = this.projects.map((project, index) => `
            <div class="group relative overflow-hidden rounded-2xl h-80 cursor-pointer ${index === 2 ? 'md:col-span-2 lg:col-span-1' : ''}">
        // Define a mapping for category to Lucide icon, or use a default
        const icons = {
            'Video & Photography': 'video',
            'Branding & Identity': 'hard-hat',
            'Meta Ads': 'facebook',
            'Visual Design': 'music',
            'Logo & Branding': 'coffee',
            'Web Development': 'code',
            'SEO': 'search',
            'Social Media': 'megaphone'
        };

        projectsContainer.innerHTML = this.projects.map((project, index) => {
            const iconHtml = project.clientLogo
                ? `< img src = "${project.clientLogo}" alt = "${project.title} Logo" class= "w-12 h-12 object-contain brightness-0 invert opacity-80 group-hover:opacity-100 group-hover:brightness-100 group-hover:invert-0 transition-all duration-300" > `
                : `< i data - lucide="${icons[project.category] || 'briefcase'}" class= "w-12 h-12 text-gray-600" ></i > `;

            return `
        < div class= "group relative overflow-hidden rounded-2xl h-80 cursor-pointer ${index === 2 ? 'md:col-span-2 lg:col-span-1' : ''}" >
                    <div class="absolute inset-0 bg-gray-800 transition-transform duration-500 group-hover:scale-105">
                        <div class="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                            ${iconHtml}
                        </div>
                    </div>
                    <div class="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent p-6 flex flex-col justify-end translate-y-4 group-hover:translate-y-0 transition-transform">
                        <span class="text-cyan-400 text-xs font-bold uppercase mb-2">${project.category}</span>
                        <h3 class="text-xl font-bold text-white">${project.title}</h3>
                        <p class="text-gray-400 text-sm mt-2 opacity-0 group-hover:opacity-100 transition-opacity">${project.description}</p>
                    </div>
                </div >
            `;
        }).join('');

        // Reinitialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    // Update showcase marquee
    updateShowcaseSection() {
        const showcaseTrack = document.querySelector('.showcase-track');
        if (!showcaseTrack || !this.content['gallery_showcase']) return;

        try {
            const images = JSON.parse(this.content['gallery_showcase']);
            // Create double set for seamless scroll
            const allImages = [...images, ...images];
            showcaseTrack.innerHTML = allImages.map(img => `
            < div class= "showcase-item w-[300px] h-[200px] flex-shrink-0" >
            <img src="${img}" alt="Showcase Work" class="w-full h-full object-cover rounded-xl shadow-lg">
            </div>
            `).join('');
        } catch (e) {
            console.error('Error updating showcase marquee:', e);
        }
    }

    // Update clients marquee
    updateClientsSection() {
        const marqueeTrack = document.querySelector('.marquee-track');
        if (!marqueeTrack || !this.content['gallery_clients']) return;

        try {
            const logos = JSON.parse(this.content['gallery_clients']);
            // Create multiple sets for seamless scroll if needed
            const allLogos = [...logos, ...logos, ...logos];
            marqueeTrack.innerHTML = allLogos.map(logo => `
            < div class= "marquee-item px-8 flex-shrink-0" >
            <img src="${logo}" alt="Client Logo" class="h-12 w-auto grayscale brightness-0 invert opacity-50 hover:opacity-100 transition-opacity duration-300">
            </div>
            `).join('');
        } catch (e) {
            console.error('Error updating clients marquee:', e);
        }
    }

    // Update contact section
    updateContactSection() {
        const contactElements = {
            'contact_title': '#contact h2',
            'contact_sub': '#contact p',
            'form_name': 'label[for="name"]',
            'form_email': 'label[for="email"]',
            'form_message': 'label[for="message"]',
            'form_submit': 'button[type="submit"]'
        };

        Object.entries(contactElements).forEach(([key, selector]) => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (this.content[key]) {
                    if (el.tagName === 'LABEL') {
                        el.textContent = this.content[key];
                    } else {
                        el.textContent = this.content[key];
                    }
                }
            });
        });
    }

    // Update footer content
    updateFooter() {
        const footerElements = {
            'footer_quick': 'h4',
            'footer_legal': 'h4',
            'footer_social': 'h4'
        };

        Object.entries(footerElements).forEach(([key, selector]) => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (this.content[key]) {
                    el.textContent = this.content[key];
                }
            });
        });
    }

    // Language switching
    async switchLanguage(lang) {
        this.currentLang = lang;
        await this.initialize();

        // Update language button
        const langLabel = document.getElementById('lang-label');
        const mobileLangLabel = document.getElementById('mobile-lang-label');

        if (langLabel) langLabel.textContent = lang === 'ar' ? 'English' : 'العربية';
        if (mobileLangLabel) mobileLangLabel.textContent = lang === 'ar' ? 'English' : 'العربية';

        // Update document direction
        document.body.classList.toggle('rtl', lang === 'ar');
        document.body.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    }

    // Load fallback content if CMS fails
    loadFallbackContent() {
        this.content = this.getFallbackContent();
        this.projects = this.getFallbackProjects();
        this.services = this.getFallbackServices();
        this.updateFrontend();
    }

    getFallbackContent() {
        return {
            nav_services: 'Services',
            nav_process: 'Process',
            nav_work: 'Work',
            nav_about: 'About',
            nav_contact: 'Contact',
            hero_badge: 'DIGITAL GROWTH AGENCY',
            hero_title_1: 'We Reveal Your',
            hero_title_2: 'Hidden Potential.',
            hero_subtitle: 'Like an iceberg, your brand has depth. We help you showcase the massive value lying beneath the surface.',
            who_we_are_text: 'Iceberg Marketing is a dynamic marketing agency dedicated to uncovering the hidden potential within brands. Our team of passionate creatives, strategists, and innovators strives to craft unique narratives that drive results.',
            mission_text: 'At Iceberg Marketing, our mission is to be more than just a marketing agency: we are dedicated business partners to every client we serve. We are committed to delving deep into the essence of each business we handle, constantly seeking the most effective and innovative strategies to market and develop their unique brand.',
            mission_text_2: 'Our goal is to foster long-term success for our clients by aligning our expertise with their vision, and together, breaking through the surface to reveal the full potential of their business.',
            vision_text: "At Iceberg Marketing, our vision is to be the guiding force that unveils the hidden potential in every client's digital presence. With our extensive knowledge and expertise in digital marketing, we aim to lead our clients to discover the unseen opportunities that lie beneath the surface.",
            vision_text_2: 'We strive to be the catalyst for their success, revealing the hidden depths of their brand and propelling them to new heights in the digital landscape.',
            contact_title: "Let's Break the Ice",
            contact_sub: 'Ready to grow? Send us a message.',
            form_name: 'Name',
            form_email: 'Email',
            form_message: 'Message',
            form_submit: 'Send Message'
        };
    }

    getFallbackProjects() {
        return [
            {
                title: 'Drum Shop Egypt',
                category: 'Video & Photography',
                description: 'Professional video production and high-end instrument photography.',
                icon: 'video'
            },
            {
                title: 'Saheel Construction',
                category: 'Branding & Identity',
                description: 'Comprehensive brand identity systems for industrial leaders.',
                icon: 'hard-hat'
            },
            {
                title: 'Performance Campaigns',
                category: 'Meta Ads',
                description: 'Data-driven advertising strategies yielding 5x higher engagement.',
                icon: 'facebook'
            },
            {
                title: 'Ghost Note Music',
                category: 'Visual Design',
                description: 'Creative visuals and digital assets for music retail.',
                icon: 'music'
            },
            {
                title: 'FMS Coffee Shop',
                category: 'Logo & Branding',
                description: 'Unique identity crafting for premium coffee brands.',
                icon: 'coffee'
            }
        ];
    }

    getFallbackServices() {
        return [
            {
                title: 'SEO & Visibility',
                shortDescription: 'Get found by the right people. We optimize your structure deep down to dominate search results.',
                icon: 'search',
                iconColor: 'blue'
            },
            {
                title: 'Social Media',
                shortDescription: 'Engaging content that floats to the top of the feed. Build a loyal community around your brand.',
                icon: 'megaphone',
                iconColor: 'cyan'
            },
            {
                title: 'Web Development',
                shortDescription: 'Fast, secure, and beautiful websites built on solid foundations, just like an iceberg.',
                icon: 'code',
                iconColor: 'purple'
            }
        ];
    }

    // Handle contact form submission
    async submitContactForm(formData) {
        try {
            const metaEventId = `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const payload = { ...formData, eventId: metaEventId };

            if (typeof window.trackMetaEvent === 'function') {
                window.trackMetaEvent('Contact', {
                    content_name: 'General Contact Form'
                }, {
                    email: formData.email,
                    phone: formData.phone,
                    name: formData.name,
                    company: formData.company
                }, metaEventId);
            }

            const response = await fetch(`${this.apiBase}/contact/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification(result.message, 'success');
                return true;
            } else {
                this.showNotification(result.error, 'error');
                return false;
            }
        } catch (error) {
            console.error('Error submitting contact form:', error);
            this.showNotification('Failed to send message. Please try again.', 'error');
            return false;
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
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
}

// Initialize CMS when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    window.cmsManager = new CMSManager();

    // Initialize CMS
    window.cmsManager.initialize();

    // Override language toggle function
    window.toggleLanguage = function () {
        console.log('Language toggle clicked');
        const currentLang = window.cmsManager ? window.cmsManager.currentLang : (window.currentLang || 'en');
        const newLang = currentLang === 'en' ? 'ar' : 'en';

        console.log('Current lang:', currentLang, 'New lang:', newLang);

        if (window.cmsManager) {
            console.log('Using CMS manager to switch language');
            window.cmsManager.switchLanguage(newLang);
        } else {
            console.log('CMS manager not available, using fallback');
            // Fallback to original language switching
            window.currentLang = newLang;
            if (typeof updateContent === 'function') {
                updateContent();
            }
        }
    };

    // Override contact form submission
    const contactForm = document.querySelector('#contact form');
    if (contactForm) {
        contactForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const formData = {
                name: this.querySelector('input[type="text"]').value,
                email: this.querySelector('input[type="email"]').value,
                message: this.querySelector('textarea').value,
                phone: this.querySelector('input[name="phone"]')?.value || '',
                company: this.querySelector('input[name="company"]')?.value || ''
            };

            const success = await window.cmsManager.submitContactForm(formData);
            if (success) {
                this.reset();
            }
        });
    }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CMSManager;
}
