const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../api/models/User');
const Client = require('../api/models/Client');
const AccountProject = require('../api/models/AccountProject');
const Task = require('../api/models/Task');
const Invoice = require('../api/models/Invoice');
const AuditLog = require('../api/models/AuditLog');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/iceberg-agency';
    console.log('[IAMS Seeder]: Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('[IAMS Seeder]: Connected.');

    // 1. Staff Users
    console.log('[IAMS Seeder]: Seeding staff users...');
    let superAdmin = await User.findOne({ email: 'admin@icebergma.com' });
    if (!superAdmin) {
      superAdmin = new User({
        email: 'admin@icebergma.com',
        password: 'iceberg-super-secret-password-2026',
        full_name: 'Executive Super Admin',
        role: 'SUPER_ADMIN',
        department: 'OPERATIONS',
        cost_rates: { hourly_cost: 500, currency: 'EGP' },
        capacity: { weekly_hours: 40 }
      });
      await superAdmin.save();
    }

    let sarahAm = await User.findOne({ email: 'sarah.jenkins@icebergma.com' });
    if (!sarahAm) {
      sarahAm = new User({
        email: 'sarah.jenkins@icebergma.com',
        password: 'password123',
        full_name: 'Sarah Jenkins',
        role: 'ACCOUNT_MANAGER',
        department: 'OPERATIONS',
        cost_rates: { hourly_cost: 350, currency: 'EGP' },
        capacity: { weekly_hours: 40 }
      });
      await sarahAm.save();
    }

    let devSpecialist = await User.findOne({ email: 'dev.lead@icebergma.com' });
    if (!devSpecialist) {
      devSpecialist = new User({
        email: 'dev.lead@icebergma.com',
        password: 'password123',
        full_name: 'Tarek Mansour',
        role: 'SPECIALIST',
        department: 'WEB_DEV',
        cost_rates: { hourly_cost: 400, currency: 'EGP' },
        capacity: { weekly_hours: 40 }
      });
      await devSpecialist.save();
    }

    let seoSpecialist = await User.findOne({ email: 'seo.lead@icebergma.com' });
    if (!seoSpecialist) {
      seoSpecialist = new User({
        email: 'seo.lead@icebergma.com',
        password: 'password123',
        full_name: 'Nour El-Din',
        role: 'SPECIALIST',
        department: 'SEO',
        cost_rates: { hourly_cost: 300, currency: 'EGP' },
        capacity: { weekly_hours: 40 }
      });
      await seoSpecialist.save();
    }

    // 2. Client Accounts
    console.log('[IAMS Seeder]: Seeding clients...');
    let dentaquick = await Client.findOne({ company_name: 'DentaQuick Dental Clinics' });
    if (!dentaquick) {
      dentaquick = new Client({
        company_name: 'DentaQuick Dental Clinics',
        contact_person: {
          name: 'Dr. Karim Fouad',
          email: 'karim@dentaquick.com',
          phone: '+201098765432',
          whatsapp_number: '+201098765432',
          position: 'Managing Director'
        },
        corporate_tax_info: {
          tax_id_number: '624-918-302',
          commercial_register: 'CR-104829',
          billing_address: '14 Al-Thawra St, Heliopolis, Cairo'
        },
        industry: 'Dental & Healthcare',
        website_url: 'https://dentaquick.com',
        account_manager_id: sarahAm._id,
        status: 'ACTIVE_RETAINER',
        financials: {
          currency: 'USD',
          monthly_retainer: 3500,
          payment_terms_days: 15,
          total_lifetime_value: 28000,
          billing_cycle: 'MONTHLY'
        },
        retainer_quotas: {
          monthly_reels: { allocated: 8, consumed: 5 },
          monthly_posts: { allocated: 12, consumed: 8 },
          monthly_dev_hours: { allocated: 15, consumed: 10 },
          monthly_seo_articles: { allocated: 4, consumed: 3 }
        },
        contract_period: {
          start_date: new Date('2026-01-01'),
          renewal_date: new Date('2026-12-31')
        }
      });
      await dentaquick.save();
    }

    let penates = await Client.findOne({ company_name: 'Penates Real Estate Development' });
    if (!penates) {
      penates = new Client({
        company_name: 'Penates Real Estate Development',
        contact_person: {
          name: 'Eng. Ahmed Zaki',
          email: 'zaki@penates-eg.com',
          phone: '+201223344556',
          whatsapp_number: '+201223344556',
          position: 'Chief Marketing Officer'
        },
        corporate_tax_info: {
          tax_id_number: '819-204-771',
          commercial_register: 'CR-88921',
          billing_address: 'Plot 4, North 90th St, New Cairo'
        },
        industry: 'Real Estate',
        website_url: 'https://penates-eg.com',
        account_manager_id: sarahAm._id,
        status: 'ACTIVE_RETAINER',
        financials: {
          currency: 'EGP',
          monthly_retainer: 120000,
          payment_terms_days: 15,
          total_lifetime_value: 720000,
          billing_cycle: 'MONTHLY'
        },
        retainer_quotas: {
          monthly_reels: { allocated: 12, consumed: 9 },
          monthly_posts: { allocated: 20, consumed: 15 },
          monthly_dev_hours: { allocated: 30, consumed: 22 },
          monthly_seo_articles: { allocated: 6, consumed: 4 }
        }
      });
      await penates.save();
    }

    let waterpik = await Client.findOne({ company_name: 'Waterpik Egypt' });
    if (!waterpik) {
      waterpik = new Client({
        company_name: 'Waterpik Egypt',
        contact_person: {
          name: 'Sherif El-Badry',
          email: 'sherif@waterpik-eg.com',
          phone: '+201112233445',
          whatsapp_number: '+201112233445',
          position: 'Brand Manager'
        },
        corporate_tax_info: {
          tax_id_number: '550-109-883',
          commercial_register: 'CR-49102',
          billing_address: 'Smart Village, Building B12, Giza'
        },
        industry: 'Medical Devices & E-Commerce',
        website_url: 'https://waterpik.com.eg',
        account_manager_id: sarahAm._id,
        status: 'ONBOARDING',
        financials: {
          currency: 'EGP',
          monthly_retainer: 85000,
          total_lifetime_value: 85000
        }
      });
      await waterpik.save();
    }

    // 3. Operational Projects
    console.log('[IAMS Seeder]: Seeding projects...');
    let dentaquickProj = await AccountProject.findOne({ client_id: dentaquick._id });
    if (!dentaquickProj) {
      dentaquickProj = new AccountProject({
        client_id: dentaquick._id,
        title: 'Acme Dental Brand Redesign & SEO Retainer',
        service_category: 'WEB_DEVELOPMENT',
        lead_specialist_id: devSpecialist._id,
        budget: {
          currency: 'USD',
          allocated_amount: 3500,
          consumed_amount: 2100,
          estimated_labor_cost: 1400
        },
        links: {
          staging_url: 'https://staging.dentaquick.icebergma.com',
          repository_url: 'https://github.com/iceberg-agency/dentaquick-web',
          figma_url: 'https://figma.com/@iceberg/dentaquick'
        },
        status: 'IN_DEVELOPMENT'
      });
      await dentaquickProj.save();
    }

    // 4. Kanban Sprint Tasks
    console.log('[IAMS Seeder]: Seeding tasks...');
    const existingTasksCount = await Task.countDocuments({ client_id: dentaquick._id });
    if (existingTasksCount === 0) {
      const sampleTasks = [
        {
          project_id: dentaquickProj._id,
          client_id: dentaquick._id,
          assigned_to_id: seoSpecialist._id,
          title: 'Conduct competitor SEO analysis & keyword matrix',
          priority: 'CRITICAL',
          status: 'BACKLOG',
          time_tracking: { estimated_hours: 20, actual_hours: 14, labor_cost_accrued: 4200 },
          due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
        },
        {
          project_id: dentaquickProj._id,
          client_id: dentaquick._id,
          assigned_to_id: devSpecialist._id,
          title: 'Develop responsive homepage hero & booking wizard',
          priority: 'HIGH',
          status: 'TODO',
          time_tracking: { estimated_hours: 20, actual_hours: 14, labor_cost_accrued: 5600 },
          due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        },
        {
          project_id: dentaquickProj._id,
          client_id: dentaquick._id,
          assigned_to_id: devSpecialist._id,
          title: 'Setup Google Ads campaign for Invisalign landing page',
          priority: 'CRITICAL',
          status: 'IN_PROGRESS',
          time_tracking: { estimated_hours: 20, actual_hours: 14, labor_cost_accrued: 5600 },
          due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
        },
        {
          project_id: dentaquickProj._id,
          client_id: dentaquick._id,
          assigned_to_id: seoSpecialist._id,
          title: 'Develop retainer SEO content calendar for Q2',
          priority: 'MEDIUM',
          status: 'IN_REVIEW',
          deliverable_versions: [{
            version_number: 1,
            asset_url: 'https://docs.google.com/spreadsheets/d/dentaquick-q2-seo',
            preview_type: 'DOCUMENT',
            client_status: 'PENDING_REVIEW'
          }],
          time_tracking: { estimated_hours: 20, actual_hours: 14, labor_cost_accrued: 4200 },
          due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
        },
        {
          project_id: dentaquickProj._id,
          client_id: dentaquick._id,
          assigned_to_id: devSpecialist._id,
          title: 'Deploy Meta Pixel & Conversions API tracking setup',
          priority: 'CRITICAL',
          status: 'DONE',
          time_tracking: { estimated_hours: 20, actual_hours: 14, labor_cost_accrued: 5600 },
          completed_at: new Date()
        }
      ];

      await Task.insertMany(sampleTasks);
    }

    // 5. Invoices & Ledger
    console.log('[IAMS Seeder]: Seeding invoices...');
    const existingInvoicesCount = await Invoice.countDocuments();
    if (existingInvoicesCount === 0) {
      const sampleInvoices = [
        {
          invoice_number: 'INV-2026-084',
          client_id: dentaquick._id,
          project_id: dentaquickProj._id,
          items: [
            { description: 'Monthly Digital Retainer (Social, SEO, Web Maintenance)', quantity: 1, unit_price: 3500, total: 3500 }
          ],
          currency: 'USD',
          fx_rate_to_egp: 50.0,
          financial_breakdown: {
            subtotal: 3500,
            vat_rate_percent: 0,
            vat_amount: 0,
            withholding_tax_percent: 0,
            withholding_tax_amount: 0,
            discount_amount: 0,
            net_payable_amount: 3500
          },
          status: 'PAID',
          dates: {
            issue_date: new Date('2026-02-01'),
            due_date: new Date('2026-02-15'),
            paid_date: new Date('2026-02-12')
          },
          payment_details: {
            method: 'STRIPE',
            transaction_reference: 'ch_3M4829104829'
          }
        },
        {
          invoice_number: 'INV-2026-085',
          client_id: penates._id,
          items: [
            { description: 'Real Estate Growth Marketing Retainer & Lead Gen', quantity: 1, unit_price: 120000, total: 120000 }
          ],
          currency: 'EGP',
          fx_rate_to_egp: 1.0,
          financial_breakdown: {
            subtotal: 120000,
            vat_rate_percent: 14,
            vat_amount: 16800,
            withholding_tax_percent: 1,
            withholding_tax_amount: 1200,
            discount_amount: 0,
            net_payable_amount: 135600
          },
          status: 'PAID',
          dates: {
            issue_date: new Date('2026-02-01'),
            due_date: new Date('2026-02-15'),
            paid_date: new Date('2026-02-14')
          },
          payment_details: {
            method: 'INSTAPAY',
            instapay_handle: 'penates@instapay',
            transaction_reference: 'TXN-IP-9920148'
          }
        },
        {
          invoice_number: 'INV-2026-086',
          client_id: waterpik._id,
          items: [
            { description: 'E-Commerce Website Redesign & Meta CAPI Integration (Phase 1)', quantity: 1, unit_price: 85000, total: 85000 }
          ],
          currency: 'EGP',
          fx_rate_to_egp: 1.0,
          financial_breakdown: {
            subtotal: 85000,
            vat_rate_percent: 14,
            vat_amount: 11900,
            withholding_tax_percent: 1,
            withholding_tax_amount: 850,
            discount_amount: 0,
            net_payable_amount: 96050
          },
          status: 'SENT',
          dates: {
            issue_date: new Date('2026-03-01'),
            due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
          },
          payment_details: {
            method: 'BANK_TRANSFER_CIB',
            bank_iban: 'EG490010000400000123456789012'
          }
        }
      ];

      await Invoice.insertMany(sampleInvoices);
    }

    console.log('[IAMS Seeder]: ✅ Successfully seeded IAMS initial database!');
    process.exit(0);
  } catch (err) {
    console.error('[IAMS Seeder Error]:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  seedData();
}

module.exports = seedData;
