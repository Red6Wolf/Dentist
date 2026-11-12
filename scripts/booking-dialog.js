// Окно связи для кнопок записи. Сайт пока статический: заявка передаётся через почту пользователя.
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
                После заполнения откроется письмо. Отправьте его,
                чтобы администратор получил заявку.
            </p>
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
                <button class="booking-dialog__submit" type="submit">Открыть письмо с заявкой</button>
            </form>
        </div>
    `;
    document.body.append(dialog);

    const closeButton = dialog.querySelector(".booking-dialog__close");
    const form = dialog.querySelector(".booking-dialog__form");
    let activeTrigger = null;

    bookingTriggers.forEach((trigger) => {
        trigger.addEventListener("click", (event) => {
            if (typeof dialog.showModal !== "function") return;

            event.preventDefault();
            activeTrigger = trigger;
            dialog.showModal();
            document.body.classList.add("booking-dialog-open");
        });
    });

    closeButton.addEventListener("click", () => dialog.close());

    dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close();
    });

    dialog.addEventListener("close", () => {
        document.body.classList.remove("booking-dialog-open");
        activeTrigger?.focus();
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const fields = new FormData(form);
        const name = String(fields.get("name")).trim();
        const phone = String(fields.get("phone")).trim();
        const time = String(fields.get("time")).trim();

        if (!name || !phone || !time) {
            form.reportValidity();
            return;
        }

        const subject = encodeURIComponent("Просьба перезвонить — сайт Апельсин");
        const body = encodeURIComponent(
            `Здравствуйте! Пожалуйста, перезвоните мне.\n\nИмя: ${name}\nТелефон: ${phone}\nУдобное время: ${time}`
        );

        window.location.href = `mailto:info@stomatologiya-apelsin.ru?subject=${subject}&body=${body}`;
    });
}
