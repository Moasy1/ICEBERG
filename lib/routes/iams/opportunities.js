const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Opportunity = require('../../models/Opportunity');
const Client = require('../../models/Client');
const { verifyToken, authorizeRoles } = require('../../middleware/auth');
const { logAudit, logUserEvent } = require('../../utils/audit');

router.use(verifyToken);
// Standard CRUD allowed for CEO, CreativeDirector, MarketingManager
router.use(authorizeRoles('CEO', 'CreativeDirector', 'MarketingManager'));

/**
 * GET /api/iams/opportunities
 * Query and filter opportunities
 */
router.get('/', async (req, res) => {
  try {
    const { stage, owner, source, min_value, max_value, search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (stage) query.stage = stage;
    if (owner) query.$or = [{ owner_email: owner }, { owner_id: owner }];
    if (source) query.source = source;

    if (min_value || max_value) {
      query.estimated_value = {};
      if (min_value) query.estimated_value.$gte = Number(min_value);
      if (max_value) query.estimated_value.$lte = Number(max_value);
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'contact_person.company': { $regex: search, $options: 'i' } },
        { 'contact_person.name': { $regex: search, $options: 'i' } },
        { industry: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [total, opportunities] = await Promise.all([
      Opportunity.countDocuments(query),
      Opportunity.find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean()
    ]);

    res.json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      opportunities
    });
  } catch (err) {
    console.error('[IAMS Opportunities GET Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve opportunities.' });
  }
});

/**
 * GET /api/iams/opportunities/board
 * Kanban stages grouping with weighted-value sums per column
 */
router.get('/board', async (req, res) => {
  try {
    const stages = ['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];
    const board = {};
    const columnTotals = {};

    stages.forEach(s => {
      board[s] = [];
      columnTotals[s] = { count: 0, estimated_total: 0, weighted_total: 0 };
    });

    const opportunities = await Opportunity.find().sort({ expected_close_date: 1, created_at: -1 }).lean();

    opportunities.forEach(opp => {
      const st = opp.stage || 'NEW';
      if (board[st]) {
        board[st].push(opp);
        columnTotals[st].count += 1;
        columnTotals[st].estimated_total += (opp.estimated_value || 0);
        columnTotals[st].weighted_total += (opp.weighted_value || 0);
      }
    });

    res.json({
      success: true,
      board,
      column_totals: columnTotals,
      total_count: opportunities.length
    });
  } catch (err) {
    console.error('[IAMS Opportunities Board Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve opportunities board.' });
  }
});

/**
 * GET /api/iams/opportunities/stats
 * Pipeline KPIs: total value, weighted value, win rate, average days to close
 */
router.get('/stats', async (req, res) => {
  try {
    const opportunities = await Opportunity.find().lean();

    let totalEstimatedValue = 0;
    let totalWeightedValue = 0;
    let wonCount = 0;
    let closedCount = 0;
    let totalCloseDays = 0;
    let daysCount = 0;

    const stageCounts = {
      NEW: 0,
      QUALIFIED: 0,
      PROPOSAL: 0,
      NEGOTIATION: 0,
      WON: 0,
      LOST: 0
    };

    opportunities.forEach(opp => {
      const st = opp.stage || 'NEW';
      if (stageCounts[st] !== undefined) stageCounts[st]++;

      if (st !== 'LOST') {
        totalEstimatedValue += (opp.estimated_value || 0);
        totalWeightedValue += (opp.weighted_value || 0);
      }

      if (st === 'WON') {
        wonCount++;
        closedCount++;
        if (opp.actual_close_date && opp.created_at) {
          const days = Math.round((new Date(opp.actual_close_date) - new Date(opp.created_at)) / 86400000);
          if (days >= 0) {
            totalCloseDays += days;
            daysCount++;
          }
        }
      } else if (st === 'LOST') {
        closedCount++;
      }
    });

    const winRate = closedCount > 0 ? Math.round((wonCount / closedCount) * 100) : 0;
    const avgDaysToClose = daysCount > 0 ? Math.round(totalCloseDays / daysCount) : 18;

    res.json({
      success: true,
      stats: {
        total_pipeline_value: totalEstimatedValue,
        total_weighted_value: totalWeightedValue,
        win_rate_percent: winRate,
        avg_days_to_close: avgDaysToClose,
        total_opportunities: opportunities.length,
        stage_counts: stageCounts
      }
    });
  } catch (err) {
    console.error('[IAMS Opportunity Stats Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to compute opportunity statistics.' });
  }
});

/**
 * GET /api/iams/opportunities/:id
 * Single opportunity with activity feed
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const opp = await Opportunity.findOne({
      $or: [{ opportunity_id: id }, ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])]
    }).lean();

    if (!opp) {
      return res.status(404).json({ success: false, error: 'Opportunity not found.' });
    }

    res.json({ success: true, opportunity: opp });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/iams/opportunities
 * Create new opportunity
 */
router.post('/', async (req, res) => {
  try {
    const {
      name,
      source,
      source_lead_id,
      source_client_id,
      industry,
      estimated_value,
      currency = 'USD',
      probability_percent = 20,
      stage = 'NEW',
      expected_close_date,
      owner_id,
      owner_email,
      contact_person,
      notes,
      tags
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Opportunity name is required.' });
    }

    const estVal = Number(estimated_value) || 0;
    const prob = Math.min(100, Math.max(0, Number(probability_percent) || 20));
    const weightedVal = Math.round((estVal * prob) / 100);

    const opportunity = new Opportunity({
      name,
      source: source || 'INBOUND_LEAD',
      source_lead_id: source_lead_id || null,
      source_client_id: source_client_id || null,
      industry: industry || 'General',
      estimated_value: estVal,
      currency,
      probability_percent: prob,
      weighted_value: weightedVal,
      stage,
      expected_close_date: expected_close_date ? new Date(expected_close_date) : null,
      owner_id: owner_id || req.user.user_id || req.user._id,
      owner_email: owner_email || req.user.email,
      contact_person: contact_person || {},
      notes: notes || '',
      tags: tags || []
    });

    await opportunity.save();

    await logAudit({
      req,
      action: 'OPPORTUNITY_CREATED',
      entityType: 'OPPORTUNITY',
      entityId: opportunity.opportunity_id,
      severity: 'INFO',
      after: opportunity.toObject(),
      details: { name: opportunity.name, estimated_value: estVal, stage: opportunity.stage }
    });
    await logUserEvent({
      req,
      eventType: 'CREATE_OPPORTUNITY',
      entityType: 'OPPORTUNITY',
      entityId: opportunity.opportunity_id
    });

    res.status(201).json({ success: true, opportunity });
  } catch (err) {
    console.error('[IAMS Opportunity POST Error]:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to create opportunity.' });
  }
});

/**
 * PUT /api/iams/opportunities/:id
 * Update opportunity details
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = { $or: [{ opportunity_id: id }, ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])] };

    const existing = await Opportunity.findOne(query);
    if (!existing) return res.status(404).json({ success: false, error: 'Opportunity not found.' });

    const beforeState = existing.toObject();
    const updates = { ...req.body };

    // Recompute weighted_value if value or probability changed
    const estVal = updates.estimated_value !== undefined ? Number(updates.estimated_value) : existing.estimated_value;
    const prob = updates.probability_percent !== undefined ? Number(updates.probability_percent) : existing.probability_percent;
    updates.weighted_value = Math.round((estVal * prob) / 100);

    const updated = await Opportunity.findOneAndUpdate(query, { $set: updates }, { new: true }).lean();

    await logAudit({
      req,
      action: 'OPPORTUNITY_UPDATED',
      entityType: 'OPPORTUNITY',
      entityId: existing.opportunity_id,
      severity: 'INFO',
      before: beforeState,
      after: updated,
      details: { name: updated.name }
    });
    await logUserEvent({
      req,
      eventType: 'EDIT_OPPORTUNITY',
      entityType: 'OPPORTUNITY',
      entityId: existing.opportunity_id
    });

    res.json({ success: true, opportunity: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/iams/opportunities/:id/stage
 * Move stage with optional lost_reason / actual_close_date
 */
router.post('/:id/stage', async (req, res) => {
  try {
    const { id } = req.params;
    const { stage, lost_reason } = req.body;

    const validStages = ['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];
    if (!validStages.includes(stage)) {
      return res.status(400).json({ success: false, error: 'Invalid stage.' });
    }

    const query = { $or: [{ opportunity_id: id }, ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])] };
    const opp = await Opportunity.findOne(query);
    if (!opp) return res.status(404).json({ success: false, error: 'Opportunity not found.' });

    const beforeState = opp.toObject();
    const oldStage = opp.stage;
    opp.stage = stage;

    if (stage === 'WON' && !opp.actual_close_date) {
      opp.actual_close_date = new Date();
      opp.probability_percent = 100;
      opp.weighted_value = opp.estimated_value;
    } else if (stage === 'LOST') {
      opp.lost_reason = lost_reason || opp.lost_reason || 'Lost to competitor / budget';
      opp.probability_percent = 0;
      opp.weighted_value = 0;
    }

    await opp.save();
    const afterState = opp.toObject();

    await logAudit({
      req,
      action: 'OPPORTUNITY_STAGE_CHANGED',
      entityType: 'OPPORTUNITY',
      entityId: opp.opportunity_id,
      severity: stage === 'WON' ? 'INFO' : (stage === 'LOST' ? 'WARN' : 'INFO'),
      before: beforeState,
      after: afterState,
      details: { oldStage, newStage: stage, name: opp.name }
    });
    await logUserEvent({
      req,
      eventType: 'MOVE_OPPORTUNITY_STAGE',
      entityType: 'OPPORTUNITY',
      entityId: opp.opportunity_id,
      metadata: { oldStage, newStage: stage }
    });

    res.json({ success: true, opportunity: opp });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/iams/opportunities/:id/activities
 * Add an activity to the opportunity
 */
router.post('/:id/activities', async (req, res) => {
  try {
    const { id } = req.params;
    const { type = 'NOTE', summary, due_date } = req.body;

    if (!summary) {
      return res.status(400).json({ success: false, error: 'Activity summary is required.' });
    }

    const query = { $or: [{ opportunity_id: id }, ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])] };
    const opp = await Opportunity.findOne(query);
    if (!opp) return res.status(404).json({ success: false, error: 'Opportunity not found.' });

    const activity = {
      activity_id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type,
      summary,
      due_date: due_date ? new Date(due_date) : null,
      created_by: req.user.email || 'system',
      created_at: new Date()
    };

    opp.activities.push(activity);
    opp.next_action = { summary, due_date: activity.due_date };
    await opp.save();

    await logAudit({
      req,
      action: 'OPPORTUNITY_ACTIVITY_ADDED',
      entityType: 'OPPORTUNITY',
      entityId: opp.opportunity_id,
      severity: 'INFO',
      details: { activity_id: activity.activity_id, type, summary }
    });

    res.status(201).json({ success: true, activity, opportunity: opp });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/iams/opportunities/:id/activities/:activity_id
 * Complete an activity
 */
router.patch('/:id/activities/:activity_id', async (req, res) => {
  try {
    const { id, activity_id } = req.params;
    const query = { $or: [{ opportunity_id: id }, ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])] };
    const opp = await Opportunity.findOne(query);
    if (!opp) return res.status(404).json({ success: false, error: 'Opportunity not found.' });

    const act = opp.activities.find(a => a.activity_id === activity_id);
    if (!act) return res.status(404).json({ success: false, error: 'Activity not found.' });

    act.completed_at = new Date();
    await opp.save();

    res.json({ success: true, activity: act, opportunity: opp });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/iams/opportunities/:id/convert
 * Convert WON Opportunity to Client (CEO only)
 */
router.post('/:id/convert', authorizeRoles('CEO'), async (req, res) => {
  try {
    const { id } = req.params;
    const query = { $or: [{ opportunity_id: id }, ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])] };
    const opp = await Opportunity.findOne(query);

    if (!opp) return res.status(404).json({ success: false, error: 'Opportunity not found.' });

    // Ensure company name
    const companyName = opp.contact_person?.company || opp.name;
    const contactEmail = opp.contact_person?.email || `client_${opp.opportunity_id.toLowerCase()}@icebergma.com`;

    // Create Client account
    const newClient = new Client({
      company_name: companyName,
      contact_person: {
        name: opp.contact_person?.name || opp.name,
        email: contactEmail,
        phone: opp.contact_person?.phone || '',
        position: opp.contact_person?.position || 'Principal Client'
      },
      industry: opp.industry || 'General Business',
      status: 'ONBOARDING',
      financials: {
        currency: opp.currency || 'USD',
        monthly_retainer: opp.estimated_value || 0,
        billing_cycle: 'MONTHLY'
      },
      contract_period: {
        start_date: new Date(),
        renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    await newClient.save();

    // Link back to Opportunity and set stage to WON
    opp.source_client_id = newClient.client_id;
    opp.stage = 'WON';
    opp.probability_percent = 100;
    opp.weighted_value = opp.estimated_value;
    opp.actual_close_date = new Date();
    await opp.save();

    await logAudit({
      req,
      action: 'OPPORTUNITY_CONVERTED_TO_CLIENT',
      entityType: 'OPPORTUNITY',
      entityId: opp.opportunity_id,
      severity: 'INFO',
      details: { client_id: newClient.client_id, company_name: newClient.company_name }
    });
    await logUserEvent({
      req,
      eventType: 'CONVERT_OPPORTUNITY_TO_CLIENT',
      entityType: 'OPPORTUNITY',
      entityId: opp.opportunity_id
    });

    res.status(201).json({
      success: true,
      message: `Opportunity converted to Client ${newClient.company_name} successfully.`,
      client: newClient,
      opportunity: opp
    });
  } catch (err) {
    console.error('[IAMS Convert Opportunity Error]:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to convert opportunity.' });
  }
});

module.exports = router;
