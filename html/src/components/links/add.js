var React = require('react');
var Store = require('./store.js');
var Auth = require('../auth/store.js');

class Add extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			action: null,
			value: '',
			authed: Auth.LoggedIn() && this.props.params.id == Auth.User().id
		};
	}

	handleInputChange = (event) => {
		var state = this.state;
		state.value = event.target.value;
		state.action = null;
		if (state.value.length > 0) {
			if (state.authed && state.value.match(/^http/i)) {
				state.action = 'add';
			} else {
				state.action = 'search';
			}
		} else {
			Store.Actions().Search();
		}
		this.setState(state);
	}

	handleAdd = (event) => {
		event.preventDefault();
		var elem = React.findDOMNode(this.refs.input);
		var o = {
			url: elem.value.trim(),
			user_id: Auth.User() // can be changed
		};
		Store.Actions().Create(o);
		elem.value = '';
	}

	handleSearch = (event) => {
		event.preventDefault();
		var query = {
			query: this.state.value
		};
		Store.Actions().Search(query);
	}

	render() {
		var action = null;
		if (this.state.action == 'add') {
			action = (
				<div className="four columns">
					<button onClick={this.handleAdd} className="button-primary u-full-width">post it</button>
				</div>
			)
		} else if (this.state.action == 'search') {
			action = (
				<div className="four columns">
					<button onClick={this.handleSearch} className="button-primary u-full-width">search</button>
				</div>
			)

		}

		var classes = "eight columns";
		if (action == null) classes = "twelve columns";

		return (
			<form>
				<div className="row">
					<div className={classes}>
						<input ref="input" className="u-full-width" type="text" placeholder="Add or Search" onChange={this.handleInputChange} />
					</div>
					{action}
				</div>

			</form>
		)
	}
};

module.exports = Add;
