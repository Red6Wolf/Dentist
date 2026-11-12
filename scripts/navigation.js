// На телефоне пункты навигации открываются по явному нажатию.
document.querySelectorAll(".nav").forEach((nav) => {
    const links = nav.querySelector(".navlinks");
    const button = document.createElement("button");

    button.className = "nav-menu-button";
    button.type = "button";
    button.textContent = "Меню";
    button.setAttribute("aria-expanded", "false");
    links.id = "main-navigation";
    button.setAttribute("aria-controls", links.id);
    nav.insertBefore(button, nav.querySelector(".navright"));
    nav.classList.add("nav--enhanced");

    function closeMenu() {
        nav.classList.remove("nav--open");
        button.setAttribute("aria-expanded", "false");
    }

    button.addEventListener("click", () => {
        const isOpen = nav.classList.toggle("nav--open");
        button.setAttribute("aria-expanded", String(isOpen));
    });

    links.addEventListener("click", closeMenu);
    document.addEventListener("click", (event) => {
        if (!nav.contains(event.target)) closeMenu();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape" || !nav.classList.contains("nav--open")) return;
        closeMenu();
        button.focus();
    });
});
