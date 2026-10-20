/* MGodwill+ shared helper (v9): talks to Supabase and understands YouTube links.
   Used by media.js (videos and songs) and tv.js (live TV). Reads supabase-config.js. */
(function () {
  'use strict';
  var CFG = typeof MG_SUPABASE !== 'undefined' ? MG_SUPABASE : {}, SK = 'mg_sb_session';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
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
  /* YouTube: watch, youtu.be, shorts, live and embed links all give an 11-character video id */
  var YT = /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^#]*&)?v=|shorts\/|live\/|embed\/))([A-Za-z0-9_-]{11})/;
  function ytId(u) { var m = YT.exec(u || ''); return m ? m[1] : ''; }
  function ytChannel(u) { var m = /(?:youtube\.com\/channel\/|^\s*)(UC[A-Za-z0-9_-]{22})(?:[\/?#\s]|$)/.exec(u || ''); return m ? m[1] : ''; }
  function ytEmbed(u, auto) { /* a video id plays that video; a channel id always shows the channel's current live stream */
    var id = ytId(u), ch = id ? '' : ytChannel(u), q = 'rel=0&modestbranding=1&playsinline=1' + (auto ? '&autoplay=1' : '');
    return id ? 'https://www.youtube-nocookie.com/embed/' + id + '?' + q : ch ? 'https://www.youtube-nocookie.com/embed/live_stream?channel=' + ch + '&' + q : '';
  }
  function ytThumb(u) { var id = ytId(u); return id ? 'https://i.ytimg.com/vi/' + id + '/mqdefault.jpg' : ''; }
  function ytOpen(u) { var ch = ytChannel(u); return ch && !ytId(u) ? 'https://www.youtube.com/channel/' + ch + '/live' : u; }
  window.MGSB = { cfg: CFG, on: !!(CFG.url && CFG.key), sess: sess, setSess: setSess, api: api, esc: esc, ytId: ytId, ytChannel: ytChannel, ytEmbed: ytEmbed, ytThumb: ytThumb, ytOpen: ytOpen };
})();
