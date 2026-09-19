/* =========================================================
   MGODWILL+ — app.js
   Front-end application layer
   Works with catalogue.js and style.css
   No database required.
   ========================================================= */

(function () {
  "use strict";

  const CATALOGUE = window.MGODWILL_CATALOGUE || {};
  const media = typeof getAllMedia === "function" ? getAllMedia() : [];
  const journal = Array.isArray(CATALOGUE.journal) ? CATALOGUE.journal : [];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const titleCase = (value) =>
    String(value || "")
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());

  function drivePreview(url) {
    const value = String(url || "").trim();

    if (typeof getDrivePreviewUrl === "function") {
      const result = getDrivePreviewUrl(value);
      if (result) return result;
    }

    let match = value.match(
      /drive\.google\.com\/file\/d\/([^/?#]+)/i
    );

    if (match) {
      return `https://drive.google.com/file/d/${encodeURIComponent(match[1])}/preview`;
    }

    match = value.match(/[?&]id=([^&#]+)/i);

    if (
      match &&
      /drive\.google\.com|drive\.usercontent\.google\.com/i.test(value)
    ) {
      return `https://drive.google.com/file/d/${encodeURIComponent(
        decodeURIComponent(match[1])
      )}/preview`;
    }

    return value;
  }

  function driveThumb(url) {
    if (typeof getDriveThumbnailUrl === "function") {
      return getDriveThumbnailUrl(url);
    }

    const value = String(url || "").trim();

    const match = value.match(
      /drive\.google\.com\/file\/d\/([^/?#]+)/i
    );

    return match
      ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(
          match[1]
        )}&sz=w1200`
      : value;
  }

  function mediaThumb(item) {
    if (typeof getMediaThumbnail === "function") {
      return getMediaThumbnail(item);
    }

    return item && item.thumbnail ? item.thumbnail : "";
  }

  function mediaPrimaryUrl(item) {
    if (typeof getPrimaryMediaUrl === "function") {
      return getPrimaryMediaUrl(item);
    }

    return Array.isArray(item?.links)
      ? item.links[0]
      : item?.link || "";
  }

  function mediaLinks(item) {
    if (typeof getMediaUrls === "function") {
      return getMediaUrls(item);
    }

    if (Array.isArray(item?.links)) {
      return item.links;
    }

    return item?.link ? [item.link] : [];
  }

  function pageUrl(file, params = {}) {
    const query = new URLSearchParams(params).toString();
    return query ? `${file}?${query}` : file;
  }

  function go(file, params = {}) {
    window.location.href = pageUrl(file, params);
  }

  function typeLabel(item) {
    const type = String(item.type || "").toLowerCase();

    if (type === "song") return "Music";
    if (type === "podcast") return "Podcast";
    if (type === "video") return "Video";

    return titleCase(item.type || "Media");
  }

  function safeImage(url, fallbackText = "MGODWILL+") {
    if (url) {
      return `
        <img src="${escapeHtml(url)}"
             alt="${escapeHtml(fallbackText)}"
             loading="lazy"
             data-fallback="true">
      `;
    }

    return `<div class="media-image-fallback">${escapeHtml(
      fallbackText
    )}</div>`;
  }

  /* ---------------------------------------------------------
     Shared site shell
     --------------------------------------------------------- */

  function renderHeader() {
    const host = $("#site-header");
    if (!host) return;

    host.innerHTML = `
      <header class="site-nav">
        <div class="nav-inner">
          <a class="brand" href="index.html" aria-label="MGodwill+ home">
            <span class="brand-mark">M+</span>
            <span>MGODWILL<span class="brand-plus">+</span></span>
          </a>

          <nav class="desktop-nav" aria-label="Main navigation">
            <a href="index.html">Home</a>
            <a href="watch.html">Watch</a>
            <a href="music.html">Music</a>
            <a href="podcasts.html">Podcasts</a>
            <a href="journal.html">Journal</a>
            <a href="about.html">About</a>
          </nav>

          <div class="nav-actions">
            <a class="nav-search" href="search.html" aria-label="Search">⌕</a>
            <span class="nav-signin">SIGN IN</span>
            <button class="menu-toggle"
                    type="button"
                    aria-label="Open menu"
                    aria-expanded="false">
              ☰
            </button>
          </div>
        </div>

        <div class="mobile-nav" aria-hidden="true">
          <a href="index.html">Home</a>
          <a href="watch.html">Watch</a>
          <a href="music.html">Music</a>
          <a href="podcasts.html">Podcasts</a>
          <a href="journal.html">Journal</a>
          <a href="about.html">About</a>
          <a href="search.html">Search</a>
        </div>
      </header>
    `;

    const toggle = $(".menu-toggle", host);
    const mobile = $(".mobile-nav", host);

    if (toggle && mobile) {
      toggle.addEventListener("click", () => {
        const open = mobile.classList.toggle("is-open");

        toggle.setAttribute("aria-expanded", String(open));
        mobile.setAttribute("aria-hidden", String(!open));
      });
    }

    const current = document.body.dataset.page;

    $$("a", host).forEach((link) => {
      const href = link.getAttribute("href") || "";
      const file = href.split("?")[0];

      if (
        (current === "home" && file === "index.html") ||
        (current === "watch" && file === "watch.html") ||
        (current === "music" && file === "music.html") ||
        (current === "podcasts" && file === "podcasts.html") ||
        (current === "journal" && file === "journal.html") ||
        (current === "about" && file === "about.html")
      ) {
        link.classList.add("active");
      }
    });
  }

  function renderFooter() {
    const host = $("#site-footer");
    if (!host) return;

    host.innerHTML = `
      <footer class="site-footer">
        <div class="footer-main">
          <div>
            <div class="footer-logo">
              MGODWILL<span>+</span>
            </div>

            <p>
              A personal media universe for films, music,
              voices, ideas and stories.
            </p>
          </div>

          <div class="footer-links">
            <a href="watch.html">Watch</a>
            <a href="music.html">Music</a>
            <a href="podcasts.html">Podcasts</a>
            <a href="journal.html">Journal</a>
            <a href="about.html">About</a>
          </div>
        </div>

        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} MGodwill+</span>
          <span>Created by Godwill Mathenge</span>
        </div>
      </footer>
    `;
  }

  /* ---------------------------------------------------------
     Loader
     --------------------------------------------------------- */

  function hideLoader() {
    const loader = $(".site-loader, #site-loader, .loader");
    if (!loader) return;

    setTimeout(() => {
      loader.classList.add("loaded");
      loader.classList.add("hidden");

      setTimeout(() => {
        loader.style.display = "none";
      }, 700);
    }, 250);
  }

  /* ---------------------------------------------------------
     Media cards
     --------------------------------------------------------- */

  function mediaCard(item, options = {}) {
    const compact = options.compact
      ? " media-card-compact"
      : "";

    const thumb = mediaThumb(item);
    const category = item.category || typeLabel(item);

    return `
      <article class="media-card${compact}"
               data-media-id="${escapeHtml(item.id)}">

        <button class="media-card-button"
                type="button"
                data-open-media="${escapeHtml(item.id)}"
                aria-label="Open ${escapeHtml(item.title)}">

          <div class="media-card-image">
            ${safeImage(thumb, item.title)}

            <span class="media-card-play">▶</span>

            <span class="media-card-type">
              ${escapeHtml(typeLabel(item))}
            </span>
          </div>

          <div class="media-card-body">
            <span class="eyebrow">
              ${escapeHtml(category)}
            </span>

            <h3>${escapeHtml(item.title)}</h3>

            <p>
              ${escapeHtml(item.description || "")}
            </p>
          </div>

        </button>
      </article>
    `;
  }

  function bindMediaCards(root = document) {
    $$("[data-open-media]", root).forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.getAttribute("data-open-media");

        if (id) {
          go("player.html", { id });
        }
      });
    });

    $$("img[data-fallback]", root).forEach((img) => {
      img.addEventListener(
        "error",
        () => {
          const fallback = document.createElement("div");

          fallback.className = "media-image-fallback";
          fallback.textContent = img.alt || "MGODWILL+";

          img.replaceWith(fallback);
        },
        { once: true }
      );
    });
  }

  function renderRail(
    target,
    items,
    emptyMessage = "Nothing here yet."
  ) {
    if (!target) return;

    if (!items.length) {
      target.innerHTML = `
        <div class="empty-state">
          ${escapeHtml(emptyMessage)}
        </div>
      `;

      return;
    }

    target.innerHTML = `
      <div class="media-rail">
        ${items.map((item) => mediaCard(item)).join("")}
      </div>
    `;

    bindMediaCards(target);
  }

  function categoryItems(category) {
    return media.filter(
      (item) =>
        String(item.category || "").toLowerCase() ===
        String(category).toLowerCase()
    );
  }

  /* ---------------------------------------------------------
     Home
     --------------------------------------------------------- */

  function renderHome() {
    const featured = $("#home-featured");

    if (featured) {
      const item = media[0];

      if (item) {
        featured.innerHTML = `
          <div class="featured-media">

            <div class="featured-backdrop">
              ${safeImage(mediaThumb(item), item.title)}
            </div>

            <div class="featured-content">
              <span class="eyebrow">
                MGODWILL+ FEATURED
              </span>

              <h1>${escapeHtml(item.title)}</h1>

              <p>
                ${escapeHtml(item.description || "")}
              </p>

              <div class="button-row">

                <a class="btn btn-primary"
                   href="${escapeHtml(
                     pageUrl("player.html", { id: item.id })
                   )}">
                  ▶ Watch
                </a>

                <a class="btn btn-secondary"
                   href="${escapeHtml(
                     pageUrl("player.html", { id: item.id })
                   )}">
                  More Info
                </a>

              </div>
            </div>

          </div>
        `;
      }
    }

    renderRail(
      $("#home-watch"),
      media
        .filter((item) => item.type === "Video")
        .slice(0, 10)
    );

    renderRail(
      $("#home-music"),
      media
        .filter((item) => item.type === "Song")
        .slice(0, 10)
    );

    renderRail(
      $("#home-podcasts"),
      media
        .filter(
          (item) =>
            String(item.type).toLowerCase() === "podcast"
        )
        .slice(0, 10)
    );

    renderRail(
      $("#home-mavuno"),
      categoryItems("Mavuno Church")
    );

    renderRail(
      $("#home-aurora"),
      categoryItems("Aurora Newdawn")
    );

    const journalTarget = $("#home-journal");

    if (journalTarget) {
      renderJournal(
        journalTarget,
        journal.slice(0, 6)
      );
    }
  }

  /* ---------------------------------------------------------
     Watch
     --------------------------------------------------------- */

  function renderWatch() {
    const grid = $("#watch-grid");
    const chips = $("#watch-filters");

    if (!grid) return;

    const videos = media.filter(
      (item) =>
        String(item.type).toLowerCase() === "video"
    );

    let active = "All";

    function draw() {
      const selected =
        active === "All"
          ? videos
          : videos.filter(
              (item) => item.category === active
            );

      grid.innerHTML = selected.length
        ? `
          <div class="media-grid">
            ${selected
              .map((item) => mediaCard(item))
              .join("")}
          </div>
        `
        : `
          <div class="empty-state">
            No videos in this category yet.
          </div>
        `;

      bindMediaCards(grid);
    }

    if (chips) {
      const categories = [
        "All",
        ...new Set(
          videos
            .map((item) => item.category)
            .filter(Boolean)
        )
      ];

      chips.innerHTML = categories
        .map(
          (category) => `
            <button
              class="category-chip${
                category === "All" ? " active" : ""
              }"
              type="button"
              data-watch-category="${escapeHtml(category)}">
              ${escapeHtml(category)}
            </button>
          `
        )
        .join("");

      $$("[data-watch-category]", chips)
        .forEach((button) => {
          button.addEventListener("click", () => {
            active =
              button.getAttribute(
                "data-watch-category"
              ) || "All";

            $$(
              "[data-watch-category]",
              chips
            ).forEach((chip) =>
              chip.classList.remove("active")
            );

            button.classList.add("active");

            draw();
          });
        });
    }

    draw();
  }

  /* ---------------------------------------------------------
     Music
     --------------------------------------------------------- */

  function renderMusic() {
    const grid = $("#music-grid");

    if (!grid) return;

    const songs = media.filter(
      (item) =>
        String(item.type).toLowerCase() === "song"
    );

    grid.innerHTML = songs.length
      ? `
        <div class="media-grid music-grid">
          ${songs
            .map((item) =>
              mediaCard(item, { compact: true })
            )
            .join("")}
        </div>
      `
      : `
        <div class="empty-state">
          No music has been added yet.
        </div>
      `;

    bindMediaCards(grid);
  }

  /* ---------------------------------------------------------
     Podcasts
     --------------------------------------------------------- */

  function renderPodcasts() {
    const grid = $("#podcasts-grid");

    if (!grid) return;

    const podcasts = media.filter(
      (item) =>
        String(item.type).toLowerCase() === "podcast"
    );

    grid.innerHTML = podcasts.length
      ? `
        <div class="media-grid">
          ${podcasts
            .map((item) => mediaCard(item))
            .join("")}
        </div>
      `
      : `
        <div class="empty-state">
          No podcasts have been added yet.
        </div>
      `;

    bindMediaCards(grid);
  }

  /* ---------------------------------------------------------
     Journal
     --------------------------------------------------------- */

  function journalCard(post) {
    const title = post.title || "Journal";
    const url = post.url || "#";

    return `
      <article class="journal-card">

        <div class="journal-card-body">

          <span class="eyebrow">
            FROM THE JOURNAL
          </span>

          <h3>${escapeHtml(title)}</h3>

          <p>
            Read this story on the MGodwill+ Journal.
          </p>

          <a class="text-link"
             href="${escapeHtml(url)}"
             target="_blank"
             rel="noopener noreferrer">
            Read article →
          </a>

        </div>

      </article>
    `;
  }

  function renderJournal(
    target = $("#journal-grid"),
    posts = journal
  ) {
    if (!target) return;

    if (!posts.length) {
      target.innerHTML = `
        <div class="empty-state">
          No journal entries yet.
        </div>
      `;

      return;
    }

    target.innerHTML = `
      <div class="journal-grid">
        ${posts.map(journalCard).join("")}
      </div>
    `;
  }

  /* ---------------------------------------------------------
     About
     --------------------------------------------------------- */

  function renderAbout() {
    const photo = $("#about-photo");

    const photoUrl =
      CATALOGUE.aboutPhoto ||
      CATALOGUE.aboutImage ||
      "";

    if (photo) {
      photo.innerHTML = photoUrl
        ? safeImage(
            driveThumb(photoUrl),
            "Godwill Mathenge"
          )
        : `
          <div class="media-image-fallback">
            MGODWILL+
          </div>
        `;

      const image = $("img", photo);

      if (image) {
        image.addEventListener(
          "error",
          () => {
            image.replaceWith(
              Object.assign(
                document.createElement("div"),
                {
                  className:
                    "media-image-fallback",
                  textContent:
                    "MGODWILL+"
                }
              )
            );
          },
          { once: true }
        );
      }
    }

    const aboutText = $("#about-chatgpt");

    if (aboutText) {
      aboutText.innerHTML = `
        <span class="eyebrow">CHATGPT</span>

        <h2>A little about the creator</h2>

        <p>
          From the work represented here, MGodwill+
          is being built as a personal media universe
          rather than a conventional portfolio.
          Its creator works across video and film editing,
          music and audio, podcasts, writing and visual
          storytelling.
        </p>

        <p>
          The platform is designed to gather those
          different creative forms into one cinematic
          experience — with the feel of a genuine
          streaming service rather than a collection
          of disconnected links.
        </p>

        <p>
          The project is deliberately being developed
          with free tools and a phone-first workflow,
          while leaving room for a considerably larger
          platform in the future.
        </p>
      `;
    }
  }
    /* ---------------------------------------------------------
     Journal
     --------------------------------------------------------- */

  function journalCard(post) {
    const title = post.title || "Journal";
    const url = post.url || "#";

    return `
      <article class="journal-card">
        <div class="journal-card-body">
          <span class="eyebrow">FROM THE JOURNAL</span>
          <h3>${escapeHtml(title)}</h3>
          <p>Read this story on the MGodwill+ Journal.</p>
          <a class="text-link"
             href="${escapeHtml(url)}"
             target="_blank"
             rel="noopener noreferrer">
            Read article →
          </a>
        </div>
      </article>
    `;
  }

  function renderJournal(target = $("#journal-grid"), posts = journal) {
    if (!target) return;

    if (!posts.length) {
      target.innerHTML = `<div class="empty-state">No journal entries yet.</div>`;
      return;
    }

    target.innerHTML = `<div class="journal-grid">${posts.map(journalCard).join("")}</div>`;
  }

  /* ---------------------------------------------------------
     About
     --------------------------------------------------------- */

  function renderAbout() {
    const photo = $("#about-photo");
    const photoUrl = CATALOGUE.aboutPhoto || CATALOGUE.aboutImage || "";

    if (photo) {
      photo.innerHTML = photoUrl
        ? safeImage(driveThumb(photoUrl), "Godwill Mathenge")
        : `<div class="media-image-fallback">MGODWILL+</div>`;

      const image = $("img", photo);
      if (image) {
        image.addEventListener("error", () => {
          image.replaceWith(Object.assign(document.createElement("div"), {
            className: "media-image-fallback",
            textContent: "MGODWILL+"
          }));
        }, { once: true });
      }
    }

    const aboutText = $("#about-chatgpt");
    if (aboutText) {
      aboutText.innerHTML = `
        <span class="eyebrow">CHATGPT</span>
        <h2>A little about the creator</h2>
        <p>
          From the work represented here, MGodwill+ is being built as a
          personal media universe rather than a conventional portfolio.
          Its creator works across video and film editing, music and audio,
          podcasts, writing and visual storytelling.
        </p>
        <p>
          The platform is designed to gather those different creative forms
          into one cinematic experience — with the feel of a genuine
          streaming service rather than a collection of disconnected links.
        </p>
        <p>
          The project is deliberately being developed with free tools and a
          phone-first workflow, while leaving room for a considerably larger
          platform in the future.
        </p>
      `;
    }
  }

  /* ---------------------------------------------------------
     Search
     --------------------------------------------------------- */

  function renderSearch() {
    const input = $("#search-input");
    const results = $("#search-results");
    const count = $("#search-count");

    if (!input || !results) return;

    function search(query) {
      const q = String(query || "").trim().toLowerCase();

      if (!q) {
        results.innerHTML = `
          <div class="search-empty">
            <span class="eyebrow">MGODWILL+</span>
            <h2>Search the catalogue.</h2>
            <p>Find films, music, podcasts and more.</p>
          </div>
        `;
        if (count) count.textContent = "";
        return;
      }

      let found;

      if (typeof searchMedia === "function") {
        found = searchMedia(q);
      } else {
        found = media.filter((item) =>
          [item.title, item.description, item.category, item.type]
            .join(" ")
            .toLowerCase()
            .includes(q)
        );
      }

      if (count) count.textContent = `${found.length} result${found.length === 1 ? "" : "s"}`;

      results.innerHTML = found.length
        ? `<div class="media-grid">${found.map((item) => mediaCard(item)).join("")}</div>`
        : `<div class="empty-state">Nothing matched “${escapeHtml(query)}”.</div>`;

      bindMediaCards(results);
    }

    input.addEventListener("input", () => search(input.value));

    const params = new URLSearchParams(window.location.search);
    const initial = params.get("q") || "";

    if (initial) {
      input.value = initial;
      search(initial);
    }
  }

  /* ---------------------------------------------------------
     Player
     --------------------------------------------------------- */

  function getEmbedUrl(url) {
    const value = String(url || "");

    if (/youtube\.com\/watch\?v=|youtu\.be\//i.test(value)) {
      let id = "";

      const watch = value.match(/[?&]v=([^&]+)/i);
      const short = value.match(/youtu\.be\/([^?&/]+)/i);

      if (watch) id = watch[1];
      if (short) id = short[1];

      if (id) return `https://www.youtube.com/embed/${encodeURIComponent(id)}`;
    }

    if (/vimeo\.com\/\d+/i.test(value)) {
      const match = value.match(/vimeo\.com\/(\d+)/i);
      if (match) return `https://player.vimeo.com/video/${match[1]}`;
    }

    if (/spotify\.com\/(track|episode|album|playlist)\//i.test(value)) {
      return value.replace("open.spotify.com/", "open.spotify.com/embed/");
    }

    return drivePreview(value);
  }

  function renderPlayer() {
    const host = $("#player-content");
    if (!host) return;

    const id = new URLSearchParams(window.location.search).get("id");
    const item = typeof getMediaById === "function"
      ? getMediaById(id)
      : media.find((entry) => entry.id === id);

    if (!item) {
      host.innerHTML = `
        <div class="empty-state player-error">
          <span class="eyebrow">MGODWILL+</span>
          <h2>Media not found.</h2>
          <p>The requested item does not exist in the current catalogue.</p>
          <a class="btn btn-primary" href="watch.html">Back to Watch</a>
        </div>
      `;
      return;
    }

    const links = mediaLinks(item);
    const primary = mediaPrimaryUrl(item);
    const embed = getEmbedUrl(primary);
    const thumbnail = mediaThumb(item);

    host.innerHTML = `
      <div class="player-shell">
        <div class="player-screen">
          ${
            embed
              ? `<iframe
                   src="${escapeHtml(embed)}"
                   title="${escapeHtml(item.title)}"
                   allow="autoplay; fullscreen; picture-in-picture"
                   allowfullscreen
                   loading="eager"></iframe>`
              : `<div class="player-placeholder">${safeImage(thumbnail, item.title)}</div>`
          }
        </div>

        <div class="player-details">
          <span class="eyebrow">${escapeHtml(item.category || typeLabel(item))}</span>
          <h1>${escapeHtml(item.title)}</h1>
          <p>${escapeHtml(item.description || "")}</p>

          <div class="player-meta">
            <span>${escapeHtml(typeLabel(item))}</span>
            ${item.category ? `<span>${escapeHtml(item.category)}</span>` : ""}
          </div>

          ${
            links.length > 1
              ? `
                <div class="player-sources">
                  <h3>Available sources</h3>
                  ${links.map((link, index) => `
                    <a class="btn btn-secondary"
                       href="${escapeHtml(link)}"
                       target="_blank"
                       rel="noopener noreferrer">
                      Open source ${index + 1}
                    </a>
                  `).join("")}
                </div>
              `
              : ""
          }

          <div class="button-row">
            <a class="btn btn-secondary" href="javascript:history.back()">← Back</a>
            <a class="btn btn-secondary"
               href="${escapeHtml(primary || "#")}"
               target="_blank"
               rel="noopener noreferrer">
              Open original
            </a>
          </div>
        </div>
      </div>
    `;
  }

  /* ---------------------------------------------------------
     Page initialisation
     --------------------------------------------------------- */

  function init() {
    renderHeader();
    renderFooter();

    const page = document.body.dataset.page || "";

    if (page === "home") renderHome();
    if (page === "watch") renderWatch();
    if (page === "music") renderMusic();
    if (page === "podcasts") renderPodcasts();
    if (page === "journal") renderJournal();
    if (page === "about") renderAbout();
    if (page === "search") renderSearch();
    if (page === "player") renderPlayer();

    hideLoader();

    document.documentElement.classList.add("mgodwill-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
