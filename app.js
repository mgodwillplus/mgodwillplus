/* =========================================================
   MGODWILL+ STUDIO
   APPLICATION SCRIPT — PART 1 OF 2
   ========================================================= */

"use strict";

/* ---------------------------------------------------------
   GLOBAL HELPERS
   --------------------------------------------------------- */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) =>
  Array.from(root.querySelectorAll(selector));

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function safeUrl(url) {
  try {
    return new URL(String(url || ""), window.location.href).href;
  } catch {
    return "";
  }
}

/* ---------------------------------------------------------
   GOOGLE DRIVE
   --------------------------------------------------------- */

function getDriveFileId(url) {
  const value = String(url || "").trim();

  if (!value) return "";

  /* /file/d/FILE_ID/ */
  let match = value.match(
    /drive\.google\.com\/file\/d\/([^/?#]+)/i
  );

  if (match) {
    return match[1];
  }

  /* ?id=FILE_ID */
  match = value.match(/[?&]id=([^&#]+)/i);

  if (
    match &&
    /drive\.google\.com|drive\.usercontent\.google\.com/i.test(value)
  ) {
    return decodeURIComponent(match[1]);
  }

  return "";
}

function isDriveUrl(url) {
  return /(^|\/\/)(drive\.google\.com|drive\.usercontent\.google\.com)\b/i
    .test(String(url || ""));
}

function drivePreview(url) {
  const id = getDriveFileId(url);

  if (!id) {
    return "";
  }

  return `https://drive.google.com/file/d/${encodeURIComponent(id)}/preview`;
}

function driveThumb(url) {
  const id = getDriveFileId(url);

  if (!id) {
    return "";
  }

  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1200`;
}

/* ---------------------------------------------------------
   MEDIA DATA HELPERS
   --------------------------------------------------------- */

function mediaPrimaryUrl(item) {
  if (!item) return "";

  return (
    item.url ||
    item.link ||
    item.video ||
    item.videoUrl ||
    item.mediaUrl ||
    item.source ||
    item.drive ||
    item.driveUrl ||
    item.externalUrl ||
    ""
  );
}

function mediaLinks(item) {
  if (!item) return [];

  const candidates = [];

  const possibleArrays = [
    item.links,
    item.sources,
    item.urls,
    item.mediaLinks
  ];

  possibleArrays.forEach(list => {
    if (Array.isArray(list)) {
      list.forEach(value => {
        if (typeof value === "string") {
          candidates.push(value);
        } else if (value && typeof value === "object") {
          candidates.push(
            value.url ||
            value.link ||
            value.href ||
            value.source ||
            ""
          );
        }
      });
    }
  });

  const primary = mediaPrimaryUrl(item);

  if (primary) {
    candidates.unshift(primary);
  }

  return [...new Set(
    candidates
      .map(value => String(value || "").trim())
      .filter(Boolean)
  )];
}

/* ---------------------------------------------------------
   EMBED URL CONVERSION
   --------------------------------------------------------- */

function getEmbedUrl(url) {
  const value = String(url || "").trim();

  if (!value) {
    return "";
  }

  /* GOOGLE DRIVE */
  if (isDriveUrl(value)) {
    return drivePreview(value);
  }

  /* YOUTUBE */
  if (
    /youtube\.com\/watch\?v=/i.test(value) ||
    /youtu\.be\//i.test(value) ||
    /youtube\.com\/shorts\//i.test(value)
  ) {
    let videoId = "";

    let match = value.match(
      /youtube\.com\/watch\?v=([^&]+)/i
    );

    if (match) {
      videoId = match[1];
    }

    if (!videoId) {
      match = value.match(
        /youtu\.be\/([^?&#]+)/i
      );

      if (match) {
        videoId = match[1];
      }
    }

    if (!videoId) {
      match = value.match(
        /youtube\.com\/shorts\/([^?&#]+)/i
      );

      if (match) {
        videoId = match[1];
      }
    }

    if (videoId) {
      return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`;
    }
  }

  /* ALREADY EMBEDDED YOUTUBE */
  if (/youtube\.com\/embed\//i.test(value)) {
    return value;
  }

  /* VIMEO */
  if (/vimeo\.com\/\d+/i.test(value)) {
    const match = value.match(/vimeo\.com\/(\d+)/i);

    if (match) {
      return `https://player.vimeo.com/video/${match[1]}`;
    }
  }

  /* ALREADY EMBEDDED VIMEO */
  if (/player\.vimeo\.com\/video\//i.test(value)) {
    return value;
  }

  /* SPOTIFY */
  if (
    /spotify\.com\/(track|episode|album|playlist)\//i.test(value)
  ) {
    const match = value.match(
      /spotify\.com\/(track|episode|album|playlist)\/([^?&#]+)/i
    );

    if (match) {
      return `https://open.spotify.com/embed/${match[1]}/${match[2]}`;
    }
  }

  /* EXPLICIT PREVIEW / EMBED URL */
  if (
    /\/preview\b/i.test(value) ||
    /\/embed\b/i.test(value)
  ) {
    return value;
  }

  /*
    Direct video files are handled by the native video
    player instead of an iframe.
  */
  if (
    /\.(mp4|webm|ogg)(\?.*)?$/i.test(value)
  ) {
    return value;
  }

  return "";
}

/* ---------------------------------------------------------
   DIRECT MEDIA DETECTION
   --------------------------------------------------------- */

function isDirectVideo(url) {
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(
    String(url || "")
  );
}

function isDirectAudio(url) {
  return /\.(mp3|wav|m4a|aac|oga|ogg)(\?.*)?$/i.test(
    String(url || "")
  );
}

/* ---------------------------------------------------------
   CATALOGUE ACCESS
   --------------------------------------------------------- */

function allMedia() {
  try {
    if (typeof getAllMedia === "function") {
      return getAllMedia() || [];
    }
  } catch (error) {
    console.error("Unable to load catalogue:", error);
  }

  if (Array.isArray(window.MEDIA_CATALOGUE)) {
    return window.MEDIA_CATALOGUE;
  }

  if (Array.isArray(window.catalogue)) {
    return window.catalogue;
  }

  if (Array.isArray(window.mediaCatalogue)) {
    return window.mediaCatalogue;
  }

  return [];
}

function getMediaItem(id) {
  const media = allMedia();

  return media.find(item =>
    String(item.id) === String(id)
  );
}

/* ---------------------------------------------------------
   PAGE / ROUTING HELPERS
   --------------------------------------------------------- */

function getQueryParam(name) {
  const params = new URLSearchParams(
    window.location.search
  );

  return params.get(name);
}

function goHome() {
  window.location.href = "index.html";
}

function openMedia(id) {
  window.location.href =
    `player.html?id=${encodeURIComponent(id)}`;
}

/* ---------------------------------------------------------
   NAVIGATION
   --------------------------------------------------------- */

function setupNavigation() {
  const menuButton = $(".menu-toggle");
  const mobileNav = $(".mobile-nav");

  if (!menuButton || !mobileNav) {
    return;
  }

  menuButton.addEventListener("click", () => {
    const isOpen =
      mobileNav.classList.toggle("open");

    menuButton.setAttribute(
      "aria-expanded",
      String(isOpen)
    );
  });

  $$(".mobile-nav a").forEach(link => {
    link.addEventListener("click", () => {
      mobileNav.classList.remove("open");
      menuButton.setAttribute(
        "aria-expanded",
        "false"
      );
    });
  });
}

/* ---------------------------------------------------------
   SEARCH
   --------------------------------------------------------- */

function setupSearch() {
  const searchInput = $("#searchInput");

  if (!searchInput) {
    return;
  }

  searchInput.addEventListener("input", () => {
    const query =
      searchInput.value.trim().toLowerCase();

    $$(".media-card").forEach(card => {
      const text =
        card.textContent.toLowerCase();

      card.style.display =
        !query || text.includes(query)
          ? ""
          : "none";
    });
  });
}

/* ---------------------------------------------------------
   MEDIA CARD
   --------------------------------------------------------- */

function mediaThumbnail(item) {
  if (!item) return "";

  const direct =
    item.thumbnail ||
    item.thumbnailUrl ||
    item.image ||
    item.poster ||
    item.cover ||
    "";

  if (direct) {
    return direct;
  }

  const primary = mediaPrimaryUrl(item);

  if (isDriveUrl(primary)) {
    return driveThumb(primary);
  }

  return "";
}

function mediaTitle(item) {
  return (
    item?.title ||
    item?.name ||
    "Untitled"
  );
}

function mediaDescription(item) {
  return (
    item?.description ||
    item?.summary ||
    ""
  );
}

function mediaCategory(item) {
  return (
    item?.category ||
    item?.type ||
    "Media"
  );
}

/* ---------------------------------------------------------
   RENDER MEDIA CARD
   --------------------------------------------------------- */

function renderMediaCard(item) {
  const id = item?.id;

  if (id === undefined || id === null) {
    return "";
  }

  const title =
    escapeHtml(mediaTitle(item));

  const description =
    escapeHtml(mediaDescription(item));

  const category =
    escapeHtml(mediaCategory(item));

  const thumbnail =
    mediaThumbnail(item);

  return `
    <article
      class="media-card"
      data-media-id="${escapeHtml(id)}"
      tabindex="0"
      role="button"
      aria-label="Open ${title}"
    >

      <div class="media-card-image">

        ${
          thumbnail
            ? `
              <img
                src="${escapeHtml(thumbnail)}"
                alt="${title}"
                loading="lazy"
              >
            `
            : `
              <div class="media-card-placeholder">
                <span>MG+</span>
              </div>
            `
        }

        <div class="media-card-overlay">
          <span class="play-icon">▶</span>
        </div>

        <span class="media-card-category">
          ${category}
        </span>

      </div>

      <div class="media-card-body">

        <h3>
          ${title}
        </h3>

        ${
          description
            ? `
              <p>
                ${description}
              </p>
            `
            : ""
        }

      </div>

    </article>
  `;
}

/* ---------------------------------------------------------
   ATTACH CARD EVENTS
   --------------------------------------------------------- */

function attachMediaCardEvents(root = document) {
  $$(".media-card", root).forEach(card => {

    const id =
      card.getAttribute("data-media-id");

    card.addEventListener("click", () => {
      if (id) {
        openMedia(id);
      }
    });

    card.addEventListener("keydown", event => {

      if (
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();

        if (id) {
          openMedia(id);
        }
      }

    });

  });
}

/* ---------------------------------------------------------
   RENDER MEDIA GRID
   --------------------------------------------------------- */

function renderMediaGrid(items, container) {
  if (!container) {
    return;
  }

  if (!Array.isArray(items) || !items.length) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No media available</h3>
        <p>
          There is currently nothing to display here.
        </p>
      </div>
    `;

    return;
  }

  container.innerHTML =
    items
      .map(renderMediaCard)
      .join("");

  attachMediaCardEvents(container);
}

/* ---------------------------------------------------------
   CATEGORY FILTERING
   --------------------------------------------------------- */

function filterByCategory(items, category) {
  if (
    !category ||
    category.toLowerCase() === "all"
  ) {
    return items;
  }

  return items.filter(item =>
    String(mediaCategory(item))
      .toLowerCase() === category.toLowerCase()
  );
}

/* ---------------------------------------------------------
   INITIALISE GRIDS
   --------------------------------------------------------- */

function initialiseMediaGrids() {

  const media =
    allMedia();

  const grids =
    $$(".media-grid");

  grids.forEach(grid => {

    const category =
      grid.dataset.category ||
      grid.getAttribute("data-category") ||
      "";

    const filtered =
      filterByCategory(media, category);

    renderMediaGrid(
      filtered,
      grid
    );

  });
}

/* ---------------------------------------------------------
   PLAYER PLACEHOLDER
   --------------------------------------------------------- */

function playerUnavailable(message) {
  return `
    <div class="player-unavailable">

      <div class="player-unavailable-icon">
        ▶
      </div>

      <h3>
        Video unavailable
      </h3>

      <p>
        ${escapeHtml(
          message ||
          "This media source could not be embedded."
        )}
      </p>

    </div>
  `;
}

/* ---------------------------------------------------------
   PLAYER
   --------------------------------------------------------- */

function renderPlayer() {

  const player =
    $(".player-shell");

  if (!player) {
    return;
  }

  const id =
    getQueryParam("id");

  const item =
    getMediaItem(id);

  if (!item) {

    player.innerHTML =
      playerUnavailable(
        "The requested media could not be found."
      );

    return;
  }

  const title =
    mediaTitle(item);

  const description =
    mediaDescription(item);

  const category =
    mediaCategory(item);

  const links =
    mediaLinks(item);

  const primary =
    links[0] ||
    mediaPrimaryUrl(item);

  const embed =
    getEmbedUrl(primary);

  const titleElement =
    $(".player-title", player);

  if (titleElement) {
    titleElement.textContent =
      title;
  }

  const descriptionElement =
    $(".player-description", player);

  if (descriptionElement) {
    descriptionElement.textContent =
      description;
  }

  const categoryElement =
    $(".player-category", player);

  if (categoryElement) {
    categoryElement.textContent =
      category;
  }

  const screen =
    $(".player-screen", player);

  if (!screen) {
    return;
  }

  /* DIRECT VIDEO FILE */

  if (isDirectVideo(primary)) {

    screen.innerHTML = `
      <video
        controls
        playsinline
        preload="metadata"
        src="${escapeHtml(primary)}"
      ></video>
    `;

  }

  /* GOOGLE DRIVE / YOUTUBE / VIMEO / SPOTIFY */

  else if (embed) {

    screen.innerHTML = `
      <iframe
        src="${escapeHtml(embed)}"
        title="${escapeHtml(title)}"
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        allowfullscreen
        loading="eager"
        referrerpolicy="strict-origin-when-cross-origin"
      ></iframe>
    `;

  }

  /* AUDIO */

  else if (isDirectAudio(primary)) {

    screen.innerHTML = `
      <div class="audio-player">
        <div class="audio-player-icon">
          ♪
        </div>

        <audio
          controls
          preload="metadata"
          src="${escapeHtml(primary)}"
        ></audio>
      </div>
    `;

  }

  /* NOTHING EMBEDDABLE */

  else {

    screen.innerHTML =
      playerUnavailable(
        "This source does not provide an embeddable player."
      );

  }

  /* -------------------------------------------------------
     ORIGINAL SOURCE BUTTON
     ------------------------------------------------------- */

  const sourceButton =
    $(".player-open-original", player);

  if (sourceButton && primary) {

    sourceButton.href =
      safeUrl(primary);

    sourceButton.target =
      "_blank";

    sourceButton.rel =
      "noopener noreferrer";

  }

  /* -------------------------------------------------------
     SOURCE LIST
     ------------------------------------------------------- */

  const sources =
    $(".player-sources", player);

  if (sources) {

    if (links.length > 1) {

      sources.innerHTML = `
        <div class="sources-heading">
          Available sources
        </div>

        <div class="sources-list">

          ${links.map((link, index) => `
            <a
              href="${escapeHtml(link)}"
              target="_blank"
              rel="noopener noreferrer"
              class="source-link"
            >
              Source ${index + 1}
            </a>
          `).join("")}

        </div>
      `;

    } else {

      sources.innerHTML = "";

    }

  }
}

/* =========================================================
   MGODWILL+ STUDIO
   APPLICATION SCRIPT — PART 2 OF 2
   ========================================================= */


/* ---------------------------------------------------------
   OPTIONAL HERO / FEATURED MEDIA
   --------------------------------------------------------- */

function renderFeaturedMedia() {

  const container =
    $(".featured-media");

  if (!container) {
    return;
  }

  const media =
    allMedia();

  if (!media.length) {
    return;
  }

  const featured =
    media.find(item =>
      item.featured === true ||
      item.featured === "true"
    ) || media[0];

  if (!featured) {
    return;
  }

  const id =
    featured.id;

  const title =
    escapeHtml(mediaTitle(featured));

  const description =
    escapeHtml(mediaDescription(featured));

  const thumbnail =
    mediaThumbnail(featured);

  container.innerHTML = `

    <div class="featured-inner">

      ${
        thumbnail
          ? `
            <img
              class="featured-image"
              src="${escapeHtml(thumbnail)}"
              alt="${title}"
            >
          `
          : ""
      }

      <div class="featured-content">

        <span class="eyebrow">
          Featured
        </span>

        <h2>
          ${title}
        </h2>

        ${
          description
            ? `
              <p>
                ${description}
              </p>
            `
            : ""
        }

        <button
          class="btn btn-primary featured-play"
          type="button"
          data-media-id="${escapeHtml(id)}"
        >
          Watch now
        </button>

      </div>

    </div>
  `;

  const button =
    $(".featured-play", container);

  if (button) {

    button.addEventListener(
      "click",
      () => {

        const mediaId =
          button.getAttribute(
            "data-media-id"
          );

        if (mediaId) {
          openMedia(mediaId);
        }

      }
    );

  }
}


/* ---------------------------------------------------------
   CATEGORY BUTTONS
   --------------------------------------------------------- */

function setupCategoryButtons() {

  const buttons =
    $$(".category-button");

  if (!buttons.length) {
    return;
  }

  const media =
    allMedia();

  const grids =
    $$(".media-grid");

  buttons.forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const category =
          button.dataset.category ||
          button.getAttribute(
            "data-category"
          ) ||
          "all";

        buttons.forEach(item => {
          item.classList.remove("active");
        });

        button.classList.add("active");

        grids.forEach(grid => {

          const filtered =
            filterByCategory(
              media,
              category
            );

          renderMediaGrid(
            filtered,
            grid
          );

        });

      }
    );

  });
}


/* ---------------------------------------------------------
   SCROLL REVEAL
   --------------------------------------------------------- */

function setupScrollReveal() {

  const elements =
    $$(".reveal");

  if (!elements.length) {
    return;
  }

  if (
    !("IntersectionObserver" in window)
  ) {

    elements.forEach(element => {
      element.classList.add("visible");
    });

    return;
  }

  const observer =
    new IntersectionObserver(
      entries => {

        entries.forEach(entry => {

          if (entry.isIntersecting) {

            entry.target.classList.add(
              "visible"
            );

            observer.unobserve(
              entry.target
            );

          }

        });

      },
      {
        threshold: 0.12
      }
    );

  elements.forEach(element => {
    observer.observe(element);
  });
}


/* ---------------------------------------------------------
   LOADER
   --------------------------------------------------------- */

function hideLoader() {

  const loader =
    $(".site-loader");

  if (!loader) {
    return;
  }

  loader.classList.add("loaded");

  window.setTimeout(
    () => {
      loader.setAttribute(
        "aria-hidden",
        "true"
      );
    },
    700
  );
}


/* ---------------------------------------------------------
   BACK TO TOP
   --------------------------------------------------------- */

function setupBackToTop() {

  const button =
    $(".back-to-top");

  if (!button) {
    return;
  }

  const update =
    () => {

      if (window.scrollY > 500) {
        button.classList.add("visible");
      } else {
        button.classList.remove("visible");
      }

    };

  window.addEventListener(
    "scroll",
    update,
    {
      passive: true
    }
  );

  button.addEventListener(
    "click",
    () => {

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

    }
  );

  update();
}


/* ---------------------------------------------------------
   YEAR
   --------------------------------------------------------- */

function setCurrentYear() {

  const year =
    new Date().getFullYear();

  $$("[data-current-year]").forEach(
    element => {
      element.textContent =
        String(year);
    }
  );

}


/* ---------------------------------------------------------
   ACTIVE NAVIGATION LINK
   --------------------------------------------------------- */

function setupActiveNavigation() {

  const currentPage =
    window.location.pathname
      .split("/")
      .pop()
      .toLowerCase();

  $$(".desktop-nav a, .mobile-nav a")
    .forEach(link => {

      const href =
        link.getAttribute("href");

      if (!href) {
        return;
      }

      const targetPage =
        href
          .split("?")[0]
          .split("#")[0]
          .split("/")
          .pop()
          .toLowerCase();

      if (
        targetPage &&
        targetPage === currentPage
      ) {

        link.classList.add(
          "active"
        );

      }

    });

}


/* ---------------------------------------------------------
   EXTERNAL LINKS
   --------------------------------------------------------- */

function setupExternalLinks() {

  $$("a[href]").forEach(link => {

    const href =
      link.getAttribute("href");

    if (!href) {
      return;
    }

    if (
      /^https?:\/\//i.test(href) &&
      !href.includes(
        window.location.hostname
      )
    ) {

      link.target =
        link.target || "_blank";

      link.rel =
        link.rel ||
        "noopener noreferrer";

    }

  });

}


/* ---------------------------------------------------------
   IMAGE FALLBACK
   --------------------------------------------------------- */

function setupImageFallbacks() {

  $$("img").forEach(image => {

    image.addEventListener(
      "error",
      () => {

        image.classList.add(
          "image-error"
        );

      },
      {
        once: true
      }
    );

  });

}


/* ---------------------------------------------------------
   KEYBOARD SHORTCUT
   --------------------------------------------------------- */

function setupKeyboardShortcuts() {

  document.addEventListener(
    "keydown",
    event => {

      /*
       * Escape closes the mobile menu.
       */

      if (event.key === "Escape") {

        const mobileNav =
          $(".mobile-nav");

        const menuButton =
          $(".menu-toggle");

        if (mobileNav) {
          mobileNav.classList.remove(
            "open"
          );
        }

        if (menuButton) {
          menuButton.setAttribute(
            "aria-expanded",
            "false"
          );
        }

      }

    }
  );

}


/* ---------------------------------------------------------
   URL HASH HANDLING
   --------------------------------------------------------- */

function setupHashNavigation() {

  $$("a[href^='#']").forEach(link => {

    link.addEventListener(
      "click",
      event => {

        const targetId =
          link
            .getAttribute("href")
            .slice(1);

        if (!targetId) {
          return;
        }

        const target =
          document.getElementById(
            targetId
          );

        if (!target) {
          return;
        }

        event.preventDefault();

        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

      }
    );

  });

}


/* ---------------------------------------------------------
   PLAYER SOURCE SWITCHING
   --------------------------------------------------------- */

function setupPlayerSources() {

  const player =
    $(".player-shell");

  if (!player) {
    return;
  }

  const sourceLinks =
    $$(".source-link", player);

  const screen =
    $(".player-screen", player);

  if (!sourceLinks.length || !screen) {
    return;
  }

  sourceLinks.forEach(
    link => {

      link.addEventListener(
        "click",
        event => {

          /*
           * For source links we deliberately keep
           * the original source available in a new
           * tab. This prevents the MGodwill+ player
           * from being destroyed by a source that
           * cannot be embedded.
           */

          const source =
            link.getAttribute("href");

          if (!source) {
            return;
          }

          const embed =
            getEmbedUrl(source);

          if (!embed) {
            return;
          }

          event.preventDefault();

          screen.innerHTML = `
            <iframe
              src="${escapeHtml(embed)}"
              title="MGodwill+ player"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowfullscreen
              loading="eager"
              referrerpolicy="strict-origin-when-cross-origin"
            ></iframe>
          `;

        }
      );

    }
  );

}


/* ---------------------------------------------------------
   PLAYER ERROR HANDLING
   --------------------------------------------------------- */

function setupPlayerErrorHandling() {

  const player =
    $(".player-screen");

  if (!player) {
    return;
  }

  player.addEventListener(
    "error",
    event => {

      console.warn(
        "MGodwill+ player error:",
        event
      );

    },
    true
  );

}


/* ---------------------------------------------------------
   DRIVE PERMISSION MESSAGE
   --------------------------------------------------------- */

function setupDriveNotice() {

  const player =
    $(".player-shell");

  if (!player) {
    return;
  }

  const primary =
    mediaPrimaryUrl(
      getMediaItem(
        getQueryParam("id")
      )
    );

  if (!isDriveUrl(primary)) {
    return;
  }

  /*
   * This does NOT interfere with playback.
   *
   * It merely makes the situation clearer if a
   * Google Drive file is restricted by permissions.
   */

  const notice =
    $(".drive-notice", player);

  if (!notice) {
    return;
  }

  notice.textContent =
    "If the video does not appear, make sure the Google Drive file is accessible to viewers.";
}


/* ---------------------------------------------------------
   PREVENT EMPTY BUTTON LINKS
   --------------------------------------------------------- */

function setupButtonSafety() {

  $$("a[href='#']").forEach(link => {

    link.addEventListener(
      "click",
      event => {
        event.preventDefault();
      }
    );

  });

}


/* ---------------------------------------------------------
   SMOOTH PAGE TRANSITIONS
   --------------------------------------------------------- */

function setupPageTransitions() {

  const internalLinks =
    $$("a[href]");

  internalLinks.forEach(link => {

    const href =
      link.getAttribute("href");

    if (!href) {
      return;
    }

    if (
      href.startsWith("#") ||
      href.startsWith("http") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:")
    ) {
      return;
    }

    link.addEventListener(
      "click",
      event => {

        /*
         * Do not interfere with modifier-clicks.
         */

        if (
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }

        /*
         * Normal browser navigation remains
         * responsible for loading the next page.
         */

      }
    );

  });

}


/* ---------------------------------------------------------
   APPLICATION INITIALISATION
   --------------------------------------------------------- */

function initialiseMGodwillPlus() {

  setupNavigation();

  setupSearch();

  initialiseMediaGrids();

  renderFeaturedMedia();

  renderPlayer();

  setupCategoryButtons();

  setupScrollReveal();

  setupBackToTop();

  setCurrentYear();

  setupActiveNavigation();

  setupExternalLinks();

  setupImageFallbacks();

  setupKeyboardShortcuts();

  setupHashNavigation();

  setupPlayerSources();

  setupPlayerErrorHandling();

  setupDriveNotice();

  setupButtonSafety();

  setupPageTransitions();

  /*
   * Give the browser a moment to paint the page,
   * then remove the cinematic loader.
   */

  window.setTimeout(
    hideLoader,
    350
  );
}


/* ---------------------------------------------------------
   SINGLE DOM READY INITIALISATION
   --------------------------------------------------------- */

if (
  document.readyState === "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initialiseMGodwillPlus,
    {
      once: true
    }
  );

} else {

  initialiseMGodwillPlus();

}


/* =========================================================
   END OF MGODWILL+ APPLICATION SCRIPT
   ========================================================= */
