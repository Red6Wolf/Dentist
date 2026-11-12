// Ненавязчивое появление секций при прокрутке, как в референсе Caliora.
// При отключённом JS или reduced motion контент остаётся видимым.
const revealSections = document.querySelectorAll(".reveal-on-scroll, .subpage-section");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if ("IntersectionObserver" in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.remove("reveal-pending");
            entry.target.classList.add("reveal-visible");
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.12 });

    revealSections.forEach((section) => {
        section.classList.add("reveal-pending");
        revealObserver.observe(section);
    });
}
