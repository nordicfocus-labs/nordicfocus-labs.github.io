/**
 * ADHD Life Planner 2 (Edition 2) - Chloe's Conversational Guided Tour System
 * Strict capture-phase UX guardrails (blocks non-tour clicks & nudges user),
 * interactive modal hand-holding, auto-typing simulation, and DOM-anchored spotlights.
 * Resilient, self-healing architecture: never freezes, restores visibility seamlessly.
 */

(function (global) {
  'use strict';

  const Chloe = {};
  let currentStepIndex = 0;
  let isTourActive = false;
  let currentTargetEl = null;

  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  function getVisibleNavTab(tabName) {
    return document.querySelector(`[data-tab="${tabName}"]`);
  }

  // ========================================================
  // 1. DOM-ANCHORED TARGET HIGHLIGHT & BEACON
  // Physically attached to the element so it never shifts on resize/scroll!
  // ========================================================
  function highlightTarget(target, badgeText = '👩‍💻 Tap here') {
    clearHighlight();
    if (!target) return null;

    const el = (typeof target === 'string') ? document.querySelector(target) : target;
    if (!el) return null;

    currentTargetEl = el;

    if (typeof el.scrollIntoView === 'function') {
      try {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch (e) {}
    }

    el.classList.add('tutorial-target-active');

    const badge = document.createElement('span');
    badge.className = 'chloe-target-badge';
    badge.id = 'chloe-target-badge';
    badge.innerHTML = `<span>${badgeText}</span>`;

    const isVoidEl = ['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName);
    const hostEl = isVoidEl ? el.parentElement : el;

    if (hostEl) {
      const computed = window.getComputedStyle(hostEl).position;
      if (computed === 'static') {
        hostEl.dataset.origPosition = 'static';
        hostEl.style.position = 'relative';
      }
      if (isVoidEl) {
        badge.style.top = '-12px';
        badge.style.right = '4px';
      }
      hostEl.appendChild(badge);
    }

    return el;
  }

  function clearHighlight() {
    if (currentTargetEl) {
      currentTargetEl.classList.remove('tutorial-target-active');
      if (currentTargetEl.dataset.origPosition === 'static') {
        currentTargetEl.style.position = '';
        delete currentTargetEl.dataset.origPosition;
      }
      const b = currentTargetEl.querySelector('#chloe-target-badge');
      if (b) b.remove();
      if (currentTargetEl.parentElement) {
        const pb = currentTargetEl.parentElement.querySelector('#chloe-target-badge');
        if (pb) pb.remove();
      }
      currentTargetEl = null;
    }

    document.querySelectorAll('.tutorial-target-active').forEach(el => {
      el.classList.remove('tutorial-target-active');
      const b = el.querySelector('#chloe-target-badge');
      if (b) b.remove();
      if (el.parentElement) {
        const pb = el.parentElement.querySelector('#chloe-target-badge');
        if (pb) pb.remove();
      }
    });
  }

  // Realistic Human Typing Animation
  async function typeIntoField(element, text, speed = 20) {
    if (!element) return;
    element.focus();
    element.value = '';
    element.classList.add('typing-active');

    return new Promise((resolve) => {
      let currentVal = '';
      let i = 0;
      const timer = setInterval(() => {
        if (i < text.length) {
          currentVal += text.charAt(i);
          element.value = currentVal;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          i++;
        } else {
          clearInterval(timer);
          element.classList.remove('typing-active');
          element.dispatchEvent(new Event('change', { bubbles: true }));
          resolve();
        }
      }, speed);
    });
  }

  // ========================================================
  // 2. MODAL-EMBEDDED GUIDE BANNER
  // ========================================================
  function showModalGuideBanner(modalSelector, { message, actionText, actionHandler }) {
    removeModalGuideBanner();
    hideGuideCard();

    const modalEl = document.querySelector(modalSelector);
    if (!modalEl) {
      showGuideCard();
      return;
    }

    const dialog = modalEl.querySelector('.modal-dialog') || modalEl;
    const banner = document.createElement('div');
    banner.className = 'chloe-modal-banner';
    banner.id = 'chloe-modal-banner';

    banner.innerHTML = `
      <div class="chloe-guide-header">
        <div class="chloe-guide-identity">
          <span class="chloe-avatar">👩‍💻</span>
          <div>
            <div class="chloe-name">Chloe • Executive Copilot</div>
            <div class="chloe-role">Step ${currentStepIndex + 1} of ${MASTER_STORY.steps.length}</div>
          </div>
        </div>
      </div>
      <div class="chloe-bubble-message">${message}</div>
      ${actionText ? `
        <div style="display:flex;justify-content:flex-end;margin-top:4px;">
          <button class="chloe-prompt-btn pulse" id="btn-modal-action">${actionText}</button>
        </div>
      ` : ''}
    `;

    const firstChild = dialog.firstElementChild;
    dialog.insertBefore(banner, firstChild);

    const actBtn = banner.querySelector('#btn-modal-action');
    if (actBtn && typeof actionHandler === 'function') {
      actBtn.addEventListener('click', async () => {
        actBtn.disabled = true;
        actBtn.classList.remove('pulse');
        await actionHandler();
      });
    }
  }

  function removeModalGuideBanner() {
    const banner = document.getElementById('chloe-modal-banner');
    if (banner) banner.remove();
    showGuideCard();
  }

  function hideGuideCard() {
    const card = document.getElementById('tutorial-guide-card');
    if (card) card.style.display = 'none';
  }

  function showGuideCard() {
    const card = document.getElementById('tutorial-guide-card');
    if (card) card.style.display = 'flex';
  }

  // ========================================================
  // 3. UX GUARDRAILS (GENTLE ADHD ENCOURAGEMENT)
  // ========================================================
  function handleTourClickGuard(e) {
    if (!isTourActive) return;
    if (!e.isTrusted) return;

    const isGuide = e.target.closest('#tutorial-guide-card');
    const isHUD = e.target.closest('#tutorial-hud-bar');
    const isModal = e.target.closest('.glass-modal') || e.target.closest('.modal-overlay') || e.target.closest('.modal-dialog');
    const isNav = e.target.closest('#capsule-nav') || e.target.closest('.capsule-tab-btn');
    const isTarget = currentTargetEl && (currentTargetEl === e.target || currentTargetEl.contains(e.target));
    const isFormElement = ['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA', 'LABEL'].includes(e.target.tagName);

    if (isGuide || isHUD || isModal || isNav || isTarget || isFormElement) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    triggerEncouragementNudge();
  }

  function triggerEncouragementNudge() {
    const card = document.getElementById('tutorial-guide-card');
    if (card && card.style.display !== 'none') {
      card.classList.remove('nudge');
      void card.offsetWidth;
      card.classList.add('nudge');

      let toast = card.querySelector('.chloe-nudge-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.className = 'chloe-nudge-toast';
        toast.textContent = "⚡ Follow Chloe's highlighted step to proceed!";
        const msg = card.querySelector('.chloe-bubble-message');
        if (msg) msg.parentNode.insertBefore(toast, msg.nextSibling);
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 2800);
      }
    }
  }

  // ========================================================
  // 4. FLOATING CHAT BUBBLE RENDERER
  // ========================================================
  function renderChatBubble({ message, actionText, actionHandler, isComplete, canSkip = true }) {
    let card = document.getElementById('tutorial-guide-card');
    if (!card) {
      card = document.createElement('div');
      card.id = 'tutorial-guide-card';
      card.className = 'chloe-guide-card';
      document.body.appendChild(card);
    }

    card.style.display = 'flex'; // ALWAYS ENSURE VISIBILITY

    card.innerHTML = `
      <div class="chloe-guide-header">
        <div class="chloe-guide-identity">
          <span class="chloe-avatar">👩‍💻</span>
          <div>
            <div class="chloe-name">Chloe • Nordic Copilot</div>
            <div class="chloe-role">Step ${currentStepIndex + 1} of ${MASTER_STORY.steps.length}</div>
          </div>
        </div>
        <span style="font-size:10px;color:#2dd4bf;font-weight:700;">ACTIVE</span>
      </div>
      <div class="chloe-bubble-message">${message}</div>
      <div class="chloe-bubble-actions">
        ${canSkip && !isComplete ? `<button class="btn-tour-skip" id="btn-tour-skip">Skip Guide</button>` : `<div></div>`}
        ${actionText ? `
          <button class="chloe-prompt-btn pulse" id="btn-bubble-act">
            ${actionText}
          </button>
        ` : ''}
      </div>
    `;

    const actBtn = card.querySelector('#btn-bubble-act');
    if (actBtn && typeof actionHandler === 'function') {
      actBtn.addEventListener('click', async () => {
        actBtn.disabled = true;
        actBtn.classList.remove('pulse');
        await actionHandler();
      });
    }

    const skipBtn = card.querySelector('#btn-tour-skip');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        Chloe.exitTour();
      });
    }

    updateHUD();
  }

  function renderHUD() {
    let hud = document.getElementById('tutorial-hud-bar');
    if (!hud) {
      hud = document.createElement('div');
      hud.id = 'tutorial-hud-bar';
      hud.className = 'tutorial-hud-bar';
      document.body.appendChild(hud);
    }
    updateHUD();
  }

  function updateHUD() {
    const hud = document.getElementById('tutorial-hud-bar');
    if (!hud) return;
    const currentStep = MASTER_STORY.steps[currentStepIndex];
    if (!currentStep) return;
    hud.innerHTML = `
      <div class="tutorial-hud-title">
        <span class="tutorial-hud-step-pill">Step ${currentStepIndex + 1}/${MASTER_STORY.steps.length}</span>
        <span>${currentStep.title}</span>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <span class="tutorial-hud-sub">Nordic Glass Cockpit</span>
        <button class="tutorial-hud-exit" id="btn-hud-exit-tour">✕ Exit</button>
      </div>
    `;

    const exitBtn = hud.querySelector('#btn-hud-exit-tour');
    if (exitBtn) {
      exitBtn.addEventListener('click', () => Chloe.exitTour());
    }
  }

  // ========================================================
  // 5. MASTER 5-STEP HAND-HOLDING STORY (DUAL-TRIGGER RESILIENT)
  // ========================================================
  const MASTER_STORY = {
    steps: [
      // STEP 1: Daily Focus Anchor
      {
        stepNum: 1,
        title: "The Daily Focus Anchor",
        init: async () => {
          clearHighlight();
          showGuideCard();
          if (window.GlassApp) window.GlassApp.switchTab('today');
          await wait(200);

          highlightTarget('#daily-anchor-card', '👉 1. Focus Anchor Card');

          let anchorDone = false;
          const advanceToAnchorCheck = () => {
            clearHighlight();
            highlightTarget('#anchor-checkbox', '👉 Check Anchor');

            renderChatBubble({
              message: "Now check off your anchor to lock in your daily win. Listen for the synthetic audio confirmation chime!",
              actionText: "🎉 Complete Anchor Win",
              actionHandler: async () => {
                const chk = document.getElementById('anchor-checkbox');
                if (chk) {
                  chk.checked = true;
                  chk.dispatchEvent(new Event('change', { bubbles: true }));
                }
                onAnchorCompleted();
              }
            });

            const chk = document.getElementById('anchor-checkbox');
            if (chk) {
              chk.addEventListener('change', () => {
                if (chk.checked) onAnchorCompleted();
              }, { once: true });
            }
          };

          const onAnchorCompleted = () => {
            if (anchorDone) return;
            anchorDone = true;
            clearHighlight();
            setTimeout(() => {
              const bar = document.getElementById('daily-progress-bar-fill') || document.querySelector('.momentum-hud-ring');
              if (bar) highlightTarget(bar, '⚡ Momentum 100%');
              renderChatBubble({
                message: "🎉 Notice how your momentum bar instantly surges! You've already won today. Next, let's explore the Energy Battery & Burnout Shield.",
                actionText: "Next: Energy Battery & Shield →",
                actionHandler: () => Chloe.nextStep()
              });
            }, 300);
          };

          renderChatBubble({
            message: "Welcome! I'm <strong>Chloe</strong> 👩‍💻. ADHD brains stall when confronted with 30-item to-do lists. We run on the <strong>Single Win Rule</strong>: select just 1 priority focus anchor.",
            actionText: "⚡ Type Focus Anchor",
            actionHandler: async () => {
              const input = document.getElementById('anchor-input');
              if (input) {
                await typeIntoField(input, "Drink tall glass of water & stretch for 2 minutes", 18);
              }
              advanceToAnchorCheck();
            }
          });

          // Allow manual typing into input
          const input = document.getElementById('anchor-input');
          if (input) {
            input.addEventListener('change', () => {
              if (input.value.trim().length > 0) advanceToAnchorCheck();
            }, { once: true });
          }
        }
      },

      // STEP 2: Energy Battery & Burnout Shield
      {
        stepNum: 2,
        title: "Energy Battery & Burnout Shield",
        init: async () => {
          clearHighlight();
          showGuideCard();
          highlightTarget('#energy-dial-bar', '👉 2. Energy Battery');

          let energyDone = false;
          const advanceToShield = () => {
            clearHighlight();
            highlightTarget('#btn-burnout-shield', '👉 🛡️ Burnout Shield');

            renderChatBubble({
              message: "In high-stress burnout, activate the <strong>🛡️ Shield</strong> in the top header to dim sensory overload and leave only survival basics:",
              actionText: "🛡️ Toggle Burnout Shield",
              actionHandler: async () => {
                const shieldBtn = document.getElementById('btn-burnout-shield');
                if (shieldBtn) shieldBtn.click();
                advanceToShieldOff();
              }
            });

            const shieldBtn = document.getElementById('btn-burnout-shield');
            if (shieldBtn) {
              shieldBtn.addEventListener('click', advanceToShieldOff, { once: true });
            }
          };

          const advanceToShieldOff = () => {
            renderChatBubble({
              message: "Interface noise is eliminated. No guilt, no stress. Tap below to turn the shield off and continue:",
              actionText: "☀️ Turn Shield OFF",
              actionHandler: async () => {
                const shieldBtn = document.getElementById('btn-burnout-shield');
                if (shieldBtn) shieldBtn.click();
                const normalPill = document.querySelector('.energy-pill[data-energy="normal"]');
                if (normalPill) normalPill.click();
                clearHighlight();
                await wait(200);

                renderChatBubble({
                  message: "Outstanding! Now let's explore our primary weapon against executive dysfunction: the <strong>1-Click Task De-chunker</strong>.",
                  actionText: "Next: Task De-chunker →",
                  actionHandler: () => Chloe.nextStep()
                });
              }
            });
          };

          renderChatBubble({
            message: "Biological capacity changes every day. Tap <strong>Low Spoons</strong> to filter out everything non-essential:",
            actionText: "🌧️ Select 'Low Spoons'",
            actionHandler: async () => {
              const lowPill = document.querySelector('.energy-pill[data-energy="low"]');
              if (lowPill) lowPill.click();
              await wait(200);
              advanceToShield();
            }
          });

          const lowPill = document.querySelector('.energy-pill[data-energy="low"]');
          if (lowPill) {
            lowPill.addEventListener('click', advanceToShield, { once: true });
          }
        }
      },

      // STEP 3: Task De-chunker
      {
        stepNum: 3,
        title: "Task De-chunker (Paralysis Breaker)",
        init: async () => {
          clearHighlight();
          showGuideCard();
          highlightTarget('#btn-open-add-task', '👉 3. Tap \'+ Add Task\'');

          let taskOpened = false;
          const openTaskModal = async () => {
            if (taskOpened) return;
            taskOpened = true;
            if (window.GlassApp) window.GlassApp.openModal('modal-add-task');
            clearHighlight();
            await wait(250);

            highlightTarget('#input-task-title', '👉 Task Name');
            showModalGuideBanner('#modal-add-task', {
              message: "Let's input a massive, paralyzing project like <em>'Clean the messy bedroom'</em>:",
              actionText: "⚡ Type \"Clean the messy bedroom\"",
              actionHandler: async () => {
                const titleInput = document.getElementById('input-task-title');
                if (titleInput) await typeIntoField(titleInput, "Clean the messy bedroom", 18);

                clearHighlight();
                const saveBtn = document.querySelector('#form-add-task button[type="submit"]');
                highlightTarget(saveBtn, '👉 Save Task');

                showModalGuideBanner('#modal-add-task', {
                  message: "Now tap <strong>Add Task</strong> below to save:",
                  actionText: "💾 Save Task",
                  actionHandler: async () => {
                    const form = document.getElementById('form-add-task');
                    if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                    removeModalGuideBanner();
                    clearHighlight();
                    await wait(350);
                    setupDechunkStep();
                  }
                });
              }
            });

            // Native form submit listener fallback
            const form = document.getElementById('form-add-task');
            if (form) {
              const onNativeSubmit = () => {
                form.removeEventListener('submit', onNativeSubmit);
                removeModalGuideBanner();
                clearHighlight();
                setTimeout(setupDechunkStep, 350);
              };
              form.addEventListener('submit', onNativeSubmit, { once: true });
            }
          };

          const setupDechunkStep = () => {
            showGuideCard();
            const dechunkBtn = document.querySelector('.btn-dechunk');
            if (dechunkBtn) {
              highlightTarget(dechunkBtn, '👉 4. Tap ✂️ to De-chunk!');
            }

            let dechunked = false;
            const onDechunkDone = () => {
              if (dechunked) return;
              dechunked = true;
              clearHighlight();
              setTimeout(() => {
                const subtasks = document.querySelector('.subtasks-container') || document.querySelector('.task-card');
                if (subtasks) highlightTarget(subtasks, '🎉 Micro-Steps Generated');
                renderChatBubble({
                  message: "🎉 Done! It generated 4 micro-steps taking only 2-3 minutes each. Starting now requires almost zero friction!",
                  actionText: "Next: The Dopamine Menu →",
                  actionHandler: () => Chloe.nextStep()
                });
              }, 300);
            };

            renderChatBubble({
              message: "Here is where the magic happens! Tap the <strong>✂️ De-chunk icon</strong> to disintegrate this overwhelming chore into 3-minute steps:",
              actionText: "✂️ De-chunk This Task Now",
              actionHandler: async () => {
                const btn = document.querySelector('.btn-dechunk');
                if (btn) btn.click();
                onDechunkDone();
              }
            });

            document.querySelectorAll('.btn-dechunk').forEach(b => {
              b.addEventListener('click', onDechunkDone, { once: true });
            });
          };

          renderChatBubble({
            message: "When working memory freezes, a big task looks insurmountable. Tap <strong>'+ Add Task'</strong>:",
            actionText: "👉 Open '+ Add Task'",
            actionHandler: openTaskModal
          });

          const btn = document.getElementById('btn-open-add-task');
          if (btn) btn.addEventListener('click', openTaskModal, { once: true });
        }
      },

      // STEP 4: The Dopamine Menu
      {
        stepNum: 4,
        title: "The Dopamine Menu",
        init: async () => {
          clearHighlight();
          showGuideCard();
          const dopTab = getVisibleNavTab('dopamine');
          if (dopTab) highlightTarget(dopTab, '👉 5. Tap Fuel / Dopamine');

          let tabOpened = false;
          const openDopamineTab = async () => {
            if (tabOpened) return;
            tabOpened = true;
            if (window.GlassApp) window.GlassApp.switchTab('dopamine');
            clearHighlight();
            await wait(250);

            highlightTarget('#btn-dopamine-surprise', '👉 Surprise Me Button');

            let surpriseDone = false;
            const onSurpriseDone = () => {
              if (surpriseDone) return;
              surpriseDone = true;
              clearHighlight();
              setTimeout(() => {
                renderChatBubble({
                  message: "Our menu categorizes dopamine into <strong>Appetizers</strong> (quick 2-min jolts), <strong>Sides</strong> (sensory audio/candles), and <strong>Desserts</strong> (restful rewards)!",
                  actionText: "Next: Grace Streaks →",
                  actionHandler: () => Chloe.nextStep()
                });
              }, 400);
            };

            renderChatBubble({
              message: "When seeking stimulation, you risk falling into doom-scrolling. Tap <strong>'Surprise Me'</strong> for an instant healthy dopamine reset:",
              actionText: "⚡ Tap 'Surprise Me'",
              actionHandler: async () => {
                const sBtn = document.getElementById('btn-dopamine-surprise');
                if (sBtn) sBtn.click();
                onSurpriseDone();
              }
            });

            const sBtn = document.getElementById('btn-dopamine-surprise');
            if (sBtn) sBtn.addEventListener('click', onSurpriseDone, { once: true });
          };

          renderChatBubble({
            message: "Now let's inspect your neurochemical engine. Tap the <strong>Fuel / Dopamine 🍽️</strong> tab in the navigation:",
            actionText: "👉 Open Dopamine Fuel 🍽️",
            actionHandler: openDopamineTab
          });

          if (dopTab) dopTab.addEventListener('click', openDopamineTab, { once: true });
        }
      },

      // STEP 5: Grace Streaks & Routines
      {
        stepNum: 5,
        title: "Grace Streaks (Zero Guilt)",
        init: async () => {
          clearHighlight();
          showGuideCard();
          const rTab = getVisibleNavTab('routines');
          if (rTab) highlightTarget(rTab, '👉 6. Tap Habits / Routines');

          let routinesOpened = false;
          const openRoutinesTab = async () => {
            if (routinesOpened) return;
            routinesOpened = true;
            if (window.GlassApp) window.GlassApp.switchTab('routines');
            clearHighlight();
            await wait(250);

            const streakCard = document.querySelector('.streak-banner-card') || document.querySelector('.glass-panel');
            if (streakCard) highlightTarget(streakCard, '⚡ Grace Streaks');

            renderChatBubble({
              message: "Traditional habit apps wipe your score if you miss a single day, triggering shame spirals. Our <strong>Grace Streaks</strong> absorb missed days so your momentum stays intact!",
              actionText: "🎉 Complete Chloe's Tour!",
              isComplete: true,
              actionHandler: () => {
                clearHighlight();
                renderChatBubble({
                  message: "🎉 <strong>Calibration Complete!</strong> You now command the full ADHD Life Planner system. Tap below to launch your focus workflow:",
                  actionText: "⚡ Launch Planner",
                  isComplete: true,
                  actionHandler: () => {
                    Chloe.exitTour();
                    if (window.GlassApp) window.GlassApp.switchTab('today');
                  }
                });
              }
            });
          };

          renderChatBubble({
            message: "Finally, let's look at habits. Tap the <strong>Habits / Routines 🌿</strong> capsule in the navigation:",
            actionText: "👉 Open Habits & Routines 🌿",
            actionHandler: openRoutinesTab
          });

          if (rTab) rTab.addEventListener('click', openRoutinesTab, { once: true });
        }
      }
    ]
  };

  // ========================================================
  // 6. PUBLIC TOUR CONTROLLER API
  // ========================================================
  Chloe.startTour = function (fromBeginning = true) {
    if (fromBeginning) currentStepIndex = 0;
    isTourActive = true;
    document.body.classList.add('tutorial-active');

    let mask = document.getElementById('tutorial-mask-overlay');
    if (!mask) {
      mask = document.createElement('div');
      mask.id = 'tutorial-mask-overlay';
      mask.className = 'tutorial-mask-overlay';
      document.body.appendChild(mask);
    }
    mask.classList.add('active');

    renderHUD();

    document.addEventListener('click', handleTourClickGuard, true);

    this.runCurrentStep();
  };

  Chloe.runCurrentStep = function () {
    if (currentStepIndex >= MASTER_STORY.steps.length) {
      this.exitTour();
      return;
    }
    const step = MASTER_STORY.steps[currentStepIndex];
    if (step && typeof step.init === 'function') {
      step.init();
    }
  };

  Chloe.nextStep = function () {
    currentStepIndex++;
    if (currentStepIndex < MASTER_STORY.steps.length) {
      this.runCurrentStep();
    } else {
      this.exitTour();
    }
  };

  Chloe.exitTour = function () {
    isTourActive = false;
    clearHighlight();
    removeModalGuideBanner();

    document.body.classList.remove('tutorial-active');

    const mask = document.getElementById('tutorial-mask-overlay');
    if (mask) mask.classList.remove('active');

    const card = document.getElementById('tutorial-guide-card');
    if (card) card.remove();

    const hud = document.getElementById('tutorial-hud-bar');
    if (hud) hud.remove();

    document.removeEventListener('click', handleTourClickGuard, true);
  };

  Chloe.isTourRunning = function () {
    return isTourActive;
  };

  global.Chloe = Chloe;

  // Auto-bind help badge clicks
  document.addEventListener('click', (e) => {
    const badge = e.target.closest('[data-chloe-help]');
    if (badge) {
      const key = badge.getAttribute('data-chloe-help');
      if (global.showChloeHelp) global.showChloeHelp(key);
    }
  });

})(typeof window !== 'undefined' ? window : this);
