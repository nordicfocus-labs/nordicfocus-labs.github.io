/**
 * ADHD Student Planner 2 — Data Persistence & Storage Engine (Edition 2: Nordic Glass)
 * Client-side localStorage engine with schema validation, anti-double-counting,
 * and JSON backup export/import.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.StudentStorage = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const STORAGE_KEY = 'adhd_student_planner_2_data_v1';
  const CURRENT_SCHEMA = 1;

  function getTodayISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function getDefaultData() {
    const today = getTodayISO();
    const parts = today.split('-');
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);

    function offsetDays(n) {
      const dt = new Date(Date.UTC(y, m, d + n));
      const oy = dt.getUTCFullYear();
      const om = String(dt.getUTCMonth() + 1).padStart(2, '0');
      const od = String(dt.getUTCDate()).padStart(2, '0');
      return `${oy}-${om}-${od}`;
    }

    return {
      schema: CURRENT_SCHEMA,
      profile: {
        name: 'Jordan',
        schoolName: 'Engineering & Computing Institute',
        currentTerm: 'Fall Semester',
        studyStreak: 5,
        lastActiveDate: today,
        graceTokens: 3,
        totalStudyMinutes: 320
      },
      settings: {
        fogMode: false,
        soundEnabled: true,
        hapticsEnabled: true,
        theme: 'emerald-modern', // Shop 2 Master Brand
        defaultSprintMinutes: 20
      },
      courses: [
        {
          id: 'course-1',
          code: 'CS 240',
          name: 'Data Structures & Algorithms',
          color: '#2dd4bf',
          instructor: 'Dr. Katherine Lin',
          room: 'Turing Hall 301',
          scheduleDays: ['Mon', 'Wed', 'Fri'],
          scheduleTime: '11:00 AM - 12:15 PM',
          targetGrade: 92,
          weights: { assignments: 40, quizzes: 20, midterm: 20, final: 20 }
        },
        {
          id: 'course-2',
          code: 'PHYS 201',
          name: 'Electromagnetism & Waves',
          color: '#38bdf8',
          instructor: 'Prof. Henrik Rossi',
          room: 'Physics Lab 112',
          scheduleDays: ['Tue', 'Thu'],
          scheduleTime: '9:30 - 11:00 AM',
          targetGrade: 88,
          weights: { assignments: 30, quizzes: 20, midterm: 25, final: 25 }
        },
        {
          id: 'course-3',
          code: 'ENG 115',
          name: 'Technical Writing & Ethics',
          color: '#a78bfa',
          instructor: 'Dr. Sarah Sterling',
          room: 'Humanities 204',
          scheduleDays: ['Wed'],
          scheduleTime: '2:00 - 4:45 PM',
          targetGrade: 95,
          weights: { assignments: 50, quizzes: 20, midterm: 15, final: 15 }
        }
      ],
      assignments: [
        {
          id: 'asg-1',
          courseId: 'course-1',
          title: 'Graph Traversal & Dijkstra Implementation',
          category: 'assignments',
          dueDate: offsetDays(1),
          dueTime: '23:59',
          score: null,
          maxScore: 100,
          isEssential: true,
          completed: false,
          completedDate: null,
          dechunkedMilestones: [
            { id: 'm-101', text: 'Define adjacency list node class and priority queue', minutes: 15, done: true },
            { id: 'm-102', text: 'Implement shortest-path relaxation logic', minutes: 25, done: false },
            { id: 'm-103', text: 'Run edge-case test suites (cycles, disconnected nodes)', minutes: 20, done: false },
            { id: 'm-104', text: 'Submit GitHub commit and autograder link', minutes: 10, done: false }
          ]
        },
        {
          id: 'asg-2',
          courseId: 'course-2',
          title: 'Maxwell Equations Problem Set #3',
          category: 'assignments',
          dueDate: offsetDays(3),
          dueTime: '17:00',
          score: null,
          maxScore: 100,
          isEssential: false,
          completed: false,
          completedDate: null,
          dechunkedMilestones: [
            { id: 'm-201', text: 'Review Faraday law flux integration examples', minutes: 15, done: false },
            { id: 'm-202', text: 'Solve problems 1-3 (magnetic vector potentials)', minutes: 25, done: false },
            { id: 'm-203', text: 'Solve problems 4-5 (displacement current densities)', minutes: 20, done: false },
            { id: 'm-204', text: 'Review final units and scan PDF', minutes: 10, done: false }
          ]
        },
        {
          id: 'asg-3',
          courseId: 'course-3',
          title: 'Autonomous AI Ethics Case Analysis',
          category: 'assignments',
          dueDate: offsetDays(5),
          dueTime: '23:59',
          score: null,
          maxScore: 100,
          isEssential: true,
          completed: false,
          completedDate: null,
          dechunkedMilestones: [
            { id: 'm-301', text: 'Outline ethical dilemma thesis & stakeholders', minutes: 15, done: false },
            { id: 'm-302', text: 'Analyze IEEE/ACM Code of Ethics violations', minutes: 25, done: false },
            { id: 'm-303', text: 'Draft risk mitigation framework', minutes: 20, done: false },
            { id: 'm-304', text: 'Format citations and final proofread', minutes: 15, done: false }
          ]
        },
        {
          id: 'asg-4',
          courseId: 'course-1',
          title: 'Quiz 1: Asymptotic Big-O Analysis',
          category: 'quizzes',
          dueDate: offsetDays(-4),
          dueTime: '10:00',
          score: 96,
          maxScore: 100,
          isEssential: false,
          completed: true,
          completedDate: offsetDays(-4),
          dechunkedMilestones: []
        },
        {
          id: 'asg-5',
          courseId: 'course-2',
          title: 'Quiz 1: Gauss Law & Charge Densities',
          category: 'quizzes',
          dueDate: offsetDays(-2),
          dueTime: '13:00',
          score: 92,
          maxScore: 100,
          isEssential: false,
          completed: true,
          completedDate: offsetDays(-2),
          dechunkedMilestones: []
        }
      ],
      exams: [
        {
          id: 'exam-1',
          courseId: 'course-1',
          title: 'Midterm Exam: Trees, Heaps & Graphs',
          examDate: offsetDays(7),
          examTime: '11:00 AM',
          location: 'Turing Hall 301',
          targetScore: 92,
          actualScore: null,
          checklist: [
            { id: 'c-1', text: 'Review red-black tree rotation invariants', done: true },
            { id: 'c-2', text: 'Speed-drill BFS/DFS graph traversals on paper', done: false },
            { id: 'c-3', text: 'Complete Fall 2025 practice midterm', done: false }
          ]
        },
        {
          id: 'exam-2',
          courseId: 'course-2',
          title: 'Midterm Exam: Electrodynamics',
          examDate: offsetDays(12),
          examTime: '9:30 AM',
          location: 'Physics Lab 112',
          targetScore: 90,
          actualScore: null,
          checklist: [
            { id: 'c-4', text: 'Derive Poynting vector energy conservation', done: false },
            { id: 'c-5', text: 'Complete timed problem set without calculator', done: false }
          ]
        }
      ],
      sprints: [
        {
          id: 'spr-1',
          date: today,
          courseId: 'course-1',
          assignmentId: 'asg-1',
          minutes: 20,
          energyLevel: 'focused'
        }
      ]
    };
  }

  function validateAndMigrate(data) {
    if (!data || typeof data !== 'object') {
      return getDefaultData();
    }

    const defaultObj = getDefaultData();
    data.schema = CURRENT_SCHEMA;

    if (!data.profile || typeof data.profile !== 'object') data.profile = defaultObj.profile;
    if (!data.settings || typeof data.settings !== 'object') data.settings = defaultObj.settings;
    if (!Array.isArray(data.courses)) data.courses = defaultObj.courses;
    if (!Array.isArray(data.assignments)) data.assignments = defaultObj.assignments;
    if (!Array.isArray(data.exams)) data.exams = defaultObj.exams;
    if (!Array.isArray(data.sprints)) data.sprints = defaultObj.sprints;

    data.profile.graceTokens = typeof data.profile.graceTokens === 'number' ? data.profile.graceTokens : 3;
    data.profile.studyStreak = typeof data.profile.studyStreak === 'number' ? data.profile.studyStreak : 1;
    data.profile.totalStudyMinutes = typeof data.profile.totalStudyMinutes === 'number' ? data.profile.totalStudyMinutes : 0;

    return data;
  }

  function getStorageInstance() {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof global !== 'undefined' && global._mockLocalStorage) {
      return global._mockLocalStorage;
    }
    return null;
  }

  function load() {
    const store = getStorageInstance();
    if (!store) return getDefaultData();

    try {
      const raw = store.getItem(STORAGE_KEY);
      if (!raw) {
        const initData = getDefaultData();
        save(initData);
        return initData;
      }
      const parsed = JSON.parse(raw);
      return validateAndMigrate(parsed);
    } catch (e) {
      console.error('Failed to parse stored student planner 2 data, resetting to defaults', e);
      const initData = getDefaultData();
      save(initData);
      return initData;
    }
  }

  function save(data) {
    const store = getStorageInstance();
    if (!store) return false;

    try {
      const sanitized = validateAndMigrate(data);
      store.setItem(STORAGE_KEY, JSON.stringify(sanitized));
      return true;
    } catch (e) {
      console.error('Failed to save student planner 2 data', e);
      return false;
    }
  }

  function reset() {
    const store = getStorageInstance();
    const fresh = getDefaultData();
    if (store) {
      try {
        store.setItem(STORAGE_KEY, JSON.stringify(fresh));
      } catch (e) {
        console.error('Failed to reset storage', e);
      }
    }
    return fresh;
  }

  function exportJSON(data) {
    const safeData = data || load();
    return JSON.stringify(safeData, null, 2);
  }

  function importJSON(jsonString) {
    if (!jsonString || typeof jsonString !== 'string') {
      throw new Error('Invalid JSON string');
    }
    const parsed = JSON.parse(jsonString);
    const validated = validateAndMigrate(parsed);
    save(validated);
    return validated;
  }

  return {
    STORAGE_KEY: STORAGE_KEY,
    CURRENT_SCHEMA: CURRENT_SCHEMA,
    getDefaultData: getDefaultData,
    validateAndMigrate: validateAndMigrate,
    load: load,
    save: save,
    reset: reset,
    exportJSON: exportJSON,
    importJSON: importJSON
  };
});
