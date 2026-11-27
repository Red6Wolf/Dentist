// Каталог остаётся доступным через обычные раскрывающиеся разделы без JavaScript.
const servicesCatalogue = document.querySelector(".services-catalogue");

if (servicesCatalogue) {
    const directions = [
        {
            id: "therapy",
            title: "Лечение зубов",
            description: "Кариес, корневые каналы, восстановление зуба",
            price: "price-treatment.html",
        },
        {
            id: "children",
            title: "Детская стоматология",
            description: "Приём, лечение и удаление молочных зубов",
            price: "price-children.html",
            guide: "first-visit.html#children",
        },
        {
            id: "hygiene",
            title: "Гигиена и профилактика",
            description: "Чистка, фторирование, защита эмали",
            price: "price-hygiene.html",
        },
        {
            id: "surgery",
            title: "Хирургия",
            description: "Удаление зубов, пластика уздечки, острые состояния",
            price: "price-surgery.html",
        },
        {
            id: "ortho",
            title: "Исправление прикуса",
            description: "Брекеты, элайнеры, ретейнеры",
            price: "price-orthodontics.html",
            guide: "orthodontics.html",
        },
        {
            id: "implantology",
            title: "Имплантация",
            description: "Восстановление отсутствующих зубов, подготовка",
            price: "price-prosthetics.html#p08-01",
            guide: "implantation.html",
        },
        {
            id: "prosthetics",
            title: "Протезирование",
            description: "Коронки, протезы, ремонт конструкций",
            price: "price-prosthetics.html",
        },
        {
            id: "periodontics",
            title: "Лечение дёсен",
            description: "Пародонтит, слизистая, шинирование зубов",
            price: "price-gums.html",
        },
        {
            id: "aesthetics",
            title: "Эстетика зубов",
            description: "Виниры, внутриканальное отбеливание",
            price: "prices.html?service=3041#prices",
            guide: "veneers.html",
        },
        {
            id: "diagnostics",
            title: "Приём и диагностика",
            description: "Консультации, прицельные и панорамные снимки",
            price: "price-visits.html",
        },
    ];
    const searchForm = servicesCatalogue.querySelector("[data-services-search]");
    const input = searchForm.querySelector("input");
    const scope = searchForm.querySelector("select");
    const clear = servicesCatalogue.querySelector("[data-service-clear]");
    const status = servicesCatalogue.querySelector("[data-service-status]");
    const navigation = servicesCatalogue.querySelector("[data-service-directions]");
    const content = servicesCatalogue.querySelector("[data-service-content]");
    const back = servicesCatalogue.querySelector("[data-service-back]");
    const heading = servicesCatalogue.querySelector("[data-direction-heading]");
    const title = servicesCatalogue.querySelector("[data-direction-title]");
    const description = servicesCatalogue.querySelector("[data-direction-description]");
    const links = servicesCatalogue.querySelector("[data-direction-links]");
    const results = servicesCatalogue.querySelector("[data-service-results]");
    const directory = servicesCatalogue.querySelector(".directory");
    const procedures = [...servicesCatalogue.querySelector("#service-procedures").content.querySelectorAll("a")];
    const mobile = matchMedia("(max-width: 800px)");
    const groups = directions.map((direction) => document.getElementById(direction.id));
    const entries = [];
    let selected = "";
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
        const link = document.createElement("a");
        link.href = "#" + direction.id;
        link.dataset.direction = direction.id;
        const name = document.createElement("strong");
        name.textContent = direction.title;
        const examples = document.createElement("span");
        examples.textContent = direction.description;
        const arrow = document.createElement("b");
        arrow.className = "icon-arrow";
        arrow.setAttribute("aria-hidden", "true");
        link.append(name, examples, arrow);
        navigation.append(link);

        const option = document.createElement("option");
        option.value = direction.id;
        option.textContent = direction.title;
        scope.append(option);

        const disclosure = document.createElement("details");
        disclosure.className = "services-procedures";
        const summary = document.createElement("summary");
        summary.textContent = "Отдельные процедуры и цены";
        const list = document.createElement("ul");
        list.className = "services-results";
        for (const entry of entries.filter((entry) => entry.price && entry.directions.includes(direction.id))) {
            list.append(resultRow(entry));
        }
        disclosure.append(summary, list);
        document.getElementById(direction.id).append(disclosure);
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
            item.id = "result-" + entry.id;
            if (entry.source.dataset.servicePrices) {
                item.dataset.servicePrices = entry.source.dataset.servicePrices;
            }
            const actions = document.createElement("div");
            actions.className = "services-result__actions";
            for (const original of entry.source.querySelectorAll(":scope > a")) {
                const link = original.cloneNode(true);
                if (item.dataset.servicePrices) link.setAttribute("aria-expanded", "false");
                actions.append(link);
            }
            item.append(actions);
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
        const active = directionFor(selected);
        const showSelection = !searching && Boolean(active);
        navigation.hidden = searching && mobile.matches;
        const highlightedDirection = searching ? scope.value : selected;
        for (const link of navigation.children) {
            if (link.dataset.direction === highlightedDirection) link.setAttribute("aria-current", "true");
            else link.removeAttribute("aria-current");
        }
        for (const group of groups) {
            group.hidden = searching || group.id !== selected;
            group.open = group.id === selected;
        }
        directory.hidden = !showSelection;
        heading.hidden = !showSelection;
        results.hidden = !searching;
        content.hidden = mobile.matches && !searching && !active;
        back.hidden = !mobile.matches || (!searching && !active);
        clear.hidden = !searching;
        servicesCatalogue.classList.toggle("services-showing-content", mobile.matches && (searching || Boolean(active)));
        if (showSelection) {
            title.textContent = active.title;
            description.textContent = active.description + ".";
            links.replaceChildren();
            if (active.guide) {
                const guide = document.createElement("a");
                guide.href = active.guide;
                guide.className = "content-link";
                guide.textContent = "Подробнее о лечении";
                if (selected === "children") guide.textContent = "Первый визит с ребёнком";
                if (selected === "aesthetics") guide.textContent = "О винирах";
                links.append(guide);
            }
            const price = document.createElement("a");
            price.className = "content-link";
            price.href = active.price;
            price.textContent = "Цены по направлению";
            links.append(price);
        }
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
        url.hash = selected || "catalogue";
        if (push) history.pushState(null, "", url);
        else history.replaceState(null, "", url);
    }

    function readLocation() {
        const url = new URL(location.href);
        input.value = url.searchParams.get("q") || "";
        const target = document.getElementById(url.hash.slice(1));
        const anchoredDirection = target?.closest(".directory-group")?.id || "";
        selected = anchoredDirection || (mobile.matches ? "" : "therapy");
        scope.value = input.value.trim()
            ? (directionFor(url.searchParams.get("direction")) ? url.searchParams.get("direction") : "")
            : anchoredDirection;
        limit = 20;
        render();
        if (target?.matches(".directory-list > li") && !input.value.trim()) {
            requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
        }
    }

    navigation.addEventListener("click", (event) => {
        const link = event.target.closest("a");
        if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        selected = link.dataset.direction;
        scope.value = selected;
        input.value = "";
        limit = 20;
        render();
        writeLocation(true);
        if (mobile.matches) {
            content.scrollIntoView({ block: "start" });
            title.focus({ preventScroll: true });
        }
    });
    input.addEventListener("input", () => {
        limit = 20;
        render();
        writeLocation();
    });
    scope.addEventListener("change", () => {
        selected = scope.value || (mobile.matches ? "" : "therapy");
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
    back.addEventListener("click", () => {
        selected = "";
        scope.value = "";
        input.value = "";
        render();
        writeLocation(true);
        navigation.scrollIntoView({ block: "start" });
        navigation.querySelector("a").focus({ preventScroll: true });
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
    mobile.addEventListener("change", render);
    searchForm.hidden = false;
    navigation.hidden = false;
    servicesCatalogue.classList.add("services-ready");
    readLocation();
}
