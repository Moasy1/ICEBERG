gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

console.log("ICEBERG: Script initialized.");

// --- Initialization ---
let init = () => {
    console.log("ICEBERG: DOM and Assets loaded. Starting animations...");

    // Hide horizontal scroll
    document.body.style.overflowX = 'hidden';

    // Performance optimization
    ScrollTrigger.config({ limitCallbacks: true });

    initLucideIcons();

    // Setup Top level event listeners within init to ensure elements exist
    setupEventListeners();

    // Run the loader
    runLoader();

    // Fallback: If loader hasn't hidden in 5 seconds, force hide it
    setTimeout(() => {
        const loader = document.querySelector("#loader");
        if (loader && loader.style.display !== 'none') {
            console.warn("ICEBERG: Loader timeout triggered. Force revealing page.");
            gsap.to("#loader", {
                yPercent: -100, duration: 1, ease: "expo.out", onComplete: () => {
                    document.querySelector("#loader").style.display = 'none';
                    runHeroEntrance(); // Fallback entrance
                }
            });
        }
    }, 5000);
};

const initLucideIcons = () => {
    if (!window.lucide || typeof window.lucide.createIcons !== 'function') {
        console.warn("ICEBERG: Lucide icons library did not load.");
        return;
    }

    window.lucide.createIcons();
};

// --- Event Listeners ---
const setupEventListeners = () => {
    // Scroll to Top Action
    const sttBtn = document.querySelector('#scroll-to-top');
    if (sttBtn) {
        sttBtn.addEventListener('click', () => {
            gsap.to(window, { duration: 2, scrollTo: 0, ease: "power4.inOut" });
        });
    }

    // Nav Link Smooth Scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (document.querySelector(targetId)) {
                gsap.to(window, {
                    duration: 1.5,
                    scrollTo: targetId,
                    ease: "power4.inOut"
                });
            }
        });
    });

    // Contact Form Submission
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn ? submitBtn.textContent : 'Submit';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Sending...';
            }
            
            const nameInput = this.querySelector('input[name="name"]');
            const emailInput = this.querySelector('input[name="email"]');
            const phoneInput = this.querySelector('input[name="phone"]');
            const businessNameInput = this.querySelector('input[name="business_name"]');
            const businessLinkInput = this.querySelector('input[name="business_link"]');
            const messageInput = this.querySelector('textarea');
            const serviceSelect = this.querySelector('select');
            
            const formData = {
                name: nameInput ? nameInput.value : '',
                email: emailInput ? emailInput.value : '',
                phone: phoneInput ? phoneInput.value : '',
                business_name: businessNameInput ? businessNameInput.value : '',
                business_link: businessLinkInput ? businessLinkInput.value : '',
                message: messageInput ? messageInput.value : '',
                company: businessNameInput && businessNameInput.value ? businessNameInput.value : (serviceSelect ? `Service Requested: ${serviceSelect.value}` : 'Static Landing Page')
            };
            
            try {
                const response = await fetch('/api/contact/submit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showLocalNotification(result.message || 'Message sent successfully!', 'success');
                    this.reset();
                } else {
                    showLocalNotification(result.error || 'Failed to send message', 'error');
                }
            } catch (error) {
                console.error('Error submitting form:', error);
                showLocalNotification('Failed to send message. Please try again.', 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                }
            }
        });
    }

    // Sticky Header Scroll Handler
    const nav = document.getElementById('main-nav');
    if (nav) {
        const toggleScrolled = () => {
            if (window.scrollY > 20) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }
        };
        window.addEventListener('scroll', toggleScrolled);
        toggleScrolled(); // Run once initially
    }
};

// Local notification helper
function showLocalNotification(message, type = 'info') {
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500',
        warning: 'bg-yellow-500'
    };

    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// --- Loader ---
const runLoader = () => {
    const tl = gsap.timeline();

    tl.to("#loader-text", {
        opacity: 1,
        duration: 0.8,
        ease: "power2.out"
    })
        .to("#loader-bar", {
            width: "100%",
            duration: 1.5,
            ease: "expo.out"
        })
        .to("#loader-text", {
            y: -20,
            opacity: 0,
            duration: 0.5,
            ease: "power2.in"
        })
        .to("#loader", {
            yPercent: -100,
            duration: 1.2,
            ease: "expo.inOut",
            onComplete: () => {
                document.querySelector("#loader").style.display = 'none';
            }
        }, "-=0.2")
        .call(() => {
            runHeroEntrance();
        });
};

// --- Hero Entrance ---
const runHeroEntrance = () => {
    if (window.heroEntranceRun) return; // Prevent double run
    window.heroEntranceRun = true;

    console.log("ICEBERG: Running Hero Entrance...");
    const tl = gsap.timeline();

    tl.to("#hero-badge", { opacity: 1, y: 0, duration: 1, ease: "power4.out" })
        .to(".header-anim", { opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: "power4.out" }, "-=0.8")
        .to("#hero-title .char", { opacity: 1, y: 0, duration: 1.5, stagger: 0.05, ease: "expo.out" }, "-=0.5")
        .to("#hero-desc", { opacity: 1, y: 0, duration: 1, ease: "power4.out" }, "-=1")
        .to("#hero-cta", { opacity: 1, y: 0, duration: 1, ease: "power4.out" }, "-=0.8");

    // Additional animations that were part of the original mobile entrance, now applied generally
    gsap.to("#scroll-hint", {
        opacity: 1,
        y: -20,
        duration: 1,
    }, "-=0.8")
        .to("#hero-cta", {
            y: -10,
            opacity: 1,
            duration: 1,
            ease: "back.out(1.7)"
        }, "-=0.8")
        .to("#scroll-hint", {
            opacity: 1,
            y: -20,
            duration: 1,
            ease: "power2.out"
        }, "-=0.5")
        .to("#brand-marquee", {
            opacity: 1,
            duration: 1,
            ease: "power2.out"
        }, "-=0.5");

    // Start Scroll Animations after entrance
    initScrollAnimations();
};

// --- Scroll Animations ---
const initScrollAnimations = () => {
    // Multi-Layered Parallax Hero & Global Decorations
    const layers = document.querySelectorAll('.parallax-layer');
    layers.forEach(layer => {
        const depth = layer.getAttribute('data-depth');
        const movement = -(depth * 150);

        // Use the closest parent section or #home as the trigger
        const trigger = layer.closest('section') || "#home";

        gsap.to(layer, {
            scrollTrigger: {
                trigger: trigger,
                start: "top bottom",
                end: "bottom top",
                scrub: true
            },
            y: movement,
            ease: "none"
        });
    });

    // Fade Hero content on scroll
    gsap.to("#home .container", {
        scrollTrigger: {
            trigger: "#home",
            start: "top top",
            end: "50% top",
            scrub: true
        },
        opacity: 0,
        y: -100,
        ease: "none"
    });

    // Brand Marquee Fade Out
    gsap.to("#brand-marquee", {
        scrollTrigger: {
            trigger: "#brand-marquee",
            start: "top 20%",
            scrub: true
        },
        opacity: 0,
        ease: "none"
    });

    // Speed-based Blur & Skew (Velocity)
    let proxy = { skew: 0 };
    let skewSetter = gsap.quickSetter(".glass-card, .portfolio-item", "skewY", "deg");
    let clamp = gsap.utils.clamp(-20, 20); // maximum skew of 20 degrees
    let blurSetter = gsap.quickSetter(".portfolio-item img, .glass-card", "filter", (v) => `blur(${v}px)`);

    ScrollTrigger.create({
        onUpdate: (self) => {
            let skew = clamp(self.getVelocity() / -300);
            if (Math.abs(skew) > Math.abs(proxy.skew)) {
                proxy.skew = skew;
                gsap.to(proxy, {
                    skew: 0,
                    duration: 0.8,
                    ease: "power3",
                    overwrite: true,
                    onUpdate: () => {
                        skewSetter(proxy.skew);
                        blurSetter(Math.abs(proxy.skew) * 0.8);
                    }
                });
            }
        }
    });

    // Custom Split Reveal for headings
    document.querySelectorAll('.reveal-type').forEach(el => {
        const text = el.innerText;
        el.innerHTML = text.split('').map(char => `<span class="char inline-block">${char === ' ' ? '&nbsp;' : char}</span>`).join('');

        gsap.from(el.querySelectorAll('.char'), {
            scrollTrigger: {
                trigger: el,
                start: "top 90%",
                toggleActions: "play none none reverse"
            },
            y: 100,
            opacity: 0,
            duration: 1.5,
            stagger: 0.05,
            ease: "expo.out"
        });
    });

    // Glass Cards Stagger (Services & Results)
    const cardSections = ['#services', '#results'];
    cardSections.forEach(section => {
        gsap.from(`${section} .glass-card`, {
            scrollTrigger: {
                trigger: section,
                start: "top 90%", // Trigger earlier
            },
            y: 30,
            opacity: 0.2, // Start slightly visible to avoid "missing" feel
            duration: 1,
            stagger: 0.1,
            ease: "expo.out"
        });
    });

    // Portfolio Items Stagger
    gsap.from(".portfolio-item", {
        scrollTrigger: {
            trigger: "#showcases",
            start: "top 70%",
        },
        scale: 0.9,
        opacity: 0,
        duration: 1.5,
        stagger: 0.2,
        ease: "expo.out"
    });

    // Magnetic Buttons
    document.querySelectorAll('.magnetic-btn').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            gsap.to(btn, {
                x: x * 0.3,
                y: y * 0.3,
                duration: 0.5,
                ease: "power3.out"
            });
        });

        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, {
                x: 0,
                y: 0,
                duration: 0.8,
                ease: "elastic.out(1, 0.3)"
            });
        });
    });

    // Scroll to Top Button Visibility
    ScrollTrigger.create({
        start: "top -100",
        onUpdate: (self) => {
            const btn = document.querySelector('#scroll-to-top');
            if (self.direction === -1 && self.progress > 0.1) {
                gsap.to(btn, { opacity: 1, y: 0, duration: 0.3 });
            } else {
                gsap.to(btn, { opacity: 0, y: 40, duration: 0.3 });
            }
        }
    });

    // Orbit Animation for Hero
    gsap.to(".orb", {
        y: "random(-40, 40)",
        x: "random(-20, 20)",
        duration: "random(4, 8)",
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.5
    });
};

// Run
// --- Failsafe & Execution ---

// 1. Global Failsafe: If nothing happens in 4 seconds, force init
const failsafeTimeout = setTimeout(() => {
    console.warn("ICEBERG: Failsafe triggered. Forcing initialization.");
    if (!window.icebergInitialized) {
        init();
    }
}, 4000);

// 2. Event Listeners
window.addEventListener('load', () => {
    console.log("ICEBERG: Window Load event fired.");
    if (!window.icebergInitialized) {
        clearTimeout(failsafeTimeout);
        init();
    }
});

// 3. Mark initialization to prevent double-run
window.icebergInitialized = false;
const originalInit = init;
// Override init to include state tracking
init = () => {
    if (window.icebergInitialized) return;
    window.icebergInitialized = true;
    originalInit();
};

// Global Mobile Menu Toggle with GSAP Animation
window.toggleMobileMenu = () => {
    const menu = document.getElementById('mobile-menu');
    if (!menu) return;
    
    const links = menu.querySelectorAll('a');
    const closeBtn = menu.querySelector('button');
    
    if (menu.classList.contains('hidden')) {
        menu.classList.remove('hidden');
        
        // Kill any ongoing timeline
        if (window.mobileMenuTl) window.mobileMenuTl.kill();
        
        window.mobileMenuTl = gsap.timeline();
        window.mobileMenuTl.fromTo(menu, 
            { opacity: 0, backdropFilter: 'blur(0px)', webkitBackdropFilter: 'blur(0px)' },
            { opacity: 1, backdropFilter: 'blur(24px)', webkitBackdropFilter: 'blur(24px)', duration: 0.4, ease: 'power2.out' }
        );
        window.mobileMenuTl.fromTo(links, 
            { opacity: 0, y: 30, scale: 0.9 },
            { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.05, ease: 'power3.out', delay: 0.1 },
            '-=0.3'
        );
        if (closeBtn) {
            window.mobileMenuTl.fromTo(closeBtn, 
                { opacity: 0, rotate: -90, scale: 0.8 },
                { opacity: 1, rotate: 0, scale: 1, duration: 0.4, ease: 'back.out(1.7)' },
                '-=0.2'
            );
        }
    } else {
        if (window.mobileMenuTl) window.mobileMenuTl.kill();
        
        window.mobileMenuTl = gsap.timeline({
            onComplete: () => menu.classList.add('hidden')
        });
        
        window.mobileMenuTl.to(links, {
            opacity: 0,
            y: -15,
            duration: 0.25,
            stagger: 0.03,
            ease: 'power2.in'
        });
        window.mobileMenuTl.to(menu, {
            opacity: 0,
            duration: 0.3,
            ease: 'power2.inOut'
        }, '-=0.15');
    }
};
