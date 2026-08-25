/**
 * Meta Conversions API (CAPI) Parameter Builder Tool & Feature Library
 * Implements Meta's official CAPI Parameter Builder specification to maximize 
 * Event Match Quality (EMQ), click ID (_fbc) & browser ID (_fbp) coverage, 
 * client IP, user-agent extraction, and SHA-256 normalization.
 * 
 * Reference: https://developers.facebook.com/docs/marketing-api/conversions-api/parameter-builder-feature-library
 */

const crypto = require('crypto');

class MetaParameterBuilder {
  constructor(options = {}) {
    this.defaultCurrency = options.defaultCurrency || process.env.DEFAULT_CURRENCY || 'USD';
  }

  /**
   * SHA-256 Hashing helper according to Meta Conversions API specifications
   * @param {string} value 
   * @returns {string|null} 64-character lowercase hex hash or null
   */
  hash(value) {
    if (!value || typeof value !== 'string') return null;
    const clean = value.trim().toLowerCase();
    if (!clean) return null;
    return crypto.createHash('sha256').update(clean).digest('hex');
  }

  /**
   * Normalize and hash phone numbers according to Meta E.164 recommendations
   * Strips non-digit characters and leading zeros
   * @param {string} phone 
   * @returns {string|null}
   */
  hashPhone(phone) {
    if (!phone || typeof phone !== 'string') return null;
    // Remove all non-digits
    let clean = phone.replace(/[^0-9]/g, '');
    // Remove leading zeros
    clean = clean.replace(/^0+/, '');
    if (!clean) return null;
    return crypto.createHash('sha256').update(clean).digest('hex');
  }

  /**
   * Parse full name into first and last name components and hash them
   * @param {string} fullName 
   * @returns {{ fn: string|null, ln: string|null }}
   */
  parseAndHashName(fullName) {
    if (!fullName || typeof fullName !== 'string') return { fn: null, ln: null };
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return { fn: null, ln: null };
    if (parts.length === 1) return { fn: this.hash(parts[0]), ln: null };
    
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');
    return {
      fn: this.hash(firstName),
      ln: this.hash(lastName)
    };
  }

  /**
   * Extract or construct Click ID (_fbc) from cookies, request queries, or referrers
   * Format: fb.1.{creation_time}.{fbclid}
   * @param {Object} req - Express request object
   * @param {string} [explicitFbc] - Client-provided fbc
   * @returns {string|null}
   */
  resolveFbc(req, explicitFbc) {
    if (explicitFbc && typeof explicitFbc === 'string' && explicitFbc.startsWith('fb.')) {
      return explicitFbc.trim();
    }

    if (!req) return null;

    // 1. Check cookies for _fbc
    const cookieHeader = req.headers?.cookie || '';
    const cookieMatch = cookieHeader.match(/(?:^|;\s*)_fbc=([^;]+)/);
    if (cookieMatch) {
      return decodeURIComponent(cookieMatch[1]).trim();
    }

    // 2. Check query params or body for fbclid
    const fbclid = req.query?.fbclid || req.body?.fbclid;
    if (fbclid && typeof fbclid === 'string') {
      const timestamp = Math.floor(Date.now() / 1000);
      return `fb.1.${timestamp}.${fbclid.trim()}`;
    }

    // 3. Check Referer URL for fbclid
    const referer = req.headers?.referer || req.headers?.referrer || '';
    if (referer && referer.includes('fbclid=')) {
      try {
        const url = new URL(referer);
        const refFbclid = url.searchParams.get('fbclid');
        if (refFbclid) {
          const timestamp = Math.floor(Date.now() / 1000);
          return `fb.1.${timestamp}.${refFbclid.trim()}`;
        }
      } catch (e) {}
    }

    return null;
  }

  /**
   * Extract or validate Browser ID (_fbp) from cookies or payload
   * Format: fb.1.{creation_time}.{random_number}
   * @param {Object} req - Express request object
   * @param {string} [explicitFbp] - Client-provided fbp
   * @returns {string|null}
   */
  resolveFbp(req, explicitFbp) {
    if (explicitFbp && typeof explicitFbp === 'string' && explicitFbp.startsWith('fb.')) {
      return explicitFbp.trim();
    }

    if (!req) return null;

    const cookieHeader = req.headers?.cookie || '';
    const cookieMatch = cookieHeader.match(/(?:^|;\s*)_fbp=([^;]+)/);
    if (cookieMatch) {
      return decodeURIComponent(cookieMatch[1]).trim();
    }

    return null;
  }

  /**
   * Extract Client IP Address from request headers through multi-layer proxy hierarchy
   * @param {Object} req - Express request object
   * @param {string} [explicitIp]
   * @returns {string|null}
   */
  resolveClientIp(req, explicitIp) {
    if (explicitIp && typeof explicitIp === 'string') {
      return explicitIp.trim();
    }

    if (!req) return null;

    let ip = req.headers?.['cf-connecting-ip'] ||
             req.headers?.['x-real-ip'] ||
             req.headers?.['x-client-ip'] ||
             (req.headers?.['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : null) ||
             req.socket?.remoteAddress ||
             req.connection?.remoteAddress ||
             null;

    if (ip && typeof ip === 'string') {
      // Remove IPv6 wrapper for IPv4 e.g. ::ffff:127.0.0.1 -> 127.0.0.1
      ip = ip.replace(/^::ffff:/, '').trim();
      return ip;
    }

    return null;
  }

  /**
   * Extract Client User Agent
   * @param {Object} req - Express request object
   * @param {string} [explicitUa]
   * @returns {string|null}
   */
  resolveUserAgent(req, explicitUa) {
    if (explicitUa && typeof explicitUa === 'string') {
      return explicitUa.trim();
    }
    return req?.headers?.['user-agent'] || null;
  }

  /**
   * Build complete CAPI user_data parameter object according to Meta standards
   * @param {Object} input - Raw user profile & tracking data
   * @param {Object} [req] - Express request object
   * @returns {Object} Validated and hashed user_data object
   */
  buildUserData(input = {}, req = null) {
    const userData = {};

    // 1. Email (em)
    if (input.email) {
      const em = this.hash(input.email);
      if (em) userData.em = [em];
    }

    // 2. Phone (ph)
    if (input.phone) {
      const ph = this.hashPhone(input.phone);
      if (ph) userData.ph = [ph];
    }

    // 3. Name (fn, ln)
    if (input.name) {
      const { fn, ln } = this.parseAndHashName(input.name);
      if (fn) userData.fn = [fn];
      if (ln) userData.ln = [ln];
    }
    if (input.firstName) {
      const fn = this.hash(input.firstName);
      if (fn) userData.fn = [fn];
    }
    if (input.lastName) {
      const ln = this.hash(input.lastName);
      if (ln) userData.ln = [ln];
    }

    // 4. Geographic & Location data
    if (input.city) {
      const ct = this.hash(input.city);
      if (ct) userData.ct = [ct];
    }
    if (input.state) {
      const st = this.hash(input.state);
      if (st) userData.st = [st];
    }
    if (input.country) {
      const country = this.hash(input.country.substring(0, 2));
      if (country) userData.country = [country];
    }
    if (input.zip) {
      const zp = this.hash(input.zip);
      if (zp) userData.zp = [zp];
    }

    // 5. External ID (external_id)
    if (input.externalId || input.external_id || input.lead_id) {
      const ext = this.hash(input.externalId || input.external_id || input.lead_id);
      if (ext) userData.external_id = [ext];
    }

    // 6. Browser ID (_fbp) & Click ID (_fbc)
    const fbp = this.resolveFbp(req, input.fbp);
    if (fbp) userData.fbp = fbp;

    const fbc = this.resolveFbc(req, input.fbc);
    if (fbc) userData.fbc = fbc;

    // 7. Client IP & User Agent
    const ip = this.resolveClientIp(req, input.clientIp || input.client_ip_address);
    if (ip) userData.client_ip_address = ip;

    const ua = this.resolveUserAgent(req, input.userAgent || input.client_user_agent);
    if (ua) userData.client_user_agent = ua;

    return userData;
  }

  /**
   * Build normalized custom_data parameters for standard & custom events
   * @param {string} eventName 
   * @param {Object} inputCustomData 
   * @returns {Object}
   */
  buildCustomData(eventName, inputCustomData = {}) {
    const customData = { ...(inputCustomData || {}) };

    if (eventName === 'PageView') {
      return customData;
    }

    // Enforce 3-letter uppercase ISO currency
    if (!customData.currency || typeof customData.currency !== 'string' || customData.currency.trim() === '') {
      customData.currency = this.defaultCurrency;
    } else {
      customData.currency = customData.currency.trim().toUpperCase().substring(0, 3);
    }

    // Enforce numeric value
    if (customData.value === undefined || customData.value === null || customData.value === '') {
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
      customData.value = standardValues[eventName] !== undefined ? standardValues[eventName] : 0.00;
    } else if (typeof customData.value === 'string') {
      const clean = parseFloat(customData.value.replace(/[^0-9.-]/g, ''));
      customData.value = isNaN(clean) ? 0.00 : clean;
    } else if (typeof customData.value !== 'number') {
      customData.value = 0.00;
    }

    return customData;
  }

  /**
   * Complete Parameter Builder Pipeline: generates full CAPI event payload
   * @param {Object} params
   * @param {string} params.eventName
   * @param {string} params.eventId
   * @param {string} [params.eventSourceUrl]
   * @param {Object} [params.userData]
   * @param {Object} [params.customData]
   * @param {Object} [params.req]
   * @returns {Object} Standardized Meta CAPI single event payload
   */
  buildEventPayload(params = {}) {
    const {
      eventName = 'Lead',
      eventId,
      eventSourceUrl = '',
      userData = {},
      customData = {},
      req = null
    } = params;

    const resolvedSourceUrl = eventSourceUrl || req?.headers?.referer || '';
    const builtUserData = this.buildUserData(userData, req);
    const builtCustomData = this.buildCustomData(eventName, customData);

    return {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      action_source: 'website',
      event_source_url: resolvedSourceUrl,
      user_data: builtUserData,
      custom_data: builtCustomData
    };
  }
}

module.exports = new MetaParameterBuilder();
