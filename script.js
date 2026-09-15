/* =========================================================
   MGODWILL+ STUDIO
   INTERACTION SYSTEM — v0.2
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const loader = document.getElementById("loader");
    const website = document.getElementById("website");
    const navbar = document.querySelector(".navbar");


    /* =====================================================
       CINEMATIC INTRO
       ===================================================== */

    document.body.style.overflow = "hidden";

    setTimeout(function () {

        if (!loader || !website) return;

        loader.style.opacity = "0";
        loader.style.visibility = "hidden";

        website.style.opacity = "1";

        document.body.style.overflow = "";

    }, 2200);


    /* =====================================================
       NAVIGATION
       ===================================================== */

    const navigationLinks =
        document.querySelectorAll('a[href^="#"]');

    navigationLinks.forEach(function (link) {

        link.addEventListener("click", function (event) {

            const targetId =
                link.getAttribute("href");

            if (!targetId || targetId === "#") {
                return;
            }

            const target =
                document.querySelector(targetId);

            if (target) {

                event.preventDefault();

                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }

        });

    });


    /* =====================================================
       NAVBAR TRANSFORMATION
       ===================================================== */

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

    window.addEventListener("scroll", updateNavbar);

    updateNavbar();


    /* =====================================================
       VIDEO CARD INTERACTION
       ===================================================== */

    const mediaCards =
        document.querySelectorAll(".media-card");

    mediaCards.forEach(function (card) {

        card.addEventListener("click", function () {

            const title =
                card.querySelector("h3");

            if (title) {
                console.log(
                    "MGodwill+ selection:",
                    title.textContent
                );
            }

        });

    });


    /* =====================================================
       MUSIC PLAYER
       ===================================================== */

    const musicButton =
        document.querySelector(".big-play");

    let musicPlaying = false;

    if (musicButton) {

        musicButton.addEventListener("click", function () {

            musicPlaying = !musicPlaying;

            if (musicPlaying) {

                musicButton.textContent = "❚❚";

            } else {

                musicButton.textContent = "▶";

            }

        });

    }


    /* =====================================================
       PODCAST BUTTONS
       ===================================================== */

    const podcastButtons =
        document.querySelectorAll(".podcast-play");

    podcastButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            const card =
                button.closest(".podcast-card");

            const title =
                card ? card.querySelector("h3") : null;

            if (title) {

                console.log(
                    "Podcast selected:",
                    title.textContent
                );

            }

        });

    });


    /* =====================================================
       HERO PARALLAX
       ===================================================== */

    const heroImage =
        document.querySelector(".hero-image");

    window.addEventListener("scroll", function () {

        if (!heroImage) return;

        const scroll =
            Math.min(window.scrollY, 600);

        heroImage.style.transform =
            "scale(1.04) translateY(" +
            scroll * 0.08 +
            "px)";

    });


    /* =====================================================
       CARD PRESS FEEDBACK
       ===================================================== */

    const interactiveElements =
        document.querySelectorAll(
            ".media-card, .podcast-card, .article-card, .watch-button, .more-button, .login-button"
        );

    interactiveElements.forEach(function (element) {

        element.addEventListener(
            "touchstart",
            function () {
                element.style.transform =
                    "scale(.98)";
            },
            { passive: true }
        );

        element.addEventListener(
            "touchend",
            function () {
                element.style.transform =
                    "";
            },
            { passive: true }
        );

    });

});
