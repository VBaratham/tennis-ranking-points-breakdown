/*
 * Shared parsing helpers. Loaded as a classic script in three contexts:
 * the live-tennis.eu content script, the tennistonic content script, and viewer.html.
 */
var LTP = window.LTP || {};

/* "Karolína Muchová" -> "karolina muchova". Tennis Tonic's search endpoint only
 * matches ASCII, so folding is required before any lookup. */
LTP.fold = function (name) {
  return (name || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[‘’ʼ]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
};

/*
 * Every URL in the breakdown comes from a third party's markup, and an href is
 * a script sink: a "javascript:" value would run on click. Only http(s) URLs
 * are ever handed back for rendering.
 */
LTP.safeHttpUrl = function (raw) {
  if (!raw) return '';
  try {
    var u = new URL(raw, 'https://tennistonic.com/');
    return (u.protocol === 'https:' || u.protocol === 'http:') ? u.href : '';
  } catch (e) {
    return '';
  }
};

LTP.MONTHS = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/*
 * Dates are repeated inside nested spans for responsive layouts, so a cell's
 * textContent reads "25-May-2625-May2026": the two-digit year runs straight into
 * the repeated day. Matching a greedy 2-4 digit year there yields "2625", so the
 * patterns below are tried in order of decreasing confidence.
 */
LTP.DATE_PATTERNS = [
  /^(\d{1,2})-([A-Za-z]{3})-(\d{2,4})$/,              // the whole string is one date
  /(\d{1,2})-([A-Za-z]{3})-((?:19|20)\d{2})(?!\d)/,   // unambiguous 4-digit year
  /(\d{1,2})-([A-Za-z]{3})-(\d{2})(?!\d)/,            // 2-digit year at a boundary
  /(\d{1,2})-([A-Za-z]{3})-(\d{2})/,                  // 2-digit year, repeat follows
];

LTP.parseDate = function (text) {
  var str = (text || '').trim();
  for (var i = 0; i < LTP.DATE_PATTERNS.length; i++) {
    var m = LTP.DATE_PATTERNS[i].exec(str);
    if (!m) continue;
    var mon = LTP.MONTHS[m[2].toLowerCase()];
    if (mon === undefined) continue;
    var year = parseInt(m[3], 10);
    if (year < 100) year += 2000;
    var day = parseInt(m[1], 10);
    if (day < 1 || day > 31) continue;
    return new Date(Date.UTC(year, mon, day));
  }
  return null;
};

/* Prefer a descendant element whose text is exactly one date — that avoids the
 * concatenation above entirely. Falls back to parsing the cell's text. */
LTP.dateFromCell = function (td) {
  if (!td) return null;
  var exact = LTP.DATE_PATTERNS[0];
  var own = (td.textContent || '').trim();
  if (exact.test(own)) return LTP.parseDate(own);

  var nodes = td.querySelectorAll ? td.querySelectorAll('*') : [];
  for (var i = 0; i < nodes.length; i++) {
    var t = (nodes[i].textContent || '').trim();
    if (exact.test(t)) {
      var d = LTP.parseDate(t);
      if (d) return d;
    }
  }
  return LTP.parseDate(own);
};

LTP.fmtDate = function (d) {
  if (!d) return '';
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return String(d.getUTCDate()).padStart(2, '0') + ' ' + months[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
};

LTP.todayUTC = function () {
  var n = new Date();
  return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()));
};

LTP.daysBetween = function (a, b) {
  if (!a || !b) return null;
  return Math.round((b - a) / 86400000);
};

/* Sort rounds by how far the player actually got, not alphabetically. */
LTP.ROUND_RANK = (function () {
  var order = ['q.', 'q', 'qual', 'rr', '1st', '2nd', '3rd', '4th', 'r128', 'r64', 'r32', 'r16', 'qf', 'sf', 'f', 'w'];
  var map = {};
  // Explicit progression: qualifying < early rounds < R16 < QF < SF < F < W.
  var ranks = {
    'q.': 0, q: 0, qual: 0, rr: 1,
    '1st': 2, r128: 2, '2nd': 3, r64: 3, '3rd': 4, r32: 4, '4th': 5, r16: 5,
    qf: 6, sf: 7, f: 8, w: 9,
  };
  order.forEach(function (k) { map[k] = ranks[k]; });
  return map;
})();

LTP.roundRank = function (round) {
  var key = (round || '').toLowerCase().replace(/\s+/g, '');
  if (LTP.ROUND_RANK[key] !== undefined) return LTP.ROUND_RANK[key];
  return -1;
};

/* Category ordering: biggest events first. Works for both WTA and ATP labels. */
LTP.categoryRank = function (cat) {
  var c = (cat || '').toLowerCase();
  if (c.indexOf('grand slam') >= 0) return 0;
  if (c.indexOf('finals') >= 0) return 1;
  if (c.indexOf('1000') >= 0) return 2;
  if (c.indexOf('500') >= 0) return 3;
  if (c.indexOf('250') >= 0) return 4;
  if (c.indexOf('125') >= 0) return 5;
  if (c.indexOf('challenger') >= 0) return 6;
  if (c.indexOf('itf') >= 0) return 7;
  return 8;
};

/* True once we cross Tennis Tonic's "NON-COUNTABLE TOURNAMENTS" divider. */
LTP.isNonCountableHeader = function (text) {
  return /non-?countable/i.test(text || '');
};

LTP.isColumnHeader = function (cells) {
  if (cells.length < 4) return false;
  var first = (cells[0] || '').toLowerCase().trim();
  var last = (cells[cells.length - 1] || '').toLowerCase().trim();
  return first === 'date' && /drop/.test(last);
};

/*
 * Parse every .breakdown_table in a Tennis Tonic "live-rankings" document into a
 * flat list of point-earning results. Returns {rows, statedTotal, playerName}.
 */
LTP.parseBreakdown = function (doc) {
  var tables = doc.querySelectorAll('table.breakdown_table');
  var rows = [];
  var statedTotal = null;
  var category = '';
  var countable = true;

  tables.forEach(function (table) {
    var trs = table.querySelectorAll('tr');
    trs.forEach(function (tr) {
      var tds = Array.prototype.slice.call(tr.querySelectorAll('td, th'));
      var texts = tds.map(function (td) {
        return (td.textContent || '').replace(/\s+/g, ' ').trim();
      });

      if (texts.length === 0) return;

      // Section header, e.g. "WTA 1000" or the non-countable divider.
      if (texts.length === 1 || (texts.length === 2 && !texts[1])) {
        var label = texts[0];
        if (!label) return;
        if (LTP.isNonCountableHeader(label)) {
          countable = false;
          category = '';
        } else {
          category = label;
        }
        return;
      }

      // "Total Point | 3031" — the number may sit in any later cell, since the
      // row is padded out with empty/colspan cells to match the table width.
      if (/^total\s*point/i.test(texts[0])) {
        for (var ti = texts.length - 1; ti >= 1; ti--) {
          var t = parseInt((texts[ti] || '').replace(/[^\d]/g, ''), 10);
          if (!isNaN(t)) { statedTotal = t; break; }
        }
        return;
      }

      if (LTP.isColumnHeader(texts)) return;
      if (texts.length < 5) return;

      var date = LTP.dateFromCell(tds[0]);
      var drop = LTP.dateFromCell(tds[4]);
      var points = parseInt((texts[3] || '').replace(/[^\d-]/g, ''), 10);
      if (!date && !drop) return;
      if (isNaN(points)) return;

      var link = tds[1] ? tds[1].querySelector('a[href]') : null;

      rows.push({
        date: date,
        tournament: texts[1] || '',
        tournamentUrl: link ? LTP.safeHttpUrl(link.getAttribute('href')) : '',
        category: category || (countable ? 'Other' : 'Non-countable'),
        round: texts[2] || '',
        points: points,
        drop: drop,
        countable: countable,
      });
    });
  });

  var nameEl = doc.querySelector('h1, title');
  var playerName = '';
  if (nameEl) {
    playerName = (nameEl.textContent || '').replace(/'s.*$/, '').trim();
  }

  return { rows: rows, statedTotal: statedTotal, playerName: playerName };
};

/*
 * Pull candidate players out of the response from
 * POST /city_dropdown/search_player.php (body: mysearchString=<folded name>).
 * The response is a fragment of onClick='fillsearch("Name","43323","wta");' divs.
 */
LTP.parseSearchResults = function (html) {
  var out = [];
  var re = /fillsearch(?:_recent|_header)?\(\s*"([^"]*)"\s*,\s*"(\d+)"\s*,\s*"(atp|wta)"\s*\)/gi;
  var m;
  while ((m = re.exec(html)) !== null) {
    out.push({ name: m[1], pid: m[2], tour: m[3].toLowerCase() });
  }
  return out;
};

/* The URL slug is ignored by Tennis Tonic — the pid alone resolves the player. */
LTP.breakdownUrl = function (tour, pid, name) {
  var slug = encodeURIComponent((LTP.fold(name) || 'player').replace(/\s+/g, '-'));
  return 'https://tennistonic.com/stats-players/' + tour + '/' + pid + '/' + slug + '/live-rankings/';
};

/* Small DOM builder shared by every surface; lives here so builds that do
 * not render the table need not ship the renderer. */
LTP.el = function (tag, attrs, children) {
  var n = document.createElement(tag);
  if (attrs) {
    Object.keys(attrs).forEach(function (k) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'text') n.textContent = attrs[k];
      else if (k === 'title' && !attrs[k]) { /* skip empty */ }
      else n.setAttribute(k, attrs[k]);
    });
  }
  (children || []).forEach(function (c) { if (c) n.appendChild(c); });
  return n;
};

window.LTP = LTP;
