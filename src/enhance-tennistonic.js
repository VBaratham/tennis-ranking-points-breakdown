/*
 * On a Tennis Tonic "live-rankings" page, insert a single sortable table
 * containing every point — countable and not — above their sectioned tables.
 */
(function () {
  if (document.querySelector('.ltp-injected')) return;

  var first = document.querySelector('table.breakdown_table');
  if (!first) return;

  var data = LTP.parseBreakdown(document);
  if (!data.rows.length) return;
  data.sourceUrl = '';

  var panel = document.createElement('div');
  panel.className = 'ltp-injected ltp-root-wrap';
  var inner = document.createElement('div');
  panel.appendChild(inner);

  first.parentNode.insertBefore(panel, first);
  LTP.renderTable(inner, data);

  var note = document.createElement('p');
  note.className = 'ltp-footnote';
  note.textContent = 'Added by the Live Tennis — Points & Expiry extension. Tennis Tonic’s own tables follow below.';
  panel.appendChild(note);

  if (location.hash === '#ltp') {
    panel.scrollIntoView({ block: 'start' });
  }
})();
