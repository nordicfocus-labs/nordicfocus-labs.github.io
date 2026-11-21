/**
 * ADHD Finance Planner 2 — Edition 2 (Nordic Focus Systems / Chloe) Configuration.
 * Persona: Chloe (C), Dark Nordic Glass (#070f1a), 6 symmetric tabs, and 8-step interactive tour.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.FPConfig = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  return {
    edition: 2,
    storageKey: 'adhd_finance_planner_2_data_v1',
    persona: { name: 'Chloe', initial: 'C' },
    themes: [
      { id: 'nordic-glass', label: 'Nordic Glass' },
      { id: 'emerald-matrix', label: 'Emerald Matrix' },
      { id: 'arctic-slate', label: 'Arctic Slate' },
      { id: 'oled-stealth', label: 'OLED Stealth' }
    ],
    defaultTab: 'cockpit',
    tabs: ['cockpit', 'waterfall', 'burnrate', 'reserves', 'networth', 'settings'],
    tour: [
      {
        tabId: 'cockpit',
        section: '📍 SECTION: Telemetry Cockpit • Discretionary Velocity Pool',
        targetId: 'hero-pulse',
        title: "I'm Chloe. Welcome to your Nordic Finance Cockpit.",
        message: 'Raw bank balances create executive dysfunction because fixed obligations are mixed with daily discretionary capital. This HUD isolates your Safe Discretionary Pool after deducting upcoming bills, capital reserves, and an Oops shield.',
        hint: 'Zero bank logins — 100% browser-local integer-cent telemetry.'
      },
      {
        tabId: 'cockpit',
        section: '📍 SECTION: Telemetry Cockpit • Command Bar Spend Log',
        targetId: 'qa-spend-title',
        title: 'Rapid Command-Line Expense Capture',
        message: 'Log discretionary outflows in under 4 seconds. Type a descriptor into the command input.',
        hint: 'Try it now: type at least 3 characters into the command bar.',
        gate: { type: 'dom', event: 'input', selector: '#qa-spend-title', test: 'value-min-3' }
      },
      {
        tabId: 'cockpit',
        section: '📍 SECTION: Telemetry Cockpit • Execute Log',
        targetId: 'btn-qa-spend',
        title: 'Commit Outflow to Telemetry',
        message: 'Select a velocity preset chip or enter a custom dollar value, then click Commit Spend.',
        hint: 'Click Commit Spend (or Next) to advance.',
        gate: { type: 'app', name: 'spend-logged' }
      },
      {
        tabId: 'cockpit',
        section: '📍 SECTION: Rail Controls • Burnout Shield',
        targetId: 'btn-toggle-fog',
        title: 'Cognitive Overload? Engage Burnout Shield.',
        message: 'Burnout Shield collapses all secondary matrices, heatmaps, and tables — leaving only your Discretionary Velocity HUD and single Priority Vector.',
        hint: 'Toggle Burnout Shield now.',
        gate: { type: 'app', name: 'fog-toggled' }
      },
      {
        tabId: 'waterfall',
        section: '📍 SECTION: Paycheck Waterfall • 4-Vector Allocation',
        targetId: 'autopilot-card',
        title: 'Automated Paycheck Waterfall Splitter',
        message: 'When capital arrives, pick an allocation vector (Balanced 50/20/10/20 or Tax Shield 45/25/15/15). Every cent is deterministically routed across Fixed Obligations, Capital Reserves, Liquidity Buffer, and Discretionary Pool.',
        hint: 'Click Execute Waterfall Split to test an allocation.',
        gate: { type: 'app', name: 'autopilot-applied' }
      },
      {
        tabId: 'burnrate',
        section: '📍 SECTION: Burn Matrix • 4-Lane Subscription Kanban',
        targetId: 'radar-trophy-card',
        title: 'Subscription Burn Matrix & ADHD Tax Reclaimed',
        message: 'Our 4-lane Kanban isolates Trial Warnings, 7-Day Renewals, Active Recurring Drains, and Terminated Drains. Killing a zombie subscription immediately credits your Annual Reclaimed Capital counter.',
        hint: 'Never lose money to an unmonitored free trial again.'
      },
      {
        tabId: 'reserves',
        section: '📍 SECTION: Capital Reserves • True Expense Sinking Funds',
        targetId: 'buckets-card',
        title: 'Protected Sinking Reserve Modules',
        message: 'Amortize lumpy annual obligations (vehicle maintenance, hardware upgrades, annual renewals) into predictable per-paycheck holds.',
        hint: 'Use +$25 / +$100 quick injects to scale reserve progress.'
      },
      {
        tabId: 'networth',
        section: '📍 SECTION: Balance Sheet • Net Worth & Runway',
        targetId: 'wealth-summary-card',
        title: 'Sovereign Balance Sheet & Survival Runway',
        message: 'Track liquid checking, high-yield buffers, reserve modules, and liabilities with anti-double-counting balance synchronization.',
        hint: 'When we finish this tour, sample telemetry clears automatically to a clean slate!'
      }
    ]
  };
});
