var React = require('react');
var CreateLink = require('./links/add.js');
var Store = require('./links/store.js');
var List = require('./links/list.js');
var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;

class Index extends React.Component {
	componentDidMount() {
		Store.on('Results', this.handleChange);
		Store.Actions().Search();
	}

	componentDidUnmount() {
		Store.off('Results', this.handleChange);
	}

	handleChange = () => {
		this.setState({});
	}

	render() {
		return (
			<section>
				<CreateLink />
				<ReactCSSTransitionGroup transitionName="fade-in" transitionAppear={true}>
					<List data={Store.Results()} />
				</ReactCSSTransitionGroup>
			</section>
		)
	}
};

module.exports = Index;
