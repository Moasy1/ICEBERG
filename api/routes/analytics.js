/**
 * analytics.js — Analytics API routes
 *
 * POST /api/analytics/track     Record a pageview event
 * GET  /api/analytics/summary   Totals + per-page + per-source + trend
 * GET  /api/analytics/pages     Per-page view counts (sorted)
 * GET  /api/analytics/sources   Traffic source breakdown
 * GET  /api/analytics/trend     Daily view counts for last N days
 */

const express = require('express');
const router = express.Router();
const PageView = require('../models/PageView');
const mongoose = require('mongoose');

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Classify a raw referrer URL + utm_medium into a canonical source label. */
function classifySource({ referrer = '', utm_medium = '', utm_source = '' }) {
  const ref = (referrer || '').toLowerCase();
  const med = (utm_medium || '').toLowerCase();
  const src = (utm_source || '').toLowerCase();

  if (med === 'cpc' || med === 'ppc' || med === 'paid' || src === 'google_ads' || src === 'meta_ads') return 'paid';
  if (med === 'email' || med === 'newsletter' || src === 'email') return 'email';
  if (med === 'social' || /facebook|instagram|linkedin|twitter|tiktok|youtube|pinterest|snapchat/.test(ref) || /facebook|instagram|linkedin|twitter|tiktok|youtube/.test(src)) return 'social';
  if (med === 'organic' || /google|bing|yahoo|duckduckgo|yandex|baidu/.test(ref)) return 'organic';
  if (ref && ref !== '') return 'referral';
  return 'direct';
}

/** Build a date filter object for the last `days` days. */
function lastNDays(days) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);
  return { timestamp: { $gte: since } };
}

/** Return true if MongoDB is currently connected. */
function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

// ─── POST /api/analytics/track ──────────────────────────────────────────────

router.post('/track', async (req, res) => {
  try {
    const {
      page = '/unknown',
      label = '',
      referrer = '',
      utm_source = '',
      utm_medium = '',
      utm_campaign = ''
    } = req.body || {};

    const source = classifySource({ referrer, utm_medium, utm_source });

    if (isDbConnected()) {
      await PageView.create({
        page: String(page).substring(0, 200),
        label: String(label || page).substring(0, 150),
        source,
        referrer: String(referrer).substring(0, 500),
        utm_source: String(utm_source).substring(0, 100),
        utm_medium: String(utm_medium).substring(0, 100),
        utm_campaign: String(utm_campaign).substring(0, 150)
      });
    }

    res.json({ success: true, page, source });
  } catch (err) {
    console.error('[Analytics] track error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to record pageview' });
  }
});

// ─── GET /api/analytics/summary ─────────────────────────────────────────────

router.get('/summary', async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 30, 365);
    const filter = lastNDays(days);

    if (!isDbConnected()) {
      return res.json({ success: true, total: 0, uniquePages: 0, pages: [], sources: [], trend: [] });
    }

    const [total, pageAgg, sourceAgg, trend] = await Promise.all([
      PageView.countDocuments(filter),

      // Per-page counts
      PageView.aggregate([
        { $match: filter },
        { $group: { _id: { page: '$page', label: '$label' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ]),

      // Per-source counts
      PageView.aggregate([
        { $match: filter },
        { $group: { _id: '$source', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // Daily trend
      PageView.aggregate([
        { $match: filter },
        {
          $group: {
            _id: {
              y: { $year: '$timestamp' },
              m: { $month: '$timestamp' },
              d: { $dayOfMonth: '$timestamp' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1 } }
      ])
    ]);

    const pages = pageAgg.map(p => ({
      page: p._id.page,
      label: p._id.label,
      count: p.count,
      share: total > 0 ? Math.round((p.count / total) * 100) : 0
    }));

    const sources = sourceAgg.map(s => ({
      source: s._id || 'direct',
      count: s.count,
      share: total > 0 ? Math.round((s.count / total) * 100) : 0
    }));

    const trendFormatted = trend.map(t => ({
      date: `${t._id.y}-${String(t._id.m).padStart(2, '0')}-${String(t._id.d).padStart(2, '0')}`,
      count: t.count
    }));

    res.json({
      success: true,
      total,
      uniquePages: pages.length,
      days,
      pages,
      sources,
      trend: trendFormatted
    });
  } catch (err) {
    console.error('[Analytics] summary error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics summary' });
  }
});

// ─── GET /api/analytics/pages ───────────────────────────────────────────────

router.get('/pages', async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 30, 365);
    if (!isDbConnected()) return res.json({ success: true, data: [] });

    const data = await PageView.aggregate([
      { $match: lastNDays(days) },
      { $group: { _id: { page: '$page', label: '$label' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 50 }
    ]);

    res.json({ success: true, data: data.map(d => ({ page: d._id.page, label: d._id.label, count: d.count })) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/analytics/sources ─────────────────────────────────────────────

router.get('/sources', async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 30, 365);
    if (!isDbConnected()) return res.json({ success: true, data: [] });

    const total = await PageView.countDocuments(lastNDays(days));
    const data = await PageView.aggregate([
      { $match: lastNDays(days) },
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      total,
      data: data.map(d => ({
        source: d._id || 'direct',
        count: d.count,
        share: total > 0 ? Math.round((d.count / total) * 100) : 0
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/analytics/trend ───────────────────────────────────────────────

router.get('/trend', async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 30, 365);
    if (!isDbConnected()) return res.json({ success: true, data: [] });

    const data = await PageView.aggregate([
      { $match: lastNDays(days) },
      {
        $group: {
          _id: {
            y: { $year: '$timestamp' },
            m: { $month: '$timestamp' },
            d: { $dayOfMonth: '$timestamp' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1 } }
    ]);

    res.json({
      success: true,
      days,
      data: data.map(t => ({
        date: `${t._id.y}-${String(t._id.m).padStart(2, '0')}-${String(t._id.d).padStart(2, '0')}`,
        count: t.count
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
