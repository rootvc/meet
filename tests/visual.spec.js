import { test, expect } from '@playwright/test'

// Block real Daily traffic just like the smoke suite.
test.beforeEach(async ({ context }) => {
    await context.route(/https:\/\/[^/]*\.daily\.co\//, (route) => route.abort())
})

// Helper that loads a page with:
//  - a frozen system clock (so the footer timestamp is deterministic)
//  - all CSS animations / transitions disabled (so the cursor blink and
//    intro typing animation don't cause snapshot flakiness)
async function loadDeterministic(page, path) {
    // Pin time before any app code executes. The page reads `new Date()` /
    // `Date.now()` for the footer timestamp via dayjs.
    await page.clock.install({ time: new Date('2024-06-15T12:34:56Z') })

    await page.addInitScript(() => {
        const style = document.createElement('style')
        style.textContent = `
            *, *::before, *::after {
                animation: none !important;
                transition: none !important;
                caret-color: transparent !important;
            }
        `
        // Inject as early as possible so the cursor never blinks.
        const inject = () => document.head?.appendChild(style)
        if (document.head) inject()
        else document.addEventListener('DOMContentLoaded', inject, { once: true })
    })

    await page.goto(path)
}

test.describe('visual regression', () => {
    test('intro / name-prompt CLI view (desktop)', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 })
        await loadDeterministic(page, '/test-room')

        // Skip the intro typing animation by fast-forwarding the fake clock
        // past the 1800ms timeout that reveals the name prompt.
        await page.clock.fastForward(2500)
        await expect(page.getByText('Enter your name:')).toBeVisible()

        await expect(page).toHaveScreenshot('cli-prompt-desktop.png', {
            fullPage: true,
            // Allow tiny anti-aliasing/font-rendering diffs across machines.
            maxDiffPixelRatio: 0.01,
        })
    })

    test('intro / name-prompt CLI view (mobile)', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 })
        await loadDeterministic(page, '/test-room')

        await page.clock.fastForward(2500)
        await expect(page.getByText('Enter your name:')).toBeVisible()

        await expect(page).toHaveScreenshot('cli-prompt-mobile.png', {
            fullPage: true,
            maxDiffPixelRatio: 0.01,
        })
    })

    test('call view header + footer (desktop)', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 })
        await loadDeterministic(page, '/test-room')

        // Reach the call phase.
        await page.clock.fastForward(2500)
        const input = page.locator('input.cli-input')
        await input.fill('Alice')
        await input.press('Enter')
        await page.clock.fastForward(1000)

        // Header is rendered once the call phase starts.
        await expect(page.locator('header.header')).toBeVisible()

        // Wait for the brand mark image to actually finish loading and have
        // non-zero intrinsic dimensions, otherwise the screenshot races the
        // network request and the logo would render as an empty box.
        await expect
            .poll(
                () =>
                    page.locator('a.brand-mark img').evaluate((img) =>
                        img.complete && img.naturalWidth > 0 ? 'loaded' : 'pending'
                    ),
                { timeout: 5000 }
            )
            .toBe('loaded')

        // Hide the Daily iframe so we only snapshot our chrome (header +
        // footer). The iframe's blocked-load state is environment-dependent.
        await page.addStyleTag({ content: '#frame iframe { visibility: hidden !important; }' })

        await expect(page).toHaveScreenshot('call-chrome-desktop.png', {
            fullPage: true,
            maxDiffPixelRatio: 0.01,
        })
    })
})
