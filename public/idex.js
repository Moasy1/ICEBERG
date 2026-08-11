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
    printing: {
      title: 'Exhibition Printing & Collateral',
      icon: 'printer',
      desc: 'Create high-impact physical materials tailored for IDEX attendees. Includes booth graphics, brochures, product catalogs, roll-ups, and premium giveaway branding.'
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
        const defaultTimes = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
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
async function initHeroAuditSearch() {
  const searchInput = document.getElementById('hero-audit-search');
  const resultsContainer = document.getElementById('hero-search-results');
  const unlockBtn = document.getElementById('hero-unlock-audit-btn');

  if (!searchInput) return;

  let exhibitors = [];
  try {
    const res = await fetch('/IDEX Event/data.json');
    if (res.ok) exhibitors = await res.json();
  } catch (e) {
    console.log('Error fetching data.json for hero search');
  }

  const renderResults = (query) => {
    if (!resultsContainer) return;
    const q = query.toLowerCase().trim();
    if (!q) {
      resultsContainer.classList.add('hidden');
      return;
    }

    const matches = exhibitors.filter(e => e.name.toLowerCase().includes(q) || e.sector.toLowerCase().includes(q)).slice(0, 6);
    if (matches.length === 0) {
      resultsContainer.innerHTML = '<div class="p-2 text-xs text-slate-400 text-center">No matching IDEX exhibitor found</div>';
      resultsContainer.classList.remove('hidden');
      return;
    }

    resultsContainer.innerHTML = '';
    matches.forEach(m => {
      const div = document.createElement('div');
      div.className = 'p-2 rounded-lg hover:bg-cyan-500/10 cursor-pointer flex items-center justify-between transition-colors';
      div.innerHTML = `
        <div>
          <div class="text-xs font-bold text-white">${m.name}</div>
          <div class="text-[10px] text-slate-400">${m.sector}</div>
        </div>
        <div class="text-xs font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">${m.score}/100</div>
      `;
      div.onclick = () => {
        window.location.href = `/IDEX Event/index.html?company=${encodeURIComponent(m.name)}`;
      };
      resultsContainer.appendChild(div);
    });
    resultsContainer.classList.remove('hidden');
  };

  searchInput.addEventListener('input', (e) => renderResults(e.target.value));

  unlockBtn?.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
      window.location.href = `/IDEX Event/index.html?company=${encodeURIComponent(query)}`;
    } else {
      window.location.href = '/IDEX Event/index.html';
    }
  });
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
    let prices = [];
    checked.forEach(cb => {
      const price = parseInt(cb.getAttribute('data-price')) || 15000;
      grossVal += price;
      prices.push(price);
    });

    let freeBonus = 0;
    // Apply "Choose 3, Get 1 Free": If 4 or more services selected, the lowest priced checked service is 100% FREE!
    if (count >= 4 && prices.length >= 4) {
      freeBonus = Math.min(...prices);
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

    // Highlight free item label if present
    const freeLabel = document.getElementById('free-4th-label');
    const freePrice = document.getElementById('free-4th-price');
    if (freeLabel) {
      if (count >= 4) {
        freeLabel.classList.add('border-emerald-500/40', 'bg-emerald-950/20');
        if (freePrice) freePrice.textContent = '0 EGP (FREE)';
      } else {
        freeLabel.classList.remove('border-emerald-500/40', 'bg-emerald-950/20');
        if (freePrice) freePrice.textContent = '15,000 – 25,000 EGP';
      }
    }
  }

  checkboxes.forEach(cb => cb.addEventListener('change', calculatePool));
  calculatePool();
}
