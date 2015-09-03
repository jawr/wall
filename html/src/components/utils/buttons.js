var React = require('react/addons');
var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;


// could turn this in to a factory by manually setting the width+offset by calculating
// the width from character length
class SlideIn extends React.Component {
	static propTypes = {
		onClick: React.PropTypes.func.isRequired
	}

	handleClick = (event) => {
		if (event) event.preventDefault();
		this.props.onClick();
	}

	render() {
		return (
			<div className="wrapper" onClick={this.handleClick}>
				<button onClick={this.handleClick} className="button mini" id="slide">Edit</button>
				<ReactCSSTransitionGroup transitionName="fade-in" transitionAppear={true}>
				{this.props.children}
				</ReactCSSTransitionGroup>
			</div>
		)
	}
}

class SlideInEdit extends React.Component {
	static propTypes = {
		onSave: React.PropTypes.func.isRequired
	}

	static defaultProps = {
		initial: ''
	}

	constructor(props) {
		super(props);
		this.state = {
			edit: false,
			value: this.props.initial
		};
	}

	componentWillReceiveProps(next) {
		this.setState({value: next.initial});
	}

	componentDidUpdate() {
		if (this.state.edit) {
			var input = React.findDOMNode(this.refs.input);
			input.focus();
			var self = this;
			// use namespace to unbind?
			$(input).keydown(function(event) {
				if (event.keyCode == 13) {
					self.props.onSave(input.value.trim());
					self.toggle();
				} else if (event.keyCode == 27) {
					self.toggle();
				}
			});
		}
	}

	toggle = () => {
		var edit = !this.state.edit;
		this.setState({edit: edit});
	}

	render() {
		var main = null;
		if (this.state.edit) {
			var children = React.Children.map(
				this.props.children, function(i) {
					return React.addons.cloneWithProps(i, {className: "edit"});
			});
			main = (
				<div>
					{children}
				<ReactCSSTransitionGroup transitionName="fade-in" transitionAppear={true}>
					<input type="text" defaultValue={this.state.value} className="u-full-width" ref="input" />
				</ReactCSSTransitionGroup>
				</div>
			)
		} else {
			main = (
				<SlideIn onClick={this.toggle}>
					{this.props.children}
				</SlideIn>
			)
		}

		return (
			<div>
				<label>{this.props.label}</label>
				{main}
			</div>
		)
	}
}

class Confirm extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			confirm: false
		};
	}

	handleClick = (event) => {
		event.preventDefault();
		if (this.state.confirm) {
			this.props.onClick.apply();
			this.setState({confirm: false});
		} else {
			this.setState({confirm: true});
			var self = this;
			setTimeout(function() {
				self.setState({confirm: false});
			}, 2500);
		}
	}

	render() {
		var children = this.props.children;
		var classes = this.props.className;
		if (this.state.confirm) {
			children = "sure?";
			classes += " button-primary";
		}
		return (
			<button
				className={classes}
				onClick={this.handleClick}
				>
				{children}
			</button>
		)
		
	}
}

module.exports = {
	SlideInEdit: SlideInEdit,
	Confirm: Confirm
}
