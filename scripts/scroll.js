// Смягчаем вертикальную прокрутку колесом мыши на настольных устройствах.
// Системная прокрутка остаётся доступной при уменьшенном движении и на телефонах.
const desktopPointer = window.matchMedia("(hover: hover) and (pointer: fine)");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let scrollTarget = window.scrollY;
let scrollFrame = 0;

function hasScrollableParent(element) {
    for (
        let parent = element instanceof Element ? element : null;
        parent && parent !== document.body;
        parent = parent.parentElement
    ) {
        const overflow = window.getComputedStyle(parent).overflowY;

        if (
            (overflow === "auto" || overflow === "scroll") &&
            parent.scrollHeight > parent.clientHeight
        ) {
            return true;
        }
    }

    return false;
}

function animateScroll() {
    if (document.querySelector("dialog[open]")) {
        scrollFrame = 0;
        scrollTarget = window.scrollY;
        return;
    }

    const distance = scrollTarget - window.scrollY;

    if (Math.abs(distance) < 0.5) {
        window.scrollTo({ top: scrollTarget, behavior: "instant" });
        scrollFrame = 0;
        return;
    }

    const frameStep = Math.max(-36, Math.min(36, distance * 0.2));

    window.scrollTo({ top: window.scrollY + frameStep, behavior: "instant" });
    scrollFrame = window.requestAnimationFrame(animateScroll);
}

window.addEventListener("wheel", (event) => {
    if (
        !desktopPointer.matches ||
        reducedMotion.matches ||
        document.querySelector("dialog[open]") ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        Math.abs(event.deltaX) > Math.abs(event.deltaY) ||
        hasScrollableParent(event.target)
    ) {
        return;
    }

    const pageHeight = document.documentElement.scrollHeight - window.innerHeight;

    if (pageHeight <= 0) return;

    const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? 24
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? window.innerHeight
            : 1;
    const step = Math.max(-140, Math.min(140, event.deltaY * unit)) * 0.78;

    event.preventDefault();

    if (!scrollFrame) scrollTarget = window.scrollY;

    scrollTarget = Math.max(0, Math.min(pageHeight, scrollTarget + step));

    if (!scrollFrame) {
        scrollFrame = window.requestAnimationFrame(animateScroll);
    }
}, { passive: false });

// Прерываем инерцию после перехода по якорю или прокрутки клавиатурой.
window.addEventListener("keydown", () => {
    window.cancelAnimationFrame(scrollFrame);
    scrollFrame = 0;
    scrollTarget = window.scrollY;
});

window.addEventListener("hashchange", () => {
    window.cancelAnimationFrame(scrollFrame);
    scrollFrame = 0;
    scrollTarget = window.scrollY;
});
