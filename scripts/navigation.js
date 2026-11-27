const navigation = document.querySelector(".nav");

if (navigation) {
    const sourceLinks = navigation.querySelector(".navlinks");
    const button = document.createElement("button");
    const menu = document.createElement("nav");
    const mobileLayout = window.matchMedia("(max-width: 650px)");

    button.className = "mobile-menu-button";
    button.type = "button";
    button.setAttribute("aria-controls", "mobile-navigation");
    button.innerHTML = '<span class="mobile-menu-icon" aria-hidden="true"><span></span><span></span><span></span></span>';

    menu.className = "mobile-menu";
    menu.id = "mobile-navigation";
    menu.setAttribute("aria-label", "Разделы сайта");
    for (const link of sourceLinks.children) {
        menu.append(link.cloneNode(true));
    }
    const homeLink = document.createElement("a");
    homeLink.href = navigation.querySelector(".brand").href;
    homeLink.textContent = "Главная";
    menu.prepend(homeLink);

    function setMenu(open) {
        button.setAttribute("aria-expanded", String(open));
        button.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
        menu.hidden = !open;
    }

    setMenu(false);
    navigation.after(button, menu);
    navigation.classList.add("nav--enhanced");

    button.addEventListener("click", () => setMenu(menu.hidden));
    menu.addEventListener("click", (event) => {
        if (event.target.closest("a")) {
            setMenu(false);
            button.focus({ preventScroll: true });
        }
    });
    document.addEventListener("focusin", (event) => {
        if (!menu.hidden && event.target !== button && !menu.contains(event.target)) setMenu(false);
    });
    document.addEventListener("click", (event) => {
        if (!menu.hidden && !button.contains(event.target) && !menu.contains(event.target)) setMenu(false);
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !menu.hidden) {
            setMenu(false);
            button.focus({ preventScroll: true });
        }
    });
    mobileLayout.addEventListener("change", () => setMenu(false));

    const navigationLinks = [...sourceLinks.children, ...menu.children];

    function markCurrentPage() {
        const page = location.pathname.split("/").pop() || "index.html";
        const activePage = page.startsWith("price-") ? "prices.html"
            : document.querySelector("[data-consultation-note]") ? "services.html" : page;
        for (const link of navigationLinks) {
            const url = new URL(link.href);
            const destination = url.pathname.split("/").pop() || "index.html";
            if (destination === activePage) link.setAttribute("aria-current", activePage === page ? "page" : "location");
            else link.removeAttribute("aria-current");
        }
    }

    markCurrentPage();
    window.addEventListener("hashchange", markCurrentPage);

    const hero = navigation.closest(".hero");
    if (hero) {
        let frame = 0;
        function updateHeroNavigation() {
            frame = 0;
            const heroBottom = hero.getBoundingClientRect().bottom;
            const bounds = navigation.getBoundingClientRect();
            navigation.classList.toggle("nav--on-light", heroBottom <= bounds.top + bounds.height / 2);
        }

        window.addEventListener("scroll", () => {
            if (!frame) frame = requestAnimationFrame(updateHeroNavigation);
        }, { passive: true });
        window.addEventListener("resize", updateHeroNavigation);
        window.addEventListener("pageshow", updateHeroNavigation);
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
