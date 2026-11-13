// Плавающее мобильное меню доступно на любой высоте страницы.
const navigation = document.querySelector(".nav");

if (navigation) {
    const sourceLinks = navigation.querySelector(".navlinks");
    const button = document.createElement("button");
    const menu = document.createElement("div");

    button.className = "mobile-menu-button";
    button.type = "button";
    button.setAttribute("aria-label", "Открыть меню");
    button.setAttribute("aria-expanded", "false");
    button.innerHTML = '<span class="mobile-menu-icon" aria-hidden="true"><span></span><span></span><span></span></span>';

    menu.className = "mobile-menu";
    menu.id = "mobile-navigation";
    menu.setAttribute("aria-label", "Разделы сайта");
    menu.innerHTML = sourceLinks.innerHTML;
    button.setAttribute("aria-controls", menu.id);

    document.body.append(button, menu);
    navigation.classList.add("nav--enhanced");

    function closeMenu() {
        button.setAttribute("aria-expanded", "false");
        button.setAttribute("aria-label", "Открыть меню");
        menu.classList.remove("is-open");
    }

    button.addEventListener("click", () => {
        const isOpen = menu.classList.toggle("is-open");
        button.setAttribute("aria-expanded", String(isOpen));
        button.setAttribute("aria-label", isOpen ? "Закрыть меню" : "Открыть меню");
    });

    menu.addEventListener("click", closeMenu);
    document.addEventListener("click", (event) => {
        if (!menu.contains(event.target) && event.target !== button && !button.contains(event.target)) {
            closeMenu();
        }
    });
    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape" || !menu.classList.contains("is-open")) return;
        closeMenu();
        button.focus();
    });
}
