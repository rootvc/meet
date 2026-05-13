import { test, expect } from '@playwright/test'
import { expectIframeFillsCallArea } from './_helpers.js'

// Block real Daily traffic — we only care about whether *our* layout positions
// the iframe element correctly. Whether the call connects is covered elsewhere.
test.beforeEach(async ({ context }) => {
    await context.route(/https:\/\/[^/]*\.daily\.co\//, (route) => route.abort())
})

async function reachCallView(page) {
    await page.goto('/test-room')
    await expect(page.getByText('Enter your name:')).toBeVisible({ timeout: 10_000 })
    const input = page.locator('input.cli-input')
    await input.fill('Layout Bot')
    await input.press('Enter')
    // Wait for the iframe to actually be in the DOM.
    await expect(page.locator('#frame iframe')).toBeAttached({ timeout: 10_000 })
}

test.describe('Daily call iframe layout', () => {
    test('fills the call area on desktop (1280x800)', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 })
        await reachCallView(page)

        const layout = await expectIframeFillsCallArea(page)

        // Spot-check the absolute numbers given the known CSS:
        //   header = 45px, footer = 35px → iframe should be 1280×720 at (0, 45)
        expect(layout.iframe.width).toBe(1280)
        expect(layout.iframe.height).toBe(720)
        expect(layout.iframe.top).toBe(45)
        expect(layout.iframe.left).toBe(0)
    })

    test('fills the call area on a wide desktop (1920x1080)', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 })
        await reachCallView(page)

        const layout = await expectIframeFillsCallArea(page)

        expect(layout.iframe.width).toBe(1920)
        expect(layout.iframe.height).toBe(1000) // 1080 - 45 - 35
    })

    test('fills the call area on mobile (390x844)', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 })
        await reachCallView(page)

        const layout = await expectIframeFillsCallArea(page)

        // Mobile breakpoint shrinks header (40px) and footer (32px).
        expect(layout.iframe.width).toBe(390)
        expect(layout.iframe.height).toBe(844 - 40 - 32)
    })

    test('iframe resizes correctly when the viewport changes', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 })
        await reachCallView(page)
        await expectIframeFillsCallArea(page)

        // Shrink to a smaller window; iframe must reflow.
        await page.setViewportSize({ width: 1024, height: 600 })
        const after = await expectIframeFillsCallArea(page)
        expect(after.iframe.width).toBe(1024)
        expect(after.iframe.height).toBe(600 - 45 - 35)
    })
})
