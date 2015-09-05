var React = require('react');
var CreateLink = require('./links/add.js');
var Store = require('./links/store.js');
var List = require('./links/list.js');
var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;
var Auth = require('./auth/store.js');


class Index extends React.Component {
	componentDidMount() {
		Store.on('Results', this.handleChange);
		var query = {};
		if (this.props.params.id) {
			query['user_id'] = this.props.params.id;
		}
		Store.Actions().Search(query);
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
				<CreateLink {...this.props} />
				<ReactCSSTransitionGroup transitionName="fade-in" transitionAppear={true}>
				<List data={Store.Results()} />
				</ReactCSSTransitionGroup>
			</section>
		)
	}
};

module.exports = Index;
