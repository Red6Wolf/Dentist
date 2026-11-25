// Клавиатура и reduced motion открывают биографию сразу.
const doctorDisclosures = document.querySelectorAll(".profile-details");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

for (const details of doctorDisclosures) {
    const summary = details.querySelector("summary");
    let activeAnimation = null;
    let desiredOpen = details.open;

    function settle(open) {
        activeAnimation?.cancel();
        activeAnimation = null;
        details.open = open;
        details.classList.remove("is-closing");
        details.style.height = "";
        details.style.overflow = "";
    }

    summary.addEventListener("click", (event) => {
        event.preventDefault();
        desiredOpen = !(activeAnimation ? desiredOpen : details.open);

        if (!event.detail || prefersReducedMotion.matches || typeof details.animate !== "function") {
            settle(desiredOpen);
            return;
        }

        const startHeight = details.getBoundingClientRect().height;
        activeAnimation?.cancel();
        details.open = true;
        details.classList.toggle("is-closing", !desiredOpen);
        details.style.overflow = "hidden";
        const borderHeight = details.offsetHeight - details.clientHeight;
        const endHeight = (desiredOpen ? details.scrollHeight : summary.offsetHeight) + borderHeight;

        activeAnimation = details.animate(
            [{ height: startHeight + "px" }, { height: endHeight + "px" }],
            { duration: 200, easing: "cubic-bezier(.23, 1, .32, 1)" }
        );
        activeAnimation.onfinish = () => settle(desiredOpen);
    });

    prefersReducedMotion.addEventListener("change", () => {
        if (activeAnimation && prefersReducedMotion.matches) settle(desiredOpen);
    });
}
