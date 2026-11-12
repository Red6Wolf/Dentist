// Сохраняем выбор врача при переходе из карточки на страницу контактов.
const doctors = {
    mukhinvv: "Мухин Вячеслав Викторович",
    kiselevaav: "Киселева Алина Владимировна",
    semaginaia: "Семагина Ирина Алексеевна",
    shishkinasv: "Шишкина Светлана Викторовна",
    chukarinasa: "Чукарина Светлана Александровна",
    baevaaa: "Баева Анна Александровна",
    vorobjovagv: "Воробьёва Галина Валерьевна",
    zvezdinayud: "Звездина Юлия Дмитриевна",
};

const doctorId = new URLSearchParams(window.location.search).get("doctor");
const doctorName = doctors[doctorId];

if (doctorName) {
    document.documentElement.dataset.selectedDoctor = doctorName;
    const notice = document.getElementById("selected-doctor");
    const emailLink = document.getElementById("booking-email");
    const subject = encodeURIComponent(`Запись к врачу — ${doctorName}`);
    const body = encodeURIComponent(`Здравствуйте! Хочу записаться к врачу ${doctorName}.`);

    notice.textContent = `Вы выбрали врача: ${doctorName}. Выбор сохранится в заявке на обратный звонок.`;
    notice.hidden = false;
    emailLink.href = `mailto:info@stomatologiya-apelsin.ru?subject=${subject}&body=${body}`;
}
