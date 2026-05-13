import { test, expect } from '@playwright/test'
import { readFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
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

const SHOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'screenshots')
mkdirSync(SHOT_DIR, { recursive: true })

test.describe('walkthrough screenshots', () => {
    test.skip(
        !SUBDOMAIN || !DAILY_API_KEY,
        'Need VITE_DAILY_SUBDOMAIN and DAILY_API_KEY to capture the full flow'
    )

    test.setTimeout(180_000)

    test.beforeAll(async () => {
        await ensureTestRoom(DAILY_API_KEY)
    })

    test('capture every screen in the user flow', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 })

        // Disable the cursor-blink animation so screenshots don't wait forever
        // for "stability" — page.screenshot() waits for layout to be stable
        // and any pulsing element can make Playwright time out.
        await page.addInitScript(() => {
            const style = document.createElement('style')
            style.textContent = `
                *, *::before, *::after {
                    animation: none !important;
                    caret-color: transparent !important;
                }
            `
            const inject = () => document.head?.appendChild(style)
            if (document.head) inject()
            else document.addEventListener('DOMContentLoaded', inject, { once: true })
        })

        const roomSlug = TEST_ROOM_SLUG

        // 1. The very first thing the user sees — `ssh daily.root.vc/<room>`
        //    just after navigation, before the "Connecting..." line shows up.
        await page.goto(`/${roomSlug}`)
        await expect(page.getByText('ssh daily.root.vc/' + roomSlug)).toBeVisible()
        await page.screenshot({
            path: resolve(SHOT_DIR, '01-cli-connect.png'),
            animations: 'disabled',
            caret: 'hide',
        })

        // 2. "Connecting to daily.root.vc/<room>..." line appears.
        await expect(
            page.getByText(`Connecting to daily.root.vc/${roomSlug}...`)
        ).toBeVisible()
        await page.screenshot({
            path: resolve(SHOT_DIR, '02-cli-connecting.png'),
            animations: 'disabled',
            caret: 'hide',
        })

        // 3. Name input prompt visible, ready for the user to type.
        await expect(page.getByText('Enter your name:')).toBeVisible({ timeout: 5000 })
        await page.screenshot({
            path: resolve(SHOT_DIR, '03-name-prompt.png'),
            animations: 'disabled',
            caret: 'hide',
        })

        // 4. User has typed their name into the (hidden) input — it appears
        //    inline after the "Enter your name:" prompt.
        const input = page.locator('input.cli-input')
        await input.fill('Alice')
        await expect(page.locator('.cli-input-text')).toContainText('Alice')
        await page.screenshot({
            path: resolve(SHOT_DIR, '04-name-typed.png'),
            animations: 'disabled',
            caret: 'hide',
        })

        // 5. User pressed Enter — "Joining call..." line appears.
        await input.press('Enter')
        await expect(page.getByText('Joining call...')).toBeVisible()
        await page.screenshot({
            path: resolve(SHOT_DIR, '05-joining.png'),
            animations: 'disabled',
            caret: 'hide',
        })

        // 6. Call frame has mounted but Daily prebuilt is still loading.
        const frame = page.locator('#frame')
        await expect(frame).toBeAttached({ timeout: 10_000 })
        await expect(frame).toHaveAttribute(
            'data-meeting-state',
            /loading|joining-meeting|joined-meeting/,
            { timeout: 20_000 }
        )
        await page.screenshot({
            path: resolve(SHOT_DIR, '06-call-loading.png'),
            animations: 'disabled',
            caret: 'hide',
        })

        // 7. Fully joined — Daily prebuilt UI is now interactive inside the
        //    iframe. This is the screenshot that shows the actual call window.
        await expect(frame).toHaveAttribute('data-meeting-state', 'joined-meeting', {
            timeout: 90_000,
        })
        // Give Daily prebuilt a beat to finish painting its controls.
        await page.waitForTimeout(2500)
        await page.screenshot({
            path: resolve(SHOT_DIR, '07-call-joined.png'),
            animations: 'disabled',
            caret: 'hide',
        })

        // 8. Same call view at mobile size, to confirm responsive layout.
        await page.setViewportSize({ width: 390, height: 844 })
        await page.waitForTimeout(1000)
        await page.screenshot({
            path: resolve(SHOT_DIR, '08-call-joined-mobile.png'),
            animations: 'disabled',
            caret: 'hide',
        })
    })
})
