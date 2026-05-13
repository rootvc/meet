#!/usr/bin/env node
// Clean up Daily rooms with safety guards.
//
// Usage:
//   node scripts/cleanup-rooms.mjs [flags]
//
// Flags:
//   --keep-prefix <s>   Keep rooms whose name starts with this prefix.
//                       Defaults to "meet-" (i.e. preserve our app's rooms).
//                       Pass an empty string to disable the keep-list.
//   --only-prefix <s>   Restrict deletion to rooms starting with this prefix.
//   --older-than <d>    Only consider rooms created more than N days ago
//                       (e.g. "30d", "7d"). Default: 0d (any age).
//   --no-exp-only       Only consider rooms that do NOT have an `exp` set.
//   --limit <n>         Cap how many rooms to delete in this run. Default: all.
//   --dry-run           Print what would be deleted; do not delete anything.
//   --yes               Skip the interactive confirmation prompt.
//   --help              Show this message.
//
// Examples:
//   # Preview what would get cleaned (everything not prefixed meet-):
//   node scripts/cleanup-rooms.mjs --dry-run
//
//   # Delete every non-meet- room older than 30 days, with prompt:
//   node scripts/cleanup-rooms.mjs --older-than 30d
//
//   # Non-interactive cleanup (e.g. from CI):
//   node scripts/cleanup-rooms.mjs --yes

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

const here = dirname(fileURLToPath(import.meta.url))

function readDotEnv() {
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

function parseArgs(argv) {
    const opts = {
        keepPrefix: 'meet-',
        onlyPrefix: null,
        olderThanDays: 0,
        noExpOnly: false,
        limit: Infinity,
        dryRun: false,
        yes: false,
        help: false,
    }
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i]
        const next = () => argv[++i]
        switch (a) {
            case '--keep-prefix': opts.keepPrefix = next() ?? ''; break
            case '--only-prefix': opts.onlyPrefix = next() ?? ''; break
            case '--older-than': {
                const v = next() ?? '0d'
                const m = v.match(/^(\d+(?:\.\d+)?)\s*d?$/i)
                if (!m) throw new Error(`Invalid --older-than value: ${v}`)
                opts.olderThanDays = parseFloat(m[1])
                break
            }
            case '--no-exp-only': opts.noExpOnly = true; break
            case '--limit': opts.limit = parseInt(next() ?? '0', 10); break
            case '--dry-run': opts.dryRun = true; break
            case '--yes': case '-y': opts.yes = true; break
            case '--help': case '-h': opts.help = true; break
            default:
                throw new Error(`Unknown flag: ${a}`)
        }
    }
    return opts
}

function printHelp() {
    const src = readFileSync(fileURLToPath(import.meta.url), 'utf8')
    // Print the leading comment block as the usage docs.
    const help = src
        .split('\n')
        .slice(1)
        .filter((l) => l.startsWith('// '))
        .map((l) => l.replace(/^\/\/ ?/, ''))
        .join('\n')
    console.log(help)
}

async function listAllRooms(apiKey) {
    const all = []
    let cursor
    while (true) {
        const url = new URL('https://api.daily.co/v1/rooms')
        url.searchParams.set('limit', '100')
        if (cursor) url.searchParams.set('starting_after', cursor)
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${apiKey}` },
        })
        if (!res.ok) throw new Error(`List rooms failed: ${res.status} ${await res.text()}`)
        const body = await res.json()
        const rooms = body.data ?? []
        all.push(...rooms)
        if (rooms.length < 100) break
        cursor = rooms[rooms.length - 1].id
    }
    return all
}

async function deleteRoom(apiKey, name) {
    const res = await fetch(`https://api.daily.co/v1/rooms/${encodeURIComponent(name)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!res.ok) {
        const body = await res.text()
        throw new Error(`Failed to delete ${name}: ${res.status} ${body}`)
    }
}

function ageDays(iso) {
    return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24)
}

async function confirm(prompt) {
    const rl = createInterface({ input, output })
    try {
        const answer = (await rl.question(prompt)).trim().toLowerCase()
        return answer === 'y' || answer === 'yes'
    } finally {
        rl.close()
    }
}

async function main() {
    let opts
    try {
        opts = parseArgs(process.argv.slice(2))
    } catch (err) {
        console.error(err.message)
        console.error('Run with --help for usage.')
        process.exit(2)
    }
    if (opts.help) {
        printHelp()
        return
    }

    const env = readDotEnv()
    const apiKey = process.env.DAILY_API_KEY || env.DAILY_API_KEY
    if (!apiKey) {
        console.error('DAILY_API_KEY is not set. Add it to .env or export it.')
        process.exit(1)
    }

    console.log('Fetching rooms...')
    const all = await listAllRooms(apiKey)
    console.log(`Found ${all.length} rooms total.\n`)

    const candidates = all.filter((r) => {
        const name = r.name ?? ''
        if (opts.keepPrefix && name.startsWith(opts.keepPrefix)) return false
        if (opts.onlyPrefix !== null && !name.startsWith(opts.onlyPrefix)) return false
        if (opts.olderThanDays > 0 && ageDays(r.created_at) < opts.olderThanDays) return false
        if (opts.noExpOnly && r.config?.exp) return false
        return true
    })

    const toDelete = candidates.slice(0, opts.limit)
    const skipped = all.length - candidates.length
    const remaining = candidates.length - toDelete.length

    console.log('Cleanup plan')
    console.log('─'.repeat(60))
    console.log(`  Keep prefix:    ${opts.keepPrefix || '(none)'}`)
    console.log(`  Only prefix:    ${opts.onlyPrefix ?? '(any)'}`)
    console.log(`  Older than:     ${opts.olderThanDays}d`)
    console.log(`  No-exp-only:    ${opts.noExpOnly}`)
    console.log(`  Limit:          ${opts.limit === Infinity ? 'none' : opts.limit}`)
    console.log(`  Dry-run:        ${opts.dryRun}`)
    console.log('')
    console.log(`  Total rooms:    ${all.length}`)
    console.log(`  Protected:      ${skipped}`)
    console.log(`  To delete:      ${toDelete.length}`)
    if (remaining > 0) console.log(`  Over limit:     ${remaining} (not touched this run)`)
    console.log('─'.repeat(60))

    if (toDelete.length === 0) {
        console.log('Nothing to delete.')
        return
    }

    // Show a preview (first 20).
    const preview = toDelete.slice(0, 20)
    console.log(`\nPreview (first ${preview.length} of ${toDelete.length}):`)
    for (const r of preview) {
        const age = ageDays(r.created_at).toFixed(0)
        console.log(`  - ${r.name.padEnd(36)} created=${r.created_at}  age=${age}d`)
    }
    if (toDelete.length > preview.length) {
        console.log(`  …and ${toDelete.length - preview.length} more.`)
    }
    console.log('')

    if (opts.dryRun) {
        console.log('Dry run — no rooms were deleted.')
        return
    }

    if (!opts.yes) {
        const ok = await confirm(`Delete ${toDelete.length} rooms? [y/N] `)
        if (!ok) {
            console.log('Aborted.')
            return
        }
    }

    let success = 0
    let failed = 0
    let i = 0
    for (const room of toDelete) {
        i++
        try {
            await deleteRoom(apiKey, room.name)
            success++
            // Compact progress: one line every 10 rooms (or always for small batches).
            if (toDelete.length <= 20 || i % 10 === 0 || i === toDelete.length) {
                console.log(`  [${i}/${toDelete.length}] deleted ${room.name}`)
            }
        } catch (err) {
            failed++
            console.error(`  [${i}/${toDelete.length}] FAILED ${room.name}: ${err.message}`)
        }
    }

    console.log('')
    console.log(`Done. Deleted ${success}, failed ${failed}.`)
    if (failed > 0) process.exit(1)
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
