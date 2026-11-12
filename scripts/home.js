// Смена направлений в большой карточке услуг на главной странице.
// Без JavaScript первая карточка остаётся доступной как обычная ссылка.

const featureSlider = document.querySelector(".feature-slider");

if (featureSlider) {
    const slides = [...featureSlider.querySelectorAll(".feature-slide")];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    let activeIndex = 0;
    let isVisible = false;
    let isHovered = false;
    let hasFocus = false;

    function showNextSlide() {
        const nextIndex = (activeIndex + 1) % slides.length;
        const incomingSlide = slides[nextIndex];
        const outgoingSlide = slides[activeIndex];

        if (incomingSlide === outgoingSlide) return;

        incomingSlide.classList.remove("is-active", "is-before");

        // Фиксируем начальную сторону перед запуском CSS-перехода.
        incomingSlide.getBoundingClientRect();

        outgoingSlide.classList.remove("is-active");
        outgoingSlide.classList.add("is-before");
        outgoingSlide.setAttribute("aria-hidden", "true");
        outgoingSlide.tabIndex = -1;

        incomingSlide.classList.add("is-active");
        incomingSlide.setAttribute("aria-hidden", "false");
        incomingSlide.removeAttribute("tabindex");

        activeIndex = nextIndex;
    }

    featureSlider.addEventListener("pointerenter", (event) => {
        if (event.pointerType === "mouse" || event.pointerType === "pen") {
            isHovered = true;
        }
    });

    featureSlider.addEventListener("pointerleave", () => {
        isHovered = false;
    });

    featureSlider.addEventListener("focusin", () => {
        hasFocus = true;
    });

    featureSlider.addEventListener("focusout", (event) => {
        hasFocus = featureSlider.contains(event.relatedTarget);
    });

    if ("IntersectionObserver" in window) {
        const visibilityObserver = new IntersectionObserver((entries) => {
            isVisible = entries[0].isIntersecting;
        }, { threshold: 0.4 });

        visibilityObserver.observe(featureSlider);
    } else {
        isVisible = true;
    }

    window.setInterval(() => {
        if (
            isVisible &&
            !document.hidden &&
            !isHovered &&
            !hasFocus &&
            !reducedMotion.matches
        ) {
            showNextSlide();
        }
    }, 5000);
}
