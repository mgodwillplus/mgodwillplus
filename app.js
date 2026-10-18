/* MGodwill+ app.js (v4) — reads catalogue.js (never modifies it). Videos/audio play on play.html via Drive's embedded player. */
(function () {
  'use strict';
  var LBL = { watch: 'Video', music: 'Music', podcasts: 'Podcast', journal: 'Journal' };
  var NAV = [['index.html', 'Home', 'home'], ['watch.html', 'Watch', 'watch'], ['music.html', 'Music', 'music'], ['podcasts.html', 'Podcasts', 'podcasts'], ['journal.html', 'Journal', 'journal'], ['about.html', 'About', 'about']];
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var PAGE = document.body.getAttribute('data-page') || 'home';

  /* ---- catalogue adapter (read-only): MGODWILL_CATALOGUE + helpers from catalogue.js ---- */
  var CAT = typeof MGODWILL_CATALOGUE !== 'undefined' ? MGODWILL_CATALOGUE : null;
  var SITE = (CAT && CAT.site) || {};
  var JOURNAL_URL = SITE.blog || 'https://gmspecrum.blogspot.com/?m=1';
  var FEATURED_ID = 'outreach-trailer'; /* hero video: change this id to feature a different video */
  var has = function (f) { return typeof f === 'function'; };
  function mk(x, kind) {
    var j = kind === 'journal';
    var urls = j ? (x.url ? [x.url] : []) : (has(window.getMediaUrls) ? getMediaUrls(x) : [].concat(x.media || []));
    var p = j ? x.url : (has(window.getPrimaryMediaUrl) ? getPrimaryMediaUrl(x) : urls[0]);
    return { id: x.id || '', title: String(x.title || '').trim(), desc: String(x.description || '').trim(),
      thumb: j || !x.thumbnail ? '' : (has(window.getDriveThumbnailUrl) ? getDriveThumbnailUrl(x.thumbnail) : x.thumbnail),
      cats: x.category ? [String(x.category)] : [], type: x.type || '', kind: kind,
      links: urls.map(function (u) { return { url: u }; }), url: p || urls[0] || '' };
  }
  var items = [];
  if (CAT) {
    (CAT.videos || []).forEach(function (x) { items.push(mk(x, 'watch')); });
    (CAT.audio || []).forEach(function (x) { items.push(mk(x, /song|music/i.test(x.type || '') ? 'music' : 'podcasts')); });
    (CAT.journal || []).forEach(function (x) { items.push(mk(x, 'journal')); });
  }
  items = items.filter(function (i) { return i.title; });
  items.forEach(function (i, n) { i.n = n; i.slug = i.id || 'item-' + n; }); /* original order kept */
  var of = function (k) { return items.filter(function (i) { return i.kind === k; }); };

  /* ---- templates ---- */
  function playable(i) { return i.kind !== 'journal' && /\/file\/d\//.test(i.url || ''); }
  function href(i, n) { return playable(i) ? 'play.html?id=' + encodeURIComponent(i.slug) + (n ? '&s=' + n : '') : i.url; }
  var tgt = function (i) { return playable(i) ? '' : ' target="_blank" rel="noopener"'; };
  function embedUrl(u) {
    if (has(window.getDrivePreviewUrl)) return getDrivePreviewUrl(u);
    var m = String(u).match(/\/file\/d\/([^/]+)/);
    return m ? 'https://drive.google.com/file/d/' + m[1] + '/preview' : u;
  }
  function recent() { try { return JSON.parse(localStorage.getItem('mg_recent') || '[]'); } catch (e) { return []; } }
  function card(i) {
    var clip = i.kind === 'watch' && playable(i) ? ' data-clip="previews/' + encodeURIComponent(i.slug) + '.mp4"' : '';
    var inner = '<div class="th" data-i="' + esc(i.title.charAt(0)) + '">' + (i.thumb ? '<img src="' + esc(i.thumb) + '" alt="' + esc(i.title) + '" loading="lazy" decoding="async" referrerpolicy="no-referrer">' : '') +
      '<span class="badge">' + LBL[i.kind] + '</span></div><div class="ct"><h3>' + esc(i.title) + '</h3><p>' + esc(i.cats[0] || LBL[i.kind]) + '</p></div>';
    return '<article class="card"' + clip + '>' + (i.url ? '<a class="cl" href="' + esc(href(i, 0)) + '"' + tgt(i) + '>' + inner + '</a>' : '<div class="cl">' + inner + '</div>') + '</article>';
  }
  /* audio = compact rows (thumbnail, title, description); journal = plain title lines */
  function row(i) {
    var inner = '<div class="rth" data-i="' + esc(i.title.charAt(0)) + '">' + (i.thumb ? '<img src="' + esc(i.thumb) + '" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">' : '') + '<span class="pt"></span></div>' +
      '<div class="rt"><h3>' + esc(i.title) + '</h3><p>' + esc(i.desc || i.cats[0] || LBL[i.kind]) + '</p></div>';
    return '<article class="row">' + (i.url ? '<a class="rl" href="' + esc(href(i, 0)) + '"' + tgt(i) + '>' + inner + '</a>' : '<div class="rl">' + inner + '</div>') + '</article>';
  }
  function jline(i) { return i.url ? '<a class="jr" href="' + esc(i.url) + '" target="_blank" rel="noopener">' + esc(i.title) + '</a>' : '<div class="jr">' + esc(i.title) + '</div>'; }
  function lay(list, k) {
    if (!list.length) return '<p class="empty">Nothing here yet.</p>';
    return k === 'watch' ? '<div class="grid">' + list.map(card).join('') + '</div>' : k === 'journal' ? '<div class="jl">' + list.map(jline).join('') + '</div>' : '<div class="rows">' + list.map(row).join('') + '</div>';
  }
  function sect(title, list, k, url, max) {
    if (!list.length) return '';
    return '<section class="sec"><div class="sh"><h2>' + esc(title) + '</h2>' + (list.length > max ? '<a href="' + url + '">See all</a>' : '') + '</div>' + lay(list.slice(0, max), k) + '</section>';
  }
  function mixed(list) {
    var o = '';
    [['watch', 'Videos'], ['music', 'Music'], ['podcasts', 'Podcasts & Audio'], ['journal', 'Journal']].forEach(function (g) {
      var l = list.filter(function (i) { return i.kind === g[0]; });
      if (l.length) o += '<section class="sec"><div class="sh"><h2>' + g[1] + '</h2></div>' + lay(l, g[0]) + '</section>';
    });
    return o;
  }
  function rail(title, list, more) {
    if (!list.length) return '';
    return '<section class="sec"><div class="sh"><h2>' + esc(title) + '</h2>' + (more || '') + '</div><div class="rail">' + list.map(card).join('') + '</div></section>';
  }
  var grid = function (list) { return list.length ? '<div class="grid">' + list.map(card).join('') + '</div>' : '<p class="empty">Nothing here yet.</p>'; };
  var verb = { watch: 'Play', music: 'Listen', podcasts: 'Listen', journal: 'Read' };

  function aboutPhoto() {
    var u = SITE.aboutPhoto && has(window.getDriveThumbnailUrl) ? getDriveThumbnailUrl(SITE.aboutPhoto) : '';
    return u ? '<div class="th aph" data-i="M"><img src="' + esc(u) + '" alt="Photo of the creator" referrerpolicy="no-referrer"></div>' : '';
  }
  function hero(i) {
    return '<section class="hero' + (i.thumb ? '' : ' no') + '">' + (i.thumb ? '<img src="' + esc(i.thumb) + '" alt="" fetchpriority="high" referrerpolicy="no-referrer">' : '') +
      (i.kind === 'watch' && playable(i) ? '<video class="hclip" muted loop playsinline preload="metadata" aria-hidden="true"></video>' : '') + '<div class="hin"><span class="badge">' + LBL[i.kind] + '</span><h1>' + esc(i.title) + '</h1>' + (i.desc ? '<p>' + esc(i.desc) + '</p>' : '') +
      '<div class="btns">' + (i.url ? '<a class="btn pri" href="' + esc(href(i, 0)) + '"' + tgt(i) + '>&#9654;&#xFE0E; ' + verb[i.kind] + '</a>' : '') +
      '<button class="btn" type="button" id="more">More Info</button></div></div></section>';
  }
  function info(i) {
    var d = $('#info');
    if (!d) { d = document.createElement('dialog'); d.id = 'info'; document.body.appendChild(d); d.addEventListener('click', function (e) { if (e.target === d) d.close(); }); }
    d.innerHTML = '<div class="th" data-i="' + esc(i.title.charAt(0)) + '">' + (i.thumb ? '<img src="' + esc(i.thumb) + '" alt="">' : '') + '</div><div class="dn"><span class="badge" style="position:static;display:inline-block">' + LBL[i.kind] + '</span><h2>' + esc(i.title) + '</h2>' +
      (i.cats.length ? '<p>' + esc(i.cats.join(', ')) + '</p>' : '') + (i.desc ? '<p>' + esc(i.desc) + '</p>' : '') +
      '<div class="btns">' + i.links.map(function (l, n) { return '<a class="btn' + (n ? '' : ' pri') + '" href="' + esc(href(i, n)) + '"' + tgt(i) + '>' + esc(i.links.length > 1 ? 'Source ' + (n + 1) : verb[i.kind]) + '</a>'; }).join('') +
      '<button class="btn" type="button" id="close">Close</button></div></div>';
    $('#close', d).onclick = function () { d.close(); };
    if (d.showModal) d.showModal();
  }
  function chips(list, onPick) {
    var cats = []; list.forEach(function (i) { i.cats.forEach(function (c) { if (cats.indexOf(c) < 0) cats.push(c); }); });
    if (cats.length < 2) return '';
    return '<div class="chips" role="group" aria-label="Filter by category">' + ['All'].concat(cats).map(function (c, n) { return '<button class="chip" type="button" aria-pressed="' + (n === 0) + '">' + esc(c) + '</button>'; }).join('') + '</div>';
  }
  function listPage(title, lead, list, extra, withChips) {
    app.innerHTML = '<div class="pg' + (PAGE === 'watch' ? '' : ' nar') + '"><h1>' + title + '</h1>' + (lead ? '<p class="lead">' + lead + '</p>' : '') + (extra || '') + (withChips ? chips(list) : '') + '<div id="out">' + lay(list, PAGE) + '</div></div>';
    var cs = app.querySelectorAll('.chip');
    cs.forEach(function (b) {
      b.onclick = function () {
        cs.forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
        var c = b.textContent;
        $('#out').innerHTML = lay(c === 'All' ? list : list.filter(function (i) { return i.cats.indexOf(c) > -1; }), PAGE);
      };
    });
  }

  /* ---- shell ---- */
  document.body.insertAdjacentHTML('afterbegin',
    '<header class="hd"><a class="brand" href="index.html" aria-label="MGodwill+ home">MGODWILL<b>+</b></a>' +
    '<a class="sbtn" href="search.html" aria-label="Search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg></a>' +
    '<nav class="nav" aria-label="Main">' + NAV.map(function (n) { return '<a href="' + n[0] + '"' + (n[2] === PAGE ? ' aria-current="page"' : '') + '>' + n[1] + '</a>'; }).join('') + '</nav></header>');
  document.body.insertAdjacentHTML('beforeend',
    '<footer class="ft"><span class="brand">MGODWILL<b>+</b></span><p>A creative universe for film, music, audio, podcasts and writing. Media is hosted by third-party services such as Google Drive; videos and audio play here through their embedded player.</p>' +
    '<nav aria-label="Footer">' + NAV.map(function (n) { return '<a href="' + n[0] + '">' + n[1] + '</a>'; }).join('') + '<a href="search.html">Search</a><a href="' + JOURNAL_URL + '" target="_blank" rel="noopener">Blog</a></nav>' +
    '<small>&copy; <span id="yr"></span> MGodwill+. Created by MGodwill.</small></footer>');
  $('#yr').textContent = new Date().getFullYear();
  var app = $('#app');
  /* silent preview clips (optional files in /previews/<id>.mp4); thumbnails stay if a clip is missing */
  var calm = (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) || (navigator.connection && navigator.connection.saveData);
  function hoverPlay(c, on) {
    var th = $('.th', c), v = $('video', th);
    if (!on) { if (v) { v.pause(); v.remove(); } th.classList.remove('live'); return; }
    if (v || c.getAttribute('data-bad')) return;
    v = document.createElement('video'); v.muted = true; v.loop = true; v.playsInline = true; v.src = c.getAttribute('data-clip');
    v.onerror = function () { c.setAttribute('data-bad', '1'); v.remove(); };
    v.onplaying = function () { th.classList.add('live'); };
    th.appendChild(v); var p = v.play(); if (p && p.catch) p.catch(function () {});
  }
  if (!calm && window.matchMedia && matchMedia('(hover: hover)').matches) {
    ['mouseover', 'mouseout'].forEach(function (t) {
      document.addEventListener(t, function (e) {
        var c = e.target.closest && e.target.closest('.card[data-clip]');
        if (c && !c.contains(e.relatedTarget)) hoverPlay(c, t === 'mouseover');
      });
    });
  }
  function heroClip(i) {
    var v = $('.hclip'); if (!v || calm) return;
    v.muted = true; v.src = 'previews/' + encodeURIComponent(i.slug) + '.mp4';
    v.onerror = function () { v.remove(); }; v.onplaying = function () { v.classList.add('on'); };
    var p = v.play(); if (p && p.catch) p.catch(function () {});
  }
  document.addEventListener('error', function (e) { var p = e.target.tagName === 'IMG' && e.target.parentElement; if (p) p.classList.add('no'); }, true);

  /* ---- pages ---- */
  var empty = '<p class="empty">No catalogue entries found. Make sure <b>catalogue.js</b> sits in the same folder as this page and loads before app.js.</p>';
  var blogBtn = '<div class="btns" style="padding:0 var(--pad) 18px"><a class="btn pri" href="' + JOURNAL_URL + '" target="_blank" rel="noopener">Open the journal</a></div>';
  if (PAGE === 'home') {
    if (!items.length) app.innerHTML = empty;
    else {
      var h = items.filter(function (i) { return i.id === FEATURED_ID; })[0] || of('watch').filter(function (i) { return i.thumb; })[0] || items[0];
      var rc = recent().map(function (z) { return items.filter(function (i) { return i.slug === z; })[0]; }).filter(function (z) { return z && z.kind === 'watch'; });
      var out = hero(h) + rail('Recently Viewed', rc) + rail('Films & Shorts', of('watch'), '<a href="watch.html">See all</a>');
      var seen = []; of('watch').forEach(function (i) { i.cats.forEach(function (c) { if (seen.indexOf(c) < 0) seen.push(c); }); });
      seen.forEach(function (c) { var l = of('watch').filter(function (i) { return i.cats.indexOf(c) > -1; }); if (l.length > 1) out += rail(c, l); });
      out += sect('Music', of('music'), 'music', 'music.html', 5) + sect('Podcasts & Audio', of('podcasts'), 'podcasts', 'podcasts.html', 5);
      var j = of('journal');
      out += j.length ? sect('Journal', j, 'journal', 'journal.html', 6) : '<section class="sec"><div class="sh"><h2>Journal</h2></div>' + blogBtn + '</section>';
      app.innerHTML = out; heroClip(h);
      var m = $('#more'); if (m) m.onclick = function () { info(h); };
    }
  } else if (PAGE === 'watch') listPage('Watch', 'Films, shorts and videos. Tap any video to watch it here.', of('watch'), '', true);
  else if (PAGE === 'music') listPage('Music', 'Songs and music. Tap any track to listen here.', of('music'));
  else if (PAGE === 'podcasts') listPage('Podcasts &amp; Audio', 'Podcasts and audio. Tap any episode to listen here.', of('podcasts'));
  else if (PAGE === 'journal') listPage('Journal', 'Writing and updates from the blog.', of('journal'), blogBtn);
  else if (PAGE === 'about') app.innerHTML = '<div class="pg"><h1>About MGodwill+</h1>' + aboutPhoto() + '<div class="prose">' +
    '<p>MGodwill+ is a growing creative universe built around the idea that a person’s work should not have to live in scattered corners of the internet. Film and video, editing, music, audio, podcasts, writing, photography and visual storytelling can all belong to one coherent experience.</p>' +
    '<p>Rather than pretending to be a giant streaming corporation, MGodwill+ takes inspiration from the clarity and atmosphere of premium streaming interfaces: a strong featured presentation, carefully organised collections, and a visual identity that makes exploring the work feel intentional. The aim is to give every project a proper place and let the work speak for itself.</p>' +
    '<p>The platform is designed with a practical principle: the catalogue and experience can live here while the media itself remains on reliable external services. That keeps the project lightweight and affordable, avoids unnecessary duplication of large files, and lets visitors follow the original source when they choose to watch or listen.</p>' +
    '<p>MGodwill+ is being developed resourcefully, with free tools and a phone-first workflow, but with ambitions that are not limited by the modesty of its starting point. It is a work in progress: a home for creative experiments, finished pieces, developing ideas and whatever the next chapter brings.</p></div></div>';
  else if (PAGE === 'play') {
    var qs = new URLSearchParams(location.search), cur = items.filter(function (i) { return i.slug === qs.get('id') && playable(i); })[0];
    if (!cur) app.innerHTML = '<div class="pg"><h1>Not found</h1><p class="lead">We couldn’t find that item.</p><div class="btns" style="padding:0 var(--pad)"><a class="btn pri" href="watch.html">Browse videos</a></div></div>';
    else {
      var s0 = Math.min(Math.max(+qs.get('s') || 0, 0), cur.links.length - 1);
      document.title = cur.title + ' | MGodwill+';
      var rel = items.filter(function (x) { return x !== cur && x.kind === cur.kind && playable(x); });
      rel = rel.filter(function (x) { return x.cats[0] === cur.cats[0]; }).concat(rel.filter(function (x) { return x.cats[0] !== cur.cats[0]; })).slice(0, 12);
      app.innerHTML = '<div class="pl"><div class="pmain"><div class="pwrap' + (cur.kind === 'watch' ? '' : ' au') + '" id="pwrap"><iframe id="pf" src="' + esc(embedUrl(cur.links[s0].url)) + '" title="' + esc(cur.title) + '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>' +
        '<button class="btn xx" type="button" id="xx">&times; Exit full screen</button><span class="rot">Rotate your phone for a bigger picture</span></div>' +
        '<div class="pinfo"><span class="badge">' + LBL[cur.kind] + '</span><h1>' + esc(cur.title) + '</h1><p class="meta">' + esc(cur.cats.join(', ')) + '</p>' + (cur.desc ? '<p>' + esc(cur.desc) + '</p>' : '') +
        (cur.links.length > 1 ? '<div class="chips" role="group" aria-label="Choose source">' + cur.links.map(function (l, k) { return '<button class="chip" type="button" data-s="' + k + '" aria-pressed="' + (k === s0) + '">Source ' + (k + 1) + '</button>'; }).join('') + '</div>' : '') +
        '<div class="btns"><button class="btn pri" type="button" id="fs">Full screen</button><button class="btn" type="button" id="sh">Share</button><a class="btn" id="od" href="' + esc(cur.links[s0].url) + '" target="_blank" rel="noopener">Open in Google Drive</a></div></div></div>' +
        (rel.length ? '<aside class="pside"><h2>More like this</h2>' + (cur.kind === 'watch' ? '<div class="pgrid">' + rel.map(card).join('') + '</div>' : '<div class="rows">' + rel.map(row).join('') + '</div>') + '</aside>' : '') + '</div>';
      var box = $('#pwrap'), fsb = $('#fs'), inFs = function () { return document.fullscreenElement || document.webkitFullscreenElement; };
      var xset = function (on) { box.classList.toggle('xl', on); document.documentElement.classList.toggle('xlock', on); fsb.textContent = on ? 'Exit full screen' : 'Full screen'; };
      var toggleFs = function () {
        if (box.classList.contains('xl')) { xset(false); return; }
        if (inFs()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
        var rq = box.requestFullscreen || box.webkitRequestFullscreen;
        if (!rq) { xset(true); return; } /* e.g. iPhone Safari: fall back to a full-viewport player */
        try {
          var r = rq.call(box);
          if (r && r.then) r.then(function () { try { screen.orientation.lock('landscape').catch(function () {}); } catch (e) {} }, function () { xset(true); });
        } catch (e) { xset(true); }
      };
      fsb.onclick = $('#xx').onclick = toggleFs;
      ['fullscreenchange', 'webkitfullscreenchange'].forEach(function (t) { document.addEventListener(t, function () { fsb.textContent = inFs() ? 'Exit full screen' : 'Full screen'; }); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && box.classList.contains('xl')) xset(false); });
      app.querySelectorAll('.chip').forEach(function (b) {
        b.onclick = function () {
          var k = +b.getAttribute('data-s');
          app.querySelectorAll('.chip').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
          $('#pf').src = embedUrl(cur.links[k].url); $('#od').href = cur.links[k].url;
        };
      });
      $('#sh').onclick = function () {
        var u = location.href, b = this;
        if (navigator.share) { navigator.share({ title: cur.title, url: u }).catch(function () {}); return; }
        (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(function () { b.textContent = 'Link copied'; setTimeout(function () { b.textContent = 'Share'; }, 2000); }, function () { window.prompt('Copy this link', u); });
      };
      try { var rr = recent().filter(function (z) { return z !== cur.slug; }); rr.unshift(cur.slug); localStorage.setItem('mg_recent', JSON.stringify(rr.slice(0, 10))); } catch (e) {}
    }
  }
  else if (PAGE === 'search') {
    app.innerHTML = '<div class="pg"><h1>Search</h1><input id="q" class="sin" type="search" placeholder="Search titles, descriptions, categories" aria-label="Search the catalogue" autocomplete="off"><div id="out"></div></div>';
    var q = $('#q'), go = function () {
      var v = q.value.trim().toLowerCase();
      $('#out').innerHTML = !v ? '<p class="empty">Type to search the catalogue.</p>' : (function (r) { return r.length ? mixed(r) : '<p class="empty">No matches for “' + esc(q.value.trim()) + '”.</p>'; })(items.filter(function (i) {
        return (i.title + ' ' + i.desc + ' ' + i.cats.join(' ') + ' ' + LBL[i.kind] + ' ' + i.type).toLowerCase().indexOf(v) > -1;
      }));
    };
    q.value = new URLSearchParams(location.search).get('q') || ''; q.oninput = go; go();
  }

  /* ---- intro: once per session, never blocking ---- */
  var intro = $('#intro');
  if (intro) {
    var done = function () { if (intro.parentNode) intro.parentNode.removeChild(intro); document.documentElement.classList.remove('intro-on'); };
    if (document.documentElement.classList.contains('intro-on')) {
      var sk = $('.iskip', intro); if (sk) sk.onclick = done;
      setTimeout(done, 5900); /* matches the CSS fade ending at 5.8s; also the fallback */
    } else done();
  }
})();
