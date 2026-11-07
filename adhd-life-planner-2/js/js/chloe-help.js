/**
 * ADHD Life Planner 2 (Edition 2) - Chloe's Contextual Help & Executive Function System
 * Low-cognitive-load tactical guides for each screen, card, and ADHD feature.
 */

(function (global) {
  'use strict';

  const ChloeHelp = {
    'anchor.focus': {
      title: 'Daily Focus Anchor (Single Win Rule)',
      core: 'The single non-negotiable priority for today. Complete this one win and your day is an indisputable success.',
      action: 'Type your 1 primary focus item at the start of your day. When completed, check the box to lock in your daily win.',
      brain: 'Traditional 30-item to-do lists trigger working memory overflow and freeze responses. Anchoring on 1 target removes decision fatigue completely.',
      rule: 'If you accomplish nothing else today except this single anchor, your day is a total victory. Anything else is bonus credit.'
    },
    'energy.dial': {
      title: 'Dynamic Energy Dial (Battery Matching)',
      core: 'A 3-state executive battery filter: Low Spoons, Steady Rhythm, and High Focus.',
      action: 'Tap the pill matching your current biological capacity today. The planner instantly reorganizes your view.',
      brain: 'Neurodivergent energy fluctuates naturally. Forcing high-demand tasks on low-energy days causes burnout spirals. Matching task load to energy restores momentum.',
      rule: 'Never feel guilty for selecting Low Spoons. Adapting to reality is how sustainable habits are formed.'
    },
    'shield.burnout': {
      title: 'Burnout Shield (Low-Spoons Fog Mode)',
      core: 'Emergency sensory reduction mode. Dims non-essential tasks and isolates only bare survival necessities.',
      action: 'Toggle the 🛡️ Shield button in the top bar whenever you feel sensory overload, brain fog, or exhaustion.',
      brain: 'When the nervous system is overwhelmed, visual clutter amplifies paralysis. Fog Mode cuts away 80% of interface noise so you can breathe.',
      rule: 'All your routines, brain dump notes, and upcoming tasks remain 100% safe in the background while the shield is active.'
    },
    'dechunk.paralysis': {
      title: '1-Click Task De-chunker (Paralysis Breaker)',
      core: 'Heuristic breakdown engine that transforms monolithic, scary chores into 3-5 minute painless micro-actions.',
      action: 'Tap the ✂️ De-chunk icon on any active task. The system automatically populates bite-sized sub-steps.',
      brain: 'ADHD brains struggle with task initiation because complex projects seem impossible to sequence. 3-minute micro-steps bypass the initiation hurdle.',
      rule: 'You do not have to finish every micro-step. Once you initiate the first 2-minute step, neurochemical momentum usually takes over.'
    },
    'dopamine.menu': {
      title: '4-Quadrant Dopamine Menu',
      core: 'A restaurant-style menu for healthy stimulation: Appetizers (2-5 min), Entrees (deep flow), Sides (sensory background), Desserts (guilt-free rewards).',
      action: 'When stuck in boredom or doom-scrolling, visit the Dopamine tab or tap [Surprise Me] for an immediate reset suggestion.',
      brain: 'ADHD is fundamentally a dopamine regulation difference. Having an intentional menu prevents unconscious scrolling and restores intrinsic drive.',
      rule: 'Desserts are not treats you have to earn through suffering; they are planned rest rituals that prevent future burnout.'
    },
    'streaks.grace': {
      title: 'Guilt-Free Grace Streaks (Zero Shame)',
      core: 'A consistency tracker equipped with automatic Grace Days that absorb missed days without resetting your score to zero.',
      action: 'Check off your daily anchor or routine. If life gets chaotic and you miss 1-2 days, your grace pool protects your streak.',
      brain: 'All-or-nothing thinking causes ADHDers to abandon apps after a single missed day. Grace streaks protect psychological safety and reward return.',
      rule: 'Total active days never decrease. Consistency is measured by your willingness to come back, not rigid perfection.'
    },
    'braindump.memory': {
      title: 'Working Memory Offloader (Brain Dump)',
      core: 'A zero-friction digital scratchpad for catching random racing thoughts, intrusive ideas, and sudden reminders.',
      action: 'Jot down thoughts as they strike. Auto-saves continuously into local storage.',
      brain: 'ADHD working memory is notoriously leaky. Keeping open thoughts in your head uses cognitive RAM; offloading them frees focus immediately.',
      rule: 'Do not organize this dump while writing. Capture first, sort later when your energy is higher.'
    },
    'privacy.offline': {
      title: '100% Client-Side Privacy Guarantee',
      core: 'Zero cloud dependencies, zero external servers, zero logins or tracking cookies.',
      action: 'Your planner works offline anywhere. Use the Settings tab to export encrypted JSON backups for personal safekeeping.',
      brain: 'No account setup friction or subscription dread. Your personal health and productivity data stays strictly on your physical device.',
      rule: 'You own your data completely. Export backups before clearing browser cache or switching devices.'
    }
  };

  global.ChloeHelp = ChloeHelp;

  global.showChloeHelp = function (key) {
    const data = ChloeHelp[key];
    if (!data) return;

    let modal = document.getElementById('chloe-help-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'chloe-help-modal';
      modal.className = 'chloe-help-dialog-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="chloe-help-card">
        <div class="chloe-help-title">
          <span>👩‍💻</span>
          <span>${data.title}</span>
        </div>
        <div class="chloe-help-body">
          <p style="margin-bottom:8px;"><strong>Core Concept:</strong> ${data.core}</p>
          <p style="margin-bottom:8px;"><strong>ADHD Science:</strong> ${data.brain}</p>
          <p style="margin-bottom:8px;"><strong>Tactical Action:</strong> ${data.action}</p>
          <p style="color:var(--color-cyan);font-weight:600;"><strong>Golden Rule:</strong> ${data.rule}</p>
        </div>
        <button type="button" class="chloe-help-close" id="btn-close-chloe-help">Understood (Close)</button>
      </div>
    `;

    modal.classList.add('active');

    const closeBtn = modal.querySelector('#btn-close-chloe-help');
    if (closeBtn) {
      closeBtn.onclick = () => modal.classList.remove('active');
    }
    modal.onclick = (e) => {
      if (e.target === modal) modal.classList.remove('active');
    };
  };

})(typeof window !== 'undefined' ? window : this);
