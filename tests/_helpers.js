import { expect } from '@playwright/test'

/**
 * Verify the Daily prebuilt iframe is rendered at a sensible size and position:
 *  - Located inside #frame (between header and footer)
 *  - Full viewport width
 *  - Fills the available vertical space (viewport height minus header + footer)
 *  - Top edge sits directly under the header (no gap, no overlap)
 *
 * This catches regressions where the iframe collapses to 0×0, overlaps the
 * header/footer, or escapes its container.
 */
export async function expectIframeFillsCallArea(page) {
    const layout = await page.evaluate(() => {
        const iframe = document.querySelector('#frame iframe')
        const header = document.querySelector('header.header')
        const footer = document.querySelector('footer.footer')
        const frame = document.querySelector('#frame')
        if (!iframe || !header || !footer || !frame) return null
        return {
            viewport: { w: window.innerWidth, h: window.innerHeight },
            header: header.getBoundingClientRect(),
            footer: footer.getBoundingClientRect(),
            frame: frame.getBoundingClientRect(),
            iframe: iframe.getBoundingClientRect(),
            iframeVisible:
                getComputedStyle(iframe).visibility !== 'hidden' &&
                getComputedStyle(iframe).display !== 'none',
        }
    })

    expect(layout, 'iframe + header + footer must all be present').not.toBeNull()
    expect(layout.iframeVisible, 'iframe must be visible').toBe(true)

    const { viewport, header, footer, frame, iframe } = layout
    const expectedHeight = viewport.h - header.height - footer.height

    // The iframe should fill the full viewport width.
    expect(iframe.width, 'iframe width should match viewport width').toBe(viewport.w)

    // It should fill the call area height (allow 1px tolerance for subpixel rounding).
    expect(
        Math.abs(iframe.height - expectedHeight),
        `iframe height (${iframe.height}) should ≈ viewport - header - footer (${expectedHeight})`
    ).toBeLessThanOrEqual(1)

    // Top-left should sit at (0, header.height).
    expect(iframe.left, 'iframe should be flush left').toBe(0)
    expect(
        Math.abs(iframe.top - header.height),
        `iframe top (${iframe.top}) should sit just below header (${header.height})`
    ).toBeLessThanOrEqual(1)

    // The iframe's container (#frame) should match the iframe's bounding box.
    expect(frame.width).toBe(iframe.width)
    expect(Math.abs(frame.height - iframe.height)).toBeLessThanOrEqual(1)

    // Sanity: iframe should be reasonably large (catches "collapsed" regressions
    // even if header/footer also collapse to weird sizes).
    expect(iframe.width, 'iframe should be at least 300px wide').toBeGreaterThanOrEqual(300)
    expect(iframe.height, 'iframe should be at least 300px tall').toBeGreaterThanOrEqual(300)

    return layout
}
