const SUPABASE_URL = "https://oalrbfjmyiotocqdfxaw.supabase.co";
const SUPABASE_KEY = "sb_publishable_usTGMseaZHBR4x1XKvAQhQ_OZIc18NX";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

document.addEventListener("DOMContentLoaded", function () {

    const loader = document.getElementById("loader");
    const website = document.getElementById("website");
    const navbar = document.querySelector(".navbar");

    document.body.style.overflow = "hidden";

    setTimeout(function () {
        if (!loader || !website) return;

        loader.style.opacity = "0";
        loader.style.visibility = "hidden";
        website.style.opacity = "1";
        document.body.style.overflow = "";
    }, 2200);

    const navigationLinks =
        document.querySelectorAll('a[href^="#"]');

    navigationLinks.forEach(function (link) {
        link.addEventListener("click", function (event) {

            const targetId = link.getAttribute("href");

            if (!targetId || targetId === "#") return;

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

            navbar.style.backdropFilter = "none";

            navbar.style.webkitBackdropFilter = "none";

            navbar.style.borderBottom =
                "1px solid transparent";
        }
    }

    window.addEventListener("scroll", updateNavbar);

    updateNavbar();


    /* =========================
       LOAD MGODWILL+ CONTENT
       ========================= */

    loadContent();


    /* =========================
       MUSIC BUTTON
       ========================= */

    const musicButton =
        document.querySelector(".big-play");

    let musicPlaying = false;

    if (musicButton) {

        musicButton.addEventListener("click", function () {

            musicPlaying = !musicPlaying;

            musicButton.textContent =
                musicPlaying ? "❚❚" : "▶";
        });
    }


    /* =========================
       HERO PARALLAX
       ========================= */

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

});


/* =====================================
   SUPABASE CONTENT LOADER
   ===================================== */

async function loadContent() {

    try {

        const { data, error } =
            await supabaseClient
                .from("content")
                .select("*")
                .eq("published", true)
                .order("created_at", {
                    ascending: false
                });

        if (error) {

            console.error(
                "MGodwill+ database error:",
                error
            );

            return;
        }

        console.log(
            "MGodwill+ content:",
            data
        );

    } catch (error) {

        console.error(
            "MGodwill+ connection error:",
            error
        );
    }
}
