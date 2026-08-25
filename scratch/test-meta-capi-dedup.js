const metaCapi = require('../api/services/metaCapi');
const MetaEvent = require('../api/models/MetaEvent');
const Lead = require('../api/models/Lead');
const Message = require('../api/models/Message');

async function testMetaCapi() {
    console.log('--- Testing Meta CAPI Service & Idempotency ---');

    // 1. Test Event ID generator
    const evtId1 = metaCapi.generateEventId('test_lead');
    const evtId2 = metaCapi.generateEventId('test_lead');
    console.log(`Generated Event IDs: \n  1: ${evtId1}\n  2: ${evtId2}`);
    if (evtId1 === evtId2 || !evtId1.startsWith('test_lead_')) {
        throw new Error('Event ID generation failed uniqueness or format check');
    }

    // 2. Test status overview
    const status = metaCapi.getStatus();
    console.log('Service Status:', status);

    // 3. Test sendServerEvent structure & idempotency
    const testPayload = {
        eventName: 'Lead',
        eventId: evtId1,
        userData: {
            email: 'test.user@iceberg.agency',
            phone: '+201000000000',
            name: 'Omar Sherif',
            fbp: 'fb.1.1710000000.1234567890',
            fbc: 'fb.1.1710000000.IwAR00000000000000000'
        },
        customData: {
            content_name: 'Iceberg Test Lead',
            value: 500,
            currency: 'USD'
        }
    };

    console.log('\n--- Sending First Event (Dispatched & Saved) ---');
    const result1 = await metaCapi.sendServerEvent(testPayload);
    console.log('Result 1:', result1);

    console.log('\n--- Sending 3rd Event With Same Event ID (Must be Blocked as duplicate) ---');
    const result3 = await metaCapi.sendServerEvent(testPayload);
    console.log('Result 3:', result3);

    if (!result3.duplicate) {
        throw new Error('Expected 3rd event to be blocked as duplicate!');
    }

    console.log('\n--- Verification completed successfully! ---');
}

testMetaCapi().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
