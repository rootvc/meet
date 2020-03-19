import React, { Component } from "react";
import moment from 'moment-timezone';

 
class Room extends Component {
    componentDidMount() {
        function createFrameAndJoinRoom(room) {
            let roomName = "meet-" + room;
            window.callFrame = window.DailyIframe.createFrame({
                showLeaveButton: true,
                iframeStyle: {
                    position: 'fixed',
                    bottom: "5%",
                    top: "5%",
                    left: 0,
                    width: '100%',
                    height: '90%',
                }
            });
            
            console.log("Joining " + roomName);
            window.callFrame.join({ url: "https://roulette.daily.co/" + roomName });
        }

        let timerElt = document.getElementById("date");
          
        window.timerId = setInterval(() => {
          timerElt.innerText = currentDatetime();
        }, 1);

        createFrameAndJoinRoom(window.location.pathname.replace("/", ""));
    }

    render() {
    
    return (
        <div class="room">
            <div>
                <div class="header">
                    <h2 class="title">MEETING WITH {this.props.name.toUpperCase()} // GUEST</h2>
                </div>
            </div>
            <div class="footer">
                <div class="date" id="date">
                </div>
                <div class="plug">
                    <span class="daily">Made with <a href="https://daily.co">daily.co</a></span>
                    <a href="https://github.com/rootvc/meet" target="_new"><img class="github" src="github.png"></img></a>
                </div>
            </div>
            <div class="loader"></div>
        </div>
    );
   };
}

function currentDatetime() {
    let date = new Date();
    let zoneName = moment.tz.guess();
    let time = moment(date).format("h:MMa z");
    let day = moment(date).format(" | MMMM DD, YYYY");
    let zone = moment().tz(zoneName).format("z");
    return  [time, zone, day].join(" ");
}

export default Room;