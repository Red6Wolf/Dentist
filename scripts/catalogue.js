function revealAnchor() {
    const fragment = window.location.hash.slice(1);
    const target = document.getElementById(fragment);

    if (!target) return;

    const disclosure = target.closest("details") || target.querySelector(".profile-details");
    if (!disclosure) return;
    disclosure.open = true;
    window.requestAnimationFrame(() => target.scrollIntoView());
}

function normalizeQuery(value) {
    return value.toLocaleLowerCase("ru").replaceAll("ё", "е").trim();
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

    const groups = [...directory.querySelectorAll("[data-price-group]")].map((group) => {
        const title = group.querySelector("summary").textContent;
        const sections = [...group.querySelectorAll("tbody")].map((section) => {
            const heading = section.querySelector("[data-price-subgroup]")?.textContent ?? "";
            const rows = [...section.querySelectorAll("[data-price-row]")].map((row) => ({
                element: row,
                searchable: normalizeQuery(`${title} ${heading} ${row.textContent}`),
            }));

            return { element: section, rows };
        });

        return { element: group, initiallyOpen: group.open, sections };
    });

    function filterPrices() {
        const query = normalizeQuery(input.value);
        const terms = query ? query.split(/\s+/) : [];
        const filtering = Boolean(terms.length || selectedPrices);
        let visibleCount = 0;

        for (const group of groups) {
            let groupCount = 0;

            for (const section of group.sections) {
                let sectionCount = 0;

                for (const row of section.rows) {
                    const matchesService = !selectedPrices || selectedPrices.has(row.element.id);
                    const matchesSearch = terms.every((term) => row.searchable.includes(term));
                    row.element.hidden = !matchesService || !matchesSearch;

                    if (!row.element.hidden) sectionCount += 1;
                }

                section.element.hidden = sectionCount === 0;
                groupCount += sectionCount;
            }

            group.element.hidden = groupCount === 0;
            group.element.open = filtering ? groupCount > 0 : group.initiallyOpen;
            visibleCount += groupCount;
        }

        const serviceName = selectedPrices ? service.querySelector("span").textContent : "";
        const countLabel = filtering ? `Найдено позиций: ${visibleCount}.` : `Позиций в прайсе: ${visibleCount}.`;
        const result = visibleCount ? countLabel : "Ничего не найдено. Попробуйте другой запрос или сбросьте фильтр.";
        status.textContent = serviceName ? `${serviceName}. ${result}` : result;
    }

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

revealAnchor();
window.addEventListener("hashchange", revealAnchor);
