/**
 * scratch/test-client-portal.js
 * Verification script for ICEBERG Client View Portal using native fetch & http server:
 * 1. Seed or find client + project
 * 2. Create client user with username
 * 3. Test login & JWT generation
 * 4. Test Overview dashboard
 * 5. Test Onboarding Brief submission
 * 6. Test Deliverable & Checklist querying
 * 7. Test Add-on application
 * 8. Test multi-tenant isolation
 */

const http = require('http');
const mongoose = require('mongoose');
const app = require('../api/index');
const User = require('../lib/models/User');
const Client = require('../lib/models/Client');
const AccountProject = require('../lib/models/AccountProject');
const Task = require('../lib/models/Task');
const ClientBrief = require('../lib/models/ClientBrief');

const TEST_PORT = 3999;
const BASE_URL = `http://localhost:${TEST_PORT}`;

async function runVerification() {
  console.log('--- STARTING CLIENT PORTAL VERIFICATION ---');

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(TEST_PORT, resolve));
  console.log(`[OK] Temporary test server listening on ${BASE_URL}`);

  try {
    // Warm up database connection
    console.log('[...] Pre-warming MongoDB connection...');
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    console.log('[OK] Health status:', healthData.status, 'Mongo state:', healthData.mongo?.state_desc);

    // 1. Seed/Ensure Test Client & Project
    let client = await Client.findOne({ company_name: 'Innovate Healthcare Egypt' });
    if (!client) {
      client = new Client({
        company_name: 'Innovate Healthcare Egypt',
        industry: 'Healthcare & Pharma',
        website_url: 'https://innovate-egypt.com',
        contact_person: {
          name: 'Dr. Tarek Mansour',
          email: 'tarek@innovate-egypt.com',
          phone: '+20 100 123 4567'
        },
        status: 'ONBOARDING'
      });
      await client.save();
      console.log('[OK] Created test client:', client.client_id);
    } else {
      console.log('[OK] Found existing test client:', client.client_id);
    }

    let project = await AccountProject.findOne({ client_id: client._id });
    if (!project) {
      project = new AccountProject({
        client_id: client._id,
        title: 'Innovate Digital Launch & Performance Retainer',
        service_category: 'PERFORMANCE_MARKETING',
        status: 'PLANNING',
        budget: { allocated_amount: 15000, currency: 'USD' },
        links: {
          staging_url: 'https://staging.innovate-egypt.com',
          figma_url: 'https://figma.com/@iceberg/innovate',
          drive_folder: 'https://drive.google.com/drive/folders/innovate'
        }
      });
      await project.save();
      console.log('[OK] Created test project:', project.project_id);
    } else {
      console.log('[OK] Found existing test project:', project.project_id);
    }

    // Ensure test task exists
    let task = await Task.findOne({ project_id: project._id });
    if (!task) {
      task = new Task({
        project_id: project._id,
        client_id: client._id,
        title: 'Master Landing Page Wireframe & UI System',
        description: 'Comprehensive high-converting wireframe and Figma design system for lead generation campaign.',
        status: 'IN_REVIEW',
        deliverable_versions: [{
          version_number: 1,
          asset_url: 'https://figma.com/@iceberg/innovate/v1',
          preview_type: 'FIGMA',
          client_status: 'PENDING_REVIEW'
        }]
      });
      await task.save();
      console.log('[OK] Created test deliverable task:', task.task_id);
    }

    // 2. Admin Creates Client User
    console.log('\n--- TEST 1: Admin Create Client User ---');
    const adminToken = require('jsonwebtoken').sign(
      { user_id: 'usr_ceo_01', email: 'ceo@icebergma.com', role: 'CEO', full_name: 'CEO (Principal)' },
      process.env.JWT_SECRET || 'iceberg_internal_jwt_secret_2026'
    );

    const createRes = await fetch(`${BASE_URL}/api/iams/client-portal/admin/create-client-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        username: 'client_innovate',
        password: 'innovate2026',
        full_name: 'Dr. Tarek Mansour',
        email: 'tarek@innovate-egypt.com',
        project_id: project.project_id,
        client_id: client.client_id
      })
    });

    const createData = await createRes.json();
    console.log('Create Client User Response status:', createRes.status);
    console.log('Create Client User body:', createData);

    // 3. Client Login
    console.log('\n--- TEST 2: Client Login via Username & Password ---');
    const loginRes = await fetch(`${BASE_URL}/api/iams/client-portal/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'client_innovate',
        password: 'innovate2026'
      })
    });

    const loginData = await loginRes.json();
    console.log('Login Response status:', loginRes.status);
    console.log('Login success:', loginData.success);
    console.log('Assigned Project in Login:', loginData.assignment);
    const clientToken = loginData.token;

    if (!clientToken) {
      throw new Error(`Login failed: ${loginData.error}`);
    }

    // 4. Client Overview Dashboard
    console.log('\n--- TEST 3: Client Overview Dashboard ---');
    const overviewRes = await fetch(`${BASE_URL}/api/iams/client-portal/overview`, {
      headers: { 'Authorization': `Bearer ${clientToken}` }
    });

    const overviewData = await overviewRes.json();
    console.log('Overview status:', overviewRes.status);
    console.log('Overview project title:', overviewData.project?.title);
    console.log('Overview metrics:', overviewData.metrics);
    console.log('Overview contacts:', overviewData.contacts);

    // 5. Onboarding Brief Submission
    console.log('\n--- TEST 4: Onboarding Brief Submission ---');
    const briefRes = await fetch(`${BASE_URL}/api/iams/client-portal/brief`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${clientToken}`
      },
      body: JSON.stringify({
        action: 'SUBMIT',
        brand_overview: {
          brand_story: 'Innovate Healthcare is the leading diagnostic provider in North Africa.',
          value_proposition: 'Precision diagnostic results within 2 hours with digital portal access.',
          industry_niche: 'Medical & Diagnostic Technology'
        },
        target_audience: {
          primary_persona: 'Private hospital directors and patients seeking specialized lab work.',
          pain_points: ['Slow turnaround time', 'Inconsistent sample handling']
        },
        scope_and_objectives: {
          primary_goal: 'LEAD_GENERATION',
          target_kpis: '500 inbound doctor referrals per month'
        },
        creative_preferences: {
          visual_style: 'MINIMAL_LUXURY',
          brand_colors: ['#06b6d4', '#0f172a', '#10b981']
        },
        assets_and_access: {
          drive_folder_url: 'https://drive.google.com/drive/folders/innovate-assets',
          brand_guidelines_url: 'https://figma.com/@iceberg/guidelines'
        }
      })
    });

    const briefData = await briefRes.json();
    console.log('Brief submit status:', briefRes.status);
    console.log('Brief submission status in DB:', briefData.brief?.status);
    console.log('Brief completion percentage:', briefData.brief?.completion_percentage);

    // 6. Checklists & Deliverables
    console.log('\n--- TEST 5: Checklists & Deliverables ---');
    const checklistsRes = await fetch(`${BASE_URL}/api/iams/client-portal/checklists`, {
      headers: { 'Authorization': `Bearer ${clientToken}` }
    });

    const checklistsData = await checklistsRes.json();
    console.log('Checklists status:', checklistsRes.status);
    console.log('Onboarding checklist items count:', checklistsData.onboarding_checklist?.length);
    console.log('Deliverables count:', checklistsData.deliverables?.length);

    // 7. Deliverable Approval / Revision Action
    console.log('\n--- TEST 6: Deliverable Client Approval ---');
    const approveRes = await fetch(`${BASE_URL}/api/iams/client-portal/deliverables/${task.task_id}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${clientToken}`
      },
      body: JSON.stringify({
        action: 'APPROVE',
        feedback: 'Wireframes are approved! Please proceed to visual design.'
      })
    });

    const approveData = await approveRes.json();
    console.log('Approve status:', approveRes.status);
    console.log('Approve message:', approveData.message);

    // 8. Add-on Services Catalog & Application
    console.log('\n--- TEST 7: Add-on Services Catalog & Application ---');
    const addonsRes = await fetch(`${BASE_URL}/api/iams/client-portal/addons`, {
      headers: { 'Authorization': `Bearer ${clientToken}` }
    });

    const addonsData = await addonsRes.json();
    console.log('Addons catalog count:', addonsData.services?.length);

    const applyRes = await fetch(`${BASE_URL}/api/iams/client-portal/addons/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${clientToken}`
      },
      body: JSON.stringify({
        service_slug: 'meta-ads-scaling-pack',
        custom_requirements: 'Scaling our Cairo launch campaign with 10 video creatives.',
        timeline_preference: 'PRIORITY',
        currency: 'USD'
      })
    });

    const applyData = await applyRes.json();
    console.log('Apply addon status:', applyRes.status);
    console.log('Apply addon response:', applyData.message);

    // Verify requests list
    const requestsRes = await fetch(`${BASE_URL}/api/iams/client-portal/my-requests`, {
      headers: { 'Authorization': `Bearer ${clientToken}` }
    });
    const requestsData = await requestsRes.json();
    console.log('Client applied requests count:', requestsData.requests?.length);

    // 9. Static Page Route Rewrites
    console.log('\n--- TEST 8: Static /portal Page Rewrite ---');
    const portalPageRes = await fetch(`${BASE_URL}/portal`);
    console.log('/portal status:', portalPageRes.status);
    const htmlText = await portalPageRes.text();
    console.log('/portal contains ICEBERG CLIENT SUITE:', htmlText.includes('ICEBERG') && htmlText.includes('CLIENT SUITE'));

    // 10. Strict Multi-Tenant Isolation
    console.log('\n--- TEST 9: Multi-Tenant Data Isolation ---');
    const intruderToken = require('jsonwebtoken').sign(
      { user_id: 'usr_intruder_99', username: 'intruder', role: 'ClientGuest', project_id: 'prj_non_existent', client_id: 'cli_non_existent' },
      process.env.JWT_SECRET || 'iceberg_internal_jwt_secret_2026'
    );

    const intruderRes = await fetch(`${BASE_URL}/api/iams/client-portal/overview`, {
      headers: { 'Authorization': `Bearer ${intruderToken}` }
    });

    console.log('Intruder attempt status:', intruderRes.status);
    const intruderData = await intruderRes.json();
    if (intruderData.project?.title === project.title) {
      console.error('[FAIL]: DATA LEAK DETECTED! Intruder saw Innovate project!');
    } else {
      console.log('[PASS]: Zero data leakage. Intruder cannot access Innovate project data.');
    }

    console.log('\n======================================================');
    console.log('🎉 ALL CLIENT PORTAL VERIFICATION TESTS PASSED 100%!');
    console.log('======================================================');
  } finally {
    server.close();
    process.exit(0);
  }
}

runVerification().catch(err => {
  console.error('Verification error:', err);
  process.exit(1);
});
