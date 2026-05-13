import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
    DailyProvider,
    useCallFrame,
    useDaily,
    useDailyEvent,
    useMeetingState,
} from '@daily-co/daily-react'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import advancedFormat from 'dayjs/plugin/advancedFormat'
import config from './config'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(advancedFormat)

const IFRAME_OPTIONS = {
    showLeaveButton: true,
    showFullscreenButton: true,
    theme: {
        colors: {
            accent: '#1bebb9',
            accentText: '#ffffff',
            background: '#1c1c1c',
            backgroundAccent: '#2c2c2c',
            baseText: '#ffffff',
            border: '#3c3c3c',
            mainAreaBg: '#1c1c1c',
            mainAreaBgAccent: '#0c0c0c',
            mainAreaText: '#ffffff',
            supportiveText: '#888888',
        },
    },
    iframeStyle: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        border: 'none',
    },
}

// How long we wait for `joined-meeting` before declaring the call dead.
// Daily's WebRTC negotiation typically completes in ~3s; 15s is conservative.
const JOIN_TIMEOUT_MS = 15_000

// Inner component that owns the prebuilt call frame. It is mounted only once
// the user has confirmed they want to join, so the iframe is created exactly
// when (and where) we want it.
function DailyCall({ roomUrl, userName, roomName }) {
    const frameParentRef = useRef(null)
    const [error, setError] = useState(null)

    // Tell daily-react to stop creating new call frame instances after we've
    // hit a fatal error. This is what actually breaks the retry loop — we
    // explicitly destroy the existing frame below, and shouldCreateInstance
    // prevents it from being recreated on the next render.
    const shouldCreateInstance = useCallback(() => !error, [error])
    const callFrame = useCallFrame({
        parentElRef: frameParentRef,
        options: IFRAME_OPTIONS,
        shouldCreateInstance,
    })

    // Reflect the live meeting state on a data attribute so e2e tests (and
    // anything else outside React) can observe call lifecycle transitions
    // without poking at the cross-origin Daily iframe.
    const meetingState = useMeetingState()

    // Centralised error reporter. Once we've reported one error we ignore
    // any follow-on errors (the SDK can emit several as the iframe tears down).
    const reportError = useCallback((kind, message) => {
        setError((prev) => prev || { kind, message })
    }, [])

    // Listen for fatal errors from Daily — most importantly "room not found".
    useDailyEvent(
        'error',
        useCallback(
            (evt) =>
                reportError(
                    evt?.error?.type || 'unknown',
                    evt?.errorMsg || 'Failed to join the call'
                ),
            [reportError]
        )
    )
    useDailyEvent(
        'nonfatal-error',
        useCallback(
            (evt) => {
                const type = evt?.type
                if (type === 'meeting-not-found' || type === 'no-room') {
                    reportError(
                        'meeting-not-found',
                        `Room "meet-${roomName}" doesn't exist`
                    )
                }
            },
            [reportError, roomName]
        )
    )

    // Kick off the join and arm a timeout so we never spin forever.
    useEffect(() => {
        if (!callFrame || error) return
        // Guard against duplicate joins triggered by re-renders / Strict Mode.
        const state = callFrame.meetingState()
        if (state === 'joining-meeting' || state === 'joined-meeting') return

        callFrame.join({ url: roomUrl, userName }).catch((err) => {
            console.error('Failed to join Daily room', err)
            reportError(
                'join-failed',
                err?.errorMsg || err?.message || 'Failed to join the call'
            )
        })

        const timeoutId = setTimeout(() => {
            if (callFrame.meetingState() !== 'joined-meeting') {
                reportError(
                    'timeout',
                    `Timed out joining the call after ${Math.round(
                        JOIN_TIMEOUT_MS / 1000
                    )}s`
                )
            }
        }, JOIN_TIMEOUT_MS)

        return () => clearTimeout(timeoutId)
    }, [callFrame, roomUrl, userName, error, reportError])

    // When an error fires, fully tear down the iframe so Daily's SDK stops
    // any in-flight join / retry attempts. The `shouldCreateInstance` guard
    // above prevents useCallFrame from immediately creating a new one.
    useEffect(() => {
        if (!error || !callFrame) return
        callFrame.destroy().catch(() => {
            /* destroy can throw if the frame is already gone; safe to ignore */
        })
    }, [error, callFrame])

    return (
        <div
            id="frame"
            ref={frameParentRef}
            data-meeting-state={meetingState ?? 'idle'}
            data-error={error?.kind ?? ''}
        >
            {error && (
                <div className="call-error">
                    <div className="call-error-title">⚠ {error.message}</div>
                    {error.kind === 'meeting-not-found' && (
                        <div className="call-error-hint">
                            Create it in the{' '}
                            <a
                                href="https://dashboard.daily.co/rooms"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Daily dashboard
                            </a>
                            , then refresh this page.
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// Wraps the call frame with a DailyProvider so any future custom UI added to
// the call view can use daily-react hooks without re-plumbing.
function CallView({ roomUrl, userName, roomName }) {
    return (
        <DailyProvider>
            <CallHeader userName={userName} roomName={roomName} />
            <DailyCall roomUrl={roomUrl} userName={userName} roomName={roomName} />
        </DailyProvider>
    )
}

// Small clickable wordmark used in both the intro view and the call view.
function BrandMark() {
    return (
        <a
            className="brand-mark"
            href={config.COMPANY_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={config.COMPANY_NAME}
        >
            <img
                src={`${config.ASSET_PATH}/rootvc-logo.png`}
                alt={config.COMPANY_NAME}
            />
        </a>
    )
}

function CallHeader({ userName, roomName }) {
    // `useDaily()` returns the call object once `useCallFrame` registers it
    // with the provider. We don't need it for rendering today, but reading it
    // here ensures the header re-renders if/when we wire up live state.
    useDaily()
    return (
        <header className="header">
            <div className="terminal-prompt">
                <span className="prompt-user">{userName}</span>
                <span className="prompt-sep">@</span>
                <span className="prompt-host">{roomName}.root.vc</span>
                <span className="prompt-path">:~</span>
                <span className="cursor"></span>
            </div>
            <BrandMark />
        </header>
    )
}

export default function Room({ name }) {
    const [phase, setPhase] = useState('intro') // intro, name-input, joining, call
    const [introText, setIntroText] = useState('')
    const [userName, setUserName] = useState('')
    const [showCursor, setShowCursor] = useState(true)
    const inputRef = useRef(null)

    const roomName = name.toLowerCase()
    const roomId = 'meet-' + roomName
    const roomUrl = useMemo(
        () => `https://${config.DAILY_SUBDOMAIN}.daily.co/${roomId}`,
        [roomId]
    )

    // Intro typing animation
    useEffect(() => {
        if (phase !== 'intro') return

        const timeouts = [
            setTimeout(() => setIntroText('connect'), 0),
            setTimeout(() => setIntroText('connecting'), 600),
            setTimeout(() => {
                setIntroText('name')
                setTimeout(() => {
                    setPhase('name-input')
                    inputRef.current?.focus()
                }, 100)
            }, 1800),
        ]

        return () => timeouts.forEach(clearTimeout)
    }, [phase])

    // Stop cursor blinking after name is submitted
    useEffect(() => {
        if (phase === 'call') {
            const t = setTimeout(() => setShowCursor(false), 2000)
            return () => clearTimeout(t)
        }
    }, [phase])

    // Handle name submission
    const handleSubmit = useCallback(
        (e) => {
            e.preventDefault()
            if (!userName.trim()) return

            setPhase('joining')
            setIntroText((prev) => prev + userName + '\n$ Joining call...')

            setTimeout(() => {
                setPhase('call')
            }, 800)
        },
        [userName]
    )

    // Start timer when call begins
    useEffect(() => {
        if (phase !== 'call') return

        const timerElt = document.getElementById('date')
        if (timerElt) {
            const timerId = setInterval(() => {
                timerElt.innerText = currentDatetime()
            }, 1000)
            return () => clearInterval(timerId)
        }
    }, [phase])

    const cursorClass = showCursor ? 'cursor blink' : 'cursor'

    // Render colored prompt
    const Prompt = ({ user = 'guest', cmd, cmdGrey }) => (
        <div className="terminal-prompt cli-line">
            <span className="prompt-user">{user}</span>
            <span className="prompt-sep">@</span>
            <span className="prompt-host">root.vc</span>
            <span className="prompt-path">:~</span>
            <span className="prompt-symbol">$</span>
            {cmd && <span className="prompt-command">{cmd}</span>}
            {cmdGrey && <span className="cli-info">{cmdGrey}</span>}
        </div>
    )

    // Show CLI intro/name input
    if (phase !== 'call') {
        return (
            <div className="room">
                <header className="header header-intro">
                    <BrandMark />
                </header>
                <div className="cli-container" onClick={() => inputRef.current?.focus()}>
                    <div className="cli-output">
                        {introText === 'connect' && (
                            <>
                                <Prompt cmdGrey={`ssh daily.root.vc/${roomName}`} />
                                <span className={cursorClass}></span>
                            </>
                        )}
                        {introText === 'connecting' && (
                            <>
                                <Prompt cmdGrey={`ssh daily.root.vc/${roomName}`} />
                                <div className="cli-line cli-info">Connecting to daily.root.vc/{roomName}...</div>
                                <span className={cursorClass}></span>
                            </>
                        )}
                        {introText === 'name' && (
                            <>
                                <Prompt cmdGrey={`ssh daily.root.vc/${roomName}`} />
                                <div className="cli-line cli-info">Connecting to daily.root.vc/{roomName}...</div>
                                <div className="cli-line"><span className="cli-info">Enter your name: </span><span className="cli-input-text">{userName}</span><span className={cursorClass}></span></div>
                            </>
                        )}
                        {phase === 'joining' && (
                            <>
                                <Prompt cmdGrey={`ssh daily.root.vc/${roomName}`} />
                                <div className="cli-line cli-info">Connecting to daily.root.vc/{roomName}...</div>
                                <div className="cli-line"><span className="cli-info">Enter your name: </span><span className="cli-input-text">{userName}</span></div>
                                <Prompt user={userName} cmd="join" />
                                <div className="cli-line cli-info">Joining call...</div>
                                <span className={cursorClass}></span>
                            </>
                        )}
                    </div>
                    <form onSubmit={handleSubmit} className="cli-form">
                        <input
                            ref={inputRef}
                            type="text"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            className="cli-input"
                            autoComplete="off"
                            spellCheck="false"
                            autoCapitalize="off"
                            maxLength={30}
                        />
                    </form>
                </div>
                <footer className="footer">
                    <div className="date" id="date">{currentDatetime()}</div>
                    <span className="made-with">
                        Made with Root Ventures portfolio company <a href="https://docs.daily.co/reference" target="_blank" rel="noopener noreferrer">Daily.co</a> API and vibes
                    </span>
                </footer>
            </div>
        )
    }

    // Show video call
    return (
        <div className="room">
            <CallView roomUrl={roomUrl} userName={userName.trim()} roomName={roomName} />
            <footer className="footer">
                <div className="date" id="date">{currentDatetime()}</div>
                <span className="made-with">
                    Made with Root Ventures portfolio company <a href="https://docs.daily.co/reference" target="_blank" rel="noopener noreferrer">Daily.co</a> API and vibes
                </span>
            </footer>
        </div>
    )
}

function currentDatetime() {
    const now = dayjs()
    const zoneName = dayjs.tz.guess()
    const day = now.format('YYYY-MM-DD')
    const time = now.format('HH:mm:ss')
    const zone = now.tz(zoneName).format('z')
    return `[${day} ${time} ${zone}]`
}
