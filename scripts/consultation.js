// Памятка остаётся на устройстве: посетитель сам копирует или скачивает её.
const consultation = document.querySelector("[data-consultation-note]");

if (consultation) {
    const main = document.getElementById("main-content");
    const heading = main.querySelector("h1");
    const parameters = new URLSearchParams(location.search);
    const service = window.clinicServiceRoutes?.[parameters.get("service")];
    const selected = service && location.pathname.endsWith("/" + service.page) ? service : null;
    const form = consultation.querySelector("form");
    form.hidden = false;
    const status = consultation.querySelector("[data-consultation-status]");
    const table = main.querySelector("[data-consultation-prices]");
    const title = selected?.name || heading.textContent.trim();
    const priceRows = selected
        ? selected.prices.map(id => window.clinicPriceRows[id]).filter(Boolean)
        : [];

    if (selected) {
        const context = main.querySelector("[data-service-context]");
        if (context && selected.name !== heading.textContent.trim()) {
            context.textContent = "Вас интересует: " + selected.name;
            context.hidden = false;
        }
        document.title = selected.name + " — Апельсин";
        const priceLink = main.querySelector("[data-service-full-price]");
        if (priceLink) priceLink.href = "prices.html?service=" + parameters.get("service") + "#prices";
        if (table) {
            const body = table.tBodies[0];
            body.replaceChildren();
            for (const row of priceRows) {
                const entry = document.createElement("tr");
                const name = document.createElement("th");
                name.scope = "row";
                name.textContent = row.name;
                const amount = document.createElement("td");
                amount.textContent = row.price;
                entry.append(name, amount);
                body.append(entry);
            }
            table.hidden = priceRows.length === 0;
            if (!priceRows.length) {
                let note = main.querySelector("[data-service-cost-note]");
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

    function makeNote() {
        const questions = [...form.querySelectorAll("input:checked")].map(field => "• " + field.value);
        const page = new URL(location.href);
        page.hash = "";
        const lines = ["Апельсин — вопросы к консультации", "", "Интересующая услуга: " + title, ""];
        if (questions.length) lines.push("Мои вопросы:", ...questions, "");
        else lines.push("Хочу обсудить варианты, этапы и состав стоимости.", "");
        const prices = selected ? priceRows : [...(main.querySelector(".price-common tbody")?.rows || [])].map(row => ({name:row.cells[0].textContent.trim(),price:row.cells[1].textContent.trim()}));
        if (prices.length) {
            lines.push("Отдельные позиции прайса (не итоговая стоимость лечения):");
            lines.push(...prices.slice(0, 3).map(row => row.name + " — " + row.price), "");
        }
        lines.push("Стоимость уточняется по согласованному плану. Отдельная позиция прайса не равна цене всего лечения.", "", "Телефон: +7 (499) 185-33-33", "Пн–Пт 09:00–21:00 · Сб–Вс 10:00–19:00", page.href);
        return lines.join("\n");
    }

    consultation.querySelector("[data-consultation-copy]").addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(makeNote());
            status.textContent = "Памятка скопирована. Её можно сохранить в заметках.";
        } catch {
            status.textContent = "Браузер не разрешил копирование. Скачайте памятку .txt — в ней будут те же вопросы.";
        }
    });

    consultation.querySelector("[data-consultation-download]").addEventListener("click", () => {
        const file = new Blob(["\uFEFF" + makeNote()], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(file);
        const link = document.createElement("a");
        link.href = url;
        link.download = "apelsin-consultation.txt";
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        status.textContent = "Памятка подготовлена к скачиванию.";
    });

    form.addEventListener("submit", event => event.preventDefault());
    form.addEventListener("change", () => {
        const count = form.querySelectorAll("input:checked").length;
        status.textContent = count ? "Выбрано вопросов: " + count + ". Скопируйте или скачайте памятку." : "";
    });
}
