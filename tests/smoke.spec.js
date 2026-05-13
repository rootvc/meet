import { test, expect } from '@playwright/test'

// Track any console errors and uncaught exceptions per-test so we can fail
// loudly when the app regresses, regardless of what the page renders.
function attachErrorCollectors(page) {
    const consoleErrors = []
    const pageErrors = []

    page.on('console', (msg) => {
        if (msg.type() === 'error') {
            consoleErrors.push(msg.text())
        }
    })
    page.on('pageerror', (err) => {
        pageErrors.push(err.message)
    })

    return { consoleErrors, pageErrors }
}

// We never want the tests to actually reach a Daily server. Block any
// outbound request to daily.co so the iframe creation is deterministic and
// the suite doesn't depend on a live room or VITE_DAILY_SUBDOMAIN.
test.beforeEach(async ({ context }) => {
    await context.route(/https:\/\/[^/]*\.daily\.co\//, (route) => route.abort())
})

test('home route renders without runtime errors', async ({ page }) => {
    const { consoleErrors, pageErrors } = attachErrorCollectors(page)

    const response = await page.goto('/')
    expect(response?.ok()).toBeTruthy()

    // The Home component renders an empty <div />, so we just assert the
    // root mounted and there were no errors.
    await expect(page.locator('#root')).toBeAttached()
    await expect(page).toHaveTitle(/Meeting Room/i)

    expect(pageErrors, 'no uncaught exceptions').toEqual([])
    expect(consoleErrors, 'no console errors').toEqual([])
})

test('room route plays intro animation and shows name prompt', async ({ page }) => {
    const { pageErrors } = attachErrorCollectors(page)

    await page.goto('/test-room')

    // Initial CLI line is the ssh prompt.
    await expect(page.getByText('ssh daily.root.vc/test-room')).toBeVisible()

    // Intro animation eventually shows the "Enter your name:" prompt.
    await expect(page.getByText('Enter your name:')).toBeVisible({ timeout: 5000 })

    // The hidden CLI input is focused so the user can type immediately.
    const input = page.locator('input.cli-input')
    await expect(input).toBeFocused()

    expect(pageErrors).toEqual([])
})

test('submitting a name mounts the Daily call iframe', async ({ page }) => {
    await page.goto('/test-room')

    // Wait for the name input to be ready.
    await expect(page.getByText('Enter your name:')).toBeVisible({ timeout: 5000 })

    const input = page.locator('input.cli-input')
    await input.fill('Alice')
    await input.press('Enter')

    // "Joining call..." line appears during the transition.
    await expect(page.getByText('Joining call...')).toBeVisible()

    // The Daily prebuilt iframe is appended into our #frame container.
    const dailyIframe = page.locator('#frame iframe')
    await expect(dailyIframe).toBeAttached({ timeout: 10_000 })

    // The iframe should target the configured daily.co room URL. We don't
    // assert the subdomain because it varies per environment, but we do
    // assert the room slug ("meet-test-room") is encoded in the URL.
    await expect(dailyIframe).toHaveAttribute('src', /\.daily\.co\/meet-test-room/)
})
