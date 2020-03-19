import React, { Component } from "react";
import {
  Route,
  NavLink,
  BrowserRouter as Router,
  useParams
} from "react-router-dom";
import Home from "./Home";
import Room from "./Room"; 

class Main extends Component {
    render() {
        return (
            <Router>
                <div>
                    <h1>Meet Root</h1>
                    <div className="content">
                        <Route exact path="/" component={Home}/>
                        <Route path="/:name" children={<Child />} component={Room}/>
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
  
    return (
      <div>
        <Room name={name}/>
      </div>
    );
  }
 
export default Main;