var Flux = require('flux-react');
var moment = require('moment');

var Actions = Flux.createActions([
	'Save',
	'Create',
	'Search',
	'Delete',
	'DeleteExcerpt',
	'Refresh',
	'IncrClickCount',
	'AddTag',
	'RemoveTag',
	'refreshResults'
]);

var URL = "/wall/api/v1/links/";

var Store = Flux.createStore({
	results: [],
	actions: [
		Actions.Save,
		Actions.Create,
		Actions.Search,
		Actions.Delete,
		Actions.DeleteExcerpt,
		Actions.Refresh,
		Actions.IncrClickCount,
		Actions.AddTag,
		Actions.RemoveTag,
		Actions.refreshResults
	],
	// remove?
	refreshResults: function(n) {
		this.results = this.results.map(function(o) {
			if (n != undefined && o.id == n.id) {
				return n;
			}
			return o;
		});
		this.emit('Results');
	},
	Save: function(o) {
		var self = this;
		$.ajax({
			url: URL,
			method: "PUT",
			data: JSON.stringify(o),
		})
		.done(function(data) {
			self.emit('results', $.parseJSON(data));
			self.emit('Results-' + o.id);
		})
		.fail(function(req, data) {
			console.log(data);
		});
	},
	RemoveTag: function(o, tag) {
		var self = this;
		$.ajax({
			url: URL + o.id + '/tags',
			method: "DELETE",
			data: JSON.stringify(tag),
		})
		.done(function(data) {
			self.emit('results', $.parseJSON(data));
		})
		.fail(function(req, data) {
			console.log(data);
		});
	},
	AddTag: function(o, tag) {
		var self = this;
		$.ajax({
			url: URL + o.id + '/tags',
			method: "POST",
			data: JSON.stringify(tag),
		})
		.done(function(data) {
			self.emit('results', $.parseJSON(data));
		})
		.fail(function(req, data) {
			console.log(data);
		});
	},
	Create: function(o) {
		var self = this;
		$.ajax({
			url: URL,
			method: "POST",
			data: JSON.stringify(o),
		})
		.done(function(data) {
			self.results.unshift($.parseJSON(data));
			self.emit('results');
		})
		.fail(function(req, data) {
			console.log(data);
		});
	},
	Delete: function(o) {
		var self = this;
		$.ajax({
			url: URL + o.id +'/',
			method: "DELETE",
			data: JSON.stringify(o),
		})
		.done(function(data) {
			self.results = self.results.filter(function(i) {
				if (i.id != o.id) {
					return i;
				}
			});
			self.emit('results');
		})
		.fail(function(req, data) {
			console.log(data);
		});
	},
	DeleteExcerpt: function(o) {
		var self = this;
		$.ajax({
			url: URL + o.id +'/excerpt',
			method: "DELETE",
			data: JSON.stringify(o),
		})
		.done(function(data) {
			self.emit('results', $.parseJSON(data));
			self.emit('Results-' + o.id);
		})
		.fail(function(req, data) {
			console.log(data);
		});
	},
	Refresh: function(o) {
		var self = this;
		$.ajax({
			url: URL + o.id + '/refresh',
			method: "POST",
			data: JSON.stringify(o),
		})
		.done(function(data) {
			self.emit('results', $.parseJSON(data));
			self.emit('Results-' + o.id);
		})
		.fail(function(req, data) {
			console.log(data);
		});
	},
	Search: function(data) {
		var self = this;
		if (!data) data = {};
		var query = data.query || '%';
		query = query.replace(' ', '%');
		if (query.length > 0 && query[0] != '%') {
			query = '%'+query+'%';
		}
		data['query'] = query;
		$.ajax({
			url: URL,
			method: "GET",
			data: data
		})
		.done(function(data) {
			self.results = $.parseJSON(data);
			self.emit('results');
		})
		.fail(function(req, data) {
			console.log(data);
		});
	},
	IncrClickCount: function(id) {
		var self = this;
		$.ajax({
			url: URL + id + '/incrClickCount',
			method: "POST"
		});
	},
	exports: {
		Actions: function() {
			return Actions;
		},
		Results: function() {
			return this.results;
		},
		Redirect: function(o) {
			return URL + o.id + '/redirect';
		}
	}
});

Store.on('results', Actions.refreshResults);
module.exports = Store;
