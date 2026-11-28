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
    document.addEventListener("clinic-audience-change", () => {
        active = 0;
        showSlide(0);
        scheduleAutoplay();
    });

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

// Выбор аудитории согласован с содержанием главной и историей браузера.
const familyHero = document.querySelector(".hero--family");
if (familyHero) {
    const audienceSwitch = familyHero.querySelector(".audience-switch");
    const buttons = [...audienceSwitch.querySelectorAll("button")];
    const title = familyHero.querySelector("[data-audience-title]");
    const description = familyHero.querySelector("[data-audience-description]");
    const image = familyHero.querySelector("[data-audience-image]");
    const serviceLink = familyHero.querySelector("[data-audience-services]");
    const priceLink = familyHero.querySelector("[data-audience-prices]");
    const scenes = {
        adult: {
            title: "Стоматология", audienceLine: "для взрослых.", emphasis: "Рядом с вами.",
            description: "Лечение, гигиена и восстановление зубов. План и стоимость обсудите с врачом.",
            image: "assets/clinic/hero-adult-v3.webp", width: 1672, height: 941,
            alt: "Сюжетная иллюстрация: пациентка беседует со стоматологом",
            link: "pages/services.html?audience=adult", linkText: "Услуги для взрослых",
            prices: "pages/prices.html"
        },
        child: {
            title: "Стоматология", audienceLine: "для детей.", emphasis: "Рядом с вами.",
            description: "Осмотр, профилактика и лечение молочных зубов. Возраст приёма уточните при записи.",
            image: "assets/clinic/hero-child-v3.webp", width: 1672, height: 941,
            alt: "Сюжетная иллюстрация: ребёнок с мамой знакомится со стоматологом",
            link: "pages/services.html?audience=child", linkText: "Услуги для детей",
            prices: "pages/prices.html?direction=children"
        }
    };
    let descriptionMeasure = '';
    function alignAudienceDescriptions() {
        const width = description.getBoundingClientRect().width;
        const key = width + '|' + getComputedStyle(description).font;
        if (!width || key === descriptionMeasure) return;
        descriptionMeasure = key;
        const probe = description.cloneNode(false);
        probe.removeAttribute('data-audience-description');
        Object.assign(probe.style, {
            position: 'absolute',
            visibility: 'hidden',
            width: width + 'px',
            minHeight: '0',
            height: 'auto',
            pointerEvents: 'none'
        });
        description.after(probe);
        let height = 0;
        for (const scene of Object.values(scenes)) {
            probe.textContent = scene.description;
            height = Math.max(height, probe.getBoundingClientRect().height);
        }
        probe.remove();
        description.style.minHeight = Math.ceil(height) + 'px';
    }
    document.fonts.ready.then(() => {
        descriptionMeasure = '';
        alignAudienceDescriptions();
    });
    if ('ResizeObserver' in window) new ResizeObserver(alignAudienceDescriptions).observe(familyHero);
    let audienceAnimation = [];
    function showAudience(audience, updateAddress = false, animate = false) {
        const enteringOpacity = audienceAnimation.some(animation => animation.playState === 'running')
            ? getComputedStyle(title).opacity
            : .4;
        for (const animation of audienceAnimation) animation.cancel();
        audienceAnimation = [];
        const key = audience === "child" ? "child" : "adult";
        const scene = scenes[key];
        familyHero.dataset.audience = key;
        window.updateHomeAudience?.(key);
        buttons.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.audience === key)));
        const emphasis = document.createElement("span");
        emphasis.textContent = scene.emphasis;
        title.replaceChildren(document.createTextNode(scene.title), document.createElement("br"), document.createTextNode(scene.audienceLine), document.createElement("br"), emphasis);
        description.textContent = scene.description;
        alignAudienceDescriptions();
        image.src = scene.image;
        image.width = scene.width;
        image.height = scene.height;
        image.alt = scene.alt;
        serviceLink.href = scene.link;
        serviceLink.firstChild.textContent = scene.linkText + " ";
        priceLink.href = scene.prices;
        if (animate && !reducedMotion.matches) {
            for (const element of [title, description, image]) {
                audienceAnimation.push(element.animate(
                    [{ opacity: enteringOpacity }, { opacity: 1 }],
                    { duration: 220, easing: "cubic-bezier(.23, 1, .32, 1)" }
                ));
            }
        }
        if (updateAddress) {
            const url = new URL(location.href);
            url.searchParams.set("audience", key);
            history.pushState({ audience: key }, "", url);
            window.dataLayer ??= [];
            window.dataLayer.push({ event: "clinic_audience_select", audience: key });
        }
    }
    for (const scene of Object.values(scenes)) {
        const preload = new Image();
        preload.src = scene.image;
    }
    audienceSwitch.hidden = false;
    buttons.forEach(button => button.addEventListener("click", event => {
        if (button.getAttribute("aria-pressed") !== "true") showAudience(button.dataset.audience, true, event.detail > 0);
    }));
    const readAddress = () => showAudience(new URLSearchParams(location.search).get("audience"));
    window.addEventListener("popstate", readAddress);
    readAddress();
}
