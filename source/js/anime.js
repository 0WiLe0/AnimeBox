// Страница тайтла: оценка 1–10 и выбор сезона.
(function () {
    const KEY = 'rating:kimetsu_no_yaiba';
    const value = document.getElementById('rating-value');
    const inputs = document.querySelectorAll('input[name="rating"]');

    function show(v) {
        value.textContent = v ? `${v} из 10` : 'нет';
    }

    let saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    if (saved) {
        const input = document.getElementById('star' + saved);
        if (input) input.checked = true;
    }
    show(saved);

    inputs.forEach(input => input.addEventListener('change', () => {
        try { localStorage.setItem(KEY, input.value); } catch (e) {}
        show(input.value);
    }));

    const seasons = document.querySelectorAll('.button_viewing_timeline');
    seasons.forEach(btn => btn.addEventListener('click', () => {
        seasons.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    }));
})();
