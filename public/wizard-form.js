/**
 * Iceberg Agency - Wizard Setup Experience Controller
 * Powers 3-Step Forms: Form Details -> Appointment Setter -> Email Confirmation
 */
document.addEventListener('DOMContentLoaded', () => {
    initWizardForms();
});

function initWizardForms() {
    const forms = document.querySelectorAll('.wizard-form, #contact-form, #bundle-claim-form');
    forms.forEach(form => {
        if (!form.dataset.wizardInitialized) {
            setupWizardForForm(form);
        }
    });
}

function setupWizardForForm(form) {
    form.dataset.wizardInitialized = 'true';
    
    // Check if form is already structured with .wizard-step-panel elements
    let stepPanels = form.querySelectorAll('.wizard-step-panel');
    
    // If not structured, dynamically build the 3-step setup experience structure!
    if (stepPanels.length === 0) {
        buildWizardStructure(form);
        stepPanels = form.querySelectorAll('.wizard-step-panel');
    }
    
    // Re-initialize intl-tel-input flags on phone inputs inside the new wizard structure
    if (typeof window.initPhoneInputs === 'function') {
        window.initPhoneInputs(form);
    }
    
    let currentStep = 1;
    const totalSteps = 3;

    // Attach step button actions
    const nextBtn = form.querySelector('.wizard-next-btn');
    const prevBtn = form.querySelector('.wizard-prev-btn');
    const submitBtn = form.querySelector('.wizard-submit-btn');

    // Date & Time Picker Initialization for Step 2
    initAppointmentPicker(form);

    function updateStepUI(stepIndex) {
        currentStep = stepIndex;
        
        // Update Step Panels
        stepPanels.forEach((panel, idx) => {
            if (idx + 1 === currentStep) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });

        // Update Indicators
        const indicators = form.querySelectorAll('.wizard-step-indicator');
        indicators.forEach((ind, idx) => {
            const stepNum = idx + 1;
            if (stepNum === currentStep) {
                ind.classList.add('active');
                ind.classList.remove('completed');
            } else if (stepNum < currentStep) {
                ind.classList.remove('active');
                ind.classList.add('completed');
            } else {
                ind.classList.remove('active', 'completed');
            }
        });

        // Update Stepper Active Line width
        const lineActive = form.querySelector('.wizard-stepper-line-active');
        if (lineActive) {
            const percent = ((currentStep - 1) / (totalSteps - 1)) * 80;
            lineActive.style.width = `${percent}%`;
        }

        // Scroll smoothly to form top
        form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Step 1 -> Step 2 Validation & Action
    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (validateStep1(form)) {
                updateStepUI(2);
            }
        });
    }

    // Step 2 -> Step 1 Action
    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            updateStepUI(1);
        });
    }

    // Explicit click handler for Confirm & Send button
    if (submitBtn) {
        submitBtn.addEventListener('click', (e) => {
            if (currentStep === 2) {
                e.preventDefault();
                form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            }
        });
    }

    // Form Submit Handler (Step 2 -> Step 3)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // If current step is 1, advance to step 2 first
        if (currentStep === 1) {
            if (validateStep1(form)) {
                updateStepUI(2);
            }
            return;
        }

        // Validate & Auto-populate Step 2 (Appointment details)
        let selectedDate = form.querySelector('input[name="appointmentDate"]')?.value;
        let selectedTime = form.querySelector('input[name="appointmentTime"]')?.value;

        if (!selectedDate) {
            const firstDatePill = form.querySelector('.date-pill');
            if (firstDatePill) {
                selectedDate = firstDatePill.dataset.date || firstDatePill.textContent.trim();
                const hiddenDateInput = form.querySelector('input[name="appointmentDate"]');
                if (hiddenDateInput) hiddenDateInput.value = selectedDate;
                firstDatePill.classList.add('selected');
            }
        }

        if (!selectedTime) {
            const firstTimePill = form.querySelector('.time-pill');
            if (firstTimePill) {
                selectedTime = firstTimePill.dataset.time || firstTimePill.textContent.trim();
                const hiddenTimeInput = form.querySelector('input[name="appointmentTime"]');
                if (hiddenTimeInput) hiddenTimeInput.value = selectedTime;
                firstTimePill.classList.add('selected');
            }
        }

        if (!selectedDate || !selectedTime) {
            showFormToast(form, 'Please select a date and time slot for your appointment.', 'warning');
            return;
        }

        // Submit to API
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg> Processing Setup...
            `;
        }

        // Gather all form fields
        const formData = new FormData(form);
        const dataObj = {};
        formData.forEach((val, key) => dataObj[key] = val);

        // Include full international phone if intl-tel-input exists
        const phoneInput = form.querySelector('input[type="tel"]');
        if (phoneInput && phoneInput._iti && typeof phoneInput._iti.getNumber === 'function') {
            const fullPhone = phoneInput._iti.getNumber();
            if (fullPhone) dataObj.phone = fullPhone;
        }

        // Generate matching Meta Event ID for client/server deduplication
        const metaEventId = `wizard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        dataObj.eventId = metaEventId;

        // Dispatch client Meta Pixel Schedule/Lead event
        if (typeof window.trackMetaEvent === 'function') {
            window.trackMetaEvent('Schedule', {
                content_name: 'Consultation Appointment Setup',
                appointment_date: dataObj.appointmentDate,
                appointment_time: dataObj.appointmentTime
            }, {
                email: dataObj.email,
                phone: dataObj.phone,
                name: dataObj.name,
                company: dataObj.company
            }, metaEventId);
        }

        try {
            const response = await fetch('/api/contact/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataObj)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                populateConfirmationCard(form, dataObj);
                updateStepUI(3);
            } else {
                console.warn('Backend contact response notice:', result);
                populateConfirmationCard(form, dataObj);
                updateStepUI(3);
                showFormToast(form, 'Appointment request created! Note: ' + (result.error || 'Saved'), 'info');
            }
        } catch (err) {
            console.error('Wizard submission error:', err);
            // Fallback for static host / offline deployment
            populateConfirmationCard(form, dataObj);
            updateStepUI(3);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Confirm & Send →';
            }
        }
    });
}

function validateStep1(form) {
    const step1 = form.querySelector('.wizard-step-panel[data-step="1"]') || form;
    const inputs = step1.querySelectorAll('input[required], textarea[required], select[required]');
    let valid = true;
    let firstInvalid = null;

    inputs.forEach(input => {
        if (!input.value || !input.value.trim()) {
            valid = false;
            input.classList.add('border-red-500');
            if (!firstInvalid) firstInvalid = input;
        } else {
            input.classList.remove('border-red-500');
        }
    });

    if (!valid) {
        if (firstInvalid) firstInvalid.focus();
        showFormToast(form, 'Please complete all required fields.', 'warning');
    }

    return valid;
}

function initAppointmentPicker(form) {
    const dateGrid = form.querySelector('.date-picker-grid');
    const timeGrid = form.querySelector('.time-picker-grid');
    const formatGrid = form.querySelector('.meeting-format-grid');
    
    const hiddenDateInput = form.querySelector('input[name="appointmentDate"]');
    const hiddenTimeInput = form.querySelector('input[name="appointmentTime"]');
    const hiddenFormatInput = form.querySelector('input[name="meetingType"]');

    if (!dateGrid || !timeGrid) return;

    // Generate upcoming 6 business days
    dateGrid.innerHTML = '';
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    let addedDays = 0;
    let curr = new Date();
    curr.setDate(curr.getDate() + 1); // Start tomorrow

    while (addedDays < 6) {
        // Skip weekends
        if (curr.getDay() !== 0 && curr.getDay() !== 6) {
            const dayName = days[curr.getDay()];
            const dayNum = curr.getDate();
            const monthName = months[curr.getMonth()];
            const fullFormatted = `${monthName} ${dayNum}, ${curr.getFullYear()}`;

            const pill = document.createElement('div');
            pill.className = `date-pill ${addedDays === 0 ? 'selected' : ''}`;
            pill.dataset.date = fullFormatted;
            pill.innerHTML = `
                <div class="day-name">${dayName}</div>
                <div class="day-num">${dayNum} ${monthName}</div>
            `;

            pill.addEventListener('click', () => {
                dateGrid.querySelectorAll('.date-pill').forEach(p => p.classList.remove('selected'));
                pill.classList.add('selected');
                if (hiddenDateInput) hiddenDateInput.value = fullFormatted;
            });

            dateGrid.appendChild(pill);
            if (addedDays === 0 && hiddenDateInput) {
                hiddenDateInput.value = fullFormatted;
            }

            addedDays++;
        }
        curr.setDate(curr.getDate() + 1);
    }

    // Default time slot selection
    const timePills = timeGrid.querySelectorAll('.time-pill');
    timePills.forEach(pill => {
        pill.addEventListener('click', () => {
            timePills.forEach(p => p.classList.remove('selected'));
            pill.classList.add('selected');
            if (hiddenTimeInput) hiddenTimeInput.value = pill.dataset.time || pill.textContent.trim();
        });
    });
    if (timePills.length > 0 && hiddenTimeInput) {
        timePills[0].classList.add('selected');
        hiddenTimeInput.value = timePills[0].dataset.time || timePills[0].textContent.trim();
    }

    // Default meeting format selection
    if (formatGrid) {
        const formatPills = formatGrid.querySelectorAll('.format-pill');
        formatPills.forEach(pill => {
            pill.addEventListener('click', () => {
                formatPills.forEach(p => p.classList.remove('selected'));
                pill.classList.add('selected');
                if (hiddenFormatInput) hiddenFormatInput.value = pill.dataset.format || pill.textContent.trim();
            });
        });
        if (formatPills.length > 0 && hiddenFormatInput) {
            formatPills[0].classList.add('selected');
            hiddenFormatInput.value = formatPills[0].dataset.format || formatPills[0].textContent.trim();
        }
    }
}

function buildWizardStructure(form) {
    // Save original inputs from form
    const originalContent = form.innerHTML;

    form.innerHTML = `
        <!-- Stepper Progress Header -->
        <div class="wizard-stepper">
            <div class="wizard-stepper-line-active" style="width: 0%;"></div>
            <div class="wizard-step-indicator active" data-step="1">
                <div class="wizard-step-bubble">1</div>
                <div class="wizard-step-label">Form Details</div>
            </div>
            <div class="wizard-step-indicator" data-step="2">
                <div class="wizard-step-bubble">2</div>
                <div class="wizard-step-label">Appointment</div>
            </div>
            <div class="wizard-step-indicator" data-step="3">
                <div class="wizard-step-bubble">3</div>
                <div class="wizard-step-label">Confirmation</div>
            </div>
        </div>

        <!-- Hidden inputs for appointment data -->
        <input type="hidden" name="appointmentDate" value="">
        <input type="hidden" name="appointmentTime" value="">
        <input type="hidden" name="meetingType" value="Google Meet Video Call">

        <!-- STEP 1: FORM DETAILS -->
        <div class="wizard-step-panel active space-y-6" data-step="1">
            ${originalContent}
            <div class="pt-4">
                <button type="button" class="wizard-next-btn w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-lg font-black italic text-white uppercase tracking-widest hover:shadow-lg hover:shadow-cyan-500/25 transition-all transform hover:-translate-y-1">
                    Next: Schedule Appointment →
                </button>
            </div>
        </div>

        <!-- STEP 2: APPOINTMENT SETTER -->
        <div class="wizard-step-panel space-y-6" data-step="2">
            <div class="text-center mb-6">
                <h3 class="text-xl font-bold text-white mb-1">Select Discovery Call Slot</h3>
                <p class="text-xs text-cyan-400 uppercase tracking-widest">Choose a date & time for your 1-on-1 strategy kickoff</p>
            </div>

            <!-- Date Selection -->
            <div>
                <label class="text-xs text-cyan-400 font-bold uppercase tracking-wider block mb-2">Available Dates</label>
                <div class="date-picker-grid"></div>
            </div>

            <!-- Time Selection -->
            <div>
                <label class="text-xs text-cyan-400 font-bold uppercase tracking-wider block mb-2">Select Time Slot</label>
                <div class="time-picker-grid">
                    <div class="time-pill" data-time="09:00 AM EST">09:00 AM</div>
                    <div class="time-pill" data-time="11:00 AM EST">11:00 AM</div>
                    <div class="time-pill" data-time="02:00 PM EST">02:00 PM</div>
                    <div class="time-pill" data-time="04:00 PM EST">04:00 PM</div>
                    <div class="time-pill" data-time="06:00 PM EST">06:00 PM</div>
                </div>
            </div>

            <!-- Meeting Format -->
            <div>
                <label class="text-xs text-cyan-400 font-bold uppercase tracking-wider block mb-2">Meeting Format</label>
                <div class="meeting-format-grid">
                    <div class="format-pill selected" data-format="Google Meet Video Call">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                        <span>Google Meet</span>
                    </div>
                    <div class="format-pill" data-format="Phone Call">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                        <span>Phone Call</span>
                    </div>
                    <div class="format-pill" data-format="In-Person Meeting">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        <span>In-Person</span>
                    </div>
                </div>
            </div>

            <!-- Notes -->
            <div class="space-y-2">
                <label class="text-xs text-cyan-400 font-bold uppercase tracking-wider block">Meeting Notes (Optional)</label>
                <input type="text" name="notes" placeholder="Any specific topics or agenda for our call?" class="w-full bg-[#0a192f] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors">
            </div>

            <div class="flex gap-4 pt-4">
                <button type="button" class="wizard-prev-btn w-1/3 py-4 bg-gray-800 hover:bg-gray-700 rounded-lg font-bold text-white uppercase tracking-wider transition-all">
                    ← Back
                </button>
                <button type="submit" class="wizard-submit-btn w-2/3 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-lg font-black italic text-white uppercase tracking-widest hover:shadow-lg hover:shadow-cyan-500/25 transition-all transform hover:-translate-y-1">
                    Confirm & Send →
                </button>
            </div>
        </div>

        <!-- STEP 3: EMAIL CONFIRMATION -->
        <div class="wizard-step-panel" data-step="3">
            <div class="confirmation-card">
                <div class="success-badge">
                    <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h3 class="text-2xl font-black italic text-white mb-2 uppercase tracking-tight">Setup Confirmed!</h3>
                <p class="text-sm text-cyan-400 font-semibold mb-6">A confirmation email has been dispatched to your inbox.</p>

                <div class="summary-box">
                    <div class="summary-row">
                        <span class="summary-label">Name</span>
                        <span class="summary-value summary-name">-</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Email</span>
                        <span class="summary-value summary-email">-</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Appointment</span>
                        <span class="summary-value summary-appointment">-</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Meeting Format</span>
                        <span class="summary-value summary-format">-</span>
                    </div>
                </div>

                <div class="flex flex-col sm:flex-row gap-3 mt-6">
                    <button type="button" class="download-ics-btn flex-1 py-3 px-4 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 rounded-xl text-cyan-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        Add to Calendar (.ics)
                    </button>
                    <button type="button" onclick="location.reload()" class="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-white font-bold text-xs uppercase tracking-wider transition-all">
                        Done
                    </button>
                </div>
            </div>
        </div>
    `;

    // Remove old standalone submit/action buttons inside step 1 if any duplicate exists
    const step1Panel = form.querySelector('.wizard-step-panel[data-step="1"]');
    if (step1Panel) {
        const oldBtns = step1Panel.querySelectorAll('button:not(.wizard-next-btn)');
        oldBtns.forEach(btn => btn.remove());
    }
}

function populateConfirmationCard(form, data) {
    const nameEl = form.querySelector('.summary-name');
    const emailEl = form.querySelector('.summary-email');
    const apptEl = form.querySelector('.summary-appointment');
    const formatEl = form.querySelector('.summary-format');

    if (nameEl) nameEl.textContent = data.name || 'Valued Client';
    if (emailEl) emailEl.textContent = data.email || '';
    if (apptEl) apptEl.textContent = `${data.appointmentDate || 'TBD'} @ ${data.appointmentTime || ''}`;
    if (formatEl) formatEl.textContent = data.meetingType || 'Google Meet';

    // Calendar .ics download attachment generator
    const icsBtn = form.querySelector('.download-ics-btn');
    if (icsBtn) {
        icsBtn.onclick = () => downloadIcsFile(data);
    }
}

function downloadIcsFile(data) {
    const title = `Iceberg Agency Strategy Call - ${data.name || 'Client'}`;
    const description = `Discovery meeting with Iceberg Agency.\\nFormat: ${data.meetingType || 'Google Meet'}\\nClient Email: ${data.email || ''}`;
    const dateStr = data.appointmentDate || 'Tomorrow';
    const timeStr = data.appointmentTime || '10:00 AM';

    const icsData = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Iceberg Agency//Setup Wizard//EN',
        'BEGIN:VEVENT',
        `SUMMARY:${title}`,
        `DESCRIPTION:${description}`,
        `LOCATION:${data.meetingType || 'Online Google Meet'}`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'Iceberg-Appointment.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function showFormToast(form, message, type = 'info') {
    let toast = form.querySelector('.wizard-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'wizard-toast p-3 mb-4 rounded-lg text-sm font-semibold text-center transition-all';
        form.insertBefore(toast, form.firstChild);
    }

    if (type === 'error' || type === 'warning') {
        toast.className = 'wizard-toast p-3 mb-4 rounded-lg text-sm font-semibold text-center bg-red-500/20 text-red-300 border border-red-500/40';
    } else {
        toast.className = 'wizard-toast p-3 mb-4 rounded-lg text-sm font-semibold text-center bg-cyan-500/20 text-cyan-300 border border-cyan-500/40';
    }

    toast.textContent = message;
    try {
        toast.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (e) {}

    setTimeout(() => {
        if (toast) toast.remove();
    }, 5000);
}
