// Инициализация видеоплеера
const player = videojs('my-video', {
    autoplay: false,
    preload: 'auto',
    fluid: true
});

// Извлечение названия аниме из HTML
const titleElement = document.querySelector('.title_main');
const animeName = titleElement ? titleElement.getAttribute('data-nametitle') : 'default_anime_name';

// Форматирование названия для использования в пути (если необходимо)
const formattedAnimeName = animeName.toLowerCase().replace(/ /g, '_');

// Константы для часто используемых селекторов
const SELECTORS = {
    EPISODE: '.episode',
    QUALITY: '.quality',
    VOICE: '.voice',
    QUALITY_MENU: '.quality-menu',
    PLAYER_PLAY: '#playerPlay',
    PLAYER_STOP: '#playerStop',
    PROGRESS_CONTAINER: '.progress-container_player',
    PROGRESS_BAR: '.progress-bar_player',
    VOLUME_CONTAINER: '.volue_adj',
    VOLUME_SLIDER: '.volume-slider',
    VOLUME_FILL: '.volume-fill',
    VOLUME_THUMB: '.volume-thumb',
    PLAYER_BOX: '.player_box',
    PLAYER_BLOCK: '.player_block',
    CUSTOM_CONTROLS: '.custom-controls',
    VIDEO_CONTAINER: '#my-video'
};

let currentEpisode = 1; // Текущая серия
let currentQuality = '1080'; // Текущее качество
let currentVoice = 'AmiDub'; // Текущая озвучка
let volumeLevel = 0.5;

// Функция для установки источника видео
function setVideoSource() {
    if (isNaN(currentEpisode)) {
        console.error("Invalid currentEpisode value:", currentEpisode);
        currentEpisode = 1;
    }

    console.log(`Current Episode: ${currentEpisode}, Current Quality: ${currentQuality}, Current Voice: ${currentVoice}`);
    const currentTime = player.currentTime();
    const isPaused = player.paused();

    // Формирование пути к видео с использованием отформатированного названия аниме
    const videoPath = `source/server/anime/${formattedAnimeName}/${currentVoice}/${currentEpisode}/${currentQuality}/output.m3u8`;
    console.log(`Video Path: ${videoPath}`);

    player.src({
        src: videoPath,
        type: 'application/x-mpegURL'
    });

    player.one('loadedmetadata', () => {
        if (currentEpisode !== player.currentEpisode) {
            player.currentTime(0); // Сбрасываем время на 0, если это новая серия
        } else {
            player.currentTime(currentTime); // Иначе восстанавливаем время
        }

        // Обновляем состояние кнопок после загрузки метаданных
        const playBtn = document.querySelector(SELECTORS.PLAYER_PLAY);
        const stopBtn = document.querySelector(SELECTORS.PLAYER_STOP);

        if (player.paused()) {
            playBtn.style.display = 'block';
            stopBtn.style.display = 'none';
        } else {
            playBtn.style.display = 'none';
            stopBtn.style.display = 'block';
        }
    });

    player.currentEpisode = currentEpisode; // Сохраняем текущую серию
}

// Проверяем, включено ли автовоспроизведение в localStorage
let isAutoplayEnabled = localStorage.getItem('autoplayEnabled') === 'true';

// Обновляем состояние кнопки автовоспроизведения
const autoplayButton = document.querySelector('.setting');
if (autoplayButton) {
    if (isAutoplayEnabled) {
        autoplayButton.classList.add('setting_active');
    } else {
        autoplayButton.classList.remove('setting_active');
    }
}

// Функция для переключения автовоспроизведения
function toggleAutoplay() {
    isAutoplayEnabled = !isAutoplayEnabled;
    localStorage.setItem('autoplayEnabled', isAutoplayEnabled);

    const autoplayButton = document.querySelector('.setting');
    if (autoplayButton) {
        autoplayButton.classList.toggle('setting_active', isAutoplayEnabled);
    }
}

// Добавляем обработчик для кнопки автовоспроизведения
document.querySelector('.setting').addEventListener('click', toggleAutoplay);

function playNextEpisode() {
    const nextEpisode = currentEpisode + 1;
    const nextEpisodeElement = document.querySelector(`${SELECTORS.EPISODE}[data-episode="${nextEpisode}"]`);

    if (nextEpisodeElement) {
        changeEpisode(nextEpisode);
        player.play(); // Автоматически запускаем воспроизведение следующей серии
    } else {
        console.log("Это последняя серия.");
        // Можно добавить уведомление пользователю, что это последняя серия
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Проверяем состояние автовоспроизведения в localStorage
    isAutoplayEnabled = localStorage.getItem('autoplayEnabled') === 'true';

    // Обновляем состояние кнопки автовоспроизведения
    const autoplayButton = document.querySelector('.setting');
    if (autoplayButton) {
        autoplayButton.classList.toggle('setting_active', isAutoplayEnabled);
    }
});

// Функция для смены серии
function changeEpisode(episode) {
    currentEpisode = parseInt(episode, 10);
    if (isNaN(currentEpisode)) {
        console.error("Invalid episode value:", episode);
        return;
    }

    // Сбрасываем время воспроизведения на 0 перед загрузкой нового источника
    player.currentTime(0);

    setVideoSource();

    const episodeElement = document.querySelector(`${SELECTORS.EPISODE}[data-episode="${episode}"]`);
    if (episodeElement) {
        document.querySelectorAll(SELECTORS.EPISODE).forEach(e => e.classList.remove("episode_active"));
        episodeElement.classList.add("episode_active");
    } else {
        console.error("Episode element not found for episode:", episode);
    }

    // Обновляем состояние кнопок
    const playBtn = document.querySelector(SELECTORS.PLAYER_PLAY);
    const stopBtn = document.querySelector(SELECTORS.PLAYER_STOP);

    if (player.paused()) {
        playBtn.style.display = 'block';
        stopBtn.style.display = 'none';
    } else {
        playBtn.style.display = 'none';
        stopBtn.style.display = 'block';
    }
}

// Функция для смены качества
function changeQuality(quality) {
    currentQuality = quality;
    setVideoSource();

    document.querySelectorAll(SELECTORS.QUALITY).forEach(q => q.classList.remove("quality-active"));
    const qualityElement = document.querySelector(`${SELECTORS.QUALITY}[data-quality="${quality}"]`);
    if (qualityElement) {
        qualityElement.classList.add("quality-active");
    } else {
        console.error("Quality element not found for quality:", quality);
    }

    const qualityMenu = document.querySelector(SELECTORS.QUALITY_MENU);
    if (qualityMenu) {
        qualityMenu.style.display = "none";
    } else {
        console.error("Quality menu not found");
    }
}

// Функция для смены озвучки
function changeVoice(voice) {
    currentVoice = voice;
    setVideoSource();

    document.querySelectorAll(SELECTORS.VOICE).forEach(v => v.classList.remove("voice_active"));
    const voiceElement = document.querySelector(`${SELECTORS.VOICE}[data-voice="${voice}"]`);
    if (voiceElement) {
        voiceElement.classList.add("voice_active");
    } else {
        console.error("Voice element not found for voice:", voice);
    }

    // Обновляем состояние кнопок
    const playBtn = document.querySelector(SELECTORS.PLAYER_PLAY);
    const stopBtn = document.querySelector(SELECTORS.PLAYER_STOP);

    if (player.paused()) {
        playBtn.style.display = 'block';
        stopBtn.style.display = 'none';
    } else {
        playBtn.style.display = 'none';
        stopBtn.style.display = 'block';
    }
}

// Обработчики для кнопок серий, качества и озвучки
document.querySelectorAll(SELECTORS.EPISODE).forEach(episodeBtn => {
    episodeBtn.addEventListener("click", event => {
        const episode = event.target.dataset.episode;
        if (episode) changeEpisode(episode);
    });
});

document.querySelectorAll(SELECTORS.QUALITY).forEach(qualityBtn => {
    qualityBtn.addEventListener("click", event => {
        const quality = event.target.dataset.quality;
        if (quality) changeQuality(quality);
    });
});

document.querySelectorAll(SELECTORS.VOICE).forEach(voiceBtn => {
    voiceBtn.addEventListener("click", event => {
        const voice = event.target.dataset.voice;
        if (voice) changeVoice(voice);
    });
});

// Устанавливаем начальный источник видео
setVideoSource();

// Функция для переключения воспроизведения
function togglePlay() {
    const playBtn = document.querySelector(SELECTORS.PLAYER_PLAY);
    const stopBtn = document.querySelector(SELECTORS.PLAYER_STOP);

    if (player.paused()) {
        player.play();
        playBtn.style.display = 'none';
        stopBtn.style.display = 'block';
    } else {
        player.pause();
        playBtn.style.display = 'block';
        stopBtn.style.display = 'none';
    }
}

// Получаем элемент видео
const videoElement = document.querySelector(SELECTORS.VIDEO_CONTAINER);

// Добавляем обработчик события click
videoElement.addEventListener('click', () => {
    togglePlay();
});

player.on('ended', () => {
    const playBtn = document.querySelector(SELECTORS.PLAYER_PLAY);
    const stopBtn = document.querySelector(SELECTORS.PLAYER_STOP);

    if (playBtn && stopBtn) {
        playBtn.style.display = 'block';
        stopBtn.style.display = 'none';
    }

    // Проверяем, включено ли автовоспроизведение
    if (isAutoplayEnabled) {
        playNextEpisode();
    }
});

// Обработчики для прогресс-бара
const progressContainer = document.querySelector(SELECTORS.PROGRESS_CONTAINER);
const progressBar = document.querySelector(SELECTORS.PROGRESS_BAR);
let isDragging = false;

function seek(event) {
    const rect = progressContainer.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    player.currentTime(percent * player.duration());
}

progressContainer.addEventListener('mousedown', event => { isDragging = true; seek(event); });
document.addEventListener('mousemove', event => { if (isDragging) seek(event); });
document.addEventListener('mouseup', () => { isDragging = false; });

player.on('timeupdate', () => {
    progressBar.style.width = (player.currentTime() / player.duration()) * 100 + '%';
});

// Обработчики для управления громкостью
document.addEventListener("DOMContentLoaded", () => {
    const volumeContainer = document.querySelector(SELECTORS.VOLUME_CONTAINER);
    const volumeSlider = document.querySelector(SELECTORS.VOLUME_SLIDER);
    const thumb = document.querySelector(SELECTORS.VOLUME_THUMB);
    let isDragging = false;

    volumeSlider.addEventListener("click", event => {
        updateVolume((volumeSlider.getBoundingClientRect().bottom - event.clientY) / volumeSlider.clientHeight);
    });

    thumb.addEventListener("mousedown", event => { isDragging = true; event.preventDefault(); });
    document.addEventListener("mousemove", event => { if (isDragging) updateVolume((volumeSlider.getBoundingClientRect().bottom - event.clientY) / volumeSlider.clientHeight); });
    document.addEventListener("mouseup", () => { isDragging = false; });

    volumeContainer.addEventListener("wheel", event => {
        event.preventDefault();
        updateVolume(volumeLevel + (event.deltaY > 0 ? -0.05 : 0.05));
    });

    volumeContainer.addEventListener("mouseenter", () => { volumeSlider.style.display = "block"; });
    volumeContainer.addEventListener("mouseleave", event => {
        if (!volumeSlider.contains(event.relatedTarget)) volumeSlider.style.display = "none";
    });
});

// Функция для переключения меню качества
function toggleQualityMenu() {
    const menu = document.querySelector(SELECTORS.QUALITY_MENU);
    if (menu) menu.style.display = menu.style.display === "block" ? "none" : "block";
}

// Функция для переключения полноэкранного режима
function toggleFullScreen() {
    const playerBox = document.querySelector(SELECTORS.PLAYER_BOX);
    if (!document.fullscreenElement) {
        playerBox.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

document.addEventListener("fullscreenchange", () => {
    const playerBox = document.querySelector(SELECTORS.PLAYER_BOX);
    const video = document.querySelector(`${SELECTORS.PLAYER_BOX} video`);

    if (document.fullscreenElement === playerBox) {
        video.style.width = "100vw";
        video.style.height = "100vh";
        video.style.objectFit = "cover";
    } else {
        video.style.width = "";
        video.style.height = "";
        video.style.objectFit = "";
    }
});

function updateVolume(level) {
    volumeLevel = Math.max(0, Math.min(1, level)); // Ограничиваем уровень громкости от 0 до 1
    const fill = document.querySelector(SELECTORS.VOLUME_FILL);
    const thumb = document.querySelector(SELECTORS.VOLUME_THUMB);

    if (fill && thumb) {
        fill.style.height = thumb.style.bottom = `${volumeLevel * 100}%`;
        player.volume(volumeLevel); // Устанавливаем громкость для плеера
    }
}

// Флаг для отслеживания состояния клавиши пробела
let isSpaceKeyPressed = false;

// Обработчики для горячих клавиш
document.addEventListener("keydown", event => {
    if (["INPUT", "TEXTAREA"].includes(event.target.tagName)) return;

    const keyActions = {
        "Space": () => {
            if (!isSpaceKeyPressed) { // Проверяем, не нажат ли уже пробел
                togglePlay();
                isSpaceKeyPressed = true; // Устанавливаем флаг, что пробел нажат
            }
        },
        "ArrowLeft": () => player.currentTime(player.currentTime() - 5),
        "ArrowRight": () => player.currentTime(player.currentTime() + 5),
        "ArrowUp": () => updateVolume(volumeLevel + 0.05),
        "ArrowDown": () => updateVolume(volumeLevel - 0.05),
        "KeyF": () => toggleFullScreen(),
        "KeyM": () => player.muted(!player.muted())
    };

    if (keyActions[event.code]) {
        event.preventDefault();
        keyActions[event.code]();
    }
});

// Сбрасываем флаг, когда клавиша пробела отпущена
document.addEventListener("keyup", event => {
    if (event.code === "Space") {
        isSpaceKeyPressed = false; // Сбрасываем флаг
    }
});

// Функция для переключения Picture-in-Picture
function togglePiP() {
    const video = document.querySelector('video');

    if (!video) {
        console.error("Видео не найдено!");
        return;
    }

    if (!document.pictureInPictureEnabled) {
        console.error("Ваш браузер не поддерживает Picture-in-Picture.");
        return;
    }

    if (video.readyState < 2) {
        console.error("Видео ещё не загружено.");
        return;
    }

    if (!document.pictureInPictureElement) {
        video.requestPictureInPicture().catch(error => {
            console.error("Ошибка включения PiP:", error);
        });
    } else {
        document.exitPictureInPicture();
    }
}

// Управление видимостью курсора и контролов
let timeout;
const playerBlock = document.querySelector(SELECTORS.PLAYER_BLOCK);
const customControls = document.querySelector(SELECTORS.CUSTOM_CONTROLS);
const videoContainer = document.querySelector(SELECTORS.VIDEO_CONTAINER);

function hideCursorAndControls() {
    document.body.style.cursor = 'none';
    customControls.style.opacity = '0';
    customControls.style.visibility = 'hidden';
}

function showCursorAndControls() {
    document.body.style.cursor = 'default';
    customControls.style.opacity = '1';
    customControls.style.visibility = 'visible';
    resetTimer();
}

function resetTimer() {
    clearTimeout(timeout);
    timeout = setTimeout(hideCursorAndControls, 3000);
}

document.addEventListener('mousemove', showCursorAndControls);
document.addEventListener('keydown', showCursorAndControls);
document.addEventListener('click', showCursorAndControls);

document.addEventListener('mouseleave', hideCursorAndControls);
videoContainer.addEventListener('play', resetTimer);
videoContainer.addEventListener('pause', showCursorAndControls);

resetTimer();

// Функция для поиска серии
function searchEpisode() {
    const searchInput = document.querySelector('.search_series_block input');
    const episodeButtons = document.querySelectorAll('.episode');

    searchInput.addEventListener('input', function() {
        const searchValue = this.value.trim();

        // Сбрасываем выделение всех серий
        episodeButtons.forEach(button => {
            button.classList.remove('episode_active');
        });

        // Если поле поиска не пустое, ищем серию
        if (searchValue !== '') {
            const foundEpisode = Array.from(episodeButtons).find(button => {
                return button.textContent.trim() === searchValue;
            });

            // Если серия найдена, выделяем её
            if (foundEpisode) {
                foundEpisode.classList.add('episode_active');
                foundEpisode.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            // Если поле поиска пустое, выделяем текущую серию
            const currentEpisodeButton = document.querySelector(`.episode[data-episode="${currentEpisode}"]`);
            if (currentEpisodeButton) {
                currentEpisodeButton.classList.add('episode_active');
                currentEpisodeButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    });
}

// Вызываем функцию поиска при загрузке страницы
document.addEventListener("DOMContentLoaded", () => {
    searchEpisode();
});

document.addEventListener('DOMContentLoaded', function() {
    const episodeContainer = document.getElementById('episodeContainer');
    const prevButton = document.getElementById('prevSeries');
    const nextButton = document.getElementById('nextSeries');
    const episodeBlock = document.getElementById('episodeBlock');
    const episodeWidth = 45 + 10; // Ширина эпизода + margin-right
    const visibleEpisodes = Math.floor(episodeBlock.offsetWidth / episodeWidth);
    let scrollPosition = 0;

    prevButton.addEventListener('click', function() {
        scrollPosition = Math.max(scrollPosition - episodeWidth * visibleEpisodes, 0);
        episodeContainer.style.transform = `translateX(-${scrollPosition}px)`;
    });

    nextButton.addEventListener('click', function() {
        const maxScroll = episodeContainer.scrollWidth - episodeBlock.offsetWidth;
        scrollPosition = Math.min(scrollPosition + episodeWidth * visibleEpisodes, maxScroll);
        episodeContainer.style.transform = `translateX(-${scrollPosition}px)`;
    });
});


// Функция для отправки данных на сервер
function sendWatchedEpisodeToServer(episodeData) {
    const url = 'https://ваш-сервер.com/api/watched-episodes'; // Замените на ваш URL
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(episodeData) // Отправляем данные в формате JSON
    };

    fetch(url, options)
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка сети или сервера');
            }
            return response.json(); // Парсим JSON-ответ
        })
        .then(data => {
            console.log('Данные успешно отправлены на сервер:', data);
        })
        .catch(error => {
            console.error('Ошибка при отправке данных:', error);
        });
}

// Функция для проверки, просмотрено ли 25% серии
function checkIfEpisodeWatched() {
    const duration = player.duration(); // Общая продолжительность видео
    const currentTime = player.currentTime(); // Текущее время воспроизведения

    // Проверяем, просмотрено ли 25% или более
    if (currentTime >= duration * 0.01) {
        // Формируем объект для записи
        const episodeData = {
            name: formattedAnimeName,
            voice: currentVoice,
            episode: currentEpisode
        };

        // Получаем массив завершенных серий из localStorage
        let watchedEpisodes = JSON.parse(localStorage.getItem('watchedEpisodes')) || [];

        // Проверяем, есть ли уже такая запись в массиве
        const isAlreadyWatched = watchedEpisodes.some(episode =>
            episode.name === episodeData.name &&
            episode.voice === episodeData.voice &&
            episode.episode === episodeData.episode
        );

        if (!isAlreadyWatched) {
            // Добавляем запись в массив
            watchedEpisodes.push(episodeData);

            // Сохраняем обновленный массив в localStorage
            localStorage.setItem('watchedEpisodes', JSON.stringify(watchedEpisodes));

            // Отправляем данные на сервер
            sendWatchedEpisodeToServer(episodeData);

            // Показываем уведомление
            alert(`Серия "${episodeData.name} ${episodeData.voice} ${episodeData.episode}" завершена на 25% и добавлена в список просмотренных!`);
            console.log(`Серия "${episodeData.name} ${episodeData.voice} ${episodeData.episode}" завершена на 25% и добавлена в список просмотренных.`);
        }

        // Убираем обработчик, чтобы уведомление не показывалось повторно
        player.off('timeupdate', checkIfEpisodeWatched);
    }
}

// Добавляем обработчик события timeupdate
player.on('timeupdate', checkIfEpisodeWatched);

// При загрузке страницы восстанавливаем массив из localStorage
document.addEventListener('DOMContentLoaded', () => {
    const watchedEpisodes = JSON.parse(localStorage.getItem('watchedEpisodes')) || [];
    console.log('Просмотренные серии:', watchedEpisodes);
});