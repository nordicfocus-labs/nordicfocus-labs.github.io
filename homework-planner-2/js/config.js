/**
 * Homework Planner — Edition 2 (Nordic Glass / Chloe) configuration.
 * Same engine and storage as Edition 1; different navigation, layout and exclusive screens.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.HPConfig = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  return {
    edition: 2,
    storageKey: 'homework_planner_2_data_v1',
    persona: { name: 'Chloe', initial: 'C' },
    themes: [
      { id: 'nordic-glass', label: 'Nordic Glass' },
      { id: 'aurora', label: 'Aurora' },
      { id: 'midnight-ink', label: 'Midnight Ink' },
      { id: 'high-contrast', label: 'High Contrast' }
    ],
    defaultTab: 'tonight',
    tabs: ['tonight', 'radar', 'capacity', 'subjects', 'rescue', 'settings'],
    tour: [
      {
        tabId: 'tonight', section: '📍 SECTION: Cockpit • Up First', targetId: 'hero-next',
        title: "I'm Chloe. Welcome to your homework cockpit.",
        message: 'One homework item commands the main panel: the one that needs you tonight. Everything else sits quietly on your side rail.',
        hint: 'Your focus priority recalculates automatically as deadlines shift.'
      },
      {
        tabId: 'tonight', section: '📍 SECTION: Cockpit • Command Bar', targetId: 'qa-title',
        title: 'Capture in one line',
        message: 'Type the homework name right after class. Three letters is enough — smart defaults fill in the rest.',
        hint: 'Try typing a homework title now.',
        gate: { type: 'dom', event: 'input', selector: '#qa-title', test: 'value-min-3' }
      },
      {
        tabId: 'tonight', section: '📍 SECTION: Cockpit • Command Bar', targetId: 'btn-qa-add',
        title: 'Lock it in',
        message: 'Pick a due chip and time guess, then tap Add it. Pressing Enter in the input works too.',
        hint: 'Tap Add it to continue.',
        gate: { type: 'app', name: 'assignment-added' }
      },
      {
        tabId: 'tonight', section: '📍 SECTION: Cockpit • Start-By', targetId: 'hero-next',
        title: 'Start-By beats Due Date',
        message: 'We combine your time estimate, personal fudge factor, and evening capacity, then count backward so you begin calmly.',
        hint: 'Spot the Start-by line on your main focus panel.'
      },
      {
        tabId: 'tonight', section: '📍 SECTION: Rail • Fog Mode', targetId: 'btn-toggle-fog',
        title: 'Fog Mode clears visual clutter',
        message: 'Low energy after school? Fog Mode hides the side panels and leaves only your primary homework target.',
        hint: 'Toggle Fog Mode on, then off again.',
        gate: { type: 'app', name: 'fog-toggled' }
      },
      {
        tabId: 'radar', section: '📍 SECTION: Radar • 4 Kanban Lanes', targetId: 'radar-board',
        title: 'Your 4-Lane Homework Radar',
        message: 'Slipped, Today, This week, and Later lanes ordered by Start-By priority. Tap any card to view its 2-minute steps.',
        hint: 'Open a card and close it to move to the next step.',
        gate: { type: 'app', name: 'modal-closed' }
      },
      {
        tabId: 'capacity', section: '📍 SECTION: Capacity • 14-Day Heatmap', targetId: 'capacity-grid',
        title: 'Spot evening overload early',
        message: 'Each tile maps scheduled homework minutes against your daily evening budget. Flagged heavy days let you start early before crunch time.',
        hint: 'Darker or warm tiles show heavier evenings.'
      },
      {
        tabId: 'subjects', section: '📍 SECTION: Subjects • Weekly Routines', targetId: 'routine-card',
        title: 'Automate recurring weekly sheets',
        message: 'Save repeating homework once by weekday and populate the entire week in one click with zero duplicates.',
        hint: 'Add your classes and repeating homework here.'
      },
      {
        tabId: 'rescue', section: '📍 SECTION: Triage Desk • 1-at-a-Time', targetId: 'rescue-list',
        title: 'Catch-Up Triage, one item at a time',
        message: 'Behind on a sheet? The desk focuses on one slipped item at a time: Do tonight, Ask extension, Use late pass, or Skip for now.',
        hint: 'Zero red shame counters — only calm choices.'
      },
      {
        tabId: 'settings', section: '📍 SECTION: Settings • Evening Budget', targetId: 'set-capacity',
        title: 'Set an honest evening budget',
        message: 'Choose how many real homework minutes fit into a normal school night. Realistic budgets make Start-By dates trustworthy.',
        hint: 'Tap Done to launch your cockpit.'
      }
    ]
  };
});
