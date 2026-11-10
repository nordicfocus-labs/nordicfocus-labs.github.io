/**
 * ADHD Student Planner 2 — Glass Cockpit Controller & UI Orchestration
 * Architecture: Executive Momentum HUD & Split Dual-Column Glass Cockpit
 * Aesthetic: Modern Nordic Glassmorphism (Persona: Chloe)
 */

(function () {
  'use strict';

  let state = null;
  let activeCourseFilter = 'all';
  let sprintInterval = null;
  let sprintRemainingSeconds = 20 * 60;
  let sprintIsRunning = false;
  let activeSprintAssignmentId = null;

  // Web Audio Context: High-tech cyber chime
  let audioCtx = null;
  function playCyberChime(type) {
    if (!state.settings.soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!audioCtx) audioCtx = new AudioContext();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const now = audioCtx.currentTime;

      if (type === 'milestone') {
        // High-tech dual pulse (C6 -> G6)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1046.5, now);
        osc.frequency.exponentialRampToValueAtTime(1567.98, now + 0.1);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'sprint') {
        // Luminous resonance chime
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 1.0);
      }
    } catch (e) {
      // Audio autoplay gracefully handled
    }
  }

  function getTodayISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function init() {
    state = window.StudentStorage.load();

    const today = getTodayISO();
    const streakResult = window.StudentEngine.calculateStreak(
      state.profile.lastActiveDate,
      today,
      state.profile.studyStreak,
      state.profile.graceTokens
    );
    state.profile.studyStreak = streakResult.streak;
    state.profile.graceTokens = streakResult.graceTokens;
    state.profile.lastActiveDate = today;
    window.StudentStorage.save(state);

    applyTheme(state.settings.theme || 'emerald-modern');
    setupNavigation();
    setupEventListeners();
    setupModals();
    renderAll();

    if (window.ChloeTour) {
      window.ChloeTour.initTourHandlers();
      window.ChloeTour.startTour(false);
    }
  }

  function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    const select = document.getElementById('select-theme');
    if (select) select.value = theme;
  }

  function setupNavigation() {
    const tabs = document.querySelectorAll('.capsule-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', function (e) {
        e.preventDefault();
        const targetTab = this.getAttribute('data-tab');
        switchTab(targetTab);
      });
    });
  }

  function switchTab(tabId) {
    document.querySelectorAll('.capsule-tab').forEach(t => {
      if (t.getAttribute('data-tab') === tabId) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });

    document.querySelectorAll('.cockpit-panel-screen').forEach(s => {
      if (s.id === `screen-${tabId}`) {
        s.classList.add('active');
      } else {
        s.classList.remove('active');
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Expose switchTab globally for tour synchronization
  window.switchStudentTab = switchTab;

  function setupEventListeners() {
    // Fog / Burnout Shield Button
    const btnFog = document.getElementById('btn-fog-cockpit');
    if (btnFog) {
      btnFog.addEventListener('click', function () {
        state.settings.fogMode = !state.settings.fogMode;
        window.StudentStorage.save(state);
        renderHeader();
        renderFlightRadarHUD();
        renderAssignments();
      });
    }

    // Restart Chloe Tour
    const btnRestartTour = document.getElementById('btn-restart-tour');
    if (btnRestartTour) {
      btnRestartTour.addEventListener('click', function () {
        switchTab('dashboard');
        if (window.ChloeTour) {
          window.ChloeTour.startTour(true);
        }
      });
    }

    // Theme selector
    const selectTheme = document.getElementById('select-theme');
    if (selectTheme) {
      selectTheme.addEventListener('change', function () {
        state.settings.theme = this.value;
        applyTheme(this.value);
        window.StudentStorage.save(state);
      });
    }

    // Sound toggle
    const chkSound = document.getElementById('chk-sound-enabled');
    if (chkSound) {
      chkSound.checked = state.settings.soundEnabled;
      chkSound.addEventListener('change', function () {
        state.settings.soundEnabled = this.checked;
        window.StudentStorage.save(state);
      });
    }

    // Focus Sprint Controls
    const btnSprintToggle = document.getElementById('btn-sprint-toggle');
    if (btnSprintToggle) {
      btnSprintToggle.addEventListener('click', toggleSprintTimer);
    }

    const btnSprintReset = document.getElementById('btn-sprint-reset');
    if (btnSprintReset) {
      btnSprintReset.addEventListener('click', resetSprintTimer);
    }

    // Export & Import
    const btnExport = document.getElementById('btn-export-json');
    if (btnExport) {
      btnExport.addEventListener('click', function () {
        const json = window.StudentStorage.exportJSON(state);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `adhd-student-planner-2-backup-${getTodayISO()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      });
    }

    const inputImport = document.getElementById('input-import-file');
    if (inputImport) {
      inputImport.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (evt) {
          try {
            state = window.StudentStorage.importJSON(evt.target.result);
            renderAll();
            alert('Cockpit state restored successfully!');
          } catch (err) {
            alert('Invalid backup file. Please verify JSON format.');
          }
        };
        reader.readAsText(file);
      });
    }

    const btnResetData = document.getElementById('btn-reset-data');
    if (btnResetData) {
      btnResetData.addEventListener('click', function () {
        if (confirm('Reset to clean initial semester template? Custom courses and assignments will be wiped.')) {
          state = window.StudentStorage.reset();
          renderAll();
        }
      });
    }
  }

  function setupModals() {
    document.querySelectorAll('[data-open-modal]').forEach(btn => {
      btn.addEventListener('click', function () {
        const modalId = this.getAttribute('data-open-modal');
        openModal(modalId);
      });
    });

    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', function () {
        const modalId = this.getAttribute('data-close-modal');
        closeModal(modalId);
      });
    });

    document.querySelectorAll('.app-modal').forEach(modal => {
      modal.addEventListener('click', function (e) {
        if (e.target === this) {
          closeModal(this.id);
        }
      });
    });

    setupForms();
  }

  function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
  }

  function setupForms() {
    // Add Assignment Form
    const formAsg = document.getElementById('form-add-assignment');
    if (formAsg) {
      formAsg.addEventListener('submit', function (e) {
        e.preventDefault();
        const title = document.getElementById('input-asg-title').value.trim();
        const courseId = document.getElementById('select-asg-course').value;
        const category = document.getElementById('select-asg-category').value;
        const dueDate = document.getElementById('input-asg-date').value;
        const isEssential = document.getElementById('chk-asg-essential').checked;
        const autoDechunk = document.getElementById('chk-asg-dechunk').checked;

        if (!title || !dueDate) return;

        let milestones = [];
        if (autoDechunk) {
          milestones = window.StudentEngine.dechunkAssignment(category, title);
        }

        state.assignments.push({
          id: 'asg-' + Date.now(),
          courseId: courseId,
          title: title,
          category: category,
          dueDate: dueDate,
          dueTime: '23:59',
          score: null,
          maxScore: 100,
          isEssential: isEssential,
          completed: false,
          completedDate: null,
          dechunkedMilestones: milestones
        });

        window.StudentStorage.save(state);
        formAsg.reset();
        closeModal('modal-add-assignment');
        renderAll();
        playCyberChime('milestone');
      });
    }

    // Add Course Form
    const formCourse = document.getElementById('form-add-course');
    if (formCourse) {
      formCourse.addEventListener('submit', function (e) {
        e.preventDefault();
        const code = document.getElementById('input-course-code').value.trim();
        const name = document.getElementById('input-course-name').value.trim();
        const instructor = document.getElementById('input-course-instructor').value.trim();
        const schedule = document.getElementById('input-course-schedule').value.trim();
        const target = Number(document.getElementById('input-course-target').value) || 90;

        if (!code || !name) return;

        const colors = ['#2dd4bf', '#38bdf8', '#a78bfa', '#fbbf24', '#f43f5e'];
        const chosenColor = colors[state.courses.length % colors.length];

        state.courses.push({
          id: 'course-' + Date.now(),
          code: code,
          name: name,
          color: chosenColor,
          instructor: instructor || 'Staff',
          room: '',
          scheduleDays: [],
          scheduleTime: schedule || 'TBD',
          targetGrade: target,
          weights: { assignments: 40, quizzes: 20, midterm: 20, final: 20 }
        });

        window.StudentStorage.save(state);
        formCourse.reset();
        closeModal('modal-add-course');
        renderAll();
        playCyberChime('milestone');
      });
    }

    // Add Exam Form
    const formExam = document.getElementById('form-add-exam');
    if (formExam) {
      formExam.addEventListener('submit', function (e) {
        e.preventDefault();
        const courseId = document.getElementById('select-exam-course').value;
        const title = document.getElementById('input-exam-title').value.trim();
        const date = document.getElementById('input-exam-date').value;
        const time = document.getElementById('input-exam-time').value.trim() || 'TBD';
        const location = document.getElementById('input-exam-location').value.trim() || 'Hall B';

        if (!title || !date) return;

        state.exams.push({
          id: 'exam-' + Date.now(),
          courseId: courseId,
          title: title,
          examDate: date,
          examTime: time,
          location: location,
          targetScore: 90,
          actualScore: null,
          checklist: [
            { id: 'c-' + Date.now() + '-1', text: 'Consolidate formula & lecture notes', done: false },
            { id: 'c-' + Date.now() + '-2', text: 'Complete timed problem set', done: false }
          ]
        });

        window.StudentStorage.save(state);
        formExam.reset();
        closeModal('modal-add-exam');
        renderAll();
        playCyberChime('milestone');
      });
    }
  }

  function renderAll() {
    renderHeader();
    renderFlightRadarHUD();
    renderAssignments();
    renderCourses();
    renderExams();
    renderSettings();
    populateCourseSelects();
  }

  function renderHeader() {
    const btnFog = document.getElementById('btn-fog-cockpit');
    if (btnFog) {
      if (state.settings.fogMode) {
        btnFog.classList.add('active');
        btnFog.innerHTML = '🛡️ Burnout Shield ON';
      } else {
        btnFog.classList.remove('active');
        btnFog.innerHTML = '🛡️ Burnout Shield';
      }
    }

    const streakBadge = document.getElementById('badge-study-streak');
    if (streakBadge) {
      streakBadge.textContent = `🔥 ${state.profile.studyStreak}d Streak`;
    }

    const graceBadge = document.getElementById('badge-grace-tokens');
    if (graceBadge) {
      graceBadge.textContent = `🛡️ ${state.profile.graceTokens} Shields`;
    }
  }

  function renderFlightRadarHUD() {
    const today = getTodayISO();
    const hero = window.StudentEngine.getSingleFocusAction(state.assignments, today, state.settings.fogMode);
    const overallGpa = window.StudentEngine.calculateOverallGPA(state.courses, state.assignments);

    // Update 4-Tile Telemetry Grid
    const tileGpa = document.getElementById('telemetry-val-gpa');
    if (tileGpa) tileGpa.textContent = overallGpa.gpa;

    const pendingUrgent = (state.assignments || []).filter(a => {
      if (a.completed) return false;
      const days = window.StudentEngine.diffDays(today, a.dueDate);
      return days <= 2;
    }).length;
    const tileUrgent = document.getElementById('telemetry-val-urgent');
    if (tileUrgent) tileUrgent.textContent = `${pendingUrgent} Urgent`;

    const tileGrace = document.getElementById('telemetry-val-grace');
    if (tileGrace) tileGrace.textContent = `${state.profile.graceTokens} Shields`;

    const tileSprints = document.getElementById('telemetry-val-minutes');
    if (tileSprints) tileSprints.textContent = `${state.profile.totalStudyMinutes}m`;

    // Render Single Focus Card in HUD
    const container = document.getElementById('cockpit-focus-hero');
    if (!container) return;

    if (!hero.hasTask) {
      container.innerHTML = `
        <div class="hud-tag">✨ Academic Flight Radar</div>
        <div class="hud-task-title">${hero.message}</div>
        <p style="color: var(--text-dim); font-size: 0.85rem;">
          Executive momentum preserved. Review telemetry or engage a restorative break.
        </p>
      `;
      return;
    }

    const course = state.courses.find(c => c.id === hero.courseId) || { code: 'CORE', color: '#2dd4bf' };
    const assignment = state.assignments.find(a => a.id === hero.assignmentId);

    let milestonesHtml = '';
    if (assignment && assignment.dechunkedMilestones && assignment.dechunkedMilestones.length > 0) {
      milestonesHtml = `
        <div style="margin-top: 14px;">
          <div style="font-size: 0.72rem; font-weight: 800; color: var(--color-cyan); text-transform: uppercase; margin-bottom: 8px;">
            Execution Milestones (${hero.milestonesDone}/${hero.milestonesTotal})
          </div>
          ${assignment.dechunkedMilestones.map(m => `
            <div class="telemetry-tile mb-sm" style="flex-direction: row; align-items: center; justify-content: space-between; cursor: pointer; opacity: ${m.done ? '0.5' : '1'};" data-milestone-id="${m.id}" data-assignment-id="${assignment.id}">
              <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
                <span style="color: var(--color-accent); font-weight: bold;">${m.done ? '✓' : '○'}</span>
                <span style="font-size: 0.82rem; font-weight: 600; text-decoration: ${m.done ? 'line-through' : 'none'};">${window.StudentEngine.sanitizeText(m.text)}</span>
              </div>
              <span style="font-size: 0.72rem; color: var(--text-dim);">${m.minutes}m</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <span class="hud-tag">⚡ Current Executive Focus</span>
        <span class="capsule-badge" style="font-size: 0.72rem; padding: 3px 8px;">${hero.urgency.label}</span>
      </div>

      <div class="hud-task-title">${window.StudentEngine.sanitizeText(hero.title)}</div>

      <div style="display: flex; gap: 8px; align-items: center;">
        <span class="capsule-badge" style="font-size: 0.72rem;">${course.code}</span>
        ${hero.isEssential ? '<span class="capsule-badge" style="border-color: var(--color-gold); color: var(--color-gold);">Essential Priority</span>' : ''}
      </div>

      <div class="hud-step-pill">
        <div style="font-size: 0.7rem; text-transform: uppercase; color: var(--text-dim); font-weight: 700;">Immediate Action Step</div>
        <div class="hud-step-text">${window.StudentEngine.sanitizeText(hero.nextStepText)} (~${hero.nextStepMinutes} min)</div>
      </div>

      ${milestonesHtml}

      <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px;">
        <button class="btn-glass btn-glass-primary btn-complete-asg" data-assignment-id="${hero.assignmentId}">
          ✓ Complete Task
        </button>
        ${(!assignment.dechunkedMilestones || assignment.dechunkedMilestones.length === 0) ? `
          <button class="btn-glass btn-glass-secondary btn-dechunk-asg" data-assignment-id="${hero.assignmentId}">
            🪄 De-Chunk (4 Steps)
          </button>
        ` : ''}
      </div>
    `;

    bindHUDMilestoneClicks(container);
  }

  function bindHUDMilestoneClicks(container) {
    container.querySelectorAll('[data-milestone-id]').forEach(item => {
      item.addEventListener('click', function () {
        const asgId = this.getAttribute('data-assignment-id');
        const mId = this.getAttribute('data-milestone-id');
        toggleMilestone(asgId, mId);
      });
    });

    container.querySelectorAll('.btn-complete-asg').forEach(btn => {
      btn.addEventListener('click', function () {
        const asgId = this.getAttribute('data-assignment-id');
        markAssignmentComplete(asgId);
      });
    });

    container.querySelectorAll('.btn-dechunk-asg').forEach(btn => {
      btn.addEventListener('click', function () {
        const asgId = this.getAttribute('data-assignment-id');
        dechunkExistingAssignment(asgId);
      });
    });
  }

  function toggleMilestone(asgId, milestoneId) {
    const asg = state.assignments.find(a => a.id === asgId);
    if (!asg || !asg.dechunkedMilestones) return;
    const m = asg.dechunkedMilestones.find(item => item.id === milestoneId);
    if (!m) return;

    m.done = !m.done;
    if (m.done) playCyberChime('milestone');

    const allDone = asg.dechunkedMilestones.every(item => item.done);
    if (allDone) {
      asg.completed = true;
      asg.completedDate = getTodayISO();
      playCyberChime('sprint');
    }

    window.StudentStorage.save(state);
    renderFlightRadarHUD();
    renderAssignments();
  }

  function markAssignmentComplete(asgId) {
    const asg = state.assignments.find(a => a.id === asgId);
    if (!asg) return;
    asg.completed = true;
    asg.completedDate = getTodayISO();
    if (asg.dechunkedMilestones) {
      asg.dechunkedMilestones.forEach(m => { m.done = true; });
    }
    playCyberChime('sprint');
    window.StudentStorage.save(state);
    renderAll();
  }

  function dechunkExistingAssignment(asgId) {
    const asg = state.assignments.find(a => a.id === asgId);
    if (!asg) return;
    asg.dechunkedMilestones = window.StudentEngine.dechunkAssignment(asg.category, asg.title);
    playCyberChime('milestone');
    window.StudentStorage.save(state);
    renderAll();
  }

  function renderAssignments() {
    const today = getTodayISO();
    const container = document.getElementById('list-assignments');
    if (!container) return;

    const filtered = window.StudentEngine.filterAssignments(state.assignments, {
      courseId: activeCourseFilter,
      fogMode: state.settings.fogMode,
      showCompleted: false,
      todayStr: today
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="hud-panel" style="text-align: center; padding: 40px 20px;">
          <h3 style="font-size: 1.1rem; color: var(--text-main); margin-bottom: 6px;">Zero Cognitive Drag</h3>
          <p style="color: var(--text-dim); font-size: 0.88rem;">
            ${state.settings.fogMode ? 'Burnout Shield active: distant assignments suppressed.' : 'No pending assignments.'}
          </p>
        </div>
      `;
      return;
    }

    filtered.sort((a, b) => {
      const daysA = window.StudentEngine.diffDays(today, a.dueDate);
      const daysB = window.StudentEngine.diffDays(today, b.dueDate);
      return daysA - daysB;
    });

    container.innerHTML = filtered.map(a => {
      const course = state.courses.find(c => c.id === a.courseId) || { code: 'CORE', color: '#2dd4bf' };
      const urgency = window.StudentEngine.calculateUrgency(a.dueDate, today);
      const milestoneCount = (a.dechunkedMilestones || []).length;
      const doneCount = (a.dechunkedMilestones || []).filter(m => m.done).length;

      return `
        <div class="hud-panel mb-sm" style="padding: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; gap: 8px; align-items: center;">
              <span class="capsule-badge" style="font-size: 0.72rem;">${course.code}</span>
              <span style="font-size: 0.75rem; color: var(--text-dim);">${a.category}</span>
            </div>
            <span class="capsule-badge" style="font-size: 0.72rem; border-color: var(--color-cyan); color: var(--color-cyan);">${urgency.label}</span>
          </div>

          <div style="font-size: 1.05rem; font-weight: 700; margin: 8px 0; color: var(--text-main);">
            ${window.StudentEngine.sanitizeText(a.title)}
          </div>

          ${milestoneCount > 0 ? `
            <div style="margin: 8px 0; font-size: 0.78rem; color: var(--text-sub);">
              Execution: <strong>${doneCount}/${milestoneCount}</strong> micro-milestones
              <div style="width: 100%; height: 6px; background: var(--bg-tile); border-radius: 4px; overflow: hidden; margin-top: 4px;">
                <div style="width: ${(doneCount / milestoneCount) * 100}%; height: 100%; background: linear-gradient(90deg, var(--color-primary), var(--color-accent));"></div>
              </div>
            </div>
          ` : ''}

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
            <span style="font-size: 0.75rem; color: var(--text-dim);">Due: ${a.dueDate}</span>
            <div style="display: flex; gap: 6px;">
              <button class="btn-glass btn-glass-sm btn-glass-primary btn-complete-asg" data-assignment-id="${a.id}">✓ Done</button>
              ${milestoneCount === 0 ? `<button class="btn-glass btn-glass-sm btn-glass-secondary btn-dechunk-asg" data-assignment-id="${a.id}">🪄 De-Chunk</button>` : ''}
              <button class="btn-glass btn-glass-sm btn-glass-secondary btn-delete-asg" data-assignment-id="${a.id}">✕</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    bindAssignmentActions(container);
  }

  function bindAssignmentActions(container) {
    container.querySelectorAll('.btn-complete-asg').forEach(btn => {
      btn.addEventListener('click', function () {
        markAssignmentComplete(this.getAttribute('data-assignment-id'));
      });
    });

    container.querySelectorAll('.btn-dechunk-asg').forEach(btn => {
      btn.addEventListener('click', function () {
        dechunkExistingAssignment(this.getAttribute('data-assignment-id'));
      });
    });

    container.querySelectorAll('.btn-delete-asg').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-assignment-id');
        state.assignments = state.assignments.filter(a => a.id !== id);
        window.StudentStorage.save(state);
        renderAll();
      });
    });
  }

  function renderCourses() {
    const container = document.getElementById('grid-courses');
    if (!container) return;

    if (state.courses.length === 0) {
      container.innerHTML = `
        <div class="hud-panel" style="grid-column: 1 / -1; text-align: center; padding: 40px 20px;">
          <p style="color: var(--text-dim);">No courses enrolled yet. Click "+ Add Course" to establish curriculum.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = state.courses.map(course => {
      const grade = window.StudentEngine.calculateCourseGrade(course, state.assignments);
      const gradePercent = grade.currentPercentage !== null ? `${grade.currentPercentage}%` : 'In Flight';

      return `
        <div class="hud-panel" style="display: flex; flex-direction: column; justify-content: space-between; gap: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <span class="capsule-badge" style="border-color: ${course.color}; color: ${course.color}; font-size: 0.72rem;">${course.code}</span>
              <div style="font-size: 1.05rem; font-weight: 800; color: var(--text-main); margin-top: 4px;">${window.StudentEngine.sanitizeText(course.name)}</div>
              <div style="font-size: 0.78rem; color: var(--text-dim);">${window.StudentEngine.sanitizeText(course.instructor)} • ${window.StudentEngine.sanitizeText(course.scheduleTime)}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 1.3rem; font-weight: 800; color: var(--color-accent);">${gradePercent}</div>
              <div style="font-size: 0.75rem; color: var(--color-cyan); font-weight: 700;">${grade.letter}</div>
            </div>
          </div>

          <div style="background: var(--bg-tile); padding: 10px 12px; border-radius: var(--radius-btn); font-size: 0.78rem;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-dim);">Graded Units:</span>
              <strong>${grade.gradedCount} / ${grade.totalCount}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 4px;">
              <span style="color: var(--text-dim);">Target:</span>
              <strong style="color: var(--color-accent);">${course.targetGrade}%</strong>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; gap: 8px;">
            <button class="btn-glass btn-glass-sm btn-glass-secondary btn-log-grade" data-course-id="${course.id}">+ Log Score</button>
            <button class="btn-glass btn-glass-sm btn-glass-secondary btn-delete-course" data-course-id="${course.id}" style="color: var(--color-rose);">Delete</button>
          </div>
        </div>
      `;
    }).join('');

    bindCourseActions(container);
  }

  function bindCourseActions(container) {
    container.querySelectorAll('.btn-delete-course').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-course-id');
        if (confirm('Delete this course and its enrolled assignments?')) {
          state.courses = state.courses.filter(c => c.id !== id);
          state.assignments = state.assignments.filter(a => a.courseId !== id);
          state.exams = state.exams.filter(e => e.courseId !== id);
          window.StudentStorage.save(state);
          renderAll();
        }
      });
    });

    container.querySelectorAll('.btn-log-grade').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-course-id');
        const course = state.courses.find(c => c.id === id);
        if (!course) return;
        const score = prompt(`Enter scored percentage for ${course.code} (e.g. 94):`);
        if (score !== null && !isNaN(Number(score))) {
          state.assignments.push({
            id: 'asg-' + Date.now(),
            courseId: id,
            title: `Graded Evaluation (${getTodayISO()})`,
            category: 'quizzes',
            dueDate: getTodayISO(),
            dueTime: '12:00',
            score: Number(score),
            maxScore: 100,
            isEssential: false,
            completed: true,
            completedDate: getTodayISO(),
            dechunkedMilestones: []
          });
          window.StudentStorage.save(state);
          renderAll();
          playCyberChime('milestone');
        }
      });
    });
  }

  function renderExams() {
    const today = getTodayISO();
    const container = document.getElementById('list-exams');
    if (!container) return;

    if (state.exams.length === 0) {
      container.innerHTML = `
        <div class="hud-panel" style="text-align: center; padding: 40px 20px;">
          <p style="color: var(--text-dim);">No examination countdowns active.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = state.exams.map(exam => {
      const course = state.courses.find(c => c.id === exam.courseId) || { code: 'CORE', color: '#2dd4bf' };
      const cd = window.StudentEngine.calculateExamCountdown(exam.examDate, today);

      return `
        <div class="hud-panel mb-sm">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="capsule-badge" style="font-size: 0.72rem;">${course.code}</span>
            <span class="capsule-badge" style="font-size: 0.72rem; border-color: var(--color-cyan); color: var(--color-cyan);">${cd.label}</span>
          </div>

          <div style="font-size: 1.15rem; font-weight: 800; margin: 8px 0; color: var(--text-main);">
            ${window.StudentEngine.sanitizeText(exam.title)}
          </div>

          <div style="font-size: 0.8rem; color: var(--text-dim); margin-bottom: 12px;">
            📅 ${exam.examDate} @ ${exam.examTime} • 📍 ${window.StudentEngine.sanitizeText(exam.location)}
          </div>

          ${(exam.checklist || []).length > 0 ? `
            <div style="background: var(--bg-tile); padding: 12px; border-radius: var(--radius-btn);">
              <div style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; color: var(--color-cyan); margin-bottom: 8px;">
                Exam Preparation Protocol
              </div>
              ${exam.checklist.map(item => `
                <div class="telemetry-tile mb-sm" style="flex-direction: row; align-items: center; justify-content: space-between; cursor: pointer; opacity: ${item.done ? '0.5' : '1'};" data-exam-id="${exam.id}" data-item-id="${item.id}">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: var(--color-accent); font-weight: bold;">${item.done ? '✓' : '○'}</span>
                    <span style="font-size: 0.82rem; text-decoration: ${item.done ? 'line-through' : 'none'};">${window.StudentEngine.sanitizeText(item.text)}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
            <button class="btn-glass btn-glass-sm btn-glass-secondary btn-delete-exam" data-exam-id="${exam.id}">✕ Purge Exam</button>
          </div>
        </div>
      `;
    }).join('');

    bindExamActions(container);
  }

  function bindExamActions(container) {
    container.querySelectorAll('[data-item-id]').forEach(item => {
      item.addEventListener('click', function () {
        const examId = this.getAttribute('data-exam-id');
        const itemId = this.getAttribute('data-item-id');
        const exam = state.exams.find(e => e.id === examId);
        if (!exam || !exam.checklist) return;
        const target = exam.checklist.find(i => i.id === itemId);
        if (target) {
          target.done = !target.done;
          if (target.done) playCyberChime('milestone');
          window.StudentStorage.save(state);
          renderExams();
        }
      });
    });

    container.querySelectorAll('.btn-delete-exam').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-exam-id');
        state.exams = state.exams.filter(e => e.id !== id);
        window.StudentStorage.save(state);
        renderExams();
      });
    });
  }

  function renderSettings() {
    const streakDisplay = document.getElementById('stats-streak-display');
    if (streakDisplay) streakDisplay.textContent = `${state.profile.studyStreak} Consecutive Days`;

    const graceDisplay = document.getElementById('stats-grace-display');
    if (graceDisplay) graceDisplay.textContent = `${state.profile.graceTokens} Shields Online`;
  }

  function populateCourseSelects() {
    const asgSelect = document.getElementById('select-asg-course');
    const examSelect = document.getElementById('select-exam-course');

    const options = state.courses.map(c => `
      <option value="${c.id}">${c.code} — ${window.StudentEngine.sanitizeText(c.name)}</option>
    `).join('');

    if (asgSelect) asgSelect.innerHTML = options;
    if (examSelect) examSelect.innerHTML = options;
  }

  // Flow State Sprint Timer
  function toggleSprintTimer() {
    sprintIsRunning = !sprintIsRunning;
    const btn = document.getElementById('btn-sprint-toggle');
    if (btn) btn.textContent = sprintIsRunning ? 'Pause Flow' : 'Resume Flow';

    if (sprintIsRunning) {
      clearInterval(sprintInterval);
      sprintInterval = setInterval(tickSprintTimer, 1000);
    } else {
      clearInterval(sprintInterval);
    }
  }

  function tickSprintTimer() {
    sprintRemainingSeconds--;
    if (sprintRemainingSeconds <= 0) {
      clearInterval(sprintInterval);
      sprintIsRunning = false;
      playCyberChime('sprint');
      state.profile.totalStudyMinutes += 20;
      window.StudentStorage.save(state);
      alert('🚀 Flow State Sprint Complete! +20 minutes logged into academic telemetry.');
      resetSprintTimer();
      renderAll();
    } else {
      updateSprintDisplay();
    }
  }

  function resetSprintTimer() {
    clearInterval(sprintInterval);
    sprintIsRunning = false;
    sprintRemainingSeconds = 20 * 60;
    updateSprintDisplay();
    const btn = document.getElementById('btn-sprint-toggle');
    if (btn) btn.textContent = 'Engage Flow (20m)';
  }

  function updateSprintDisplay() {
    const mins = Math.floor(sprintRemainingSeconds / 60);
    const secs = sprintRemainingSeconds % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const display = document.getElementById('sprint-digits-cockpit');
    if (display) display.textContent = formatted;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
