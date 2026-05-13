import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom'
import config from './config'
import Room from './Room'

const manifest = {
    short_name: config.COMPANY_NAME,
    name: config.COMPANY_NAME + ' Video Chat',
    description:
        'Video conference application for ' + config.COMPANY_NAME + ' built on Daily.co',
    icons: [
        {
            src: config.ASSET_PATH + '/favicon.ico',
            sizes: '64x64 32x32 24x24 16x16',
            type: 'image/x-icon',
        },
        {
            src: config.ASSET_PATH + '/logo192.png',
            type: 'image/png',
            sizes: '192x192',
        },
        {
            src: config.ASSET_PATH + '/logo512.png',
            type: 'image/png',
            sizes: '512x512',
        },
    ],
    start_url: '.',
    display: 'standalone',
    theme_color: '#ffffff',
    background_color: '#000000',
}

function useManifest() {
    useEffect(() => {
        const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.querySelector('#manifest')
        link?.setAttribute('href', url)
        return () => URL.revokeObjectURL(url)
    }, [])
}

function RoomRoute() {
    const { name } = useParams()
    useManifest()
    return <Room name={name} />
}

function Home() {
    return <div />
}

// React 19 hoists <title>, <link>, and <meta> rendered anywhere in the tree
// into the document <head>, so we no longer need a custom <head> wrapper.
// Note: <title> must receive a single string child for hoisting to work.
function DocumentHead() {
    return (
        <>
            <title>{`${config.COMPANY_NAME} :: Meeting Room`}</title>
            <meta name="description" content={`Meeting room for ${config.COMPANY_NAME}`} />
            <link rel="icon" href={`${config.ASSET_PATH}/logo192.png`} />
            <link rel="apple-touch-icon" href={`${config.ASSET_PATH}/favicon.ico`} />
        </>
    )
}

export default function App() {
    return (
        <BrowserRouter>
            <DocumentHead />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/:name" element={<RoomRoute />} />
            </Routes>
        </BrowserRouter>
    )
}
