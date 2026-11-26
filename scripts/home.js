const slider = document.querySelector(".feature-slider");
const orange = document.querySelector(".orange-wrap");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (slider) {
    const slides = [...slider.querySelectorAll(".feature-slide")];
    const slideMotion = { duration: 420, easing: "cubic-bezier(.23, 1, .32, 1)" };
    let active = 0;
    let timer = 0;
    let pointerOver = false;
    let hasFocus = false;
    let visible = !("IntersectionObserver" in window);
    let runningAnimations = [];

    function showSlide(step, animate = false) {
        const previous = slides[active];
        active = (active + step + slides.length) % slides.length;
        const current = slides[active];

        for (const animation of runningAnimations) animation.cancel();
        runningAnimations = [];
        for (const slide of slides) {
            slide.inert = slide !== current;
            slide.hidden = slide !== current;
        }

        if (animate && typeof current.animate === "function") {
            previous.hidden = false;
            const exit = previous.animate(
                [{ transform: "translateX(0)" }, { transform: "translateX(-100%)" }],
                { ...slideMotion, fill: "forwards" }
            );
            const enter = current.animate(
                [{ transform: "translateX(100%)" }, { transform: "translateX(0)" }],
                slideMotion
            );
            exit.onfinish = () => {
                previous.hidden = true;
                exit.cancel();
                runningAnimations = [];
            };
            runningAnimations = [exit, enter];

        }
    }

    function scheduleAutoplay() {
        window.clearTimeout(timer);
        if (!visible || document.hidden || pointerOver || hasFocus || reducedMotion.matches) return;

        slides[(active + 1) % slides.length].querySelector("img").loading = "eager";
        timer = window.setTimeout(() => {
            showSlide(1, true);
            scheduleAutoplay();
        }, 5000);
    }

    slider.addEventListener("pointerenter", (event) => {
        if (event.pointerType === "touch") return;
        pointerOver = true;
        scheduleAutoplay();
    });
    slider.addEventListener("pointerleave", () => {
        pointerOver = false;
        scheduleAutoplay();
    });
    slider.addEventListener("focusin", () => {
        hasFocus = true;
        scheduleAutoplay();
    });
    slider.addEventListener("focusout", (event) => {
        hasFocus = slider.contains(event.relatedTarget);
        scheduleAutoplay();
    });
    document.addEventListener("visibilitychange", scheduleAutoplay);

    function updateMotionPreference() {
        if (reducedMotion.matches && runningAnimations.length) showSlide(0);
        scheduleAutoplay();
    }

    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(([entry]) => {
            visible = entry.intersectionRatio >= .35;
            scheduleAutoplay();
        }, { threshold: .35 });
        observer.observe(slider);
    }

    reducedMotion.addEventListener("change", updateMotionPreference);
    updateMotionPreference();
}

if (orange) {
    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(([entry]) => {
            orange.classList.toggle("is-visible", entry.isIntersecting);
        });
        observer.observe(orange);
    } else {
        orange.classList.add("is-visible");
    }
}
