// Контекст выбранной услуги и навигация по подробной странице.
const servicePage = document.querySelector("[data-service-detail]");

if (servicePage) {
    const heading = servicePage.querySelector("h1");
    const parameters = new URLSearchParams(location.search);
    const candidate = window.clinicServiceRoutes?.[parameters.get("service")];
    const selected = candidate && location.pathname.endsWith("/" + candidate.page) ? candidate : null;
    const table = servicePage.querySelector("[data-consultation-prices]");

    if (selected) {
        const context = servicePage.querySelector("[data-service-context]");
        if (context && selected.name !== heading.textContent.trim()) {
            context.textContent = "Вас интересует: " + selected.name;
            context.hidden = false;
        }
        document.title = selected.name + " — Апельсин";
        const crumb = servicePage.querySelector("[data-breadcrumb-current]");
        if (crumb) crumb.textContent = selected.name;
        const priceLink = servicePage.querySelector("[data-service-full-price]");
        if (priceLink) priceLink.href = "prices.html?service=" + parameters.get("service") + "#prices";
        if (table) {
            const rows = selected.prices.map(id => window.clinicPriceRows[id]).filter(Boolean);
            table.tBodies[0].replaceChildren();
            for (const row of rows) {
                const entry = document.createElement("tr");
                const name = document.createElement("th");
                name.scope = "row";
                name.textContent = row.name;
                const amount = document.createElement("td");
                amount.textContent = row.price;
                entry.append(name, amount);
                table.tBodies[0].append(entry);
            }
            table.hidden = rows.length === 0;
            if (!rows.length) {
                let note = servicePage.querySelector("[data-service-cost-note]");
                if (!note) {
                    note = document.createElement("p");
                    note.dataset.serviceCostNote = "";
                    table.before(note);
                }
                note.textContent = "Для этой услуги нет отдельной привязанной позиции прайса. Уточните состав и стоимость на консультации.";
                if (priceLink) priceLink.href = "prices.html?direction=" + selected.direction;
            }
        }
    }

    const sectionNavigation = servicePage.querySelector(".service-section-nav");
    if (sectionNavigation) {
        const links = [...sectionNavigation.querySelectorAll("a[href^='#']")];
        const targets = links.map(link => document.getElementById(link.hash.slice(1)));
        let frame = 0;

        function markSection() {
            frame = 0;
            const header = document.querySelector(".nav--enhanced");
            const offset = (header?.getBoundingClientRect().bottom || 0) + sectionNavigation.offsetHeight + 32;
            let current = 0;
            targets.forEach((target, index) => {
                if (target && target.getBoundingClientRect().top <= offset) current = index;
            });
            links.forEach((link, index) => {
                if (index === current) link.setAttribute("aria-current", "location");
                else link.removeAttribute("aria-current");
            });
        }

        window.addEventListener("scroll", () => {
            if (!frame) frame = requestAnimationFrame(markSection);
        }, { passive: true });
        window.addEventListener("resize", markSection);
        window.addEventListener("hashchange", markSection);
        if ("ResizeObserver" in window) {
            new ResizeObserver(() => {
                document.documentElement.style.setProperty("--section-nav-height", sectionNavigation.offsetHeight + "px");
                markSection();
            }).observe(sectionNavigation);
        }
        markSection();
    }
}
