var React = require('react');
var Store = require('./store.js');

module.exports = React.createClass({
    getInitialState: function() {
        return {
            error: null
        };
    },
    componentDidMount: function() {
        this.setSigninButton();
    },
    componentDidUpdate: function() {
        this.setSigninButton();
    },
    setSigninButton: function() {
        if (!Store.LoggedIn() && !Store.Processing()) {
            var options = {
                'clientid': '732661791014-gtpitcpfvciphaufnfpcpf6480gqltjg.apps.googleusercontent.com',
                'scope': 'https://www.googleapis.com/auth/plus.profile.emails.read',
                'cookiepolicy': 'single_host_origin',
                'callback': Store.HandleAuth,
                'theme': 'light'
            };
            if (this.state.error != null) {
                options['approvalprompt'] = 'force';
            } else {
                options['approvalprompt'] = 'auto';
            }

            gapi.signin.render(this.refs.login.getDOMNode(), options);
        }
    },
    componentWillMount: function() {
        Store.on('auth.success', this.loggedIn);
        Store.on('auth.error', this.error);
        Store.on('auth.processing', this.change);
    },
    componentWillUnmount: function() {
        Store.off('auth.success', this.loggedIn);
        Store.off('auth.error', this.error);
        Store.off('auth.processing', this.change);
    },
    contextTypes: {
         router: React.PropTypes.func
    },
    loggedIn: function() {
        this.context.router.transitionTo('wall', {id: Store.User().id})
    },
    change: function() {
        this.setState({});
    },
    error: function(err) {
        var err = (
            <div className="error">
                <i className="icon ion-ios7-information-outline"></i>
                {err}
            </div>
        )
        this.setState({
            error: err
        });
    },
    render: function() {
        var loginButton = (
            <div>
                <p>Please login using your google account.</p>
                <span ref="login" id="login-button"></span>
            </div>
        )
        if (Store.Processing()) {
            loginButton = <p>Logging in..</p>
        }

        return (
            <div>
                <div className="row">
			<div className="one-third column"><p></p></div>
			<div className="one-third column">
			    {loginButton}
			    {this.state.error}
                	</div>
                </div>
            </div>
        )
    }
});
