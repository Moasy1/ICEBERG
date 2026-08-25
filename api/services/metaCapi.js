const crypto = require('crypto');
const https = require('https');
const http = require('http');
const mongoose = require('mongoose');
const MetaEvent = require('../models/MetaEvent');
const metaParameterBuilder = require('./metaParameterBuilder');

const DEFAULT_PIXEL_ID = '2557716128012185';
const DEFAULT_ACCESS_TOKEN = 'EAANH2w2Ar6ABSFdepnhLqbYOZBL16W4Xy2Gt6XNjUEW6QWXrQOIZAkzSF4VQBYNzl2CrTTIc3pZBdu16UlU0r4dPZBjV7xIaKFVZCq49ZAUP94igPYznzVlcMAjyGHFRxdFhTZA9JwqGYJTKQckMFdjKZC4MGVmJQaYZCBVZB9AmUmPfjOAEZAoHfZCCY3jPQikLTMvSFQZDZD';
const DEFAULT_TEST_EVENT_CODE = 'TEST42775';

/**
 * Meta Conversions API (CAPI) Service
 * Implements strict event deduplication with Meta Pixel, cryptographic event ID generation,
 * MongoDB idempotency verification, state synchronization, and robust error handling.
 */
class MetaCapiService {
    constructor() {
        this.apiVersion = process.env.META_API_VERSION || 'v18.0';
        this.processedEventIds = new Set();
    }

    /**
     * Generate cryptographically secure event ID
     * @param {string} prefix 
     * @returns {string}
     */
    generateEventId(prefix = 'evt') {
        try {
            return `${prefix}_${crypto.randomUUID()}`;
        } catch (e) {
            return `${prefix}_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
        }
    }

    /**
     * SHA-256 Hash helper for user normalization
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
        const testCode = process.env.META_TEST_EVENT_CODE || DEFAULT_TEST_EVENT_CODE;

        return {
            configured: Boolean(pixelId && accessToken),
            pixelIdSet: Boolean(pixelId),
            pixelIdPreview: pixelId ? `${pixelId.substring(0, 4)}***` : null,
            pixelId: pixelId || null,
            accessTokenSet: Boolean(accessToken),
            testEventCodeSet: Boolean(testCode),
            testEventCode: testCode || null,
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

        // Browser & Session identifiers (_fbp / _fbc)
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
     * Send event to Meta Conversions API with strict MongoDB Idempotency,
     * CAPI status management, test event code inclusion, and deduplication verification.
     * 
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
        const testCode = process.env.META_TEST_EVENT_CODE || DEFAULT_TEST_EVENT_CODE;

        const eventName = eventDetails.eventName || 'Lead';
        const eventId = eventDetails.eventId || this.generateEventId('srv');

        // Extract cookies from request if present
        const req = eventDetails.req;
        const cookies = req && req.headers ? (req.headers.cookie || '') : '';
        const fbpMatch = cookies.match(/_fbp=([^;]+)/);
        const fbcMatch = cookies.match(/_fbc=([^;]+)/);

        const fbp = eventDetails.userData?.fbp || (fbpMatch ? decodeURIComponent(fbpMatch[1]) : null);
        const fbc = eventDetails.userData?.fbc || (fbcMatch ? decodeURIComponent(fbcMatch[1]) : null);

        let eventSourceUrl = eventDetails.eventSourceUrl;
        if (!eventSourceUrl && req) {
            const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
            const host = req.headers.host || 'localhost';
            eventSourceUrl = `${protocol}://${host}${req.originalUrl || req.url}`;
        }
        if (!eventSourceUrl) {
            eventSourceUrl = process.env.FRONTEND_URL || 'https://iceberg.agency';
        }

        // ─────────────────────────────────────────────────────────────
        // 1. IDEMPOTENCY CHECK (Anti-Duplication via In-Memory + MongoDB)
        // ─────────────────────────────────────────────────────────────
        if (this.processedEventIds.has(eventId)) {
            console.log(`[Meta CAPI] Blocked duplicate event | ID: ${eventId} | Status: already sent`);
            return {
                success: true,
                duplicate: true,
                eventId,
                meta_capi_status: 'sent',
                message: `Event ${eventId} has already been dispatched to Meta CAPI.`
            };
        }

        const isDbConnected = mongoose.connection.readyState === 1;
        let existingEvent = null;

        if (isDbConnected) {
            try {
                existingEvent = await MetaEvent.findOne({ event_id: eventId });
                if (existingEvent && existingEvent.meta_capi_status === 'sent') {
                    this.processedEventIds.add(eventId);
                    console.log(`[Meta CAPI] Blocked duplicate event | ID: ${eventId} | Status: already sent`);
                    return {
                        success: true,
                        duplicate: true,
                        eventId,
                        meta_capi_status: 'sent',
                        message: `Event ${eventId} has already been dispatched to Meta CAPI.`
                    };
                }
            } catch (queryErr) {
                console.warn(`[Meta CAPI] Idempotency query warning for ${eventId}:`, queryErr.message);
            }
        }

        // ─────────────────────────────────────────────────────────────
        // 2. SAVE TRACKING STATE IN MONGODB (status: 'pending')
        // ─────────────────────────────────────────────────────────────
        let mongoSyncSuccess = false;
        if (isDbConnected) {
            try {
                await MetaEvent.findOneAndUpdate(
                    { event_id: eventId },
                    {
                        event_id: eventId,
                        event_name: eventName,
                        meta_capi_status: 'pending',
                        fbp: fbp || null,
                        fbc: fbc || null,
                        event_source_url: eventSourceUrl,
                        user_data: {
                            email: eventDetails.userData?.email ? '***' : undefined,
                            phone: eventDetails.userData?.phone ? '***' : undefined,
                            name: eventDetails.userData?.name || undefined,
                            fbp,
                            fbc
                        },
                        custom_data: eventDetails.customData || {},
                        test_event_code: testCode || null,
                        updated_at: new Date()
                    },
                    { upsert: true, new: true }
                );
                mongoSyncSuccess = true;
            } catch (dbSaveErr) {
                console.warn(`[Meta CAPI] MongoDB pending state save error:`, dbSaveErr.message);
            }
        }

        // Output required server log
        console.log(`[Meta CAPI] Processing ${eventName} | ID: ${eventId} | MongoDB Sync: ${mongoSyncSuccess ? 'success' : 'fail'}`);

        if (!pixelId || !accessToken) {
            console.warn(`[Meta CAPI] Skipping Graph API dispatch: META_PIXEL_ID or META_ACCESS_TOKEN not configured.`);
            if (isDbConnected) {
                await MetaEvent.updateOne({ event_id: eventId }, { meta_capi_status: 'failed', error_message: 'Missing Pixel ID or Access Token' }).catch(() => {});
            }
            return { success: false, reason: 'unconfigured', eventId };
        }

        // ─────────────────────────────────────────────────────────────
        // 3. BUILD PARAMETER BUILDER PAYLOAD WITH USER DATA & TEST CODE
        // ─────────────────────────────────────────────────────────────
        try {
            const eventPayload = metaParameterBuilder.buildEventPayload({
                eventName,
                eventId,
                eventSourceUrl,
                userData: {
                    fbp,
                    fbc,
                    ...(eventDetails.userData || {})
                },
                customData: eventDetails.customData || {},
                req
            });

            const requestBody = {
                data: [eventPayload]
            };

            if (testCode) {
                requestBody.test_event_code = testCode;
            }

            const postData = JSON.stringify(requestBody);

            // ─────────────────────────────────────────────────────────────
            // 4. DISPATCH TO META GRAPH API & HANDLE 200 OK / ERRORS
            // ─────────────────────────────────────────────────────────────
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
                    res.on('end', async () => {
                        try {
                            const parsedResponse = JSON.parse(responseString);
                            
                            // Successful response from Meta Graph API
                            if (res.statusCode >= 200 && res.statusCode < 300) {
                                this.processedEventIds.add(eventId);
                                console.log(`[Meta CAPI Success] Event "${eventName}" sent (eventId: ${eventId}) | FB trace_id: ${parsedResponse.fbtrace_id || 'OK'}`);
                                
                                if (isDbConnected) {
                                    try {
                                        await MetaEvent.updateOne(
                                            { event_id: eventId },
                                            {
                                                meta_capi_status: 'sent',
                                                meta_response: parsedResponse,
                                                error_message: null,
                                                updated_at: new Date()
                                            }
                                        );
                                    } catch (e) {}
                                }

                                resolve({
                                    success: true,
                                    eventId,
                                    eventName,
                                    meta_capi_status: 'sent',
                                    response: parsedResponse
                                });
                            } else {
                                // Meta Error response
                                const exactMetaError = parsedResponse?.error?.message || JSON.stringify(parsedResponse);
                                console.error(`[Meta CAPI Error] Response (${res.statusCode}):`, exactMetaError);

                                if (isDbConnected) {
                                    try {
                                        await MetaEvent.updateOne(
                                            { event_id: eventId },
                                            {
                                                meta_capi_status: 'failed',
                                                error_message: exactMetaError,
                                                meta_response: parsedResponse,
                                                updated_at: new Date()
                                            }
                                        );
                                    } catch (e) {}
                                }

                                resolve({
                                    success: false,
                                    statusCode: res.statusCode,
                                    meta_capi_status: 'failed',
                                    error: exactMetaError,
                                    response: parsedResponse
                                });
                            }
                        } catch (parseErr) {
                            console.error('[Meta CAPI Parse Error]:', responseString);
                            if (isDbConnected) {
                                await MetaEvent.updateOne({ event_id: eventId }, { meta_capi_status: 'failed', error_message: parseErr.message }).catch(() => {});
                            }
                            resolve({ success: false, error: parseErr.message, raw: responseString });
                        }
                    });
                });

                request.on('error', async (networkErr) => {
                    console.error('[Meta CAPI Network Error]:', networkErr.message);
                    if (isDbConnected) {
                        try {
                            await MetaEvent.updateOne(
                                { event_id: eventId },
                                {
                                    meta_capi_status: 'failed',
                                    error_message: networkErr.message,
                                    updated_at: new Date()
                                }
                            );
                        } catch (e) {}
                    }
                    resolve({ success: false, error: networkErr.message, meta_capi_status: 'failed' });
                });

                request.write(postData);
                request.end();
            });

        } catch (error) {
            console.error('[Meta CAPI Exception]:', error);
            if (isDbConnected) {
                await MetaEvent.updateOne({ event_id: eventId }, { meta_capi_status: 'failed', error_message: error.message }).catch(() => {});
            }
            return { success: false, error: error.message, meta_capi_status: 'failed' };
        }
    }

    /**
     * Helper for Lead events
     */
    async sendLeadEvent(leadData = {}) {
        return this.sendServerEvent({
            eventName: 'Lead',
            eventId: leadData.eventId || leadData.event_id || leadData.meta_event_id,
            userData: {
                email: leadData.email,
                phone: leadData.phone,
                name: leadData.name || leadData.contact_name,
                company: leadData.company,
                fbp: leadData.fbp,
                fbc: leadData.fbc
            },
            customData: leadData.customData || {
                content_name: leadData.source || 'Lead Form Submission',
                company: leadData.company
            },
            eventSourceUrl: leadData.eventSourceUrl,
            req: leadData.req
        });
    }

    /**
     * Helper for Schedule / Appointment events
     */
    async sendScheduleEvent(scheduleData = {}) {
        return this.sendServerEvent({
            eventName: 'Schedule',
            eventId: scheduleData.eventId || scheduleData.event_id || scheduleData.meta_event_id,
            userData: {
                email: scheduleData.email,
                phone: scheduleData.phone,
                name: scheduleData.name || scheduleData.contact_name,
                company: scheduleData.company,
                fbp: scheduleData.fbp,
                fbc: scheduleData.fbc
            },
            customData: scheduleData.customData || {
                content_name: 'Consultation Appointment Booking',
                meeting_date: scheduleData.meeting_date || scheduleData.appointmentDate,
                time_slot: scheduleData.time_slot || scheduleData.appointmentTime
            },
            eventSourceUrl: scheduleData.eventSourceUrl,
            req: scheduleData.req
        });
    }
}

module.exports = new MetaCapiService();
