// Фоновое видео на главной: грузим только если пользователь не просил экономить трафик/движение.
(function () {
    const video = document.querySelector('.hero_video');
    if (!video) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = navigator.connection && navigator.connection.saveData;
    if (reduceMotion || saveData) return; // остаётся постер
    video.src = video.dataset.src;
    video.play().catch(() => { /* автозапуск запрещён — остаётся постер */ });
})();
