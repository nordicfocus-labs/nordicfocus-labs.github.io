/**
 * ADHD Student Planner 2 (Edition 2: Nordic Glass) — Demo Sandbox Guard
 * Isolates demo state into sessionStorage, seeds realistic academic demo data,
 * disables service workers, and injects Etsy conversion prompts.
 */
(function () {
  'use strict';

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register = function () {
      return Promise.resolve();
    };
  }

  const DEMO_STORE_KEY = 'adhd_student_planner_2_data_v1';

  const origGetItem = localStorage.getItem.bind(localStorage);
  const origSetItem = localStorage.setItem.bind(localStorage);
  const origRemoveItem = localStorage.removeItem.bind(localStorage);

  localStorage.getItem = function (k) {
    if (k === DEMO_STORE_KEY || k === 'adhd_student_2_tour_seen') {
      return sessionStorage.getItem(k);
    }
    return origGetItem(k);
  };

  localStorage.setItem = function (k, v) {
    if (k === DEMO_STORE_KEY || k === 'adhd_student_2_tour_seen') {
      return sessionStorage.setItem(k, v);
    }
    return origSetItem(k, v);
  };

  localStorage.removeItem = function (k) {
    if (k === DEMO_STORE_KEY || k === 'adhd_student_2_tour_seen') {
      return sessionStorage.removeItem(k);
    }
    return origRemoveItem(k);
  };

  document.addEventListener('DOMContentLoaded', function () {
    const banner = document.createElement('div');
    banner.className = 'etsy-demo-banner';
    banner.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span>🚀 <strong>Live Interactive Demo:</strong> ADHD Student Planner 2 (Nordic Glass Cockpit)</span>
      </div>
      <div>
        <a href="https://nordicfocus-labs.github.io/adhd-student-planner-2/" target="_blank" class="etsy-demo-cta">
          ⚡ Unlock Lifetime Cockpit ($9.00)
        </a>
      </div>
    `;
    document.body.prepend(banner);

    const modal = document.createElement('div');
    modal.className = 'etsy-demo-modal-overlay';
    modal.id = 'etsy-demo-modal';
    modal.innerHTML = `
      <div class="etsy-demo-modal-card">
        <h3>⚡ Deploy Your Personal Academic Cockpit</h3>
        <p>
          You are currently test-driving the demo sandbox. Unlock the full lifetime edition on Etsy for instant offline access across your phone, tablet, and workstation.
        </p>
        <a href="https://nordicfocus-labs.github.io/adhd-student-planner-2/" target="_blank" class="etsy-gate-btn-buy">
          Unlock Lifetime Access on Etsy — $9.00
        </a>
        <br>
        <button type="button" class="etsy-gate-btn-close" id="btn-close-demo-modal">
          Continue Sandbox Test Drive
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
