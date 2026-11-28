const navigation = document.querySelector(".nav");

if (navigation) {
    const sourceLinks = navigation.querySelector(".navlinks");
    const baseLinks = [...sourceLinks.querySelectorAll("a")];
    const inPages = location.pathname.includes("/pages/");
    const prefix = inPages ? "" : "pages/";
    const home = inPages ? "../index.html" : "index.html";
    const directions = [
        ["Лечение зубов", "Кариес, восстановление, каналы", "services.html#therapy"],
        ["Детская стоматология", "Приём и лечение молочных зубов", "children-dentistry.html"],
        ["Гигиена и профилактика", "Чистка, защита эмали", "dental-hygiene.html"],
        ["Исправление прикуса", "Брекеты и ортодонтический приём", "orthodontics.html"],
        ["Имплантация", "Восстановление отсутствующих зубов", "implantation.html"],
        ["Протезирование", "Коронки и съёмные конструкции", "prosthetics.html"],
        ["Хирургия", "Удаление зубов и другие процедуры", "oral-surgery.html"],
        ["Лечение дёсен", "Пародонтологические процедуры", "gum-treatment.html"],
        ["Эстетика зубов", "Виниры и отбеливание", "dental-aesthetics.html"],
        ["Приём и диагностика", "Консультации и снимки", "dental-diagnostics.html"]
    ];
    const clinicLinks = [
        ["О клинике", "Пространство и фотографии", "clinic.html"],
        ["Первый визит", "Как подготовиться к приёму", "first-visit.html"],
        ["Лицензия и реквизиты", "Документы клиники", "clinic.html#licenses"],
        ["Контакты и маршрут", "Адрес и часы работы", "contact.html"]
    ];
    const button = document.createElement("button");
    button.className = "mobile-menu-button";
    button.type = "button";
    button.setAttribute("aria-controls", "mobile-navigation");
    button.innerHTML = '<span class="mobile-menu-icon" aria-hidden="true"><span></span><span></span><span></span></span>';
    const menu = document.createElement("nav");
    menu.className = "mobile-menu";
    menu.id = "mobile-navigation";
    menu.setAttribute("aria-label", "Разделы сайта");
    const homeLink = document.createElement("a");
    homeLink.href = home;
    homeLink.textContent = "Главная";
    menu.append(homeLink, ...baseLinks.map(link => link.cloneNode(true)));

    const mobileDirections = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = "Направления услуг";
    mobileDirections.append(summary);
    const mobileDirectionList = document.createElement("div");
    mobileDirectionList.className = "mobile-directions";
    for (const [name, , destination] of directions) {
        const link = document.createElement("a");
        link.href = prefix + destination;
        link.textContent = name;
        mobileDirectionList.append(link);
    }
    mobileDirections.append(mobileDirectionList);
    menu.append(mobileDirections);

    const panels = [];
    const hoverPointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    let openTimer = 0;
    let closeTimer = 0;

    function cancelMenuTimers() {
        clearTimeout(openTimer);
        clearTimeout(closeTimer);
    }

    const surfaceMotion = new WeakMap();
    const reducedNavigationMotion = matchMedia('(prefers-reduced-motion: reduce)');

    function revealSurface(surface, open, animate = true) {
        const previous = surfaceMotion.get(surface);
        if (previous?.open === open) {
            if (!animate || reducedNavigationMotion.matches) {
                previous.animation?.cancel();
                previous.animation = null;
                surface.hidden = !open;
                surface.inert = !open;
                surface.setAttribute('aria-hidden', String(!open));
            }
            return;
        }
        const showing = !surface.hidden;
        if (!showing && !open) {
            surface.inert = true;
            surface.setAttribute('aria-hidden', 'true');
            surfaceMotion.set(surface, { open: false, animation: null });
            return;
        }
        const computed = showing ? getComputedStyle(surface) : null;
        const isDesktop = surface.classList.contains('mega-menu');
        const closedTransform = isDesktop ? 'translate(-50%, -3px)' : 'translateY(-3px)';
        const openedTransform = isDesktop ? 'translateX(-50%)' : 'translateY(0)';
        const opacity = computed?.opacity || '0';
        const transform = computed?.transform === 'none' ? openedTransform : computed?.transform;
        previous?.animation?.cancel();
        surface.hidden = false;
        surface.inert = !open;
        surface.setAttribute('aria-hidden', String(!open));
        const state = { open, animation: null };
        surfaceMotion.set(surface, state);
        if (!animate || reducedNavigationMotion.matches) {
            surface.hidden = !open;
            return;
        }
        state.animation = surface.animate([
            { opacity: showing ? opacity : 0, transform: showing ? (transform || openedTransform) : closedTransform },
            { opacity: open ? 1 : 0, transform: open ? openedTransform : closedTransform }
        ], { duration: open ? 240 : 180, easing: 'cubic-bezier(.25, .8, .25, 1)', fill: 'both' });
        state.animation.onfinish = () => {
            if (surfaceMotion.get(surface) !== state) return;
            surface.hidden = !open;
            state.animation.cancel();
            state.animation = null;
        };
    }

    function openPanel(toggle, panel, moveFocus = false, animate = true) {
        cancelMenuTimers();
        closePanels(false, animate, panel);
        revealSurface(panel, true, animate);
        toggle.setAttribute('aria-expanded', 'true');
        navigation.classList.add('nav--menu-open');
        if (moveFocus) panel.querySelector('a').focus({ preventScroll: true });
    }

    function scheduleClose() {
        clearTimeout(openTimer);
        clearTimeout(closeTimer);
        closeTimer = setTimeout(() => {
            // Переход указателя из шапки в панель не прерывает работу клавиатурой.
            if (!panels.some(({ panel }) => !panel.hidden && panel.contains(document.activeElement))) closePanels();
        }, 140);
    }
    function closePanels(returnFocus = false, animate = true, except = null) {
        cancelMenuTimers();
        for (const { toggle, panel } of panels) {
            if (panel === except) continue;
            if (toggle.getAttribute('aria-expanded') === 'true' && returnFocus) toggle.focus({ preventScroll: true });
            revealSurface(panel, false, animate);
            toggle.setAttribute("aria-expanded", "false");
        }
        navigation.classList.remove("nav--menu-open");
    }
    for (const [index, entries, title] of [[0, directions, "Услуги для всей семьи"], [2, clinicLinks, "Клиника и первый визит"]]) {
        const link = baseLinks[index];
        const group = document.createElement("div");
        group.className = "nav-item";
        link.before(group);
        group.append(link);
        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "nav-expand";
        toggle.setAttribute("aria-label", "Раскрыть раздел: " + link.textContent.trim());
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-controls", "navigation-panel-" + index);
        group.append(toggle);
        const panel = document.createElement("nav");
        panel.id = "navigation-panel-" + index;
        panel.className = "mega-menu";
        panel.setAttribute("aria-label", title);
        panel.hidden = true;
        const heading = document.createElement("div");
        heading.className = "mega-menu-heading";
        const name = document.createElement("strong");
        name.textContent = title;
        const all = link.cloneNode(true);
        all.textContent = index === 0 ? "Все услуги" : "О клинике";
        heading.append(name, all);
        const list = document.createElement("div");
        list.className = "mega-menu-links";
        for (const [label, description, destination] of entries) {
            const item = document.createElement("a");
            item.href = prefix + destination;
            const strong = document.createElement("strong");
            strong.textContent = label;
            const detail = document.createElement("span");
            detail.textContent = description;
            item.append(strong, detail);
            list.append(item);
        }
        panel.append(heading, list);
        if (index === 0) {
            const help = document.createElement("a");
            help.className = "mega-menu-help";
            help.href = "tel:+74991853333";
            help.innerHTML = "<strong>Не знаете название услуги?</strong><span>Расскажите администратору, что беспокоит. Начать можно с вопроса о консультации.</span>";
            panel.append(help);
        }
        document.body.append(panel);
        panels.push({ toggle, panel });
        panel.classList.toggle("mega-menu--clinic", index === 2);
        toggle.addEventListener("click", event => {
            if (toggle.getAttribute('aria-expanded') !== 'true') openPanel(toggle, panel, true, event.detail > 0);
            else closePanels(false, event.detail > 0);
        });
        group.addEventListener('pointerenter', event => {
            if (!hoverPointer.matches || event.pointerType === 'touch') return;
            cancelMenuTimers();
            openTimer = setTimeout(() => openPanel(toggle, panel), 80);
        });
        group.addEventListener('pointerleave', event => {
            if (event.pointerType !== 'touch' && hoverPointer.matches) scheduleClose();
        });
        panel.addEventListener('pointerenter', cancelMenuTimers);
        panel.addEventListener('pointerleave', event => {
            if (event.pointerType !== 'touch' && hoverPointer.matches) scheduleClose();
        });
        toggle.addEventListener("keydown", event => {
            if (event.key === "ArrowDown") {
                event.preventDefault();
                if (toggle.getAttribute('aria-expanded') !== 'true') toggle.click();
                else panel.querySelector("a").focus({ preventScroll: true });
            }
        });
        panel.addEventListener("keydown", event => {
            if (event.key !== "Tab") return;
            const controls = [...panel.querySelectorAll("a")];
            if (event.shiftKey && document.activeElement === controls[0]) {
                event.preventDefault();
                closePanels(false, false);
                toggle.focus();
            } else if (!event.shiftKey && document.activeElement === controls.at(-1)) {
                event.preventDefault();
                closePanels(false, false);
                const headerControls = [...navigation.querySelectorAll("a, button")];
                (headerControls[headerControls.indexOf(toggle) + 1] || toggle).focus();
            }
        });
    }

    function setMenu(open, animate = true) {
        button.setAttribute("aria-expanded", String(open));
        button.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
        revealSurface(menu, open, animate);
        if (open) closePanels();
    }
    setMenu(false, false);
    navigation.after(button, menu);
    navigation.classList.add("nav--enhanced");
    button.addEventListener("click", event => setMenu(button.getAttribute("aria-expanded") !== "true", event.detail > 0));
    menu.addEventListener("click", event => {
        if (event.target.closest("a")) setMenu(false);
    });
    document.addEventListener("click", event => {
        if (!menu.hidden && !button.contains(event.target) && !menu.contains(event.target)) setMenu(false);
        if (!panels.some(({ toggle, panel }) => toggle.contains(event.target) || panel.contains(event.target))) closePanels();
    });
    document.addEventListener("keydown", event => {
        if (event.key !== "Escape") return;
        closePanels(true, false);
        if (!menu.hidden) {
            setMenu(false, false);
            button.focus({ preventScroll: true });
        }
    });
    document.addEventListener("focusin", event => {
        if (!menu.hidden && event.target !== button && !menu.contains(event.target)) setMenu(false, false);
        if (!navigation.contains(event.target) && !panels.some(({ panel }) => panel.contains(event.target))) closePanels(false, false);
    });
    window.matchMedia("(max-width: 650px)").addEventListener("change", () => {
        closePanels(false, false);
        setMenu(false, false);
    });

    const page = location.pathname.split("/").pop() || "index.html";
    const activePage = document.querySelector("[data-service-detail]") ? "services.html" : page;
    for (const link of [...baseLinks, ...menu.querySelectorAll("a")]) {
        const destination = new URL(link.href).pathname.split("/").pop() || "index.html";
        if (destination === activePage) link.setAttribute("aria-current", activePage === page ? "page" : "location");
        else link.removeAttribute("aria-current");
    }

    const darkSections = [...document.querySelectorAll("#service-steps")];
    let surfaceFrame = 0;
    function protectNavigationContrast() {
        surfaceFrame = 0;
        const bounds = navigation.getBoundingClientRect();
        const needsSurface = darkSections.some(section => {
            const sectionBounds = section.getBoundingClientRect();
            return sectionBounds.top < bounds.bottom + 80 && sectionBounds.bottom > bounds.top - 80;
        });
        navigation.classList.toggle("nav--surface-protected", needsSurface);
    }
    if (darkSections.length) {
        window.addEventListener("scroll", () => {
            if (!surfaceFrame) surfaceFrame = requestAnimationFrame(protectNavigationContrast);
        }, { passive: true });
    }
    function updateNavigationSize() {
        document.documentElement.style.setProperty("--site-nav-bottom", Math.ceil(navigation.getBoundingClientRect().bottom) + "px");
        protectNavigationContrast();
    }
    if ("ResizeObserver" in window) new ResizeObserver(updateNavigationSize).observe(navigation);
    window.addEventListener("resize", updateNavigationSize);
    updateNavigationSize();

    const hero = navigation.closest(".hero");
    if (hero) {
        let frame = 0;
        function updateHeroNavigation() {
            frame = 0;
            const heroBottom = hero.getBoundingClientRect().bottom;
            const bounds = navigation.getBoundingClientRect();
            navigation.classList.toggle("nav--on-light", hero.classList.contains("hero--family") || heroBottom <= bounds.top + bounds.height / 2);
        }
        window.addEventListener("scroll", () => {
            if (!frame) frame = requestAnimationFrame(updateHeroNavigation);
        }, { passive: true });
        window.addEventListener("resize", updateHeroNavigation);
        updateHeroNavigation();
    }
}

// События доступны подключённой системе аналитики через dataLayer.
function trackPatientAction(name, properties = {}) {
    window.dataLayer ??= [];
    window.dataLayer.push({ event: name, ...properties });
}
document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link) return;
    if (link.protocol === "tel:") {
        trackPatientAction("clinic_call_click", { page: location.pathname });
    } else if (/doctors\.html/.test(link.pathname)) {
        trackPatientAction("clinic_doctor_view", { doctor: link.hash.slice(1) });
    } else if (/first-visit\.html/.test(link.pathname)) {
        trackPatientAction("clinic_first_visit_view");
    }
});
document.addEventListener("clinic-search-empty", () => trackPatientAction("clinic_search_empty"));
