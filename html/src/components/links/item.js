var React = require('react');
var Store = require('./store.js');
var Content = require('./content.js');
var Modal = require('react-modal');
var moment = require('moment');
var {
	SlideInEdit,
	Confirm
} = require('../utils/buttons.js');

class Item extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			show: false
		};
	}

	componentWillUnmount() {
		this.cleanup();
	}

	handleChange = () => {
		this.setState({});
	}

	handleClick = (fn, event) => {
		if (event) event.preventDefault();
		fn(this.props.data);
	}

	show = () => {
		Store.on('Results-' + this.props.data.id, this.handleChange);
		var self = this;
		$('body .container').addClass("overlay");
		$('body').on('click', function(e) {
			if (!$(e.target).closest('.ReactModal__Content').length) {
				self.close();
			}
		});
		$('.ReactModal__Content').on('click', function(e) {
			e.stopPropogation();
		});
		// hijack all clicks to close modal
		this.setState({show: true});
	}

	cleanup = () => {
		$('body').removeClass("ReactModal__Body--open");
		$('.ReactModal__Content').off('click');
		$('body .container').removeClass("overlay");
		Store.off('Results-' + this.props.data.id, this.handleChange);
	}

	close = () => {
		this.cleanup();
		this.setState({show: false});
	}

	handleTitleSave = (newValue) => {
		var o = this.props.data;
		o.title = newValue;
		Store.Actions().Save(o);
	}

	handleTagSave = (newValue) => {
		var o = this.props.data;
		Store.Actions().AddTag(o, newValue);
	}

	handleRemoveTag = (tag) => {
		var o = this.props.data;
		Store.Actions().RemoveTag(o, tag.name);
	}

	buildTags = () => {
		var o = this.props.data;
		var tags = o.tags || [];
		return (
			<div>
				<div>
					<SlideInEdit
						onSave={this.handleTagSave}
						>
						{tags.map(function(tag, idx) {
							return (
								<span className="tag-wrapper">
									<i onClick={this.handleRemoveTag.bind(this, tag)} className="icon ion-ios-close-empty"></i>
									<span key={idx} className="tag">{tag.name}</span>
								</span>
								)
						}, this)}
					</SlideInEdit>
				</div>
			</div>
		)
	}

	render() {
		var o = this.props.data;
		var modal = null;
		var toggleModal =  (!this.state.show) ?
			<p ref="target" className="footer" onClick={this.show}>more info</p> :
			<p ref="target" className="footer" onClick={this.close}>less info</p>

		var body = null;
		modal = toggleModal;
		if (this.state.show) {
			var tags = this.buildTags();
			body = (
				<div>
					<div className="info">
						<SlideInEdit
							label="Title"
							initial={o.title} 
							onSave={this.handleTitleSave}
							>
							<p>{o.title}</p>
						</SlideInEdit>

						<label>URL</label>
						<a className="url" target="_blank" href={Store.Redirect(o)}>{o.url}</a>

						<div className="row">
							<div className="one-half column">
								<label>Added</label>
								<p>{moment(o.added_at).format('ddd Do MMM YYYY')}</p>
							</div>
						</div>

						<div className="row">
							<div className="one-half column">
								<label>Last Viewed</label>
								<p>{moment(o.last_viewed_at).format('ddd Do MMM YYYY')}</p>
							</div>
							<div className="one-half column">
								<label>Clicks</label>
								<p>{o.click_count}</p>
							</div>
						</div>

						<div className="row">
							<div className="three-thirds column">
								<label>Tags</label>
								{tags}
							</div>
						</div>

						<hr />

						{(o.meta.excerpt.length > 0) ?
								<div className="row">
									<div className="three-thirds column">
										<p className="excerpt">{o.meta.excerpt}</p>
										<Confirm className="mini" onClick={this.handleClick.bind(this, Store.Actions().DeleteExcerpt)}>Delete Excerpt</Confirm>
										<hr />
									</div>
								</div>
							: null}

						<div className="row">
							<div className="three columns">
								<Confirm className="small u-full-width" onClick={this.handleClick.bind(this, Store.Actions().Delete)}>Delete</Confirm>
							</div>
							<div className="three columns">
								<Confirm className="small u-full-width" onClick={this.handleClick.bind(this, Store.Actions().Refresh)}>Refresh</Confirm>
							</div>
						</div>
					</div>
				</div>
			);
			modal = <Modal isOpen={this.state.show}>{body}</Modal>
		}

		var excerpt = null;
		if (o.meta.excerpt.length > 0) {
			excerpt = o.meta.excerpt.substring(0, 120) + '...';
			excerpt = <p className="excerpt-content">{excerpt}</p>;
		}

		var tags = this.buildTags();

		return (
			<div className="panel link one-third column">
				<Content data={o} />
				<div className="header info">
					<h6><a className="" target="_blank" href={Store.Redirect(o)}>{o.title}</a></h6>

					{excerpt}

					{tags}

					{modal}
				</div>
			</div>
		)
	}
};

module.exports = Item;
