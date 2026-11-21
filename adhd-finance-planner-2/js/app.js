/**
 * ADHD Finance Planner 2 — Edition 2 UI Controller (Nordic Focus Systems / Chloe).
 * Split-Cockpit HUD, 4-Lane Subscription Burn Kanban, 4-Vector Paycheck Waterfall, 14-Day Liquidity Heatmap.
 * Enforces Rules 01-22 (try/catch init isolation, post-tour clean slate, data-active-tab mobile HUD isolation).
 */
(function () {
  'use strict';

  var E = window.FPEngine;
  var S = window.FPStorage;
  var CFG = window.FPConfig;
  var T = window.FPTutorial;

  function today() { return E.todayStr(new Date()); }

  var rawStored = null;
  try { rawStored = window.localStorage.getItem(CFG.storageKey); } catch (e) {}
  var data = S.load(window.localStorage, CFG.storageKey, today());

  if (!rawStored && !data.settings.onboarded) {
    data = S.getSampleData(today());
    data.settings.onboarded = false;
  }

  var activeTab = CFG.defaultTab;
  var selectedPreset = data.settings.splitPreset || 'balanced';
  var confirmAction = null;
  var toastTimer = null;

  function $(id) { return document.getElementById(id); }
  function esc(s) { return E.escapeHtml(s); }
  function cur() { return (data && data.settings && data.settings.currency) || 'USD'; }
  function fmt(cents, signed) { return E.fmtCents(cents, cur(), signed); }
  function commit() { S.save(window.localStorage, CFG.storageKey, data); }

  function toast(msg) {
    var t = $('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }

  function beep(freq, ms) {
    if (!data.settings || !data.settings.sound) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      var ctx = new AC();
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.frequency.value = freq || 720;
      g.gain.value = 0.06;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      setTimeout(function () { o.stop(); ctx.close(); }, ms || 140);
    } catch (e) {}
  }

  // ---------- Clean Slate Transition (Rule-22) ----------
  function setCleanSlateState(forceWipe) {
    if (forceWipe || (data && data.settings && data.settings.isSampleSeed)) {
      data = S.cleanSlate(data, today(), !!forceWipe);
      commit();
      renderAll();
    }
  }
  window.setCleanSlateState = setCleanSlateState;

  function loadSampleData() {
    data = S.getSampleData(today());
    data.settings.onboarded = true;
    commit();
    renderAll();
    toast('Sample telemetry loaded.');
  }

  // ---------- Navigation & Mobile HUD Isolation (Rule-11, Rule-15) ----------
  function switchTab(tab) {
    if (CFG.tabs.indexOf(tab) < 0) tab = CFG.defaultTab;
    activeTab = tab;
    if (document.body) {
      document.body.setAttribute('data-active-tab', tab);
    }
    CFG.tabs.forEach(function (t) {
      var s = $('screen-' + t);
      if (s) s.classList.toggle('active', t === tab);
    });
    var btns = document.querySelectorAll('.nav-btn');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('active', btns[i].getAttribute('data-tab') === tab);
    }
    renderAll();
  }
  window.switchTab = switchTab;

  // ---------- Modals ----------
  function openModal(id) {
    var m = $(id);
    if (!m) return;
    if (id === 'modal-add-bill') {
      $('bill-title').value = '';
      $('bill-amount').value = '85.00';
      $('bill-due').value = E.addDays(today(), 5);
      $('bill-error').textContent = '';
    } else if (id === 'modal-add-sub') {
      $('sub-name').value = '';
      $('sub-amount').value = '19.99';
      $('sub-next-date').value = E.addDays(today(), 3);
      $('sub-is-trial').checked = false;
      $('sub-error').textContent = '';
    } else if (id === 'modal-add-bucket') {
      $('bucket-name').value = '';
      $('bucket-target').value = '1000';
      $('bucket-saved').value = '150';
      $('bucket-hold').value = '75';
      $('bucket-error').textContent = '';
    }
    m.classList.add('open');
  }

  function closeModal(id) {
    var m = $(id);
    if (m) m.classList.remove('open');
  }

  function askConfirm(text, fn) {
    $('confirm-text').textContent = text;
    confirmAction = fn;
    openModal('modal-confirm');
  }

  // ---------- Rendering ----------
  function renderHero() {
    var host = $('hero-pulse');
    if (!host) return;
    var p = E.financePulse(data, today());
    var move = E.nextMoneyMove(data, today());

    var moveHtml = '';
    if (move) {
      var actBtn = move.kind === 'subscription'
        ? '<button class="btn btn-sm btn-primary" type="button" data-act="cancel-sub" data-id="' + esc(move.id) + '">Kill Drain (+' + fmt(move.annualCents) + '/yr)</button>'
        : '<button class="btn btn-sm btn-primary" type="button" data-act="pay-bill" data-id="' + esc(move.id) + '">Commit Paid (' + fmt(move.amountCents) + ')</button>';
      moveHtml =
        '<div class="next-move-box">' +
          '<div>' +
            '<span class="tag warn">' + esc(move.badge) + '</span>' +
            '<div class="next-move-title" style="margin-top:4px;">Priority Vector: ' + esc(move.title) + '</div>' +
            '<div class="row-sub">' + fmt(move.amountCents) + ' · target ' + esc(E.prettyDate(move.date)) + '</div>' +
          '</div>' +
          actBtn +
        '</div>';
    } else {
      moveHtml =
        '<div class="next-move-box">' +
          '<div>' +
            '<span class="tag ok">Zero Alerts</span>' +
            '<div class="next-move-title" style="margin-top:4px;">All obligations and trial vectors nominal.</div>' +
            '<div class="row-sub">Register fixed obligations or load sample telemetry below.</div>' +
          '</div>' +
          '<div class="row-actions" style="margin-top:0;">' +
            '<button class="btn btn-sm btn-primary" type="button" data-open-modal="modal-add-bill">+ Add</button>' +
            '<button class="btn btn-sm btn-secondary" type="button" data-act="load-sample">🌱 Sample</button>' +
          '</div>' +
        '</div>';
    }

    var subline = p.hasShortfall
      ? 'Liquidity Deficit: obligations exceed checking by ' + fmt(p.shortfallCents) + '. Execute Triage or Waterfall.'
      : 'Discretionary Velocity: ' + fmt(p.leftTodayCents) + ' available today (' + fmt(p.dailyAllowanceCents) + '/day · ' + E.plural(p.daysToPayday, 'day') + ' to payday).';

    host.innerHTML =
      '<div class="hero-eyebrow">' +
        '<span>Discretionary Velocity Pool</span>' +
        '<span>T-' + E.plural(p.daysToPayday, 'day') + '</span>' +
      '</div>' +
      '<div class="hero-amount">' + fmt(p.safeDopamineCents) + '</div>' +
      '<div class="hero-sub">' + esc(subline) + '</div>' +
      '<div class="hero-meta-grid">' +
        '<div class="meta-item"><div class="meta-label">Checking</div><div class="meta-val">' + fmt(p.checkingCents) + '</div></div>' +
        '<div class="meta-item"><div class="meta-label">Obligations</div><div class="meta-val">' + fmt(p.upcomingObligationsCents) + '</div></div>' +
        '<div class="meta-item"><div class="meta-label">Reserves</div><div class="meta-val">' + fmt(p.reservedBucketsCents + p.oopsBufferCents) + '</div></div>' +
      '</div>' +
      moveHtml;
  }

  function renderWeather() {
    var host = $('weather-ribbon');
    if (!host) return;
    var cells = E.cashflowForecast14(data, today(), 14);
    var hasStorm = cells.some(function (c) { return c.level === 'over'; });
    var tag = $('weather-status-tag');
    if (tag) {
      tag.textContent = hasStorm ? 'Deficit Valley Alert' : 'Nominal 14-Day Horizon';
      tag.className = 'tag ' + (hasStorm ? 'warn' : 'ok');
    }
    host.innerHTML = cells.map(function (c) {
      var marker = c.isPayday ? '★ Inflow' : (c.outflowCents > 0 ? fmt(c.outflowCents) : 'Nominal');
      return '<div class="weather-cell lv-' + esc(c.level) + '">' +
        '<strong>' + esc(c.dayShort) + '</strong>' +
        '<div>' + esc(c.date.slice(5)) + '</div>' +
        '<div style="font-weight:700;margin-top:2px;">' + esc(marker) + '</div>' +
      '</div>';
    }).join('');
  }

  function renderPulseBills() {
    var host = $('pulse-bills-list');
    if (!host) return;
    var bills = (data.bills || []).slice().sort(function (a, b) { return String(a.due).localeCompare(String(b.due)); });
    if (!bills.length) {
      host.innerHTML =
        '<div class="empty">' +
          '<strong>Zero fixed obligations registered.</strong>' +
          'Add recurring obligations to lock required capital before discretionary calculation.' +
          '<div class="row-actions" style="justify-content:center;margin-top:10px;">' +
            '<button class="btn btn-primary btn-sm" type="button" data-open-modal="modal-add-bill">+ Add Obligation</button>' +
            '<button class="btn btn-secondary btn-sm" type="button" data-act="load-sample">🌱 Load Sample Data</button>' +
          '</div>' +
        '</div>';
      return;
    }
    host.innerHTML = bills.map(function (b) {
      var isPaid = b.status === 'paid';
      var effDue = b.weekendEarly ? E.adjustWeekendEarly(b.due) : b.due;
      return '<div class="row">' +
        '<div class="row-main">' +
          '<div class="row-title">' + esc(b.title) + ' ' + (b.weekendEarly ? '<span class="tag">Fri Shift</span>' : '') + '</div>' +
          '<div class="row-sub">' + esc(isPaid ? ('Settled ' + b.paidAt) : (E.dueLabel(effDue, today()) + ' · ' + E.prettyDate(effDue))) + '</div>' +
        '</div>' +
        '<div style="font-weight:800;">' + fmt(b.amountCents) + '</div>' +
        '<div class="row-actions" style="margin-top:0;">' +
          '<button class="btn btn-sm ' + (isPaid ? 'btn-ghost' : 'btn-secondary') + '" type="button" data-act="' + (isPaid ? 'reopen-bill' : 'pay-bill') + '" data-id="' + esc(b.id) + '">' + (isPaid ? '↺ Reopen' : '✓ Settled') + '</button>' +
          '<button class="btn btn-sm btn-ghost" type="button" data-act="del-bill" data-id="' + esc(b.id) + '">×</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function renderRecentTransactions() {
    var host = $('recent-tx-list');
    if (!host) return;
    var list = (data.transactions || []).slice(0, 8);
    if (!list.length) {
      host.innerHTML = '<div class="empty"><strong>Clean telemetry ledger.</strong>Use the Command Bar in the HUD to commit discretionary outflows.</div>';
      return;
    }
    host.innerHTML = list.map(function (tx) {
      var isInc = tx.kind === 'income';
      return '<div class="row">' +
        '<div class="row-main">' +
          '<div class="row-title">' + esc(tx.title) + '</div>' +
          '<div class="row-sub">' + esc(tx.category) + ' · ' + esc(E.prettyDate(tx.date)) + '</div>' +
        '</div>' +
        '<div style="font-weight:800;color:' + (isInc ? 'var(--ok)' : 'var(--text-main)') + ';">' + fmt(isInc ? tx.amountCents : -tx.amountCents, true) + '</div>' +
        '<button class="btn btn-sm btn-ghost" type="button" data-act="del-tx" data-id="' + esc(tx.id) + '">×</button>' +
      '</div>';
    }).join('');
  }

  function renderWaterfall() {
    var amtInput = $('pay-amount');
    var cents = amtInput ? E.parseCents(amtInput.value) : data.settings.defaultPaycheckCents;
    if (cents <= 0) cents = data.settings.defaultPaycheckCents || 240000;
    var pulse = E.financePulse(data, today());
    var split = E.splitPaycheck(cents, selectedPreset, pulse.upcomingObligationsCents);

    var chips = document.querySelectorAll('#pay-preset-chips .chip');
    for (var i = 0; i < chips.length; i++) {
      chips[i].classList.toggle('selected', chips[i].getAttribute('data-preset') === selectedPreset);
    }

    var preview = $('autopilot-preview');
    if (preview) {
      preview.innerHTML =
        '<div class="split-box">' +
          '<div class="split-box-title">Vector 1 · Fixed Obligations (' + split.billsPct + '%)</div>' +
          '<div class="split-box-amt">' + fmt(split.billsCents) + '</div>' +
          '<div class="row-sub">' + (split.coversUpcomingBills ? 'Covers ' + fmt(split.upcomingBillsCents) + ' upcoming obligations' : 'Deficit ' + fmt(split.billGapCents) + ' vs upcoming obligations') + '</div>' +
        '</div>' +
        '<div class="split-box">' +
          '<div class="split-box-title">Vector 2 · Capital Reserves (' + split.bucketsPct + '%)</div>' +
          '<div class="split-box-amt">' + fmt(split.bucketsCents) + '</div>' +
          '<div class="row-sub">Injected across sinking reserve modules</div>' +
        '</div>' +
        '<div class="split-box">' +
          '<div class="split-box-title">Vector 3 · Liquidity Buffer (' + split.bufferPct + '%)</div>' +
          '<div class="split-box-amt">' + fmt(split.bufferCents) + '</div>' +
          '<div class="row-sub">Runway extension &amp; variance shield</div>' +
        '</div>' +
        '<div class="split-box">' +
          '<div class="split-box-title">Vector 4 · Discretionary Pool (' + split.dopaminePct + '%)</div>' +
          '<div class="split-box-amt">' + fmt(split.dopamineCents) + '</div>' +
          '<div class="row-sub">Cleared for immediate discretionary velocity</div>' +
        '</div>';
    }

    var hist = $('paycheck-history-list');
    if (hist) {
      if (!data.paychecks || !data.paychecks.length) {
        hist.innerHTML = '<div class="empty"><strong>No waterfall executions recorded.</strong>Click Execute Waterfall Split above to allocate an inflow.</div>';
      } else {
        hist.innerHTML = data.paychecks.map(function (p) {
          return '<div class="row">' +
            '<div class="row-main">' +
              '<div class="row-title">' + esc(p.label) + ' (' + fmt(p.amountCents) + ')</div>' +
              '<div class="row-sub">' + esc(E.prettyDate(p.date)) + ' · Obligations ' + fmt(p.billsCents) + ' · Reserves ' + fmt(p.bucketsCents) + ' · Buffer ' + fmt(p.bufferCents) + ' · Discretionary ' + fmt(p.dopamineCents) + '</div>' +
            '</div>' +
          '</div>';
        }).join('');
      }
    }
  }

  // ---------- 4-Lane Kanban Subscription Burn Matrix (Exclusive to Edition 2) ----------
  function renderBurnMatrix() {
    var tax = E.adhdTaxSummary(data, today());
    var trophy = $('radar-trophy-card');
    if (trophy) {
      trophy.innerHTML =
        '<div class="hero-eyebrow"><span>Annual Reclaimed ADHD Tax Capital</span><span>' + E.plural(tax.cancelledCount, 'drain') + ' terminated</span></div>' +
        '<div class="hero-amount" style="color:var(--accent);">' + fmt(tax.savedAnnualCents) + '<span style="font-size:1rem;font-weight:700;color:var(--text-muted);"> / year reclaimed</span></div>' +
        '<div class="row-sub">Active burn rate: ' + fmt(tax.activeMonthlyCents) + '/mo (' + fmt(tax.activeAnnualCents) + '/yr) · ' + E.plural(tax.trialAlertCount, 'trial / cancel-by alert') + '</div>';
    }

    var board = $('burn-kanban-board');
    if (board) {
      var lanes = [
        { key: 'warning', title: '1. Trial & Cancel-By Alerts' },
        { key: 'soon', title: '2. Renewing <= 7 Days' },
        { key: 'active', title: '3. Active Recurring Stack' },
        { key: 'cancelled', title: '4. Terminated (Reclaimed)' }
      ];
      board.innerHTML = lanes.map(function (ln) {
        var items = (data.subscriptions || []).filter(function (s) {
          return E.subscriptionBucket(s, today()) === ln.key;
        });
        var cards = items.length ? items.map(function (s) {
          var ann = E.annualCostCents(s);
          var cBy = E.cancelByDate(s, today());
          var btn = s.status === 'cancelled'
            ? '<button class="btn btn-sm btn-ghost" type="button" data-act="reactivate-sub" data-id="' + esc(s.id) + '">↺ Restore</button>'
            : '<button class="btn btn-sm btn-primary" type="button" data-act="cancel-sub" data-id="' + esc(s.id) + '">Kill (+' + fmt(ann) + '/yr)</button>';
          return '<div class="row">' +
            '<div class="row-main">' +
              '<div class="row-title">' + esc(s.name) + '</div>' +
              '<div class="row-sub">' + fmt(s.amountCents) + ' ' + esc(s.cycle) + ' (' + fmt(ann) + '/yr) · Cancel by ' + esc(E.prettyDate(cBy)) + '</div>' +
            '</div>' +
            '<div class="row-actions" style="margin-top:0;">' +
              btn +
              '<button class="btn btn-sm btn-ghost" type="button" data-act="del-sub" data-id="' + esc(s.id) + '">×</button>' +
            '</div>' +
          '</div>';
        }).join('') : '<div class="empty">Empty lane</div>';

        return '<div class="kanban-lane">' +
          '<div class="kanban-lane-head"><span>' + esc(ln.title) + '</span><span class="tag">' + items.length + '</span></div>' +
          cards +
        '</div>';
      }).join('');
    }

    var triageHost = $('triage-list');
    if (triageHost) {
      var cands = E.triageCandidates(data, today());
      if (!cands.length) {
        triageHost.innerHTML = '<div class="empty"><strong>Triage Desk Clear.</strong>Zero overdue obligations or expiring trial vectors.</div>';
      } else {
        triageHost.innerHTML = cands.map(function (c) {
          var nextDateDefault = E.addDays(today(), 7);
          return '<div class="row">' +
            '<div class="row-main">' +
              '<div class="row-title">' + esc(c.title) + ' <span class="tag warn">' + esc(c.badge) + '</span></div>' +
              '<div class="row-sub">' + fmt(c.amountCents) + ' · Target ' + esc(E.prettyDate(c.date)) + '</div>' +
            '</div>' +
            '<div class="row-actions" style="margin-top:0;">' +
              '<button class="btn btn-sm btn-primary" type="button" data-act="triage-cover" data-kind="' + esc(c.kind) + '" data-id="' + esc(c.id) + '">Cover / Settle</button>' +
              '<input id="triage-date-' + esc(c.id) + '" class="input" type="date" value="' + nextDateDefault + '" style="max-width:140px;" aria-label="Shift date">' +
              '<button class="btn btn-sm btn-secondary" type="button" data-act="triage-shift" data-kind="' + esc(c.kind) + '" data-id="' + esc(c.id) + '">Shift Date</button>' +
              '<button class="btn btn-sm btn-ghost" type="button" data-act="triage-cancel" data-kind="' + esc(c.kind) + '" data-id="' + esc(c.id) + '">Terminate</button>' +
            '</div>' +
          '</div>';
        }).join('');
      }
    }
  }

  function renderReserves() {
    var host = $('buckets-list');
    if (!host) return;
    var list = data.buckets || [];
    if (!list.length) {
      host.innerHTML =
        '<div class="empty">' +
          '<strong>No Capital Reserve Modules deployed.</strong>' +
          'Deploy sinking reserve modules for annual renewals, vehicle maintenance, or tax shields.' +
          '<div class="row-actions" style="justify-content:center;margin-top:10px;">' +
            '<button class="btn btn-primary btn-sm" type="button" data-open-modal="modal-add-bucket">+ Deploy First Module</button>' +
            '<button class="btn btn-secondary btn-sm" type="button" data-act="load-sample">🌱 Load Sample Data</button>' +
          '</div>' +
        '</div>';
      return;
    }
    host.innerHTML = list.map(function (b) {
      var pct = E.bucketProgress(b);
      return '<div class="row" style="flex-direction:column;align-items:stretch;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">' +
          '<div>' +
            '<div class="row-title">' + esc(b.name) + ' ' + (b.autoHold ? '<span class="tag ok">Locked (' + fmt(b.monthlyHoldCents) + '/pay)</span>' : '') + '</div>' +
            '<div class="row-sub">' + fmt(b.savedCents) + ' / ' + fmt(b.targetCents) + ' (' + pct + '%)</div>' +
          '</div>' +
          '<div class="row-actions" style="margin-top:0;">' +
            '<button class="btn btn-sm btn-secondary" type="button" data-act="fund-bucket" data-id="' + esc(b.id) + '" data-cents="2500">+$25</button>' +
            '<button class="btn btn-sm btn-secondary" type="button" data-act="fund-bucket" data-id="' + esc(b.id) + '" data-cents="10000">+$100</button>' +
            '<button class="btn btn-sm btn-ghost" type="button" data-act="fund-bucket" data-id="' + esc(b.id) + '" data-cents="-2500">-$25</button>' +
            '<button class="btn btn-sm btn-ghost" type="button" data-act="del-bucket" data-id="' + esc(b.id) + '">×</button>' +
          '</div>' +
        '</div>' +
        '<div class="progress"><i style="width:' + pct + '%;background:' + esc(b.color || 'var(--accent)') + '"></i></div>' +
      '</div>';
    }).join('');
  }

  function renderNetWorth() {
    var nw = E.netWorthSummary(data);
    var sumHost = $('wealth-summary-card');
    if (sumHost) {
      sumHost.innerHTML =
        '<div class="hero-eyebrow"><span>Sovereign Balance Sheet &amp; Runway</span><span>Floor: ' + fmt(nw.survivalFloorCents) + '/mo</span></div>' +
        '<div class="hero-amount">' + fmt(nw.netWorthCents) + '</div>' +
        '<div class="hero-sub">Autonomous Runway: <strong>' + E.plural(nw.runwayDays, 'day') + '</strong> (' + nw.runwayMonths + ' months of baseline operations covered)</div>' +
        '<div class="hero-meta-grid">' +
          '<div class="meta-item"><div class="meta-label">Liquid Cash</div><div class="meta-val">' + fmt(nw.checkingCents + nw.savingsCents) + '</div></div>' +
          '<div class="meta-item"><div class="meta-label">Reserve Modules</div><div class="meta-val">' + fmt(nw.bucketsSavedCents) + '</div></div>' +
          '<div class="meta-item"><div class="meta-label">Liabilities</div><div class="meta-val">' + fmt(nw.totalDebtsCents) + '</div></div>' +
        '</div>';
    }

    var acctHost = $('accounts-list');
    if (acctHost) {
      acctHost.innerHTML = (data.accounts || []).map(function (a) {
        var eff = E.effectiveAccountBalanceCents(a, data.transactions);
        var typeTag = a.type === 'debt' ? '<span class="tag warn">Liability</span>' : '<span class="tag ok">' + esc(a.type) + '</span>';
        return '<div class="row">' +
          '<div class="row-main">' +
            '<div class="row-title">' + esc(a.name) + ' ' + typeTag + '</div>' +
            '<div class="row-sub">Snapshot ' + esc(E.prettyDate(a.balanceAsOf)) + '</div>' +
          '</div>' +
          '<div style="font-weight:800;">' + fmt(eff) + '</div>' +
          (a.id !== 'acct_main' ? '<button class="btn btn-sm btn-ghost" type="button" data-act="del-acct" data-id="' + esc(a.id) + '">×</button>' : '') +
        '</div>';
      }).join('');
    }
  }

  function renderSettings() {
    var s = data.settings;
    if ($('set-sound')) $('set-sound').checked = !!s.sound;
    if ($('set-next-payday')) $('set-next-payday').value = s.nextPayday;
    if ($('set-survival')) $('set-survival').value = (s.monthlySurvivalCents / 100).toFixed(0);
    if ($('set-oops')) $('set-oops').value = (s.oopsBufferCents / 100).toFixed(0);
    if ($('set-currency')) $('set-currency').value = s.currency || 'USD';

    var host = $('theme-picker');
    if (host) {
      var curTheme = s.theme || CFG.themes[0].id;
      host.innerHTML = CFG.themes.map(function (t) {
        return '<button type="button" class="chip ' + (t.id === curTheme ? 'selected' : '') + '" data-act="theme" data-theme-id="' + esc(t.id) + '">' + esc(t.label) + '</button>';
      }).join('');
    }
  }

  function renderTelemetryBar() {
    var p = E.financePulse(data, today());
    var tax = E.adhdTaxSummary(data, today());
    if ($('badge-tax-saved')) $('badge-tax-saved').textContent = fmt(tax.savedAnnualCents) + '/yr saved';
    if ($('stat-checking')) $('stat-checking').textContent = fmt(p.checkingCents);
    if ($('stat-promised')) $('stat-promised').textContent = fmt(p.promisedCents);
    if ($('stat-runway')) $('stat-runway').textContent = E.plural(p.runwayDays, 'day');
    if ($('stat-daily')) $('stat-daily').textContent = fmt(p.leftTodayCents);

    document.body.classList.toggle('fog', !!data.settings.fog);
    var fb = $('btn-toggle-fog');
    if (fb) {
      fb.setAttribute('aria-pressed', data.settings.fog ? 'true' : 'false');
      fb.textContent = data.settings.fog ? 'Shield: ON' : 'Burnout Shield';
    }
    document.body.setAttribute('data-theme', data.settings.theme || CFG.themes[0].id);
  }

  function renderAll() {
    renderTelemetryBar();
    renderHero();
    renderWeather();
    renderPulseBills();
    renderRecentTransactions();
    renderWaterfall();
    renderBurnMatrix();
    renderReserves();
    renderNetWorth();
    renderSettings();
  }

  function quickLogSpend() {
    var titleInput = $('qa-spend-title');
    var amtInput = $('qa-spend-amount');
    var title = titleInput ? titleInput.value.trim() : '';
    var cents = amtInput ? E.parseCents(amtInput.value) : 650;
    if (!title) title = 'Discretionary Outflow';
    if (cents <= 0) { toast('Enter a positive dollar amount.'); return; }
    var tx = S.logTransaction(data, {
      title: title,
      amountCents: cents,
      kind: 'spend',
      category: 'Discretionary',
      date: today()
    });
    if (tx) {
      if (titleInput) titleInput.value = '';
      commit(); beep(720, 120); toast('Committed "' + tx.title + '" (' + fmt(tx.amountCents) + ').');
      T.emit('spend-logged');
      renderAll();
    }
  }

  function runAutopilot() {
    var lbl = $('pay-label') ? $('pay-label').value : 'Inflow';
    var cents = $('pay-amount') ? E.parseCents($('pay-amount').value) : 240000;
    if (cents <= 0) { toast('Enter a positive deposit amount.'); return; }
    data.settings.splitPreset = selectedPreset;
    var rec = S.applyPaycheckSplit(data, {
      label: lbl,
      amountCents: cents,
      preset: selectedPreset,
      date: today()
    });
    if (rec) {
      commit(); beep(820, 160); toast('Executed 4-vector waterfall on ' + fmt(rec.amountCents) + '!');
      T.emit('autopilot-applied');
      renderAll();
    }
  }

  function handleAction(node) {
    var act = node.getAttribute('data-act');
    var id = node.getAttribute('data-id');
    switch (act) {
      case 'load-sample': loadSampleData(); break;
      case 'pay-bill':
        if (S.markBillPaid(data, id, today())) { commit(); beep(760, 130); toast('Obligation settled.'); renderAll(); }
        break;
      case 'reopen-bill':
        if (S.reopenBill(data, id)) { commit(); toast('Obligation reopened.'); renderAll(); }
        break;
      case 'del-bill': S.deleteBill(data, id); commit(); toast('Obligation removed.'); renderAll(); break;
      case 'del-tx': S.deleteTransaction(data, id); commit(); toast('Entry deleted.'); renderAll(); break;
      case 'cancel-sub':
        if (S.cancelSubscription(data, id, today())) { commit(); beep(880, 190); toast('Drain terminated! Capital reclaimed.'); renderAll(); }
        break;
      case 'reactivate-sub':
        if (S.reactivateSubscription(data, id)) { commit(); toast('Subscription restored.'); renderAll(); }
        break;
      case 'del-sub': S.deleteSubscription(data, id); commit(); toast('Subscription deleted.'); renderAll(); break;
      case 'fund-bucket': {
        var delta = parseInt(node.getAttribute('data-cents'), 10) || 2500;
        S.fundBucket(data, id, delta); commit(); beep(740, 110); toast('Reserve module updated.'); renderAll();
        break;
      }
      case 'del-bucket': S.deleteBucket(data, id); commit(); toast('Reserve module removed.'); renderAll(); break;
      case 'del-acct': S.deleteAccount(data, id); commit(); toast('Account node removed.'); renderAll(); break;
      case 'triage-cover':
        S.triageItem(data, node.getAttribute('data-kind'), id, 'cover', today());
        commit(); beep(760, 120); toast('Vector settled.'); renderAll();
        break;
      case 'triage-shift': {
        var dInp = $('triage-date-' + id);
        if (dInp && S.triageItem(data, node.getAttribute('data-kind'), id, 'reschedule', dInp.value)) {
          commit(); toast('Shifted to ' + E.prettyDate(dInp.value) + '.'); renderAll();
        } else {
          toast('Select a valid date.');
        }
        break;
      }
      case 'triage-cancel':
        S.triageItem(data, node.getAttribute('data-kind'), id, 'cancel', today());
        commit(); beep(860, 160); toast('Vector terminated!'); renderAll();
        break;
      case 'theme':
        data.settings.theme = node.getAttribute('data-theme-id');
        commit(); renderAll();
        break;
      default: break;
    }
  }

  function wire() {
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || !t.closest) return;

      var closer = t.closest('[data-close-modal]');
      if (closer) { closeModal(closer.getAttribute('data-close-modal')); return; }

      var opener = t.closest('[data-open-modal]');
      if (opener) { openModal(opener.getAttribute('data-open-modal')); return; }

      if (t.classList && t.classList.contains('app-modal')) { closeModal(t.id); return; }

      var navBtn = t.closest('.nav-btn');
      if (navBtn) { switchTab(navBtn.getAttribute('data-tab')); return; }

      var amtChip = t.closest('#qa-amount-chips .chip');
      if (amtChip) {
        var c = parseInt(amtChip.getAttribute('data-cents'), 10) || 650;
        if ($('qa-spend-amount')) $('qa-spend-amount').value = (c / 100).toFixed(2);
        if ($('qa-spend-title') && !$('qa-spend-title').value.trim()) {
          $('qa-spend-title').value = amtChip.getAttribute('data-label') || '';
        }
        var allAmt = document.querySelectorAll('#qa-amount-chips .chip');
        for (var i = 0; i < allAmt.length; i++) allAmt[i].classList.toggle('selected', allAmt[i] === amtChip);
        return;
      }

      var presetChip = t.closest('#pay-preset-chips .chip');
      if (presetChip) {
        selectedPreset = presetChip.getAttribute('data-preset') || 'balanced';
        renderWaterfall();
        return;
      }

      var actNode = t.closest('[data-act]');
      if (actNode) {
        e.stopPropagation();
        handleAction(actNode);
      }
    });

    if ($('btn-qa-spend')) $('btn-qa-spend').addEventListener('click', quickLogSpend);
    if ($('qa-spend-title')) {
      $('qa-spend-title').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') quickLogSpend();
      });
    }
    if ($('pay-amount')) $('pay-amount').addEventListener('input', renderWaterfall);
    if ($('btn-run-autopilot')) $('btn-run-autopilot').addEventListener('click', runAutopilot);

    if ($('btn-toggle-fog')) {
      $('btn-toggle-fog').addEventListener('click', function () {
        data.settings.fog = !data.settings.fog;
        commit(); renderAll(); T.emit('fog-toggled');
      });
    }

    if ($('btn-launch-tour')) {
      $('btn-launch-tour').addEventListener('click', function () { T.start(); });
    }

    if ($('btn-save-bill')) {
      $('btn-save-bill').addEventListener('click', function () {
        var b = S.addBill(data, {
          title: $('bill-title').value,
          amountCents: E.parseCents($('bill-amount').value),
          due: $('bill-due').value,
          weekendEarly: $('bill-weekend').checked
        });
        if (!b) { $('bill-error').textContent = 'Enter a valid title, amount, and due date.'; return; }
        commit(); closeModal('modal-add-bill'); toast('Obligation registered.'); renderAll();
      });
    }

    if ($('btn-save-sub')) {
      $('btn-save-sub').addEventListener('click', function () {
        var s = S.addSubscription(data, {
          name: $('sub-name').value,
          amountCents: E.parseCents($('sub-amount').value),
          cycle: $('sub-cycle').value,
          nextDate: $('sub-next-date').value,
          leadDays: parseInt($('sub-lead-days').value, 10) || 3,
          isTrial: $('sub-is-trial').checked
        });
        if (!s) { $('sub-error').textContent = 'Enter a valid service name, cost, and renewal date.'; return; }
        commit(); closeModal('modal-add-sub'); toast('Subscription registered.'); renderAll();
      });
    }

    if ($('btn-save-bucket')) {
      $('btn-save-bucket').addEventListener('click', function () {
        var bk = S.addBucket(data, {
          name: $('bucket-name').value,
          targetCents: E.parseCents($('bucket-target').value),
          savedCents: E.parseCents($('bucket-saved').value),
          monthlyHoldCents: E.parseCents($('bucket-hold').value),
          autoHold: $('bucket-autohold').checked
        });
        if (!bk) { $('bucket-error').textContent = 'Enter a reserve name and target cap.'; return; }
        commit(); closeModal('modal-add-bucket'); toast('Reserve module deployed.'); renderAll();
      });
    }

    if ($('btn-sync-balance')) {
      $('btn-sync-balance').addEventListener('click', function () {
        var raw = $('sync-balance-input').value;
        if (raw === '') { toast('Enter current checking balance first.'); return; }
        S.setAccountBalance(data, 'acct_main', E.parseCents(raw), today());
        $('sync-balance-input').value = '';
        commit(); beep(760, 140); toast('Checking snapshot synced without double-counting!'); renderAll();
      });
    }

    if ($('btn-add-account')) {
      $('btn-add-account').addEventListener('click', function () {
        var a = S.addAccount(data, {
          name: $('new-acct-name').value,
          type: $('new-acct-type').value,
          balanceCents: E.parseCents($('new-acct-bal').value)
        }, today());
        if (!a) { toast('Enter a node name first.'); return; }
        $('new-acct-name').value = '';
        $('new-acct-bal').value = '0';
        commit(); toast('Account node added.'); renderAll();
      });
    }

    if ($('btn-save-settings')) {
      $('btn-save-settings').addEventListener('click', function () {
        if (E.isValidDate($('set-next-payday').value)) data.settings.nextPayday = $('set-next-payday').value;
        data.settings.monthlySurvivalCents = Math.max(10000, E.parseCents($('set-survival').value));
        data.settings.oopsBufferCents = Math.max(0, E.parseCents($('set-oops').value));
        data.settings.currency = $('set-currency').value || 'USD';
        commit(); toast('Parameters committed.'); renderAll();
      });
    }

    if ($('set-sound')) {
      $('set-sound').addEventListener('change', function () {
        data.settings.sound = $('set-sound').checked;
        commit();
      });
    }

    if ($('btn-clean-slate')) {
      $('btn-clean-slate').addEventListener('click', function () {
        setCleanSlateState(true);
        toast('Clean slate initialized.');
      });
    }

    if ($('btn-load-sample')) {
      $('btn-load-sample').addEventListener('click', loadSampleData);
    }

    if ($('btn-restart-tour')) {
      $('btn-restart-tour').addEventListener('click', function () {
        switchTab('cockpit');
        T.start();
      });
    }

    if ($('btn-export-json')) {
      $('btn-export-json').addEventListener('click', function () {
        var blob = new Blob([S.exportJSON(data)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'adhd-finance-planner-2-backup-' + today() + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 500);
        toast('Snapshot exported.');
      });
    }

    if ($('btn-import-json')) {
      $('btn-import-json').addEventListener('click', function () {
        if ($('file-import')) $('file-import').click();
      });
    }

    if ($('file-import')) {
      $('file-import').addEventListener('change', function (e) {
        var f = e.target.files && e.target.files[0];
        if (!f) return;
        var reader = new FileReader();
        reader.onload = function () {
          try {
            data = S.importJSON(String(reader.result), today());
            commit(); renderAll(); toast('Snapshot restored.');
          } catch (err) {
            toast('Invalid backup file.');
          }
        };
        reader.readAsText(f);
        e.target.value = '';
      });
    }

    if ($('btn-reset-data')) {
      $('btn-reset-data').addEventListener('click', function () {
        askConfirm('Purge all financial telemetry on this device and reset to a clean slate?', function () {
          setCleanSlateState(true);
          toast('All data purged.');
        });
      });
    }

    if ($('btn-confirm-yes')) {
      $('btn-confirm-yes').addEventListener('click', function () {
        var fn = confirmAction;
        confirmAction = null;
        closeModal('modal-confirm');
        if (fn) fn();
      });
    }
  }

  function init() {
    try {
      wire();
      switchTab(CFG.defaultTab);
    } catch (err) {
      console.error('Init render warning:', err);
    }

    T.init({
      config: CFG,
      switchTab: switchTab,
      onEnd: function () {
        setCleanSlateState(false);
        data.settings.onboarded = true;
        commit();
        switchTab(CFG.defaultTab);
      }
    });

    if (!data.settings.onboarded) {
      setTimeout(function () {
        if (!T.isActive()) T.start();
      }, 450);
    }

    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.register('sw.js').then(function (reg) {
        if (reg && typeof reg.update === 'function') reg.update();
      }).catch(function () {});
    }
  }

  window.FPApp = {
    getData: function () { return data; },
    commit: commit,
    renderAll: renderAll,
    setCleanSlateState: setCleanSlateState
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
