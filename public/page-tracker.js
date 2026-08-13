/**
 * page-tracker.js - Lightweight page-view tracker for Iceberg CMS analytics.
 * Fires a single POST to /api/analytics/pageview on every page load.
 */
(function () {
  "use strict";
  var LABELS = {
    "/": "Home", "/index.html": "Home",
    "/idex": "IDEX Landing", "/idex.html": "IDEX Landing",
    "/projects": "Projects", "/projects.html": "Projects",
    "/idex/thank-you": "IDEX Thank You",
    "/birthday-campaign": "Birthday Campaign",
    "/birthday-campaign.html": "Birthday Campaign"
  };
  function getLabel(p) { return LABELS[p] || LABELS[p.replace(/\/$/, "")] || p; }
  function track() {
    try {
      var page = window.location.pathname || "/";
      fetch("/api/analytics/pageview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page: page, resource: getLabel(page) }),
        keepalive: true
      }).catch(function () {});
    } catch (e) {}
  }
  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", track); }
  else { track(); }
})();
