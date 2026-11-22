/**
 * Invoice Planner 2 — Edition 2 (Nordic Focus Systems / Chloe) Configuration.
 * Persona: Chloe (C), Dark Nordic Glass (#070f1a), 6 symmetric tabs, and 8-step interactive tour.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.IPConfig = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  return {
    edition: 2,
    storageKey: 'invoice_planner_2_data_v1',
    persona: { name: 'Chloe', initial: 'C' },
    themes: [
      { id: 'nordic-glass', label: 'Nordic Glass' },
      { id: 'emerald-matrix', label: 'Emerald Matrix' },
      { id: 'arctic-slate', label: 'Arctic Slate' },
      { id: 'oled-stealth', label: 'OLED Stealth' }
    ],
    defaultTab: 'cockpit',
    tabs: ['cockpit', 'pipeline', 'waterfall', 'dispatch', 'retainers', 'settings'],
    tour: [
      {
        tabId: 'cockpit',
        section: '📍 SECTION: Telemetry Cockpit • Revenue Velocity HUD',
        targetId: 'hero-pulse',
        title: "I'm Chloe. Welcome to your Nordic Billing Cockpit.",
        message: 'Revenue leakage happens when unbilled work, sent invoices, and tax obligations are blurred together. This HUD isolates your Active AR Pipeline, Unbilled Queue, and Net Owner Liquidity.',
        hint: 'Zero SaaS subscriptions — 100% browser-local integer-cent telemetry.'
      },
      {
        tabId: 'cockpit',
        section: '📍 SECTION: Telemetry Cockpit • Command Bar Billable Capture',
        targetId: 'qa-work-title',
        title: 'Rapid Command-Line Billable Capture',
        message: 'Log billable sprints, calls, or scope additions in under 4 seconds. Type a deliverable descriptor into the command input.',
        hint: 'Try it now: type at least 3 characters into the command bar.',
        gate: { type: 'dom', event: 'input', selector: '#qa-work-title', test: 'value-min-3' }
      },
      {
        tabId: 'cockpit',
        section: '📍 SECTION: Telemetry Cockpit • Commit Billable Item',
        targetId: 'btn-qa-work',
        title: 'Commit Work Item to Unbilled Queue',
        message: 'Select a rate preset chip or enter a custom dollar value, then click Commit Work Item. Convert queued items into formal invoices in 1 click.',
        hint: 'Click Commit Work Item (or Next) to advance.',
        gate: { type: 'app', name: 'work-logged' }
      },
      {
        tabId: 'cockpit',
        section: '📍 SECTION: Rail Controls • Burnout Shield',
        targetId: 'btn-toggle-fog',
        title: 'Cognitive Overload? Engage Burnout Shield.',
        message: 'Burnout Shield collapses all secondary matrices, heatmaps, and tables — leaving only your Revenue Velocity HUD and single Priority Billing Vector.',
        hint: 'Toggle Burnout Shield now.',
        gate: { type: 'app', name: 'fog-toggled' }
      },
      {
        tabId: 'pipeline',
        section: '📍 SECTION: AR Kanban • 4-Lane Accounts Receivable Matrix',
        targetId: 'invoices-card',
        title: '4-Lane Accounts Receivable Kanban Matrix',
        message: 'Our 4-lane Kanban isolates Drafts, Active Net-Terms, Overdue Action Required, and Settled Invoices — with automatic Friday Early weekend shift and printable client sheets.',
        hint: 'Click Preview on any card to render a client-ready invoice sheet.'
      },
      {
        tabId: 'waterfall',
        section: '📍 SECTION: Payout Waterfall • 4-Vector Tax & Profit Split',
        targetId: 'payout-card',
        title: 'Automated Payout Tax Waterfall Splitter',
        message: 'When an invoice settles, route capital across 4 deterministic vectors: Tax Shield Vault (25%), Business Ops (15%), Runway Buffer (10%), and Owner Take-Home Pay (50%).',
        hint: 'Click Execute Payout Waterfall to test an allocation.',
        gate: { type: 'app', name: 'payout-applied' }
      },
      {
        tabId: 'dispatch',
        section: '📍 SECTION: Nudge Desk • Automated Follow-Up Scripts',
        targetId: 'followup-card',
        title: 'Executive Overdue Dispatch & Triage Desk',
        message: 'Eliminate follow-up friction. Generate pre-filled Warm Heads-Up, Gentle Overdue Nudge, or Firm Past-Due dispatches ready to copy in 1 click.',
        hint: 'Copy any client dispatch to your clipboard instantly.'
      },
      {
        tabId: 'retainers',
        section: '📍 SECTION: Retainer Nodes • Recurring Revenue & Balance Sync',
        targetId: 'retainers-card',
        title: 'Recurring Retainer Nodes & Anti-Double-Counting Sync',
        message: 'Manage recurring retainers and synchronize your business checking snapshot without double-counting. When we finish this tour, sample telemetry clears automatically to a clean slate!',
        hint: 'Click Done to enter your clean billing cockpit.'
      }
    ]
  };
});
