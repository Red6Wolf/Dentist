function revealAnchor() {
    const target = document.getElementById(window.location.hash.slice(1));
    if (!target) return;
    const disclosure = target.closest("details");
    if (disclosure) disclosure.open = true;
    if (target.matches("[data-price-row], [data-service-prices]") || disclosure) {
        target.scrollIntoView();
    }
}

const priceAliases = [
    [/^чист/, ["гигиен", "удаление зубных отложений"]],
    [/^консульт/, ["прием"]],
    [/^сним/, ["рентген", "ортопантомограмм"]],
    [/^пломб/, ["пломб", "реставрация коронковой части"]],
    [/^отбел|^отделиван/, ["отбел"]],
    [/^брекет/, ["брекет"]],
    [/^винир/, ["винир"]],
    [/^удал/, ["удален"]],
    [/^детск/, ["детск", "дети", "молочн"]],
    [/^стоматолог/, ["стоматолог"]],
];

// Для частых запросов совпадение должно быть в названии процедуры.
const commonSearches = [
    [
        /^(?:удалить|удаление) зуб(?:а|ов|ы)?$/,
        /^удаление (?:подвижного молочного|неподвижного молочного|постоянного|ретинированного)/,
    ],
    [
        /^(?:поставить |установить )?пломб[ау]$/,
        /^реставрация коронковой части зуба|с учетом светоотверждаемой пломбы/,
    ],
    [
        /^(?:(?:прием|консультация) (?:ребенка|детского стоматолога)|детский (?:прием|стоматолог))$/,
        /^прием врача детского стоматолога/,
    ],
    [
        /^чистка(?: зуб(?:ов|а)?)?$/,
        /гигиена полости рта|^удаление .* отложений/,
    ],
];

function normalizePriceText(value) {
    return value.toLocaleLowerCase("ru").replaceAll("ё", "е")
        .replace(/[^а-яa-z0-9]+/g, " ").trim();
}

function searchTerms(query) {
    const normalized = normalizePriceText(query)
        .replace(/^(чистка|снимок|отбеливание|отделивание) зуб[а-я]*$/, "$1");
    return normalized.split(/\s+/).filter(Boolean).map((term) => {
        const aliases = priceAliases.find(([prefix]) => prefix.test(term));
        if (aliases) return [term, ...aliases[1]];
        return [/^зуб[а-я]*$/.test(term) ? "зуб" : term];
    });
}

function rowMatches(terms, text) {
    return terms.every((alternatives) => alternatives.some((word) => text.includes(word)));
}

function indexPriceGroup(group) {
    const title = group.querySelector("summary strong, h2")?.textContent ?? "";
    const table = group.querySelector("table");
    const context = title + " " + table.getAttribute("aria-label");
    const sections = [...table.tBodies].map((section) => {
        const heading = section.querySelector("[data-price-subgroup]")?.textContent ?? "";
        const rows = [...section.querySelectorAll("[data-price-row]")].map((row) => {
            const name = row.cells[0].textContent.trim();
            return { element: row, name, normalizedName: normalizePriceText(name), searchText: normalizePriceText(context + " " + heading + " " + name) };
        });
        return { element: section, rows };
    });
    return { element: group, sections };
}

function createSuggestions(input) {
    const list = document.createElement("datalist");
    list.id = input.id + "-suggestions";
    input.setAttribute("list", list.id);
    input.after(list);

    return function updateSuggestions(names) {
        const options = [...new Set(names)].slice(0, 8).map((name) => new Option(name, name));
        list.replaceChildren(...options);
    };
}

function filterPriceGroups(groups, query, selectedIds) {
    const terms = searchTerms(query);
    const normalized = normalizePriceText(query);
    const exactSearch = commonSearches.find(([pattern]) => pattern.test(normalized));
    const names = [];
    for (const group of groups) {
        let groupCount = 0;
        for (const section of group.sections) {
            let sectionCount = 0;
            for (const row of section.rows) {
                const matches = exactSearch
                    ? exactSearch[1].test(row.normalizedName)
                    : rowMatches(terms, row.searchText);
                const visible = (!selectedIds || selectedIds.has(row.element.id)) && matches;
                row.element.hidden = !visible;
                if (visible) {
                    names.push(row.name);
                    sectionCount += 1;
                }
            }
            section.element.hidden = sectionCount === 0;
            groupCount += sectionCount;
        }
        group.element.hidden = groupCount === 0;
    }
    return names;
}

function priceStatus(count) {
    return count ? "Найдено позиций: " + count + "." : "Ничего не нашли. Попробуйте другое название услуги.";
}

function enableDetailSearch(detail) {
    const controls = detail.querySelector("[data-price-controls]");
    const input = controls.querySelector("input");
    const clearButton = controls.querySelector("[data-price-clear]");
    const status = controls.querySelector("[data-price-status]");
    const groups = [...detail.querySelectorAll(".price-group-table")].map(indexPriceGroup);
    const updateSuggestions = createSuggestions(input);

    function filter() {
        const terms = searchTerms(input.value);
        const names = filterPriceGroups(groups, input.value, null);
        status.textContent = terms.length ? priceStatus(names.length) : "";
        clearButton.hidden = !input.value;
        updateSuggestions(input.value.trim().length >= 2 ? names : []);
    }

    controls.hidden = false;
    input.addEventListener("input", filter);
    clearButton.addEventListener("click", () => {
        input.value = "";
        filter();
        input.focus();
    });
    filter();
}

function enablePriceSearch(directory) {
    const section = directory.closest("#prices");
    const controls = section.querySelector("[data-price-controls]");
    const input = controls.querySelector("input");
    const status = controls.querySelector("[data-price-status]");
    const clearButton = controls.querySelector("[data-price-clear]");
    const moreButton = section.querySelector("[data-price-more]");
    const overview = section.querySelector("[data-price-overview]");
    const directoryTitle = directory.querySelector("[data-directory-title]");
    const url = new URL(location.href);
    const serviceIndex = section.querySelector("#price-service-index");
    const service = serviceIndex.content.getElementById("service-" + url.searchParams.get("service"));
    let selectedIds = service?.dataset.servicePrices
        ? new Set(service.dataset.servicePrices.split(",").map((id) => id.trim()))
        : null;
    const anchorTarget = document.getElementById(location.hash.slice(1));
    let showDirectory = Boolean(anchorTarget?.closest("[data-price-group]"));
    const groups = [...directory.querySelectorAll("[data-price-group]")].map(indexPriceGroup);
    const updateSuggestions = createSuggestions(input);
    let wasFiltering = false;

    function filter() {
        const terms = searchTerms(input.value);
        const filtering = Boolean(terms.length || selectedIds);
        const names = filterPriceGroups(groups, input.value, selectedIds);
        if (filtering || wasFiltering) {
            for (const { element } of groups) {
                element.open = filtering && !element.hidden;
            }
        }
        wasFiltering = filtering;
        overview.hidden = filtering || showDirectory;
        directory.hidden = filtering ? names.length === 0 : !showDirectory;
        directoryTitle.textContent = selectedIds
            ? service.textContent
            : filtering ? "Результаты поиска" : "Полный прайс";
        status.textContent = filtering ? priceStatus(names.length) : "";
        if (filtering && names.length === 0) {
            document.dispatchEvent(new Event("clinic-search-empty"));
        }
        clearButton.textContent = selectedIds ? "Показать все цены" : "Очистить поиск";
        clearButton.hidden = !input.value && !selectedIds;
        moreButton.hidden = filtering;
        moreButton.textContent = showDirectory ? "Свернуть полный прайс" : "Открыть полный прайс";
        moreButton.setAttribute("aria-expanded", String(showDirectory));
        updateSuggestions(input.value.trim().length >= 2 ? names : []);
    }

    moreButton.addEventListener("click", () => {
        showDirectory = !showDirectory;
        filter();
    });

    input.addEventListener("input", filter);
    window.addEventListener("hashchange", () => {
        const row = document.getElementById(location.hash.slice(1));
        if (!row?.matches("[data-price-row]")) return;
        input.value = "";
        selectedIds = null;
        showDirectory = true;
        filter();
    });
    clearButton.addEventListener("click", () => {
        input.value = "";
        selectedIds = null;
        if (url.searchParams.has("service")) {
            url.searchParams.delete("service");
            url.hash = "prices";
            history.replaceState(null, "", url);
        }
        filter();
        input.focus();
    });

    controls.hidden = false;
    filter();
}

function enableInlinePrices(catalogue) {
    let priceRowsRequest;

    async function loadPriceRows() {
        const response = await fetch("prices.html");
        if (!response.ok) throw new Error("Не удалось загрузить прайс");
        const page = new DOMParser().parseFromString(await response.text(), "text/html");
        return new Map([...page.querySelectorAll("[data-price-row]")].map((row) => [row.id, row]));
    }

    for (const link of catalogue.querySelectorAll('a[href*="?service="]')) {
        link.setAttribute("aria-expanded", "false");
    }

    catalogue.addEventListener("click", async (event) => {
        const link = event.target.closest('a[href*="?service="]');
        if (!link || link.closest(".inline-prices") ||
            event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

        const item = link.closest("[data-service-prices]");
        if (!item) return;

        event.preventDefault();
        if (link.hasAttribute("aria-busy")) return;

        const existing = item.querySelector(".inline-prices");
        if (existing) {
            existing.remove();
            item.classList.remove("has-inline-prices");
            link.setAttribute("aria-expanded", "false");
            link.removeAttribute("aria-controls");
            return;
        }

        link.setAttribute("aria-busy", "true");
        let rows;
        try {
            priceRowsRequest ??= loadPriceRows();
            const priceRows = await priceRowsRequest;
            rows = item.dataset.servicePrices.split(",")
                .map((id) => priceRows.get(id.trim())).filter(Boolean);
        } catch {
            priceRowsRequest = undefined;
            location.assign(link.href);
            return;
        } finally {
            link.removeAttribute("aria-busy");
        }
        if (!rows.length) {
            location.assign(link.href);
            return;
        }

        const panel = document.createElement("div");
        panel.className = "inline-prices";
        panel.id = "inline-prices-" + item.id;
        const heading = document.createElement("strong");
        heading.textContent = "Позиции прайса — " + item.querySelector("span").textContent;

        const list = document.createElement("ul");
        for (const row of rows.slice(0, 5)) {
            const entry = document.createElement("li");
            const name = document.createElement("span");
            const amount = document.createElement("b");
            name.textContent = row.cells[0].textContent.trim();
            amount.textContent = row.cells[1].textContent.trim();
            entry.append(name, amount);
            list.append(entry);
        }

        const relatedPages = new Set(rows.map((row) => row.closest("[data-price-page]").dataset.pricePage));
        const fullLink = document.createElement("a");
        if (relatedPages.size === 1) {
            fullLink.href = [...relatedPages][0] + "#" + rows[0].id;
            fullLink.textContent = "Открыть прайс направления";
        } else {
            fullLink.href = link.href;
            fullLink.textContent = "Все цены по услуге";
        }

        const note = document.createElement("p");
        note.textContent = "Отдельные процедуры могут быть частью лечения. Полный состав и стоимость уточните после осмотра.";
        panel.append(heading, list, note, fullLink);
        item.classList.add("has-inline-prices");
        item.append(panel);
        link.setAttribute("aria-expanded", "true");
        link.setAttribute("aria-controls", panel.id);
    });
}

const detail = document.querySelector(".price-detail");
if (detail) enableDetailSearch(detail);

const priceDirectory = document.querySelector("[data-price-directory]");
if (priceDirectory) enablePriceSearch(priceDirectory);

const catalogue = document.getElementById("catalogue");
if (catalogue) {
    function forwardPriceLink() {
        const url = new URL(location.href);
        if (url.searchParams.has("service") || /^#(?:prices|p\d+-\d+)$/.test(url.hash)) {
            const prices = new URL("prices.html", url);
            prices.search = url.search;
            prices.hash = url.hash;
            location.replace(prices);
        }
    }

    forwardPriceLink();
    window.addEventListener("hashchange", forwardPriceLink);
    enableInlinePrices(catalogue);
}

revealAnchor();
window.addEventListener("hashchange", revealAnchor);
