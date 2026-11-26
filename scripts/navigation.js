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
        const activePage = page.startsWith("price-") ? "prices.html" : page;
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
            if (!mobileLayout.matches) return;
            const heroBottom = hero.getBoundingClientRect().bottom;
            const bounds = navigation.getBoundingClientRect();
            navigation.classList.toggle("nav--on-light", heroBottom <= bounds.top);
            navigation.classList.toggle("nav--hero-edge", heroBottom > bounds.top && heroBottom < bounds.bottom);
        }

        window.addEventListener("scroll", () => {
            if (mobileLayout.matches && !frame) frame = requestAnimationFrame(updateHeroNavigation);
        }, { passive: true });
        window.addEventListener("resize", updateHeroNavigation);
        window.addEventListener("pageshow", updateHeroNavigation);
        updateHeroNavigation();
    }
}
