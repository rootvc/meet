import React, { Component } from "react";
import {
  Route,
  NavLink,
  HashRouter,
  useParams
} from "react-router-dom";
import Home from "./Home";
import Room from "./Room"; 

class Main extends Component {
    render() {
        return (
            <HashRouter>
                <div>
                    <h1>Meet Root</h1>
                    <ul className="header">
                        <li><NavLink to="/avidan">Avidan</NavLink></li>
                        <li><NavLink to="/kane">Kane</NavLink></li>
                        <li><NavLink to="/chrissy">Chrissy</NavLink></li>
                        <li><NavLink to="/lee">Lee</NavLink></li>
                    </ul>
                    <div className="content">
                        <Route exact path="/" component={Home}/>
                        <Route path="/:name" children={<Child />} component={Room}/>
                    </div>
                </div>
            </HashRouter>
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