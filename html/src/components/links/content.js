var React = require('react');
var Store = require('./store.js');

class Content extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			contentWidth: 0,
			playing: false
		}
	}

	componentDidMount() {
		var self = this;
		this.setState({
			contentWidth: React.findDOMNode(self).offsetWidth
		});
	}

	handlePlay = (event) => {
		if (!this.state.playing) {
			Store.Actions().IncrClickCount(this.props.data.id);
		}
		this.setState({
			playing: !this.state.playing
		});
	}

	render() {
		var o = this.props.data;
		var content = null;
		if (o.url.indexOf("youtube.com") > -1 && this.state.contentWidth > 0) {
			if (!this.state.playing) {
				var url = o.url
				.replace('www.youtube.com', 'img.youtube.com')
				.replace('watch?v=', '/vi/') + '/hqdefault.jpg';

				content = (
					<div>
						<img className="u-max-full-width" src={url} />
						<div className="overlay" onClick={this.handlePlay}>
							<h1><i className="icon ion-ios-play-outline"></i></h1>
						</div>
					</div>
				)
			} else {
				var url = o.url.replace('watch?v=', 'embed/') + "?autoplay=1";
				content = (
					<iframe width={this.state.contentWidth} src={url} frameBorder="0" allowFullScreen></iframe>
				)
			}
		} else if (o.url.match(/\.(jpeg|jpg|gif|png)$/i)) {
			content = <img className="u-max-full-width" src={o.url} />
		}

		if (content == null) {
			content = <div></div>
		} else {
			content = (
				<div className="content">
					{content}
				</div>
			)
		}
		return content
	}
};

module.exports = Content;
