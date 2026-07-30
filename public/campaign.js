// public/campaign.js
(function () {
    // Check if dismissed
    if (localStorage.getItem('iceberg_campaign_dismissed') === 'true') {
        return;
    }

    // Target countdown date: August 31, 2026 23:59:59
    const targetDate = new Date('August 31, 2026 23:59:59').getTime();

    // Create ribbon element
    const ribbon = document.createElement('div');
    ribbon.id = 'campaign-urgency-ribbon';
    ribbon.className = 'fixed top-0 left-0 w-full z-[9999] bg-gradient-to-r from-slate-950 via-cyan-950 to-indigo-950 text-white flex items-center justify-between px-3 md:px-8 py-2 shadow-xl border-b border-cyan-500/30 text-xs md:text-sm font-semibold select-none transition-all duration-300 transform translate-y-0';
    
    const contentContainer = document.createElement('div');
    contentContainer.className = 'flex flex-1 items-center justify-center gap-x-2 md:gap-x-4 text-center pr-6 md:pr-8 overflow-hidden';

    // Badge
    const badge = document.createElement('span');
    badge.className = 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded text-[9px] md:text-[10px] uppercase font-bold tracking-wider hidden sm:inline-block flex-shrink-0';
    badge.innerText = 'Offer';
    contentContainer.appendChild(badge);

    // Title
    const promoText = document.createElement('span');
    promoText.className = 'tracking-wide font-medium truncate text-[11px] md:text-sm';
    promoText.innerHTML = '🎁 Birthday Special: <span class="text-cyan-400 font-bold">33% OFF</span> or Buy 3 Get 1 FREE!';
    contentContainer.appendChild(promoText);

    // Countdown
    const countdown = document.createElement('span');
    countdown.id = 'campaign-countdown';
    countdown.className = 'bg-black/40 border border-cyan-500/20 px-2 py-0.5 rounded text-cyan-300 font-mono tracking-tight font-bold text-[10px] md:text-xs hidden min-[480px]:flex items-center gap-1 flex-shrink-0';
    contentContainer.appendChild(countdown);

    // CTA Button
    const cta = document.createElement('a');
    cta.href = '/birthday-campaign';
    cta.className = 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black italic uppercase text-[9px] md:text-[10px] tracking-wider px-2.5 py-1 rounded transition-all hover:scale-105 active:scale-95 ml-1 md:ml-2 shadow-md shadow-cyan-500/20 flex-shrink-0 whitespace-nowrap';
    cta.innerText = 'Claim Deal';
    contentContainer.appendChild(cta);

    ribbon.appendChild(contentContainer);

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'text-white/60 hover:text-white p-1 transition-colors absolute right-2 md:right-6 flex items-center justify-center text-xs md:text-sm';
    closeBtn.innerHTML = '✕';
    closeBtn.ariaLabel = 'Close banner';
    closeBtn.onclick = function () {
        ribbon.classList.add('-translate-y-full', 'opacity-0');
        localStorage.setItem('iceberg_campaign_dismissed', 'true');
        setTimeout(() => {
            ribbon.remove();
            resetHeaderPositioning();
        }, 300);
    };
    ribbon.appendChild(closeBtn);

    let adjustmentStyleEl = null;

    function updateHeaderPositioning() {
        const height = ribbon.offsetHeight || 38;
        if (!adjustmentStyleEl) {
            adjustmentStyleEl = document.createElement('style');
            adjustmentStyleEl.id = 'campaign-header-adjustment-styles';
            document.head.appendChild(adjustmentStyleEl);
        }
        adjustmentStyleEl.innerHTML = `
            header.fixed, #main-nav {
                top: ${height}px !important;
                transition: top 0.3s ease !important;
            }
            body {
                padding-top: ${height}px !important;
                transition: padding-top 0.3s ease !important;
            }
        `;
    }

    function resetHeaderPositioning() {
        if (adjustmentStyleEl) {
            adjustmentStyleEl.remove();
            adjustmentStyleEl = null;
        }
        const styleReset = document.createElement('style');
        styleReset.innerHTML = `
            header.fixed, #main-nav {
                top: 0px !important;
                transition: top 0.3s ease !important;
            }
            body {
                padding-top: 0px !important;
                transition: padding-top 0.3s ease !important;
            }
        `;
        document.head.appendChild(styleReset);
    }

    // Append to document
    document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(ribbon);
        updateHeaderPositioning();
        updateCountdown();
        setInterval(updateCountdown, 1000);
        window.addEventListener('resize', updateHeaderPositioning);
    });

    // Helper: update countdown timer
    function updateCountdown() {
        const now = new Date().getTime();
        const difference = targetDate - now;

        const countdownElement = document.getElementById('campaign-countdown');
        if (!countdownElement) return;

        if (difference < 0) {
            countdownElement.innerText = 'EXPIRED';
            return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        countdownElement.innerHTML = `⏳ ${days}d ${hours}h ${minutes}m ${seconds}s`;
    }
})();
