(function () {
  'use strict';

  // ── Data ──────────────────────────────────────────────────────
  var CATEGORIES = [
    { id: 'stewardship',  name: 'Franchise Stewardship / Cohesion', weight: 0.15 },
    { id: 'filmStrategy', name: 'Film Strategy & Follow-Through',   weight: 0.15 },
    { id: 'disneyPlus',   name: 'Disney+ Era Execution',            weight: 0.10 },
    { id: 'creativeRisk', name: 'Creative Risk vs Discipline',      weight: 0.10 },
    { id: 'talentMgmt',   name: 'Talent Management',                weight: 0.10 },
    { id: 'fanTrust',     name: 'Fan Trust Trajectory',             weight: 0.20 },
    { id: 'eventization', name: 'Eventization (Must-Watch Energy)', weight: 0.15 },
    { id: 'legacy',       name: 'Long-Term Legacy Durability',      weight: 0.05 },
  ];

  var CHECKLIST = [
    { id: 'openingThesis',  label: 'Opening thesis' },
    { id: 'sharedWins',     label: 'Shared wins / misses' },
    { id: 'scorecardPass',  label: 'Scorecard pass' },
    { id: 'rootCause',      label: 'Root-cause debate' },
    { id: 'successorBrief', label: 'Successor brief' },
    { id: 'lightningClose', label: 'Lightning close' },
  ];

  var KEY = 'kkReportCard';
  var state, currentIndex;

  // ── State ─────────────────────────────────────────────────────
  function defaults() {
    var scores = {};
    CATEGORIES.forEach(function (c) { scores[c.id] = { score: 5, receipt: '', verdict: '' }; });
    var checks = {};
    CHECKLIST.forEach(function (c) { checks[c.id] = false; });
    return { scores: scores, weightedMode: false, hostNotes: '',
             checklist: checks, revealRankByWeighted: false, currentIndex: 0 };
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var d = JSON.parse(raw);
        if (d && d.scores) {
          var def = defaults();
          CATEGORIES.forEach(function (c) {
            if (!d.scores[c.id]) d.scores[c.id] = def.scores[c.id];
            if (d.scores[c.id].receipt === undefined) d.scores[c.id].receipt = '';
            if (d.scores[c.id].verdict === undefined) d.scores[c.id].verdict = '';
          });
          if (!d.checklist) d.checklist = def.checklist;
          CHECKLIST.forEach(function (c) { if (d.checklist[c.id] === undefined) d.checklist[c.id] = false; });
          if (d.hostNotes === undefined) d.hostNotes = '';
          if (d.weightedMode === undefined) d.weightedMode = false;
          if (d.revealRankByWeighted === undefined) d.revealRankByWeighted = false;
          if (d.currentIndex === undefined) d.currentIndex = 0;
          return d;
        }
      }
    } catch (e) { /* ignore */ }
    return defaults();
  }

  function save() {
    state.currentIndex = currentIndex;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* */ }
  }

  // ── Helpers ───────────────────────────────────────────────────
  function grade(avg) {
    if (avg >= 9) return 'A';
    if (avg >= 8) return 'B';
    if (avg >= 7) return 'C';
    if (avg >= 6) return 'D';
    return 'F';
  }
  function gc(g) { return 'grade-' + g.toLowerCase(); }
  function mc(s) { return 'hsl(' + ((s - 1) / 9 * 120) + ',72%,46%)'; }
  function pct(v) { return ((v - 1) / 9) * 100; }
  function clamp(v) { return Math.round(Math.max(1, Math.min(10, v)) * 2) / 2; }
  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  // ── Show one category ─────────────────────────────────────────
  function showCategory(index, direction) {
    currentIndex = index;
    var stage = document.getElementById('cardStage');

    // Trigger slide animation
    stage.className = 'card-stage';
    void stage.offsetHeight; // force reflow
    stage.className = 'card-stage ' + (direction === 'prev' ? 'slide-prev' : 'slide-next');

    renderCard();
    renderProgress();
    renderNav();
    save();
  }

  function renderCard() {
    var cat = CATEGORIES[currentIndex];
    var s = state.scores[cat.id];
    var p = pct(s.score);
    var stage = document.getElementById('cardStage');

    stage.innerHTML =
      '<div class="card">' +
        '<h2 class="card-name">' + cat.name + '</h2>' +
        (state.weightedMode
          ? '<span class="card-weight">' + Math.round(cat.weight * 100) + '% weight</span>'
          : '') +
        '<input type="number" id="scoreNum" class="card-score" ' +
          'min="1" max="10" step="0.5" value="' + s.score + '" ' +
          'aria-label="' + esc(cat.name) + ' score">' +
        '<input type="range" id="scoreSlider" class="card-slider" ' +
          'min="1" max="10" step="0.5" value="' + s.score + '" ' +
          'aria-label="' + esc(cat.name) + ' slider" ' +
          'style="background:linear-gradient(to right,#4FC3F7 ' + p + '%,#060a14 ' + p + '%)">' +
        '<div class="card-meter">' +
          '<div class="card-meter-fill" id="meterFill" ' +
            'style="width:' + p + '%;background:' + mc(s.score) + '"></div>' +
        '</div>' +
        '<div class="card-notes">' +
          '<input type="text" id="receiptInput" class="card-note" ' +
            'placeholder="Receipt / evidence\u2026" value="' + esc(s.receipt) + '" ' +
            'aria-label="' + esc(cat.name) + ' evidence">' +
          '<input type="text" id="verdictInput" class="card-note" ' +
            'placeholder="Quick verdict\u2026" value="' + esc(s.verdict) + '" ' +
            'aria-label="' + esc(cat.name) + ' verdict">' +
        '</div>' +
      '</div>';

    // Bind card events
    var slider = document.getElementById('scoreSlider');
    var num = document.getElementById('scoreNum');
    var receipt = document.getElementById('receiptInput');
    var verdict = document.getElementById('verdictInput');

    slider.addEventListener('input', function () {
      syncScore(parseFloat(slider.value));
    });

    num.addEventListener('input', function () {
      var v = parseFloat(num.value);
      if (!isNaN(v)) syncScore(clamp(v));
    });

    num.addEventListener('blur', function () {
      var v = parseFloat(num.value);
      if (isNaN(v) || v < 1) v = 1;
      if (v > 10) v = 10;
      v = clamp(v);
      num.value = v;
      syncScore(v);
    });

    receipt.addEventListener('input', function () {
      state.scores[cat.id].receipt = receipt.value;
      save();
    });

    verdict.addEventListener('input', function () {
      state.scores[cat.id].verdict = verdict.value;
      save();
    });
  }

  function syncScore(val) {
    val = clamp(val);
    var cat = CATEGORIES[currentIndex];
    state.scores[cat.id].score = val;
    var p = pct(val);

    var slider = document.getElementById('scoreSlider');
    var num = document.getElementById('scoreNum');
    var meter = document.getElementById('meterFill');

    if (slider) {
      slider.value = val;
      slider.style.background = 'linear-gradient(to right,#4FC3F7 ' + p + '%,#060a14 ' + p + '%)';
    }
    if (num && document.activeElement !== num) num.value = val;
    if (meter) {
      meter.style.width = p + '%';
      meter.style.background = mc(val);
    }

    updateDebug();
    save();
  }

  // ── Progress dots ─────────────────────────────────────────────
  function renderProgress() {
    var container = document.getElementById('progressDots');
    container.innerHTML = '';

    for (var i = 0; i < CATEGORIES.length; i++) {
      var dot = document.createElement('button');
      dot.className = 'dot';
      if (i === currentIndex) dot.className += ' dot-active';
      dot.setAttribute('aria-label', CATEGORIES[i].name);
      dot.dataset.idx = i;
      dot.addEventListener('click', function () {
        var target = parseInt(this.dataset.idx);
        var dir = target > currentIndex ? 'next' : 'prev';
        showCategory(target, dir);
      });
      container.appendChild(dot);
    }

    document.getElementById('progressText').textContent =
      (currentIndex + 1) + ' of ' + CATEGORIES.length;
  }

  // ── Navigation ────────────────────────────────────────────────
  function renderNav() {
    var prev = document.getElementById('prevBtn');
    var next = document.getElementById('nextBtn');
    var isLast = currentIndex === CATEGORIES.length - 1;

    prev.hidden = currentIndex === 0;

    if (isLast) {
      next.textContent = 'Reveal Final Grade';
      next.className = 'nav-btn nav-reveal';
    } else {
      next.innerHTML = 'Next &#8594;';
      next.className = 'nav-btn nav-next';
    }
  }

  function goNext() {
    if (currentIndex < CATEGORIES.length - 1) {
      showCategory(currentIndex + 1, 'next');
    } else {
      showReveal();
    }
  }

  function goPrev() {
    if (currentIndex > 0) {
      showCategory(currentIndex - 1, 'prev');
    }
  }

  // ── Checklist ─────────────────────────────────────────────────
  function renderChecklist() {
    var box = document.getElementById('checklist');
    box.innerHTML = '';
    CHECKLIST.forEach(function (item) {
      var div = document.createElement('div');
      div.innerHTML =
        '<label class="ht-check-label" for="ck-' + item.id + '">' +
          '<input type="checkbox" id="ck-' + item.id + '"' +
            (state.checklist[item.id] ? ' checked' : '') +
            ' aria-label="' + esc(item.label) + '">' +
          '<span class="ht-checkmark"></span>' +
          '<span>' + item.label + '</span>' +
        '</label>';
      div.querySelector('input').addEventListener('change', function (e) {
        state.checklist[item.id] = e.target.checked;
        save();
      });
      box.appendChild(div);
    });
  }

  // ── Debug table ───────────────────────────────────────────────
  function calc() {
    var raw = 0, wt = 0;
    CATEGORIES.forEach(function (c) {
      var s = state.scores[c.id].score;
      raw += s; wt += s * c.weight;
    });
    return { rawSum: raw, rawAvg: raw / CATEGORIES.length, wtAvg: wt, wtTotal: wt * 8 };
  }

  function updateDebug() {
    var t = calc();
    var tb = document.getElementById('debugTableBody');
    tb.innerHTML = '';
    var run = 0;
    CATEGORIES.forEach(function (c) {
      var s = state.scores[c.id].score;
      var con = s * c.weight;
      run += con;
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + c.name + '</td><td>' + s.toFixed(1) + '</td>' +
        '<td>' + (c.weight * 100).toFixed(0) + '%</td>' +
        '<td>' + con.toFixed(2) + '</td><td>' + run.toFixed(2) + '</td>';
      tb.appendChild(tr);
    });
    document.getElementById('debugWeightedAvg').innerHTML =
      '<strong>' + t.wtAvg.toFixed(2) + ' / 10</strong>';
  }

  // ── Reveal ────────────────────────────────────────────────────
  function highLow(byContrib) {
    var hi = { name: '', score: 0, contrib: 0, rank: -Infinity };
    var lo = { name: '', score: 0, contrib: 0, rank: Infinity };
    CATEGORIES.forEach(function (c) {
      var s = state.scores[c.id].score;
      var con = s * c.weight;
      var r = byContrib ? con : s;
      if (r > hi.rank || (r === hi.rank && !hi.name))
        hi = { name: c.name, score: s, contrib: con, rank: r };
      if (r < lo.rank || (r === lo.rank && !lo.name))
        lo = { name: c.name, score: s, contrib: con, rank: r };
    });
    return { hi: hi, lo: lo };
  }

  function showReveal() {
    var t = calc();
    var w = state.weightedMode;
    var avg = w ? t.wtAvg : t.rawAvg;
    var total = w ? t.wtTotal : t.rawSum;
    var g = grade(avg);
    var hl = highLow(state.revealRankByWeighted);

    var ge = document.getElementById('revealGrade');
    ge.textContent = g;
    ge.className = 'reveal-letter ' + gc(g);

    document.getElementById('revealScore').textContent = avg.toFixed(1) + ' / 10';
    document.getElementById('revealTotal').textContent = total.toFixed(1) + ' / 80';
    document.getElementById('revealMode').textContent = w ? '(Weighted)' : '(Equal Weight)';

    document.getElementById('revealHigh').textContent = hl.hi.name +
      (state.revealRankByWeighted
        ? ' (' + hl.hi.contrib.toFixed(2) + ')'
        : ' (' + hl.hi.score.toFixed(1) + ')');
    document.getElementById('revealLow').textContent = hl.lo.name +
      (state.revealRankByWeighted
        ? ' (' + hl.lo.contrib.toFixed(2) + ')'
        : ' (' + hl.lo.score.toFixed(1) + ')');

    document.getElementById('revealSummary').textContent =
      'Strongest in ' + hl.hi.name + ', weakest in ' + hl.lo.name +
      ', overall era grade: ' + g + '.';

    document.getElementById('revealRankOption').hidden = !w;
    document.getElementById('revealRankToggle').checked = state.revealRankByWeighted;

    document.getElementById('revealOverlay').hidden = false;
    document.getElementById('hideRevealBtn').focus();
  }

  function hideReveal() {
    document.getElementById('revealOverlay').hidden = true;
    document.getElementById('nextBtn').focus();
  }

  // ── Export / Import / Reset ───────────────────────────────────
  function exportJSON() {
    var blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'kk-report-card.json';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  function importJSON(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (ev) {
      try {
        var d = JSON.parse(ev.target.result);
        if (d && d.scores) {
          var def = defaults();
          CATEGORIES.forEach(function (c) { if (!d.scores[c.id]) d.scores[c.id] = def.scores[c.id]; });
          if (!d.checklist) d.checklist = def.checklist;
          if (d.hostNotes === undefined) d.hostNotes = '';
          if (d.weightedMode === undefined) d.weightedMode = false;
          if (d.revealRankByWeighted === undefined) d.revealRankByWeighted = false;
          if (d.currentIndex === undefined) d.currentIndex = 0;
          state = d;
          currentIndex = state.currentIndex;
          renderAll();
          save();
        } else {
          alert('Invalid scorecard file.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function resetAll() {
    if (confirm('Reset all scores, notes, and checklist? This cannot be undone.')) {
      state = defaults();
      currentIndex = 0;
      renderAll();
      save();
    }
  }

  // ── Full render ───────────────────────────────────────────────
  function renderAll() {
    renderCard();
    renderProgress();
    renderNav();
    renderChecklist();
    updateDebug();
    document.getElementById('hostNotes').value = state.hostNotes;
    document.getElementById('weightedMode').checked = state.weightedMode;
    document.getElementById('modeIndicator').textContent =
      state.weightedMode ? 'Weighted' : 'Equal Weight';
  }

  // ── Events ────────────────────────────────────────────────────
  function bindGlobal() {
    document.getElementById('nextBtn').addEventListener('click', goNext);
    document.getElementById('prevBtn').addEventListener('click', goPrev);

    // Keyboard navigation
    document.addEventListener('keydown', function (e) {
      // Don't navigate while typing
      var tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        if (e.key === 'Escape') e.target.blur();
        return;
      }

      if (!document.getElementById('revealOverlay').hidden) {
        if (e.key === 'Escape') hideReveal();
        return;
      }

      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    });

    // Weighted toggle
    document.getElementById('weightedMode').addEventListener('change', function (e) {
      state.weightedMode = e.target.checked;
      document.getElementById('modeIndicator').textContent =
        e.target.checked ? 'Weighted' : 'Equal Weight';
      renderCard(); // re-render to show/hide weight badge
      updateDebug();
      save();
    });

    // Host notes
    document.getElementById('hostNotes').addEventListener('input', function (e) {
      state.hostNotes = e.target.value;
      save();
    });

    // Host tools toggle
    document.getElementById('hostToolsToggle').addEventListener('click', function () {
      var body = document.getElementById('hostToolsBody');
      var open = !body.hidden;
      body.hidden = open;
      this.setAttribute('aria-expanded', String(!open));
    });

    // Debug toggle
    document.getElementById('debugToggle').addEventListener('click', function () {
      var el = document.getElementById('debugContent');
      var open = !el.hidden;
      el.hidden = open;
      this.setAttribute('aria-expanded', String(!open));
    });

    // Reveal overlay
    document.getElementById('hideRevealBtn').addEventListener('click', hideReveal);
    document.getElementById('revealBackdrop').addEventListener('click', hideReveal);

    document.getElementById('revealRankToggle').addEventListener('change', function (e) {
      state.revealRankByWeighted = e.target.checked;
      save();
      if (!document.getElementById('revealOverlay').hidden) showReveal();
    });

    // Export / Import / Reset
    document.getElementById('exportBtn').addEventListener('click', exportJSON);
    document.getElementById('importBtn').addEventListener('click', function () {
      document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', importJSON);
    document.getElementById('resetBtn').addEventListener('click', resetAll);
  }

  // ── Welcome screen ───────────────────────────────────────────
  function startScorecard() {
    var welcome = document.getElementById('welcomeScreen');
    var app = document.getElementById('mainApp');

    welcome.classList.add('welcome-exit');

    // After the fade-out transition, hide welcome and show the app
    setTimeout(function () {
      welcome.hidden = true;
      app.hidden = false;
      state = load();
      currentIndex = state.currentIndex || 0;
      if (currentIndex >= CATEGORIES.length) currentIndex = 0;
      renderAll();
      bindGlobal();
    }, 500);
  }

  // ── Boot ──────────────────────────────────────────────────────
  function init() {
    document.getElementById('startBtn').addEventListener('click', startScorecard);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
