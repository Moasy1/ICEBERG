const crypto = require('crypto');
const https = require('https');
const http = require('http');

const DEFAULT_PIXEL_ID = '2557716128012185';
const DEFAULT_ACCESS_TOKEN = 'EAANH2w2Ar6ABSP72OrOBwIN5LsZA9NsZAmAcuSPeLKZC3KIuFk3u4pMPm1sQp3Og2CS2HIMS8EJZA9BA8WF4KydMC9M4PhEvjG8Ud9NxYnLKKQbUNXyeVL4c6FJV52F0IXU1HtiS491dJFbXuB0ARJStF1HCXCUKmfqMpaA5HcLb47k6ONlA1dVKvqMUW95G4QZDZD';

/**
 * Meta Conversions API (CAPI) Service
 * Handles server-side event dispatching to Meta's Graph API with SHA-256 normalization,
 * cookie handling (_fbp/_fbc), and event deduplication.
 */
class MetaCapiService {
    constructor() {
        this.apiVersion = process.env.META_API_VERSION || 'v18.0';
    }

    /**
     * SHA-256 Hash helper
     * @param {string} value 
     * @returns {string|null} Hashed string or null
     */
    hash(value) {
        if (!value || typeof value !== 'string') return null;
        const normalized = value.trim().toLowerCase();
        if (!normalized) return null;
        return crypto.createHash('sha256').update(normalized).digest('hex');
    }

    /**
     * Normalize and hash phone number (digits only, e.g. +1 (555) 123-4567 -> 15551234567)
     * @param {string} phone 
     * @returns {string|null}
     */
    hashPhone(phone) {
        if (!phone || typeof phone !== 'string') return null;
        const digitsOnly = phone.replace(/\D/g, '');
        if (!digitsOnly) return null;
        return crypto.createHash('sha256').update(digitsOnly).digest('hex');
    }

    /**
     * Extract first and last name from full name
     * @param {string} fullName 
     */
    parseName(fullName) {
        if (!fullName || typeof fullName !== 'string') return { fn: null, ln: null };
        const parts = fullName.trim().split(/\s+/);
        const first = parts[0] ? this.hash(parts[0]) : null;
        const last = parts.length > 1 ? this.hash(parts.slice(1).join(' ')) : null;
        return { fn: first, ln: last };
    }

    /**
     * Check if Meta CAPI is configured with credentials
     * @returns {boolean}
     */
    isConfigured() {
        const pixelId = process.env.META_PIXEL_ID || process.env.FB_PIXEL_ID || DEFAULT_PIXEL_ID;
        const accessToken = process.env.META_ACCESS_TOKEN || process.env.FB_ACCESS_TOKEN || DEFAULT_ACCESS_TOKEN;
        return Boolean(pixelId && accessToken);
    }

    /**
     * Get current status overview
     */
    getStatus() {
        const pixelId = process.env.META_PIXEL_ID || process.env.FB_PIXEL_ID || DEFAULT_PIXEL_ID;
        const accessToken = process.env.META_ACCESS_TOKEN || process.env.FB_ACCESS_TOKEN || DEFAULT_ACCESS_TOKEN;
        const testCode = process.env.META_TEST_EVENT_CODE;

        return {
            configured: Boolean(pixelId && accessToken),
            pixelIdSet: Boolean(pixelId),
            pixelIdPreview: pixelId ? `${pixelId.substring(0, 4)}***` : null,
            pixelId: pixelId || null,
            accessTokenSet: Boolean(accessToken),
            testEventCodeSet: Boolean(testCode),
            apiVersion: this.apiVersion
        };
    }

    /**
     * Normalize user data payload for Meta CAPI
     * @param {Object} rawUserData 
     * @param {Object} req - Express request object for IP and User-Agent fallback
     */
    buildUserData(rawUserData = {}, req = null) {
        const userData = {};

        // Email
        if (rawUserData.email) {
            const hashedEmail = this.hash(rawUserData.email);
            if (hashedEmail) userData.em = [hashedEmail];
        }

        // Phone
        if (rawUserData.phone) {
            const hashedPhone = this.hashPhone(rawUserData.phone);
            if (hashedPhone) userData.ph = [hashedPhone];
        }

        // Name
        if (rawUserData.name) {
            const { fn, ln } = this.parseName(rawUserData.name);
            if (fn) userData.fn = [fn];
            if (ln) userData.ln = [ln];
        }
        if (rawUserData.firstName) {
            const fn = this.hash(rawUserData.firstName);
            if (fn) userData.fn = [fn];
        }
        if (rawUserData.lastName) {
            const ln = this.hash(rawUserData.lastName);
            if (ln) userData.ln = [ln];
        }

        // Location data if available
        if (rawUserData.city) {
            const ct = this.hash(rawUserData.city);
            if (ct) userData.ct = [ct];
        }
        if (rawUserData.state) {
            const st = this.hash(rawUserData.state);
            if (st) userData.st = [st];
        }
        if (rawUserData.country) {
            const country = this.hash(rawUserData.country);
            if (country) userData.country = [country];
        }
        if (rawUserData.zip) {
            const zp = this.hash(rawUserData.zip);
            if (zp) userData.zp = [zp];
        }

        // Browser & Session identifiers (unhashed)
        if (rawUserData.fbp) userData.fbp = rawUserData.fbp;
        if (rawUserData.fbc) userData.fbc = rawUserData.fbc;

        // IP Address & User Agent
        const ip = rawUserData.clientIp || rawUserData.client_ip_address || (req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress) : null);
        if (ip) {
            userData.client_ip_address = typeof ip === 'string' ? ip.split(',')[0].trim() : ip;
        }

        const ua = rawUserData.userAgent || rawUserData.client_user_agent || (req ? req.headers['user-agent'] : null);
        if (ua) {
            userData.client_user_agent = ua;
        }

        return userData;
    }

    /**
     * Send event to Meta Conversions API
     * @param {Object} eventDetails
     * @param {string} eventDetails.eventName - Standard Meta event name (e.g. Lead, Contact, PageView, ViewContent, Schedule)
     * @param {string} [eventDetails.eventId] - Unique ID for event deduplication matching client-side Pixel event
     * @param {string} [eventDetails.eventSourceUrl] - URL where event took place
     * @param {Object} [eventDetails.userData] - User identity object (email, phone, name, fbp, fbc, etc.)
     * @param {Object} [eventDetails.customData] - Event specific custom parameters (value, currency, content_name, etc.)
     * @param {Object} [eventDetails.req] - Express request object (optional fallback for headers & cookies)
     */
    async sendServerEvent(eventDetails = {}) {
        const pixelId = process.env.META_PIXEL_ID || process.env.FB_PIXEL_ID || DEFAULT_PIXEL_ID;
        const accessToken = process.env.META_ACCESS_TOKEN || process.env.FB_ACCESS_TOKEN || DEFAULT_ACCESS_TOKEN;

        if (!pixelId || !accessToken) {
            console.log(`[Meta CAPI] Skipping event "${eventDetails.eventName}": META_PIXEL_ID or META_ACCESS_TOKEN not set.`);
            return { success: false, reason: 'unconfigured' };
        }

        try {
            const eventName = eventDetails.eventName || 'CustomEvent';
            const eventTime = Math.floor(Date.now() / 1000);
            const eventId = eventDetails.eventId || `meta_server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            let eventSourceUrl = eventDetails.eventSourceUrl;
            if (!eventSourceUrl && eventDetails.req) {
                const req = eventDetails.req;
                const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
                const host = req.headers.host || 'localhost';
                eventSourceUrl = `${protocol}://${host}${req.originalUrl || req.url}`;
            }

            // Extract cookies from request if present
            const req = eventDetails.req;
            const cookies = req && req.headers ? (req.headers.cookie || '') : '';
            const fbpMatch = cookies.match(/_fbp=([^;]+)/);
            const fbcMatch = cookies.match(/_fbc=([^;]+)/);

            const mergedUserDataInput = {
                fbp: fbpMatch ? fbpMatch[1] : null,
                fbc: fbcMatch ? fbcMatch[1] : null,
                ...(eventDetails.userData || {})
            };

            const userData = this.buildUserData(mergedUserDataInput, req);

            const eventPayload = {
                event_name: eventName,
                event_time: eventTime,
                event_id: eventId,
                action_source: 'website',
                event_source_url: eventSourceUrl || process.env.FRONTEND_URL || 'http://localhost:3000',
                user_data: userData,
                custom_data: eventDetails.customData || {}
            };

            const requestBody = {
                data: [eventPayload]
            };

            if (process.env.META_TEST_EVENT_CODE) {
                requestBody.test_event_code = process.env.META_TEST_EVENT_CODE;
            }

            const postData = JSON.stringify(requestBody);

            return new Promise((resolve) => {
                const url = `https://graph.facebook.com/${this.apiVersion}/${pixelId}/events?access_token=${accessToken}`;
                const parsedUrl = new URL(url);

                const options = {
                    hostname: parsedUrl.hostname,
                    path: parsedUrl.pathname + parsedUrl.search,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(postData)
                    }
                };

                const client = parsedUrl.protocol === 'https:' ? https : http;
                const request = client.request(options, (res) => {
                    let responseString = '';
                    res.on('data', (chunk) => responseString += chunk);
                    res.on('end', () => {
                        try {
                            const parsedResponse = JSON.parse(responseString);
                            if (res.statusCode >= 200 && res.statusCode < 300) {
                                console.log(`[Meta CAPI Success] Event "${eventName}" sent (eventId: ${eventId})`);
                                resolve({ success: true, eventId, response: parsedResponse });
                            } else {
                                console.error(`[Meta CAPI Error] Response (${res.statusCode}):`, parsedResponse);
                                resolve({ success: false, statusCode: res.statusCode, response: parsedResponse });
                            }
                        } catch (e) {
                            console.error('[Meta CAPI Parse Error]:', responseString);
                            resolve({ success: false, error: e.message, raw: responseString });
                        }
                    });
                });

                request.on('error', (err) => {
                    console.error('[Meta CAPI Network Error]:', err.message);
                    resolve({ success: false, error: err.message });
                });

                request.write(postData);
                request.end();
            });

        } catch (error) {
            console.error('[Meta CAPI Exception]:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new MetaCapiService();
