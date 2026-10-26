/*
 * Renders a parsed breakdown as one flat, fully sortable table.
 * Used by both viewer.html and the in-page tennistonic enhancement.
 */
var LTP = window.LTP || {};

LTP.COLUMNS = [
  { key: 'date', label: 'Date', title: 'When the tournament was played', type: 'date', align: 'left' },
  { key: 'tournament', label: 'Tournament', type: 'text', align: 'left' },
  { key: 'category', label: 'Level', type: 'category', align: 'left' },
  { key: 'round', label: 'Round', title: 'Round reached', type: 'round', align: 'left' },
  { key: 'points', label: 'Points', type: 'number', align: 'right' },
  { key: 'drop', label: 'Expires', title: 'Date these points drop off the ranking', type: 'date', align: 'left' },
  { key: 'daysLeft', label: 'Days left', title: 'Days until these points expire', type: 'number', align: 'right' },
  { key: 'cumulative', label: 'Cumulative', title: 'Counting points expiring on or before this date', type: 'number', align: 'right' },
  { key: 'countable', label: 'Status', title: 'Whether the points count toward the current ranking', type: 'status', align: 'left' },
];

LTP.decorate = function (rows) {
  var today = LTP.todayUTC();
  rows.forEach(function (r) {
    r.daysLeft = r.drop ? LTP.daysBetween(today, r.drop) : null;
  });

  // "Cumulative" is defined independently of the visible sort order: the total of
  // counting points that expire on or before this row's own expiry date.
  var counting = rows.filter(function (r) { return r.countable && r.drop; })
    .slice()
    .sort(function (a, b) { return a.drop - b.drop; });
  var run = 0;
  counting.forEach(function (r) { run += r.points; r.cumulative = run; });
  rows.forEach(function (r) { if (r.cumulative === undefined) r.cumulative = null; });
  return rows;
};

LTP.sortValue = function (row, col) {
  var v = row[col.key];
  switch (col.type) {
    case 'date': return v ? v.getTime() : null;
    case 'number': return (v === null || v === undefined || isNaN(v)) ? null : v;
    case 'round': return LTP.roundRank(v);
    case 'category': return LTP.categoryRank(v);
    case 'status': return v ? 1 : 0;
    default: return (v || '').toString().toLowerCase();
  }
};

LTP.compare = function (a, b, col, dir) {
  var av = LTP.sortValue(a, col);
  var bv = LTP.sortValue(b, col);
  // Missing values always sort last, regardless of direction.
  if (av === null && bv === null) return 0;
  if (av === null) return 1;
  if (bv === null) return -1;
  if (av < bv) return -dir;
  if (av > bv) return dir;
  return 0;
};

LTP.toCSV = function (rows) {
  var head = ['Date', 'Tournament', 'Level', 'Round', 'Points', 'Expires', 'Days left', 'Cumulative', 'Status'];
  var lines = [head.join(',')];
  rows.forEach(function (r) {
    var vals = [
      LTP.fmtDate(r.date), r.tournament, r.category, r.round, r.points,
      LTP.fmtDate(r.drop), r.daysLeft === null ? '' : r.daysLeft,
      r.cumulative === null ? '' : r.cumulative,
      r.countable ? 'Counting' : 'Not counting',
    ];
    lines.push(vals.map(function (v) {
      v = v === null || v === undefined ? '' : String(v);
      return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
    }).join(','));
  });
  return lines.join('\n');
};

/*
 * data: { rows, statedTotal, playerName, sourceUrl, tour }
 */
LTP.renderTable = function (container, data) {
  var rows = LTP.decorate(data.rows || []);
  var state = { key: 'drop', dir: 1, query: '', includeNonCounting: true };

  container.textContent = '';
  container.classList.add('ltp-root');

  var header = LTP.el('div', { class: 'ltp-header' });
  var title = LTP.el('h2', {
    class: 'ltp-title',
    text: (data.playerName || 'Player') + ' — ranking points by expiry',
  });
  header.appendChild(title);

  var summary = LTP.el('div', { class: 'ltp-summary' });
  header.appendChild(summary);

  var controls = LTP.el('div', { class: 'ltp-controls' });
  var search = LTP.el('input', { class: 'ltp-search', type: 'search', placeholder: 'Filter tournament, level or round…' });
  var nonCountLabel = LTP.el('label', { class: 'ltp-check' });
  var nonCount = LTP.el('input', { type: 'checkbox' });
  nonCount.checked = true;
  nonCountLabel.appendChild(nonCount);
  nonCountLabel.appendChild(document.createTextNode(' Include non-counting'));
  var csvBtn = LTP.el('button', { class: 'ltp-btn', type: 'button', text: 'Download CSV' });
  controls.appendChild(search);
  controls.appendChild(nonCountLabel);
  controls.appendChild(csvBtn);
  if (data.sourceUrl) {
    controls.appendChild(LTP.el('a', {
      class: 'ltp-src', href: data.sourceUrl, target: '_blank', rel: 'noreferrer',
      text: 'source',
    }));
  }
  header.appendChild(controls);
  container.appendChild(header);

  // The scroll container is a focusable, named region so the table can be
  // scrolled with the keyboard and announced as a landmark.
  LTP.seq = (LTP.seq || 0) + 1;
  var capId = 'ltp-caption-' + LTP.seq;
  var wrap = LTP.el('div', {
    class: 'ltp-tablewrap',
    tabindex: '0',
    role: 'region',
    'aria-labelledby': capId,
  });
  var table = LTP.el('table', { class: 'ltp-table' });
  table.appendChild(LTP.el('caption', {
    class: 'ltp-caption',
    id: capId,
    text: (data.playerName || 'Player') + ' — every ranking point by expiry date. '
      + 'Select a column header to sort.',
  }));
  var thead = LTP.el('thead');
  var headRow = LTP.el('tr');
  LTP.COLUMNS.forEach(function (col) {
    var th = LTP.el('th', {
      class: 'ltp-th ltp-al-' + col.align,
      title: col.title || ('Sort by ' + col.label),
      tabindex: '0',
      role: 'button',
    });
    th.appendChild(document.createTextNode(col.label));
    var caret = LTP.el('span', { class: 'ltp-caret' });
    th.appendChild(caret);
    function doSort() {
      if (state.key === col.key) state.dir = -state.dir;
      else { state.key = col.key; state.dir = col.type === 'text' ? 1 : (col.key === 'points' ? -1 : 1); }
      draw();
    }
    th.addEventListener('click', doSort);
    th.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doSort(); }
    });
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);
  var tbody = LTP.el('tbody');
  table.appendChild(tbody);
  wrap.appendChild(table);
  container.appendChild(wrap);

  var empty = LTP.el('p', { class: 'ltp-empty', text: 'No results match this filter.' });
  empty.style.display = 'none';
  container.appendChild(empty);

  function visibleRows() {
    var q = state.query.toLowerCase().trim();
    return rows.filter(function (r) {
      if (!state.includeNonCounting && !r.countable) return false;
      if (!q) return true;
      return (r.tournament + ' ' + r.category + ' ' + r.round).toLowerCase().indexOf(q) >= 0;
    });
  }

  function drawSummary(shown) {
    summary.textContent = '';
    var counting = rows.filter(function (r) { return r.countable; });
    var total = counting.reduce(function (a, r) { return a + r.points; }, 0);
    var today = LTP.todayUTC();
    function expiringWithin(days) {
      return counting.reduce(function (a, r) {
        return a + ((r.daysLeft !== null && r.daysLeft >= 0 && r.daysLeft <= days) ? r.points : 0);
      }, 0);
    }
    var next = counting.filter(function (r) { return r.daysLeft !== null && r.daysLeft >= 0; })
      .sort(function (a, b) { return a.drop - b.drop; })[0];

    var stats = [
      ['Counting points', String(total) + (data.statedTotal !== null && data.statedTotal !== undefined && data.statedTotal !== total ? ' (site says ' + data.statedTotal + ')' : '')],
      ['Results', counting.length + ' counting, ' + (rows.length - counting.length) + ' not'],
      ['Next drop', next ? LTP.fmtDate(next.drop) + ' · ' + next.points + ' pts (' + next.tournament + ')' : '—'],
      ['Expiring ≤30d', String(expiringWithin(30))],
      ['Expiring ≤90d', String(expiringWithin(90))],
      ['Showing', String(shown) + ' rows'],
    ];
    stats.forEach(function (s) {
      var box = LTP.el('div', { class: 'ltp-stat' }, [
        LTP.el('span', { class: 'ltp-stat-label', text: s[0] }),
        LTP.el('span', { class: 'ltp-stat-value', text: s[1] }),
      ]);
      summary.appendChild(box);
    });
  }

  function draw() {
    var col = LTP.COLUMNS.filter(function (c) { return c.key === state.key; })[0] || LTP.COLUMNS[5];
    var list = visibleRows().slice().sort(function (a, b) { return LTP.compare(a, b, col, state.dir); });

    Array.prototype.forEach.call(headRow.children, function (th, i) {
      var c = LTP.COLUMNS[i];
      var active = c.key === state.key;
      th.classList.toggle('ltp-sorted', active);
      th.setAttribute('aria-sort', active ? (state.dir === 1 ? 'ascending' : 'descending') : 'none');
      th.querySelector('.ltp-caret').textContent = active ? (state.dir === 1 ? ' ▲' : ' ▼') : '';
    });

    tbody.textContent = '';
    list.forEach(function (r) {
      var tr = LTP.el('tr', { class: r.countable ? '' : 'ltp-noncount' });
      if (r.daysLeft !== null && r.daysLeft >= 0 && r.daysLeft <= 30 && r.countable) tr.classList.add('ltp-soon');

      // data-label feeds the ::before labels used when the table stacks into
      // cards, so each value stays identifiable once the header row is hidden.
      function cell(colIndex, cls, text) {
        var td = LTP.el('td', { class: cls, 'data-label': LTP.COLUMNS[colIndex].label });
        td.textContent = text;
        return td;
      }

      tr.appendChild(cell(0, 'ltp-al-left ltp-nowrap', LTP.fmtDate(r.date)));

      // The tournament names the row, so it is a row header rather than a cell.
      var thT = LTP.el('th', { scope: 'row', class: 'ltp-al-left' });
      var safeUrl = LTP.safeHttpUrl(r.tournamentUrl);
      if (safeUrl) {
        thT.appendChild(LTP.el('a', { href: safeUrl, target: '_blank', rel: 'noreferrer noopener', text: r.tournament }));
      } else {
        thT.textContent = r.tournament;
      }
      tr.appendChild(thT);

      tr.appendChild(cell(2, 'ltp-al-left', r.category));
      tr.appendChild(cell(3, 'ltp-al-left', r.round));
      tr.appendChild(cell(4, 'ltp-al-right ltp-pts', String(r.points)));
      tr.appendChild(cell(5, 'ltp-al-left ltp-nowrap', LTP.fmtDate(r.drop)));
      tr.appendChild(cell(6, 'ltp-al-right', r.daysLeft === null ? '' : String(r.daysLeft)));
      tr.appendChild(cell(7, 'ltp-al-right ltp-dim', r.cumulative === null ? '' : String(r.cumulative)));
      tr.appendChild(cell(8, 'ltp-al-left', r.countable ? 'Counting' : 'Not counting'));
      tbody.appendChild(tr);
    });

    empty.style.display = list.length ? 'none' : '';
    drawSummary(list.length);
    return list;
  }

  search.addEventListener('input', function () { state.query = search.value; draw(); });
  nonCount.addEventListener('change', function () { state.includeNonCounting = nonCount.checked; draw(); });
  csvBtn.addEventListener('click', function () {
    var col = LTP.COLUMNS.filter(function (c) { return c.key === state.key; })[0];
    var list = visibleRows().slice().sort(function (a, b) { return LTP.compare(a, b, col, state.dir); });
    var blob = new Blob([LTP.toCSV(list)], { type: 'text/csv' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (LTP.fold(data.playerName || 'player').replace(/\s+/g, '-') + '-points.csv').toLowerCase();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  });

  draw();
};

window.LTP = LTP;
