import React, { Component } from "react";
import moment from 'moment-timezone';
import config from "./config.js";
 
class Room extends Component {
    componentDidMount() {
        function createFrameAndJoinRoom(room) {
            let roomName = "meet-" + room;
            window.callFrame = window.DailyIframe.createFrame(
                document.getElementById("frame"), {
                showLeaveButton: true,
                showFullscreenButton: true,
                iframeStyle: {
                    position: 'relative',
                    top: "4%",
                    bottom: "4%",
                    left: 0,
                    width: '99.6%',
                    height: '92%',
                }
            });
            
            console.log("Joining " + roomName);
            console.log("https://" + config.DAILY_SUBDOMAIN + ".daily.co/" + roomName);
            window.callFrame.join({ url: "https://" + config.DAILY_SUBDOMAIN + ".daily.co/" + roomName })
        }

        let timerElt = document.getElementById("date");
          
        window.timerId = setInterval(() => {
          timerElt.innerText = currentDatetime();
        }, 1);

        createFrameAndJoinRoom(window.location.pathname.replace("/", ""));
    }

    render() {
        const roomName = this.props.name.toUpperCase();
        const defaultTitle = "MEETING WITH "+ roomName + " // GUEST";
        const defaultBackgroundImage = config.rooms[roomName].BACKGROUND || "logo.png";

        let frameStyle = {
            backgroundImage: "url(" + config.ASSET_PATH + "/" + defaultBackgroundImage + ")"
        }

        console.log(frameStyle);

        return (
            <div className="room">
                <div id="frame" style={frameStyle}></div>
                <div className="header">
                    <h2 className="title">{config.rooms[roomName].TITLE || defaultTitle}</h2>
                    <a href={config.COMPANY_URL} target="_blank" rel="noopener noreferrer"><img alt={config.COMPANY_NAME} className="logo-header" src={config.ASSET_PATH + "/logo-header.png"}></img></a>
                </div>
                <div className="footer">
                    <div className="date" id="date"></div>
                    <div className="plug">
                        <span className="daily">Made with <a href="https://daily.co" target="_blank" rel="noopener noreferrer">daily.co</a></span>
                        <a href="https://github.com/rootvc/meet" target="_blank" rel="noopener noreferrer"><img alt="GitHub" className="github" src="github.png"></img></a>
                    </div>
                </div>
            </div>
        );
    };
}

function currentDatetime() {
    let date = new Date();
    let zoneName = moment.tz.guess();
    let time = moment(date).format("h:mma z");
    let day = moment(date).format(" | MMMM DD, YYYY");
    let zone = moment().tz(zoneName).format("z");
    return  [time, zone, day].join(" ");
}

export default Room;