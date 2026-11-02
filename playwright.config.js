// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests',
    testMatch: /.*\.spec\.js/,
    timeout: 30000,
    retries: 1, // видео.js грузится с CDN — на медленной сети бывают таймауты
    reporter: [['list']],
    use: {
        baseURL: 'http://localhost:8080',
        reducedMotion: 'reduce',
    },
    webServer: {
        command: 'npx http-server . -p 8080 -c-1 --silent',
        url: 'http://localhost:8080/index.html',
        reuseExistingServer: true,
    },
    projects: [
        { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
        { name: 'mobile', use: { ...devices['Pixel 5'], viewport: { width: 390, height: 780 } } },
    ],
});
