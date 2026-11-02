// Прогон аудита: скриншоты на всех ширинах + метрики вёрстки, консоль, сеть, axe.
// Запуск: node tests/audit-run.mjs <label>   (сервер должен работать на :8080)
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import path from 'node:path';

const label = process.argv[2] || 'current';
const BASE = process.env.BASE_URL || 'http://localhost:8080';
const PAGES = ['index', 'welcome', 'login', 'register', 'main', 'anime', 'profile', 'player'];
const WIDTHS = [360, 390, 768, 1024, 1440];
const outDir = path.join('audit', 'screenshots', label);
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const report = {};

for (const name of PAGES) {
    report[name] = {};
    for (const width of WIDTHS) {
        const isMobile = width < 768;
        const context = await browser.newContext({
            viewport: { width, height: isMobile ? 780 : 900 },
            hasTouch: isMobile,
            isMobile,
            reducedMotion: 'reduce',
        });
        const page = await context.newPage();
        const errors = [];
        const failed = [];
        page.on('pageerror', e => errors.push(e.message));
        page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
        page.on('response', r => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url().replace(BASE, '')}`); });
        page.on('requestfailed', r => failed.push(`FAILED ${r.url().replace(BASE, '')}`));

        const resp = await page.goto(`${BASE}/${name}.html`, { waitUntil: 'load' }).catch(e => null);
        if (!resp || resp.status() >= 400) {
            report[name][width] = { missing: true, status: resp?.status() };
            await context.close();
            continue;
        }
        await page.waitForTimeout(1800); // анимации загрузочного экрана

        const metrics = await page.evaluate(() => {
            const doc = document.documentElement;
            const vw = window.innerWidth;
            // Элементы, выходящие за правый край вьюпорта
            const overflowing = [...document.querySelectorAll('body *')]
                .filter(el => {
                    const r = el.getBoundingClientRect();
                    const cs = getComputedStyle(el);
                    return r.width > 0 && r.right > vw + 1 && cs.position !== 'fixed' && cs.visibility !== 'hidden';
                })
                .slice(0, 8)
                .map(el => `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''} (${Math.round(el.getBoundingClientRect().right)}px)`);
            // Интерактивные элементы меньше 44×44
            const interactive = [...document.querySelectorAll('a[href], button, input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])')]
                .filter(el => { const r = el.getBoundingClientRect(); return r.width > 1 && r.height > 1; });
            const small = interactive.filter(el => {
                const r = el.getBoundingClientRect();
                return el.type !== 'range' && (r.width < 44 || r.height < 44) && !(el.tagName === 'INPUT' && r.height >= 44);
            });
            const bodyStyle = getComputedStyle(document.body);
            return {
                scrollWidth: doc.scrollWidth,
                horizontalOverflow: doc.scrollWidth > vw + 1,
                contentHeight: doc.scrollHeight,
                bodyOverflowHidden: bodyStyle.overflow === 'hidden' || bodyStyle.overflowY === 'hidden',
                clippedVertically: (bodyStyle.overflow === 'hidden' || bodyStyle.overflowY === 'hidden') && document.body.scrollHeight > window.innerHeight + 4,
                overflowing,
                interactiveCount: interactive.length,
                smallTargets: small.length,
                smallTargetSamples: small.slice(0, 5).map(el => `${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]} ${Math.round(el.getBoundingClientRect().width)}×${Math.round(el.getBoundingClientRect().height)}`),
                minFontPx: Math.min(...[...document.querySelectorAll('body *')]
                    .filter(el => el.childNodes.length && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()))
                    .map(el => parseFloat(getComputedStyle(el).fontSize))),
            };
        });

        await page.screenshot({ path: path.join(outDir, `${name}-${width}.png`), fullPage: true });

        let axe = null;
        if (width === 1440 || width === 390) {
            const res = await new AxeBuilder({ page }).analyze();
            axe = res.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help }));
        }

        report[name][width] = { ...metrics, errors: [...new Set(errors)], failed: [...new Set(failed)], axe };
        await context.close();
    }
}

await browser.close();
fs.writeFileSync(path.join('audit', `report-${label}.json`), JSON.stringify(report, null, 2));

// Краткая сводка в консоль
for (const [name, byWidth] of Object.entries(report)) {
    for (const [w, r] of Object.entries(byWidth)) {
        if (r.missing) { console.log(`${name}@${w}: MISSING (${r.status})`); continue; }
        console.log(`${name}@${w}: hscroll=${r.horizontalOverflow ? r.scrollWidth : 'no'} clipped=${r.clippedVertically} small=${r.smallTargets}/${r.interactiveCount} minFont=${r.minFontPx} err=${r.errors.length} 404=${r.failed.length}${r.axe ? ' axe=' + r.axe.map(a => `${a.id}(${a.nodes})`).join(',') : ''}`);
    }
}
