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

// Выбор аудитории меняет содержание первого экрана, не скрывая остальные услуги.
const familyHero = document.querySelector(".hero--family");
if (familyHero) {
    const audienceSwitch = familyHero.querySelector(".audience-switch");
    const buttons = [...audienceSwitch.querySelectorAll("button")];
    const title = familyHero.querySelector("[data-audience-title]");
    const description = familyHero.querySelector("[data-audience-description]");
    const image = familyHero.querySelector("[data-audience-image]");
    const serviceLink = familyHero.querySelector("[data-audience-services]");
    const scenes = {
        adult: {
            title: "Семейная стоматология.", emphasis: "Рядом с вами.",
            description: "Лечение, профилактика и восстановление зубов на Тайнинской. Начните с консультации: обсудите свою задачу, варианты и стоимость.",
            image: "assets/clinic/hero-adult-v2.webp", width: 1536, height: 1024,
            alt: "Сюжетная иллюстрация: пациентка беседует со стоматологом",
            link: "pages/services.html", linkText: "Выбрать услугу"
        },
        child: {
            title: "Детская стоматология.", emphasis: "Начнём со знакомства.",
            description: "Приём, профилактика и лечение молочных зубов. Расскажите администратору возраст ребёнка и повод обращения — уточните специалиста и порядок первого визита.",
            image: "assets/clinic/hero-child-v2.webp", width: 1600, height: 1067,
            alt: "Сюжетная иллюстрация: ребёнок с мамой знакомится со стоматологом",
            link: "pages/children-dentistry.html", linkText: "Услуги для детей"
        }
    };
    function showAudience(audience, updateAddress = false) {
        const key = audience === "child" ? "child" : "adult";
        const scene = scenes[key];
        familyHero.dataset.audience = key;
        buttons.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.audience === key)));
        const emphasis = document.createElement("span");
        emphasis.textContent = scene.emphasis;
        title.replaceChildren(document.createTextNode(scene.title + " "), emphasis);
        description.textContent = scene.description;
        image.src = scene.image;
        image.width = scene.width;
        image.height = scene.height;
        image.alt = scene.alt;
        serviceLink.href = scene.link;
        serviceLink.firstChild.textContent = scene.linkText + " ";
        if (updateAddress) {
            const url = new URL(location.href);
            url.searchParams.set("audience", key);
            history.pushState({ audience: key }, "", url);
            window.dataLayer ??= [];
            window.dataLayer.push({ event: "clinic_audience_select", audience: key });
        }
    }
    audienceSwitch.hidden = false;
    buttons.forEach(button => button.addEventListener("click", () => {
        if (button.getAttribute("aria-pressed") !== "true") showAudience(button.dataset.audience, true);
    }));
    const readAddress = () => showAudience(new URLSearchParams(location.search).get("audience"));
    window.addEventListener("popstate", readAddress);
    readAddress();
}
