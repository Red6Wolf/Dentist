// Смена направлений в большой карточке услуг на главной странице.
// Без JavaScript первая карточка остаётся доступной как обычная ссылка.

const featureSlider = document.querySelector(".feature-slider");

if (featureSlider) {
    const slides = [...featureSlider.querySelectorAll(".feature-slide")];
    const counter = featureSlider.querySelector(".feature-counter");
    const previousButton = featureSlider.querySelector('[data-slide-direction="previous"]');
    const nextButton = featureSlider.querySelector('[data-slide-direction="next"]');
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    let activeIndex = 0;
    let isVisible = false;
    let isHovered = false;
    let hasFocus = false;

    function showSlide(nextIndex, direction) {
        const incomingSlide = slides[nextIndex];
        const outgoingSlide = slides[activeIndex];

        if (incomingSlide === outgoingSlide) return;

        incomingSlide.classList.remove("is-active", "is-before");
        incomingSlide.classList.toggle("is-before", direction < 0);

        // Фиксируем начальную сторону перед запуском CSS-перехода.
        incomingSlide.getBoundingClientRect();

        outgoingSlide.classList.remove("is-active");
        outgoingSlide.classList.toggle("is-before", direction > 0);
        outgoingSlide.setAttribute("aria-hidden", "true");
        outgoingSlide.tabIndex = -1;

        incomingSlide.classList.remove("is-before");
        incomingSlide.classList.add("is-active");
        incomingSlide.setAttribute("aria-hidden", "false");
        incomingSlide.removeAttribute("tabindex");

        activeIndex = nextIndex;
        counter.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
    }

    function moveSlide(direction) {
        const nextIndex = (activeIndex + direction + slides.length) % slides.length;
        showSlide(nextIndex, direction);
    }

    previousButton.addEventListener("click", () => moveSlide(-1));
    nextButton.addEventListener("click", () => moveSlide(1));

    featureSlider.addEventListener("pointerenter", () => {
        isHovered = true;
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
            moveSlide(1);
        }
    }, 6500);

    featureSlider.classList.add("is-ready");
}
