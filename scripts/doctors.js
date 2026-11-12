// Плавное раскрытие биографии врача. Без JavaScript работает обычный <details>.

const doctorDisclosures = document.querySelectorAll(".profile-details");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

doctorDisclosures.forEach((details) => {
    const summary = details.querySelector("summary");
    let desiredOpen = details.open;
    let currentAnimation = null;

    function finishImmediately(open) {
        currentAnimation?.cancel();
        currentAnimation = null;
        details.open = open;
        details.style.height = "";
        details.style.overflow = "";
    }

    summary.addEventListener("click", (event) => {
        event.preventDefault();
        desiredOpen = !desiredOpen;

        if (prefersReducedMotion.matches || typeof details.animate !== "function") {
            finishImmediately(desiredOpen);
            return;
        }

        const startHeight = details.getBoundingClientRect().height;
        currentAnimation?.cancel();

        details.open = true;
        details.style.height = `${startHeight}px`;
        details.style.overflow = "hidden";

        const endHeight = desiredOpen ? details.scrollHeight : summary.offsetHeight;
        const animation = details.animate(
            [
                { height: `${startHeight}px` },
                { height: `${endHeight}px` },
            ],
            {
                duration: desiredOpen ? 380 : 280,
                easing: "cubic-bezier(.16, 1, .3, 1)",
            },
        );

        currentAnimation = animation;
        animation.onfinish = () => {
            if (currentAnimation !== animation) return;
            currentAnimation = null;
            details.open = desiredOpen;
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
