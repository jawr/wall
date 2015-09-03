var React = require('react');
var Index = require('./components/index.js');
var Modal = require('react-modal');
var Router = require('react-router');
var Route = Router.Route;
var DefaultRoute = Router.DefaultRoute;
var RouteHandler = Router.RouteHandler;

var Auth = require('./components/auth/store.js');
var Login = require('./components/auth/login.js');

class Header extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			small: false
		}
	}

	componentDidMount() {
		var self = this;
		$(window).bind('scroll', function (e) {
			var $window = $(window);
			var offset = $window.scrollTop();
			if (offset > 100 && !self.state.small) {
				self.setState({
					small: true
				});
			} else if (offset < 100 && self.state.small) {
				self.setState({
					small: false
				});
			} 
		});
	}

	componentDidUnmount() {
		var self = this;
		$(window).unbind('scroll');
	}

	render() {
		var classes = "";
		if (this.state.small) {
			classes += " small";
		}
		return (
			<div className={"container" + classes}>
				<button className="tiny" onClick={Auth.Logout}>Sign Out</button>
				<section className={"header" + classes}>
					<h2><i className="icon ion-ios-albums-outline"></i></h2>
					<h2>Post It.</h2>
				</section>
				{this.props.children}
			</div>
		)
	}
};

class App extends React.Component {
	render() {
		return (
			<Header>
				<RouteHandler {...this.props} />
			</Header>
		)
	}
};

var routes = (
	<Route name="app" path="/wall/" handler={App}>
		<Route name="index" handler={Index} />
		<Route name="login" path="login" handler={Login} />
		<DefaultRoute handler={Index} />
	</Route>
);

var appElement = document.getElementById('app');
Modal.setAppElement(appElement);
Modal.injectCSS();

$(function() {
    Auth.CheckLogin(function() {
        Router.run(routes, Router.HistoryLocation, function(Handler, state) {
            if (Auth.LoggedIn() == true) {
                if (state.pathname == "/wall/login") {
                    Handler.transitionTo("index");
                }
            } else if (state.pathname != "/wall/login") {
                Handler.transitionTo("login");
            }
            var params = state.params;
            React.render(<Handler params={params} />, appElement);
        });
    });
});
