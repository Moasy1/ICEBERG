const express = require('express');
const router = express.Router();
const metaCapi = require('../services/metaCapi');

/**
 * GET /api/meta/status
 * Returns current Meta Pixel & CAPI status
 */
router.get('/status', (req, res) => {
    const status = metaCapi.getStatus();
    res.json({
        success: true,
        data: status
    });
});

/**
 * POST /api/meta/event
 * Receive client-side tracked events to dispatch to Meta CAPI (Dual Tracking)
 */
router.post('/event', async (req, res) => {
    try {
        const { eventName, eventId, eventSourceUrl, userData, customData } = req.body;

        if (!eventName) {
            return res.status(400).json({
                success: false,
                error: 'eventName is required'
            });
        }

        // Send event via Conversions API
        const result = await metaCapi.sendServerEvent({
            eventName,
            eventId,
            eventSourceUrl,
            userData: userData || {},
            customData: customData || {},
            req
        });

        res.json({
            success: true,
            eventId: eventId || result.eventId,
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
