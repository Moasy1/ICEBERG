/**
 * ICEBERG Client Suite — Mobile PWA Install & Add to Home Screen Controller
 * Detects mobile visitors (iOS / Android / tablets) and prompts them to install
 * the app to their home screen with native install prompts or visual step-by-step guides.
 */

const PortalPWA = (() => {
  let deferredPrompt = null;
  const DISMISS_KEY = 'iceberg_pwa_dismissed_until';
  const SNOOZE_HOURS = 24;

  // ── DETECTION HELPERS ──────────────────────────────────────────────────────
  function isStandalone() {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://')
    );
  }

  function isMobile() {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isTouchScreen = ('ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0)) && window.innerWidth <= 900;
    const isSmallScreen = window.innerWidth <= 768;
    return isMobileUA || isTouchScreen || isSmallScreen;
  }

  function isIOS() {
    const ua = navigator.userAgent || '';
    return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function isDismissed() {
    try {
      const dismissedUntil = localStorage.getItem(DISMISS_KEY);
      if (!dismissedUntil) return false;
      return Date.now() < parseInt(dismissedUntil, 10);
    } catch (e) {
      return false;
    }
  }

  // ── SERVICE WORKER REGISTRATION ───────────────────────────────────────────
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/portal/sw.js', { scope: '/portal/' })
          .then((reg) => {
            console.log('[ICEBERG PWA] Service worker registered with scope:', reg.scope);
          })
          .catch((err) => {
            console.warn('[ICEBERG PWA] Service worker registration note:', err.message);
          });
      });
    }
  }

  // ── BANNER VISIBILITY ─────────────────────────────────────────────────────
  function showBanner() {
    const banner = document.getElementById('pwa-install-banner');
    if (!banner) return;

    banner.classList.remove('hidden', 'pwa-banner-hide');
    banner.classList.add('pwa-banner-slide');

    // Adapt action text based on platform
    const actionText = document.getElementById('pwa-banner-action-text');
    if (actionText) {
      if (isIOS()) {
        actionText.textContent = 'How to Install';
      } else {
        actionText.textContent = 'Install App';
      }
    }

    if (window.lucide) window.lucide.createIcons();
  }

  function dismissBanner(remember = true) {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.classList.add('pwa-banner-hide');
      setTimeout(() => {
        banner.classList.add('hidden');
        banner.classList.remove('pwa-banner-hide');
      }, 300);
    }

    if (remember) {
      try {
        const snoozeTime = Date.now() + SNOOZE_HOURS * 60 * 60 * 1000;
        localStorage.setItem(DISMISS_KEY, snoozeTime.toString());
      } catch (e) {}
    }

    // Keep floating trigger available so user can still install anytime
    showFloatingTrigger();
  }

  function showFloatingTrigger() {
    if (isStandalone()) return;
    const trigger = document.getElementById('pwa-floating-trigger');
    if (trigger && isMobile()) {
      trigger.classList.remove('hidden');
      if (window.lucide) window.lucide.createIcons();
    }
  }

  function hideFloatingTrigger() {
    const trigger = document.getElementById('pwa-floating-trigger');
    if (trigger) trigger.classList.add('hidden');
  }

  function hideAllPrompts() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) banner.classList.add('hidden');
    hideFloatingTrigger();

    const authPill = document.getElementById('auth-install-pill');
    if (authPill) authPill.classList.add('hidden');

    const hdrBtn = document.getElementById('hdr-install-btn');
    if (hdrBtn) hdrBtn.classList.add('hidden');
  }

  // ── MODAL GUIDES ──────────────────────────────────────────────────────────
  function openIosModal() {
    const modal = document.getElementById('pwa-ios-modal');
    if (modal) {
      modal.classList.remove('hidden');
      if (window.lucide) window.lucide.createIcons();
    }
  }

  function closeIosModal() {
    const modal = document.getElementById('pwa-ios-modal');
    if (modal) modal.classList.add('hidden');
  }

  function openGenericModal() {
    const modal = document.getElementById('pwa-generic-modal');
    if (modal) {
      modal.classList.remove('hidden');
      if (window.lucide) window.lucide.createIcons();
    }
  }

  function closeGenericModal() {
    const modal = document.getElementById('pwa-generic-modal');
    if (modal) modal.classList.add('hidden');
  }

  // ── PROMPT INSTALL ACTION ─────────────────────────────────────────────────
  async function promptInstall() {
    // If on iOS Safari / WebKit, open the interactive step-by-step visual guide
    if (isIOS()) {
      openIosModal();
      return;
    }

    // If native prompt is captured (Chrome / Android / Edge)
    if (deferredPrompt) {
      try {
        const promptEvent = deferredPrompt;
        deferredPrompt = null;
        promptEvent.prompt();
        promptEvent.userChoice.then((choiceResult) => {
          console.log('[ICEBERG PWA] User install choice:', choiceResult.outcome);
          if (choiceResult.outcome === 'accepted') {
            hideAllPrompts();
          }
        }).catch((err) => {
          console.warn('[ICEBERG PWA] userChoice error:', err);
        });
      } catch (err) {
        console.error('[ICEBERG PWA] Install prompt error:', err);
      }
      return;
    }

    // Fallback: Show manual browser install instructions
    openGenericModal();
  }

  // ── INITIALIZATION ────────────────────────────────────────────────────────
  function init() {
    registerServiceWorker();

    // If already launched in standalone PWA mode, don't show any install prompts
    if (isStandalone()) {
      console.log('[ICEBERG PWA] Running in standalone installed mode.');
      hideAllPrompts();
      return;
    }

    // Capture beforeinstallprompt event for Android / Chromium browsers
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      console.log('[ICEBERG PWA] beforeinstallprompt captured.');

      const actionText = document.getElementById('pwa-banner-action-text');
      if (actionText) actionText.textContent = 'Install App';
    });

    // Handle successful installation
    window.addEventListener('appinstalled', () => {
      console.log('[ICEBERG PWA] App successfully installed to Home Screen.');
      deferredPrompt = null;
      hideAllPrompts();
      if (typeof PortalApp !== 'undefined' && typeof PortalApp.showToast === 'function') {
        PortalApp.showToast('ICEBERG Portal added to your Home Screen!', 'success');
      }
    });

    // Check if visitor is on mobile
    if (isMobile()) {
      // Show install badge on login view
      const authPill = document.getElementById('auth-install-pill');
      if (authPill) authPill.classList.remove('hidden');

      // Show header install button
      const hdrBtn = document.getElementById('hdr-install-btn');
      if (hdrBtn) hdrBtn.classList.remove('hidden');

      // If not dismissed recently, show the notification banner after a brief moment
      if (!isDismissed()) {
        setTimeout(() => {
          showBanner();
        }, 700);
      } else {
        // If dismissed previously, still provide the floating trigger button
        showFloatingTrigger();
      }
    } else {
      // Desktop: Enable header button so desktop users can install via Chrome if desired
      const hdrBtn = document.getElementById('hdr-install-btn');
      if (hdrBtn && deferredPrompt) {
        hdrBtn.classList.remove('hidden');
      }
    }

    if (window.lucide) window.lucide.createIcons();
  }

  return {
    init,
    promptInstall,
    showBanner,
    dismissBanner,
    openIosModal,
    closeIosModal,
    openGenericModal,
    closeGenericModal,
    showFloatingTrigger,
    hideFloatingTrigger,
    hideAllPrompts,
    isMobile,
    isIOS,
    isStandalone
  };
})();

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => PortalPWA.init());
} else {
  PortalPWA.init();
}
