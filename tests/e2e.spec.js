import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { expectIframeFillsCallArea } from './_helpers.js'
import { ensureTestRoom, TEST_ROOM_SLUG } from './_room.js'

function readDotEnv() {
    const here = dirname(fileURLToPath(import.meta.url))
    try {
        const raw = readFileSync(resolve(here, '..', '.env'), 'utf8')
        const out = {}
        for (const line of raw.split('\n')) {
            const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
            if (m) out[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
        }
        return out
    } catch {
        return {}
    }
}

const env = readDotEnv()
const SUBDOMAIN = process.env.VITE_DAILY_SUBDOMAIN || env.VITE_DAILY_SUBDOMAIN
const DAILY_API_KEY = process.env.DAILY_API_KEY || env.DAILY_API_KEY

test.describe('true end-to-end (real Daily call)', () => {
    test.skip(!SUBDOMAIN, 'VITE_DAILY_SUBDOMAIN is not set; skipping real-call e2e')
    test.skip(
        !DAILY_API_KEY,
        'DAILY_API_KEY is required to ensure the persistent test room exists.\n' +
            'Get one from https://dashboard.daily.co/developers and add it to .env.'
    )

    // Make sure the dedicated, persistent test room exists. We do this once
    // per test run (not per test) so we don't churn Daily's API.
    test.beforeAll(async () => {
        await ensureTestRoom(DAILY_API_KEY)
    })

    // Daily prebuilt is heavy and can take several seconds to negotiate WebRTC
    // even with fake media, so give the test extra headroom.
    test.setTimeout(120_000)

    test('joins a real Daily meeting end-to-end', async ({ page }) => {
        const consoleErrors = []
        page.on('console', (msg) => {
            if (msg.type() === 'error') consoleErrors.push(msg.text())
        })

        await page.goto(`/${TEST_ROOM_SLUG}`)

        // Cycle through the CLI intro to the name prompt.
        await expect(page.getByText('Enter your name:')).toBeVisible({ timeout: 10_000 })

        const input = page.locator('input.cli-input')
        await input.fill('E2E Bot')
        await input.press('Enter')

        // The DailyCall component reflects daily-react's useMeetingState onto
        // a data attribute, so we can observe the call lifecycle from outside
        // the cross-origin Daily iframe.
        const frame = page.locator('#frame')
        await expect(frame).toBeAttached({ timeout: 15_000 })

        // Should transition through "joining-meeting"...
        await expect(frame).toHaveAttribute(
            'data-meeting-state',
            /joining-meeting|joined-meeting/,
            { timeout: 20_000 }
        )

        // ...and ultimately reach "joined-meeting".
        await expect(frame).toHaveAttribute('data-meeting-state', 'joined-meeting', {
            timeout: 90_000,
        })

        // No error should have been surfaced.
        await expect(frame).toHaveAttribute('data-error', '')

        // Sanity-check the iframe is pointing at the configured room.
        const dailyIframe = page.locator('#frame iframe')
        await expect(dailyIframe).toHaveAttribute(
            'src',
            new RegExp(`${SUBDOMAIN}\\.daily\\.co\\/meet-${TEST_ROOM_SLUG}`)
        )

        // Verify the iframe is rendered at the correct size + position.
        await expectIframeFillsCallArea(page)

        const ourErrors = consoleErrors.filter(
            (e) => !/daily\.co/.test(e) && !/WebRTC/i.test(e)
        )
        expect(ourErrors).toEqual([])
    })

    test('shows a clear error when the room does not exist', async ({ page }) => {
        // Hit a slug we know doesn't exist. The app should surface a real
        // error message instead of flickering forever.
        await page.goto('/this-room-should-not-exist-xyz-12345')

        // Reach the name prompt and submit.
        await expect(page.getByText('Enter your name:')).toBeVisible({ timeout: 10_000 })
        const input = page.locator('input.cli-input')
        await input.fill('E2E Bot')
        await input.press('Enter')

        // The error overlay should appear within the join-timeout window.
        const frame = page.locator('#frame')
        await expect(frame).toBeAttached({ timeout: 15_000 })
        await expect(frame).not.toHaveAttribute('data-error', '', { timeout: 30_000 })

        // Daily iframe should be torn down (or hidden) once the error is set.
        const errorBox = page.locator('.call-error')
        await expect(errorBox).toBeVisible()
        await expect(errorBox).toContainText(/does not exist|join/i)

        // Meeting state should NOT be cycling between joining/new \u2014 the
        // shouldCreateInstance guard prevents the frame from being recreated.
        const stateA = await frame.getAttribute('data-meeting-state')
        await page.waitForTimeout(2000)
        const stateB = await frame.getAttribute('data-meeting-state')
        // Either stays the same (we destroyed) or transitions to a terminal state.
        expect(['idle', stateA]).toContain(stateB)
    })
})
