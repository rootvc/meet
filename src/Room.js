import React, { Component } from "react";
 
class Room extends Component {
    componentDidMount() {
        function createFrameAndJoinRoom(room) {
            let roomName = "meet-" + room;
            window.callFrame = window.DailyIframe.createFrame({
                showLeaveButton: true,
                iframeStyle: {
                    position: 'fixed',
                    bottom: '0px',
                    left: 0,
                    width: '100%',
                    height: '95%'
                }
            });
            
            console.log("Joining " + roomName);
            window.callFrame.join({ url: "https://roulette.daily.co/" + roomName });
        }

        createFrameAndJoinRoom(window.location.pathname.replace("/", ""));
    }

    render() {
    
    return (
        <div>
            <h2>Room {this.props.name}</h2>
        </div>
    );
   };
}

export default Room;