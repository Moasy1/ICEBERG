// public/ai-agent-widget.js
(function () {
    // Inject Styles for Chat Widget
    const style = document.createElement('style');
    style.innerHTML = `
        #ai-agent-launcher {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%);
            box-shadow: 0 8px 32px rgba(6, 182, 212, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 99999;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        #ai-agent-launcher:hover {
            transform: scale(1.1) rotate(5deg);
            box-shadow: 0 12px 40px rgba(6, 182, 212, 0.6);
        }
        #ai-agent-launcher .ping-indicator {
            position: absolute;
            top: 2px;
            right: 2px;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: #22c55e;
            border: 2px solid #030712;
            animation: pulse-ping 2s infinite;
        }
        @keyframes pulse-ping {
            0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
            70% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
            100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
        #ai-agent-drawer {
            position: fixed;
            bottom: 100px;
            right: 24px;
            width: 380px;
            height: 520px;
            border-radius: 24px;
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6);
            z-index: 99999;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
            transform: translateY(30px) scale(0.95);
            opacity: 0;
            pointer-events: none;
        }
        #ai-agent-drawer.open {
            transform: translateY(0) scale(1);
            opacity: 1;
            pointer-events: auto;
        }
        @media (max-width: 480px) {
            #ai-agent-drawer {
                width: calc(100vw - 32px);
                height: 70vh;
                bottom: 96px;
                right: 16px;
            }
        }
        .chat-scroll::-webkit-scrollbar {
            width: 4px;
        }
        .chat-scroll::-webkit-scrollbar-track {
            background: transparent;
        }
        .chat-scroll::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
        }
    `;
    document.head.appendChild(style);

    // Create Launcher Button
    const launcher = document.createElement('div');
    launcher.id = 'ai-agent-launcher';
    launcher.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
        <span class="ping-indicator"></span>
    `;
    document.body.appendChild(launcher);

    // Create Drawer Container
    const drawer = document.createElement('div');
    drawer.id = 'ai-agent-drawer';
    drawer.innerHTML = `
        <!-- Header -->
        <div style="background: linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%);" class="border-b border-white/10 px-5 py-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full bg-cyan-500 flex items-center justify-center border border-cyan-400/30">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
                </div>
                <div>
                    <h4 class="text-xs font-bold text-white tracking-wide">Iceberg AI Strategist</h4>
                    <p class="text-[9px] text-green-400 uppercase font-bold tracking-widest flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-ping"></span> Active Now
                    </p>
                </div>
            </div>
            <button id="ai-agent-close" class="text-white/60 hover:text-white p-1 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
        </div>

        <!-- Chat Area -->
        <div id="ai-agent-chat-body" class="flex-1 overflow-y-auto p-5 space-y-4 text-xs chat-scroll flex flex-col justify-start bg-slate-950/20">
            <!-- Automated Welcome -->
            <div class="flex gap-2.5 max-w-[85%]">
                <div class="w-7 h-7 rounded-full bg-slate-900 flex-shrink-0 flex items-center justify-center border border-white/10 text-cyan-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M12 8V4H8"/></svg>
                </div>
                <div class="bg-slate-900 border border-slate-800 rounded-2xl px-4.5 py-3 text-gray-200 leading-relaxed shadow-lg">
                    Hello! I'm the Iceberg AI Strategist. 🧊 Let's help your business scale! Would you like to check out our services, or explore our limited-time **Birthday Campaign** deals?
                </div>
            </div>
        </div>

        <!-- Form / Inputs -->
        <div class="p-4 border-t border-white/10 bg-slate-950/40 space-y-3">
            <!-- Suggested Action Chips -->
            <div id="ai-agent-chips" class="flex flex-wrap gap-1.5 justify-start">
                <button data-val="Schedule a strategy meeting" class="chip-btn text-[10px] bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 px-3 py-1.5 rounded-full text-cyan-200 font-bold transition-all">
                    📅 Schedule Strategy Call
                </button>
                <button data-val="Tell me about the Birthday Bundle!" class="chip-btn text-[10px] bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 px-3 py-1.5 rounded-full text-cyan-300 font-bold transition-all">
                    🎉 Purchase 3 + 1 Deal
                </button>
                <button data-val="Claim August Born Service" class="chip-btn text-[10px] bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 px-3 py-1.5 rounded-full text-purple-300 font-bold transition-all">
                    👑 August Kings Freebie
                </button>
                <button data-val="What services do you offer?" class="chip-btn text-[10px] bg-slate-800 hover:bg-slate-700 border border-white/10 px-3 py-1.5 rounded-full text-slate-300 font-bold transition-all">
                    Explore Solutions
                </button>
            </div>
            <!-- Input Row -->
            <form id="ai-agent-form" class="flex gap-2">
                <input type="text" id="ai-agent-input" placeholder="Ask a question or reply..." class="flex-1 bg-[#0a192f] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors">
                <button type="submit" style="background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%);" class="text-white rounded-xl px-4 py-2.5 flex items-center justify-center active:scale-95 transition-all shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                </button>
            </form>
        </div>
    `;
    document.body.appendChild(drawer);

    // Toggle logic
    launcher.onclick = function () {
        drawer.classList.toggle('open');
        // Hide the ping notification after first open
        const ping = launcher.querySelector('.ping-indicator');
        if (ping) ping.remove();
    };

    document.getElementById('ai-agent-close').onclick = function () {
        drawer.classList.remove('open');
    };

    // Chat handling variables
    let chatState = 'idle'; // idle, expecting_name, expecting_email, done
    let leadData = {};

    // Helper functions
    function appendBotMsg(text) {
        const body = document.getElementById('ai-agent-chat-body');
        const wrapper = document.createElement('div');
        wrapper.className = 'flex gap-2.5 max-w-[85%]';
        wrapper.innerHTML = `
            <div class="w-7 h-7 rounded-full bg-slate-900 flex-shrink-0 flex items-center justify-center border border-white/10 text-cyan-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M12 8V4H8"/></svg>
            </div>
            <div class="bg-slate-900 border border-slate-800 rounded-2xl px-4.5 py-3 text-gray-200 leading-relaxed shadow-lg">
                ${text}
            </div>
        `;
        body.appendChild(wrapper);
        body.scrollTop = body.scrollHeight;
    }

    function appendUserMsg(text) {
        const body = document.getElementById('ai-agent-chat-body');
        const wrapper = document.createElement('div');
        wrapper.className = 'flex gap-2.5 max-w-[85%] self-end justify-end';
        wrapper.innerHTML = `
            <div class="bg-purple-600/25 border border-purple-500/30 rounded-2xl px-4.5 py-3 text-white leading-relaxed shadow-lg">
                ${text}
            </div>
            <div class="w-7 h-7 rounded-full bg-purple-600 flex-shrink-0 flex items-center justify-center text-white font-bold text-[10px]">
                U
            </div>
        `;
        body.appendChild(wrapper);
        body.scrollTop = body.scrollHeight;
    }

    function showTyping() {
        const body = document.getElementById('ai-agent-chat-body');
        const indicator = document.createElement('div');
        indicator.id = 'ai-agent-typing';
        indicator.className = 'flex gap-2.5 max-w-[85%]';
        indicator.innerHTML = `
            <div class="w-7 h-7 rounded-full bg-slate-900 flex-shrink-0 flex items-center justify-center border border-white/10 text-cyan-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M12 8V4H8"/></svg>
            </div>
            <div class="bg-slate-900 border border-slate-800 rounded-2xl px-4.5 py-2.5 text-gray-400 italic text-[10px] flex items-center gap-1">
                typing<span>...</span>
            </div>
        `;
        body.appendChild(indicator);
        body.scrollTop = body.scrollHeight;
    }

    function removeTyping() {
        const indicator = document.getElementById('ai-agent-typing');
        if (indicator) indicator.remove();
    }

    // Process Bot Response
    function processInput(text) {
        showTyping();
        setTimeout(async () => {
            removeTyping();
            const input = text.toLowerCase();

            if (chatState === 'expecting_name') {
                leadData.name = text;
                chatState = 'expecting_email';
                appendBotMsg(`Pleasure to connect with you, ${text}! What is your business email address?`);
                return;
            }

            if (chatState === 'expecting_email') {
                leadData.email = text;
                if (leadData.isBooking) {
                    chatState = 'expecting_datetime';
                    appendBotMsg(`Awesome! What date and time works best for your 1-on-1 strategy call? 📅<br><span class="text-[10px] text-cyan-300">Available: Sun - Thu, 12:00 PM - 5:00 PM (Fri & Sat Off)</span>`);
                } else {
                    chatState = 'done';
                    appendBotMsg(`Thank you so much! I have submitted your campaign interest. A real strategist from the Iceberg team will email you at <strong>${text}</strong> within the next 2 hours to confirm your custom requirements.`);
                    await submitLeadToDb();
                }
                return;
            }

            if (chatState === 'expecting_datetime') {
                leadData.appointmentTime = text;
                leadData.appointmentDate = text;
                chatState = 'done';
                appendBotMsg(`🎉 Perfect! Your strategy meeting request for <strong>${text}</strong> has been logged! A calendar invite will be dispatched to <strong>${leadData.email || 'your email'}</strong>.<br><br>You can also use our interactive setup form on the page to finalize your slot!`);
                await submitLeadToDb();
                return;
            }

            if (input.includes('schedule') || input.includes('meeting') || input.includes('book') || input.includes('call') || input.includes('appointment') || input.includes('consultation')) {
                chatState = 'expecting_name';
                leadData.isBooking = true;
                leadData.topic = text;
                appendBotMsg(`I would be thrilled to schedule a strategy meeting with our team! 📅 To lock in your session, what is your full name?`);
            } else if (input.includes('birthday') || input.includes('bundle') || input.includes('claim') || input.includes('3+1') || input.includes('kings') || input.includes('august')) {
                chatState = 'expecting_name';
                leadData.isBooking = false;
                leadData.topic = text;
                appendBotMsg(`I'd love to help you secure our Special Birthday Campaign offer! To get you qualified and registered, what is your full name?`);
            } else if (input.includes('services') || input.includes('offer') || input.includes('solutions')) {
                appendBotMsg(`We provide state-of-the-art marketing services:<br>
                - 🖥️ <strong>Web Development</strong> (custom corporate platforms)<br>
                - 🔍 <strong>SEO & Visibility</strong> (authority audit and building)<br>
                - 📣 <strong>Social Media</strong> (platform-native community building)<br>
                - 🎯 <strong>Performance Marketing</strong> (high ROI paid advertising)<br>
                - 🎨 <strong>Branding & Design</strong> (consistent identity layouts)<br>
                - 🎥 <strong>Content Creation</strong> (scroll-stopping videography)<br><br>
                Type **'schedule'** to book a strategy call, or **'bundle'** to claim our Birthday Deal!`);
            } else {
                appendBotMsg(`I'm an automated strategic assistant. I can guide you through our services or book 1-on-1 strategy calls! Type **'schedule'** to book a meeting or **'bundle'** to claim our current promotion.`);
            }
        }, 1000);
    }

    async function submitLeadToDb() {
        const payload = {
            name: leadData.name,
            email: leadData.email,
            phone: leadData.phone || '',
            appointmentDate: leadData.appointmentDate || undefined,
            appointmentTime: leadData.appointmentTime || undefined,
            meetingType: 'Google Meet Video Call',
            message: `Lead/Meeting from AI Agent Chat Widget. Topic: "${leadData.topic || 'Strategy Session'}". Date/Time Requested: "${leadData.appointmentTime || 'N/A'}"`
        };

        try {
            await fetch('/api/contact/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (err) {
            console.error('Failed to submit AI widget lead to database:', err);
        }
    }

    // Form submit listener
    document.getElementById('ai-agent-form').onsubmit = function (e) {
        e.preventDefault();
        const inputEl = document.getElementById('ai-agent-input');
        const text = inputEl.value.trim();
        if (!text) return;
        inputEl.value = '';
        appendUserMsg(text);
        processInput(text);
    };

    // Chip click listener
    document.querySelectorAll('.chip-btn').forEach(btn => {
        btn.onclick = function () {
            const val = this.getAttribute('data-val');
            appendUserMsg(val);
            processInput(val);
        };
    });
})();
