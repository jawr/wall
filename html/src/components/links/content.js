var React = require('react');
var Store = require('./store.js');

class Content extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			contentWidth: 0,
			playing: false,
			iframeURL: null
		}

			var self = this;
			$.getJSON('http://noembed.com/embed?url=' + this.props.data.url)
			.success(function(data) {
				if (data.html && data.html.match(/iframe/)) {
					var url = data.html;
					var found = url.match(/src="([^"]+)"/);
					if (found.length > 1) {
						self.setState({
							iframeURL: found[1],
							iframePlaceholder: data.thumbnail_url
						});
					}
				}
			})
			.fail(function(data) {
				console.log('fail', data);
			});
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
		if (this.state.iframeURL) {
			if (this.state.playing) {
				var url = this.state.iframeURL;
				if (!url.match(/(spotify)/)) {
				if (url.match(/\?/)) {
					url += '&autoplay=true&auto_play=true';
				} else {
					url +='?autoplay=true&auto_play=true';
				}
				} else {
					console.log(url);
				}
				content = (
					<iframe width={this.state.contentWidth} src={url} frameBorder="0" allowFullScreen></iframe>
				)
			} else {
				content = (
					<div>
						<img className="u-max-full-width" src={this.state.iframePlaceholder} />
						<div className="overlay" onClick={this.handlePlay}>
							<h1><i className="icon ion-ios-play-outline"></i></h1>
						</div>
					</div>
				)
			}
		} else if (o.url.match(/\.(jpeg|jpg|gif|png)$/i)) {
			content = <img className="u-max-full-width" src={o.url} />
		} else if (o.meta.image.length > 0) {
			content = <img className="u-max-full-width" src={o.meta.image} />
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
