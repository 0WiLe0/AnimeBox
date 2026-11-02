// Формы входа и регистрации: клиентская валидация и демо-переход (бэкенда пока нет).
(function () {
    const form = document.querySelector('.auth-form');
    if (!form) return;

    const messages = {
        valueMissing: 'Заполните это поле.',
        tooShort: el => `Минимум ${el.minLength} символов.`,
        typeMismatch: 'Введите корректный email, например name@mail.ru.',
        mismatch: 'Пароли не совпадают.'
    };

    function validate(input) {
        let message = '';
        if (input.validity.valueMissing) message = messages.valueMissing;
        else if (input.validity.tooShort) message = messages.tooShort(input);
        else if (input.validity.typeMismatch) message = messages.typeMismatch;
        else if (input.dataset.match && input.value !== form.querySelector('#' + input.dataset.match).value) message = messages.mismatch;

        const error = document.getElementById(input.getAttribute('aria-describedby'));
        if (error) error.textContent = message;
        input.toggleAttribute('aria-invalid', Boolean(message));
        if (message) input.setAttribute('aria-invalid', 'true');
        return !message;
    }

    const inputs = [...form.querySelectorAll('input')];

    inputs.forEach(input => {
        input.addEventListener('blur', () => { if (input.value) validate(input); });
        input.addEventListener('input', () => { if (input.hasAttribute('aria-invalid')) validate(input); });
    });

    form.addEventListener('submit', event => {
        event.preventDefault();
        const invalid = inputs.filter(input => !validate(input));
        if (invalid.length) {
            invalid[0].focus();
            return;
        }
        const button = form.querySelector('[type="submit"]');
        button.disabled = true;
        button.textContent = 'Подождите…';
        try { localStorage.setItem('nickname', form.querySelector('input').value.trim()); } catch (e) {}
        window.location.href = form.getAttribute('action');
    });

    // Показать/скрыть пароль
    form.querySelectorAll('.toggle-pass').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.parentElement.querySelector('input');
            const show = input.type === 'password';
            input.type = show ? 'text' : 'password';
            btn.textContent = show ? 'скрыть' : 'показать';
            btn.setAttribute('aria-pressed', String(show));
        });
    });
})();
