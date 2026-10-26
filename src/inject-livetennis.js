/*
 * Turns each player name on live-tennis.eu into a link to the extension's
 * points-and-expiry viewer. Idempotent, and re-applies itself when the site
 * re-sorts or re-renders the ranking table.
 */
(function () {
  var MARK = 'data-ltp-linked';
  // The live ranking lists ~1000 players, so the rewrite is spread across
  // frames rather than blocking the main thread in one long task.
  var BATCH = 50;

  function tourFromUrl() {
    var p = location.pathname.toLowerCase();
    return p.indexOf('atp') >= 0 ? 'atp' : 'wta';
  }

  var TOUR = tourFromUrl();

  // Set by src/target-*.js, which differs between the public and full builds:
  // the public build forwards to tennistonic.com, the full build opens our table.
  var TARGET = typeof LTP_TARGET === 'string' ? LTP_TARGET : 'viewer.html';

  function viewerUrl(name) {
    return chrome.runtime.getURL(TARGET) +
      '?tour=' + encodeURIComponent(TOUR) +
      '&name=' + encodeURIComponent(name);
  }

  function linkCell(td) {
    if (td.getAttribute(MARK)) return;
    // Skip header cells and anything that already contains a link.
    if (td.querySelector('a')) { td.setAttribute(MARK, 'skip'); return; }
    var name = (td.textContent || '').replace(/\s+/g, ' ').trim();
    if (!name || name.length < 2) return;

    var a = document.createElement('a');
    a.className = 'ltp-link';
    a.href = viewerUrl(name);
    a.target = '_blank';
    a.rel = 'noreferrer noopener';
    a.title = 'Where ' + name + "'s ranking points come from, and when they expire";
    a.textContent = name;
    // The site attaches its own handlers to rows; don't let them hijack the click.
    a.addEventListener('click', function (e) { e.stopPropagation(); });

    td.replaceChildren(a);
    td.setAttribute(MARK, '1');
  }

  var running = false;

  async function run() {
    if (running) return;
    running = true;
    try {
      var pending = document.querySelectorAll('td.pn:not([' + MARK + '])');
      for (var i = 0; i < pending.length; i += BATCH) {
        var slice = Array.prototype.slice.call(pending, i, i + BATCH);
        await new Promise(function (resolve) {
          requestAnimationFrame(function () {
            slice.forEach(linkCell);
            resolve();
          });
        });
        if (globalThis.scheduler && globalThis.scheduler.yield) await scheduler.yield();
      }
    } finally {
      running = false;
    }
  }

  run();

  // Re-link after the site sorts, paginates or lazily fills the table. Our own
  // writes also trigger this; the marker attribute makes those passes no-ops.
  var scheduled = false;
  var observer = new MutationObserver(function () {
    if (scheduled || running) return;
    scheduled = true;
    requestAnimationFrame(function () { scheduled = false; run(); });
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
