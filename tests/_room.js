// Shared test-room helper.
//
// All tests that hit a real Daily call use the same persistent room:
//
//   https://<VITE_DAILY_SUBDOMAIN>.daily.co/meet-e2e-test
//
// We use a single stable room (instead of spinning up fresh ones per test)
// so we're not constantly churning Daily's API and leaving litter behind
// if a test crashes. If the room doesn't exist on the account yet, we
// create it once and never delete it.

export const TEST_ROOM_SLUG = process.env.E2E_ROOM || 'e2e-test'
const TEST_ROOM_NAME = `meet-${TEST_ROOM_SLUG}`

let ensured = false

/**
 * Make sure the dedicated test room exists on the Daily account. Idempotent:
 * - If the room already exists, return immediately.
 * - If not, create it with sane test defaults.
 *
 * @param {string} apiKey - Daily REST API key.
 */
export async function ensureTestRoom(apiKey) {
    if (ensured) return TEST_ROOM_NAME
    if (!apiKey) throw new Error('ensureTestRoom() needs a DAILY_API_KEY')

    // Probe the room first; cheap GET, no side effects.
    const probe = await fetch(`https://api.daily.co/v1/rooms/${TEST_ROOM_NAME}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (probe.ok) {
        ensured = true
        return TEST_ROOM_NAME
    }
    if (probe.status !== 404) {
        throw new Error(`Probe failed: ${probe.status} ${await probe.text()}`)
    }

    // Doesn't exist — create it.
    const res = await fetch('https://api.daily.co/v1/rooms', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: TEST_ROOM_NAME,
            privacy: 'public',
            properties: {
                enable_prejoin_ui: false,
                start_video_off: true,
                start_audio_off: true,
            },
        }),
    })
    if (!res.ok) {
        const body = await res.text()
        // Parallel workers can race the GET above and both try to POST. The
        // loser gets `invalid-request-error: a room named X already exists`,
        // which is the same end state we want — treat it as success.
        if (res.status === 400 && /already exists/i.test(body)) {
            ensured = true
            return TEST_ROOM_NAME
        }
        throw new Error(`Failed to create ${TEST_ROOM_NAME}: ${res.status} ${body}`)
    }
    ensured = true
    return TEST_ROOM_NAME
}
