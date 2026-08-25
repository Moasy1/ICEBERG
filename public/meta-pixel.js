/**
 * Iceberg Digital Agency - Meta Pixel & Conversions API (CAPI) Universal Tracking Manager
 * Client-Side Pixel loader, cookie manager (_fbp/_fbc), and dual-tracking event dispatcher.
 * Strict Deduplication, Cryptographic Event ID Synchronization, and Global Currency/Value Enforcement.
 */
(function (window, document) {
    'use strict';

    const DEFAULT_PIXEL_ID = '2557716128012185';
    const DEFAULT_CURRENCY = 'USD';

    // ─────────────────────────────────────────────────────────────
    // 1. Cookie Utilities (_fbp, _fbc)
    // ─────────────────────────────────────────────────────────────
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
                let randomNum;
                if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
                    const array = new Uint32Array(2);
                    window.crypto.getRandomValues(array);
                    randomNum = `${array[0]}${array[1]}`;
                } else {
                    randomNum = Math.floor(Math.random() * 10000000000);
                }
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

    // ─────────────────────────────────────────────────────────────
    // 2. Cryptographically Secure Event ID Generator
    // ─────────────────────────────────────────────────────────────
    function generateSecureEventId(prefix = 'evt') {
        try {
            if (window.crypto && typeof window.crypto.randomUUID === 'function') {
                return `${prefix}_${window.crypto.randomUUID()}`;
            }
            if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
                const array = new Uint8Array(16);
                window.crypto.getRandomValues(array);
                const hex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
                return `${prefix}_${Date.now()}_${hex.substring(0, 16)}`;
            }
        } catch (e) {}
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }

    // Expose generator globally for form handlers and custom scripts
    window.generateMetaEventId = generateSecureEventId;

    // Helper to get active Meta cookies
    window.getMetaCookies = function () {
        return {
            fbp: getCookie('_fbp'),
            fbc: getCookie('_fbc')
        };
    };

    // ─────────────────────────────────────────────────────────────
    // 3. Global Value & Currency Normalization Engine
    // (Fixes Meta ROAS warning: "Currency field is missing. E.g. '' isn't allowed" across ALL events)
    // ─────────────────────────────────────────────────────────────
    function normalizeMetaCustomData(eventName, customData) {
        const data = (customData && typeof customData === 'object') ? { ...customData } : {};

        // PageView does not require currency or value parameters
        if (eventName === 'PageView') {
            return data;
        }

        // 1. Guaranteed 3-Letter ISO-4217 Currency Code (never empty string "")
        if (!data.currency || typeof data.currency !== 'string' || data.currency.trim() === '') {
            data.currency = window.META_DEFAULT_CURRENCY || DEFAULT_CURRENCY;
        } else {
            data.currency = data.currency.trim().toUpperCase().substring(0, 3);
        }

        // 2. Guaranteed Numerical Value for ROAS & Event Quality calculations
        if (data.value === undefined || data.value === null || data.value === '') {
            const standardValues = {
                'Lead': 50.00,
                'Schedule': 100.00,
                'Purchase': 500.00,
                'InitiateCheckout': 250.00,
                'AddToCart': 100.00,
                'SubmitApplication': 50.00,
                'Contact': 25.00,
                'CompleteRegistration': 25.00,
                'ViewContent': 1.00,
                'Search': 1.00
            };
            data.value = standardValues[eventName] !== undefined ? standardValues[eventName] : 0.00;
        } else if (typeof data.value === 'string') {
            const cleanNum = parseFloat(data.value.replace(/[^0-9.-]/g, ''));
            data.value = isNaN(cleanNum) ? 0.00 : cleanNum;
        } else if (typeof data.value !== 'number') {
            data.value = 0.00;
        }

        return data;
    }

    // Expose normalizer for external testing/usage
    window.normalizeMetaCustomData = normalizeMetaCustomData;

    // ─────────────────────────────────────────────────────────────
    // 4. Universal fbq Interceptor & Patch
    // (Wraps raw fbq calls from any template or script to enforce currency, value, and eventID)
    // ─────────────────────────────────────────────────────────────
    function installUniversalFBQInterceptor() {
        if (!window.fbq || window.fbq._icebergIntercepted) return;

        const originalFbq = window.fbq;

        const wrappedFbq = function (action, eventName, customData, options) {
            if ((action === 'track' || action === 'trackCustom') && typeof eventName === 'string') {
                const normalizedCustomData = normalizeMetaCustomData(eventName, customData);
                const finalOptions = (options && typeof options === 'object') ? { ...options } : {};

                if (!finalOptions.eventID) {
                    finalOptions.eventID = generateSecureEventId('fbq');
                }

                if (eventName !== 'PageView') {
                    console.log(`[Meta Pixel] Universal Intercept ${action}: ${eventName} | ID: ${finalOptions.eventID} | Value: ${normalizedCustomData.value} ${normalizedCustomData.currency}`);
                }

                return originalFbq.call(this, action, eventName, normalizedCustomData, finalOptions);
            }

            return originalFbq.apply(this, arguments);
        };

        // Copy all stub & library properties
        for (let prop in originalFbq) {
            if (Object.prototype.hasOwnProperty.call(originalFbq, prop)) {
                wrappedFbq[prop] = originalFbq[prop];
            }
        }

        wrappedFbq._icebergIntercepted = true;
        window.fbq = wrappedFbq;
        window._fbq = wrappedFbq;
    }

    // ─────────────────────────────────────────────────────────────
    // 5. Facebook Pixel Loader Stub & Initialization
    // ─────────────────────────────────────────────────────────────
    function initFBQStub() {
        if (window.fbq) {
            installUniversalFBQInterceptor();
            return;
        }
        const n = window.fbq = function () {
            n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!window._fbq) window._fbq = n;
        n.push = n;
        n.loaded = true;
        n.version = '2.0';
        n.queue = [];
        installUniversalFBQInterceptor();
    }

    function loadPixelScript(pixelId) {
        if (!pixelId) return;
        initFBQStub();

        if (!document.querySelector('script[src*="fbevents.js"]')) {
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
        }

        window.fbq('init', pixelId);

        // Initial PageView with secure event ID
        const pageViewEventId = generateSecureEventId('pv');
        console.log(`[Meta Pixel] Firing PageView with ID: ${pageViewEventId}`);
        window.fbq('track', 'PageView', {}, { eventID: pageViewEventId });
    }

    function initMetaPixel() {
        initFBQStub();

        if (document.querySelector('script[src*="fbevents.js"]')) {
            return;
        }

        const globalPixelId = window.FB_PIXEL_ID || window.META_PIXEL_ID;
        if (globalPixelId) {
            loadPixelScript(globalPixelId);
            return;
        }

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
                if (DEFAULT_PIXEL_ID) {
                    loadPixelScript(DEFAULT_PIXEL_ID);
                }
            });
    }

    // ─────────────────────────────────────────────────────────────
    // 6. Unified Event Dispatcher (Client Pixel + Server CAPI)
    // ─────────────────────────────────────────────────────────────
    window.trackMetaEvent = function (eventName, customData = {}, userData = {}, eventId = null, skipServerCapi = false) {
        const finalEventId = eventId || generateSecureEventId('evt');
        const fbp = getCookie('_fbp');
        const fbc = getCookie('_fbc');

        const mergedUserData = {
            fbp,
            fbc,
            ...userData
        };

        const enrichedCustomData = normalizeMetaCustomData(eventName, customData);

        // Required Client Log Format
        console.log(`[Meta Pixel] Firing ${eventName} with ID: ${finalEventId} | Value: ${enrichedCustomData.value || 0} ${enrichedCustomData.currency || ''}`);

        // 1. Client-side Meta Pixel dispatch
        if (typeof window.fbq === 'function') {
            try {
                window.fbq('track', eventName, enrichedCustomData, { eventID: finalEventId });
            } catch (e) {
                console.warn('[Meta Pixel Track Error]:', e);
            }
        }

        // Auto-record to internal Analytics engine (MongoDB) on PageViews
        if (eventName === 'PageView') {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                fetch('/api/analytics/track', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        page: window.location.pathname || '/',
                        label: document.title || window.location.pathname,
                        referrer: document.referrer || '',
                        utm_source: urlParams.get('utm_source') || '',
                        utm_medium: urlParams.get('utm_medium') || '',
                        utm_campaign: urlParams.get('utm_campaign') || ''
                    }),
                    keepalive: true
                }).catch(() => {});
            } catch (e) {}
        }

        // 2. Server-side Conversions API (CAPI) dispatch (Dual Tracking)
        if (!skipServerCapi) {
            try {
                fetch('/api/meta/event', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        eventName,
                        eventId: finalEventId,
                        eventSourceUrl: window.location.href,
                        userData: mergedUserData,
                        customData: enrichedCustomData
                    })
                }).then(res => res.json()).then(data => {
                    if (data.duplicate) {
                        console.log(`[Meta CAPI] Server noted duplicate event ID: ${finalEventId}`);
                    }
                }).catch(err => {
                    console.warn('[Meta CAPI Dispatch Notice]: Server event endpoint unreachable or offline.', err);
                });
            } catch (e) {
                console.warn('[Meta CAPI Fetch Exception]:', e);
            }
        }

        return finalEventId;
    };

    // Helper event shortcuts
    window.trackMetaPageView = function (eventId = null) {
        return window.trackMetaEvent('PageView', {}, {}, eventId);
    };

    window.trackMetaLead = function (leadData = {}, userData = {}, eventId = null, skipServerCapi = false) {
        const defaultLeadData = { value: 50.00, currency: 'USD', ...leadData };
        return window.trackMetaEvent('Lead', defaultLeadData, userData, eventId, skipServerCapi);
    };

    window.trackMetaContact = function (contactData = {}, userData = {}, eventId = null, skipServerCapi = false) {
        const defaultContactData = { value: 25.00, currency: 'USD', ...contactData };
        return window.trackMetaEvent('Contact', defaultContactData, userData, eventId, skipServerCapi);
    };

    window.trackMetaSchedule = function (scheduleData = {}, userData = {}, eventId = null, skipServerCapi = false) {
        const defaultScheduleData = { value: 100.00, currency: 'USD', ...scheduleData };
        return window.trackMetaEvent('Schedule', defaultScheduleData, userData, eventId, skipServerCapi);
    };

    window.trackMetaViewContent = function (contentData = {}, eventId = null) {
        const defaultViewData = { value: 1.00, currency: 'USD', ...contentData };
        return window.trackMetaEvent('ViewContent', defaultViewData, {}, eventId);
    };

    // ─────────────────────────────────────────────────────────────
    // 7. Automatic Event Tracking Suite for Forms & CTAs
    // ─────────────────────────────────────────────────────────────
    function setupAutoTracking() {
        // Track unhandled standard form submissions as 'Lead'
        document.addEventListener('submit', function (e) {
            try {
                const form = e.target;
                if (!form || form.getAttribute('data-meta-tracked') === 'true' || form.classList.contains('wizard-form')) {
                    return;
                }

                // If form has custom AJAX handling, let the form's script handle the event
                if (form.id === 'contact-form' || form.id === 'bundle-claim-form' || form.id === 'idex-audit-form' || form.id === 'lead-qual-form') {
                    return;
                }

                const formData = new FormData(form);
                const email = formData.get('email') || form.querySelector('input[type="email"]')?.value || '';
                const phone = formData.get('phone') || form.querySelector('input[type="tel"]')?.value || '';
                const name = formData.get('name') || form.querySelector('input[name="name"]')?.value || '';
                const business = formData.get('business_name') || form.querySelector('input[name="business_name"]')?.value || '';
                const service = formData.get('service') || form.querySelector('select')?.value || 'General Service';

                const secureEventId = generateSecureEventId('form');
                const userData = { email, phone, name };
                const customData = {
                    form_id: form.id || 'generic_form',
                    business_name: business,
                    service_requested: service,
                    value: 50.00,
                    currency: 'USD',
                    page_path: window.location.pathname
                };

                window.trackMetaEvent('Lead', customData, userData, secureEventId);
                form.setAttribute('data-meta-tracked', 'true');
            } catch (err) {
                console.warn('[Meta Auto-Track Form Exception]:', err);
            }
        }, true);

        // Click Tracking with Debounce for CTA buttons
        const clickedEvents = new Set();

        document.addEventListener('click', function (e) {
            try {
                const target = e.target.closest('a, button, [role="button"]');
                if (!target) return;

                // Don't auto-track submit buttons inside wizard forms
                if (target.closest('.wizard-form') && target.type === 'submit') return;

                const text = (target.textContent || '').trim().toLowerCase();
                const href = (target.getAttribute('href') || '').toLowerCase();

                // Generate a unique interaction signature to debounce within 2 seconds
                const clickSig = `${text}_${href}_${Date.now().toString().slice(0, -3)}`;
                if (clickedEvents.has(clickSig)) return;
                clickedEvents.add(clickSig);
                setTimeout(() => clickedEvents.delete(clickSig), 2000);

                // Phone / WhatsApp / Direct Contact Click -> Meta "Contact" Event
                if (href.startsWith('tel:') || href.includes('wa.me') || href.includes('whatsapp') || text.includes('call us') || text.includes('contact us')) {
                    const eventId = generateSecureEventId('click_contact');
                    window.trackMetaEvent('Contact', {
                        method: href.startsWith('tel:') ? 'phone' : 'whatsapp',
                        click_text: text,
                        value: 25.00,
                        currency: 'USD'
                    }, {}, eventId);
                }
                // Schedule / Book Consultation Click -> Meta "Schedule" Event
                else if (text.includes('schedule') || text.includes('book discovery') || text.includes('book consultation') || text.includes('appointment')) {
                    const eventId = generateSecureEventId('click_sched');
                    window.trackMetaEvent('Schedule', {
                        click_text: text,
                        page_path: window.location.pathname,
                        value: 100.00,
                        currency: 'USD'
                    }, {}, eventId);
                }
                // Start Project / Submit Application Click -> Meta "SubmitApplication" Event
                else if (text.includes('start project') || text.includes('start your project') || text.includes('get started')) {
                    const eventId = generateSecureEventId('click_app');
                    window.trackMetaEvent('SubmitApplication', {
                        click_text: text,
                        page_path: window.location.pathname,
                        value: 50.00,
                        currency: 'USD'
                    }, {}, eventId);
                }
                // Birthday Deals / Special Offers Click -> Meta "ViewContent" Event
                else if (text.includes('birthday') || text.includes('deal') || text.includes('offer')) {
                    const eventId = generateSecureEventId('click_offer');
                    window.trackMetaEvent('ViewContent', {
                        content_name: 'Birthday Deals / Offers',
                        click_text: text,
                        value: 1.00,
                        currency: 'USD'
                    }, {}, eventId);
                }
            } catch (err) {
                console.warn('[Meta Auto-Track Click Exception]:', err);
            }
        }, true);
    }

    // Initialize Meta Pixel & Auto-Tracking on DOM load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            initMetaPixel();
            setupAutoTracking();
        });
    } else {
        initMetaPixel();
        setupAutoTracking();
    }

})(window, document);
