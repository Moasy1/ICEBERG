/**
 * page-tracker.js — Page-view tracker for Iceberg CMS analytics.
 *
 * Fires a single POST to /api/analytics/track on every page load.
 * Captures: page path, human label, document referrer, and UTM params.
 * Falls back silently — never blocks page rendering.
 */
(function () {
  'use strict';

  // Human-readable labels for known pages
  var LABELS = {
    '/': 'Home',
    '/index.html': 'Home',
    '/idex': 'IDEX Landing',
    '/idex.html': 'IDEX Landing',
    '/idex/audit': 'IDEX Audit',
    '/idex/book': 'IDEX Book',
    '/projects': 'Projects',
    '/projects.html': 'Projects',
    '/idex/thank-you': 'IDEX Thank You',
    '/birthday-campaign': 'Birthday Campaign',
    '/birthday-campaign.html': 'Birthday Campaign'
  };

  function getLabel(p) {
    // Exact match first, then without trailing slash
    return LABELS[p] || LABELS[p.replace(/\/$/, '')] || p;
  }

  /** Extract a single query-string param from the current URL. */
  function getParam(name) {
    try {
      return new URLSearchParams(window.location.search).get(name) || '';
    } catch (e) { return ''; }
  }

  function track() {
    try {
      var page     = window.location.pathname || '/';
      var label    = getLabel(page);
      var referrer = document.referrer || '';
      var utm_source   = getParam('utm_source');
      var utm_medium   = getParam('utm_medium');
      var utm_campaign = getParam('utm_campaign');

      // Primary endpoint (MongoDB-backed, source-aware)
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: page,
          label: label,
          referrer: referrer,
          utm_source: utm_source,
          utm_medium: utm_medium,
          utm_campaign: utm_campaign
        }),
        keepalive: true
      }).catch(function () {
        // Fallback to legacy endpoint (in case new route isn't deployed yet)
        fetch('/api/analytics/pageview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ page: page, resource: label }),
          keepalive: true
        }).catch(function () {});
      });
    } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', track);
  } else {
    track();
  }
})();
