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

function filterPriceGroups(groups, query, selectedIds, direction = "") {
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
                const inDirection = !direction || row.element.dataset.directions.split(",").includes(direction);
                const visible = inDirection && (!selectedIds || selectedIds.has(row.element.id)) && matches;
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

function enablePriceSearch(directory) {
    const section = directory.closest("#prices");
    const controls = section.querySelector("[data-price-controls]");
    const input = controls.querySelector("input");
    const direction = controls.querySelector("select");
    const status = controls.querySelector("[data-price-status]");
    const clearButton = controls.querySelector("[data-price-clear]");
    const directoryTitle = directory.querySelector("[data-directory-title]");
    const groups = [...directory.querySelectorAll("[data-price-group]")].map(indexPriceGroup);
    const updateSuggestions = createSuggestions(input);
    let selectedIds = null;
    let service = null;
    let wasFiltering = false;

    function readLocation() {
        const url = new URL(location.href);
        input.value = url.searchParams.get("q") || "";
        direction.value = url.searchParams.get("direction") || "";
        const index = section.querySelector("#price-service-index").content;
        service = index.getElementById("service-" + url.searchParams.get("service"));
        selectedIds = service?.dataset.servicePrices
            ? new Set(service.dataset.servicePrices.split(",").map(id => id.trim()))
            : null;
    }

    function filter(updateUrl = false) {
        const filtering = Boolean(input.value.trim() || selectedIds || direction.value);
        const names = filterPriceGroups(groups, input.value, selectedIds, direction.value);
        for (const { element } of groups) {
            if (filtering || wasFiltering) element.open = filtering && !element.hidden;
            const count = element.querySelectorAll("[data-price-row]:not([hidden])").length;
            element.querySelector("summary").setAttribute("aria-label",
                element.querySelector("summary strong").textContent + ", позиций: " + count);
        }
        wasFiltering = filtering;
        directory.hidden = names.length === 0;
        directoryTitle.textContent = selectedIds ? service.textContent
            : direction.value ? direction.selectedOptions[0].textContent
            : input.value.trim() ? "Результаты поиска" : "Все процедуры";
        status.textContent = filtering ? priceStatus(names.length) : "Позиций в прайсе: " + names.length + ". Раскройте нужный раздел.";
        clearButton.hidden = !filtering;
        clearButton.textContent = "Сбросить фильтры";
        updateSuggestions(input.value.trim().length >= 2 ? names : []);
        if (filtering && names.length === 0) document.dispatchEvent(new Event("clinic-search-empty"));
        if (updateUrl) {
            const url = new URL(location.href);
            for (const [key, value] of [["q", input.value], ["direction", direction.value]]) {
                if (value) url.searchParams.set(key, value);
                else url.searchParams.delete(key);
            }
            if (!selectedIds) url.searchParams.delete("service");
            url.hash = "prices";
            history.replaceState(null, "", url);
        }
    }

    function restore() {
        readLocation();
        // Прямая ссылка на строку должна показать её даже при старом фильтре.
        const row = document.getElementById(location.hash.slice(1));
        if (row?.matches("[data-price-row]")) {
            input.value = "";
            selectedIds = null;
            if (direction.value && !row.dataset.directions.split(",").includes(direction.value)) direction.value = "";
        }
        filter();
        revealAnchor();
    }

    input.addEventListener("input", () => filter(true));
    direction.addEventListener("change", () => {
        selectedIds = null;
        filter(true);
    });
    clearButton.addEventListener("click", () => {
        input.value = "";
        direction.value = "";
        selectedIds = null;
        filter(true);
        input.focus();
    });
    window.addEventListener("hashchange", restore);
    window.addEventListener("popstate", restore);
    controls.hidden = false;
    restore();
}

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
}

revealAnchor();
window.addEventListener("hashchange", revealAnchor);
