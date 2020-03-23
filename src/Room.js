import React, { Component } from "react";
import moment from 'moment-timezone';
 
class Room extends Component {
    componentDidMount() {
        function createFrameAndJoinRoom(room) {
            let roomName = "meet-" + room;
            window.callFrame = window.DailyIframe.createFrame(
                document.getElementById("frame"), {
                showLeaveButton: true,
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
            console.log("https://" + process.env.REACT_APP_DAILY_SUBDOMAIN + ".daily.co/" + roomName);
            window.callFrame.join({ url: "https://" + process.env.REACT_APP_DAILY_SUBDOMAIN + ".daily.co/" + roomName })
        }

        let timerElt = document.getElementById("date");
          
        window.timerId = setInterval(() => {
          timerElt.innerText = currentDatetime();
        }, 1);

        createFrameAndJoinRoom(window.location.pathname.replace("/", ""));
    }

        // background-image: "url({process.env.REACT_APP_ASSET_PATH + 'logo.png'});"

    render() {
        let frameStyle = {
            backgroundImage: "url(" + process.env.REACT_APP_ASSET_PATH + "/logo.png)"
        }

        return (
            <div className="room">
                <div id="frame" style={frameStyle}></div>
                <div className="header">
                    <h2 className="title">MEETING WITH {this.props.name.toUpperCase()} &#x2F;&#x2F; GUEST</h2>
                    <a href="https://root.vc" target="_blank"><img alt="Root Ventures" className="logo-header" src={process.env.REACT_APP_ASSET_PATH + "/logo-header.png"}></img></a>
                </div>
                <div className="footer">
                    <div className="date" id="date"></div>
                    <div className="plug">
                        <span className="daily">Made with <a href="https://daily.co" target="_blank">daily.co</a></span>
                        <a href="https://github.com/rootvc/meet" target="_blank"><img alt="GitHub" className="github" src="github.png"></img></a>
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