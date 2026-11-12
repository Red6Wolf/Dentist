// Окно связи и отправка заявки администратору через сервер сайта.
const bookingTriggers = document.querySelectorAll("[data-booking-dialog]");

if (bookingTriggers.length > 0 && typeof HTMLDialogElement !== "undefined") {
    const dialog = document.createElement("dialog");
    dialog.className = "booking-dialog";
    dialog.setAttribute("aria-labelledby", "booking-dialog-title");
    dialog.innerHTML = `
        <div class="booking-dialog__content">
            <button class="booking-dialog__close" type="button" aria-label="Закрыть окно">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>
            <h2 id="booking-dialog-title">Как связаться?</h2>
            <p class="booking-dialog__intro">
                Позвоните сейчас или попросите администратора перезвонить.
            </p>
            <a class="booking-dialog__phone" href="tel:+74991853333">
                <span>Позвонить сейчас</span>
                <strong>+7 (499) 185-33-33</strong>
            </a>
            <div class="booking-dialog__divider"><span>или</span></div>
            <h3>Попросить перезвонить</h3>
            <p class="booking-dialog__note">
                Оставьте номер и удобное время. Администратор свяжется с вами.
            </p>
            <p class="booking-dialog__doctor" hidden></p>
            <form class="booking-dialog__form">
                <label>
                    Ваше имя
                    <input name="name" type="text" autocomplete="name" required />
                </label>
                <label>
                    Номер телефона
                    <input name="phone" type="tel" autocomplete="tel" inputmode="tel" required />
                </label>
                <label>
                    Когда удобно позвонить
                    <input name="time" type="text" placeholder="Завтра после 16:00" required />
                </label>
                <button class="booking-dialog__submit" type="submit">Отправить заявку</button>
                <p class="booking-dialog__status" role="status" aria-live="polite" hidden></p>
            </form>
        </div>
    `;
    document.body.append(dialog);

    const closeButton = dialog.querySelector(".booking-dialog__close");
    const form = dialog.querySelector(".booking-dialog__form");
    const submitButton = dialog.querySelector(".booking-dialog__submit");
    const status = dialog.querySelector(".booking-dialog__status");
    const doctorNotice = dialog.querySelector(".booking-dialog__doctor");
    let activeTrigger = null;
    let pendingRequest = null;

    function showStatus(message, state) {
        status.textContent = message;
        status.dataset.state = state;
        status.setAttribute("role", state === "error" ? "alert" : "status");
        status.hidden = false;
    }

    bookingTriggers.forEach((trigger) => {
        trigger.addEventListener("click", (event) => {
            if (typeof dialog.showModal !== "function") return;

            event.preventDefault();
            activeTrigger = trigger;
            status.hidden = true;

            const selectedDoctor = document.documentElement.dataset.selectedDoctor;
            doctorNotice.textContent = selectedDoctor ? `Выбранный врач: ${selectedDoctor}` : "";
            doctorNotice.hidden = !selectedDoctor;

            dialog.showModal();
            document.body.classList.add("booking-dialog-open");
        });
    });

    closeButton.addEventListener("click", () => dialog.close());

    dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close();
    });

    dialog.addEventListener("close", () => {
        pendingRequest?.abort();
        document.body.classList.remove("booking-dialog-open");
        activeTrigger?.focus();
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const fields = new FormData(form);
        const name = String(fields.get("name")).trim();
        const phone = String(fields.get("phone")).trim();
        const time = String(fields.get("time")).trim();

        if (!name || !phone || !time) {
            form.reportValidity();
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = "Отправляем…";
        status.hidden = true;
        const request = new AbortController();
        pendingRequest = request;
        const timeout = window.setTimeout(() => request.abort(), 15000);

        try {
            const response = await fetch("/api/callback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                signal: request.signal,
                body: JSON.stringify({
                    name,
                    phone,
                    time,
                    doctor: document.documentElement.dataset.selectedDoctor || "",
                }),
            });
            const result = await response.json().catch(() => ({
                error: "Онлайн-заявка временно недоступна.",
            }));

            if (!response.ok) {
                throw new Error(result.error || "Не удалось отправить заявку.");
            }

            showStatus("Заявка отправлена. Администратор свяжется с вами.", "success");
            form.reset();
        } catch (error) {
            if (error.name === "AbortError" && !dialog.open) return;

            let message = error.message;

            if (error.name === "AbortError") {
                message = "Сайт слишком долго не отвечает.";
            } else if (error instanceof TypeError) {
                message = "Не удалось связаться с сайтом.";
            }

            showStatus(
                `${message} Позвоните нам по номеру +7 (499) 185-33-33.`,
                "error"
            );
        } finally {
            window.clearTimeout(timeout);
            pendingRequest = null;
            submitButton.disabled = false;
            submitButton.textContent = "Отправить заявку";
        }
    });
}
