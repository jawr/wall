var React = require('react');
var Index = require('./components/index.js');
var Modal = require('react-modal');
var Router = require('react-router');
var Route = Router.Route;
var DefaultRoute = Router.DefaultRoute;
var RouteHandler = Router.RouteHandler;

var Auth = require('./components/auth/store.js');
var Login = require('./components/auth/login.js');
var Wall = require('./components/links/wall.js');

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

	static contextTypes = {
		router: React.PropTypes.func.isRequired
	}

	renderSettings = () => {
		return (
			<div></div>
		)
	}

	render() {
		var classes = "";
		var menu = [];
		if (this.state.small) {
			classes += " small";
		} else {
			if (Auth.LoggedIn()) {
				var toIndex = function() {
					Auth.Logout();
					location.reload();
				};
				menu.push(<button className="button mini" onClick={toIndex}>Sign Out</button>);
				menu.push(<button className="button mini" onClick={this.renderSettings}>settings</button>);
			} else {
				var self = this;
				var toLogin = function() {
					self.context.router.transitionTo('login');
				};
				menu.push(<button className="button mini" onClick={toLogin}>Sign In</button>);
			}
		}

		if (menu.length > 0) {
			menu = <div className="menu">{menu}</div>
		}

		if (this.context.router.getCurrentPath() == "/wall/login") {
			menu = null;
		}

		return (
			<div className={"container" + classes}>
				<section className={"header" + classes}>
					<h2><i className="icon ion-ios-albums-outline"></i></h2>
					<h2>Wall</h2>
					{menu}
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
		<Route name="login" path="/wall/login" handler={Login} />
		<Route name="wall" path="/wall/:id" handler={Index} />
		<DefaultRoute handler={Index} />
	</Route>
);

var appElement = document.getElementById('app');
Modal.setAppElement(appElement);
Modal.injectCSS();

$(function() {
	Auth.CheckLogin(function() {
		Router.run(routes, Router.HistoryLocation, function(Handler, state) {
			if (state.pathname == "/wall/" && !Auth.LoggedIn()) {
				Handler.transitionTo("login");
				return;
			}
			var params = state.params;
			React.render(<Handler params={params} />, appElement);
		});
	});
});
