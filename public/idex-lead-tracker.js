/**
 * ICEBERG × IDEX Real-Time Lead Pipeline Engine
 */
(function(window) {
    const STORAGE_KEY = 'iceberg_idex_lead_pipeline';
    const CHANNEL_NAME = 'iceberg_lead_channel';

    let broadcastChannel = null;
    try {
        if ('BroadcastChannel' in window) {
            broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
        }
    } catch (e) {
        console.warn('BroadcastChannel not supported');
    }

    function getAllLeads() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : getSeedLeads();
        } catch (e) {
            return getSeedLeads();
        }
    }

    function getSeedLeads() {
        const defaultLeads = [
            {
                id: 'LEAD-1786550001',
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                company: 'Dentaquick',
                contact_name: 'Dr. Karim Ahmed',
                email: 'info@dentaquick.com',
                phone: '+20 100 123 4567',
                source: 'Hero Audit Finder',
                action: 'Unlocked Audit Score (85/100)',
                status: '🔥 High Intent',
                sector: 'Dental Care / D2C',
                notes: 'Requested consultation call after viewing leakage breakdown.'
            },
            {
                id: 'LEAD-1786550002',
                timestamp: new Date(Date.now() - 7200000).toISOString(),
                company: 'Straumann Group ME',
                contact_name: 'Mark Vance',
                email: 'm.vance@straumann.com',
                phone: '+971 50 987 6543',
                source: 'Strategy Consultation Modal',
                action: 'Booked 60-Min Consultation',
                status: '📅 Consultation Booked',
                sector: 'Esthetic Dentistry & Implants',
                notes: 'Interested in 3-Month Growth Package.'
            },
            {
                id: 'LEAD-1786550003',
                timestamp: new Date(Date.now() - 14400000).toISOString(),
                company: 'EMS Dental',
                contact_name: 'Elena Rostova',
                email: 'e.rostova@ems-dental.com',
                phone: '+41 22 765 4321',
                source: '140 Exhibitor Directory',
                action: 'Viewed Audit & Social Links',
                status: '🆕 New Lead',
                sector: 'Prophylaxis & Biofilm Therapy',
                notes: 'Viewed LinkedIn & Facebook campaign analysis.'
            }
        ];
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultLeads));
        } catch (e) {}
        return defaultLeads;
    }

    function captureIDEXLead(leadData) {
        if (!leadData) return null;
        
        const timestamp = new Date().toISOString();
        const id = 'LEAD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        
        const newLead = {
            id: leadData.id || id,
            timestamp: leadData.timestamp || timestamp,
            company: leadData.company || leadData.name || 'Unknown Exhibitor',
            contact_name: leadData.contact_name || leadData.name || 'Not Provided',
            email: leadData.email || 'info@' + (leadData.company || 'exhibitor').toLowerCase().replace(/[^a-z0-9]/g, '') + '.com',
            phone: leadData.phone || '+20 10' + Math.floor(10000000 + Math.random() * 90000000),
            source: leadData.source || 'IDEX Audit View',
            action: leadData.action || 'View / Unlock Audit',
            status: leadData.status || '🆕 New Lead',
            sector: leadData.sector || 'Dental Equipment',
            notes: leadData.notes || '',
            url: window.location.href
        };

        const existingLeads = getAllLeads();
        
        // Prevent duplicate spam within 10 seconds for same company & source
        const isDuplicate = existingLeads.some(l => 
            l.company.toLowerCase() === newLead.company.toLowerCase() &&
            l.source === newLead.source &&
            (new Date(timestamp) - new Date(l.timestamp)) < 10000
        );

        if (!isDuplicate) {
            existingLeads.unshift(newLead);
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(existingLeads));
            } catch (e) {
                console.error('Failed to save lead to localStorage', e);
            }

            if (broadcastChannel) {
                broadcastChannel.postMessage({ type: 'NEW_LEAD', lead: newLead });
            }
            
            // Cross-tab sync trigger
            window.dispatchEvent(new CustomEvent('iceberg_lead_captured', { detail: newLead }));

            // Async remote sync to Express API / MongoDB / Disk Backup
            try {
                fetch('/api/leads', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newLead)
                }).then(res => res.json())
                  .then(data => console.log('[Backend API Lead Sync Success]:', data))
                  .catch(err => console.warn('[Backend API Lead Sync Warn]:', err.message));
            } catch(apiErr) {}
        }

        return newLead;
    }

    window.ICEBERGLeadTracker = {
        getAllLeads: getAllLeads,
        captureLead: captureIDEXLead,
        STORAGE_KEY: STORAGE_KEY,
        CHANNEL_NAME: CHANNEL_NAME
    };
})(window);
