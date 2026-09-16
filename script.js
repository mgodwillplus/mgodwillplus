/* =========================================================
   MGODWILL+ STUDIO
   Main JavaScript
   ========================================================= */


/* =========================================================
   SUPABASE CONNECTION
   ========================================================= */

const SUPABASE_URL =
    "https://oalrbfjmyiotocqdfxaw.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_usTGMseaZHBR4x1XKvAQhQ_OZIc18NX";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        startLoader();

        setupNavigation();

        setupNavbar();

        setupHero();

        setupMusic();

        setupTouchEffects();

        loadMgodwillContent();

    }
);


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

    document.body.style.overflow =
        "hidden";

    setTimeout(function () {

        loader.style.opacity =
            "0";

        loader.style.visibility =
            "hidden";

        website.style.opacity =
            "1";

        document.body.style.overflow =
            "";

    }, 2200);
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {

    const links =
        document.querySelectorAll(
            'a[href^="#"]'
        );

    links.forEach(function (link) {

        link.addEventListener(
            "click",
            function (event) {

                const targetId =
                    link.getAttribute(
                        "href"
                    );

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

        if (window.scrollY > 50) {

            navbar.style.background =
                "rgba(2, 3, 7, 0.92)";

            navbar.style.backdropFilter =
                "blur(18px)";

            navbar.style.webkitBackdropFilter =
                "blur(18px)";

            navbar.style.borderBottom =
                "1px solid rgba(255,255,255,.07)";

        } else {

            navbar.style.background =
                "linear-gradient(to bottom, rgba(0,0,0,.78), transparent)";

            navbar.style.backdropFilter =
                "none";

            navbar.style.webkitBackdropFilter =
                "none";

            navbar.style.borderBottom =
                "1px solid transparent";

        }

    }

    window.addEventListener(
        "scroll",
        updateNavbar
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
        function () {

            const scroll =
                Math.min(
                    window.scrollY,
                    600
                );

            heroImage.style.transform =
                "scale(1.04) translateY(" +
                scroll * 0.08 +
                "px)";

        }
    );
}


/* =========================================================
   MUSIC BUTTON
   ========================================================= */

function setupMusic() {

    const musicButton =
        document.querySelector(
            ".big-play"
        );

    if (!musicButton) {
        return;
    }

    let playing = false;

    musicButton.addEventListener(
        "click",
        function () {

            playing = !playing;

            musicButton.textContent =
                playing
                    ? "❚❚"
                    : "▶";

        }
    );
}


/* =========================================================
   TOUCH EFFECTS
   ========================================================= */

function setupTouchEffects() {

    const elements =
        document.querySelectorAll(
            ".media-card, .podcast-card, .article-card, .watch-button, .more-button, .login-button"
        );

    elements.forEach(function (element) {

        element.addEventListener(
            "touchstart",
            function () {

                element.style.transform =
                    "scale(.98)";

            },
            {
                passive: true
            }
        );

        element.addEventListener(
            "touchend",
            function () {

                element.style.transform =
                    "";

            },
            {
                passive: true
            }
        );

    });
}


/* =========================================================
   LOAD CONTENT FROM SUPABASE
   ========================================================= */

async function loadMgodwillContent() {

    console.log(
        "MGodwill+ is connecting to Supabase..."
    );

    try {

        const result =
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


        /* -----------------------------------------
           DATABASE ERROR
           ----------------------------------------- */

        if (result.error) {

            console.error(
                "MGodwill+ Supabase error:",
                result.error
            );

            return;
        }


        /* -----------------------------------------
           SUCCESS
           ----------------------------------------- */

        console.log(
            "MGodwill+ connected successfully."
        );

        console.log(
            "Content received:",
            result.data
        );


        displayVideos(
            result.data
        );

        displayMusic(
            result.data
        );

        displayPodcasts(
            result.data
        );

        displayArticles(
            result.data
        );

        displayPhotos(
            result.data
        );


    } catch (error) {

        console.error(
            "MGodwill+ connection failed:",
            error
        );

    }
}


/* =========================================================
   DISPLAY VIDEOS
   ========================================================= */

function displayVideos(content) {

    const container =
        document.querySelector(
            ".media-rail"
        );

    if (!container) {
        return;
    }

    const videos =
        content.filter(function (item) {

            return (
                item.content_type
                    ?.toLowerCase()
                    === "video"
            );

        });


    if (videos.length === 0) {

        console.log(
            "No video content found."
        );

        return;
    }


    container.innerHTML = "";


    videos.forEach(function (item) {

        const card =
            document.createElement(
                "article"
            );

        card.className =
            "media-card";


        const image =
            document.createElement(
                "div"
            );

        image.className =
            "media-image";


        if (item.thumbnail_url) {

            image.style.backgroundImage =
                "url('" +
                item.thumbnail_url +
                "')";

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

        play.textContent =
            "▶";


        image.appendChild(
            type
        );

        image.appendChild(
            play
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


        info.appendChild(
            title
        );

        info.appendChild(
            description
        );


        card.appendChild(
            image
        );

        card.appendChild(
            info
        );


        container.appendChild(
            card
        );


        card.addEventListener(
            "click",
            function () {

                openMedia(
                    item.media_url
                );

            }
        );

    });
}


/* =========================================================
   DISPLAY MUSIC
   ========================================================= */

function displayMusic(content) {

    const music =
        content.filter(function (item) {

            return (
                item.content_type
                    ?.toLowerCase()
                    === "music"
            );

        });

    if (music.length === 0) {
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


    const albumArt =
        feature.querySelector(
            ".album-art"
        );


    if (
        albumArt &&
        item.thumbnail_url
    ) {

        albumArt.style.backgroundImage =
            "url('" +
            item.thumbnail_url +
            "')";

        albumArt.style.backgroundSize =
            "cover";

        albumArt.style.backgroundPosition =
            "center";

    }


    const button =
        feature.querySelector(
            ".big-play"
        );


    if (button) {

        button.addEventListener(
            "click",
            function () {

                openMedia(
                    item.media_url
                );

            }
        );

    }
}


/* =========================================================
   DISPLAY PODCASTS
   ========================================================= */

function displayPodcasts(content) {

    const podcasts =
        content.filter(function (item) {

            return (
                item.content_type
                    ?.toLowerCase()
                    === "podcast"
            );

        });


    if (podcasts.length === 0) {
        return;
    }


    const container =
        document.querySelector(
            ".podcast-grid"
        );

    if (!container) {
        return;
    }


    container.innerHTML = "";


    podcasts.forEach(function (item) {

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

        button.textContent =
            "▶ PLAY";


        card.appendChild(
            label
        );

        card.appendChild(
            title
        );

        card.appendChild(
            description
        );

        card.appendChild(
            button
        );


        container.appendChild(
            card
        );


        button.addEventListener(
            "click",
            function () {

                openMedia(
                    item.media_url
                );

            }
        );

    });
}


/* =========================================================
   DISPLAY ARTICLES
   ========================================================= */

function displayArticles(content) {

    const articles =
        content.filter(function (item) {

            return (
                item.content_type
                    ?.toLowerCase()
                    === "article"
            );

        });


    if (articles.length === 0) {
        return;
    }


    const container =
        document.querySelector(
            ".article-grid"
        );

    if (!container) {
        return;
    }


    container.innerHTML = "";


    articles.forEach(function (item) {

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


        article.appendChild(
            category
        );

        article.appendChild(
            title
        );

        article.appendChild(
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
                function (event) {

                    event.preventDefault();

                    alert(
                        item.article_body
                    );

                }
            );


            article.appendChild(
                link
            );

        }


        container.appendChild(
            article
        );

    });
}


/* =========================================================
   DISPLAY PHOTOGRAPHS
   ========================================================= */

function displayPhotos(content) {

    const photos =
        content.filter(function (item) {

            return (
                item.content_type
                    ?.toLowerCase()
                    === "photo"
            );

        });


    if (photos.length === 0) {
        return;
    }


    const container =
        document.querySelector(
            ".photo-grid"
        );

    if (!container) {
        return;
    }


    container.innerHTML = "";


    photos.forEach(function (item) {

        const photo =
            document.createElement(
                "div"
            );

        photo.className =
            "photo";


        if (item.thumbnail_url) {

            photo.style.backgroundImage =
                "url('" +
                item.thumbnail_url +
                "')";

            photo.style.backgroundSize =
                "cover";

            photo.style.backgroundPosition =
                "center";

        }


        photo.title =
            item.title ||
            "MGodwill+ Photograph";


        container.appendChild(
            photo
        );

    });
}


/* =========================================================
   OPEN MEDIA
   ========================================================= */

function openMedia(url) {

    if (!url) {

        console.log(
            "This content does not have a media URL yet."
        );

        return;
    }

    window.open(
        url,
        "_blank"
    );
}
