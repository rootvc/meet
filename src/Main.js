import React, { Component } from "react";
import {
  Route,
  BrowserRouter as Router,
  useParams
} from "react-router-dom";
import {Helmet} from 'react-helmet'
import Home from "./Home";
import Room from "./Room";
import config from "./config.js";

class Main extends Component {
    render() {
        return (
            <Router>
                <Helmet>
                  <link rel="icon" href={config.ASSET_PATH + "/logo192.png"} /> 
                  <link rel="apple-touch-icon" href={config.ASSET_PATH + "/favicon.ico"} /> 
                  <meta name="description" content={"Meeting room for " + config.COMPANY_NAME} />
                  <title>{config.COMPANY_NAME} :: Meeting Room</title>
                </Helmet>
                <div>
                    <div className="content">
                        <Route exact path="/" component={Home}/>
                        <Route path="/:name" children={<Child />} />
                    </div>
                </div>
            </Router>
        );
    }
}

function Child() {
    // We can use the `useParams` hook here to access
    // the dynamic pieces of the URL.
    let { name } = useParams();
    setManifest();
  
    return (
      <div className="main">
        <Room name={name}/>
      </div>
    );
  }

  const manifest = 
    {
      "short_name": config.COMPANY_NAME,
      "name": config.COMPANY_NAME + "Video Chat",
      "description": "Video conference application for " + config.COMPANY_NAME + " built on Daily.co",
      "icons": [
        {
          "src": config.ASSET_PATH + "/favicon.ico",
          "sizes": "64x64 32x32 24x24 16x16",
          "type": "image/x-icon"
        },
        {
          "src": config.ASSET_PATH + "/logo192.png",
          "type": "image/png",
          "sizes": "192x192"
        },
        {
          "src": config.ASSET_PATH + "/logo512.png",
          "type": "image/png",
          "sizes": "512x512"
        }
      ],
      "start_url": ".",
      "display": "standalone",
      "theme_color": "#ffffff",
      "background_color": "#000000",
    };

  function setManifest() {
    const stringManifest = JSON.stringify(manifest);
    const blob = new Blob([stringManifest], {type: "application/json"});
    const manifestURL = URL.createObjectURL(blob);
    document.querySelector("#manifest").setAttribute("href", manifestURL);
  }

export default Main;