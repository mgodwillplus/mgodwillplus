/* MGodwill+ live TV (v9). Deliberately self-contained, so that it can move to its own repository later:
   it needs only sb.js, supabase-config.js and style.css. Channels are managed in admin-media.html. */
(function () {
  'use strict';
  var S = window.MGSB, PAGE = document.body.getAttribute('data-page'), app = document.getElementById('app');
  if (!S || !S.on || (PAGE !== 'tv' && PAGE !== 'home')) return;
  var esc = S.esc, Q = '/rest/v1/mg_media?select=id,title,url&kind=eq.tv&published=eq.true&order=created_at.asc&limit=50';

  /* ---- home: a Live TV strip right under the featured carousel ---- */
  if (PAGE === 'home') {
    var rows = null;
    var place = function () {
      if (!rows || !rows.length || document.getElementById('tvsec')) return;
      var sec = document.createElement('section'); sec.className = 'sec'; sec.id = 'tvsec';
      sec.innerHTML = '<div class="sh"><h2>Live TV</h2><a href="tv.html">All channels</a></div><div class="rail">' + rows.map(function (c) {
        var t = S.ytThumb(c.url);
        return '<article class="card"><a class="cl" href="tv.html?c=' + encodeURIComponent(c.id) + '"><div class="th" data-i="' + esc(c.title.charAt(0)) + '">' + (t ? '<img src="' + esc(t) + '" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">' : '') +
          '<span class="live"><i></i>LIVE TV</span></div><div class="ct"><h3>' + esc(c.title) + '</h3><p>Tap to watch</p></div></a></article>';
      }).join('') + '</div>';
      var after = app.querySelector('.hcar, .hero');
      if (after) after.insertAdjacentElement('afterend', sec); else app.insertBefore(sec, app.firstChild);
    };
    document.addEventListener('mg:rendered', place); /* the page redraws when videos arrive; put the strip back */
    S.api(Q).then(function (r) { rows = r || []; place(); }, function () {});
    return;
  }

  /* ---- tv.html: one player, with the channel list beside or below it ---- */
  app.innerHTML = '<div class="pg"><p class="empty">Loading…</p></div>';
  S.api(Q).then(function (rows) {
    rows = rows || [];
    if (!rows.length) { app.innerHTML = '<div class="pg"><h1>TV</h1><p class="lead">No channels yet. Please check back soon.</p></div>'; return; }
    var want = new URLSearchParams(location.search).get('c'), cur = rows.filter(function (r) { return r.id === want; })[0] || rows[0];
    app.innerHTML = '<div class="pl"><div class="pmain"><div class="pwrap" id="pwrap"><iframe id="tf" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen></iframe></div>' +
      '<div class="pinfo"><span class="live"><i></i>LIVE TV</span><h1 id="tn"></h1><div class="btns"><a class="btn" id="to" target="_blank" rel="noopener">Open on YouTube</a></div>' +
      '<p class="fine">Between broadcasts, YouTube shows its own message in the player.</p></div></div>' +
      '<aside class="pside"><h2>Channels</h2><div class="rows" id="tl">' + rows.map(function (c) {
        var t = S.ytThumb(c.url);
        return '<article class="row"><a class="rl" href="tv.html?c=' + encodeURIComponent(c.id) + '" data-id="' + esc(c.id) + '"><div class="rth" data-i="' + esc(c.title.charAt(0)) + '">' + (t ? '<img src="' + esc(t) + '" alt="" loading="lazy" referrerpolicy="no-referrer">' : '') + '</div><div class="rt"><h3>' + esc(c.title) + '</h3><p>Live TV</p></div></a></article>';
      }).join('') + '</div></aside></div>';
    var show = function (c, auto) {
      cur = c; var e = S.ytEmbed(c.url, auto), f = document.getElementById('tf');
      f.title = c.title; if (e) f.src = e; else f.removeAttribute('src');
      document.getElementById('tn').textContent = c.title; document.getElementById('to').href = S.ytOpen(c.url); document.title = c.title + ' | MGodwill+ TV';
      [].forEach.call(document.querySelectorAll('#tl .rl'), function (a) { a.setAttribute('aria-current', a.getAttribute('data-id') === c.id ? 'true' : 'false'); });
    };
    document.getElementById('tl').onclick = function (ev) {
      var a = ev.target.closest('a[data-id]'); if (!a || ev.metaKey || ev.ctrlKey || ev.shiftKey) return;
      ev.preventDefault(); var c = rows.filter(function (r) { return r.id === a.getAttribute('data-id'); })[0];
      if (c) { show(c, true); try { history.replaceState(null, '', 'tv.html?c=' + encodeURIComponent(c.id)); } catch (e) {} window.scrollTo({ top: 0, behavior: 'smooth' }); }
    };
    show(cur, false);
  }, function () { app.innerHTML = '<div class="pg"><h1>TV</h1><p class="lead">The channels could not be reached just now. Please try again shortly.</p></div>'; });
})();
