/**
 * End of Life Planner 2 — Edition 2 (Nordic Focus Systems / Chloe) Configuration
 * Brand DNA: Dark Nordic Canvas (#070f1a), Translucent Glass Surfaces, Electric Teal (#2dd4bf) & Sky (#38bdf8).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.EOLConfig = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  return {
    edition: 2,
    brand: 'Nordic Focus Systems',
    toolName: 'End of Life Planner 2',
    defaultTab: 'overview',
    tabs: ['overview', 'contacts', 'vault', 'digital', 'wishes', 'settings'],
    persona: {
      name: 'Chloe',
      initial: 'C',
      role: 'Executive Continuity Architect'
    },
    themes: [
      { id: 'nordic-glass', label: 'Nordic Glass', swatch: '#2dd4bf' },
      { id: 'arctic-slate', label: 'Arctic Slate', swatch: '#38bdf8' },
      { id: 'emerald-stealth', label: 'Emerald Stealth', swatch: '#10b981' },
      { id: 'oled-obsidian', label: 'OLED Obsidian', swatch: '#f59e0b' }
    ],
    tour: [
      {
        tabId: 'overview',
        targetId: 'hero-readiness',
        section: 'SECTION: Cockpit · Executive Readiness HUD',
        title: 'Hi, I am Chloe — Your Continuity Cockpit',
        message: 'Welcome to Nordic Focus Systems. Your split-column cockpit distills estate preparedness into one Readiness Index, 4 real-time telemetry tiles, and a single prioritized micro-action.',
        hint: 'Tap Next to test the rapid-intake command bar.'
      },
      {
        tabId: 'overview',
        targetId: 'quick-capture-card',
        section: 'SECTION: Cockpit · 10-Second Command Intake',
        title: 'Rapid Vault Capture',
        message: 'Capture a document location, executor contact, bank account, or digital asset in seconds without breaking focus. Type 3 characters or tap Next.',
        hint: 'Action gate: Type at least 3 characters in the intake field (or tap Next).',
        gate: { type: 'dom', event: 'input', selector: '#qa-title', test: 'value-min-3' }
      },
      {
        tabId: 'overview',
        targetId: 'btn-toggle-fog',
        section: 'SECTION: Rail · Burnout Shield',
        title: 'Activate Burnout Shield Anytime',
        message: 'Heavy topic? Toggle Burnout Shield to suppress all secondary modules and isolate only your Readiness Index and single next step.',
        hint: 'Action gate: Tap Burnout Shield to test focus isolation (or tap Next).',
        gate: { type: 'app', name: 'fog-toggled' }
      },
      {
        tabId: 'contacts',
        targetId: 'contacts-firstcall-card',
        section: 'SECTION: Circle · First-Call Directory',
        title: 'Structured Emergency Circle',
        message: 'Designate your Executor, Estate Attorney, Physician, and Dependent/Pet Caregivers with instant role filters and automatic link cleanup on removal.',
        hint: 'Tap Next to inspect the Legal & Estate Vault.'
      },
      {
        tabId: 'vault',
        targetId: 'vault-docs-card',
        section: 'SECTION: Assets · Legal Document Matrix',
        title: 'Track Every Physical & Digital Location',
        message: 'Tap any status pill to advance documents through Missing, Drafting, Located, and Signed & Stored. Remember: this maps your real signed legal papers.',
        hint: 'Action gate: Tap a document status badge to cycle its state (or tap Next).',
        gate: { type: 'app', name: 'doc-toggled' }
      },
      {
        tabId: 'vault',
        targetId: 'vault-estate-card',
        section: 'SECTION: Assets · Net Estate Telemetry',
        title: 'Zero-Float Integer-Cent Net Estate',
        message: 'Assets plus Life Insurance minus Debts calculate in exact integer cents with anti-double-counting sync. Always store last-4 digits only.',
        hint: 'Tap Next to open Digital Access Keys.'
      },
      {
        tabId: 'digital',
        targetId: 'digital-manager-card',
        section: 'SECTION: Access · Master Vault Pointer',
        title: 'Security-First Digital Continuity',
        message: 'Reference your Password Manager and sealed recovery kit location — zero plain-text passwords — and tag every online platform to Transfer, Memorialize, or Delete.',
        hint: 'Tap Next to review the 3-Phase Executor Kanban.'
      },
      {
        tabId: 'wishes',
        targetId: 'executor-checklist-card',
        section: 'SECTION: Wishes · 3-Phase Executor Kanban',
        title: 'Kanban Executor Timeline',
        message: 'Your executor gets a clear 3-column operational roadmap: First 24–48 Hours, First Week, and First Month+, right below your service wishes and legacy letters.',
        hint: 'Action gate: Check off any executor task (or tap Next).',
        gate: { type: 'app', name: 'checklist-toggled' }
      },
      {
        tabId: 'settings',
        targetId: 'packet-export-card',
        section: 'SECTION: Packet · Sovereign Offline Export',
        title: 'Print Your Executor Brief & Go Clean Slate',
        message: 'Zero telemetry, zero cloud servers. Print a clean Executor Emergency Brief or export a JSON snapshot anytime. Completing this tour automatically resets sample data to a fresh Clean Slate.',
        hint: 'Tap Done to initialize your private Nordic Vault.'
      }
    ]
  };
});
