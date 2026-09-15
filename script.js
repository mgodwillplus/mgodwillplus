/* =====================================================
   MGODWILL+ STUDIO
   MAIN JAVASCRIPT
===================================================== */


/* =========================
   LOADING SCREEN
========================= */

window.addEventListener("load", function () {

    const loader = document.getElementById("loader");
    const website = document.getElementById("website");

    /*
       Give the cinematic splash screen
       a moment to breathe before revealing
       the actual website.
    */

    setTimeout(function () {

        loader.style.opacity = "0";
        loader.style.visibility = "hidden";

        website.style.opacity = "1";

    }, 1800);

});


/* =========================
   INITIAL WEBSITE STATE
========================= */

document.addEventListener("DOMContentLoaded", function () {

    const website = document.getElementById("website");

    website.style.opacity = "0";

    website.style.transition = "opacity 0.8s ease";

});


/* =========================
   SMOOTH NAVIGATION
========================= */

const navigationLinks =
    document.querySelectorAll(".nav-links a");

navigationLinks.forEach(function (link) {

    link.addEventListener("click", function (event) {

        const destination =
            document.querySelector(
                link.getAttribute("href")
            );

        if (destination) {

            event.preventDefault();

            destination.scrollIntoView({
                behavior: "smooth"
            });

        }

    });

});


/* =========================
   BUTTON FEEDBACK
========================= */

const primaryButton =
    document.querySelector(".primary-button");

if (primaryButton) {

    primaryButton.addEventListener("click", function () {

        console.log(
            "Welcome to MGodwill+ Studio."
        );

    });

}


/* =========================
   CONTENT CARD INTERACTION
========================= */

const contentCards =
    document.querySelectorAll(".content-card");

contentCards.forEach(function (card) {

    card.addEventListener("click", function () {

        console.log(
            "Content selected."
        );

    });

});


/* =========================
   MUSIC PLAYER PLACEHOLDER
========================= */

const musicPlayButton =
    document.querySelector(".big-play");

let musicPlaying = false;

if (musicPlayButton) {

    musicPlayButton.addEventListener(
        "click",
        function () {

            musicPlaying = !musicPlaying;

            if (musicPlaying) {

                musicPlayButton.textContent = "❚❚";

            } else {

                musicPlayButton.textContent = "▶";

            }

        }
    );

}


/* =========================
   PODCAST BUTTON
========================= */

const podcastButton =
    document.querySelector(".podcast-play");

if (podcastButton) {

    podcastButton.addEventListener(
        "click",
        function () {

            console.log(
                "Podcast selected."
            );

        }
    );

}


/* =========================
   SCROLL EFFECT
========================= */

window.addEventListener("scroll", function () {

    const navbar =
        document.querySelector(".navbar");

    if (window.scrollY > 80) {

        navbar.style.background =
            "rgba(2, 5, 12, 0.85)";

        navbar.style.backdropFilter =
            "blur(15px)";

    } else {

        navbar.style.background =
            "transparent";

        navbar.style.backdropFilter =
            "none";

    }

});
