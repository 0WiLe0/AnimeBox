// Вкладки профиля (WAI-ARIA tabs). Списки пока демо — меняется заголовок панели.
(function () {
    const tabs = [...document.querySelectorAll('[role="tab"]')];
    const panel = document.getElementById('panel-list');
    const title = panel.querySelector('.group_title');

    function select(tab) {
        tabs.forEach(t => {
            const active = t === tab;
            t.setAttribute('aria-selected', String(active));
            t.tabIndex = active ? 0 : -1;
        });
        panel.setAttribute('aria-labelledby', tab.id);
        title.textContent = tab.dataset.title;
    }

    tabs.forEach((tab, i) => {
        tab.addEventListener('click', () => select(tab));
        tab.addEventListener('keydown', e => {
            const dir = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
            if (!dir) return;
            const next = tabs[(i + dir + tabs.length) % tabs.length];
            next.focus();
            select(next);
        });
    });
})();
