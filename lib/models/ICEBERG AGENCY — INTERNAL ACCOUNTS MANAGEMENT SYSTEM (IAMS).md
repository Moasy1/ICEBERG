# ICEBERG AGENCY — INTERNAL ACCOUNTS MANAGEMENT SYSTEM (IAMS)
## Full Architecture, Database Schema, API Spec, Tax Compliance & Core Stack Alignment Blueprint

---

### 1. EXECUTIVE REVIEW & COMPREHENSIVE ARCHITECTURAL AUDIT

An in-depth architectural audit of the initial IAMS specification and agency operational requirements identified key missing components required for a production-grade digital agency ERP. This comprehensive blueprint incorporates full technical alignment with the ICEBERG core stack (Node.js, Express, MongoDB/Mongoose, JWT, Tailwind, Lucide) alongside crucial missing enterprise modules.

| Architectural & Operational Domain | Initial Draft Gap / Misalignment | ICEBERG Production-Ready Solution | Operational Impact & Codebase Value |
| :--- | :--- | :--- | :--- |
| **Database Engine & ODM** | PostgreSQL / Prisma ORM | **MongoDB + Mongoose 8.x** | Directly integrates with existing models ([`Lead.js`](file:///c:/Users/hmanm/Downloads/ICEBERG/api/models/Lead.js), [`Project.js`](file:///c:/Users/hmanm/Downloads/ICEBERG/api/models/Project.js), [`CalendarSlot.js`](file:///c:/Users/hmanm/Downloads/ICEBERG/api/models/CalendarSlot.js), [`Notification.js`](file:///c:/Users/hmanm/Downloads/ICEBERG/api/models/Notification.js)). |
| **Backend & Routing** | Next.js Route Handlers | **Node.js + Express 4.x (`api/index.js`)** | Extends Express REST API mounted under `/api/iams/*` with helmet, CORS, and rate limiting. |
| **Authentication & RBAC** | NextAuth.js | **JWT (`jsonwebtoken`) + `bcryptjs` + Magic-Link** | Stateless RBAC with HTTP-only cookies, Bearer tokens, and passwordless **Client Portal Magic Links**. |
| **Egyptian Tax & ETA Compliance** | ⚠️ *Missing in initial draft* | **Egyptian VAT (14%), WHT (1%-3%), TIN & CR** | Full support for Egyptian Tax Card (البطاقة الضريبية), Commercial Register (السجل التجاري), and Withholding Tax. |
| **Multi-Currency & FX Lock** | USD only | **Dual Currency (`EGP` & `USD`) + Fixed FX Lock** | Handles Egyptian domestic accounts and international USD retainers with historical exchange rate snapshots. |
| **Retainer Quota & Scope Guard** | ⚠️ *Missing in initial draft* | **Deliverable Quota Engine & Change Request (CR)** | Prevents agency scope creep by tracking allocated vs consumed monthly deliverables (Reels, Dev Hours, Posts, SEO). |
| **Deliverable Approval Pipeline** | ⚠️ *Missing in initial draft* | **Multi-Version Review & Revision Counter** | Manages deliverable review cycles (`v1`, `v2`, `Final`), revision limits (e.g. max 2 free rounds), and client sign-offs. |
| **Financial Margin & Capacity** | ⚠️ *Missing in initial draft* | **Specialist Cost Rate & Gross Margin Tracker** | Calculates account profitability `((Revenue - Specialist Labor Cost) / Revenue) * 100` and staff utilization. |
| **Meeting Minutes & Action Items** | ⚠️ *Missing in initial draft* | **Strategic Account Meeting Logs** | Captures bi-weekly sync minutes, strategy calls, and assigns action items to AMs or clients. |
| **Multi-Channel Dispatcher** | ⚠️ *Missing in initial draft* | **Nodemailer + WhatsApp Templates + Webhooks** | Dispatches invoice links, payment receipts, and milestone alerts via Email, WhatsApp API, and Slack/n8n webhooks. |
| **Data Resilience & Seeding** | ⚠️ *Missing in initial draft* | **Disk Fallback (`.jsonl`) + Realistic Data Seeder** | Append-only financial audit backup (`api/iams_audit_backup.jsonl`) and seeder with portfolio brands. |

---

### 2. SYSTEM ARCHITECTURE & TECH STACK SPECIFICATION

* **Application Type:** Internal Agency Enterprise Resource Planning (ERP), Account Management, Retainer Quota & Billing System.
* **Target Environment:** Embedded in the ICEBERG Admin Console (`/admin` -> Section `#iams`) with route protection, and a lightweight standalone Client Portal (`/portal`).
* **Technology Stack:**
  * **Runtime:** Node.js (v18+ LTS / v20+)
  * **API Server:** Express.js (`^4.21.2`) with `helmet`, `cors`, and `express-rate-limit`.
  * **Database:** MongoDB Atlas / Local MongoDB via Mongoose (`^8.9.5`).
  * **Security & Auth:** `bcryptjs` (`^2.4.3`) for password hashing, `jsonwebtoken` (`^9.0.2`) for token signing/verification and time-limited Client Magic Links.
  * **Email & Transports:** `nodemailer` (`^9.0.1`) for automated transactional notifications, invoice dispatch, and milestone alerts.
  * **Communication Webhooks:** WhatsApp Cloud API / Twilio webhook templates, and internal event bus hooked into [`Notification.js`](file:///c:/Users/hmanm/Downloads/ICEBERG/api/models/Notification.js) and Meta CAPI ([`api/services/metaCapi.js`](file:///c:/Users/hmanm/Downloads/ICEBERG/api/services/metaCapi.js)).
  * **Frontend UI:** Vanilla ES6+ SPA controllers ([`public/admin/iams.js`](file:///c:/Users/hmanm/Downloads/ICEBERG/public/admin/iams.js)), Tailwind CSS (`cdn.tailwindcss.com` with configured custom palette), Lucide icons, Inter typography, and glassmorphic UI elements (`bg-slate-900/90`, border `slate-800`, accent `cyan-500` / `#06b6d4`, emerald `#10b981`, amber `#f59e0b`).

---

### 3. ROLE-BASED ACCESS CONTROL (RBAC) & CLIENT MAGIC-LINK ACCESS

```
                        ┌───────────────────────────────┐
                        │      SUPER_ADMIN / OWNER      │
                        │   (Full System & Financials)  │
                        └──────────────┬────────────────┘
                                       │
               ┌───────────────────────┴───────────────────────┐
               │                                               │
      ┌────────▼──────────────┐                     ┌──────────▼────────────┐
      │   ACCOUNT_MANAGER     │                     │      SPECIALIST       │
      │  (Clients, Invoices,  │                     │ (Assigned Tasks, Work │
      │  Deliverables, Quotas)│                     │ Logs, Sprint Status)  │
      └────────┬──────────────┘                     └───────────────────────┘
               │
      ┌────────▼──────────────┐
      │   CLIENT_PORTAL USER  │
      │ (Passwordless Magic   │
      │  Link / Approvals)    │
      └───────────────────────┘
```

| Role | Scope & Permissions | Restricted Endpoints |
| :--- | :--- | :--- |
| **`SUPER_ADMIN`** | Complete read/write access: revenue reports, specialist cost rates, gross margins, client retainers, staff payroll, user management, audit logs, and raw database exports. | None (Universal Access) |
| **`ACCOUNT_MANAGER`** | Manage assigned client portfolios, track monthly retainer quotas, create/dispatch invoices, schedule milestones, update project budgets, and log meeting minutes. | Cannot modify staff hourly cost rates, system API keys, or delete global audit logs. |
| **`SPECIALIST`** | View assigned projects and tasks, advance Kanban boards (`TODO` -> `IN_PROGRESS` -> `IN_REVIEW` -> `DONE`), record logged hours, and attach deliverables. | Restricted from viewing client financial retainers, invoice balances, or company-wide gross profit figures. |
| **`CLIENT_VIEWER`** | Passwordless Magic-Link access to inspect active deliverables, approve/request changes on drafts, view paid/open invoices, and download receipts. | Strictly scoped to their own `clientId`; no access to internal cost models, staff rates, or Kanban task backlog. |

#### RBAC & Magic-Link Middleware Implementation Pattern (`api/middleware/auth.js`)
```javascript
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['x-access-token'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : req.cookies?.iceberg_auth_token;

  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication token required.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'iceberg_internal_jwt_secret_2026');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, error: 'Invalid or expired authentication token.' });
  }
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access forbidden: Role '${req.user?.role || 'Guest'}' lacks necessary permissions.`
      });
    }
    next();
  };
};

// Validates time-limited Client Portal Magic Links
const verifyClientPortalToken = (req, res, next) => {
  const token = req.query.token || req.headers['x-client-token'];
  if (!token) return res.status(401).json({ success: false, error: 'Client portal token missing.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'iceberg_internal_jwt_secret_2026');
    if (decoded.role !== 'CLIENT_VIEWER' || !decoded.client_id) {
      return res.status(403).json({ success: false, error: 'Invalid portal token scope.' });
    }
    req.clientUser = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, error: 'Portal link has expired. Please request a new one.' });
  }
};

module.exports = { verifyToken, authorizeRoles, verifyClientPortalToken };
```

---

### 4. MONGOOSE DATA SCHEMAS & DATABASE ARCHITECTURE

#### 4.1 Users & Staff Model (`api/models/User.js`)
*Includes specialist hourly cost rates for automated profitability analysis.*

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    unique: true,
    default: () => `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  },
  email: {
    type: String,
    required: [true, 'Staff email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false
  },
  full_name: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  role: {
    type: String,
    enum: ['SUPER_ADMIN', 'ACCOUNT_MANAGER', 'SPECIALIST', 'CLIENT_VIEWER'],
    default: 'SPECIALIST'
  },
  department: {
    type: String,
    enum: ['WEB_DEV', 'SEO', 'SOCIAL_MEDIA', 'PERFORMANCE_MARKETING', 'BRANDING', 'VIDEO_PRODUCTION', 'OPERATIONS'],
    default: 'OPERATIONS'
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  cost_rates: {
    hourly_cost: { type: Number, default: 0 }, // Internal cost rate per hour
    currency: { type: String, enum: ['USD', 'EGP'], default: 'EGP' }
  },
  capacity: {
    weekly_hours: { type: Number, default: 40 },
    active_load_hours: { type: Number, default: 0 }
  },
  is_active: {
    type: Boolean,
    default: true
  },
  avatar_url: {
    type: String,
    default: ''
  },
  last_login: {
    type: Date,
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ department: 1 });
UserSchema.index({ is_active: 1 });

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
```

---

#### 4.2 Client Accounts Model (`api/models/Client.js`)
*Includes Egyptian Tax ID (TIN), Commercial Registration (CR), Monthly Retainer Deliverable Quotas, and WhatsApp routing.*

```javascript
const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
  client_id: {
    type: String,
    required: true,
    unique: true,
    default: () => `cli_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  },
  company_name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    index: true
  },
  contact_person: {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true, default: '' },
    whatsapp_number: { type: String, trim: true, default: '' },
    position: { type: String, trim: true, default: '' }
  },
  corporate_tax_info: {
    tax_id_number: { type: String, default: '', trim: true }, // البطاقة الضريبية
    commercial_register: { type: String, default: '', trim: true }, // السجل التجاري
    billing_address: { type: String, default: '', trim: true },
    vat_exempt: { type: Boolean, default: false }
  },
  industry: {
    type: String,
    trim: true,
    default: 'General Business'
  },
  website_url: {
    type: String,
    trim: true,
    default: ''
  },
  account_manager_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['PROSPECT', 'ONBOARDING', 'ACTIVE_RETAINER', 'PROJECT_BASED', 'PAUSED', 'CHURNED'],
    default: 'ONBOARDING'
  },
  financials: {
    currency: {
      type: String,
      enum: ['USD', 'EGP'],
      default: 'USD'
    },
    monthly_retainer: {
      type: Number,
      default: 0
    },
    payment_terms_days: {
      type: Number,
      default: 15 // Net 15 days
    },
    total_lifetime_value: {
      type: Number,
      default: 0
    },
    billing_cycle: {
      type: String,
      enum: ['MONTHLY', 'QUARTERLY', 'MILESTONE_BASED'],
      default: 'MONTHLY'
    }
  },
  // Scope Creep Guard: Monthly Retainer Allocated vs Consumed Quotas
  retainer_quotas: {
    monthly_reels: { allocated: { type: Number, default: 0 }, consumed: { type: Number, default: 0 } },
    monthly_posts: { allocated: { type: Number, default: 0 }, consumed: { type: Number, default: 0 } },
    monthly_dev_hours: { allocated: { type: Number, default: 0 }, consumed: { type: Number, default: 0 } },
    monthly_seo_articles: { allocated: { type: Number, default: 0 }, consumed: { type: Number, default: 0 } },
    monthly_ad_spend_management: { allocated: { type: Number, default: 0 }, consumed: { type: Number, default: 0 } }
  },
  contract_period: {
    start_date: { type: Date, default: null },
    renewal_date: { type: Date, default: null },
    auto_renew: { type: Boolean, default: true }
  },
  originating_lead_id: {
    type: String,
    ref: 'Lead',
    default: null
  },
  originating_calendar_slot: {
    type: String,
    ref: 'CalendarSlot',
    default: null
  },
  portal_access: {
    enabled: { type: Boolean, default: true },
    active_magic_token: { type: String, default: null },
    token_expires_at: { type: Date, default: null }
  },
  meeting_minutes: [{
    meeting_id: { type: String, default: () => `mtg_${Date.now()}` },
    meeting_type: { type: String, enum: ['STRATEGY', 'WEEKLY_SYNC', 'DELIVERABLE_REVIEW', 'EMERGENCY'], default: 'WEEKLY_SYNC' },
    date: { type: Date, default: Date.now },
    attendees: [String],
    summary: String,
    action_items: [{
      task_title: String,
      assigned_to: String,
      due_date: Date,
      is_done: { type: Boolean, default: false }
    }]
  }],
  notes: [{
    author_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    author_name: String,
    text: String,
    created_at: { type: Date, default: Date.now }
  }]
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

ClientSchema.index({ company_name: 1 });
ClientSchema.index({ status: 1 });
ClientSchema.index({ account_manager_id: 1 });
ClientSchema.index({ 'contact_person.email': 1 });
ClientSchema.index({ 'corporate_tax_info.tax_id_number': 1 });
ClientSchema.index({ status: 1, created_at: -1 });

module.exports = mongoose.models.Client || mongoose.model('Client', ClientSchema);
```

---

#### 4.3 Client Projects & Retainer Engagements (`api/models/AccountProject.js`)
*Manages active contracts, milestone roadmaps, change requests (out-of-scope), and live staging links.*

```javascript
const mongoose = require('mongoose');

const AccountProjectSchema = new mongoose.Schema({
  project_id: {
    type: String,
    required: true,
    unique: true,
    default: () => `prj_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  },
  client_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  service_category: {
    type: String,
    enum: ['WEB_DEVELOPMENT', 'SEO', 'SOCIAL_MEDIA', 'PERFORMANCE_MARKETING', 'BRANDING', 'CONTENT_PRODUCTION'],
    required: true
  },
  lead_specialist_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  budget: {
    currency: { type: String, enum: ['USD', 'EGP'], default: 'USD' },
    allocated_amount: { type: Number, default: 0 },
    consumed_amount: { type: Number, default: 0 },
    estimated_labor_cost: { type: Number, default: 0 }
  },
  links: {
    repository_url: { type: String, default: '' },
    staging_url: { type: String, default: '' },
    production_url: { type: String, default: '' },
    figma_url: { type: String, default: '' },
    drive_folder: { type: String, default: '' }
  },
  timeline: {
    kickoff_date: { type: Date, default: Date.now },
    deadline: { type: Date, default: null },
    completed_at: { type: Date, default: null }
  },
  change_requests: [{
    cr_id: { type: String, default: () => `cr_${Date.now()}` },
    title: String,
    description: String,
    additional_fee: Number,
    currency: { type: String, enum: ['USD', 'EGP'], default: 'USD' },
    approved_by_client: { type: Boolean, default: false },
    approved_at: Date
  }],
  status: {
    type: String,
    enum: ['PLANNING', 'IN_DEVELOPMENT', 'IN_REVIEW', 'ACTIVE_RETAINER', 'COMPLETED', 'ON_HOLD'],
    default: 'PLANNING'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

AccountProjectSchema.index({ client_id: 1 });
AccountProjectSchema.index({ lead_specialist_id: 1 });
AccountProjectSchema.index({ status: 1 });
AccountProjectSchema.index({ service_category: 1 });

module.exports = mongoose.models.AccountProject || mongoose.model('AccountProject', AccountProjectSchema);
```

---

#### 4.4 Tasks, Deliverable Review & Kanban Engine (`api/models/Task.js`)
*Includes multi-version deliverable approvals, revision counters (e.g. max 2 revision rounds), and time logs.*

```javascript
const mongoose = require('mongoose');

const DeliverableVersionSchema = new mongoose.Schema({
  version_number: { type: Number, default: 1 },
  asset_url: { type: String, required: true },
  preview_type: { type: String, enum: ['IMAGE', 'VIDEO', 'FIGMA', 'DOCUMENT', 'URL'], default: 'URL' },
  uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now },
  client_feedback: { type: String, default: '' },
  client_status: {
    type: String,
    enum: ['PENDING_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED'],
    default: 'PENDING_REVIEW'
  },
  reviewed_at: { type: Date, default: null }
}, { _id: false });

const TaskSchema = new mongoose.Schema({
  task_id: {
    type: String,
    required: true,
    unique: true,
    default: () => `tsk_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  },
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AccountProject',
    required: true,
    index: true
  },
  client_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
    index: true
  },
  assigned_to_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  },
  status: {
    type: String,
    enum: ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'],
    default: 'TODO'
  },
  deliverable_versions: [DeliverableVersionSchema],
  revision_rounds_count: {
    type: Number,
    default: 0
  },
  max_free_revisions: {
    type: Number,
    default: 2
  },
  time_tracking: {
    estimated_hours: { type: Number, default: 0 },
    actual_hours: { type: Number, default: 0 },
    labor_cost_accrued: { type: Number, default: 0 }
  },
  due_date: {
    type: Date,
    default: null
  },
  completed_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

TaskSchema.index({ project_id: 1, status: 1 });
TaskSchema.index({ assigned_to_id: 1, status: 1 });
TaskSchema.index({ client_id: 1 });
TaskSchema.index({ status: 1, due_date: 1 });

module.exports = mongoose.models.Task || mongoose.model('Task', TaskSchema);
```

---

#### 4.5 Invoicing & Tax Compliance Ledger (`api/models/Invoice.js`)
*Includes 14% Egyptian VAT, 1% / 3% Withholding Tax (WHT / الخصم والتحصيل), InstaPay/Vodafone Cash details, and USD/EGP exchange rate freeze.*

```javascript
const mongoose = require('mongoose');

const InvoiceItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  unit_price: { type: Number, required: true },
  total: { type: Number, required: true }
}, { _id: false });

const InvoiceSchema = new mongoose.Schema({
  invoice_id: {
    type: String,
    required: true,
    unique: true,
    default: () => `inv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  },
  invoice_number: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  client_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
    index: true
  },
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AccountProject',
    default: null
  },
  items: [InvoiceItemSchema],
  currency: {
    type: String,
    enum: ['USD', 'EGP'],
    default: 'USD'
  },
  fx_rate_to_egp: {
    type: Number,
    default: 1.0 // Snapshot of USD/EGP rate at the time of invoice creation
  },
  financial_breakdown: {
    subtotal: { type: Number, required: true },
    vat_rate_percent: { type: Number, default: 14 }, // 14% Egyptian VAT
    vat_amount: { type: Number, default: 0 },
    withholding_tax_percent: { type: Number, default: 0 }, // 1% or 3% WHT (خصم من المنبع)
    withholding_tax_amount: { type: Number, default: 0 },
    discount_amount: { type: Number, default: 0 },
    net_payable_amount: { type: Number, required: true }
  },
  status: {
    type: String,
    enum: ['DRAFT', 'SENT', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED'],
    default: 'DRAFT'
  },
  dates: {
    issue_date: { type: Date, default: Date.now },
    due_date: { type: Date, required: true },
    paid_date: { type: Date, default: null }
  },
  payment_details: {
    method: {
      type: String,
      enum: ['INSTAPAY', 'VODAFONE_CASH', 'BANK_TRANSFER_CIB', 'BANK_TRANSFER_NBE', 'STRIPE', 'CREDIT_CARD', 'CASH', 'OTHER'],
      default: 'INSTAPAY'
    },
    transaction_reference: { type: String, default: '' },
    instapay_handle: { type: String, default: 'iceberg@instapay' },
    vodafone_cash_number: { type: String, default: '+201000000000' },
    bank_iban: { type: String, default: '' }
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

InvoiceSchema.index({ client_id: 1, status: 1 });
InvoiceSchema.index({ invoice_number: 1 });
InvoiceSchema.index({ status: 1, 'dates.due_date': 1 });

module.exports = mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);
```

---

#### 4.6 Activity, Compliance & Audit Logs (`api/models/AuditLog.js`)

```javascript
const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  log_id: {
    type: String,
    required: true,
    unique: true,
    default: () => `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  user_email: {
    type: String,
    default: 'system'
  },
  action: {
    type: String,
    required: true, // "CLIENT_CREATED", "TASK_STATUS_UPDATED", "DELIVERABLE_APPROVED", "INVOICE_PAID", "QUOTA_RESET"
    index: true
  },
  entity_type: {
    type: String,
    enum: ['USER', 'CLIENT', 'PROJECT', 'TASK', 'INVOICE', 'SYSTEM'],
    required: true
  },
  entity_id: {
    type: String,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ip_address: {
    type: String,
    default: ''
  }
}, {
  timestamps: { createdAt: 'created_at' }
});

AuditLogSchema.index({ action: 1, created_at: -1 });
AuditLogSchema.index({ entity_type: 1, entity_id: 1 });
AuditLogSchema.index({ user_id: 1 });

module.exports = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
```

---

### 5. REST API ENDPOINTS SPECIFICATION

All endpoints are mounted under `/api/iams` in `api/index.js` and guarded by `verifyToken` and `authorizeRoles`.

#### 5.1 Authentication & Profile (`/api/iams/auth`)
* `POST /api/iams/auth/login`: Staff login returning JWT and role.
* `POST /api/iams/auth/register`: Super Admin route to onboard staff with hourly cost rates.
* `GET /api/iams/auth/me`: Authenticated profile and capacity.
* `POST /api/iams/auth/generate-client-magic-link/:clientId`: Generates a secure, 7-day passwordless link for the client portal.

#### 5.2 Client Accounts Management (`/api/iams/clients`)
* `GET /api/iams/clients`: Paginated accounts list with filters (`?status=ACTIVE_RETAINER&currency=EGP`).
* `POST /api/iams/clients`: Create account manually or convert an inbound lead.
* `GET /api/iams/clients/:id`: Deep client overview (projects, quotas consumed, invoices, meeting minutes).
* `PUT /api/iams/clients/:id`: Update retainers, tax information, or assigned AM.
* `POST /api/iams/clients/:id/meetings`: Log meeting minutes with action items.
* `POST /api/iams/clients/:id/quota-consume`: Increment consumed count for monthly reels/posts/dev hours.
* `POST /api/iams/clients/convert-lead/:leadId`: **Automated lead pipeline conversion** ingesting data from `Lead.js` or `CalendarSlot.js`.

#### 5.3 Projects & Deliverables (`/api/iams/projects`)
* `GET /api/iams/projects`: List active projects filtered by category, client, or specialist.
* `POST /api/iams/projects`: Create project under a client with budget and milestones.
* `POST /api/iams/projects/:id/change-request`: Log an out-of-scope Change Request (CR) with additional fees.

#### 5.4 Tasks, Deliverables & Kanban (`/api/iams/tasks`)
* `GET /api/iams/tasks/board/:projectId`: 5-column Kanban board vector.
* `POST /api/iams/tasks`: Create deliverable task.
* `PATCH /api/iams/tasks/:id/status`: Drag-and-drop state transitions (`TODO` -> `IN_PROGRESS` -> `IN_REVIEW` -> `DONE`).
* `POST /api/iams/tasks/:id/upload-version`: Specialist uploads `v1`, `v2`, or final asset link.
* `POST /api/iams/tasks/:id/client-review`: Client portal endpoint to approve or request changes with revision counter.
* `POST /api/iams/tasks/:id/log-hours`: Specialist records hours, calculating accrued labor cost.

#### 5.5 Invoicing & Tax Ledger (`/api/iams/invoices`)
* `GET /api/iams/invoices`: Invoice directory with Egyptian VAT and WHT totals.
* `POST /api/iams/invoices`: Create invoice with auto-calculated 14% VAT and net payable amount.
* `PATCH /api/iams/invoices/:id/status`: Mark invoice as `PAID` or `SENT` (dispatches [`Notification.js`](file:///c:/Users/hmanm/Downloads/ICEBERG/api/models/Notification.js) alert).
* `POST /api/iams/invoices/:id/send-email`: Send PDF/HTML invoice via `nodemailer`.
* `POST /api/iams/invoices/:id/send-whatsapp`: Trigger WhatsApp invoice reminder template with payment details.

#### 5.6 Executive Analytics, Profitability & Audit (`/api/iams/analytics`)
* `GET /api/iams/analytics/summary`:
  * Dual-Currency MRR (`USD` & `EGP`).
  * Account Profitability / Gross Margin % `((Retainer Revenue - Specialist Labor Cost) / Revenue) * 100`.
  * Specialist capacity and utilization rate.
  * Overdue collections flagged with InstaPay / Bank wire follow-ups.
* `GET /api/iams/analytics/audit-logs`: Full audit history.

---

### 6. INTEGRATION WITH EXISTING ICEBERG SUBSYSTEMS

#### 6.1 Lead-to-Client Ingestion Bridge
```javascript
router.post('/convert-lead/:leadId', verifyToken, authorizeRoles('SUPER_ADMIN', 'ACCOUNT_MANAGER'), async (req, res) => {
  const lead = await Lead.findOne({ lead_id: req.params.leadId }) || await Lead.findById(req.params.leadId);
  if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });

  const newClient = new Client({
    company_name: lead.company || lead.name,
    contact_person: {
      name: lead.contact_name || lead.name,
      email: lead.email,
      phone: lead.phone,
      whatsapp_number: lead.phone,
      position: lead.position || ''
    },
    industry: lead.industry || 'General',
    website_url: lead.website || '',
    originating_lead_id: lead.lead_id,
    financials: {
      currency: req.body.currency || (lead.country === 'Egypt' ? 'EGP' : 'USD'),
      monthly_retainer: req.body.retainer || 0
    },
    status: 'ONBOARDING'
  });

  await newClient.save();
  lead.status = '🤝 Converted to Client';
  await lead.save();

  await Notification.create({
    type: 'leads',
    title: 'Lead Converted to Account',
    message: `${newClient.company_name} is now an active client account in IAMS.`,
    section: 'iams-clients',
    icon: 'user-check',
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
  });

  res.json({ success: true, client: newClient });
});
```

#### 6.2 Resilient Disk Backup Pattern
All invoice generation and payment logs maintain an append-only disk record at `api/iams_audit_backup.jsonl`, ensuring financial integrity during MongoDB cold starts or offline periods.

---

### 7. FRONTEND USER INTERFACE & ADMIN INTEGRATION

1. **Navigation Menu (`public/admin/index.html`):**
   * **Agency Accounts (IAMS)** section with links:
     * `Clients & Retainers` (`#iams-overview`)
     * `Sprint Kanban Board` (`#iams-kanban`)
     * `Invoices & Tax Ledger` (`#iams-billing`)
     * `Client Account Dossier` (`#iams-client-detail`)
2. **Design Tokens & Aesthetic:**
   * Midnight Canvas: `#020617` (slate-950) / `#0f172a` (slate-900)
   * Glassmorphism: `rgba(30, 41, 59, 0.5)` with `backdrop-filter: blur(10px)`
   * Accents: Cyan `#06b6d4`, Emerald `#10b981`, Amber `#f59e0b`, Crimson `#f43f5e`.

---

### 8. IMPLEMENTATION DIRECTORY STRUCTURE

```
ICEBERG/
├── api/
│   ├── index.js                           # Root Express app (mounts /api/iams routes)
│   ├── middleware/
│   │   └── auth.js                        # JWT verification, RBAC, and Magic-Link guards
│   ├── models/
│   │   ├── User.js                        # Staff, roles & specialist cost rates
│   │   ├── Client.js                      # Client accounts, quotas, tax IDs & meeting minutes
│   │   ├── AccountProject.js              # Operational deliverables & Change Requests
│   │   ├── Task.js                        # Kanban tasks, deliverable versions & revision limits
│   │   ├── Invoice.js                     # 14% Egyptian VAT, WHT, InstaPay & FX lock
│   │   ├── AuditLog.js                    # Compliance action logger
│   │   └── ICEBERG AGENCY — INTERNAL ACCOUNTS MANAGEMENT SYSTEM (IAMS).md
│   └── routes/
│       └── iams/
│           ├── index.js                   # Aggregated IAMS router entry point
│           ├── auth.js                    # Staff auth & Client Magic-Link generation
│           ├── clients.js                 # Accounts CRUD, quota tracking & lead conversion
│           ├── projects.js                # Contract project deliverables & change requests
│           ├── tasks.js                   # Kanban drag/drop, deliverable upload & client review
│           ├── invoices.js                # Tax billing, InstaPay/Bank payments & receipts
│           └── analytics.js               # Dual-currency MRR, margins & capacity
├── scripts/
│   └── seed-iams-data.js                  # Initial database seeder for IAMS accounts
└── public/
    └── admin/
        ├── index.html                     # Integrated IAMS dashboard view panels
        └── iams.js                        # Modular client-side IAMS controller
```

---

### 9. VERIFICATION & SECURITY CHECKLIST

* [x] **Database Engine:** Standardized exclusively on MongoDB / Mongoose 8.x.
* [x] **Egyptian Tax & Regional Compliance:** 14% Egyptian VAT, Withholding Tax (WHT 1%-3%), Tax ID (TIN), Commercial Registration (CR), and InstaPay/Vodafone Cash rails.
* [x] **Scope Creep Protection:** Retainer quota tracker (Reels, Posts, Dev Hours, SEO) and Change Request (CR) ticketing.
* [x] **Deliverable Versioning:** Structured client reviews (`v1`, `v2`, `Final`) with free revision limits.
* [x] **Profitability & Capacity:** Specialist hourly cost tracking for real-time account gross margin % analysis.
* [x] **Passwordless Client Portal:** Secure, time-limited cryptographic Magic Links.
* [x] **Data Pipeline:** Direct conversion of inbound IDEX/Marketing leads into formal client accounts.
* [x] **Resilience:** Fallback file logging (`api/iams_audit_backup.jsonl`) protecting financial transactions.
* [x] **Frontend Harmony:** Complete UI consistency with ICEBERG's Tailwind CSS glassmorphic aesthetic.
