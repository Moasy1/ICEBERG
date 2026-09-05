const express = require('express');
const router = express.Router();
const metaCapi = require('../services/metaCapi');
const MetaEvent = require('../models/MetaEvent');

/**
 * GET /api/meta/status
 * Returns current Meta Pixel & CAPI configuration status, including active Pixel ID and Test Code
 */
router.get('/status', (req, res) => {
    const status = metaCapi.getStatus();
    res.json({
        success: true,
        data: status
    });
});

/**
 * GET /api/meta/events
 * Admin view to inspect recently tracked Meta events & delivery status
 */
router.get('/events', async (req, res) => {
    try {
        const events = await MetaEvent.find().sort({ created_at: -1 }).limit(100);
        res.json({
            success: true,
            count: events.length,
            data: events
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * POST /api/meta/event
 * Receive client-side tracked events to dispatch to Meta CAPI (Dual Tracking with strict deduplication)
 */
router.post('/event', async (req, res) => {
    try {
        const { eventName, eventId, eventSourceUrl, userData, customData } = req.body || {};

        if (!eventName) {
            return res.status(400).json({
                success: false,
                error: 'eventName is required'
            });
        }

        const secureEventId = eventId || metaCapi.generateEventId('evt');

        // Extract cookies if not provided
        const cookies = req.headers.cookie || '';
        const fbpMatch = cookies.match(/_fbp=([^;]+)/);
        const fbcMatch = cookies.match(/_fbc=([^;]+)/);

        const mergedUserData = {
            fbp: (userData && userData.fbp) || (fbpMatch ? decodeURIComponent(fbpMatch[1]) : undefined),
            fbc: (userData && userData.fbc) || (fbcMatch ? decodeURIComponent(fbcMatch[1]) : undefined),
            ...(userData || {})
        };

        // Send event via Conversions API with strict idempotency and MongoDB sync
        const result = await metaCapi.sendServerEvent({
            eventName,
            eventId: secureEventId,
            eventSourceUrl,
            userData: mergedUserData,
            customData: customData || {},
            req
        });

        res.json({
            success: result.success,
            duplicate: Boolean(result.duplicate),
            eventId: secureEventId,
            meta_capi_status: result.meta_capi_status || (result.success ? 'sent' : 'failed'),
            capiResult: result
        });
    } catch (error) {
        console.error('[Meta Route Error]:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
