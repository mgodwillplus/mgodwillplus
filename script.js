const SUPABASE_URL =
    "https://oalrbfjmyiotocqdfxaw.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_usTGMseaZHBR4x1XKvAQhQ_OZIc18NX";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


document.addEventListener(
    "DOMContentLoaded",
    function () {

        /* =========================
           LOADER
           ========================= */

        const loader =
            document.getElementById("loader");

        const website =
            document.getElementById("website");

        const navbar =
            document.querySelector(".navbar");

        document.body.style.overflow = "hidden";

        setTimeout(function () {

            if (!loader || !website) return;

            loader.style.opacity = "0";
            loader.style.visibility = "hidden";

            website.style.opacity = "1";

            document.body.style.overflow = "";

        }, 2200);


        /* =========================
           NAVIGATION
           ========================= */

        const navigationLinks =
            document.querySelectorAll(
                'a[href^="#"]'
            );

        navigationLinks.forEach(
            function (link) {

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

                        if (target) {

                            event.preventDefault();

                            target.scrollIntoView({
                                behavior: "smooth",
                                block: "start"
                            });

                        }

                    }
                );

            }
        );


        /* =========================
           NAVBAR
           ========================= */

        function updateNavbar() {

            if (!navbar) return;

            if (window.scrollY > 50) {

                navbar.style.background =
                    "rgba(2, 3, 7, 0.88)";

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


        /* =========================
           LOAD DATABASE CONTENT
           ========================= */

        loadContent();


        /* =========================
           MUSIC BUTTON
           ========================= */

        const musicButton =
            document.querySelector(
                ".big-play"
            );

        let musicPlaying = false;

        if (musicButton) {

            musicButton.addEventListener(
                "click",
                function () {

                    musicPlaying =
                        !musicPlaying;

                    musicButton.textContent =
                        musicPlaying
                            ? "❚❚"
                            : "▶";

                }
            );

        }


        /* =========================
           HERO MOVEMENT
           ========================= */

        const heroImage =
            document.querySelector(
                ".hero-image"
            );

        window.addEventListener(
            "scroll",
            function () {

                if (!heroImage) return;

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
);


/* =====================================
   SUPABASE CONTENT
   ===================================== */

async function loadContent() {

    try {

        const response =
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


        if (response.error) {

            console.error(
                "MGodwill+ database error:",
                response.error
            );

            return;

        }


        console.log(
            "MGodwill+ database connected.",
            response.data
        );


        displayContent(
            response.data
        );


    } catch (error) {

        console.error(
            "MGodwill+ connection error:",
            error
        );

    }

}


/* =====================================
   DISPLAY CONTENT
   ===================================== */

function displayContent(content) {

    if (!content || content.length === 0) {

        console.log(
            "MGodwill+ has no published content yet."
        );

        return;

    }


    const watchContainer =
        document.querySelector(
            ".media-rail"
        );


    if (!watchContainer) return;


    const videos =
        content.filter(function (item) {

            return (
                item.content_type ===
                "video"
            );

        });


    if (videos.length === 0) return;


    watchContainer.innerHTML = "";


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


        image.appendChild(type);
        image.appendChild(play);


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
            item.title;


        const description =
            document.createElement(
                "p"
            );

        description.textContent =
            item.description ||
            "MGodwill+ Original";


        info.appendChild(title);
        info.appendChild(
            description
        );


        card.appendChild(image);
        card.appendChild(info);


        watchContainer.appendChild(
            card
        );


        card.addEventListener(
            "click",
            function () {

                if (item.media_url) {

                    window.open(
                        item.media_url,
                        "_blank"
                    );

                }

            }
        );

    });

}
