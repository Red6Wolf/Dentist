// Кнопки записи показывают номер клиники без длинной анкеты.
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
            <h2 id="booking-dialog-title">Записаться на приём</h2>
            <p>Позвоните администратору — поможем выбрать врача и время.</p>
            <a class="booking-dialog__phone" href="tel:+74991853333">+7 (499) 185-33-33</a>
        </div>
    `;
    document.body.append(dialog);

    let activeTrigger = null;

    bookingTriggers.forEach((trigger) => {
        trigger.addEventListener("click", (event) => {
            event.preventDefault();
            activeTrigger = trigger;
            dialog.showModal();
            document.body.classList.add("booking-dialog-open");
        });
    });

    dialog.querySelector(".booking-dialog__close").addEventListener("click", () => dialog.close());

    dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close();
    });

    dialog.addEventListener("close", () => {
        document.body.classList.remove("booking-dialog-open");
        activeTrigger?.focus();
    });
}
