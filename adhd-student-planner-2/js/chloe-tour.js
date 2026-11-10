/**
 * ADHD Student Planner 2 — Chloe's Executive Onboarding Tour Engine
 * Persona: Chloe (Nordic Focus Systems) — Sharp, modern, executive momentum.
 * Implements Rule-01 (DOM spotlights & beacons) and Rule-02 (Crash-proof self-healing display).
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ChloeTour = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  let currentStep = 0;
  let isActive = false;
  let activeSpotlightElement = null;

  const TOUR_STEPS = [
    {
      targetId: 'cockpit-focus-hero',
      title: 'Chloe here. Welcome to Your Command Center.',
      message: 'Syllabus overwhelm destroys focus. This Flight Radar isolates your single highest-yield micro-step right now.',
      actionHint: 'Notice the immediate micro-step and time allocation.',
      beaconPosition: 'top-right'
    },
    {
      targetId: 'telemetry-grid',
      title: '4-Tile Telemetry Grid',
      message: 'Real-time academic diagnostics: Projected GPA, Active Deadlines, Cognitive Spoons, and Flow Sprints at a single glance.',
      actionHint: 'Track your vital academic metrics with zero calculation lag.',
      beaconPosition: 'top-left'
    },
    {
      targetId: 'btn-fog-cockpit',
      title: 'Burnout Shield (Fog Mode)',
      message: 'Under heavy cognitive load? Toggle this shield to purge all non-essential future tasks and reveal only today’s critical milestone.',
      actionHint: 'Toggle Burnout Shield anytime to cut sensory noise.',
      beaconPosition: 'top-right'
    },
    {
      targetId: 'screen-courses',
      title: 'Course Grade & GPA Engine',
      message: 'Automated weighted algorithms track midterms, labs, and assignments with zero spreadsheet formula corruption.',
      actionHint: 'View enrolled courses and letter grade targets.',
      beaconPosition: 'top-right'
    },
    {
      targetId: 'btn-sprint-toggle',
      title: 'High-Tempo Flow Sprints',
      message: 'Lock in for 20 minutes. If distractions happen, Grace Shields automatically preserve your streak.',
      actionHint: 'Tap Done to engage your executive semester workflow!',
      beaconPosition: 'bottom-right'
    }
  ];

  function getTourElements() {
    return {
      overlay: document.getElementById('tutorial-overlay'),
      card: document.getElementById('tutorial-card'),
      title: document.getElementById('tutorial-title'),
      message: document.getElementById('tutorial-message'),
      hint: document.getElementById('tutorial-hint'),
      stepCount: document.getElementById('tutorial-step-count'),
      btnNext: document.getElementById('tutorial-btn-next'),
      btnPrev: document.getElementById('tutorial-btn-prev'),
      btnSkip: document.getElementById('tutorial-btn-skip')
    };
  }

  function clearSpotlight() {
    if (activeSpotlightElement) {
      activeSpotlightElement.classList.remove('chloe-target-active');
      activeSpotlightElement = null;
    }
    const beacons = document.querySelectorAll('.chloe-beacon');
    beacons.forEach(b => b.remove());
  }

  function renderStep(index) {
    const els = getTourElements();
    if (!els.overlay || !els.card) return;

    if (index < 0 || index >= TOUR_STEPS.length) {
      endTour();
      return;
    }

    currentStep = index;
    const step = TOUR_STEPS[currentStep];

    // Explicit self-healing display reset (RULE-02)
    els.overlay.style.display = 'block';
    els.card.style.display = 'flex';
    els.card.style.opacity = '1';

    clearSpotlight();

    const targetEl = document.getElementById(step.targetId);
    if (targetEl) {
      activeSpotlightElement = targetEl;
      targetEl.classList.add('chloe-target-active');
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

      const beacon = document.createElement('div');
      beacon.className = `chloe-beacon beacon-${step.beaconPosition || 'top-right'}`;
      beacon.innerHTML = '<span class="beacon-ring-cyan"></span><span class="beacon-dot-cyan"></span>';
      targetEl.style.position = targetEl.style.position || 'relative';
      targetEl.appendChild(beacon);
    }

    els.title.textContent = step.title;
    els.message.textContent = step.message;
    els.hint.textContent = step.actionHint;
    els.stepCount.textContent = `Step ${currentStep + 1} of ${TOUR_STEPS.length}`;

    els.btnPrev.style.display = currentStep === 0 ? 'none' : 'inline-block';
    els.btnNext.textContent = currentStep === TOUR_STEPS.length - 1 ? 'Engage Cockpit 🚀' : 'Next Step →';

    positionGuideCard(targetEl, els.card);
  }

  function positionGuideCard(targetEl, card) {
    if (!card) return;
    if (!targetEl) {
      card.style.top = '50%';
      card.style.left = '50%';
      card.style.transform = 'translate(-50%, -50%)';
      return;
    }

    const rect = targetEl.getBoundingClientRect();
    const isMobile = window.innerWidth <= 640;

    if (isMobile) {
      card.style.top = 'auto';
      card.style.bottom = '20px';
      card.style.left = '50%';
      card.style.transform = 'translateX(-50%)';
      card.style.width = 'calc(100% - 32px)';
    } else {
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow > 260) {
        card.style.top = `${rect.bottom + 16}px`;
        card.style.bottom = 'auto';
        card.style.left = `${Math.max(16, Math.min(rect.left, window.innerWidth - 420))}px`;
        card.style.transform = 'none';
      } else {
        card.style.bottom = `${window.innerHeight - rect.top + 16}px`;
        card.style.top = 'auto';
        card.style.left = `${Math.max(16, Math.min(rect.left, window.innerWidth - 420))}px`;
        card.style.transform = 'none';
      }
      card.style.width = '390px';
    }
  }

  function startTour(force) {
    const hasSeen = localStorage.getItem('adhd_student_2_tour_seen');
    if (hasSeen && !force) return;

    isActive = true;
    currentStep = 0;
    renderStep(0);
  }

  function nextStep() {
    if (!isActive) return;
    if (currentStep < TOUR_STEPS.length - 1) {
      renderStep(currentStep + 1);
    } else {
      endTour();
    }
  }

  function prevStep() {
    if (!isActive) return;
    if (currentStep > 0) {
      renderStep(currentStep - 1);
    }
  }

  function endTour() {
    isActive = false;
    clearSpotlight();
    const els = getTourElements();
    if (els.overlay) els.overlay.style.display = 'none';
    if (els.card) els.card.style.display = 'none';
    localStorage.setItem('adhd_student_2_tour_seen', 'true');
  }

  function initTourHandlers() {
    const els = getTourElements();
    if (!els.card) return;

    if (els.btnNext) {
      els.btnNext.addEventListener('click', function (e) {
        e.stopPropagation();
        nextStep();
      });
    }

    if (els.btnPrev) {
      els.btnPrev.addEventListener('click', function (e) {
        e.stopPropagation();
        prevStep();
      });
    }

    if (els.btnSkip) {
      els.btnSkip.addEventListener('click', function (e) {
        e.stopPropagation();
        endTour();
      });
    }

    window.addEventListener('resize', function () {
      if (isActive && activeSpotlightElement && els.card) {
        positionGuideCard(activeSpotlightElement, els.card);
      }
    });

    if (els.overlay) {
      els.overlay.addEventListener('click', function (e) {
        if (e.target === els.overlay) {
          nextStep();
        }
      });
    }
  }

  return {
    startTour: startTour,
    nextStep: nextStep,
    prevStep: prevStep,
    endTour: endTour,
    initTourHandlers: initTourHandlers,
    isActive: function () { return isActive; },
    getCurrentStep: function () { return currentStep; }
  };
});
