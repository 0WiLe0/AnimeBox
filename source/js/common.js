// Общее поведение внутренних страниц: «скоро»-разделы, тост, модалка «Сообщить о проблеме».

(function () {
    // Тост
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
    let toastTimer;

    function showToast(text) {
        toast.textContent = text;
        toast.classList.add('is-visible');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
    }
    window.showToast = showToast;

    // Разделы, которых пока нет
    document.querySelectorAll('[data-soon]').forEach(btn => {
        btn.addEventListener('click', () => showToast(`Раздел «${btn.dataset.soon}» скоро появится`));
    });

    // Модалка «Сообщить о проблеме»
    const dialog = document.createElement('dialog');
    dialog.className = 'modal';
    dialog.setAttribute('aria-labelledby', 'reportTitle');
    dialog.innerHTML = `
        <form method="dialog" class="report-form" novalidate>
            <button type="submit" value="cancel" class="modal_close" aria-label="Закрыть">×</button>
            <h2 id="reportTitle">Сообщить о проблеме</h2>
            <p>Сайт в бета-версии. Опишите, что пошло не так — это поможет нам исправить ошибку.</p>
            <label for="reportType">Тип проблемы</label>
            <select id="reportType" name="type">
                <option>Не работает видео</option>
                <option>Ошибка на странице</option>
                <option>Предложение</option>
                <option>Другое</option>
            </select>
            <label for="reportText">Описание</label>
            <textarea id="reportText" name="text" required minlength="10" aria-describedby="reportError"></textarea>
            <p class="field-error" id="reportError" aria-live="polite"></p>
            <div class="modal_actions">
                <button type="submit" value="cancel" class="btn-outline">Отмена</button>
                <button type="submit" value="send" class="btn-ink">Отправить</button>
            </div>
        </form>`;
    document.body.appendChild(dialog);

    const form = dialog.querySelector('form');
    const text = dialog.querySelector('#reportText');
    const error = dialog.querySelector('#reportError');
    let opener = null;

    form.addEventListener('submit', event => {
        if (event.submitter && event.submitter.value === 'send') {
            if (text.value.trim().length < 10) {
                event.preventDefault();
                error.textContent = 'Опишите проблему хотя бы в 10 символах.';
                text.setAttribute('aria-invalid', 'true');
                text.focus();
                return;
            }
            // Бэкенда пока нет — сохраняем локально, чтобы не терять обращения при тестировании.
            try {
                const reports = JSON.parse(localStorage.getItem('reports') || '[]');
                reports.push({ type: form.type.value, text: text.value.trim(), page: location.pathname, at: Date.now() });
                localStorage.setItem('reports', JSON.stringify(reports));
            } catch (e) { /* хранилище недоступно — не критично */ }
            showToast('Спасибо! Сообщение отправлено');
        }
    });

    dialog.addEventListener('close', () => {
        form.reset();
        error.textContent = '';
        text.removeAttribute('aria-invalid');
        if (opener) opener.focus();
    });

    // Клик по подложке закрывает окно
    dialog.addEventListener('click', event => {
        if (event.target === dialog) dialog.close();
    });

    document.querySelectorAll('[data-open-report]').forEach(btn => {
        btn.addEventListener('click', () => {
            opener = btn;
            dialog.showModal();
            text.focus();
        });
    });
})();
