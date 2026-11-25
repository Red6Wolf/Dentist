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

    const hero = navigation.closest(".hero");
    if (hero && "IntersectionObserver" in window) {
        const heroObserver = new IntersectionObserver(([entry]) => {
            navigation.classList.toggle("nav--on-light", !entry.isIntersecting);
        }, { rootMargin: "-70px 0px 0px" });
        heroObserver.observe(hero);
    }
}
