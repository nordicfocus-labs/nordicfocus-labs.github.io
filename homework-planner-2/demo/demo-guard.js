/**
 * Homework Planner 2 (Nordic Glass Cockpit) — Demo Sandbox Guard
 * Isolates demo state into sessionStorage, seeds realistic homework cockpit data,
 * disables service workers, and injects Etsy conversion prompts.
 */
(function () {
  'use strict';

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register = function () {
      return Promise.resolve();
    };
  }

  const DEMO_STORE_KEY = 'homework_planner_2_data_v1';

  const origGetItem = localStorage.getItem.bind(localStorage);
  const origSetItem = localStorage.setItem.bind(localStorage);
  const origRemoveItem = localStorage.removeItem.bind(localStorage);

  localStorage.getItem = function (k) {
    if (k === DEMO_STORE_KEY) return sessionStorage.getItem(k);
    return origGetItem(k);
  };
  localStorage.setItem = function (k, v) {
    if (k === DEMO_STORE_KEY) return sessionStorage.setItem(k, v);
    return origSetItem(k, v);
  };
  localStorage.removeItem = function (k) {
    if (k === DEMO_STORE_KEY) return sessionStorage.removeItem(k);
    return origRemoveItem(k);
  };

  function relDate(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // Seed realistic homework demo data if fresh session
  if (!sessionStorage.getItem(DEMO_STORE_KEY)) {
    const today = relDate(0);
    const demoData = {
      version: 1,
      settings: { theme: 'nordic-glass', dailyCapacityMin: 90, skipWeekends: true, sound: true, onboarded: true, fog: false },
      courses: [
        { id: 'c1', name: 'AP Chemistry', color: '#2dd4bf' },
        { id: 'c2', name: 'World History', color: '#38bdf8' },
        { id: 'c3', name: 'Pre-Calculus', color: '#a78bfa' },
        { id: 'c4', name: 'AP English', color: '#f59e0b' }
      ],
      routines: [
        { id: 'r1', title: 'Chemistry Pre-Lab Questions', courseId: 'c1', weekday: 3, estMin: 30, template: 'lab' },
        { id: 'r2', title: 'Pre-Calculus Problem Set', courseId: 'c3', weekday: 1, estMin: 45, template: 'worksheet' }
      ],
      assignments: [
        {
          id: 'hw1', courseId: 'c1', routineId: '', title: 'Stoichiometry Worksheet #4', due: relDate(1), weight: 25, estMin: 45, manualMin: 0, packed: false,
          steps: [
            { id: 's1', text: 'Balance equations 1-5 first', done: true },
            { id: 's2', text: 'Solve molar mass conversions', done: false },
            { id: 's3', text: 'Double check significant figures', done: false },
            { id: 's4', text: 'Slide finished sheet into Chemistry binder', done: false }
          ],
          status: 'doing', rescue: '', createdAt: relDate(-1) + 'T16:00', completedAt: ''
        },
        {
          id: 'hw2', courseId: 'c3', routineId: '', title: 'Trigonometric Identities Practice', due: relDate(3), weight: 20, estMin: 90, manualMin: 0, packed: false,
          steps: [
            { id: 's5', text: 'Review formula sheet & 2 examples', done: false },
            { id: 's6', text: 'Work odd problems #1-15', done: false },
            { id: 's7', text: 'Flag tough proofs for tomorrow', done: false }
          ],
          status: 'todo', rescue: '', createdAt: relDate(-1) + 'T17:00', completedAt: ''
        },
        {
          id: 'hw3', courseId: 'c2', routineId: '', title: 'Industrial Revolution Timeline Notes', due: relDate(-1), weight: 15, estMin: 30, manualMin: 0, packed: false,
          steps: [
            { id: 's8', text: 'Skim 4 headings in Chapter 9', done: false },
            { id: 's9', text: 'Summarize 3 key inventions', done: false }
          ],
          status: 'todo', rescue: '', createdAt: relDate(-3) + 'T15:00', completedAt: ''
        },
        {
          id: 'hw4', courseId: 'c4', routineId: '', title: 'Rhetorical Analysis Paragraph', due: today, weight: 15, estMin: 25, manualMin: 25, packed: false,
          steps: [
            { id: 's10', text: 'Write claim & pick 2 quotes', done: true },
            { id: 's11', text: 'Export or print copy for backpack', done: true }
          ],
          status: 'done', rescue: '', createdAt: relDate(-2) + 'T16:00', completedAt: today + 'T18:10'
        }
      ],
      sprints: [
        { id: 'sp1', assignmentId: 'hw1', date: today, minutes: 15 }
      ]
    };
    sessionStorage.setItem(DEMO_STORE_KEY, JSON.stringify(demoData));
  }

  // Inject Demo Banner & Conversion Modal
  document.addEventListener('DOMContentLoaded', function () {
    const banner = document.createElement('div');
    banner.className = 'etsy-demo-banner';
    banner.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span>❄️ <strong>Live Interactive Demo:</strong> Homework Planner 2 (Nordic Glass Cockpit)</span>
      </div>
      <div>
        <a href="https://nordicfocus-labs.github.io/homework-planner-2/" target="_blank" class="etsy-demo-cta">
          ⚡ Unlock Full Lifetime App ($12.00)
        </a>
      </div>
    `;
    document.body.prepend(banner);

    const modal = document.createElement('div');
    modal.className = 'etsy-demo-modal-overlay';
    modal.id = 'etsy-demo-modal';
    modal.innerHTML = `
      <div class="etsy-demo-modal-card">
        <h3>❄️ Unlock the Full Nordic Glass Homework Cockpit</h3>
        <p>
          You are test-driving the live sandbox. Get the complete lifetime package on Etsy with instant offline PWA access, Chloe's quick-start guides, and printable evening checklists.
        </p>
        <a href="https://nordicfocus-labs.github.io/homework-planner-2/" target="_blank" class="etsy-gate-btn-buy">
          Get Instant Access on Etsy — $12.00
        </a>
        <br>
        <button type="button" class="etsy-gate-btn-close" id="btn-close-demo-modal">
          Continue Test Drive
        </button>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('btn-close-demo-modal').addEventListener('click', function () {
      modal.classList.remove('active');
    });

    setTimeout(function () {
      const btnExport = document.getElementById('btn-export-json');
      if (btnExport) {
        btnExport.addEventListener('click', function (e) {
          e.stopImmediatePropagation();
          modal.classList.add('active');
        }, true);
      }
    }, 500);
  });
})();
