// Основные пользовательские сценарии AnimeBox (desktop + mobile проекты).
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

const PAGES = ['welcome', 'login', 'register', 'main', 'anime', 'profile', 'player'];

test('вход: welcome → форма с ошибками → главная', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/welcome\.html/);
    await page.getByRole('link', { name: 'Начать просмотр' }).click();
    await expect(page).toHaveURL(/login\.html/);
    await page.waitForLoadState('load');

    await page.getByRole('button', { name: 'Войти' }).click();
    await expect(page.locator('#loginNickError')).toHaveText('Заполните это поле.');
    await expect(page.locator('#loginNick')).toBeFocused();

    await page.getByLabel('Никнейм').fill('wile');
    await page.getByLabel('Пароль').fill('123');
    await page.getByRole('button', { name: 'Войти' }).click();
    await expect(page.locator('#loginPassError')).toContainText('Минимум 6');

    await page.getByRole('button', { name: 'показать' }).click();
    await expect(page.getByLabel('Пароль')).toHaveAttribute('type', 'text');

    await page.getByLabel('Пароль').fill('123456');
    await page.getByRole('button', { name: 'Войти' }).click();
    await expect(page).toHaveURL(/main\.html/);
});

test('регистрация: несовпадающие пароли и неверный email', async ({ page }) => {
    await page.goto('/register.html');
    await page.getByLabel('Никнейм').fill('wile');
    await page.getByLabel('Email').fill('wile@');
    await page.getByLabel('Пароль', { exact: true }).fill('123456');
    await page.getByLabel('Повторите пароль').fill('654321');
    await page.getByRole('button', { name: 'Зарегистрироваться' }).click();
    await expect(page.locator('#regEmailError')).toContainText('email');
    await expect(page.locator('#regPass2Error')).toHaveText('Пароли не совпадают.');
});

test('главная → тайтл → плеер, меню и «скоро»', async ({ page }) => {
    await page.goto('/main.html');
    await page.getByRole('link', { name: 'Смотреть' }).click();
    await expect(page).toHaveURL(/anime\.html/);
    await page.getByRole('link', { name: /Смотреть 1 серию/ }).click();
    await expect(page).toHaveURL(/player\.html/);
    await page.waitForLoadState('load');

    await expect(page.getByRole('link', { name: 'Плеер' })).toHaveAttribute('aria-current', 'page');
    await page.getByRole('button', { name: /Каталог/ }).click();
    await expect(page.locator('.toast')).toContainText('Каталог');

    await page.getByRole('link', { name: 'Профиль' }).click();
    await expect(page).toHaveURL(/profile\.html/);
});

test('оценка тайтла с клавиатуры сохраняется', async ({ page }) => {
    await page.goto('/anime.html');
    await page.locator('#star1').focus();
    await page.keyboard.press('Space');
    for (let i = 0; i < 7; i++) await page.keyboard.press('ArrowRight');
    await expect(page.locator('#rating-value')).toHaveText('8 из 10');
    await page.reload();
    await expect(page.locator('#rating-value')).toHaveText('8 из 10');
});

test('вкладки профиля', async ({ page }) => {
    await page.goto('/profile.html');
    await page.getByRole('tab', { name: 'отслеживаю' }).click();
    await expect(page.getByRole('tab', { name: 'отслеживаю' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.group_title')).toHaveText('отслеживаю');
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'прогресс просмотра' })).toBeFocused();
});

test('плеер: демо-фолбэк, серии, качество, поиск', async ({ page }) => {
    await page.goto('/player.html');
    await expect(page.locator('.player_status')).toContainText('Демо-режим');
    await expect.poll(() => page.evaluate(() => player.currentSrc())).toContain('op_kinok1.mp4');

    await page.getByRole('button', { name: 'Серия 3', exact: true }).click();
    await expect(page.locator('#nowEpisode')).toHaveText('3');
    await expect(page.getByRole('button', { name: 'Серия 3', exact: true })).toHaveAttribute('aria-current', 'true');

    await page.getByRole('button', { name: 'Качество' }).click();
    await expect(page.locator('.quality-menu')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.quality-menu')).toBeHidden();

    await page.getByLabel('Найти серию по номеру').fill('12');
    await page.keyboard.press('Enter');
    await expect(page.locator('#nowEpisode')).toHaveText('12');

    await page.getByRole('button', { name: 'Озвучка' }).first().isVisible().catch(() => {});
    await page.getByRole('button', { name: 'AmiDub' }).click();
    await expect(page.locator('#nowVoice')).toHaveText('AmiDub');
});

test('модалка «Сообщить о проблеме»: валидация, Esc, возврат фокуса', async ({ page, isMobile }) => {
    await page.goto('/main.html');
    const opener = isMobile
        ? page.locator('.footer-report')
        : page.getByRole('button', { name: 'Сообщить о проблеме' }).first();
    await opener.click();
    const dialog = page.getByRole('dialog', { name: 'Сообщить о проблеме' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Отправить' }).click();
    await expect(dialog.locator('#reportError')).toContainText('10 символах');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
});

for (const name of PAGES) {
    test(`${name}: без горизонтального скролла, ошибок JS и серьёзных нарушений axe`, async ({ page }) => {
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        await page.goto(`/${name}.html`);
        await page.waitForLoadState('load');

        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow).toBeLessThanOrEqual(1);
        expect(errors).toEqual([]);

        const { violations } = await new AxeBuilder({ page }).analyze();
        const serious = violations.filter(v => ['serious', 'critical'].includes(v.impact)).map(v => `${v.id} ×${v.nodes.length}`);
        expect(serious).toEqual([]);
    });
}
