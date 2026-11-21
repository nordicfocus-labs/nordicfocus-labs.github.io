/**
 * ADHD Finance Planner 2 (Edition 2: Nordic Focus Systems / Chloe) — Demo Sandbox Guard
 * Isolates demo state into sessionStorage, seeds realistic telemetry data with onboarded: false (Rule-18),
 * disables service workers in demo mode, and gates backup export with an Etsy conversion modal.
 */
(function () {
  'use strict';

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register = function () {
      return Promise.resolve();
    };
  }

  var DEMO_STORE_KEY = 'adhd_finance_planner_2_data_v1';

  var origGetItem = localStorage.getItem.bind(localStorage);
  var origSetItem = localStorage.setItem.bind(localStorage);
  var origRemoveItem = localStorage.removeItem.bind(localStorage);

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
    var d = new Date();
    d.setDate(d.getDate() + offsetDays);
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  if (!sessionStorage.getItem(DEMO_STORE_KEY)) {
    var today = relDate(0);
    var demoData = {
      version: 1,
      settings: {
        theme: 'nordic-glass',
        currency: 'USD',
        splitPreset: 'balanced',
        nextPayday: relDate(10),
        defaultPaycheckCents: 240000,
        monthlySurvivalCents: 220000,
        oopsBufferCents: 5000,
        sound: true,
        onboarded: false,
        fog: false,
        isSampleSeed: true,
        seqCounter: 10
      },
      accounts: [
        { id: 'acct_main', name: 'Primary Operating Checking', type: 'checking', balanceCents: 185000, balanceAsOf: today, updatedSeq: 2, isSample: true },
        { id: 'acct_save', name: 'High-Yield Liquidity Vault', type: 'savings', balanceCents: 360000, balanceAsOf: today, updatedSeq: 2, isSample: true },
        { id: 'acct_card', name: 'Sapphire Charge Line', type: 'debt', balanceCents: 38000, balanceAsOf: today, updatedSeq: 2, isSample: true }
      ],
      bills: [
        { id: 'bill_1', title: 'Studio Apartment Lease', amountCents: 95000, due: relDate(5), category: 'Housing', weekendEarly: true, autopay: true, status: 'open', paidAt: '', isSample: true },
        { id: 'bill_2', title: 'Gigabit Fiber & Power', amountCents: 11500, due: relDate(2), category: 'Utilities', weekendEarly: false, autopay: false, status: 'open', paidAt: '', isSample: true }
      ],
      subscriptions: [
        { id: 'sub_1', name: 'AI Copilot Pro (7-Day Trial)', amountCents: 2900, cycle: 'monthly', nextDate: relDate(2), leadDays: 3, isTrial: true, category: 'Software', status: 'active', cancelledAt: '', isSample: true },
        { id: 'sub_2', name: 'Cloud Render Suite', amountCents: 2499, cycle: 'monthly', nextDate: relDate(6), leadDays: 3, isTrial: false, category: 'Software', status: 'active', cancelledAt: '', isSample: true },
        { id: 'sub_3', name: 'Legacy Media Stream', amountCents: 1599, cycle: 'monthly', nextDate: relDate(12), leadDays: 3, isTrial: false, category: 'Media', status: 'cancelled', cancelledAt: today, isSample: true }
      ],
      buckets: [
        { id: 'bkt_1', name: 'Vehicle & Tire Reserve Module', targetCents: 120000, savedCents: 45000, monthlyHoldCents: 10000, autoHold: true, color: '#2dd4bf', isSample: true },
        { id: 'bkt_2', name: 'Annual SaaS & Tax Shield', targetCents: 60000, savedCents: 30000, monthlyHoldCents: 5000, autoHold: true, color: '#38bdf8', isSample: true }
      ],
      transactions: [
        { id: 'tx_1', accountId: 'acct_main', title: 'Cold Brew & Protein Bowl', amountCents: 1250, kind: 'spend', category: 'Discretionary', date: today, seq: 3, isSample: true }
      ],
      paychecks: []
    };
    sessionStorage.setItem(DEMO_STORE_KEY, JSON.stringify(demoData));
  }

  document.addEventListener('DOMContentLoaded', function () {
    var banner = document.createElement('div');
    banner.className = 'etsy-demo-banner';
    banner.innerHTML =
      '<div style="display:flex;align-items:center;gap:8px;">' +
        '<span>⚡ <strong>Live Interactive Demo:</strong> ADHD Finance Planner 2 (Nordic Glass Cockpit)</span>' +
      '</div>' +
      '<div>' +
        '<a href="https://nordicfocus-labs.github.io/adhd-finance-planner-2/" target="_blank" class="etsy-demo-cta">' +
          '⚡ Unlock Lifetime Cockpit ($9.00)' +
        '</a>' +
      '</div>';
    document.body.prepend(banner);

    var modal = document.createElement('div');
    modal.className = 'etsy-demo-modal-overlay';
    modal.id = 'etsy-demo-modal';
    modal.innerHTML =
      '<div class="etsy-demo-modal-card">' +
        '<h3>⚡ Deploy Your Sovereign Finance Cockpit</h3>' +
        '<p>You are test-driving the live demo sandbox. Get the complete lifetime edition on Etsy for permanent offline local storage, PDF handbooks, and printable telemetry worksheets.</p>' +
        '<a href="https://nordicfocus-labs.github.io/adhd-finance-planner-2/" target="_blank" class="etsy-gate-btn-buy">' +
          'Get Instant Access on Etsy — $9.00' +
        '</a>' +
        '<br>' +
        '<button type="button" class="etsy-gate-btn-close" id="btn-close-demo-modal">Continue Test Drive</button>' +
      '</div>';
    document.body.appendChild(modal);

    document.getElementById('btn-close-demo-modal').addEventListener('click', function () {
      modal.classList.remove('active');
    });

    setTimeout(function () {
      var btnExport = document.getElementById('btn-export-json');
      if (btnExport) {
        btnExport.addEventListener('click', function (e) {
          e.stopImmediatePropagation();
          modal.classList.add('active');
        }, true);
      }
    }, 500);
  });
})();
