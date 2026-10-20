/* MGodwill+ gallery (v7): Pinterest-style photographs, each with a description and an optional article,
   stored in Supabase. Reads supabase-config.js. Never touches catalogue.js or books.js. */
(function () {
  'use strict';
  var CFG = typeof MG_SUPABASE !== 'undefined' ? MG_SUPABASE : {}, PAGE = document.body.getAttribute('data-page'), app = document.getElementById('app');
  if (['photos', 'post', 'admin', 'home', 'account', 'play'].indexOf(PAGE) < 0) return;
  var ON = !!(CFG.url && CFG.key);
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var msg = function (h, t) { return '<div class="pg"><h1>' + h + '</h1><p class="lead">' + t + '</p></div>'; };
  if (!ON) { if (['photos', 'post', 'admin', 'account'].indexOf(PAGE) >= 0) app.innerHTML = msg('Photos', 'The gallery is being set up. Please check back soon.'); return; }

  /* ---- Supabase over plain fetch (publishable key only; row-level security does the guarding) ---- */
  var SK = 'mg_sb_session';
  function sess() { try { return JSON.parse(localStorage.getItem(SK) || 'null'); } catch (e) { return null; } }
  function setSess(s) { try { if (s) localStorage.setItem(SK, JSON.stringify(s)); else localStorage.removeItem(SK); } catch (e) {} }
  function api(path, o, retried) {
    o = o || {}; var s = sess(), h = { apikey: CFG.key, 'Content-Type': 'application/json' };
    if (o.auth && s) h.Authorization = 'Bearer ' + s.access_token;
    if (o.prefer) h.Prefer = o.prefer;
    return fetch(CFG.url + path, { method: o.method || 'GET', headers: h, body: o.body ? JSON.stringify(o.body) : undefined }).then(function (r) {
      if (r.status === 401 && o.auth && s && s.refresh_token && !retried) {
        return api('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: s.refresh_token } }).then(function (n) { setSess(n); return api(path, o, true); }, function () { setSess(null); throw new Error('Please sign in again.'); });
      }
      return r.text().then(function (t) {
        var j = null; try { j = t ? JSON.parse(t) : null; } catch (e) {}
        if (!r.ok) { var er = new Error((j && (j.message || j.msg || j.error_description)) || 'HTTP ' + r.status); er.status = r.status; throw er; }
        return j;
      });
    });
  }
  var T = '/rest/v1/mg_posts';

  /* ---- helpers ---- */
  function img(u, w) { /* Google Drive links become thumbnails; any other https link is used as it is */
    u = u || ''; var m = /\/file\/d\/([^/?#]+)/.exec(u) || (/drive\.google\.com/.test(u) ? /[?&]id=([^&#]+)/.exec(u) : null);
    return m ? 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w' + (w || 800) : (/^https?:\/\//i.test(u) ? u : '');
  }
  function inl(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>').replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>'); }
  function md(src) { /* small, safe article formatting: # headings, - bullets, > quotes, **bold**, *italic*, [text](https://link) */
    var out = [], para = [], m;
    function flush() { if (para.length) { out.push('<p>' + inl(para.join('\n')).replace(/\n/g, '<br>') + '</p>'); para = []; } }
    String(src || '').replace(/\r/g, '').split('\n').forEach(function (l) {
      var t = l.trim();
      if (!t) { flush(); return; }
      if ((m = /^(#{1,3})\s+(.*)$/.exec(t))) { flush(); out.push('<h' + (m[1].length + 1) + '>' + inl(m[2]) + '</h' + (m[1].length + 1) + '>'); return; }
      if ((m = /^[-*]\s+(.*)$/.exec(t))) { flush(); out.push('<p class="li">&bull; ' + inl(m[1]) + '</p>'); return; }
      if ((m = /^>\s?(.*)$/.exec(t))) { flush(); out.push('<blockquote>' + inl(m[1]) + '</blockquote>'); return; }
      para.push(t);
    });
    flush(); return out.join('');
  }
  var when = function (d) { try { return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }); } catch (e) { return ''; } };
  function tile(p) {
    var cap = p.title || p.description || p.has_article;
    return '<a class="tile" href="post.html?id=' + encodeURIComponent(p.id) + '"><img src="' + esc(img(p.image_url, 700)) + '" alt="' + esc(p.title || (p.description || 'Photograph').slice(0, 80)) + '" loading="lazy" decoding="async" referrerpolicy="no-referrer">' +
      (cap ? '<div class="tt">' + (p.has_article ? '<span class="badge">Article</span>' : '') + (p.title ? '<h3>' + esc(p.title) + '</h3>' : '') + (p.description ? '<p>' + esc(p.description) + '</p>' : '') + '</div>' : '') + '</a>';
  }
  document.addEventListener('error', function (e) { if (e.target.tagName === 'IMG' && e.target.closest('.tile,.pimg')) e.target.classList.add('bad'); }, true);
  var LIST = '?select=id,created_at,title,description,image_url,category,has_article&published=eq.true&order=created_at.desc&limit=200';

  /* ---- links from confirmation / reset emails arrive with a token in the address ---- */
  var HS = location.hash.replace(/^#/, '');
  if (/(^|&)(access_token|error_description)=/.test(HS)) {
    var hp = new URLSearchParams(HS); history.replaceState(null, '', location.pathname + location.search);
    if (hp.get('access_token')) {
      var ns = { access_token: hp.get('access_token'), refresh_token: hp.get('refresh_token') }; setSess(ns);
      api('/auth/v1/user', { auth: true }).then(function (u) { ns.user = u; setSess(ns); }, function () {}).then(function () { location.replace('account.html' + (hp.get('type') === 'recovery' ? '?mode=reset' : '?welcome=1')); });
    } else { try { sessionStorage.setItem('mg_auth_err', hp.get('error_description') || 'That link did not work.'); } catch (e) {} location.replace('account.html'); }
    return;
  }
  var enc = encodeURIComponent, fmt = function (n) { n = +n || 0; return n >= 1e6 ? (n / 1e6).toFixed(1).replace('.0', '') + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1).replace('.0', '') + 'k' : String(n); };

  /* ---- likes and views: a like needs a free account; a view is counted once per visit ---- */
  function engage(host, key) {
    var ref = host.querySelector('.btns'); if (!ref) return;
    var el = document.createElement('div'); el.className = 'eng';
    el.innerHTML = '<button class="btn like" type="button" aria-pressed="false"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg><span class="lc">0</span><span class="sr"> likes</span></button><span class="vw"><span class="vc">0</span> views</span><span class="eh" role="status"></span>';
    ref.parentNode.insertBefore(el, ref);
    var btn = $('.like', el), lc = $('.lc', el), vc = $('.vc', el), eh = $('.eh', el), liked = false, tk = 'mg_v_' + key, seen = null;
    var stats = function () { return api('/rest/v1/mg_stats?select=views,likes&item_key=eq.' + enc(key)).then(function (r) { var s = (r && r[0]) || {}; lc.textContent = fmt(s.likes); vc.textContent = fmt(s.views); }, function () {}); };
    try { seen = sessionStorage.getItem(tk); } catch (e) {}
    (seen ? Promise.resolve() : api('/rest/v1/rpc/mg_track_view', { method: 'POST', body: { k: key } }).then(function () { try { sessionStorage.setItem(tk, '1'); } catch (e) {} }, function () {})).then(stats);
    if (sess()) api('/rest/v1/mg_likes?select=item_key&item_key=eq.' + enc(key), { auth: true }).then(function (r) { liked = !!(r && r.length); btn.setAttribute('aria-pressed', liked); }, function () {});
    btn.onclick = function () {
      if (!sess()) { location.href = 'account.html?next=' + enc(location.pathname.split('/').pop() + location.search); return; }
      var want = !liked; eh.textContent = ''; btn.disabled = true;
      api(want ? '/rest/v1/mg_likes' : '/rest/v1/mg_likes?item_key=eq.' + enc(key), { method: want ? 'POST' : 'DELETE', body: want ? { item_key: key } : undefined, auth: true, prefer: 'return=minimal' }).then(null, function (e) { if (!(want && e.status === 409)) throw e; })
        .then(function () { liked = want; btn.setAttribute('aria-pressed', liked); return stats(); }, function (e) { eh.textContent = e.message; }).then(function () { btn.disabled = false; });
    };
  }
  if (PAGE === 'play') { /* the page may be drawn again when an added video arrives, so check each time */
    var pid = new URLSearchParams(location.search).get('id') || '', tryEng = function () { var pi = $('.pinfo'); if (pi && !$('.eng', pi) && /^[A-Za-z0-9_-]{1,80}$/.test(pid)) engage(pi, 'play:' + pid); };
    tryEng(); document.addEventListener('mg:rendered', tryEng); return;
  }

  /* ---- account: sign in, create an account, reset a password ---- */
  if (PAGE === 'account') {
    var Q = new URLSearchParams(location.search), back = (Q.get('next') || '');
    back = /^[A-Za-z0-9_-]+\.html(\?[^#]*)?$/.test(back) ? back : '';
    var here = location.origin + location.pathname.replace(/[^/]*$/, '') + 'account.html', note = '';
    try { note = sessionStorage.getItem('mg_auth_err') || ''; sessionStorage.removeItem('mg_auth_err'); } catch (e) {}
    if (Q.get('welcome')) note = 'Your email is confirmed. You are signed in.';
    var shell = function (h, t, body) { app.innerHTML = '<div class="adm"><h1>' + h + '</h1><p class="lead">' + t + '</p>' + body + '</div>'; };
    var say = function (m, bad) { var e = $('#er'); if (e) { e.textContent = m; e.className = bad ? 'err' : 'ok'; } };
    var done = function (s) { setSess(s); location.href = back || 'account.html'; };
    var signedIn = function () {
      var s = sess(), who = (s.user && s.user.email) || 'your account';
      shell('Account', esc(who), '<p class="' + (note ? 'ok' : 'err') + '" id="er">' + esc(note) + '</p><div class="btns" id="ab">' + (back ? '<a class="btn pri" href="' + esc(back) + '">&larr; Back to where you were</a>' : '') + '<button class="btn" type="button" id="so">Sign out</button></div>');
      $('#so').onclick = function () { setSess(null); location.href = 'account.html'; };
      api('/rest/v1/rpc/mg_is_admin', { method: 'POST', body: {}, auth: true }).then(function (v) { if (v === true) $('#ab').insertAdjacentHTML('afterbegin', '<a class="btn" href="admin.html">Gallery admin</a>'); }, function () {});
    };
    var reset = function () {
      shell('New password', 'Choose a new password for your account.', '<form id="rf"><label class="fld">New password (at least 8 characters)<input id="np" type="password" minlength="8" autocomplete="new-password" required></label><p class="err" id="er"></p><button class="btn pri" type="submit">Save password</button></form>');
      $('#rf').onsubmit = function (e) { e.preventDefault(); api('/auth/v1/user', { method: 'PUT', body: { password: $('#np').value }, auth: true }).then(function () { location.href = 'account.html'; }, function (x) { say(x.message, true); }); };
    };
    var forms = function (mode) {
      var up = mode === 'up';
      shell(up ? 'Create account' : 'Sign in', up ? 'A free account lets you like videos, songs and photographs.' : 'Welcome back.',
        '<form id="af"><label class="fld">Email<input id="em" type="email" autocomplete="username" required></label><label class="fld">Password' + (up ? ' (at least 8 characters)' : '') + '<input id="pw" type="password" ' + (up ? 'minlength="8" autocomplete="new-password"' : 'autocomplete="current-password"') + ' required></label>' +
        '<p class="' + (note ? 'ok' : 'err') + '" id="er">' + esc(note) + '</p><button class="btn pri" type="submit">' + (up ? 'Create account' : 'Sign in') + '</button></form>' +
        '<p class="alt">' + (up ? 'Already have an account? <a href="#" id="sw">Sign in</a>' : 'New here? <a href="#" id="sw">Create an account</a> &middot; <a href="#" id="fp">Forgot password?</a>') + '</p>' +
        (up ? '<p class="fine">Your email is used only to sign you in and to count likes. It is never shown to anyone.</p>' : ''));
      $('#sw').onclick = function (e) { e.preventDefault(); note = ''; forms(up ? 'in' : 'up'); };
      if (!up) $('#fp').onclick = function (e) {
        e.preventDefault(); var m = $('#em').value.trim(); if (!m) { say('Type your email above first.', true); return; }
        api('/auth/v1/recover?redirect_to=' + enc(here), { method: 'POST', body: { email: m } }).then(function () { say('If that address has an account, a reset link is on its way.'); }, function (x) { say(x.message, true); });
      };
      $('#af').onsubmit = function (e) {
        e.preventDefault(); var m = $('#em').value.trim(), p = $('#pw').value; say('');
        if (up) api('/auth/v1/signup?redirect_to=' + enc(here), { method: 'POST', body: { email: m, password: p } }).then(function (r) {
          if (r && r.access_token) done(r); else say('Almost there. Check your inbox for a confirmation link, then come back and sign in.');
        }, function (x) { say(x.message, true); });
        else api('/auth/v1/token?grant_type=password', { method: 'POST', body: { email: m, password: p } }).then(done, function (x) { say(x.message, true); });
      };
    };
    if (Q.get('mode') === 'reset' && sess()) reset(); else if (sess()) signedIn(); else forms('in');
    return;
  }

  /* ---- home: a Photography row, only if there is something to show ---- */
  if (PAGE === 'home') {
    var prow = null, put = function () {
      if (!prow || !prow.length || document.getElementById('phsec')) return;
      var sec = document.createElement('section'); sec.className = 'sec'; sec.id = 'phsec';
      sec.innerHTML = '<div class="sh"><h2>Photography</h2><a href="photos.html">See all</a></div><div class="rail">' + prow.map(tile).join('') + '</div>';
      var jr = [].slice.call(document.querySelectorAll('#app .sec')).filter(function (x) { return /Journal/.test(x.textContent.slice(0, 40)); })[0];
      if (jr) jr.parentNode.insertBefore(sec, jr); else app.appendChild(sec);
    };
    document.addEventListener('mg:rendered', put); /* the page redraws when videos arrive; put the row back */
    api(T + LIST.replace('limit=200', 'limit=8')).then(function (rows) { prow = rows || []; put(); }, function () {});
    return;
  }

  /* ---- photos: masonry, like Pinterest ---- */
  if (PAGE === 'photos') {
    app.innerHTML = '<div class="pg"><h1>Photos</h1><p class="lead">Tap a photograph to see it larger, and to read the story behind it where there is one.</p><div id="ch"></div><div id="out"><p class="empty">Loading…</p></div></div>';
    api(T + LIST).then(function (rows) {
      rows = rows || [];
      if (!rows.length) { $('#out').innerHTML = '<p class="empty">No photographs yet.</p>'; return; }
      var cats = []; rows.forEach(function (r) { if (r.category && cats.indexOf(r.category) < 0) cats.push(r.category); });
      var show = function (c) { var l = c ? rows.filter(function (r) { return r.category === c; }) : rows; $('#out').innerHTML = '<div class="mas">' + l.map(tile).join('') + '</div>'; };
      if (cats.length > 1) {
        $('#ch').innerHTML = '<div class="chips" role="group" aria-label="Filter by album">' + ['All'].concat(cats).map(function (c, n) { return '<button class="chip" type="button" aria-pressed="' + (n === 0) + '">' + esc(c) + '</button>'; }).join('') + '</div>';
        [].forEach.call(document.querySelectorAll('#ch .chip'), function (b, n, all) { b.onclick = function () { [].forEach.call(all, function (x) { x.setAttribute('aria-pressed', x === b); }); show(n ? b.textContent : ''); }; });
      }
      show('');
    }, function () { $('#out').innerHTML = '<p class="empty">The gallery could not be reached just now. Please try again shortly.</p>'; });
    return;
  }

  /* ---- post: one photograph, with its article ---- */
  if (PAGE === 'post') {
    var id = new URLSearchParams(location.search).get('id') || '';
    app.innerHTML = '<div class="pg"><p class="empty">Loading…</p></div>';
    api(T + '?select=*&id=eq.' + encodeURIComponent(id), { auth: true }).then(function (rows) {
      var p = rows && rows[0];
      if (!p) { app.innerHTML = msg('Not found', 'We couldn’t find that photograph.') + '<div class="btns" style="padding:0 var(--pad)"><a class="btn pri" href="photos.html">Back to photos</a></div>'; return; }
      document.title = (p.title || 'Photograph') + ' | MGodwill+';
      app.innerHTML = '<div class="post"><a class="pimg" href="' + esc(p.image_url) + '" target="_blank" rel="noopener"><img src="' + esc(img(p.image_url, 1600)) + '" alt="' + esc(p.title || 'Photograph') + '" referrerpolicy="no-referrer"></a>' +
        '<div class="pbody"><p class="meta">' + esc([p.category, when(p.created_at)].filter(Boolean).join(' · ')) + '</p>' + (p.title ? '<h1>' + esc(p.title) + '</h1>' : '') +
        (p.description ? '<p class="pdesc">' + esc(p.description) + '</p>' : '') + (p.article ? '<div class="art">' + md(p.article) + '</div>' : '') +
        '<div class="btns"><a class="btn pri" href="photos.html">&larr; All photos</a><a class="btn" href="' + esc(p.image_url) + '" target="_blank" rel="noopener">Open original</a></div></div></div>';
      if (p.published) engage($('.pbody'), 'post:' + p.id);
    }, function () { app.innerHTML = msg('Photos', 'This photograph could not be loaded just now. Please try again shortly.'); });
    return;
  }

  /* ---- admin: sign in, then add, edit, hide or delete photographs ---- */
  if (PAGE === 'admin') {
    var editing = null, rowsCache = [];
    var login = function (note) {
      app.innerHTML = '<div class="adm"><p class="anav"><a href="admin.html" aria-current="page">Photographs</a><a href="admin-media.html">Videos, songs &amp; TV</a></p><h1>Sign in</h1><p class="lead">For the owner of MGodwill+ only.</p><form id="lf"><label class="fld">Email<input id="em" type="email" autocomplete="username" required></label><label class="fld">Password<input id="pw" type="password" autocomplete="current-password" required></label><p class="err" id="er">' + esc(note || '') + '</p><button class="btn pri" type="submit">Sign in</button></form></div>';
      $('#lf').onsubmit = function (e) {
        e.preventDefault(); $('#er').textContent = '';
        api('/auth/v1/token?grant_type=password', { method: 'POST', body: { email: $('#em').value.trim(), password: $('#pw').value } }).then(function (s) { setSess(s); manage(); }, function (er) { $('#er').textContent = er.message; });
      };
    };
    var manage = function () {
      var s = sess(); if (!s) return login();
      app.innerHTML = '<div class="adm"><p class="anav"><a href="admin.html" aria-current="page">Photographs</a><a href="admin-media.html">Videos, songs &amp; TV</a></p><div class="admtop"><h1>Gallery</h1><button class="btn" type="button" id="so">Sign out</button></div><p class="lead" id="who">' + esc((s.user && s.user.email) || '') + '</p>' +
        '<form id="pf"><h2 id="ft">New photograph</h2><label class="fld">Photo link (Google Drive or any https link)<input id="iu" type="url" required placeholder="https://drive.google.com/file/d/…"></label><img id="pv" class="pv" alt="" hidden referrerpolicy="no-referrer">' +
        '<label class="fld">Title (optional)<input id="ti" type="text"></label><label class="fld">Album or category (optional)<input id="ca" type="text"></label>' +
        '<label class="fld">Description<textarea id="de" rows="3"></textarea></label><label class="fld">Article (optional)<textarea id="ar" rows="10" placeholder="Write the whole story here. Blank line = new paragraph. # Heading, - bullet, > quote, **bold**, *italic*, [text](https://link)"></textarea></label>' +
        '<label class="chk"><input id="pu" type="checkbox" checked> Published (visible to everyone)</label><p class="err" id="er"></p><div class="btns"><button class="btn pri" type="submit" id="sv">Publish</button><button class="btn" type="button" id="cn" hidden>Cancel editing</button></div></form>' +
        '<h2 class="lh">Your photographs</h2><div id="ls"><p class="empty">Loading…</p></div></div>';
      $('#so').onclick = function () { setSess(null); login(); };
      api('/rest/v1/rpc/mg_is_admin', { method: 'POST', body: {}, auth: true }).then(function (v) { if (v === false) $('#who').insertAdjacentHTML('afterend', '<p class="err">This account is not the gallery owner, so publishing is switched off.</p>'); }, function () {});
      $('#iu').oninput = function () { var u = img(this.value, 500), p = $('#pv'); p.hidden = !u; if (u) p.src = u; };
      var reset = function () { editing = null; $('#pf').reset(); $('#pu').checked = true; $('#pv').hidden = true; $('#ft').textContent = 'New photograph'; $('#sv').textContent = 'Publish'; $('#cn').hidden = true; };
      $('#cn').onclick = reset;
      $('#pf').onsubmit = function (e) {
        e.preventDefault(); var er = $('#er'); er.textContent = ''; $('#sv').disabled = true;
        var body = { image_url: $('#iu').value.trim(), title: $('#ti').value.trim(), category: $('#ca').value.trim(), description: $('#de').value.trim(), article: $('#ar').value, published: $('#pu').checked };
        api(editing ? T + '?id=eq.' + encodeURIComponent(editing) : T, { method: editing ? 'PATCH' : 'POST', body: body, auth: true, prefer: 'return=representation' }).then(function (r) {
          $('#sv').disabled = false;
          if (editing && (!r || !r.length)) { er.textContent = 'Nothing was changed. This account may not be authorised to publish yet.'; return; }
          reset(); er.textContent = 'Saved.'; load();
        }, function (x) { $('#sv').disabled = false; er.textContent = (x.status === 401 || x.status === 403) ? 'This account is not authorised to publish yet.' : x.message; });
      };
      var load = function () {
        api(T + '?select=id,created_at,title,description,image_url,category,published,article&order=created_at.desc', { auth: true }).then(function (r) {
          rowsCache = r || [];
          $('#ls').innerHTML = rowsCache.length ? rowsCache.map(function (p) {
            return '<div class="arow"><img src="' + esc(img(p.image_url, 160)) + '" alt="" loading="lazy" referrerpolicy="no-referrer"><div class="at"><b>' + esc(p.title || p.description.slice(0, 40) || 'Untitled') + '</b><small data-sid="' + esc(p.id) + '">' + esc(when(p.created_at)) + (p.published ? '' : ' · hidden') + '</small>' +
              '<div class="ab"><button class="btn" type="button" data-a="e" data-id="' + esc(p.id) + '">Edit</button><button class="btn" type="button" data-a="v" data-id="' + esc(p.id) + '">' + (p.published ? 'Hide' : 'Show') + '</button><button class="btn" type="button" data-a="d" data-id="' + esc(p.id) + '">Delete</button></div></div></div>';
          }).join('') : '<p class="empty">Nothing yet. Add your first photograph above.</p>';
          api('/rest/v1/mg_stats?select=item_key,views,likes&item_key=like.post:*').then(function (st) {
            (st || []).forEach(function (s) { if (!s.item_key) return; var sm = document.querySelector('[data-sid="' + s.item_key.slice(5) + '"]'); if (sm) sm.textContent += ' · ' + fmt(s.views) + ' views · ' + fmt(s.likes) + ' likes'; });
          }, function () {});
        }, function (x) { $('#ls').innerHTML = '<p class="empty">' + esc(x.message) + '</p>'; if (x.status === 401) login('Please sign in again.'); });
      };
      $('#ls').onclick = function (e) {
        var b = e.target.closest('button[data-a]'); if (!b) return;
        var id = b.getAttribute('data-id'), p = rowsCache.filter(function (z) { return z.id === id; })[0], a = b.getAttribute('data-a');
        if (a === 'e') {
          editing = id; $('#iu').value = p.image_url; $('#ti').value = p.title; $('#ca').value = p.category; $('#de').value = p.description; $('#ar').value = p.article; $('#pu').checked = p.published;
          $('#iu').oninput.call($('#iu')); $('#ft').textContent = 'Editing'; $('#sv').textContent = 'Save changes'; $('#cn').hidden = false; $('#pf').scrollIntoView({ behavior: 'smooth' });
        } else if (a === 'v') api(T + '?id=eq.' + encodeURIComponent(id), { method: 'PATCH', body: { published: !p.published }, auth: true }).then(load, function (x) { $('#er').textContent = x.message; });
        else if (a === 'd' && confirm('Delete this photograph for good?')) api(T + '?id=eq.' + encodeURIComponent(id), { method: 'DELETE', auth: true }).then(load, function (x) { $('#er').textContent = x.message; });
      };
      load();
    };
    manage();
  }
})();
