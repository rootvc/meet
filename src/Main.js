import React, { Component } from "react";
import {
  Route,
  BrowserRouter as Router,
  useParams
} from "react-router-dom";
import {Helmet} from 'react-helmet'
import Home from "./Home";
import Room from "./Room"; 

class Main extends Component {
    render() {
        return (
            <Router>
                <Helmet>
                  <link rel="icon" href={process.env.REACT_APP_ASSET_PATH + "/logo192.png"} /> 
                  <link rel="apple-touch-icon" href={process.env.REACT_APP_ASSET_PATH + "/favicon.ico"} /> 
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
      "short_name": "RootVC",
      "name": "Root Ventures Video Chat",
      "description": "Video conference application for Root Ventures built on Daily.co",
      "icons": [
        {
          "src": process.env.REACT_APP_ASSET_PATH + "/favicon.ico",
          "sizes": "64x64 32x32 24x24 16x16",
          "type": "image/x-icon"
        },
        {
          "src": process.env.REACT_APP_ASSET_PATH + "/logo192.png",
          "type": "image/png",
          "sizes": "192x192"
        },
        {
          "src": process.env.REACT_APP_ASSET_PATH + "/logo512.png",
          "type": "image/png",
          "sizes": "512x512"
        }
      ],
      "start_url": ".",
      "display": "standalone",
      "theme_color": "ffffff",
      "background_color": "#000000",
    };

  function setManifest() {
    const stringManifest = JSON.stringify(manifest);
    const blob = new Blob([stringManifest], {type: "application/json"});
    const manifestURL = URL.createObjectURL(blob);
    document.querySelector("#manifest").setAttribute("href", manifestURL);
  }

export default Main;