// Stand-alone verification that runs against the *deployed* site rather
// than the local Vite preview. Triggered manually via:
//
//   PROD_URL=https://meet-root-vc.vercel.app \
//   PROD_ROOM=zodi \
//   npx playwright test tests/prod-verify.spec.js --project=e2e --config=tests/prod.config.js
//
// We don't want this in the regular test:all run because it depends on a
// publicly-reachable deployment and a real Daily room.

import { test, expect } from '@playwright/test'

const PROD_URL = process.env.PROD_URL
const ROOM_SLUG = process.env.PROD_ROOM || 'zodi'

test.describe('production verification', () => {
    test.skip(!PROD_URL, 'PROD_URL is not set; skipping prod verification')
    test.setTimeout(180_000)

    test('joins a real Daily call on the deployed site', async ({ page }) => {
        const consoleErrors = []
        page.on('console', (msg) => {
            if (msg.type() === 'error') consoleErrors.push(msg.text())
        })

        // 1. The deployed site is reachable.
        await page.goto(`${PROD_URL}/${ROOM_SLUG}`)
        await expect(page).toHaveTitle(/Meeting Room/i)

        // 2. The CLI intro reaches the name prompt.
        await expect(page.getByText('Enter your name:')).toBeVisible({ timeout: 15_000 })

        // 3. The ROOT/VENTURES wordmark is rendered and points at root.vc.
        const brand = page.locator('a.brand-mark')
        await expect(brand).toBeVisible()
        await expect(brand).toHaveAttribute('href', /^https:\/\/root\.vc/)

        // 4. Submit a name to enter the call view.
        const input = page.locator('input.cli-input')
        await input.fill('Prod Verify')
        await input.press('Enter')

        // 5. The Daily iframe mounts and (with fake media) reaches joined-meeting.
        const frame = page.locator('#frame')
        await expect(frame).toBeAttached({ timeout: 15_000 })

        // It should be the new daily-react path: data-meeting-state attribute exists.
        await expect(frame).toHaveAttribute(
            'data-meeting-state',
            /loading|joining-meeting|joined-meeting/,
            { timeout: 25_000 }
        )
        await expect(frame).toHaveAttribute('data-meeting-state', 'joined-meeting', {
            timeout: 90_000,
        })

        // 6. No error state, iframe is sized correctly.
        await expect(frame).toHaveAttribute('data-error', '')
        const dailyIframe = page.locator('#frame iframe')
        await expect(dailyIframe).toHaveAttribute(
            'src',
            new RegExp(`\\.daily\\.co\\/meet-${ROOM_SLUG}`)
        )

        const layout = await page.evaluate(() => {
            const iframe = document.querySelector('#frame iframe')
            const r = iframe.getBoundingClientRect()
            return { w: r.width, h: r.height, top: r.top }
        })
        // Width should match the viewport (allow ±2px for browser chrome).
        expect(Math.abs(layout.w - page.viewportSize().width)).toBeLessThanOrEqual(2)
        expect(layout.h).toBeGreaterThan(300)
        // Iframe should sit below the ~45px header (with some tolerance).
        expect(layout.top).toBeGreaterThan(30)
        expect(layout.top).toBeLessThan(60)

        // 7. No app-level console errors (we ignore Daily SDK chatter).
        const ourErrors = consoleErrors.filter(
            (e) => !/daily\.co/.test(e) && !/WebRTC/i.test(e)
        )
        expect(ourErrors).toEqual([])
    })
})
