// Плеер AnimeBox: Video.js + собственные контролы.
// Источник: HLS с сервера (source/server/anime/<тайтл>/<озвучка>/<серия>/<качество>/output.m3u8).
// Пока сервера нет, при ошибке загрузки включается демо-ролик.

const DEMO_SOURCE = { src: 'source/video/op_kinok1.mp4', type: 'video/mp4' };

const player = videojs('my-video', {
    autoplay: false,
    preload: 'metadata',
    fluid: true,
    controls: false,
    playsinline: true
});

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

const titleElement = $('.title_main');
const animeName = (titleElement ? titleElement.dataset.nametitle : 'default_anime_name').toLowerCase().replace(/ /g, '_');

const ui = {
    play: $('#playerPlay'),
    pause: $('#playerStop'),
    box: $('.player_box'),
    controls: $('.custom-controls'),
    status: $('.player_status'),
    seek: $('.progress-container_player'),
    seekBar: $('.progress-bar_player'),
    time: $('.time_player'),
    volumeBtn: $('#volumeBtn'),
    volumeSlider: $('.volume-slider'),
    volumeFill: $('.volume-fill'),
    volumeThumb: $('.volume-thumb'),
    qualityBtn: $('#qualityBtn'),
    qualityMenu: $('.quality-menu'),
    autoplay: $('.setting'),
    search: $('#searchSeriesInput'),
    episodeBlock: $('#episodeBlock'),
    nowEpisode: $('#nowEpisode'),
    nowVoice: $('#nowVoice')
};

const EPISODE_COUNT = $$('.episode').length;

// Начальное состояние берём из разметки, чтобы UI и логика не расходились
let currentEpisode = Number($('.episode_active')?.dataset.episode || 1);
let currentQuality = $('.quality-active')?.dataset.quality || '1080';
let currentVoice = $('.voice_active')?.dataset.voice || 'Anilibria';
let volumeLevel = 0.5;
let usingDemo = false;

const storage = {
    get(key, fallback) {
        try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
    },
    set(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* приватный режим */ }
    }
};

let isAutoplayEnabled = storage.get('autoplayEnabled', false) === true;

function formatTime(sec) {
    if (!isFinite(sec)) sec = 0;
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
}

function showStatus(text) {
    ui.status.textContent = text;
    ui.status.hidden = !text;
}

function syncPlayButtons() {
    const paused = player.paused();
    ui.play.hidden = !paused;
    ui.pause.hidden = paused;
}

// ---------- Источник ----------

function setVideoSource({ keepTime = false } = {}) {
    const time = keepTime ? player.currentTime() : 0;
    const wasPlaying = !player.paused();

    usingDemo = false;
    showStatus('');
    player.src({
        src: `source/server/anime/${animeName}/${currentVoice}/${currentEpisode}/${currentQuality}/output.m3u8`,
        type: 'application/x-mpegURL'
    });

    player.one('loadedmetadata', () => {
        player.currentTime(time);
        if (wasPlaying) player.play();
    });

    ui.nowEpisode.textContent = currentEpisode;
    ui.nowVoice.textContent = currentVoice;
    document.title = `Серия ${currentEpisode} — Плеер — AnimeBox`;
}

// Нет HLS на сервере → демо-ролик и понятное сообщение вместо технической ошибки
player.on('error', () => {
    if (usingDemo) {
        showStatus('Не удалось загрузить видео. Проверьте соединение и попробуйте ещё раз.');
        return;
    }
    usingDemo = true;
    player.error(null);
    player.src(DEMO_SOURCE);
    showStatus(`Демо-режим: серия ${currentEpisode} ещё не загружена на сервер, показан пример.`);
    setTimeout(() => { if (usingDemo && !player.error()) ui.status.hidden = true; }, 5000);
});

player.on('waiting', () => ui.box.classList.add('is-loading'));
['playing', 'canplay', 'error'].forEach(e => player.on(e, () => ui.box.classList.remove('is-loading')));

// ---------- Серии, качество, озвучка ----------

function changeEpisode(episode) {
    const next = parseInt(episode, 10);
    if (isNaN(next) || next < 1 || next > EPISODE_COUNT) return;
    currentEpisode = next;
    setVideoSource();

    $$('.episode').forEach(btn => {
        const active = Number(btn.dataset.episode) === currentEpisode;
        btn.classList.toggle('episode_active', active);
        if (active) {
            btn.setAttribute('aria-current', 'true');
            btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } else {
            btn.removeAttribute('aria-current');
        }
    });
}

function changeQuality(quality) {
    currentQuality = quality;
    setVideoSource({ keepTime: true });
    $$('.quality').forEach(btn => {
        const active = btn.dataset.quality === quality;
        btn.classList.toggle('quality-active', active);
        btn.setAttribute('aria-checked', String(active));
    });
    toggleQualityMenu(false);
}

function changeVoice(voice) {
    currentVoice = voice;
    setVideoSource({ keepTime: true });
    $$('.voice').forEach(btn => {
        const active = btn.dataset.voice === voice;
        btn.classList.toggle('voice_active', active);
        btn.setAttribute('aria-pressed', String(active));
    });
}

// Делегирование: один обработчик на кнопку (раньше срабатывали onclick + addEventListener)
document.addEventListener('click', event => {
    const episodeBtn = event.target.closest('[data-episode]');
    if (episodeBtn) {
        changeEpisode(episodeBtn.dataset.episode);
        if (episodeBtn.classList.contains('coutinue_button')) {
            ui.box.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return;
    }
    const qualityBtn = event.target.closest('[data-quality]');
    if (qualityBtn) return changeQuality(qualityBtn.dataset.quality);
    const voiceBtn = event.target.closest('[data-voice]');
    if (voiceBtn) return changeVoice(voiceBtn.dataset.voice);
});

// ---------- Воспроизведение ----------

function togglePlay() {
    if (player.paused()) player.play(); else player.pause();
}

ui.play.addEventListener('click', togglePlay);
ui.pause.addEventListener('click', togglePlay);
player.on('play', syncPlayButtons);
player.on('pause', syncPlayButtons);
player.on('click', togglePlay);

player.on('ended', () => {
    syncPlayButtons();
    markWatched(currentEpisode);
    if (isAutoplayEnabled && currentEpisode < EPISODE_COUNT) {
        changeEpisode(currentEpisode + 1);
        player.one('loadedmetadata', () => player.play());
    }
});

// ---------- Перемотка (мышь, палец, клавиатура) ----------

function seekTo(clientX) {
    const rect = ui.seek.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    if (isFinite(player.duration())) player.currentTime(percent * player.duration());
}

ui.seek.addEventListener('pointerdown', event => {
    ui.seek.setPointerCapture(event.pointerId);
    seekTo(event.clientX);
});
ui.seek.addEventListener('pointermove', event => {
    if (ui.seek.hasPointerCapture(event.pointerId)) seekTo(event.clientX);
});
ui.seek.addEventListener('keydown', event => {
    const step = { ArrowLeft: -5, ArrowRight: 5, PageDown: -30, PageUp: 30 }[event.key];
    if (step) {
        event.preventDefault();
        event.stopPropagation();
        player.currentTime(player.currentTime() + step);
    }
});

player.on('timeupdate', () => {
    const duration = player.duration();
    const current = player.currentTime();
    const percent = duration ? (current / duration) * 100 : 0;
    ui.seekBar.style.width = percent + '%';
    ui.seek.setAttribute('aria-valuenow', Math.round(percent));
    ui.seek.setAttribute('aria-valuetext', `${formatTime(current)} из ${formatTime(duration)}`);
    ui.time.textContent = `${formatTime(current)} / ${formatTime(duration)}`;

    // Серия считается просмотренной после 25 %
    if (duration && current >= duration * 0.25) markWatched(currentEpisode);
});

// ---------- Громкость ----------

function updateVolume(level) {
    volumeLevel = Math.max(0, Math.min(1, level));
    ui.volumeFill.style.height = ui.volumeThumb.style.bottom = `${volumeLevel * 100}%`;
    ui.volumeSlider.setAttribute('aria-valuenow', Math.round(volumeLevel * 100));
    player.volume(volumeLevel);
    player.muted(volumeLevel === 0);
}

function toggleVolumeSlider(force) {
    const open = typeof force === 'boolean' ? force : ui.volumeSlider.hidden;
    ui.volumeSlider.hidden = !open;
    ui.volumeBtn.setAttribute('aria-expanded', String(open));
}

function volumeFromPointer(event) {
    const rect = ui.volumeSlider.getBoundingClientRect();
    updateVolume((rect.bottom - event.clientY) / rect.height);
}

ui.volumeBtn.addEventListener('click', () => toggleVolumeSlider());
ui.volumeSlider.addEventListener('pointerdown', event => {
    ui.volumeSlider.setPointerCapture(event.pointerId);
    volumeFromPointer(event);
});
ui.volumeSlider.addEventListener('pointermove', event => {
    if (ui.volumeSlider.hasPointerCapture(event.pointerId)) volumeFromPointer(event);
});
ui.volumeSlider.addEventListener('keydown', event => {
    const step = { ArrowUp: 0.05, ArrowRight: 0.05, ArrowDown: -0.05, ArrowLeft: -0.05 }[event.key];
    if (step) {
        event.preventDefault();
        event.stopPropagation();
        updateVolume(volumeLevel + step);
    }
});
$('.volue_adj').addEventListener('wheel', event => {
    event.preventDefault();
    updateVolume(volumeLevel + (event.deltaY > 0 ? -0.05 : 0.05));
}, { passive: false });

// Мышью — как раньше, по наведению
if (window.matchMedia('(hover: hover)').matches) {
    $('.volue_adj').addEventListener('mouseenter', () => toggleVolumeSlider(true));
    $('.volue_adj').addEventListener('mouseleave', () => toggleVolumeSlider(false));
}

// ---------- Качество ----------

function toggleQualityMenu(force) {
    const open = typeof force === 'boolean' ? force : ui.qualityMenu.hidden;
    ui.qualityMenu.hidden = !open;
    ui.qualityBtn.setAttribute('aria-expanded', String(open));
    if (open) ui.qualityMenu.querySelector('.quality-active')?.focus();
}

ui.qualityBtn.addEventListener('click', () => toggleQualityMenu());

// Закрытие всплывающих меню по клику вне и по Escape
document.addEventListener('pointerdown', event => {
    if (!event.target.closest('.quality_wrap')) toggleQualityMenu(false);
    if (!event.target.closest('.volue_adj')) toggleVolumeSlider(false);
});

// ---------- Полноэкранный режим и PiP ----------

function toggleFullScreen() {
    if (document.fullscreenElement) return document.exitFullscreen();
    if (ui.box.requestFullscreen) return ui.box.requestFullscreen();
    // iOS Safari: полноэкранный режим только у самого video
    const video = ui.box.querySelector('video');
    if (video && video.webkitEnterFullscreen) video.webkitEnterFullscreen();
}

$('#fullscreenBtn').addEventListener('click', toggleFullScreen);
document.addEventListener('fullscreenchange', () => {
    ui.box.classList.toggle('is-fullscreen', document.fullscreenElement === ui.box);
});

const pipBtn = $('#pipBtn');
if (!document.pictureInPictureEnabled) {
    pipBtn.hidden = true;
} else {
    pipBtn.addEventListener('click', () => {
        const video = ui.box.querySelector('video');
        if (document.pictureInPictureElement) return document.exitPictureInPicture();
        if (video.readyState < 2) return showStatus('Видео ещё загружается…');
        video.requestPictureInPicture().catch(() => showStatus('Не удалось включить «картинку в картинке».'));
    });
}

// ---------- Горячие клавиши ----------

document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
        toggleQualityMenu(false);
        toggleVolumeSlider(false);
        return;
    }
    // Не перехватываем клавиши в полях, кнопках и модалках
    if (event.target.closest('input, textarea, select, button, a, [role="slider"], dialog')) return;

    const keyActions = {
        Space: togglePlay,
        KeyK: togglePlay,
        ArrowLeft: () => player.currentTime(player.currentTime() - 5),
        ArrowRight: () => player.currentTime(player.currentTime() + 5),
        ArrowUp: () => updateVolume(volumeLevel + 0.05),
        ArrowDown: () => updateVolume(volumeLevel - 0.05),
        KeyF: toggleFullScreen,
        KeyM: () => player.muted(!player.muted())
    };

    if (keyActions[event.code] && !event.repeat) {
        event.preventDefault();
        keyActions[event.code]();
    }
});

// ---------- Автоскрытие контролов (только над плеером) ----------

let hideTimer;

function showControls() {
    ui.box.classList.remove('controls-hidden');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
        if (!player.paused() && !ui.box.contains(document.activeElement)) ui.box.classList.add('controls-hidden');
    }, 3000);
}

['pointermove', 'pointerdown', 'focusin'].forEach(e => ui.box.addEventListener(e, showControls));
player.on('pause', showControls);
player.on('play', showControls);

// ---------- Автовоспроизведение ----------

function renderAutoplay() {
    ui.autoplay.classList.toggle('setting_active', isAutoplayEnabled);
    ui.autoplay.setAttribute('aria-pressed', String(isAutoplayEnabled));
}

ui.autoplay.addEventListener('click', () => {
    isAutoplayEnabled = !isAutoplayEnabled;
    storage.set('autoplayEnabled', isAutoplayEnabled);
    renderAutoplay();
});

// ---------- Поиск серии ----------

$('#searchSeriesForm').addEventListener('submit', event => {
    event.preventDefault();
    const n = parseInt(ui.search.value, 10);
    if (n >= 1 && n <= EPISODE_COUNT) {
        changeEpisode(n);
        ui.search.value = '';
    } else if (window.showToast) {
        window.showToast(`Серии с номером «${ui.search.value}» нет`);
    }
});

// Подсветка по мере ввода (как раньше), без смены серии
ui.search.addEventListener('input', () => {
    const value = ui.search.value.trim();
    $$('.episode').forEach(btn => btn.classList.toggle('episode_found', value !== '' && btn.dataset.episode === value));
    const found = $('.episode_found');
    if (found) found.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
});

// ---------- Листание списка серий ----------

function scrollEpisodes(direction) {
    ui.episodeBlock.scrollBy({ left: direction * ui.episodeBlock.clientWidth * 0.8, behavior: 'smooth' });
}

$('#prevSeries').addEventListener('click', () => scrollEpisodes(-1));
$('#nextSeries').addEventListener('click', () => scrollEpisodes(1));

// ---------- Прогресс просмотра (localStorage, до появления API) ----------

function watchedKey() {
    return `watched:${animeName}`;
}

function markWatched(episode) {
    const watched = storage.get(watchedKey(), []);
    if (!watched.includes(episode)) {
        watched.push(episode);
        storage.set(watchedKey(), watched);
        renderProgress();
    }
}

function renderProgress() {
    const watched = storage.get(watchedKey(), []);
    $$('.episode').forEach(btn => btn.classList.toggle('episode_watched', watched.includes(Number(btn.dataset.episode))));
    const bar = $('.viewing_progress .progress-bar');
    $('#seasonProgress').style.width = `${(watched.length / EPISODE_COUNT) * 100}%`;
    bar.setAttribute('aria-valuenow', watched.length);
    bar.setAttribute('aria-valuemax', EPISODE_COUNT);
    $('#seasonProgressText').textContent = `${watched.length} из ${EPISODE_COUNT}`;
}

// ---------- Старт ----------

updateVolume(volumeLevel);
renderAutoplay();
renderProgress();
syncPlayButtons();
setVideoSource();
