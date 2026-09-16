/* =========================================================
   MGODWILL+ STUDIO
   MAIN JAVASCRIPT
   ========================================================= */


/* =========================================================
   SUPABASE CONFIGURATION
   ========================================================= */

const SUPABASE_URL =
    "https://oalrbfjmyiotocqdfxaw.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_usTGMseaZHBR1XKvAQhQ_OZIc18NX";

let supabaseClient = null;


/* =========================================================
   STARTUP
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    startLoader();

    setupNavigation();

    setupNavbar();

    setupHero();

    setupMusicFallback();

    setupTouchEffects();

    connectToSupabase();

});


/* =========================================================
   LOADING SCREEN
   ========================================================= */

function startLoader() {

    const loader =
        document.getElementById("loader");

    const website =
        document.getElementById("website");

    if (!loader || !website) {
        return;
    }

    document.body.style.overflow = "hidden";

    setTimeout(() => {

        loader.style.opacity = "0";

        loader.style.visibility = "hidden";

        website.style.opacity = "1";

        document.body.style.overflow = "";

    }, 2200);

}


/* =========================================================
   SUPABASE CONNECTION
   ========================================================= */

function connectToSupabase() {

    console.log(
        "MGodwill+ — starting Supabase connection..."
    );


    if (
        !window.supabase ||
        typeof window.supabase.createClient !== "function"
    ) {

        console.error(
            "MGodwill+ — Supabase library did not load."
        );

        return;
    }


    try {

        supabaseClient =
            window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_KEY
            );

    } catch (error) {

        console.error(
            "MGodwill+ — could not create Supabase client:",
            error
        );

        return;
    }


    loadMgodwillContent();

}


/* =========================================================
   LOAD CONTENT
   ========================================================= */

async function loadMgodwillContent() {

    if (!supabaseClient) {
        return;
    }


    console.log(
        "MGodwill+ — requesting published content..."
    );


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("content")
                .select("*")
                .eq(
                    "published",
                    true
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        /* DATABASE ERROR */

        if (error) {

            console.error(
                "MGodwill+ — Supabase error:",
                error
            );

            console.error(
                "Error code:",
                error.code
            );

            console.error(
                "Error message:",
                error.message
            );

            console.error(
                "Error details:",
                error.details
            );

            console.error(
                "Error hint:",
                error.hint
            );

            return;
        }


        /* SUCCESS */

        const content =
            Array.isArray(data)
                ? data
                : [];


        console.log(
            "MGodwill+ — Supabase connection successful."
        );


        console.log(
            `MGodwill+ — ${content.length} published item(s) received.`
        );


        console.table(content);


        renderVideos(content);

        renderMusic(content);

        renderPodcasts(content);

        renderArticles(content);

        renderPhotos(content);


    } catch (error) {

        console.error(
            "MGodwill+ — connection failed:",
            error
        );

    }

}


/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {

    const links =
        document.querySelectorAll(
            'a[href^="#"]'
        );


    links.forEach((link) => {

        link.addEventListener(
            "click",
            (event) => {

                const targetId =
                    link.getAttribute("href");


                if (
                    !targetId ||
                    targetId === "#"
                ) {
                    return;
                }


                const target =
                    document.querySelector(
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


/* =========================================================
   NAVBAR
   ========================================================= */

function setupNavbar() {

    const navbar =
        document.querySelector(
            ".navbar"
        );


    if (!navbar) {
        return;
    }


    function updateNavbar() {

        const scrolled =
            window.scrollY > 50;


        navbar.style.background =
            scrolled

                ? "rgba(2, 3, 7, 0.92)"

                : "linear-gradient(to bottom, rgba(0,0,0,.78), transparent)";


        navbar.style.backdropFilter =
            scrolled
                ? "blur(18px)"
                : "none";


        navbar.style.webkitBackdropFilter =
            scrolled
                ? "blur(18px)"
                : "none";


        navbar.style.borderBottom =
            scrolled

                ? "1px solid rgba(255,255,255,.07)"

                : "1px solid transparent";

    }


    window.addEventListener(
        "scroll",
        updateNavbar,
        {
            passive: true
        }
    );


    updateNavbar();

}


/* =========================================================
   HERO PARALLAX
   ========================================================= */

function setupHero() {

    const heroImage =
        document.querySelector(
            ".hero-image"
        );


    if (!heroImage) {
        return;
    }


    window.addEventListener(
        "scroll",
        () => {

            const scroll =
                Math.min(
                    window.scrollY,
                    600
                );


            heroImage.style.transform =
                `scale(1.04) translateY(${scroll * 0.08}px)`;

        },
        {
            passive: true
        }
    );

}


/* =========================================================
   MUSIC FALLBACK
   ========================================================= */

function setupMusicFallback() {

    const button =
        document.querySelector(
            ".big-play"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        () => {

            if (
                !button.dataset.dynamicMusic
            ) {

                button.classList.toggle(
                    "is-playing"
                );


                button.textContent =
                    button.classList.contains(
                        "is-playing"
                    )

                        ? "❚❚"

                        : "▶";

            }

        }
    );

}


/* =========================================================
   TOUCH FEEDBACK
   ========================================================= */

function setupTouchEffects() {

    const elements =
        document.querySelectorAll(
            ".media-card, .podcast-card, .article-card, .watch-button, .more-button, .login-button"
        );


    elements.forEach(
        (element) => {

            element.addEventListener(
                "touchstart",
                () => {

                    element.style.transform =
                        "scale(.98)";

                },
                {
                    passive: true
                }
            );


            element.addEventListener(
                "touchend",
                () => {

                    element.style.transform =
                        "";

                },
                {
                    passive: true
                }
            );


            element.addEventListener(
                "touchcancel",
                () => {

                    element.style.transform =
                        "";

                },
                {
                    passive: true
                }
            );

        }
    );

}


/* =========================================================
   VIDEOS
   ========================================================= */

function renderVideos(content) {

    const container =
        document.querySelector(
            ".media-rail"
        );


    if (!container) {
        return;
    }


    const videos =
        content.filter(
            (item) =>
                normaliseType(
                    item.content_type
                ) === "video"
        );


    if (!videos.length) {

        console.log(
            "MGodwill+ — no video rows matched content_type = video."
        );

        return;
    }


    container.innerHTML = "";


    videos.forEach(
        (item) => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "media-card";


            card.tabIndex = 0;


            card.setAttribute(
                "role",
                "button"
            );


            card.setAttribute(
                "aria-label",
                `Play ${item.title || "video"}`
            );


            const image =
                document.createElement(
                    "div"
                );


            image.className =
                "media-image";


            if (item.thumbnail_url) {

                image.style.backgroundImage =
                    `url("${escapeCssUrl(item.thumbnail_url)}")`;

                image.style.backgroundSize =
                    "cover";

                image.style.backgroundPosition =
                    "center";

            }


            const type =
                document.createElement(
                    "span"
                );


            type.className =
                "card-type";


            type.textContent =
                item.category ||
                "VIDEO";


            const play =
                document.createElement(
                    "button"
                );


            play.className =
                "card-play";


            play.type =
                "button";


            play.textContent =
                "▶";


            play.setAttribute(
                "aria-label",
                `Play ${item.title || "video"}`
            );


            const info =
                document.createElement(
                    "div"
                );


            info.className =
                "card-info";


            const title =
                document.createElement(
                    "h3"
                );


            title.textContent =
                item.title ||
                "Untitled";


            const description =
                document.createElement(
                    "p"
                );


            description.textContent =
                item.description ||
                "MGodwill+ Original";


            info.append(
                title,
                description
            );


            image.append(
                type,
                play
            );


            card.append(
                image,
                info
            );


            container.appendChild(
                card
            );


            const open =
                () =>
                    openMedia(
                        item.media_url,
                        item.title
                    );


            card.addEventListener(
                "click",
                open
            );


            card.addEventListener(
                "keydown",
                (event) => {

                    if (
                        event.key === "Enter" ||
                        event.key === " "
                    ) {

                        event.preventDefault();

                        open();

                    }

                }
            );


            play.addEventListener(
                "click",
                (event) => {

                    event.stopPropagation();

                    open();

                }
            );

        }
    );

}


/* =========================================================
   MUSIC
   ========================================================= */

function renderMusic(content) {

    const music =
        content.filter(
            (item) =>
                normaliseType(
                    item.content_type
                ) === "music"
        );


    if (!music.length) {
        return;
    }


    const feature =
        document.querySelector(
            ".music-feature"
        );


    if (!feature) {
        return;
    }


    const item =
        music[0];


    const title =
        feature.querySelector(
            ".music-details h3"
        );


    const description =
        feature.querySelector(
            ".music-details p"
        );


    const albumArt =
        feature.querySelector(
            ".album-art"
        );


    const button =
        feature.querySelector(
            ".big-play"
        );


    if (title) {

        title.textContent =
            item.title ||
            "MGodwill Sessions";

    }


    if (description) {

        description.textContent =
            item.description ||
            "Original music";

    }


    if (
        albumArt &&
        item.thumbnail_url
    ) {

        albumArt.style.backgroundImage =
            `url("${escapeCssUrl(item.thumbnail_url)}")`;

        albumArt.style.backgroundSize =
            "cover";

        albumArt.style.backgroundPosition =
            "center";

    }


    if (button) {

        button.dataset.dynamicMusic =
            "true";


        button.onclick =
            () =>
                openMedia(
                    item.media_url,
                    item.title
                );

    }

}


/* =========================================================
   PODCASTS
   ========================================================= */

function renderPodcasts(content) {

    const container =
        document.querySelector(
            ".podcast-grid"
        );


    if (!container) {
        return;
    }


    const podcasts =
        content.filter(
            (item) =>
                normaliseType(
                    item.content_type
                ) === "podcast"
        );


    if (!podcasts.length) {
        return;
    }


    container.innerHTML =
        "";


    podcasts.forEach(
        (item) => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "podcast-card";


            const label =
                document.createElement(
                    "span"
                );


            label.textContent =
                item.category ||
                "PODCAST";


            const title =
                document.createElement(
                    "h3"
                );


            title.textContent =
                item.title ||
                "Untitled";


            const description =
                document.createElement(
                    "p"
                );


            description.textContent =
                item.description ||
                "";


            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "podcast-play";


            button.type =
                "button";


            button.textContent =
                "▶ PLAY";


            button.addEventListener(
                "click",
                () =>
                    openMedia(
                        item.media_url,
                        item.title
                    )
            );


            card.append(
                label,
                title,
                description,
                button
            );


            container.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   ARTICLES
   ========================================================= */

function renderArticles(content) {

    const container =
        document.querySelector(
            ".article-grid"
        );


    if (!container) {
        return;
    }


    const articles =
        content.filter(
            (item) =>
                normaliseType(
                    item.content_type
                ) === "article"
        );


    if (!articles.length) {
        return;
    }


    container.innerHTML =
        "";


    articles.forEach(
        (item) => {

            const article =
                document.createElement(
                    "article"
                );


            article.className =
                "article-card";


            const category =
                document.createElement(
                    "span"
                );


            category.textContent =
                item.category ||
                "JOURNAL";


            const title =
                document.createElement(
                    "h3"
                );


            title.textContent =
                item.title ||
                "Untitled";


            const description =
                document.createElement(
                    "p"
                );


            description.textContent =
                item.description ||
                "";


            article.append(
                category,
                title,
                description
            );


            if (item.article_body) {

                const link =
                    document.createElement(
                        "a"
                    );


                link.href =
                    "#";


                link.textContent =
                    "READ ARTICLE →";


                link.addEventListener(
                    "click",
                    (event) => {

                        event.preventDefault();

                        showArticle(item);

                    }
                );


                article.appendChild(
                    link
                );

            }


            container.appendChild(
                article
            );

        }
    );

}


/* =========================================================
   ARTICLE READER
   ========================================================= */

function showArticle(item) {

    const overlay =
        document.createElement(
            "div"
        );


    overlay.style.cssText = [
        "position:fixed",
        "inset:0",
        "z-index:9999",
        "padding:30px 20px",
        "background:rgba(0,0,0,.92)",
        "overflow:auto",
        "color:#fff"
    ].join(";");


  
