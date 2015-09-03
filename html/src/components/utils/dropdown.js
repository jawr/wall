var React = require('react');
var SubStore = require('../categories/subs/store.js');
var CatStore = require('../categories/store.js');


var Option = React.createClass({
	propTypes: {
		data: React.PropTypes.object.isRequired,
		onSelect: React.PropTypes.func.isRequired
	},
	handleSelect: function() {
		this.props.onSelect(this.props.data);
	},
	render: function() {
		return (
			<span onClick={this.handleSelect} className="option">{this.props.data.name}</span>
		)
	}
});

var EditDropdown = React.createClass({
	propTypes: {
		defaultText: React.PropTypes.string.isRequired,
		store: React.PropTypes.object.isRequired,
		success: React.PropTypes.string,
		fail: React.PropTypes.string,
		options: React.PropTypes.array.isRequired,
		onSelect: React.PropTypes.func,
		save: React.PropTypes.func
	},
	getDefaultProps: function() {
		return {
			success: "Created",
			fail: "CreatedFail"
		}
	},
	getInitialState: function() {
		return {
			show: false,
			searchString: ''
		}
	},
	componentDidMount: function() {
		this.props.store.on(this.props.success, this.success);
		this.props.store.on(this.props.fail, this.fail);
	},
	componentDidUnmount: function() {
		this.props.store.off(this.props.success, this.success);
		this.props.store.off(this.props.fail, this.fail);
	},
	success: function(o) {
		this.handleSelect(o);
	},
	fail: function() {
	},
	handleChange: function(e) {
		this.setState({searchString: e.target.value});
	},
	handleSelect: function(o) {
		// set and close
		if (this.props.onSelect) {
			this.props.onSelect(o);
		}
		// err checking?
		this.setState({show: false});
	},
	toggle: function(e) {
		e.preventDefault();
		this.setState(
			{show: !this.state.show}, 	
			function() {
				var option = React.findDOMNode(this.refs.option);
				if (option) {
					option.focus()
				}
			}
		);
	},
	save: function(e) {
		e.preventDefault();
		if (this.props.save) {
			var value = React.findDOMNode(this.refs.option).value.trim();
			this.props.save(value);	
		}
		//this.toggle(e);
	},
	render: function() {
		if (!this.state.show) {
			return (
				<div className="dropdown edit">
					<a onClick={this.toggle} herf="#">{this.props.defaultText}</a>
				</div>
			)
		}
		var options = (this.state.searchString.length > 0) ?
			this.props.options.filter(function(o) {
				if (o.name.indexOf(this.state.searchString) > -1) {
					return o;
				}
			}, this) :
			[];
		if (options.length > 0) {
			options = this.props.options.map(function(o) {
				// create option component
				return <Option onSelect={this.handleSelect} key={o.id} data={o} />
			}, this);
			options = (
				<div className="search">
					{options}
				</div>
			)
		} else {
			options = null;
		}
		return (
			<div className="dropdown edit row">
				<div className="eight columns">
					<input onChange={this.handleChange} type="text" ref="option" className="u-full-width" />
					{options}
				</div>
				<div className="two columns">
				<button onClick={this.save}><i className="icon ion-ios-checkmark-empty"></i></button>
				</div>
			</div>
		)
	}
});

var CatEditDropdown = React.createClass({
	handleSave: function(value) {
		var o = {
			name: value
		};
		CatStore.Actions().Create(o);
	},
	render: function() {
		var o = this.props.data;
		return (
			<EditDropdown 
				store={CatStore}
				options={CatStore.Results()} 
				defaultText={o.sub_category_id.category_id.name} 
				save={this.handleSave}
				{...this.props} />
		)
	}
});

var SubEditDropdown = React.createClass({
	handleSave: function(value) {
		var o = {
			category_id: this.props.data.sub_category_id.category_id,
			name: value
		};
		SubStore.Actions().Create(o);
	},
	render: function() {
		var o = this.props.data;
		return (
			<EditDropdown 
				store={SubStore}
				options={SubStore.GetByCatID(o.sub_category_id.category_id.id)} 
				defaultText={o.sub_category_id.name} 
				save={this.handleSave}
				{...this.props} />
		)
	}
});

module.exports = {
	EditDropDown: EditDropdown,
	CatEditDropDown: CatEditDropdown,
	SubEditDropDown: SubEditDropdown
};
