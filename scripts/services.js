// Каталог остаётся доступным через обычные раскрывающиеся разделы без JavaScript.
const servicesCatalogue = document.querySelector(".services-catalogue");

if (servicesCatalogue) {
    const directions = [
        {
            id: "therapy",
            title: "Лечение зубов",
            description: "Кариес, корневые каналы, восстановление зуба",
            price: "prices.html?direction=therapy",
        },
        {
            id: "children",
            title: "Детская стоматология",
            description: "Приём, лечение и удаление молочных зубов",
            price: "prices.html?direction=children",
            guide: "first-visit.html#children",
        },
        {
            id: "hygiene",
            title: "Гигиена и профилактика",
            description: "Чистка, фторирование, защита эмали",
            price: "prices.html?direction=hygiene",
        },
        {
            id: "surgery",
            title: "Хирургия",
            description: "Удаление зубов, пластика уздечки, острые состояния",
            price: "prices.html?direction=surgery",
        },
        {
            id: "ortho",
            title: "Исправление прикуса",
            description: "Брекеты, элайнеры, ретейнеры",
            price: "prices.html?direction=ortho",
            guide: "orthodontics.html",
        },
        {
            id: "implantology",
            title: "Имплантация",
            description: "Восстановление отсутствующих зубов, подготовка",
            price: "prices.html?direction=implantology#p08-01",
            guide: "implantation.html",
        },
        {
            id: "prosthetics",
            title: "Протезирование",
            description: "Коронки, протезы, ремонт конструкций",
            price: "prices.html?direction=prosthetics",
        },
        {
            id: "periodontics",
            title: "Лечение дёсен",
            description: "Пародонтит, слизистая, шинирование зубов",
            price: "prices.html?direction=periodontics",
        },
        {
            id: "aesthetics",
            title: "Эстетика зубов",
            description: "Виниры, внутриканальное отбеливание",
            price: "prices.html?direction=aesthetics#prices",
            guide: "veneers.html",
        },
        {
            id: "diagnostics",
            title: "Приём и диагностика",
            description: "Консультации, прицельные и панорамные снимки",
            price: "prices.html?direction=diagnostics",
        },
    ];
    const order = ["therapy", "prosthetics", "implantology", "children", "hygiene", "ortho", "surgery", "periodontics", "aesthetics", "diagnostics"];
    directions.sort((first, second) => order.indexOf(first.id) - order.indexOf(second.id));
    const previews = {
        therapy: ["service-1438", "service-3740", "service-1421"],
        prosthetics: ["service-4101", "service-4003", "service-4079"],
        implantology: ["service-986", "service-3820", "service-1473"],
        children: ["service-3751", "service-3881", "service-4054"],
        hygiene: ["service-3039", "service-4073", "service-4093"],
        ortho: ["service-994", "service-3969", "service-3877"],
        surgery: ["service-993", "service-4040", "service-3876"],
        periodontics: ["service-3730", "service-1287", "service-4110"],
        aesthetics: ["service-983", "service-990", "service-3041"],
        diagnostics: ["service-3850", "service-3946", "service-992"],
    };
    const searchForm = servicesCatalogue.querySelector("[data-services-search]");
    const input = searchForm.querySelector("input");
    const scope = searchForm.querySelector("select");
    const clear = servicesCatalogue.querySelector("[data-service-clear]");
    const status = servicesCatalogue.querySelector("[data-service-status]");
    const results = servicesCatalogue.querySelector("[data-service-results]");
    const directory = servicesCatalogue.querySelector(".directory");
    const procedures = [...servicesCatalogue.querySelector("#service-procedures").content.querySelectorAll("a")];
    const groups = directions.map((direction) => document.getElementById(direction.id));
    const entries = [];
    let limit = 20;

    const more = document.createElement("button");
    more.type = "button";
    more.className = "services-more";
    more.textContent = "Показать ещё";
    more.setAttribute("aria-controls", "service-search-results");
    more.hidden = true;
    results.after(more);

    function directionFor(id) {
        return directions.find((direction) => direction.id === id);
    }

    // Позиции берутся из того же прайса, что и страницы цен, без сетевого запроса.
    const procedureNames = new Set();
    for (const procedure of procedures) {
        const name = procedure.querySelector("span").textContent;
        procedureNames.add(normalizePriceText(name));
        entries.push({
            name,
            direction: procedure.dataset.direction,
            directions: procedure.dataset.directions.split(","),
            href: procedure.getAttribute("href"),
            price: procedure.querySelector("b").textContent,
            id: procedure.dataset.procedureId,
        });
    }
    for (const group of groups) {
        for (const item of group.querySelectorAll(".directory-list > li")) {
            const name = item.querySelector("span").textContent.trim();
            if (procedureNames.has(normalizePriceText(name))) continue;
            entries.push({
                name,
                direction: group.id,
                directions: [group.id],
                source: item,
                id: item.id,
            });
        }
    }

    for (const direction of directions) {
        const group = document.getElementById(direction.id);
        const card = document.createElement("article");
        card.className = "services-card";
        card.dataset.direction = direction.id;
        const heading = document.createElement("div");
        heading.className = "services-card__heading";
        const image = document.createElement("span");
        image.className = "services-card__image";
        image.setAttribute("aria-hidden", "true");
        const imageIndex = order.indexOf(direction.id);
        image.style.backgroundPosition = (imageIndex % 5 * 25) + "% " + (Math.floor(imageIndex / 5) * 100) + "%";
        const name = document.createElement("h2");
        name.id = "heading-" + direction.id;
        name.textContent = direction.title;
        card.setAttribute("aria-labelledby", name.id);
        const description = document.createElement("p");
        description.textContent = direction.description + ".";
        heading.append(name, description, image);
        const preview = document.createElement("ul");
        preview.className = "services-card__preview";
        for (const id of previews[direction.id]) {
            const source = document.getElementById(id);
            const item = document.createElement("li");
            const link = document.createElement("a");
            const serviceId = id.replace("service-", "");
            link.href = window.clinicServiceRoutes[serviceId].page + "?service=" + serviceId;
            link.textContent = source.querySelector("span").textContent;
            const arrow = document.createElement("span");
            arrow.className = "services-chevron";
            arrow.setAttribute("aria-hidden", "true");
            link.append(arrow);
            item.append(link);
            preview.append(item);
        }
        const summary = group.querySelector(":scope > summary");
        summary.textContent = "Все услуги направления";
        summary.setAttribute("aria-label", "Все услуги направления «" + direction.title + "»");
        group.classList.add("services-card__details");
        group.addEventListener("toggle", () => {
            summary.textContent = group.open ? "Свернуть список" : "Все услуги направления";
            summary.setAttribute("aria-label", (group.open ? "Свернуть список «" : "Все услуги направления «") + direction.title + "»");
        });
        const actions = document.createElement("div");
        actions.className = "services-card__actions";
        const price = document.createElement("a");
        price.href = direction.price;
        price.className = "content-link";
        price.textContent = "Цены по направлению";
        actions.append(price);
        if (direction.guide) {
            const guide = document.createElement("a");
            guide.href = direction.guide;
            guide.className = "content-link";
            guide.textContent = direction.id === "children" ? "Первый визит с ребёнком" : "Подробнее о лечении";
            actions.append(guide);
        }
        group.append(actions);
        card.append(heading, preview, group);
        directory.append(card);

        const option = document.createElement("option");
        option.value = direction.id;
        option.textContent = direction.title;
        scope.append(option);

        for (const item of group.querySelectorAll(".directory-list > li")) {
            const serviceId = item.id.replace("service-", "");
            const route = window.clinicServiceRoutes[serviceId];
            const link = document.createElement("a");
            link.className = "service-name-link";
            link.href = route.page + "?service=" + serviceId;
            link.textContent = route.name;
            const arrow = document.createElement("span");
            arrow.className = "services-chevron";
            arrow.setAttribute("aria-hidden", "true");
            link.append(arrow);
            item.replaceChildren(link);
        }
    }

    function resultRow(entry) {
        const item = document.createElement("li");
        item.className = "services-result";
        const copy = document.createElement("div");
        copy.className = "services-result__copy";
        const category = document.createElement("small");
        category.textContent = directionFor(entry.direction).title;
        const name = document.createElement("span");
        name.dataset.serviceName = "";
        name.textContent = entry.name;
        copy.append(category, name);
        item.append(copy);

        if (entry.price) {
            const action = document.createElement("a");
            action.className = "services-result__price content-link";
            action.href = entry.href;
            action.textContent = entry.price;
            action.setAttribute("aria-label", entry.name + " — " + entry.price + ". Открыть в прайсе");
            item.append(action);
        } else {
            const serviceId = entry.id.replace("service-", "");
            const route = window.clinicServiceRoutes[serviceId];
            const link = document.createElement("a");
            link.href = route.page + "?service=" + serviceId;
            link.className = "content-link";
            link.textContent = "Об услуге";
            link.setAttribute("aria-label", "Подробнее: " + entry.name);
            item.append(link);
        }
        return item;
    }

    function matchingEntries() {
        let query = normalizePriceText(input.value);
        query = query.replace(/восьм[её]рк[а-я]*/g, "зуба мудрости")
            .replace(/нет зуба|отсутствует зуб/g, "имплантация")
            .replace(/синус лифтинг/g, "синуслифтинг")
            .replace(/airflow|эир флоу|эйр флоу/g, "air flow");
        const terms = searchTerms(query).map((alternatives) => alternatives.map((word) =>
            word.replace(/^уздеч[а-я]*$/, "уздеч")
                .replace(/^ретейн[а-я]*$/, "ретейн")
                .replace(/^корон[а-я]*$/, "корон")
                .replace(/^кюртаж[а-я]*$/, "кюрет")
        ));
        return entries.filter((entry) => {
            if (scope.value && !entry.directions.includes(scope.value)) return false;
            const context = normalizePriceText(entry.name + " " + directionFor(entry.direction).title);
            return rowMatches(terms, context);
        }).sort((first, second) => {
            const exactFirst = normalizePriceText(first.name) === query;
            const exactSecond = normalizePriceText(second.name) === query;
            return Number(exactSecond) - Number(exactFirst);
        });
    }

    function render() {
        const searching = Boolean(input.value.trim());
        directory.hidden = searching;
        results.hidden = !searching;
        clear.hidden = !searching;
        searchForm.classList.toggle("is-searching", searching);
        if (searching) {
            const matches = matchingEntries();
            results.replaceChildren(...matches.slice(0, limit).map(resultRow));
            more.hidden = matches.length <= limit;
            if (matches.length) {
                status.textContent = "Найдено — " + matches.length + ".";
                if (matches.length > limit) status.textContent += " Показаны первые " + limit + ".";
            } else {
                status.textContent = scope.value
                    ? "В этом направлении ничего не нашли. Попробуйте поиск во всех услугах."
                    : "Ничего не нашли. Попробуйте другое название или обратитесь к администратору.";
            }
        } else {
            results.replaceChildren();
            more.hidden = true;
            status.textContent = "";
        }
    }

    function writeLocation(push = false) {
        const url = new URL(location.href);
        url.searchParams.delete("q");
        url.searchParams.delete("direction");
        if (input.value.trim()) {
            url.searchParams.set("q", input.value.trim());
            if (scope.value) url.searchParams.set("direction", scope.value);
        }
        url.hash = "catalogue";
        if (push) history.pushState(null, "", url);
        else history.replaceState(null, "", url);
    }

    function readLocation() {
        const url = new URL(location.href);
        input.value = url.searchParams.get("q") || "";
        const target = document.getElementById(url.hash.slice(1));
        const anchoredDirection = target?.closest(".directory-group")?.id || "";
        scope.value = input.value.trim()
            ? (directionFor(url.searchParams.get("direction")) ? url.searchParams.get("direction") : "")
            : "";
        limit = 20;
        render();
        if (anchoredDirection && !input.value.trim()) {
            document.getElementById(anchoredDirection).open = true;
            requestAnimationFrame(() => {
                const scrollTarget = target.matches(".directory-group") ? target.closest(".services-card") : target;
                scrollTarget.scrollIntoView({ block: "start" });
                if (target.matches(".directory-list > li")) {
                    target.setAttribute("tabindex", "-1");
                    target.focus({ preventScroll: true });
                }
            });
        }
    }

    input.addEventListener("input", () => {
        limit = 20;
        render();
        writeLocation();
    });
    scope.addEventListener("change", () => {
        limit = 20;
        render();
        writeLocation();
    });
    clear.addEventListener("click", () => {
        input.value = "";
        render();
        writeLocation();
        input.focus();
    });
    more.addEventListener("click", () => {
        const previousLimit = limit;
        limit += 20;
        render();
        results.children[previousLimit]?.querySelector("a")?.focus({ preventScroll: true });
    });
    searchForm.addEventListener("submit", (event) => event.preventDefault());
    window.addEventListener("popstate", readLocation);
    window.addEventListener("hashchange", readLocation);
    searchForm.hidden = false;
    servicesCatalogue.classList.add("services-ready");
    readLocation();
}
