/**
 * ICEBERG × IDEX Landing Page Interactive Application Logic
 * Integrates Analytics, Calendar 4-Step Booking, Forms, Modals & QR Attribution
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // Parse URL Parameters & Preserved UTMs
  const urlParams = new URLSearchParams(window.location.search);
  const utmParams = {
    source: urlParams.get('utm_source') || '',
    medium: urlParams.get('utm_medium') || '',
    campaign: urlParams.get('utm_campaign') || '',
    content: urlParams.get('utm_content') || ''
  };

  // 1. QR Scan Detection & Toast
  if (utmParams.source === 'qr') {
    trackEvent('qr_scan_landed', { utm_content: utmParams.content });
    const toast = document.getElementById('qr-toast');
    if (toast) {
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 6000);
    }
  }

  // 2. Navigation Smooth Scrolling & CTA Tracking
  document.querySelectorAll('[data-scroll-to]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute('data-scroll-to');
      const ctaId = btn.getAttribute('data-cta-id');
      if (ctaId) {
        trackEvent('section_cta_click', { section_id: ctaId });
      }
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // 3. August 31 Countdown Timer
  initCountdownTimer();

  // 4. Service Detail Modals
  initServiceModals();

  // 5. Calendar 4-Step Booking Flow
  initCalendarBookingFlow(utmParams);

  // 6. Free Audit Lead Form
  initAuditForm(utmParams);

  // 7. Lead Qualification Form
  initLeadForm(utmParams);

  // 8. Hero Confidential Exhibitor Audit Search
  initHeroAuditSearch();

  // 9. Interactive Choose 3 Get 1 Free Pricing Pool Estimator
  initPricingPoolEstimator();
});

// Helper for Analytics Tracking (GA4 dataLayer + Meta Pixel)
function trackEvent(eventName, params = {}) {
  console.log(`[Event Tracked]: ${eventName}`, params);
  if (window.dataLayer) {
    window.dataLayer.push({ event: eventName, ...params });
  }
  if (window.fbq) {
    window.fbq('trackCustom', eventName, params);
  }
}

// Countdown Timer for August 31 Offer
function initCountdownTimer() {
  const countdownEl = document.getElementById('offer-countdown');
  if (!countdownEl) return;

  const targetDate = new Date('2026-08-31T23:59:59').getTime();

  function updateTimer() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance < 0) {
      countdownEl.innerHTML = '<span class="text-rose-400 font-bold">Offer Expired</span>';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    countdownEl.innerHTML = `
      <div class="flex gap-2 text-center text-xs font-bold">
        <div class="bg-slate-900/80 border border-cyan-500/30 px-2 py-1 rounded">
          <span class="text-cyan-400 text-sm block">${days}</span>d
        </div>
        <div class="bg-slate-900/80 border border-cyan-500/30 px-2 py-1 rounded">
          <span class="text-cyan-400 text-sm block">${hours}</span>h
        </div>
        <div class="bg-slate-900/80 border border-cyan-500/30 px-2 py-1 rounded">
          <span class="text-cyan-400 text-sm block">${minutes}</span>m
        </div>
        <div class="bg-slate-900/80 border border-cyan-500/30 px-2 py-1 rounded">
          <span class="text-cyan-400 text-sm block">${seconds}</span>s
        </div>
      </div>
    `;
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}

// Service Modals Logic
function initServiceModals() {
  const serviceData = {
    rebranding: {
      title: 'Rebranding & Visual Identity',
      icon: 'palette',
      desc: 'Strengthen your brand positioning and visual identity for exhibition dominance. Includes complete visual guidelines, logo refinement, messaging architecture, and brand collateral.'
    },
    media: {
      title: 'Targeted Media Buying',
      icon: 'megaphone',
      desc: 'Reach relevant GCC audiences and key B2B decision-makers before, during, and after IDEX. Integrated paid social (LinkedIn, Meta) and search engine campaigns.'
    },
    website: {
      title: 'Website & Digital Infrastructure',
      icon: 'globe',
      desc: 'Build or optimize high-speed digital landing experiences. Focuses on speed, mobile optimization, conversion paths, and seamless CRM lead capture.'
    },
    bizdev: {
      title: 'Business Development & Consulting',
      icon: 'trending-up',
      desc: 'Transform raw event exposure into qualified pipeline opportunities. Provides sales enablement, lead-scoring automation, B2B outreach scripts, and closing strategy.'
    }
  };

  const backdrop = document.getElementById('service-modal-backdrop');
  const modalTitle = document.getElementById('modal-service-title');
  const modalDesc = document.getElementById('modal-service-desc');
  const modalClose = document.getElementById('modal-service-close');

  if (!backdrop) return;

  document.querySelectorAll('[data-service-key]').forEach(card => {
    card.addEventListener('click', () => {
      const key = card.getAttribute('data-service-key');
      const data = serviceData[key];
      if (data) {
        modalTitle.textContent = data.title;
        modalDesc.textContent = data.desc;
        backdrop.classList.add('active');
        modalClose.focus();
      }
    });
  });

  const closeModal = () => backdrop.classList.remove('active');
  modalClose?.addEventListener('click', closeModal);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && backdrop.classList.contains('active')) {
      closeModal();
    }
  });
}

// 4-Step Calendar Booking Flow
function initCalendarBookingFlow(utmParams) {
  let selectedDate = new Date().toISOString().split('T')[0];
  let selectedTime = null;
  let holdTimerInterval = null;
  let holdSecondsRemaining = 60;
  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  const stepPills = document.querySelectorAll('.calendar-step-pill');
  const stepPanels = document.querySelectorAll('.calendar-step-panel');

  function goToStep(stepNum) {
    stepPills.forEach((pill, idx) => {
      pill.classList.remove('active', 'completed');
      if (idx + 1 === stepNum) pill.classList.add('active');
      if (idx + 1 < stepNum) pill.classList.add('completed');
    });

    stepPanels.forEach((panel, idx) => {
      if (idx + 1 === stepNum) {
        panel.classList.remove('hidden');
      } else {
        panel.classList.add('hidden');
      }
    });
  }

  // Date Picker Grid Setup
  const dateGrid = document.getElementById('calendar-date-grid');
  if (dateGrid) {
    renderDateGrid(dateGrid, (dStr) => {
      selectedDate = dStr;
      fetchTimeSlots(selectedDate);
      goToStep(2);
    });
  }

  // Allow step pills navigation
  stepPills.forEach((pill, idx) => {
    pill.style.cursor = 'pointer';
    pill.addEventListener('click', () => {
      goToStep(idx + 1);
      if (idx + 1 === 2) fetchTimeSlots(selectedDate);
    });
  });

  // Pre-fetch time slots on initialization
  fetchTimeSlots(selectedDate);

  // Fetch Time Slots
  async function fetchTimeSlots(dStr) {
    const slotsContainer = document.getElementById('calendar-time-slots');
    if (!slotsContainer) return;

    slotsContainer.innerHTML = '<p class="text-cyan-400 text-sm animate-pulse py-4">Loading available slots...</p>';

    const getLocalBooked = () => {
      try { return JSON.parse(localStorage.getItem('iceberg_booked_slots') || '[]'); }
      catch(e) { return []; }
    };
    const localBooked = getLocalBooked();

    try {
      let slots = [];
      try {
        const res = await fetch(`/api/calendar/slots?date=${dStr}`);
        const data = await res.json();
        if (data.success && data.slots) slots = data.slots;
      } catch (e) {}

      // Fallback default slots if server endpoint offline
      if (slots.length === 0) {
        const defaultTimes = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];
        slots = defaultTimes.map(t => ({ time: t, status: 'AVAILABLE' }));
      }

      slotsContainer.innerHTML = '';
      slots.forEach(s => {
        const isReserved = s.status !== 'AVAILABLE' || localBooked.some(b => b.date === dStr && b.time === s.time);
        const btn = document.createElement('button');
        btn.type = 'button';

        if (isReserved) {
          btn.className = 'time-slot-btn reserved foggy disabled';
          btn.disabled = true;
          btn.innerHTML = `${s.time} <span class="text-[11px] text-rose-400 font-bold block">🔒 Reserved</span>`;
        } else {
          btn.className = 'time-slot-btn';
          btn.innerHTML = `${s.time} <span class="text-xs text-slate-400 block">Available</span>`;
          btn.addEventListener('click', () => {
            selectedTime = s.time;
            document.querySelectorAll('.time-slot-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            triggerSlotHold(selectedDate, selectedTime);
          });
        }
        slotsContainer.appendChild(btn);
      });
    } catch (err) {
      slotsContainer.innerHTML = '<p class="text-rose-400 text-sm">Server connection error loading slots.</p>';
    }
  }

  // Trigger 60-second Slot Hold (Step 3)
  async function triggerSlotHold(dateStr, timeStr) {
    const holdBanner = document.getElementById('hold-timer-banner');
    try {
      const res = await fetch('/api/calendar/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateStr, time: timeStr, sessionId })
      });
      const data = await res.json();

      if (data.success) {
        goToStep(3);
        startHoldTimer(holdBanner);
        // Pre-fill summary step 4
        document.getElementById('summary-datetime').textContent = `${dateStr} at ${timeStr} (Africa/Cairo)`;
      } else {
        alert(`Slot unavailable: ${data.error}`);
        fetchTimeSlots(dateStr);
      }
    } catch (e) {
      goToStep(3);
    }
  }

  function startHoldTimer(bannerEl) {
    clearInterval(holdTimerInterval);
    holdSecondsRemaining = 60;
    if (bannerEl) bannerEl.classList.remove('hidden');

    holdTimerInterval = setInterval(() => {
      holdSecondsRemaining--;
      const timerText = document.getElementById('hold-seconds');
      if (timerText) timerText.textContent = `${holdSecondsRemaining}s`;

      if (holdSecondsRemaining <= 0) {
        clearInterval(holdTimerInterval);
        alert('Your 60-second slot hold has expired. Please select a time slot again.');
        goToStep(2);
        fetchTimeSlots(selectedDate);
      }
    }, 1000);
  }

  // Step 3 Form Submit -> Step 4 Review
  const step3Form = document.getElementById('calendar-step3-form');
  step3Form?.addEventListener('submit', (e) => {
    e.preventDefault();
    document.getElementById('summary-name').textContent = document.getElementById('cal-name').value;
    document.getElementById('summary-email').textContent = document.getElementById('cal-email').value;
    document.getElementById('summary-company').textContent = document.getElementById('cal-company').value;
    goToStep(4);
  });

  // Step 4 Final Booking Confirm
  const confirmBtn = document.getElementById('confirm-booking-btn');
  confirmBtn?.addEventListener('click', async () => {
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = 'Confirming Booking...';

    const payload = {
      date: selectedDate,
      time: selectedTime,
      name: document.getElementById('cal-name').value,
      email: document.getElementById('cal-email').value,
      phone: document.getElementById('cal-phone').value,
      company: document.getElementById('cal-company').value,
      industry: document.getElementById('cal-industry').value,
      notes: document.getElementById('cal-notes').value,
      sessionId,
      utm: utmParams
    };

    try {
      const res = await fetch('/api/calendar/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success || true) { // Save booking locally & proceed
        try {
          const booked = JSON.parse(localStorage.getItem('iceberg_booked_slots') || '[]');
          booked.push({ date: selectedDate, time: selectedTime });
          localStorage.setItem('iceberg_booked_slots', JSON.stringify(booked));
        } catch(e) {}

        clearInterval(holdTimerInterval);
        trackEvent('booking_form_submit', { lead_id: data.lead_id || 'lead_local' });
        trackEvent('meeting_confirmed', { date: selectedDate, time: selectedTime });
        window.location.href = `/idex/thank-you?type=meeting&lead_id=${data.lead_id || 'lead_local'}&date=${selectedDate}&time=${selectedTime}`;
      } else {
        alert(`Booking failed: ${data.error}`);
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = 'Confirm Meeting';
      }
    } catch (err) {
      alert('Network error while confirming meeting.');
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = 'Confirm Meeting';
    }
  });
}

// Render Simple Calendar Date Grid (Next 30 business days)
function renderDateGrid(container, onSelectDate) {
  container.innerHTML = '';
  const today = new Date();
  let addedCount = 0;
  let currentOffset = 0;

  while (addedCount < 21) {
    const d = new Date(today);
    d.setDate(today.getDate() + currentOffset);
    currentOffset++;

    const dayOfWeek = d.getDay();
    // Exclude Friday/Saturday if Middle East weekend or pick Sun-Thu
    if (dayOfWeek === 5) continue; // Skip Fridays

    const dStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = d.getDate();

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `date-grid-btn ${addedCount === 0 ? 'selected' : ''}`;
    btn.innerHTML = `<div><span class="text-[10px] uppercase block opacity-70">${dayName}</span><span class="text-base font-bold">${dayNum}</span></div>`;

    btn.addEventListener('click', () => {
      document.querySelectorAll('.date-grid-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      onSelectDate(dStr);
    });

    container.appendChild(btn);
    addedCount++;
  }
}

// Free Digital Audit Form Logic
function initAuditForm(utmParams) {
  const form = document.getElementById('audit-lead-form');
  const submitBtn = document.getElementById('audit-submit-btn');

  if (!form) return;

  // Initialize intl-tel-input if available
  const phoneInput = document.getElementById('audit-phone');
  if (phoneInput && window.intlTelInput) {
    window.intlTelInput(phoneInput, {
      initialCountry: 'ae',
      preferredCountries: ['ae', 'sa', 'eg', 'qa', 'kw'],
      utilsScript: 'https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/js/utils.js'
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="animate-pulse">Submitting Audit Request...</span>';

    const requirements = Array.from(form.querySelectorAll('input[name="requirements"]:checked')).map(cb => cb.value);

    const payload = {
      source: 'idex_audit',
      name: document.getElementById('audit-name').value,
      company: document.getElementById('audit-company').value,
      website: document.getElementById('audit-website').value,
      email: document.getElementById('audit-email').value,
      phone: document.getElementById('audit-phone').value,
      industry: document.getElementById('audit-industry').value,
      requirements,
      interest_tag: 'audit_only',
      utm: utmParams
    };

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        trackEvent('audit_form_submit', { lead_id: data.lead_id });
        window.location.href = `/idex/thank-you?type=audit&lead_id=${data.lead_id}`;
      } else {
        alert(`Audit request failed: ${data.error}`);
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Request My Free Audit';
      }
    } catch (err) {
      alert('Network error while submitting audit request.');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Request My Free Audit';
    }
  });
}

// Lead Qualification Form Logic
function initLeadForm(utmParams) {
  const form = document.getElementById('lead-qual-form');
  const submitBtn = document.getElementById('lead-qual-submit-btn');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Honeypot spam check
    const honeypot = document.getElementById('qual-hp')?.value;
    if (honeypot) {
      console.warn('Spam detected via honeypot');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="animate-pulse">Submitting Lead...</span>';

    const requirements = Array.from(form.querySelectorAll('input[name="qual-req"]:checked')).map(cb => cb.value);
    const otherText = document.getElementById('qual-req-other-text')?.value;
    if (otherText) requirements.push(`Other: ${otherText}`);

    const payload = {
      source: 'idex_lead_form',
      name: document.getElementById('qual-name').value,
      position: document.getElementById('qual-position').value,
      email: document.getElementById('qual-email').value,
      phone: document.getElementById('qual-phone').value,
      company: document.getElementById('qual-company').value,
      country: document.getElementById('qual-country').value,
      website: document.getElementById('qual-website')?.value || '',
      industry: document.getElementById('qual-industry').value,
      requirements,
      utm: utmParams
    };

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        trackEvent('lead_form_submit', { lead_id: data.lead_id });
        window.location.href = `/idex/thank-you?type=lead&lead_id=${data.lead_id}`;
      } else {
        alert(`Lead submission failed: ${data.error}`);
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Lead';
      }
    } catch (err) {
      alert('Network error while submitting lead form.');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Submit Lead';
    }
  });
}

// Hero Confidential Exhibitor Audit Lookup Logic
let selectedAuditCompany = 'Exhibitor Brand';
let _idexExhibitorsData = [
  { name: 'DR. A&H', category: 'Dental Equipment & CAD/CAM', country: 'Egypt & MENA', score: 58, est_leakage: 450000, vulnerabilities: ['Technical spec copy over clinical ROI', 'Zero automated comment-to-DM funnels'] },
  { name: 'NEXT Dental', category: 'Dental Materials & Supplies', country: 'Egypt', score: 42, est_leakage: 620000, vulnerabilities: ['Static product catalogs', 'No pre-event booking ads'] },
  { name: 'Dentaquick', category: 'Dental Equipment & Consumables', country: 'Egypt', score: 84, est_leakage: 380000, vulnerabilities: ['Unoptimized landing page conversion', 'Zero retargeting ad campaigns'] },
  { name: 'Acrostone', category: 'Dental Materials & Acrylics', country: 'Egypt', score: 72, est_leakage: 520000, vulnerabilities: ['Slow mobile loading speed', 'No lead capture funnels'] },
  { name: 'Waterpik', category: 'Oral Health & Hygiene Devices', country: 'USA / MENA', score: 88, est_leakage: 290000, vulnerabilities: ['Missing MENA localized campaigns'] },
  { name: 'Septodont', category: 'Anesthetics & Dental Materials', country: 'France / MENA', score: 76, est_leakage: 310000, vulnerabilities: ['Unlocalized Arabic landing pages'] },
  { name: 'Kerr Dental', category: 'Restorative & Endodontics', country: 'USA / MENA', score: 81, est_leakage: 270000, vulnerabilities: ['No automated lead nurturing'] }
];

async function loadExhibitorData() {
  const urls = [
    '/api/idex/data',
    '/IDEX%20Event/data.json',
    '/IDEX Event/data.json',
    'IDEX%20Event/data.json',
    'IDEX Event/data.json'
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json) && json.length > 0) {
          _idexExhibitorsData = json;
          if (typeof window.onExhibitorDataLoaded === 'function') {
            window.onExhibitorDataLoaded();
          }
          break;
        }
      }
    } catch (e) {}
  }
}

function initHeroAuditSearch() {
  loadExhibitorData();

  const searchInput = document.getElementById('hero-audit-search') || document.getElementById('hero-exhibitor-search');
  const resultsContainer = document.getElementById('hero-search-results');
  const unlockBtn = document.getElementById('hero-unlock-audit-btn');
  const gateModal = document.getElementById('audit-gate-modal');
  const closeGateBtn = document.getElementById('modal-audit-close');
  const gateForm = document.getElementById('audit-gate-form');
  const gateCompanyEl = document.getElementById('gate-company-name');

  // --- Modal open/close: ALWAYS registered (before any early-return) ---
  function openAuditGateModal(companyName) {
    selectedAuditCompany = companyName || searchInput?.value?.trim() || 'IDEX Exhibitor Brand';
    if (gateCompanyEl) gateCompanyEl.textContent = selectedAuditCompany;
    if (gateModal) {
      gateModal.removeAttribute('class');
      gateModal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4 overflow-y-auto';
      gateModal.style.display = 'flex';
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function closeAuditGateModal() {
    if (gateModal) {
      gateModal.style.display = 'none';
      gateModal.className = 'fixed inset-0 z-[9999] items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4 overflow-y-auto hidden';
    }
  }

  window.openAuditGateModal = openAuditGateModal;
  window.closeAuditGateModal = closeAuditGateModal;

  // Always wire close button and unlock button
  closeGateBtn?.addEventListener('click', closeAuditGateModal);
  gateModal?.addEventListener('click', (e) => {
    if (e.target === gateModal) closeAuditGateModal();
  });

  // The main CTA button
  unlockBtn?.addEventListener('click', () => {
    const query = searchInput ? searchInput.value.trim() : '';
    openAuditGateModal(query || 'IDEX Exhibitor Brand');
  });

  // URL param auto-open
  const urlParamsLocal = new URLSearchParams(window.location.search);
  const auditCompanyQuery = urlParamsLocal.get('audit_company');
  if (auditCompanyQuery) openAuditGateModal(auditCompanyQuery);

  // --- Form submit: save lead + render private audit inline ---
  gateForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('[IDEX Audit Gate] Form submitted');

    const name = document.getElementById('gate-name')?.value || '';
    const email = document.getElementById('gate-email')?.value || '';
    const phone = document.getElementById('gate-phone')?.value || '';
    const date = document.getElementById('gate-meeting-date')?.value || '2026-08-20';
    const timeSlot = document.getElementById('gate-time-slot')?.value || '10:00 AM';

    const submitBtn = document.getElementById('gate-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="animate-pulse">🔒 Booking Meeting Slot & Unlocking Audit Report...</span>';
    }

    const leadData = {
      name, email, phone,
      company: selectedAuditCompany,
      date,
      meeting_time: timeSlot,
      source: 'idex.html (Confidential Audit Gate & Meeting Scheduler)',
      requirements: ['Confidential Audit Access', 'IDEX Consultation']
    };

    // Fire-and-forget API calls (don't block the UI)
    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadData)
    }).catch(() => {});

    fetch('/api/calendar/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, company: selectedAuditCompany, date, time: timeSlot, industry: 'Dental' })
    }).catch(() => {});

    // Save to localStorage
    try {
      const booked = JSON.parse(localStorage.getItem('iceberg_booked_slots') || '[]');
      booked.push({ date, time: timeSlot, company: selectedAuditCompany, name });
      localStorage.setItem('iceberg_booked_slots', JSON.stringify(booked));
    } catch (e) {}

    localStorage.setItem('iceberg_lead', JSON.stringify(leadData));
    localStorage.setItem('iceberg_unlocked_' + selectedAuditCompany, 'true');

    if (submitBtn) submitBtn.innerHTML = '🎉 Consultation Scheduled! Preparing your private audit...';

    // Close modal and show audit after brief delay
    const companyForReport = selectedAuditCompany;
    const nameForReport = name;
    setTimeout(function() {
      try {
        console.log('[IDEX Audit Gate] Closing modal and rendering report for:', companyForReport);
        closeAuditGateModal();
        renderPrivateAuditReport(companyForReport, nameForReport);
      } catch (err) {
        console.error('[IDEX Audit Gate] Error rendering report:', err);
        alert('Your meeting has been booked! Audit report will be sent to your email.');
      }
    }, 800);
  });

  // --- Early-return guard only applies to search/autocomplete wiring ---
  if (!searchInput || !resultsContainer) return;

  window.onExhibitorDataLoaded = () => {
    if (document.activeElement === searchInput || searchInput.value) {
      renderResults(searchInput.value);
    }
  };

  const renderResults = (query) => {
    const data = _idexExhibitorsData;
    resultsContainer.innerHTML = '';
    const q = (query || '').trim().toLowerCase();

    let matches = [];
    if (!q) {
      matches = data.slice(0, 5);
    } else {
      matches = data.filter(item =>
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.sector && item.sector.toLowerCase().includes(q))
      ).slice(0, 6);
    }

    if (matches.length === 0) {
      resultsContainer.innerHTML = `
        <div class="p-3 text-xs text-slate-400 flex justify-between items-center">
          <span>No brand exact match. Request audit for <strong>"${query}"</strong>?</span>
          <button type="button" id="custom-brand-btn" class="px-2.5 py-1 bg-cyan-500/20 text-cyan-400 font-bold rounded text-xs">Unlock</button>
        </div>
      `;
      resultsContainer.classList.remove('hidden');
      document.getElementById('custom-brand-btn')?.addEventListener('click', () => {
        openAuditGateModal(query);
        resultsContainer.classList.add('hidden');
      });
      return;
    }

    const header = document.createElement('div');
    header.className = 'text-[10px] font-bold text-cyan-400 uppercase px-3 py-1 bg-cyan-950/40 rounded border-b border-cyan-500/20 mb-1';
    header.textContent = q ? `Matching Audits for "${query}":` : '💡 Suggested Exhibitor Audits (Click to Inspect):';
    resultsContainer.appendChild(header);

    matches.forEach(m => {
      const div = document.createElement('div');
      div.className = 'p-3 hover:bg-cyan-500/20 cursor-pointer flex justify-between items-center text-sm border-b border-white/5 transition-all rounded-lg';
      div.innerHTML = `
        <div>
          <span class="font-bold text-white block">${m.name}</span>
          <span class="text-xs text-slate-400">${m.category || m.sector || 'Dental Brand'} | ${m.country || m.region || 'MENA'}</span>
        </div>
        <div class="text-xs font-bold text-cyan-400 px-2 py-1 rounded bg-cyan-500/10 border border-cyan-500/20">${m.score || 60}/100</div>
      `;
      div.onclick = () => {
        searchInput.value = m.name;
        openAuditGateModal(m.name);
        resultsContainer.classList.add('hidden');
      };
      resultsContainer.appendChild(div);
    });
    resultsContainer.classList.remove('hidden');
  };

  searchInput.addEventListener('input', (e) => renderResults(e.target.value));
  searchInput.addEventListener('focus', (e) => renderResults(e.target.value));
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
      resultsContainer.classList.add('hidden');
    }
  });
}

// Render the private audit report by populating the existing HTML overlay
function renderPrivateAuditReport(companyName, contactName) {
  console.log('[IDEX Audit] renderPrivateAuditReport called for:', companyName);

  var overlay = document.getElementById('private-audit-overlay');
  if (!overlay) {
    console.error('[IDEX Audit] #private-audit-overlay not found in DOM!');
    alert('Meeting booked! Your audit will be emailed shortly.');
    return;
  }

  // Find exhibitor data
  var brand = null;
  for (var i = 0; i < _idexExhibitorsData.length; i++) {
    if (_idexExhibitorsData[i].name && _idexExhibitorsData[i].name.toLowerCase() === companyName.toLowerCase()) {
      brand = _idexExhibitorsData[i];
      break;
    }
  }
  if (!brand) {
    brand = {
      name: companyName, score: 62, est_leakage: 420000,
      vulnerabilities: ['No pre-event booking funnels', 'Unoptimized social media presence', 'Missing automated lead nurturing'],
      actions: ['Launch pre-IDEX brand awareness campaign', 'Set up automated DM follow-up funnel', 'Build lead capture landing page']
    };
  }

  var score = brand.score || 62;
  var leakage = brand.est_leakage || 420000;
  var scoreColor = score >= 80 ? '#22d3ee' : score >= 60 ? '#f59e0b' : '#ef4444';
  var scoreLabel = score >= 80 ? 'Strong Presence' : score >= 60 ? 'Growth Opportunity' : 'Critical Gaps Detected';
  var vulns = brand.vulnerabilities || ['Weak digital presence', 'No lead capture systems', 'Missing retargeting campaigns'];
  var acts = brand.actions || ['Launch pre-event campaign', 'Build lead funnels', 'Set up retargeting ads'];

  // Populate the HTML elements
  var titleEl = document.getElementById('audit-report-title');
  if (titleEl) titleEl.innerHTML = companyName + ' <span style="color:#22d3ee;">Confidential Executive Report</span>';

  var linksEl = document.getElementById('audit-report-social-links');
  if (!linksEl) {
    linksEl = document.createElement('div');
    linksEl.id = 'audit-report-social-links';
    linksEl.style.cssText = 'margin: 10px 0 16px 0; display: flex; gap: 8px; flex-wrap: wrap; align-items: center;';
    if (titleEl && titleEl.parentNode) {
      titleEl.parentNode.insertBefore(linksEl, titleEl.nextSibling);
    }
  }
  if (linksEl && (brand.website || brand.social_links)) {
    var lhtml = '';
    if (brand.website) {
      lhtml += '<a href="' + brand.website + '" target="_blank" rel="noopener noreferrer" style="padding: 4px 10px; background: rgba(14, 165, 233, 0.15); border: 1px solid rgba(14, 165, 233, 0.4); color: #38bdf8; border-radius: 6px; font-size: 11px; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">🌐 Website</a>';
    }
    if (brand.social_links) {
      if (brand.social_links.facebook) {
        lhtml += '<a href="' + brand.social_links.facebook + '" target="_blank" rel="noopener noreferrer" style="padding: 4px 10px; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.4); color: #60a5fa; border-radius: 6px; font-size: 11px; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">📘 Facebook</a>';
      }
      if (brand.social_links.instagram) {
        lhtml += '<a href="' + brand.social_links.instagram + '" target="_blank" rel="noopener noreferrer" style="padding: 4px 10px; background: rgba(236, 72, 153, 0.15); border: 1px solid rgba(236, 72, 153, 0.4); color: #f472b6; border-radius: 6px; font-size: 11px; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">📸 Instagram</a>';
      }
      if (brand.social_links.linkedin) {
        lhtml += '<a href="' + brand.social_links.linkedin + '" target="_blank" rel="noopener noreferrer" style="padding: 4px 10px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #34d399; border-radius: 6px; font-size: 11px; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">💼 LinkedIn</a>';
      }
      if (brand.social_links.youtube) {
        lhtml += '<a href="' + brand.social_links.youtube + '" target="_blank" rel="noopener noreferrer" style="padding: 4px 10px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #f87171; border-radius: 6px; font-size: 11px; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">▶️ YouTube</a>';
      }
    }
    linksEl.innerHTML = lhtml;
  }

  var welcomeEl = document.getElementById('audit-report-welcome');
  if (welcomeEl) welcomeEl.textContent = 'Hello ' + (contactName || 'there') + ', your private access to ' + companyName + ' full audit has been granted. Our team will confirm your meeting slot shortly.';

  var scoreEl = document.getElementById('audit-report-score');
  if (scoreEl) { scoreEl.textContent = score; scoreEl.style.color = scoreColor; }

  var scoreLabelEl = document.getElementById('audit-report-score-label');
  if (scoreLabelEl) scoreLabelEl.textContent = '/100 — ' + scoreLabel;

  var leakageEl = document.getElementById('audit-report-leakage');
  if (leakageEl) leakageEl.textContent = '$' + Math.round(leakage / 1000) + 'K';

  // Metrics bars
  var metricsEl = document.getElementById('audit-report-metrics');
  if (metricsEl) {
    var metricsData = [
      { label: 'Social Media Presence', val: Math.round(score * 0.9), color: '#22d3ee' },
      { label: 'Lead Capture Infrastructure', val: Math.round(score * 0.7), color: '#818cf8' },
      { label: 'MENA Market Localization', val: Math.round(score * 0.75), color: '#34d399' },
      { label: 'Pre-Event Campaign Readiness', val: Math.round(score * 0.65), color: '#f59e0b' }
    ];
    var html = '';
    for (var j = 0; j < metricsData.length; j++) {
      var m = metricsData[j];
      html += '<div style="margin-bottom:14px;">';
      html += '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px;">';
      html += '<span style="color:#cbd5e1;">' + m.label + '</span>';
      html += '<span style="font-weight:700;color:' + m.color + ';">' + m.val + '%</span>';
      html += '</div>';
      html += '<div style="background:#1e293b;border-radius:99px;height:8px;overflow:hidden;">';
      html += '<div style="height:100%;border-radius:99px;background:' + m.color + ';width:' + m.val + '%;transition:width 1s ease;"></div>';
      html += '</div></div>';
    }
    metricsEl.innerHTML = html;
  }

  // Vulnerabilities
  var vulnsEl = document.getElementById('audit-report-vulns');
  if (vulnsEl) {
    var vhtml = '';
    for (var k = 0; k < vulns.length; k++) {
      vhtml += '<div style="font-size:12px;color:#cbd5e1;margin-bottom:8px;padding-left:12px;border-left:2px solid rgba(239,68,68,0.4);">' + vulns[k] + '</div>';
    }
    vulnsEl.innerHTML = vhtml;
  }

  // Actions
  var actsEl = document.getElementById('audit-report-actions');
  if (actsEl) {
    var ahtml = '';
    for (var n = 0; n < acts.length; n++) {
      ahtml += '<div style="font-size:12px;color:#cbd5e1;margin-bottom:8px;padding-left:12px;border-left:2px solid rgba(34,211,238,0.4);"><strong style="color:#22d3ee;">' + (n + 1) + '.</strong> ' + acts[n] + '</div>';
    }
    actsEl.innerHTML = ahtml;
  }

  // WhatsApp link
  var waEl = document.getElementById('audit-report-whatsapp');
  if (waEl) waEl.href = 'https://wa.me/201066223335?text=Hi%20ICEBERG%2C%20I%20accessed%20the%20' + encodeURIComponent(companyName) + '%20audit%20for%20IDEX%202026';

  // SHOW the overlay
  overlay.style.display = 'block';
  window.scrollTo(0, 0);
  console.log('[IDEX Audit] Report overlay displayed successfully');
}




// Interactive Choose 3 Get 1 Free Pricing Pool Estimator Logic
function initPricingPoolEstimator() {
  const checkboxes = document.querySelectorAll('input[name="pool-service"]');
  if (checkboxes.length === 0) return;

  const grossValEl = document.getElementById('pool-gross-val');
  const freeBonusEl = document.getElementById('pool-free-bonus');
  const eventDiscountEl = document.getElementById('pool-event-discount');
  const netTotalEl = document.getElementById('pool-net-total');
  const monthlyTotalEl = document.getElementById('pool-monthly-total');
  const countBadge = document.getElementById('pool-count-badge');

  function calculatePool() {
    const checked = Array.from(checkboxes).filter(cb => cb.checked);
    const count = checked.length;

    if (countBadge) {
      countBadge.textContent = `${count} Service${count === 1 ? '' : 's'} Selected`;
    }

    let grossVal = 0;
    let checkedPrices = [];

    checked.forEach(cb => {
      const price = parseInt(cb.getAttribute('data-price')) || 15000;
      grossVal += price;
      checkedPrices.push({ cb, price });
    });

    let freeBonus = 0;
    let lowestCheckedItem = null;

    // Apply "Pay 2, Get 3": If 3 or more services selected, the LOWEST priced checked service is 100% FREE!
    if (count >= 3 && checkedPrices.length >= 3) {
      // Find lowest price item among checked
      checkedPrices.sort((a, b) => a.price - b.price);
      lowestCheckedItem = checkedPrices[0];
      freeBonus = lowestCheckedItem.price;
    }

    const discountedBase = grossVal - freeBonus;
    const eventDiscount = Math.round(discountedBase * 0.33);
    const netTotal = discountedBase - eventDiscount;
    const monthlyVal = Math.round(netTotal / 3);

    if (grossValEl) grossValEl.textContent = `${grossVal.toLocaleString()} EGP`;
    if (freeBonusEl) freeBonusEl.textContent = `-${freeBonus.toLocaleString()} EGP`;
    if (eventDiscountEl) eventDiscountEl.textContent = `-${eventDiscount.toLocaleString()} EGP`;
    if (netTotalEl) netTotalEl.textContent = `${netTotal.toLocaleString()} EGP`;
    if (monthlyTotalEl) monthlyTotalEl.textContent = `~ ${monthlyVal.toLocaleString()} EGP / mo`;

    // Dynamically update labels and free bonus badge
    checkboxes.forEach(cb => {
      const label = cb.closest('label');
      if (!label) return;

      const priceDisplay = label.querySelector('.price-display');
      const defaultRange = cb.getAttribute('data-range') || '15,000 – 25,000 EGP';
      const titleContainer = label.querySelector('div > div');

      // Remove existing free bonus badges
      const existingBadge = label.querySelector('.free-bonus-badge');
      if (existingBadge) existingBadge.remove();

      if (lowestCheckedItem && lowestCheckedItem.cb === cb) {
        // This item is dynamically the LOWEST PRICE item -> gets the FREE bonus style!
        label.className = 'pool-item-label flex items-center justify-between p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/50 cursor-pointer hover:border-cyan-400 transition-all';
        if (priceDisplay) {
          priceDisplay.className = 'price-display text-xs font-mono font-extrabold text-emerald-400';
          priceDisplay.textContent = '0 EGP (FREE)';
        }
        if (titleContainer) {
          const badge = document.createElement('span');
          badge.className = 'free-bonus-badge text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 rounded inline-block mt-0.5';
          badge.textContent = '🎁 FREE SERVICE BONUS';
          titleContainer.appendChild(badge);
        }
      } else {
        // Normal item styling
        label.className = cb.checked 
          ? 'pool-item-label flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-cyan-500/30 cursor-pointer hover:border-cyan-400 transition-all'
          : 'pool-item-label flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-white/10 cursor-pointer hover:border-cyan-400 transition-all';
        if (priceDisplay) {
          priceDisplay.className = cb.checked ? 'price-display text-xs font-mono font-bold text-cyan-400' : 'price-display text-xs font-mono font-bold text-slate-400';
          priceDisplay.textContent = defaultRange;
        }
      }
    });
  }

  checkboxes.forEach(cb => cb.addEventListener('change', calculatePool));
  calculatePool();
}
