function revealAnchor() {
    const fragment = window.location.hash.slice(1);
    const target = document.getElementById(fragment);

    if (!target) return;

    const priceGroup = target.closest("[data-price-group]");
    if (priceGroup) priceGroup.hidden = false;

    const disclosure = target.closest("details") || target.querySelector(".profile-details");
    if (!disclosure) return;
    disclosure.open = true;
    window.requestAnimationFrame(() => target.scrollIntoView());
}

function normalizeQuery(value) {
    return value.toLocaleLowerCase("ru").replaceAll("ё", "е")
        .replace(/отделиван/g, "отбеливан").replace(/зуб(?:ами|ов|ам|ах|а|ы|у|е)(?=\s|$)/g, "зуб").trim();
}

// Разговорные названия помогают находить соответствующие позиции прайса.
function priceSearchTerms(term) {
    const aliases = [
        { startsWith: "чист", alternatives: ["гигиен", "удаление зубных отложений"] },
        { startsWith: "консульт", alternatives: ["прием"] },
        { startsWith: "сним", alternatives: ["рентген", "ортопантомограмм"] },
        { startsWith: "пломб", alternatives: ["пломб", "реставрация коронковой части"] },
        { startsWith: "отбел", alternatives: ["отбел"] },
    ];
    const match = aliases.find((alias) => term.startsWith(alias.startsWith));
    return [term, ...(match?.alternatives ?? [])];
}

function searchMatches(query, text) {
    const normalized = normalizeQuery(query).replace(/^(чистка|снимок|отбеливание) зуб$/, "$1");
    const terms = normalized.split(/\s+/).filter(Boolean);
    const searchable = normalizeQuery(text);
    return terms.every((term) => priceSearchTerms(term).some((word) => searchable.includes(word)));
}

function attachSuggestions(input, rows) {
    const list = document.createElement("datalist");
    list.id = `${input.id}-suggestions`;
    input.setAttribute("list", list.id);
    input.insertAdjacentElement("afterend", list);
    input.addEventListener("input", () => {
        const query = input.value.trim();
        list.replaceChildren();
        if (query.length < 2) return;
        const matches = [...new Set(rows.map((row) => row.cells[0]?.textContent.trim()).filter(Boolean))]
            .filter((name) => searchMatches(query, name)).slice(0, 8);
        matches.forEach((name) => {
            const option = document.createElement("option");
            option.value = name;
            list.append(option);
        });
    });
}

function enableDetailSearch() {
    const detail = document.querySelector(".price-detail");
    if (!detail) return;
    const rows = [...detail.querySelectorAll("[data-price-row]")];
    if (!rows.length) return;
    const controls = document.createElement("div");
    controls.className = "price-controls price-detail-search";
    const label = document.createElement("label");
    label.htmlFor = "detail-price-search";
    label.textContent = "Найти услугу";
    const input = document.createElement("input");
    input.id = label.htmlFor;
    input.type = "search";
    input.placeholder = "Например, пломба или снимок";
    const status = document.createElement("p");
    status.setAttribute("role", "status");
    controls.append(label, input, status);
    detail.querySelector(".price-group-table").before(controls);
    attachSuggestions(input, rows);
    input.addEventListener("input", () => {
        let count = 0;
        rows.forEach((row) => {
            row.hidden = !searchMatches(input.value, row.cells[0].textContent);
            if (!row.hidden) count += 1;
        });
        detail.querySelectorAll(".price-group-table").forEach((group) => {
            group.hidden = ![...group.querySelectorAll("[data-price-row]")].some((row) => !row.hidden);
        });
        status.textContent = input.value.trim() ? (count ? `Найдено позиций: ${count}.` : "Ничего не нашли. Попробуйте другое слово или позвоните нам.") : "";
    });
}

enableDetailSearch();

function enablePriceSearch(directory) {
    const controls = document.querySelector("[data-price-controls]");
    const input = document.getElementById("price-search");
    const status = controls.querySelector("[data-price-status]");
    const clearButton = controls.querySelector("[data-price-clear]");
    const url = new URL(window.location.href);
    const serviceId = url.searchParams.get("service");
    const service = document.getElementById(`service-${serviceId}`);
    let selectedPrices = service?.dataset.servicePrices
        ? new Set(service.dataset.servicePrices.split(", "))
        : null;

    const section = directory.closest("#prices");
    const introduction = section.querySelector(".price-introduction p");
    const directoryTitle = directory.querySelector("[data-directory-title]");
    const defaultPlaceholder = input.placeholder;
    const moreButton = section.querySelector("[data-price-more]");
    const anchorTarget = document.getElementById(window.location.hash.slice(1));
    let showAllGroups = Boolean(anchorTarget?.closest("[data-price-group]"));

    const groups = [...directory.querySelectorAll("[data-price-group]")].map((group) => {
        const title = normalizeQuery(group.querySelector("summary strong").textContent);
        const originalTitle = normalizeQuery(group.querySelector("table").getAttribute("aria-label"));
        const sections = [...group.querySelectorAll("tbody")].map((section) => {
            const heading = section.querySelector("[data-price-subgroup]")?.textContent ?? "";
            const rows = [...section.querySelectorAll("[data-price-row]")].map((row) => ({
                element: row,
                searchable: normalizeQuery(`${heading} ${row.cells[0].textContent}`),
            }));

            return { element: section, rows };
        });

        return { element: group, title, originalTitle, initiallyOpen: group.open, sections };
    });
    attachSuggestions(input, [...directory.querySelectorAll("[data-price-row]")]);

    function filterPrices() {
        const query = normalizeQuery(input.value);
        // «Чистка зубов» и «снимок зуба» также находят строки с медицинским названием.
        const simpleQuery = query.replace(/^(чистка|снимок|отбеливание) зуб$/, "$1");
        const terms = simpleQuery.split(/\s+/).filter(Boolean).map(priceSearchTerms);
        const filtering = Boolean(terms.length || selectedPrices);
        let visibleCount = 0;

        for (const [index, group] of groups.entries()) {
            let groupCount = 0;

            for (const section of group.sections) {
                let sectionCount = 0;

                for (const row of section.rows) {
                    const matchesService = !selectedPrices || selectedPrices.has(row.element.id);
                    const matchesGroup = query === group.title || query === group.originalTitle;
                    const matchesSearch = matchesGroup || terms.every((alternatives) =>
                        alternatives.some((word) => row.searchable.includes(word))
                    );
                    row.element.hidden = !matchesService || !matchesSearch;

                    if (!row.element.hidden) sectionCount += 1;
                }

                section.element.hidden = sectionCount === 0;
                groupCount += sectionCount;
            }

            group.element.hidden = groupCount === 0 || (!filtering && !showAllGroups && index >= 5);
            group.element.open = filtering ? groupCount > 0 : group.initiallyOpen;
            visibleCount += groupCount;
        }

        const serviceName = selectedPrices ? service.querySelector("span").textContent : "";
        const countLabel = filtering ? `Найдено позиций: ${visibleCount}.` : "";
        const result = visibleCount ? countLabel : "Ничего не нашли. Попробуйте другое слово или позвоните нам.";
        directoryTitle.textContent = serviceName || (query ? "Результаты поиска" : "Полный прайс по разделам");
        directoryTitle.hidden = visibleCount === 0;
        input.placeholder = serviceName ? "Поиск в выбранном направлении" : defaultPlaceholder;
        introduction.hidden = filtering;
        section.classList.toggle("price-filtered", filtering);
        status.textContent = result;
        clearButton.textContent = selectedPrices ? "Посмотреть все цены" : "Очистить поиск";
        clearButton.hidden = !filtering;
        moreButton.hidden = filtering;
        moreButton.textContent = showAllGroups ? "Свернуть направления" : "Показать все направления";
        moreButton.setAttribute("aria-expanded", String(showAllGroups));
    }

    moreButton.addEventListener("click", () => {
        showAllGroups = !showAllGroups;
        filterPrices();
    });

    input.addEventListener("input", filterPrices);
    clearButton.addEventListener("click", () => {
        input.value = "";
        selectedPrices = null;
        url.searchParams.delete("service");
        url.hash = "prices";
        window.history.replaceState(null, "", url);
        filterPrices();
        input.focus();
    });

    controls.hidden = false;
    filterPrices();
}

const priceDirectory = document.querySelector("[data-price-directory]");
if (priceDirectory) enablePriceSearch(priceDirectory);

function enableInlinePrices() {
    const catalogue = document.getElementById("catalogue");
    if (!catalogue || !priceDirectory) return;

    catalogue.querySelectorAll('a[href*="?service="]').forEach((link) => {
        link.setAttribute("aria-expanded", "false");
    });

    const priceRows = new Map(
        [...priceDirectory.querySelectorAll("[data-price-row]")].map((row) => [row.id, row])
    );

    catalogue.addEventListener("click", (event) => {
        const link = event.target.closest('a[href*="?service="]');
        if (!link || !catalogue.contains(link) || link.closest(".inline-prices")) return;

        const item = link.closest("[data-service-prices]");
        if (!item) return;

        const prices = item.dataset.servicePrices.split(",").map((id) => priceRows.get(id.trim())).filter(Boolean);
        if (!prices.length) return;

        event.preventDefault();
        const existing = item.querySelector(".inline-prices");
        if (existing) {
            existing.remove();
            item.classList.remove("has-inline-prices");
            link.setAttribute("aria-expanded", "false");
            link.removeAttribute("aria-controls");
            return;
        }

        catalogue.querySelectorAll(".inline-prices").forEach((panel) => panel.remove());
        catalogue.querySelectorAll(".has-inline-prices").forEach((entry) => entry.classList.remove("has-inline-prices"));
        catalogue.querySelectorAll('[aria-expanded="true"][href*="?service="]').forEach((control) => {
            control.setAttribute("aria-expanded", "false");
            control.removeAttribute("aria-controls");
        });

        const panel = document.createElement("div");
        panel.className = "inline-prices";
        panel.id = `inline-prices-${item.id}`;
        const heading = document.createElement("strong");
        heading.textContent = `Цены: ${item.querySelector("span")?.textContent ?? "услуга"}`;
        panel.append(heading);

        const list = document.createElement("ul");
        prices.slice(0, 5).forEach((row) => {
            const entry = document.createElement("li");
            const name = document.createElement("span");
            const amount = document.createElement("b");
            name.textContent = row.cells[0]?.textContent.trim() ?? "";
            amount.textContent = row.cells[1]?.textContent.trim() ?? "";
            entry.append(name, amount);
            list.append(entry);
        });
        panel.append(list);

        const fullLink = document.createElement("a");
        const categories = { children: "children", therapy: "treatment", hygiene: "hygiene", ortho: "orthodontics", surgery: "surgery", implantology: "prosthetics", prosthetics: "prosthetics", diagnostics: "visits", periodontics: "gums", aesthetics: "treatment" };
        const category = categories[item.closest("details")?.id] || "visits";
        fullLink.href = `price-${category}.html`;
        fullLink.textContent = "Все услуги и цены направления";
        panel.append(fullLink);
        item.append(panel);
        item.classList.add("has-inline-prices");
        link.setAttribute("aria-expanded", "true");
        link.setAttribute("aria-controls", panel.id);
    });
}

enableInlinePrices();

revealAnchor();
window.addEventListener("hashchange", revealAnchor);
