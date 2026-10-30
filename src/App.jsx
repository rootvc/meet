import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom'
import config from './config'
import Room from './Room'

function RoomRoute() {
    const { name } = useParams()
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
