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
    return value.toLocaleLowerCase("ru").replaceAll("ё", "е").trim();
}

// Разговорные названия помогают находить соответствующие позиции прайса.
function priceSearchTerms(term) {
    const aliases = [
        { startsWith: "чист", alternatives: ["гигиен", "удаление зубных отложений"] },
        { startsWith: "консульт", alternatives: ["прием"] },
        { startsWith: "сним", alternatives: ["рентген", "ортопантомограмм"] },
        { startsWith: "пломб", alternatives: ["пломб", "реставрация коронковой части"] },
    ];
    const match = aliases.find((alias) => term.startsWith(alias.startsWith));
    return [term, ...(match?.alternatives ?? [])];
}

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

    function filterPrices() {
        const query = normalizeQuery(input.value);
        // «Чистка зубов» и «снимок зуба» также находят строки с медицинским названием.
        const simpleQuery = query.replace(/^(чистка|снимок) зуб(?:а|ов)$/, "$1");
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
        fullLink.href = link.href;
        fullLink.textContent = `Весь прайс по услуге · ${prices.length} позиций`;
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
