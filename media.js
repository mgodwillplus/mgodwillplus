/* MGodwill+ extra media (v9): videos, songs and podcasts added from admin-media.html join the catalogue's own.
   catalogue.js stays the main home for videos; this file only ADDS to it. Never edits catalogue.js. */
(function () {
  'use strict';
  var S = window.MGSB, PAGE = document.body.getAttribute('data-page'), app = document.getElementById('app');
  if (!S) return;
  var esc = S.esc, $ = function (s, r) { return (r || document).querySelector(s); };

  /* ---- public pages: fetch, then hand the rows to app.js ---- */
  if (PAGE !== 'adminmedia') {
    if (!S.on || !window.MG) return;
    S.api('/rest/v1/mg_media?select=id,kind,title,url,category,description&kind=neq.tv&published=eq.true&order=created_at.desc&limit=300').then(function (r) { window.MG.load(r || []); }, function () { window.MG.done(); });
    return;
  }

  /* ---- admin-media.html ---- */
  if (!S.on) { app.innerHTML = '<div class="adm"><h1>Videos, songs &amp; TV</h1><p class="lead">The gallery connection is not set up yet.</p></div>'; return; }
  var T = '/rest/v1/mg_media', TYPES = { video: 'Video', music: 'Song', podcast: 'Podcast / audio', tv: 'TV channel' }, editing = null, cache = [];
  var nav = '<p class="anav"><a href="admin.html">Photographs</a><a href="admin-media.html" aria-current="page">Videos, songs &amp; TV</a></p>';
  var hintFor = function (u, tv) {
    if (!u) return '';
    if (S.ytId(u)) return 'YouTube video found. It will play here on the site.';
    if (S.ytChannel(u)) return 'YouTube channel found. It will always show the channel’s current live stream.';
    if (/\/file\/d\//.test(u)) return tv ? 'A Google Drive file cannot be a live channel.' : 'Google Drive file found. It will play here on the site.';
    return tv ? 'This does not look like a YouTube link.' : 'This link will open in a new tab (it cannot play inside the site).';
  };
  function login(note) {
    app.innerHTML = '<div class="adm">' + nav + '<h1>Sign in</h1><p class="lead">For the owner of MGodwill+ only.</p><form id="lf"><label class="fld">Email<input id="em" type="email" autocomplete="username" required></label><label class="fld">Password<input id="pw" type="password" autocomplete="current-password" required></label><p class="err" id="er">' + esc(note || '') + '</p><button class="btn pri" type="submit">Sign in</button></form></div>';
    $('#lf').onsubmit = function (e) {
      e.preventDefault(); $('#er').textContent = '';
      S.api('/auth/v1/token?grant_type=password', { method: 'POST', body: { email: $('#em').value.trim(), password: $('#pw').value } }).then(function (s) { S.setSess(s); manage(); }, function (x) { $('#er').textContent = x.message; });
    };
  }
  function manage() {
    var s = S.sess(); if (!s) return login();
    app.innerHTML = '<div class="adm">' + nav + '<div class="admtop"><h1>Videos, songs &amp; TV</h1><button class="btn" type="button" id="so">Sign out</button></div><p class="lead" id="who">' + esc((s.user && s.user.email) || '') + '</p>' +
      '<form id="mf"><h2 id="ft">Add something</h2><label class="fld">Type<select id="ty">' + Object.keys(TYPES).map(function (k) { return '<option value="' + k + '">' + TYPES[k] + '</option>'; }).join('') + '</select></label>' +
      '<label class="fld"><span id="tl">Title</span><input id="ti" type="text" required></label><label class="fld"><span id="ul">Link (YouTube or Google Drive)</span><input id="ur" type="url" required placeholder="https://…"></label><p class="fine" id="hn"></p>' +
      '<div id="cdw"><label class="fld">Category (optional, e.g. Gospel songs)<input id="ca" type="text"></label><label class="fld">Description (optional)<textarea id="de" rows="3"></textarea></label></div>' +
      '<label class="chk"><input id="pu" type="checkbox" checked> Published (visible to everyone)</label><p class="err" id="er"></p><div class="btns"><button class="btn pri" type="submit" id="sv">Add</button><button class="btn" type="button" id="cn" hidden>Cancel editing</button></div></form>' +
      '<h2 class="lh">Added so far</h2><div id="ls"><p class="empty">Loading…</p></div></div>';
    $('#so').onclick = function () { S.setSess(null); login(); };
    S.api('/rest/v1/rpc/mg_is_admin', { method: 'POST', body: {}, auth: true }).then(function (v) { if (v === false) $('#who').insertAdjacentHTML('afterend', '<p class="err">This account is not the owner, so adding is switched off.</p>'); }, function () {});
    var sync = function () {
      var tv = $('#ty').value === 'tv'; $('#cdw').hidden = tv; $('#tl').textContent = tv ? 'Channel name' : 'Title';
      $('#ul').textContent = tv ? 'YouTube live link, or the channel’s link (youtube.com/channel/UC…)' : 'Link (YouTube or Google Drive)'; $('#hn').textContent = hintFor($('#ur').value.trim(), tv);
    };
    $('#ty').onchange = $('#ur').oninput = sync; sync();
    var reset = function () { editing = null; $('#mf').reset(); $('#pu').checked = true; $('#ft').textContent = 'Add something'; $('#sv').textContent = 'Add'; $('#cn').hidden = true; sync(); };
    $('#cn').onclick = reset;
    $('#mf').onsubmit = function (e) {
      e.preventDefault(); var er = $('#er'); er.textContent = ''; $('#sv').disabled = true; var tv = $('#ty').value === 'tv';
      var body = { kind: $('#ty').value, title: $('#ti').value.trim(), url: $('#ur').value.trim(), category: tv ? '' : $('#ca').value.trim(), description: tv ? '' : $('#de').value.trim(), published: $('#pu').checked };
      S.api(editing ? T + '?id=eq.' + encodeURIComponent(editing) : T, { method: editing ? 'PATCH' : 'POST', body: body, auth: true, prefer: 'return=representation' }).then(function (r) {
        $('#sv').disabled = false;
        if (editing && (!r || !r.length)) { er.textContent = 'Nothing was changed. This account may not be the owner.'; return; }
        reset(); er.textContent = 'Saved.'; load();
      }, function (x) { $('#sv').disabled = false; er.textContent = (x.status === 401 || x.status === 403) ? 'This account is not the owner, so adding is switched off.' : x.message; });
    };
    function load() {
      S.api(T + '?select=*&order=kind.asc,created_at.desc', { auth: true }).then(function (r) {
        cache = r || [];
        $('#ls').innerHTML = cache.length ? cache.map(function (p) {
          var b = function (a, t) { return '<button class="btn" type="button" data-a="' + a + '" data-id="' + esc(p.id) + '">' + t + '</button>'; };
          return '<div class="arow"><div class="at"><b>' + esc(p.title) + '</b><small>' + esc(TYPES[p.kind] || p.kind) + (p.category ? ' · ' + esc(p.category) : '') + (p.published ? '' : ' · hidden') + '</small><div class="ab">' + b('e', 'Edit') + b('v', p.published ? 'Hide' : 'Show') + b('d', 'Delete') + '</div></div></div>';
        }).join('') : '<p class="empty">Nothing added yet.</p>';
      }, function (x) { $('#ls').innerHTML = '<p class="empty">' + esc(x.message) + '</p>'; if (x.status === 401) login('Please sign in again.'); });
    }
    $('#ls').onclick = function (e) {
      var b = e.target.closest('button[data-a]'); if (!b) return;
      var id = b.getAttribute('data-id'), p = cache.filter(function (z) { return z.id === id; })[0], a = b.getAttribute('data-a');
      if (a === 'e') {
        editing = id; $('#ty').value = p.kind; $('#ti').value = p.title; $('#ur').value = p.url; $('#ca').value = p.category; $('#de').value = p.description; $('#pu').checked = p.published;
        $('#ft').textContent = 'Editing'; $('#sv').textContent = 'Save changes'; $('#cn').hidden = false; sync(); $('#mf').scrollIntoView({ behavior: 'smooth' });
      } else if (a === 'v') S.api(T + '?id=eq.' + encodeURIComponent(id), { method: 'PATCH', body: { published: !p.published }, auth: true }).then(load, function (x) { $('#er').textContent = x.message; });
      else if (a === 'd' && confirm('Delete this for good?')) S.api(T + '?id=eq.' + encodeURIComponent(id), { method: 'DELETE', auth: true }).then(load, function (x) { $('#er').textContent = x.message; });
    };
    load();
  }
  manage();
})();
