var Flux = require('flux-react');

var Actions = flux.createActions([
    'Auth',
    'SignOut'
]);

var URL = '/wall/api/v1/auth/';

var Store = Flux.createStore({
    loggedIn: false,
    processing: false,
    accessToken: '',
    user: {},
    actions: [
        Actions.Auth,
        Actions.SignOut
    ],
    revokeToken: function() {
        var url = 'https://accounts.google.com/o/oauth2/revoke?token=' + this.accessToken;
        return $.ajax({
            type: 'GET',
            url: url,
            async: false,
            contentType: 'application/json',
            dataType: 'jsonp'
        });
    },
    SignOut: function() {
        var self = this;
        this.revokeToken()
        .fail(function(data) {
            console.log('google logout error: ', data);
        });
        $.post(URL + 'logout/', {})
        .done(function(data) {
            self.loggedIn = false;
            self.emit('auth.loggedout');
        })
        .fail(function(data) {
            console.log('cat logout error: ', data);
        });
    },
    Auth: function(code) {
        var self = this;
        $.get(URL + '?code='+code)
	.done(function(data) {
		self.user = $.parseJSON(data);
            self.loggedIn = true;
            self.processing = false;
            self.emit('auth.success');
        })
        .fail(function(data) {
            self.processing = false;
            self.emit('auth.error', $.parseJSON(data.responseText));
        });
    },
    exports: {
        LoggedIn: function() {
            return this.loggedIn;
        },
        Username: function() {
            return this.username;
        },
        HandleAuth: function(result) {
            if (result['status']['signed_in']) {
                Actions.Auth(result['code']);
                this.processing = true;
                this.emit('auth.processing');
                this.accessToken = result['access_token'];
            } else {
                console.log(result['error']);
            }
        },
        User: function() {
            return this.user;
        },
        IsAdmin: function() {
            if ($.isEmptyObject(this.user)) return false;
            return this.user.permissions.is_admin;
        },
        Logout: function() {
            Actions.SignOut();
        },
        Processing: function() {
            return this.processing;
        },
        CheckLogin: function(fn) {
            // we do this blocking
            var self = this;
            $.get(URL + 'status/')
            .done(function(data, status, xhr) {
                var expires = xhr.getResponseHeader('X-Expires');
                if (expires) {
                    expires = new Date(expires);
                    var now = new Date();
                    if (now < expires) {
                        self.loggedIn = true;
                        self.user = $.parseJSON(data);
                    } else {
                        console.log('EXPIRED MOFO');
                    }
		}
		if (fn) fn();
            });
        }
    }
});

module.exports = Store;
