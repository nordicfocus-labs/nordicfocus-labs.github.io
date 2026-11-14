/**
 * Assignment Tracker — Edition 2 (Nordic Glass / Chloe) configuration.
 * Same engine and storage as Edition 1; different navigation, layout and exclusive screens.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ATConfig = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  return {
    edition: 2,
    storageKey: 'assignment_tracker_2_data_v1',
    persona: { name: 'Chloe', initial: 'C' },
    themes: [
      { id: 'nordic-glass', label: 'Nordic Glass' },
      { id: 'aurora', label: 'Aurora' },
      { id: 'midnight-ink', label: 'Midnight Ink' },
      { id: 'high-contrast', label: 'High Contrast' }
    ],
    defaultTab: 'today',
    tabs: ['today', 'radar', 'capacity', 'courses', 'rescue', 'settings'],
    tour: [
      {
        tabId: 'today', section: 'Cockpit · Do This Next', targetId: 'hero-next',
        title: "I'm Chloe. Here is your cockpit.",
        message: 'One assignment owns the main panel: the one that needs you next. Everything else is secondary and sits to the side.',
        hint: 'The ranking updates automatically as deadlines move.'
      },
      {
        tabId: 'today', section: 'Cockpit · Command bar', targetId: 'qa-title',
        title: 'Capture in one line',
        message: 'Type the assignment name. Three letters is enough. Defaults handle the rest and you can refine later.',
        hint: 'Type a name to continue.',
        gate: { type: 'dom', event: 'input', selector: '#qa-title', test: 'value-min-3' }
      },
      {
        tabId: 'today', section: 'Cockpit · Command bar', targetId: 'btn-qa-add',
        title: 'Commit it',
        message: 'Choose a due chip and time guess, then add it. Pressing Enter in the field works too.',
        hint: 'Tap Add it.',
        gate: { type: 'app', name: 'assignment-added' }
      },
      {
        tabId: 'today', section: 'Cockpit · Start-By', targetId: 'hero-next',
        title: 'Start-By is the real deadline',
        message: 'We take your time guess, your fudge factor and your daily capacity, then work backwards. Start-By tells you when to begin, not when to panic.',
        hint: 'Find the Start-by line on the main panel.'
      },
      {
        tabId: 'today', section: 'Rail · Fog Mode', targetId: 'btn-toggle-fog',
        title: 'Fog Mode cuts the noise',
        message: 'On a low-energy day, Fog Mode leaves only the main panel. Nothing is deleted.',
        hint: 'Toggle it on, then off again.',
        gate: { type: 'app', name: 'fog-toggled' }
      },
      {
        tabId: 'radar', section: 'Radar · Lanes', targetId: 'radar-board',
        title: 'The Radar board',
        message: 'Slipped, Today, This week, Later. Tap a card to open its steps or finish it.',
        hint: 'Open a card, then close it to continue.',
        gate: { type: 'app', name: 'modal-closed' }
      },
      {
        tabId: 'capacity', section: 'Capacity · Heatmap', targetId: 'capacity-grid',
        title: 'See overload before it happens',
        message: 'Each day shows the minutes of work scheduled against your capacity. Red days mean the plan is unrealistic, so move a due date or split the work.',
        hint: 'Darker cells are heavier days.'
      },
      {
        tabId: 'rescue', section: 'Triage Desk', targetId: 'rescue-list',
        title: 'Triage, one item at a time',
        message: 'Behind on something? The desk shows one slipped item at a time with three kind moves: do it now, ask for an extension, or let it go.',
        hint: 'You can skip an item and come back to it.'
      },
      {
        tabId: 'settings', section: 'Settings · Capacity', targetId: 'set-capacity',
        title: 'Set an honest capacity',
        message: 'Real minutes of study on a normal day. Honest numbers make every Start-By date trustworthy.',
        hint: 'Change it any time your schedule changes.'
      },
      {
        tabId: 'today', section: 'Cockpit · Focus sprint', targetId: 'hero-next',
        title: 'Launch your first sprint',
        message: 'Use a sprint button on the main panel. I log the minutes when it ends so your future estimates get sharper.',
        hint: 'Tap Done to start your semester well.'
      }
    ]
  };
});
