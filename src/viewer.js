/*
 * Viewer page: resolve a player name to a Tennis Tonic player id, fetch their
 * live-rankings breakdown, and render it as one sortable table.
 */
(function () {
  var statusEl = document.getElementById('status');
  var contentEl = document.getElementById('content');

  var params = new URLSearchParams(location.search);
  var rawName = params.get('name') || '';
  var tour = (params.get('tour') || 'wta').toLowerCase();
  var forcedPid = params.get('pid');

  // Player ids are stable, but not forever — a cached id is re-checked monthly.
  var CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

  if (tour !== 'atp' && tour !== 'wta') tour = 'wta';
  document.title = rawName ? rawName + ' — points & expiry' : 'Ranking points & expiry';

  function setStatus(node) {
    statusEl.textContent = '';
    if (typeof node === 'string') {
      statusEl.appendChild(LTP.el('p', { class: 'ltp-msg', text: node }));
    } else if (node) {
      statusEl.appendChild(node);
    }
  }

  function clearStatus() { statusEl.textContent = ''; }

  function cacheKey(name) { return 'pid:' + tour + ':' + LTP.fold(name).toLowerCase(); }

  async function cacheGet(name) {
    try {
      var key = cacheKey(name);
      var stored = await chrome.storage.local.get(key);
      var entry = stored[key];
      if (!entry) return null;
      // Tolerate ids written by an earlier version as a bare string.
      if (typeof entry === 'string') return entry;
      if (entry.pid && Date.now() - (entry.at || 0) < CACHE_TTL_MS) return entry.pid;
      return null;
    } catch (e) {
      return null;
    }
  }

  async function cacheSet(name, pid) {
    try {
      var o = {};
      o[cacheKey(name)] = { pid: pid, at: Date.now() };
      await chrome.storage.local.set(o);
    } catch (e) { /* caching is best-effort */ }
  }

  async function searchPlayers(query) {
    var r = await fetch('https://tennistonic.com/city_dropdown/search_player.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: 'mysearchString=' + encodeURIComponent(query),
      credentials: 'include',
    });
    if (!r.ok) throw new Error('search HTTP ' + r.status);
    return LTP.parseSearchResults(await r.text());
  }

  /* Try the full name, then surname only, then first name — Tennis Tonic indexes
   * some players under a surname alone (e.g. "Fernandez", "Siskova"). */
  async function resolvePid(name) {
    var folded = LTP.fold(name);
    var parts = folded.split(' ').filter(Boolean);
    var attempts = [folded];
    if (parts.length > 1) {
      attempts.push(parts[parts.length - 1]);
      attempts.push(parts[0]);
    }

    var lastError = null;
    for (var i = 0; i < attempts.length; i++) {
      var list;
      try {
        list = await searchPlayers(attempts[i]);
      } catch (err) {
        lastError = err;
        continue;
      }

      var sameTour = list.filter(function (p) { return p.tour === tour; });
      if (!sameTour.length) continue;

      var exact = sameTour.filter(function (p) {
        return LTP.fold(p.name).toLowerCase() === folded.toLowerCase();
      });
      if (exact.length === 1) return [exact[0]];

      // Surname matches and the first initial agrees — good enough to auto-pick.
      if (parts.length > 1) {
        var narrowed = sameTour.filter(function (p) {
          var pf = LTP.fold(p.name).toLowerCase().split(' ').filter(Boolean);
          var surnameMatch = pf.indexOf(parts[parts.length - 1]) >= 0;
          var initialMatch = pf.length === 1 || pf[0][0] === parts[0][0];
          return surnameMatch && initialMatch;
        });
        if (narrowed.length) return narrowed;
      }

      var seen = {};
      var uniq = sameTour.filter(function (p) {
        if (seen[p.pid]) return false;
        seen[p.pid] = true;
        return true;
      });
      if (uniq.length) return uniq;
    }

    if (lastError) throw lastError;
    return [];
  }

  async function fetchBreakdown(pid, name) {
    var url = LTP.breakdownUrl(tour, pid, name);
    var r = await fetch(url, { credentials: 'include' });
    if (!r.ok) throw new Error('breakdown HTTP ' + r.status);
    var html = await r.text();
    // DOMParser does not execute scripts, and only text and vetted http(s)
    // hrefs are read back out of the result.
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var data = LTP.parseBreakdown(doc);
    data.sourceUrl = url;
    data.tour = tour;
    if (!data.playerName || /tennis tonic/i.test(data.playerName)) data.playerName = name;
    return data;
  }

  function showError(message, pid) {
    var box = LTP.el('div', { class: 'ltp-error' });
    box.appendChild(LTP.el('h2', { text: "Couldn't load the breakdown" }));
    box.appendChild(LTP.el('p', { text: message }));
    box.appendChild(LTP.el('p', {
      class: 'ltp-dim',
      text: 'Tennis Tonic sits behind a bot check that can block background requests. '
        + 'Opening the page directly works — this extension rewrites it into the same sortable table once it loads.',
    }));
    var href = pid
      ? LTP.breakdownUrl(tour, pid, rawName) + '#ltp'
      : 'https://tennistonic.com/rankings/?m=' + tour;
    box.appendChild(LTP.el('p', {}, [
      LTP.el('a', {
        class: 'ltp-btn-link', href: href, target: '_blank', rel: 'noreferrer noopener',
        text: pid ? 'Open ' + (rawName || 'player') + ' on tennistonic.com' : 'Open tennistonic.com rankings',
      }),
    ]));
    setStatus(box);
  }

  function showChooser(candidates) {
    var box = LTP.el('div', { class: 'ltp-chooser' });
    box.appendChild(LTP.el('h2', { text: 'Which player did you mean?' }));
    box.appendChild(LTP.el('p', {
      class: 'ltp-dim',
      text: 'Searched for "' + rawName + '" on the ' + tour.toUpperCase() + ' tour.',
    }));
    var ul = LTP.el('ul', { class: 'ltp-candidates' });
    candidates.forEach(function (p) {
      var a = LTP.el('a', { href: '#', text: p.name + ' (#' + p.pid + ')' });
      a.addEventListener('click', async function (e) {
        e.preventDefault();
        await cacheSet(rawName, p.pid);
        load(p.pid, p.name);
      });
      ul.appendChild(LTP.el('li', {}, [a]));
    });
    box.appendChild(ul);
    setStatus(box);
  }

  async function load(pid, name) {
    setStatus('Loading ' + (name || rawName) + "'s points breakdown…");
    try {
      var data = await fetchBreakdown(pid, name || rawName);
      if (!data.rows.length) {
        showError('The page loaded but contained no points breakdown table.', pid);
        return;
      }
      clearStatus();
      LTP.renderTable(contentEl, data);
    } catch (err) {
      showError(String((err && err.message) || err), pid);
    }
  }

  async function start() {
    if (!rawName && !forcedPid) {
      setStatus('No player specified.');
      return;
    }
    if (forcedPid) {
      await load(forcedPid, rawName);
      return;
    }

    setStatus('Looking up ' + rawName + '…');

    var cached = await cacheGet(rawName);
    if (cached) {
      await load(cached, rawName);
      return;
    }

    var candidates;
    try {
      candidates = await resolvePid(rawName);
    } catch (err) {
      showError('Player lookup failed: ' + String((err && err.message) || err), null);
      return;
    }

    if (!candidates.length) {
      showError('No ' + tour.toUpperCase() + ' player found matching "' + rawName + '".', null);
      return;
    }
    if (candidates.length === 1) {
      await cacheSet(rawName, candidates[0].pid);
      await load(candidates[0].pid, candidates[0].name);
      return;
    }
    showChooser(candidates);
  }

  start();
})();
