// Успех показываем только после подтверждения доставки сервером.
for (const form of document.querySelectorAll('[data-callback-form]')) {
    const status = form.querySelector('.callback-status');
    const submit = form.querySelector('[type="submit"]');
    const fields = ['name', 'phone', 'consent'];
    let sending = false;

    function errorFor(name) {
        const field = form.elements[name];
        if (name === 'name' && field.value.trim().length < 2) return 'Укажите ФИО — не менее двух символов.';
        if (name === 'phone') {
            const digits = field.value.replace(/[^0-9]/g, '');
            if (digits.length < 10 || digits.length > 15) return 'Укажите телефон с кодом города или страны — от 10 до 15 цифр.';
        }
        if (name === 'consent' && !field.checked) return 'Для обратного звонка нужно ваше согласие.';
        return '';
    }

    function validate(name) {
        const field = form.elements[name];
        const error = form.querySelector('#callback-' + name + '-error');
        const message = errorFor(name);
        field.setAttribute('aria-invalid', String(Boolean(message)));
        error.textContent = message;
        error.hidden = !message;
        return !message;
    }

    for (const name of fields) {
        form.elements[name].addEventListener(name === 'consent' ? 'change' : 'input', () => {
            if (form.elements[name].getAttribute('aria-invalid') === 'true') validate(name);
        });
    }

    form.addEventListener('submit', async event => {
        event.preventDefault();
        if (sending) return;
        status.hidden = true;
        const invalid = fields.filter(name => !validate(name));
        if (invalid.length) {
            form.elements[invalid[0]].focus();
            return;
        }
        sending = true;
        submit.disabled = true;
        form.setAttribute('aria-busy', 'true');
        submit.textContent = 'Отправляем…';
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);
        try {
            const response = await fetch(form.action, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.elements.name.value.trim(),
                    phone: form.elements.phone.value.trim(),
                    consent: form.elements.consent.checked
                }),
                signal: controller.signal
            });
            if (!response.ok) throw new Error('delivery');
            status.textContent = 'Заявка отправлена. Администратор свяжется с вами для согласования консультации.';
            status.dataset.state = 'success';
            form.reset();
        } catch {
            status.textContent = 'Не удалось подтвердить отправку. Данные сохранены в форме. Попробуйте позже или позвоните: +7 (499) 185-33-33.';
            status.dataset.state = 'error';
        } finally {
            clearTimeout(timeout);
            sending = false;
            submit.disabled = false;
            submit.textContent = 'Оставить заявку';
            form.removeAttribute('aria-busy');
            status.hidden = false;
            status.focus({ preventScroll: true });
        }
    });
}
