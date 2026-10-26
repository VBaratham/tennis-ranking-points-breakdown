/*
 * Forwarder used by the public build. live-tennis.eu gives us a player name but
 * no id, and Tennis Tonic's pages are addressed by id, so this page resolves the
 * one to the other and then hands the browser straight over to them.
 *
 * It deliberately fetches nothing but the lookup: no page content is copied.
 */
(function () {
  var statusEl = document.getElementById('status');

  var params = new URLSearchParams(location.search);
  var rawName = params.get('name') || '';
  var tour = (params.get('tour') || 'wta').toLowerCase();
  if (tour !== 'atp' && tour !== 'wta') tour = 'wta';

  var CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

  document.title = rawName ? 'Opening ' + rawName + '…' : 'Opening player page…';

  function setStatus(node) {
    statusEl.textContent = '';
    if (typeof node === 'string') {
      statusEl.appendChild(LTP.el('p', { class: 'ltp-msg', text: node }));
    } else if (node) {
      statusEl.appendChild(node);
    }
  }

  function cacheKey(name) { return 'pid:' + tour + ':' + LTP.fold(name).toLowerCase(); }

  async function cacheGet(name) {
    try {
      var key = cacheKey(name);
      var stored = await chrome.storage.local.get(key);
      var entry = stored[key];
      if (!entry) return null;
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
    } catch (e) { /* best effort */ }
  }

  async function searchPlayers(query) {
    var r = await fetch('https://tennistonic.com/city_dropdown/search_player.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: 'mysearchString=' + encodeURIComponent(query),
      credentials: 'include',
    });
    if (!r.ok) throw new Error('lookup HTTP ' + r.status);
    return LTP.parseSearchResults(await r.text());
  }

  async function resolveCandidates(name) {
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

  function handOver(pid, name) {
    // replace() so Back returns to the ranking page, not to this forwarder.
    location.replace(LTP.breakdownUrl(tour, pid, name || rawName));
  }

  function showFallback(message) {
    var box = LTP.el('div', { class: 'ltp-error' });
    box.appendChild(LTP.el('h2', { text: "Couldn't find that player" }));
    box.appendChild(LTP.el('p', { text: message }));
    box.appendChild(LTP.el('p', {}, [
      LTP.el('a', {
        class: 'ltp-btn-link',
        href: 'https://tennistonic.com/rankings/?m=' + tour,
        rel: 'noreferrer noopener',
        text: 'Browse the ' + tour.toUpperCase() + ' rankings on tennistonic.com',
      }),
    ]));
    setStatus(box);
  }

  function showChooser(candidates) {
    var box = LTP.el('div', { class: 'ltp-chooser' });
    box.appendChild(LTP.el('h2', { text: 'Which player did you mean?' }));
    box.appendChild(LTP.el('p', {
      class: 'ltp-dim',
      text: 'More than one ' + tour.toUpperCase() + ' player matches "' + rawName + '".',
    }));
    var ul = LTP.el('ul', { class: 'ltp-candidates' });
    candidates.forEach(function (p) {
      var a = LTP.el('a', { href: '#', text: p.name });
      a.addEventListener('click', async function (e) {
        e.preventDefault();
        await cacheSet(rawName, p.pid);
        handOver(p.pid, p.name);
      });
      ul.appendChild(LTP.el('li', {}, [a]));
    });
    box.appendChild(ul);
    setStatus(box);
  }

  async function start() {
    if (!rawName) {
      showFallback('No player name was given.');
      return;
    }

    setStatus('Finding ' + rawName + ' on tennistonic.com…');

    var cached = await cacheGet(rawName);
    if (cached) { handOver(cached, rawName); return; }

    var candidates;
    try {
      candidates = await resolveCandidates(rawName);
    } catch (err) {
      showFallback('The player lookup failed: ' + String((err && err.message) || err));
      return;
    }

    if (!candidates.length) {
      showFallback('No ' + tour.toUpperCase() + ' player on tennistonic.com matches "' + rawName + '".');
      return;
    }
    if (candidates.length === 1) {
      await cacheSet(rawName, candidates[0].pid);
      handOver(candidates[0].pid, candidates[0].name);
      return;
    }
    showChooser(candidates);
  }

  start();
})();
