/**
 * Invoice Planner 2 — Edition 2 UI Controller (Nordic Focus Systems / Chloe).
 * Split-Cockpit Telemetry HUD, 4-Lane AR Aging Kanban Matrix, 4-Vector Payout Waterfall & Nudge Desk.
 * Enforces Rules 01-23 (try/catch init isolation, post-tour clean slate, data-active-tab binding, zero undefined).
 */
(function () {
  'use strict';

  var E = window.IPEngine;
  var S = window.IPStorage;
  var CFG = window.IPConfig;
  var T = window.IPTutorial;

  function today() { return E.todayStr(new Date()); }

  var rawStored = null;
  try { rawStored = window.localStorage.getItem(CFG.storageKey); } catch (e) {}
  var data = S.load(window.localStorage, CFG.storageKey, today());

  if (!rawStored && !data.settings.onboarded) {
    data = S.getSampleData(today());
    data.settings.onboarded = false;
  }

  var activeTab = CFG.defaultTab;
  var selectedPreset = data.settings.payoutPreset || 'standard';
  var selectedTone = 'warm';
  var selectedFollowupId = '';
  var previewInvoiceId = '';
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
      o.frequency.value = freq || 680;
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
    toast('Sample AR telemetry loaded.');
  }

  // ---------- Navigation (Rule-11, Rule-15) ----------
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
    if (id === 'modal-add-invoice') {
      $('inv-client').value = '';
      $('inv-title').value = '';
      $('inv-amount').value = '850.00';
      $('inv-terms').value = data.settings.defaultTerms || 'net14';
      $('inv-tax').value = '0';
      $('inv-discount').value = '0';
      $('inv-deposit').value = '0';
      $('inv-status').value = 'sent';
      $('inv-weekend').checked = true;
      $('inv-error').textContent = '';
    } else if (id === 'modal-add-retainer') {
      $('ret-client').value = '';
      $('ret-title').value = '';
      $('ret-amount').value = '950.00';
      $('ret-cycle').value = 'monthly';
      $('ret-next-date').value = E.addDays(today(), 14);
      $('ret-error').textContent = '';
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

  function openInvoicePreview(id) {
    var inv = S.findInvoice(data, id);
    if (!inv) return;
    previewInvoiceId = inv.id;
    var totals = E.calculateInvoiceTotals(inv);
    var effDue = inv.weekendEarly ? E.adjustWeekendEarly(inv.dueDate) : inv.dueDate;
    var itemsRows = (inv.items || []).map(function (it) {
      var line = E.clampNum(it.qty, 1, 10000, 1) * E.clampNum(it.unitCents, 0, 1000000000, 0);
      return '<tr><td>' + esc(it.desc) + '</td><td>' + it.qty + '</td><td>' + fmt(it.unitCents) + '</td><td style="text-align:right;font-weight:700;">' + fmt(line) + '</td></tr>';
    }).join('');

    var host = $('invoice-preview-body');
    if (host) {
      host.innerHTML =
        '<div class="invoice-preview-head">' +
          '<div>' +
            '<div style="font-size:0.75rem;font-weight:800;text-transform:uppercase;color:var(--accent);">' + esc(data.settings.businessName || 'Nordic Focus Studio') + '</div>' +
            '<div style="font-size:1.15rem;font-weight:900;">Invoice ' + esc(inv.number) + '</div>' +
            '<div class="row-sub">Client: <strong>' + esc(inv.client) + '</strong> · ' + esc(inv.title) + '</div>' +
          '</div>' +
          '<div style="text-align:right;">' +
            '<span class="tag ' + (inv.status === 'paid' ? 'ok' : 'warn') + '">' + esc(inv.status.toUpperCase()) + '</span>' +
            '<div class="row-sub" style="margin-top:4px;">Issued: ' + esc(E.prettyDate(inv.issueDate)) + '</div>' +
            '<div class="row-sub">Due: <strong>' + esc(E.prettyDate(effDue)) + '</strong></div>' +
          '</div>' +
        '</div>' +
        '<table class="invoice-preview-table">' +
          '<thead><tr><th>Deliverable / Line Item</th><th>Qty</th><th>Rate</th><th style="text-align:right;">Total</th></tr></thead>' +
          '<tbody>' + itemsRows + '</tbody>' +
        '</table>' +
        '<div style="display:flex;justify-content:space-between;font-size:0.82rem;margin-top:6px;"><span>Subtotal:</span><strong>' + fmt(totals.subtotalCents) + '</strong></div>' +
        (totals.discountCents > 0 ? '<div style="display:flex;justify-content:space-between;font-size:0.82rem;"><span>Discount (' + totals.discountPct + '%):</span><strong>-' + fmt(totals.discountCents) + '</strong></div>' : '') +
        (totals.taxCents > 0 ? '<div style="display:flex;justify-content:space-between;font-size:0.82rem;"><span>Tax (' + totals.taxPct + '%):</span><strong>+' + fmt(totals.taxCents) + '</strong></div>' : '') +
        (totals.paidCents > 0 && inv.status !== 'paid' ? '<div style="display:flex;justify-content:space-between;font-size:0.82rem;"><span>Deposit Settled:</span><strong>-' + fmt(totals.paidCents) + '</strong></div>' : '') +
        '<div style="display:flex;justify-content:space-between;font-size:1rem;font-weight:900;color:var(--accent);border-top:1px solid var(--border);padding-top:8px;margin-top:8px;">' +
          '<span>Balance Due:</span><span>' + fmt(totals.balanceDueCents) + '</span>' +
        '</div>';
    }
    openModal('modal-preview-invoice');
  }

  // ---------- Rendering ----------
  function renderHero() {
    var host = $('hero-pulse');
    if (!host) return;
    var p = E.invoicePulse(data, today());
    var move = E.nextBillingMove(data, today());

    var moveHtml = '';
    if (move) {
      var actBtns = move.status === 'draft'
        ? '<button class="btn btn-sm btn-primary" type="button" data-act="send-inv" data-id="' + esc(move.id) + '">Deploy (' + fmt(move.balanceDueCents) + ')</button>'
        : '<div class="row-actions" style="margin-top:0;">' +
            '<button class="btn btn-sm btn-primary" type="button" data-act="pay-inv" data-id="' + esc(move.id) + '">✓ Settle (' + fmt(move.balanceDueCents) + ')</button>' +
            '<button class="btn btn-sm btn-secondary" type="button" data-act="nudge-inv" data-id="' + esc(move.id) + '">✉ Dispatch</button>' +
          '</div>';
      moveHtml =
        '<div class="next-move-box">' +
          '<div>' +
            '<span class="tag warn">' + esc(move.badge) + '</span>' +
            '<div class="next-move-title" style="margin-top:4px;">Priority Vector: ' + esc(move.number) + ' · ' + esc(move.client) + '</div>' +
            '<div class="row-sub">' + fmt(move.balanceDueCents) + ' · target ' + esc(E.prettyDate(move.dueDate)) + '</div>' +
          '</div>' +
          actBtns +
        '</div>';
    } else {
      moveHtml =
        '<div class="next-move-box">' +
          '<div>' +
            '<span class="tag ok">Zero Alerts</span>' +
            '<div class="next-move-title" style="margin-top:4px;">All AR vectors and retainers nominal.</div>' +
            '<div class="row-sub">Deploy a new invoice or load sample telemetry below.</div>' +
          '</div>' +
          '<div class="row-actions" style="margin-top:0;">' +
            '<button class="btn btn-sm btn-primary" type="button" data-open-modal="modal-add-invoice">+ Deploy</button>' +
            '<button class="btn btn-sm btn-secondary" type="button" data-act="load-sample">🌱 Sample</button>' +
          '</div>' +
        '</div>';
    }

    var subline = p.overdueCount > 0
      ? 'Action Required: ' + E.plural(p.overdueCount, 'overdue vector') + ' (' + fmt(p.overdueCents) + '). Execute Nudge Desk dispatch.'
      : 'Settled Capital: ' + fmt(p.collectedCents) + ' (' + p.targetProgressPct + '% of ' + fmt(p.monthlyTargetCents) + ' target) · Retainers: ' + fmt(p.monthlyRecurringCents) + '/mo.';

    host.innerHTML =
      '<div class="hero-eyebrow">' +
        '<span>Active AR &amp; Unbilled Velocity Pool</span>' +
        '<span>Yield: ' + p.collectionRatePct + '%</span>' +
      '</div>' +
      '<div class="hero-amount">' + fmt(p.readyPipelineCents) + '</div>' +
      '<div class="hero-sub">' + esc(subline) + '</div>' +
      '<div class="hero-meta-grid">' +
        '<div class="meta-item"><div class="meta-label">Awaiting AR</div><div class="meta-val">' + fmt(p.awaitingCents) + '</div></div>' +
        '<div class="meta-item"><div class="meta-label">Unbilled</div><div class="meta-val">' + fmt(p.unbilledWorkCents + p.draftCents) + '</div></div>' +
        '<div class="meta-item"><div class="meta-label">Owner Cash</div><div class="meta-val">' + fmt(p.safeOwnerCashCents) + '</div></div>' +
      '</div>' +
      moveHtml;
  }

  function renderUnbilledWork() {
    var host = $('unbilled-work-list');
    if (!host) return;
    var list = (data.workItems || []).filter(function (w) { return w && !w.billed; });
    if (!list.length) {
      host.innerHTML =
        '<div class="empty">' +
          '<strong>Unbilled Work Queue is clear.</strong>' +
          'Use the Command Bar in the HUD to capture billable sprints and scope additions in 4 seconds.' +
          '<div class="row-actions" style="justify-content:center;margin-top:10px;">' +
            '<button class="btn btn-primary btn-sm" type="button" data-open-modal="modal-add-invoice">+ Deploy Invoice</button>' +
            '<button class="btn btn-secondary btn-sm" type="button" data-act="load-sample">🌱 Load Sample Data</button>' +
          '</div>' +
        '</div>';
      return;
    }
    host.innerHTML = list.map(function (w) {
      return '<div class="row">' +
        '<div class="row-main">' +
          '<div class="row-title">' + esc(w.title) + ' <span class="tag">' + esc(w.client) + '</span></div>' +
          '<div class="row-sub">Captured ' + esc(E.prettyDate(w.date)) + ' · Unbilled vector</div>' +
        '</div>' +
        '<div style="font-weight:800;">' + fmt(w.amountCents) + '</div>' +
        '<div class="row-actions" style="margin-top:0;">' +
          '<button class="btn btn-sm btn-primary" type="button" data-act="convert-work" data-id="' + esc(w.id) + '">⚡ Convert to Invoice</button>' +
          '<button class="btn btn-sm btn-ghost" type="button" data-act="del-work" data-id="' + esc(w.id) + '">×</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function renderWeather() {
    var host = $('weather-ribbon');
    if (!host) return;
    var cells = E.inflowForecast14(data, today(), 14);
    var total14 = cells.reduce(function (acc, c) { return acc + c.inflowCents; }, 0);
    var tag = $('weather-status-tag');
    if (tag) {
      tag.textContent = total14 > 0 ? (fmt(total14) + ' Expected in 14d') : 'Nominal 14-Day Horizon';
      tag.className = 'tag ' + (total14 > 0 ? 'ok' : '');
    }
    host.innerHTML = cells.map(function (c) {
      var marker = c.inflowCents > 0 ? fmt(c.inflowCents) : (c.hasRetainer ? '↻ Node' : 'Nominal');
      return '<div class="weather-cell lv-' + esc(c.level) + '">' +
        '<strong>' + esc(c.dayShort) + '</strong>' +
        '<div>' + esc(c.date.slice(5)) + '</div>' +
        '<div style="font-weight:700;margin-top:2px;">' + esc(marker) + '</div>' +
      '</div>';
    }).join('');
  }

  // ---------- 4-Lane Kanban Accounts Receivable Matrix (Exclusive to Edition 2) ----------
  function renderKanbanPipeline() {
    var board = $('ar-kanban-board');
    if (!board) return;
    var lanes = [
      { key: 'draft', title: '1. Draft Queue' },
      { key: 'sent', title: '2. Active Net-Terms' },
      { key: 'overdue', title: '3. Overdue Action' },
      { key: 'paid', title: '4. Settled Capital' }
    ];
    board.innerHTML = lanes.map(function (ln) {
      var items = (data.invoices || []).filter(function (inv) {
        return E.invoiceBucket(inv, today()) === ln.key;
      });
      var cards = items.length ? items.map(function (inv) {
        var totals = E.calculateInvoiceTotals(inv);
        var effDue = inv.weekendEarly ? E.adjustWeekendEarly(inv.dueDate) : inv.dueDate;
        var actBtn = '';
        if (ln.key === 'paid') {
          actBtn = '<button class="btn btn-sm btn-ghost" type="button" data-act="reopen-inv" data-id="' + esc(inv.id) + '">↺ Reopen</button>';
        } else if (ln.key === 'draft') {
          actBtn = '<button class="btn btn-sm btn-primary" type="button" data-act="send-inv" data-id="' + esc(inv.id) + '">Deploy</button>';
        } else {
          actBtn = '<button class="btn btn-sm btn-primary" type="button" data-act="pay-inv" data-id="' + esc(inv.id) + '">✓ Settle</button>';
        }
        return '<div class="row">' +
          '<div class="row-main">' +
            '<div class="row-title">' + esc(inv.number) + ' · ' + esc(inv.client) + '</div>' +
            '<div class="row-sub">' + esc(inv.title) + ' · ' + fmt(ln.key === 'paid' ? totals.totalCents : totals.balanceDueCents) + ' · Due ' + esc(E.prettyDate(effDue)) + '</div>' +
          '</div>' +
          '<div class="row-actions" style="margin-top:0;">' +
            actBtn +
            '<button class="btn btn-sm btn-secondary" type="button" data-act="preview-inv" data-id="' + esc(inv.id) + '">Preview</button>' +
            (ln.key !== 'paid' ? '<button class="btn btn-sm btn-ghost" type="button" data-act="nudge-inv" data-id="' + esc(inv.id) + '">✉</button>' : '') +
            '<button class="btn btn-sm btn-ghost" type="button" data-act="del-inv" data-id="' + esc(inv.id) + '">×</button>' +
          '</div>' +
        '</div>';
      }).join('') : '<div class="empty">Empty lane</div>';

      return '<div class="kanban-lane">' +
        '<div class="kanban-lane-head"><span>' + esc(ln.title) + '</span><span class="tag">' + items.length + '</span></div>' +
        cards +
      '</div>';
    }).join('');
  }

  function renderWaterfall() {
    var amtInput = $('pay-amount');
    var cents = amtInput ? E.parseCents(amtInput.value) : 160000;
    if (cents <= 0) cents = 160000;
    var split = E.splitPayout(cents, selectedPreset);

    var chips = document.querySelectorAll('#pay-preset-chips .chip');
    for (var i = 0; i < chips.length; i++) {
      chips[i].classList.toggle('selected', chips[i].getAttribute('data-preset') === selectedPreset);
    }

    var preview = $('payout-preview');
    if (preview) {
      preview.innerHTML =
        '<div class="split-box">' +
          '<div class="split-box-title">Vector 1 · Tax Shield Vault (' + split.taxPct + '%)</div>' +
          '<div class="split-box-amt">' + fmt(split.taxCents) + '</div>' +
          '<div class="row-sub">Isolated for quarterly tax obligations</div>' +
        '</div>' +
        '<div class="split-box">' +
          '<div class="split-box-title">Vector 2 · Operations &amp; Stack (' + split.opsPct + '%)</div>' +
          '<div class="split-box-amt">' + fmt(split.opsCents) + '</div>' +
          '<div class="row-sub">Infrastructure, software &amp; studio overhead</div>' +
        '</div>' +
        '<div class="split-box">' +
          '<div class="split-box-title">Vector 3 · Runway Buffer (' + split.bufferPct + '%)</div>' +
          '<div class="split-box-amt">' + fmt(split.bufferCents) + '</div>' +
          '<div class="row-sub">Liquidity extension &amp; variance shield</div>' +
        '</div>' +
        '<div class="split-box">' +
          '<div class="split-box-title">Vector 4 · Owner Take-Home (' + split.ownerPct + '%)</div>' +
          '<div class="split-box-amt">' + fmt(split.ownerCents) + '</div>' +
          '<div class="row-sub">Cleared for personal draw / distribution</div>' +
        '</div>';
    }

    var hist = $('payout-history-list');
    if (hist) {
      if (!data.payouts || !data.payouts.length) {
        hist.innerHTML = '<div class="empty"><strong>No waterfall executions recorded.</strong>Click Execute Payout Waterfall above when an invoice settles.</div>';
      } else {
        hist.innerHTML = data.payouts.map(function (p) {
          return '<div class="row">' +
            '<div class="row-main">' +
              '<div class="row-title">' + esc(p.label) + ' (' + fmt(p.amountCents) + ')</div>' +
              '<div class="row-sub">' + esc(E.prettyDate(p.date)) + ' · Tax ' + fmt(p.taxCents) + ' · Ops ' + fmt(p.opsCents) + ' · Buffer ' + fmt(p.bufferCents) + ' · Owner ' + fmt(p.ownerCents) + '</div>' +
            '</div>' +
          '</div>';
        }).join('');
      }
    }
  }

  function renderDispatch() {
    var sel = $('followup-invoice-select');
    var openInvs = (data.invoices || []).filter(function (inv) { return inv && inv.status !== 'paid'; });

    if (sel) {
      if (!openInvs.length) {
        sel.innerHTML = '<option value="">Zero open AR vectors</option>';
        selectedFollowupId = '';
      } else {
        if (!selectedFollowupId || !openInvs.some(function (x) { return x.id === selectedFollowupId; })) {
          selectedFollowupId = openInvs[0].id;
        }
        sel.innerHTML = openInvs.map(function (inv) {
          var t = E.calculateInvoiceTotals(inv);
          return '<option value="' + esc(inv.id) + '"' + (inv.id === selectedFollowupId ? ' selected' : '') + '>' +
            esc(inv.number) + ' — ' + esc(inv.client) + ' (' + fmt(t.balanceDueCents) + ')' +
          '</option>';
        }).join('');
      }
    }

    var toneChips = document.querySelectorAll('#followup-tone-chips .chip');
    for (var i = 0; i < toneChips.length; i++) {
      toneChips[i].classList.toggle('selected', toneChips[i].getAttribute('data-tone') === selectedTone);
    }

    var box = $('followup-script-box');
    if (box) {
      var targetInv = S.findInvoice(data, selectedFollowupId) || openInvs[0];
      if (targetInv) {
        box.value = E.generateFollowupScript(targetInv, selectedTone, cur(), data.settings.businessName);
      } else {
        box.value = 'All AR vectors settled. Deploy or select an open invoice to compile a dispatch.';
      }
    }

    var triageHost = $('triage-list');
    if (triageHost) {
      var cands = E.followupCandidates(data, today());
      if (!cands.length) {
        triageHost.innerHTML = '<div class="empty"><strong>Triage Desk Clear.</strong>Zero overdue or imminent invoice vectors.</div>';
      } else {
        var nextDateDefault = E.addDays(today(), 7);
        triageHost.innerHTML = cands.map(function (c) {
          return '<div class="row">' +
            '<div class="row-main">' +
              '<div class="row-title">' + esc(c.number) + ' · ' + esc(c.client) + ' <span class="tag warn">' + esc(c.badge) + '</span></div>' +
              '<div class="row-sub">' + esc(c.title) + ' · ' + fmt(c.balanceDueCents) + ' · Target ' + esc(E.prettyDate(c.dueDate)) + '</div>' +
            '</div>' +
            '<div class="row-actions" style="margin-top:0;">' +
              '<button class="btn btn-sm btn-primary" type="button" data-act="pay-inv" data-id="' + esc(c.id) + '">✓ Settle</button>' +
              '<input id="triage-date-' + esc(c.id) + '" class="input" type="date" value="' + nextDateDefault + '" style="max-width:140px;" aria-label="New due date">' +
              '<button class="btn btn-sm btn-secondary" type="button" data-act="shift-inv" data-id="' + esc(c.id) + '">Shift Date</button>' +
              '<button class="btn btn-sm btn-ghost" type="button" data-act="load-script" data-id="' + esc(c.id) + '" data-tone="' + esc(c.recommendedTone) + '">Compile Script</button>' +
            '</div>' +
          '</div>';
        }).join('');
      }
    }
  }

  function renderRetainers() {
    var retSum = E.retainerSummary(data, today());
    var pulse = E.invoicePulse(data, today());
    var sumHost = $('retainers-summary-card');
    if (sumHost) {
      sumHost.innerHTML =
        '<div class="hero-eyebrow"><span>Recurring Retainer Telemetry &amp; Treasury</span><span>' + E.plural(retSum.activeCount, 'active node') + '</span></div>' +
        '<div class="hero-amount">' + fmt(retSum.monthlyRecurringCents) + '<span style="font-size:1rem;font-weight:700;color:var(--text-muted);"> / mo recurring (' + fmt(retSum.annualRecurringCents) + '/yr)</span></div>' +
        '<div class="hero-meta-grid" style="margin-top:10px;margin-bottom:0;">' +
          '<div class="meta-item"><div class="meta-label">Business Checking</div><div class="meta-val">' + fmt(pulse.checkingCents) + '</div></div>' +
          '<div class="meta-item"><div class="meta-label">Tax Shield Vault</div><div class="meta-val">' + fmt(pulse.taxVaultCents) + '</div></div>' +
          '<div class="meta-item"><div class="meta-label">Net Owner Cash</div><div class="meta-val">' + fmt(pulse.safeOwnerCashCents) + '</div></div>' +
        '</div>';
    }

    var listHost = $('retainers-list');
    if (listHost) {
      var list = data.retainers || [];
      if (!list.length) {
        listHost.innerHTML =
          '<div class="empty">' +
            '<strong>Zero Retainer Nodes deployed.</strong>' +
            'Register recurring client retainers to generate cyclic invoices in 1 click.' +
            '<div class="row-actions" style="justify-content:center;margin-top:10px;">' +
              '<button class="btn btn-primary btn-sm" type="button" data-open-modal="modal-add-retainer">+ Register Retainer Node</button>' +
              '<button class="btn btn-secondary btn-sm" type="button" data-act="load-sample">🌱 Load Sample Data</button>' +
            '</div>' +
          '</div>';
      } else {
        listHost.innerHTML = list.map(function (r) {
          var ann = E.annualRetainerCents(r);
          var isPaused = r.status === 'paused';
          return '<div class="row">' +
            '<div class="row-main">' +
              '<div class="row-title">' + esc(r.client) + ' · ' + esc(r.title) + ' <span class="tag ' + (isPaused ? '' : 'ok') + '">' + esc(isPaused ? 'Paused' : r.cycle) + '</span></div>' +
              '<div class="row-sub">' + fmt(r.amountCents) + ' / ' + esc(r.cycle) + ' (' + fmt(ann) + '/yr) · Next cycle: ' + esc(E.prettyDate(r.nextDate)) + '</div>' +
            '</div>' +
            '<div class="row-actions" style="margin-top:0;">' +
              (!isPaused ? '<button class="btn btn-sm btn-primary" type="button" data-act="bill-retainer" data-id="' + esc(r.id) + '">⚡ Generate Invoice</button>' : '') +
              '<button class="btn btn-sm btn-secondary" type="button" data-act="toggle-retainer" data-id="' + esc(r.id) + '">' + (isPaused ? 'Resume' : 'Pause') + '</button>' +
              '<button class="btn btn-sm btn-ghost" type="button" data-act="del-retainer" data-id="' + esc(r.id) + '">×</button>' +
            '</div>' +
          '</div>';
        }).join('');
      }
    }

    var acctHost = $('accounts-list');
    if (acctHost) {
      acctHost.innerHTML = (data.accounts || []).map(function (a) {
        var eff = E.effectiveAccountBalanceCents(a, data.transactions);
        var typeTag = a.type === 'tax' ? '<span class="tag warn">Tax Shield Vault</span>' : '<span class="tag ok">Checking</span>';
        return '<div class="row">' +
          '<div class="row-main">' +
            '<div class="row-title">' + esc(a.name) + ' ' + typeTag + '</div>' +
            '<div class="row-sub">Snapshot ' + esc(E.prettyDate(a.balanceAsOf)) + '</div>' +
          '</div>' +
          '<div style="font-weight:800;">' + fmt(eff) + '</div>' +
        '</div>';
      }).join('');
    }
  }

  function renderSettings() {
    var s = data.settings;
    if ($('set-sound')) $('set-sound').checked = !!s.sound;
    if ($('set-business-name')) $('set-business-name').value = s.businessName || 'Nordic Focus Studio';
    if ($('set-default-terms')) $('set-default-terms').value = s.defaultTerms || 'net14';
    if ($('set-monthly-target')) $('set-monthly-target').value = (s.monthlyTargetCents / 100).toFixed(0);
    if ($('set-currency')) $('set-currency').value = s.currency || 'USD';

    var host = $('theme-picker');
    if (host) {
      var curTheme = s.theme || CFG.themes[0].id;
      host.innerHTML = CFG.themes.map(function (t) {
        return '<button type="button" class="chip ' + (t.id === curTheme ? 'selected' : '') + '" data-act="theme" data-theme-id="' + esc(t.id) + '">' + esc(t.label) + '</button>';
      }).join('');
    }
  }

  function renderHeaderAndStats() {
    var p = E.invoicePulse(data, today());
    if ($('badge-collected')) $('badge-collected').textContent = fmt(p.collectedCents) + ' settled';
    if ($('stat-awaiting')) $('stat-awaiting').textContent = fmt(p.awaitingCents);
    if ($('stat-unbilled')) $('stat-unbilled').textContent = fmt(p.unbilledWorkCents + p.draftCents);
    if ($('stat-tax-vault')) $('stat-tax-vault').textContent = fmt(p.taxVaultCents);
    if ($('stat-owner-safe')) $('stat-owner-safe').textContent = fmt(p.safeOwnerCashCents);

    document.body.classList.toggle('fog', !!data.settings.fog);
    var fb = $('btn-toggle-fog');
    if (fb) {
      fb.setAttribute('aria-pressed', data.settings.fog ? 'true' : 'false');
      fb.textContent = data.settings.fog ? 'Burnout Shield: ON' : 'Burnout Shield';
    }
    document.body.setAttribute('data-theme', data.settings.theme || CFG.themes[0].id);
  }

  function renderAll() {
    renderHeaderAndStats();
    renderHero();
    renderUnbilledWork();
    renderWeather();
    renderKanbanPipeline();
    renderWaterfall();
    renderDispatch();
    renderRetainers();
    renderSettings();
  }

  function quickLogWork() {
    var clientInput = $('qa-work-client');
    var titleInput = $('qa-work-title');
    var amtInput = $('qa-work-amount');
    var client = clientInput && clientInput.value.trim() ? clientInput.value.trim() : 'Client Entity';
    var title = titleInput ? titleInput.value.trim() : '';
    var cents = amtInput ? E.parseCents(amtInput.value) : 15000;
    if (!title) title = 'Billable Execution Sprint';
    if (cents <= 0) {
      toast('Enter a positive billable amount.');
      return;
    }
    var wi = S.addWorkItem(data, {
      client: client,
      title: title,
      amountCents: cents,
      date: today()
    });
    if (wi) {
      if (titleInput) titleInput.value = '';
      commit();
      beep(680, 120);
      toast('Committed "' + wi.title + '" (' + fmt(wi.amountCents) + ') to Unbilled Queue.');
      T.emit('work-logged');
      renderAll();
    }
  }

  function runPayoutSplit() {
    var lbl = $('pay-label') ? $('pay-label').value : 'Settled Client Invoice';
    var cents = $('pay-amount') ? E.parseCents($('pay-amount').value) : 160000;
    if (cents <= 0) {
      toast('Enter a valid payout amount first.');
      return;
    }
    data.settings.payoutPreset = selectedPreset;
    var rec = S.applyPayoutSplit(data, {
      label: lbl,
      amountCents: cents,
      preset: selectedPreset,
      date: today()
    });
    if (rec) {
      commit();
      beep(780, 180);
      toast('Executed waterfall split on ' + fmt(rec.amountCents) + '!');
      T.emit('payout-applied');
      renderAll();
    }
  }

  function copyTextToClipboard(text, successMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        toast(successMsg);
      }).catch(function () {
        toast(successMsg);
      });
    } else {
      toast(successMsg);
    }
  }

  function handleAction(node) {
    var act = node.getAttribute('data-act');
    var id = node.getAttribute('data-id');
    switch (act) {
      case 'load-sample':
        loadSampleData();
        break;
      case 'convert-work': {
        var inv = S.convertWorkItemToInvoice(data, id, today());
        if (inv) {
          commit(); beep(740, 140); toast('Converted to Invoice ' + inv.number + '!'); renderAll();
        }
        break;
      }
      case 'del-work':
        S.deleteWorkItem(data, id); commit(); toast('Unbilled item removed.'); renderAll();
        break;
      case 'send-inv':
        if (S.markInvoiceSent(data, id)) {
          commit(); beep(700, 120); toast('Invoice deployed to Active Net-Terms!'); renderAll();
        }
        break;
      case 'pay-inv':
        if (S.markInvoicePaid(data, id, today())) {
          commit(); beep(820, 180); toast('Invoice settled! Capital added to Business Checking.'); renderAll();
        }
        break;
      case 'reopen-inv':
        if (S.reopenInvoice(data, id)) {
          commit(); toast('Invoice reopened.'); renderAll();
        }
        break;
      case 'del-inv':
        S.deleteInvoice(data, id); commit(); toast('Invoice deleted.'); renderAll();
        break;
      case 'preview-inv':
        openInvoicePreview(id);
        break;
      case 'nudge-inv':
        selectedFollowupId = id;
        switchTab('dispatch');
        break;
      case 'load-script':
        selectedFollowupId = id;
        selectedTone = node.getAttribute('data-tone') || 'gentle';
        renderDispatch();
        toast('Dispatch compiled above.');
        break;
      case 'shift-inv': {
        var dInp = $('triage-date-' + id);
        if (dInp && S.rescheduleInvoice(data, id, dInp.value)) {
          commit(); toast('Due date shifted to ' + E.prettyDate(dInp.value) + '.'); renderAll();
        } else {
          toast('Pick a valid due date first.');
        }
        break;
      }
      case 'bill-retainer': {
        var rInv = S.generateRetainerInvoice(data, id, today());
        if (rInv) {
          commit(); beep(760, 150); toast('Generated Invoice ' + rInv.number + ' and advanced cycle!'); renderAll();
        }
        break;
      }
      case 'toggle-retainer':
        S.toggleRetainerStatus(data, id); commit(); toast('Retainer node updated.'); renderAll();
        break;
      case 'del-retainer':
        S.deleteRetainer(data, id); commit(); toast('Retainer node removed.'); renderAll();
        break;
      case 'theme':
        data.settings.theme = node.getAttribute('data-theme-id');
        commit(); renderAll();
        break;
      default:
        break;
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
        var c = parseInt(amtChip.getAttribute('data-cents'), 10) || 15000;
        if ($('qa-work-amount')) $('qa-work-amount').value = (c / 100).toFixed(2);
        if ($('qa-work-title') && !$('qa-work-title').value.trim()) {
          $('qa-work-title').value = amtChip.getAttribute('data-label') || '';
        }
        var allAmt = document.querySelectorAll('#qa-amount-chips .chip');
        for (var i = 0; i < allAmt.length; i++) allAmt[i].classList.toggle('selected', allAmt[i] === amtChip);
        return;
      }

      var presetChip = t.closest('#pay-preset-chips .chip');
      if (presetChip) {
        selectedPreset = presetChip.getAttribute('data-preset') || 'standard';
        renderWaterfall();
        return;
      }

      var toneChip = t.closest('#followup-tone-chips .chip');
      if (toneChip) {
        selectedTone = toneChip.getAttribute('data-tone') || 'warm';
        renderDispatch();
        return;
      }

      var actNode = t.closest('[data-act]');
      if (actNode) {
        e.stopPropagation();
        handleAction(actNode);
      }
    });

    if ($('btn-qa-work')) $('btn-qa-work').addEventListener('click', quickLogWork);
    if ($('qa-work-title')) {
      $('qa-work-title').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') quickLogWork();
      });
    }
    if ($('pay-amount')) $('pay-amount').addEventListener('input', renderWaterfall);
    if ($('btn-run-payout')) $('btn-run-payout').addEventListener('click', runPayoutSplit);

    if ($('followup-invoice-select')) {
      $('followup-invoice-select').addEventListener('change', function () {
        selectedFollowupId = this.value;
        renderDispatch();
      });
    }

    if ($('btn-copy-script')) {
      $('btn-copy-script').addEventListener('click', function () {
        var box = $('followup-script-box');
        copyTextToClipboard(box ? box.value : '', 'Dispatch copied to clipboard!');
      });
    }

    if ($('btn-print-invoice')) {
      $('btn-print-invoice').addEventListener('click', function () {
        window.print();
      });
    }

    if ($('btn-copy-invoice')) {
      $('btn-copy-invoice').addEventListener('click', function () {
        var inv = S.findInvoice(data, previewInvoiceId);
        if (!inv) return;
        var totals = E.calculateInvoiceTotals(inv);
        var summary = 'INVOICE ' + inv.number + ' — ' + (data.settings.businessName || 'Nordic Focus Studio') + '\n' +
          'Client: ' + inv.client + '\n' +
          'Deliverable: ' + inv.title + '\n' +
          'Due Date: ' + E.prettyDate(inv.dueDate) + '\n' +
          'Balance Due: ' + fmt(totals.balanceDueCents);
        copyTextToClipboard(summary, 'Invoice telemetry copied!');
      });
    }

    if ($('btn-toggle-fog')) {
      $('btn-toggle-fog').addEventListener('click', function () {
        data.settings.fog = !data.settings.fog;
        commit();
        renderAll();
        T.emit('fog-toggled');
      });
    }

    if ($('btn-launch-tour')) {
      $('btn-launch-tour').addEventListener('click', function () {
        T.start();
      });
    }

    if ($('btn-save-invoice')) {
      $('btn-save-invoice').addEventListener('click', function () {
        var inv = S.addInvoice(data, {
          client: $('inv-client').value,
          title: $('inv-title').value || 'Professional Services',
          amountCents: E.parseCents($('inv-amount').value),
          terms: $('inv-terms').value,
          taxPct: parseInt($('inv-tax').value, 10) || 0,
          discountPct: parseInt($('inv-discount').value, 10) || 0,
          depositCents: E.parseCents($('inv-deposit').value),
          status: $('inv-status').value,
          weekendEarly: $('inv-weekend').checked,
          issueDate: today()
        });
        if (!inv) {
          $('inv-error').textContent = 'Please enter a client entity and positive subtotal amount.';
          return;
        }
        commit(); closeModal('modal-add-invoice'); beep(740, 140); toast('Invoice ' + inv.number + ' deployed!'); renderAll();
      });
    }

    if ($('btn-save-retainer')) {
      $('btn-save-retainer').addEventListener('click', function () {
        var ret = S.addRetainer(data, {
          client: $('ret-client').value,
          title: $('ret-title').value || 'Monthly Retainer',
          amountCents: E.parseCents($('ret-amount').value),
          cycle: $('ret-cycle').value,
          nextDate: $('ret-next-date').value
        });
        if (!ret) {
          $('ret-error').textContent = 'Please enter a client entity, positive fee, and valid next billing date.';
          return;
        }
        commit(); closeModal('modal-add-retainer'); toast('Retainer node registered.'); renderAll();
      });
    }

    if ($('btn-sync-balance')) {
      $('btn-sync-balance').addEventListener('click', function () {
        var raw = $('sync-balance-input').value;
        if (raw === '') { toast('Enter your current business checking balance first.'); return; }
        S.setAccountBalance(data, 'acct_main', E.parseCents(raw), today());
        $('sync-balance-input').value = '';
        commit(); beep(720, 140); toast('Business checking synced without double-counting!'); renderAll();
      });
    }

    if ($('btn-save-settings')) {
      $('btn-save-settings').addEventListener('click', function () {
        data.settings.businessName = ($('set-business-name').value || '').trim() || 'Nordic Focus Studio';
        data.settings.defaultTerms = $('set-default-terms').value || 'net14';
        data.settings.monthlyTargetCents = E.clampNum(E.parseCents($('set-monthly-target').value), 10000, 1000000000, 500000);
        data.settings.currency = $('set-currency').value || 'USD';
        commit();
        toast('Parameters committed.');
        renderAll();
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
        askConfirm('Reset to a clean empty slate? All sample and current records will be cleared.', function () {
          setCleanSlateState(true);
          toast('Clean empty slate initialized.');
        });
      });
    }

    if ($('btn-load-sample')) {
      $('btn-load-sample').addEventListener('click', function () {
        loadSampleData();
      });
    }

    if ($('btn-restart-tour')) {
      $('btn-restart-tour').addEventListener('click', function () {
        T.start();
      });
    }

    if ($('btn-export-json')) {
      $('btn-export-json').addEventListener('click', function () {
        var blob = new Blob([S.exportJSON(data)], { type: 'application/json' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'invoice-planner-2-backup-' + today() + '.json';
        a.click();
        URL.revokeObjectURL(a.href);
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
            data = S.importJSON(String(reader.result || ''), today());
            commit();
            renderAll();
            toast('Snapshot restored.');
          } catch (err) {
            toast('Invalid JSON snapshot file.');
          }
        };
        reader.readAsText(f);
        e.target.value = '';
      });
    }

    if ($('btn-reset-data')) {
      $('btn-reset-data').addEventListener('click', function () {
        askConfirm('Purge all data and reset to a blank slate?', function () {
          setCleanSlateState(true);
          toast('All telemetry purged.');
        });
      });
    }

    if ($('btn-confirm-yes')) {
      $('btn-confirm-yes').addEventListener('click', function () {
        var fn = confirmAction;
        confirmAction = null;
        closeModal('modal-confirm');
        if (typeof fn === 'function') fn();
      });
    }
  }

  function init() {
    try {
      wire();
      switchTab(CFG.defaultTab);
    } catch (err) {
      if (typeof console !== 'undefined' && console.error) console.error('Render init error isolated:', err);
    }

    T.init({
      config: CFG,
      switchTab: switchTab,
      onEnd: function () {
        if (data.settings.isSampleSeed) {
          data = S.cleanSlate(data, today(), false);
        } else {
          data.settings.onboarded = true;
        }
        commit();
        renderAll();
      }
    });

    if (!data.settings.onboarded) {
      setTimeout(function () { T.start(); }, 250);
    }

    if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('./sw.js').then(function (reg) {
          if (reg && typeof reg.update === 'function') reg.update();
        }).catch(function () {});
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
