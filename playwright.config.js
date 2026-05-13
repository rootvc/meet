import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: process.env.CI ? 'github' : 'list',
    use: {
        baseURL: BASE_URL,
        trace: 'retain-on-failure',
    },
    projects: [
        // Default project: smoke + visual regression. Daily traffic is mocked
        // inside the specs, so no network access or credentials are required.
        {
            name: 'chromium',
            testIgnore: [/e2e\.spec\.js/, /screenshots\.spec\.js/, /prod-verify\.spec\.js/],
            use: { ...devices['Desktop Chrome'] },
        },
        // True end-to-end project: actually joins a real Daily room. Requires
        // VITE_DAILY_SUBDOMAIN to be set, and uses Chrome's fake media flags
        // so the browser doesn't need a real camera or mic.
        {
            name: 'e2e',
            testMatch: [/e2e\.spec\.js/, /screenshots\.spec\.js/],
            testIgnore: /prod-verify\.spec\.js/,
            use: {
                ...devices['Desktop Chrome'],
                permissions: ['camera', 'microphone'],
                launchOptions: {
                    args: [
                        '--use-fake-ui-for-media-stream',
                        '--use-fake-device-for-media-stream',
                        '--autoplay-policy=no-user-gesture-required',
                    ],
                },
            },
        },
    ],
    webServer: {
        // Build then serve preview, so we exercise the production bundle exactly.
        command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        stdout: 'pipe',
        stderr: 'pipe',
    },
})
