// Плавное раскрытие биографии врача. Без JavaScript работает обычный <details>.

const doctorDisclosures = document.querySelectorAll(".profile-details");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

doctorDisclosures.forEach((details) => {
    const summary = details.querySelector("summary");
    const content = details.querySelector("ul");
    let desiredOpen = details.open;
    let heightAnimation = null;
    let contentAnimation = null;

    function finishImmediately(open) {
        heightAnimation?.cancel();
        contentAnimation?.cancel();
        heightAnimation = null;
        contentAnimation = null;
        details.open = open;
        details.classList.remove("is-closing");
        details.style.height = "";
        details.style.overflow = "";
        content.style.opacity = "";
    }

    summary.addEventListener("click", (event) => {
        event.preventDefault();
        desiredOpen = !desiredOpen;

        if (prefersReducedMotion.matches || typeof details.animate !== "function") {
            finishImmediately(desiredOpen);
            return;
        }

        const startHeight = details.getBoundingClientRect().height;
        heightAnimation?.cancel();
        contentAnimation?.cancel();

        details.open = true;
        details.classList.toggle("is-closing", !desiredOpen);
        details.style.height = `${startHeight}px`;
        details.style.overflow = "hidden";

        const borderHeight = details.offsetHeight - details.clientHeight;
        const endHeight = desiredOpen
            ? details.scrollHeight + borderHeight
            : summary.offsetHeight + borderHeight;

        const animation = details.animate(
            [
                { height: `${startHeight}px` },
                { height: `${endHeight}px` },
            ],
            {
                duration: desiredOpen ? 680 : 480,
                easing: "cubic-bezier(.4, 0, .2, 1)",
            },
        );

        contentAnimation = content.animate(
            desiredOpen
                ? [{ opacity: 0 }, { opacity: 1 }]
                : [{ opacity: 1 }, { opacity: 0 }],
            {
                duration: desiredOpen ? 460 : 240,
                delay: desiredOpen ? 150 : 0,
                easing: "ease-out",
                fill: "forwards",
            },
        );

        heightAnimation = animation;
        animation.onfinish = () => {
            if (heightAnimation !== animation) return;
            heightAnimation = null;
            contentAnimation?.cancel();
            contentAnimation = null;
            details.open = desiredOpen;
            details.classList.remove("is-closing");
            details.style.height = "";
            details.style.overflow = "";
        };
    });

    prefersReducedMotion.addEventListener("change", () => {
        if (prefersReducedMotion.matches) {
            finishImmediately(desiredOpen);
        }
    });
});
