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

document.querySelectorAll(".choice-set").forEach((group) => {
    group.addEventListener("click", (event) => {
        const button = event.target.closest(".choice");
        if (!button) return;

        const wasPressed = button.getAttribute("aria-pressed") === "true";
        group.querySelectorAll(".choice").forEach((item) => {
            item.setAttribute(
                "aria-pressed",
                String(item === button && !wasPressed),
            );
        });

        const selected = [
            ...document.querySelectorAll('.choice[aria-pressed="true"]'),
        ].map((item) => item.textContent.trim());

        const copy = document.getElementById("call-copy");
        if (!copy) return;
        copy.textContent = selected.length
            ? `Вы выбрали: ${selected.join(" · ")}. Позвоните администратору, чтобы подобрать время.`
            : "Выберите направление и время — подскажем, что сказать администратору.";
    });
});
