/**
 * ADHD Student Planner 2 — Chloe's Executive Onboarding Tour Engine
 * Persona: Chloe (Nordic Focus Systems) — Sharp, modern, executive momentum.
 * Implements Rule-01 (DOM spotlights & beacons), Rule-02 (Crash-proof self-healing display),
 * and Rule-11 (Screen-Synchronized Guided Navigation & Viewport Adaptive Positioning).
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
      tabId: 'dashboard',
      sectionName: 'Flight Radar • Executive Focus Hero',
      targetId: 'cockpit-focus-hero',
      title: 'Chloe here. Welcome to Your Command Center.',
      message: 'Syllabus overwhelm destroys focus. This Flight Radar isolates your single highest-yield micro-step right now.',
      actionHint: 'Notice the immediate micro-step and time allocation.',
      beaconPosition: 'top-right'
    },
    {
      tabId: 'dashboard',
      sectionName: 'Cockpit HUD • 4-Tile Telemetry Grid',
      targetId: 'telemetry-grid',
      title: '4-Tile Telemetry Grid',
      message: 'Real-time academic diagnostics: Projected GPA, Active Deadlines, Cognitive Spoons, and Flow Sprints at a single glance.',
      actionHint: 'Track your vital academic metrics with zero calculation lag.',
      beaconPosition: 'top-left'
    },
    {
      tabId: 'dashboard',
      sectionName: 'Header • Burnout Shield (Fog Mode)',
      targetId: 'btn-fog-cockpit',
      title: 'Burnout Shield (Fog Mode)',
      message: 'Under heavy cognitive load? Toggle this shield to purge all non-essential future tasks and reveal only today’s critical milestone.',
      actionHint: 'Toggle Burnout Shield anytime to cut sensory noise.',
      beaconPosition: 'top-right'
    },
    {
      tabId: 'courses',
      sectionName: 'Curriculum • Automated Weighted Grades',
      targetId: 'grid-courses',
      title: 'Course Grade & GPA Engine',
      message: 'We are now in your Curriculum panel! Automated weighted algorithms track midterms, labs, and assignments with zero spreadsheet formula corruption.',
      actionHint: 'View enrolled courses and letter grade targets.',
      beaconPosition: 'top-right'
    },
    {
      tabId: 'dashboard',
      sectionName: 'Cockpit HUD • Flow Sprints',
      targetId: 'btn-sprint-toggle',
      title: 'High-Tempo Flow Sprints',
      message: 'Back in Flight Radar: Lock in for 20 minutes. If distractions happen, Grace Shields automatically preserve your streak.',
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
      sectionTag: document.getElementById('tutorial-section-tag'),
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

    // RULE-11: Programmatically switch active tab before rendering step!
    if (step.tabId && typeof window.switchStudentTab === 'function') {
      window.switchStudentTab(step.tabId);
    }

    // Allow browser 60ms to complete layout transition before measuring target
    setTimeout(() => {
      els.overlay.style.display = 'block';
      els.card.style.display = 'flex';
      els.card.style.opacity = '1';

      clearSpotlight();

      let targetEl = document.getElementById(step.targetId);
      if (!targetEl) {
        targetEl = document.getElementById(`screen-${step.tabId}`) || document.body;
      }

      activeSpotlightElement = targetEl;
      targetEl.classList.add('chloe-target-active');
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      const beacon = document.createElement('div');
      beacon.className = `chloe-beacon beacon-${step.beaconPosition || 'top-right'}`;
      beacon.innerHTML = '<span class="beacon-ring-cyan"></span><span class="beacon-dot-cyan"></span>';
      targetEl.style.position = targetEl.style.position || 'relative';
      targetEl.appendChild(beacon);

      if (els.sectionTag) {
        els.sectionTag.textContent = `📍 ${step.sectionName}`;
      }
      els.title.textContent = step.title;
      els.message.textContent = step.message;
      els.hint.textContent = step.actionHint;
      els.stepCount.textContent = `Step ${currentStep + 1} of ${TOUR_STEPS.length}`;

      els.btnPrev.style.display = currentStep === 0 ? 'none' : 'inline-block';
      els.btnNext.textContent = currentStep === TOUR_STEPS.length - 1 ? 'Engage Cockpit 🚀' : 'Next Step →';

      positionGuideCard(targetEl, els.card);
    }, 60);
  }

  function positionGuideCard(targetEl, card) {
    if (!card) return;
    if (!targetEl) {
      card.style.top = '50%';
      card.style.bottom = 'auto';
      card.style.left = '50%';
      card.style.transform = 'translate(-50%, -50%)';
      return;
    }

    const rect = targetEl.getBoundingClientRect();
    const isMobile = window.innerWidth <= 640;

    if (isMobile) {
      // RULE-11 Mobile Resilience: Never overlap UI or target
      const targetMidY = rect.top + (rect.height / 2);
      const screenMidY = window.innerHeight / 2;

      if (targetMidY > screenMidY) {
        // Target is in lower half -> Place card at top
        card.style.top = '16px';
        card.style.bottom = 'auto';
      } else {
        // Target is in upper half -> Place card in lower area
        card.style.top = 'auto';
        card.style.bottom = '24px';
      }

      card.style.left = '12px';
      card.style.right = '12px';
      card.style.width = 'calc(100% - 24px)';
      card.style.transform = 'none';
    } else {
      // Desktop positioning
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const cardWidth = 400;

      if (spaceBelow >= 240) {
        card.style.top = `${rect.bottom + 14}px`;
        card.style.bottom = 'auto';
      } else if (spaceAbove >= 240) {
        card.style.bottom = `${window.innerHeight - rect.top + 14}px`;
        card.style.top = 'auto';
      } else {
        card.style.top = '50%';
        card.style.bottom = 'auto';
        card.style.transform = 'translateY(-50%)';
      }

      const leftPos = Math.max(16, Math.min(rect.left, window.innerWidth - cardWidth - 20));
      card.style.left = `${leftPos}px`;
      card.style.right = 'auto';
      card.style.width = `${cardWidth}px`;
      if (!card.style.transform.includes('translateY')) {
        card.style.transform = 'none';
      }
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
    if (typeof window.switchStudentTab === 'function') {
      window.switchStudentTab('dashboard');
    }
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
