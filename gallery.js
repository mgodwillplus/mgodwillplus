/* MGodwill+ gallery (v7): Pinterest-style photographs, each with a description and an optional article,
   stored in Supabase. Reads supabase-config.js. Never touches catalogue.js or books.js. */
(function () {
  'use strict';
  var CFG = typeof MG_SUPABASE !== 'undefined' ? MG_SUPABASE : {}, PAGE = document.body.getAttribute('data-page'), app = document.getElementById('app');
  if (['photos', 'post', 'admin', 'home'].indexOf(PAGE) < 0) return;
  var ON = !!(CFG.url && CFG.key);
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var msg = function (h, t) { return '<div class="pg"><h1>' + h + '</h1><p class="lead">' + t + '</p></div>'; };
  if (!ON) { if (PAGE !== 'home') app.innerHTML = msg('Photos', 'The gallery is being set up. Please check back soon.'); return; }

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

  /* ---- home: a Photography row, only if there is something to show ---- */
  if (PAGE === 'home') {
    api(T + LIST.replace('limit=200', 'limit=8')).then(function (rows) {
      if (!rows || !rows.length) return;
      var sec = document.createElement('section'); sec.className = 'sec';
      sec.innerHTML = '<div class="sh"><h2>Photography</h2><a href="photos.html">See all</a></div><div class="rail">' + rows.map(tile).join('') + '</div>';
      var jr = [].slice.call(document.querySelectorAll('#app .sec')).filter(function (x) { return /Journal/.test(x.textContent.slice(0, 40)); })[0];
      if (jr) jr.parentNode.insertBefore(sec, jr); else app.appendChild(sec);
    }, function () {});
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
    }, function () { app.innerHTML = msg('Photos', 'This photograph could not be loaded just now. Please try again shortly.'); });
    return;
  }

  /* ---- admin: sign in, then add, edit, hide or delete photographs ---- */
  if (PAGE === 'admin') {
    var editing = null, rowsCache = [];
    var login = function (note) {
      app.innerHTML = '<div class="adm"><h1>Sign in</h1><p class="lead">For the owner of MGodwill+ only.</p><form id="lf"><label class="fld">Email<input id="em" type="email" autocomplete="username" required></label><label class="fld">Password<input id="pw" type="password" autocomplete="current-password" required></label><p class="err" id="er">' + esc(note || '') + '</p><button class="btn pri" type="submit">Sign in</button></form></div>';
      $('#lf').onsubmit = function (e) {
        e.preventDefault(); $('#er').textContent = '';
        api('/auth/v1/token?grant_type=password', { method: 'POST', body: { email: $('#em').value.trim(), password: $('#pw').value } }).then(function (s) { setSess(s); manage(); }, function (er) { $('#er').textContent = er.message; });
      };
    };
    var manage = function () {
      var s = sess(); if (!s) return login();
      app.innerHTML = '<div class="adm"><div class="admtop"><h1>Gallery</h1><button class="btn" type="button" id="so">Sign out</button></div><p class="lead" id="who">' + esc((s.user && s.user.email) || '') + '</p>' +
        '<form id="pf"><h2 id="ft">New photograph</h2><label class="fld">Photo link (Google Drive or any https link)<input id="iu" type="url" required placeholder="https://drive.google.com/file/d/…"></label><img id="pv" class="pv" alt="" hidden referrerpolicy="no-referrer">' +
        '<label class="fld">Title (optional)<input id="ti" type="text"></label><label class="fld">Album or category (optional)<input id="ca" type="text"></label>' +
        '<label class="fld">Description<textarea id="de" rows="3"></textarea></label><label class="fld">Article (optional)<textarea id="ar" rows="10" placeholder="Write the whole story here. Blank line = new paragraph. # Heading, - bullet, > quote, **bold**, *italic*, [text](https://link)"></textarea></label>' +
        '<label class="chk"><input id="pu" type="checkbox" checked> Published (visible to everyone)</label><p class="err" id="er"></p><div class="btns"><button class="btn pri" type="submit" id="sv">Publish</button><button class="btn" type="button" id="cn" hidden>Cancel editing</button></div></form>' +
        '<h2 class="lh">Your photographs</h2><div id="ls"><p class="empty">Loading…</p></div></div>';
      $('#so').onclick = function () { setSess(null); login(); };
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
            return '<div class="arow"><img src="' + esc(img(p.image_url, 160)) + '" alt="" loading="lazy" referrerpolicy="no-referrer"><div class="at"><b>' + esc(p.title || p.description.slice(0, 40) || 'Untitled') + '</b><small>' + esc(when(p.created_at)) + (p.published ? '' : ' · hidden') + '</small>' +
              '<div class="ab"><button class="btn" type="button" data-a="e" data-id="' + esc(p.id) + '">Edit</button><button class="btn" type="button" data-a="v" data-id="' + esc(p.id) + '">' + (p.published ? 'Hide' : 'Show') + '</button><button class="btn" type="button" data-a="d" data-id="' + esc(p.id) + '">Delete</button></div></div></div>';
          }).join('') : '<p class="empty">Nothing yet. Add your first photograph above.</p>';
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
