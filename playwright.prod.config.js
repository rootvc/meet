import { defineConfig, devices } from '@playwright/test'

// Lightweight config for running the prod-verify spec against the deployed
// site. We intentionally don't share the regular config because that one
// boots a local Vite preview server, which we don't need (and would conflict
// with) when hitting the production URL directly.

export default defineConfig({
    testDir: './tests',
    testMatch: /prod-verify\.spec\.js/,
    timeout: 180_000,
    reporter: 'list',
    use: {
        trace: 'retain-on-failure',
    },
    projects: [
        {
            name: 'prod',
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
})
