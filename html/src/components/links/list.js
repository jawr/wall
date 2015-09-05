var React = require('react/addons');
var Item = require('./item.js');
var moment = require('moment');
var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;
var _ = require('underscore');
var LazyLoad = require('react-lazy-load')


function groupByDate(data) {
	var groups = {};
	var lastDate = null;
	data.map(function(o) {
		var date = moment(o.added_at).format('ddd Do MMM');
		if (!(date in groups)) {
			groups[date] = [];
		}
		groups[date].push(o);
	});
	return _.values(groups);
}

function groupByN(data, n) {
	var groups = [];
	for (var idx = 0; idx < data.length; idx += n) {
		groups.push(data.slice(idx, idx + n));
	}
	return groups;
}

var ITEMS_PER_ROW = 3;

class Row extends React.Component {
	render() {
		var row = this.props.data;
		var items = row.map(function(o) {
			return 	<Item key={o.id} data={o} />
		});
		return (
			<LazyLoad>
			<div className="list-row row">
				<ReactCSSTransitionGroup transitionName="link">
					{items}
				</ReactCSSTransitionGroup>
			</div>
				</LazyLoad>
		)
	}
};

class Group extends React.Component {
	render() {
		var group = this.props.data;
		var rows = groupByN(group, ITEMS_PER_ROW);
		var date = moment(rows[0][0].added_at).format('ddd Do MMM');
		return (
			<div className="list-group">
				<h5>{date}</h5>
				{rows.map(function(o, idx) {
					return <Row data={o} key={o[0].id} />
				})}
			</div>
		)
	}
};

class List extends React.Component {
	render() {
		var groups = groupByDate(this.props.data);
		return (
			<div className="list">
				{groups.map(function(o, idx) {
					return <Group data={o} key={idx+'-'+o.length} />
				})}
			</div>
		)
	}
};

module.exports = List;
