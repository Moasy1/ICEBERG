/**
 * Iceberg Digital Agency - Meta Pixel & Conversions API (CAPI) Tracking Manager
 * Client-Side Pixel loader, cookie manager (_fbp/_fbc), and dual-tracking event dispatcher.
 */
(function (window, document) {
    'use strict';

    // Cookie Utilities
    function getCookie(name) {
        const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
        return match ? decodeURIComponent(match[1]) : null;
    }

    function setCookie(name, value, days = 90) {
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
    }

    // Auto Manage _fbc Cookie from URL query parameter ?fbclid=...
    function initFbcCookie() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const fbclid = urlParams.get('fbclid');
            if (fbclid) {
                const timestamp = Date.now();
                const fbcValue = `fb.1.${timestamp}.${fbclid}`;
                setCookie('_fbc', fbcValue, 90);
            }
        } catch (e) {
            console.warn('[Meta Pixel] Error initializing _fbc cookie:', e);
        }
    }

    // Auto Manage _fbp Cookie if not present
    function initFbpCookie() {
        try {
            if (!getCookie('_fbp')) {
                const timestamp = Date.now();
                const randomNum = Math.floor(Math.random() * 10000000000);
                const fbpValue = `fb.1.${timestamp}.${randomNum}`;
                setCookie('_fbp', fbpValue, 90);
            }
        } catch (e) {
            console.warn('[Meta Pixel] Error initializing _fbp cookie:', e);
        }
    }

    // Initialize cookies on script load
    initFbcCookie();
    initFbpCookie();

    // Event ID generator for client-server deduplication
    function generateEventId() {
        return `meta_evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Standard Facebook Pixel Loader Stub
    function initFBQStub() {
        if (window.fbq) return;
        const n = window.fbq = function () {
            n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!window._fbq) window._fbq = n;
        n.push = n;
        n.loaded = true;
        n.version = '2.0';
        n.queue = [];
    }

    // Load actual Meta Pixel Script dynamically if Pixel ID is configured
    function loadPixelScript(pixelId) {
        if (!pixelId || document.getElementById('meta-pixel-script')) return;
        initFBQStub();
        
        const script = document.createElement('script');
        script.id = 'meta-pixel-script';
        script.async = true;
        script.src = 'https://connect.facebook.net/en_US/fbevents.js';
        const firstScript = document.getElementsByTagName('script')[0];
        if (firstScript && firstScript.parentNode) {
            firstScript.parentNode.insertBefore(script, firstScript);
        } else {
            document.head.appendChild(script);
        }

        window.fbq('set', 'autoConfig', 'false', pixelId);
        window.fbq('init', pixelId);
        window.fbq('track', 'PageView');
    }

    const DEFAULT_PIXEL_ID = '2557716128012185';

    // Check for Pixel ID via window configuration or fetch server status
    function initMetaPixel() {
        // Priority 1: Global window variable window.FB_PIXEL_ID or window.META_PIXEL_ID
        const globalPixelId = window.FB_PIXEL_ID || window.META_PIXEL_ID;
        if (globalPixelId) {
            loadPixelScript(globalPixelId);
            return;
        }

        // Priority 2: Query API status endpoint
        fetch('/api/meta/status')
            .then(res => res.json())
            .then(res => {
                if (res.success && res.data && res.data.pixelId) {
                    loadPixelScript(res.data.pixelId);
                } else if (DEFAULT_PIXEL_ID) {
                    loadPixelScript(DEFAULT_PIXEL_ID);
                }
            })
            .catch(() => {
                // Backend endpoint unreachable or static deployment mode
                if (DEFAULT_PIXEL_ID) {
                    loadPixelScript(DEFAULT_PIXEL_ID);
                }
            });
    }

    /**
     * Unified Event Dispatcher (Client Pixel + Server CAPI)
     * @param {string} eventName - Standard Meta Event (e.g., PageView, Lead, Contact, Schedule, ViewContent)
     * @param {Object} [customData] - Event payload (value, currency, content_name, etc.)
     * @param {Object} [userData] - Optional user details for matching (email, phone, name)
     * @param {string} [eventId] - Unique event ID for deduplication
     * @returns {string} The eventId used for deduplication
     */
    window.trackMetaEvent = function (eventName, customData = {}, userData = {}, eventId = null) {
        const finalEventId = eventId || generateEventId();
        const fbp = getCookie('_fbp');
        const fbc = getCookie('_fbc');

        const mergedUserData = {
            fbp,
            fbc,
            ...userData
        };

        // 1. Client-side Meta Pixel dispatch (if pixel loaded)
        if (typeof window.fbq === 'function') {
            try {
                window.fbq('track', eventName, customData || {}, { eventID: finalEventId });
            } catch (e) {
                console.warn('[Meta Pixel Track Error]:', e);
            }
        }

        // 2. Server-side Conversions API (CAPI) dispatch for 100% dual tracking reliability
        try {
            fetch('/api/meta/event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventName,
                    eventId: finalEventId,
                    eventSourceUrl: window.location.href,
                    userData: mergedUserData,
                    customData: customData || {}
                })
            }).catch(err => {
                console.warn('[Meta CAPI Dispatch Notice]: Server event endpoint unreachable or static mode.', err);
            });
        } catch (e) {
            console.warn('[Meta CAPI Fetch Exception]:', e);
        }

        return finalEventId;
    };

    // Helper event shortcuts
    window.trackMetaPageView = function () {
        return window.trackMetaEvent('PageView');
    };

    window.trackMetaLead = function (leadData = {}, userData = {}, eventId = null) {
        return window.trackMetaEvent('Lead', leadData, userData, eventId);
    };

    window.trackMetaContact = function (contactData = {}, userData = {}, eventId = null) {
        return window.trackMetaEvent('Contact', contactData, userData, eventId);
    };

    window.trackMetaSchedule = function (scheduleData = {}, userData = {}, eventId = null) {
        return window.trackMetaEvent('Schedule', scheduleData, userData, eventId);
    };

    window.trackMetaViewContent = function (contentData = {}, eventId = null) {
        return window.trackMetaEvent('ViewContent', contentData, {}, eventId);
    };

    // Automatic Event Tracking Suite for Forms, Buttons, and User Interactions
    function setupAutoTracking() {
        // 1. Auto Track All Form Submissions across the site as official "Lead" & "Contact" events
        document.addEventListener('submit', function (e) {
            try {
                const form = e.target;
                if (!form || form.getAttribute('data-meta-tracked') === 'true') return;

                const formData = new FormData(form);
                const email = formData.get('email') || form.querySelector('input[type="email"]')?.value || '';
                const phone = formData.get('phone') || form.querySelector('input[type="tel"]')?.value || '';
                const name = formData.get('name') || form.querySelector('input[name="name"]')?.value || '';
                const business = formData.get('business_name') || form.querySelector('input[name="business_name"]')?.value || '';
                const service = formData.get('service') || form.querySelector('select')?.value || 'General Service';

                const userData = { email, phone, name };
                const customData = {
                    form_id: form.id || 'contact_form',
                    business_name: business,
                    service_requested: service,
                    page_path: window.location.pathname
                };

                window.trackMetaEvent('Lead', customData, userData);
                window.trackMetaEvent('Contact', customData, userData);
                form.setAttribute('data-meta-tracked', 'true');
            } catch (err) {
                console.warn('[Meta Auto-Track Form Exception]:', err);
            }
        }, true);

        // 2. Auto Track All Button & CTA Clicks explicitly as Standard Meta Events (Lead / Contact / Schedule / SubmitApplication)
        document.addEventListener('click', function (e) {
            try {
                const target = e.target.closest('a, button, [role="button"]');
                if (!target) return;

                const text = (target.textContent || '').trim().toLowerCase();
                const href = (target.getAttribute('href') || '').toLowerCase();

                // Phone / WhatsApp / Direct Contact Click -> Meta "Contact" Event
                if (href.startsWith('tel:') || href.includes('wa.me') || href.includes('whatsapp') || text.includes('call us') || text.includes('contact us')) {
                    window.trackMetaEvent('Contact', { method: href.startsWith('tel:') ? 'phone' : 'whatsapp', click_text: text });
                }
                // Schedule / Book Consultation Click -> Meta "Schedule" Event
                else if (text.includes('schedule') || text.includes('book') || text.includes('consultation') || text.includes('appointment')) {
                    window.trackMetaEvent('Schedule', { click_text: text, page_path: window.location.pathname });
                }
                // Start Project / Submit Application Click -> Meta "SubmitApplication" & "Lead" Events
                else if (text.includes('start project') || text.includes('start your project') || text.includes('get started')) {
                    window.trackMetaEvent('SubmitApplication', { click_text: text, page_path: window.location.pathname });
                    window.trackMetaEvent('Lead', { click_text: text, page_path: window.location.pathname });
                }
                // Birthday Deals / Special Offers Click -> Meta "ViewContent" Event
                else if (text.includes('birthday') || text.includes('deal') || text.includes('offer')) {
                    window.trackMetaEvent('ViewContent', { content_name: 'Birthday Deals / Offers', click_text: text });
                }
                // Any other Button or Form Submit Button -> Default Meta "Lead" Event
                else if (target.tagName === 'BUTTON' || target.type === 'submit' || target.classList.contains('btn') || target.classList.contains('button')) {
                    window.trackMetaEvent('Lead', { click_text: text || 'Button Click', page_path: window.location.pathname });
                }
            } catch (err) {
                console.warn('[Meta Auto-Track Click Exception]:', err);
            }
        }, true);
    }

    // Initialize Meta Pixel & Auto-Tracking on DOM load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initMetaPixel();
            setupAutoTracking();
        });
    } else {
        initMetaPixel();
        setupAutoTracking();
    }

})(window, document);
