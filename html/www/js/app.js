(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var React = require('react');
var ExecutionEnvironment = require('react/lib/ExecutionEnvironment');
var ModalPortal = React.createFactory(require('./ModalPortal'));
var ariaAppHider = require('../helpers/ariaAppHider');
var injectCSS = require('../helpers/injectCSS');
var elementClass = require('element-class');

var SafeHTMLElement = ExecutionEnvironment.canUseDOM ? window.HTMLElement : {};

var Modal = module.exports = React.createClass({

  displayName: 'Modal',

  statics: {
    setAppElement: ariaAppHider.setElement,
    injectCSS: injectCSS
  },

  propTypes: {
    isOpen: React.PropTypes.bool.isRequired,
    onRequestClose: React.PropTypes.func,
    appElement: React.PropTypes.instanceOf(SafeHTMLElement),
    closeTimeoutMS: React.PropTypes.number,
    ariaHideApp: React.PropTypes.bool
  },

  getDefaultProps: function () {
    return {
      isOpen: false,
      ariaHideApp: true,
      closeTimeoutMS: 0
    };
  },

  componentDidMount: function() {
    this.node = document.createElement('div');
    this.node.className = 'ReactModalPortal';
    document.body.appendChild(this.node);
    this.renderPortal(this.props);
  },

  componentWillReceiveProps: function(newProps) {
    this.renderPortal(newProps);
  },

  componentWillUnmount: function() {
    React.unmountComponentAtNode(this.node);
    document.body.removeChild(this.node);
  },

  renderPortal: function(props) {
    if (props.isOpen) {
      elementClass(document.body).add('ReactModal__Body--open');
    } else {
      elementClass(document.body).remove('ReactModal__Body--open');
    }

    if (props.ariaHideApp) {
      ariaAppHider.toggle(props.isOpen, props.appElement);
    }
    sanitizeProps(props);
    if (this.portal)
      this.portal.setProps(props);
    else
      this.portal = React.render(ModalPortal(props), this.node);
  },

  render: function () {
    return null;
  }
});

function sanitizeProps(props) {
  delete props.ref;
}

},{"../helpers/ariaAppHider":3,"../helpers/injectCSS":5,"./ModalPortal":2,"element-class":10,"react":undefined,"react/lib/ExecutionEnvironment":11}],2:[function(require,module,exports){
var React = require('react');
var div = React.DOM.div;
var focusManager = require('../helpers/focusManager');
var scopeTab = require('../helpers/scopeTab');
var cx = require('classnames');

// so that our CSS is statically analyzable
var CLASS_NAMES = {
  overlay: {
    base: 'ReactModal__Overlay',
    afterOpen: 'ReactModal__Overlay--after-open',
    beforeClose: 'ReactModal__Overlay--before-close'
  },
  content: {
    base: 'ReactModal__Content',
    afterOpen: 'ReactModal__Content--after-open',
    beforeClose: 'ReactModal__Content--before-close'
  }
};

var OVERLAY_STYLES = { position: 'fixed', left: 0, right: 0, top: 0, bottom: 0 };

function stopPropagation(event) {
  event.stopPropagation();
}

var ModalPortal = module.exports = React.createClass({

  displayName: 'ModalPortal',

  getInitialState: function() {
    return {
      afterOpen: false,
      beforeClose: false
    };
  },

  componentDidMount: function() {
    // Focus needs to be set when mounting and already open
    if (this.props.isOpen) {
      this.setFocusAfterRender(true);
      this.open();
    }
  },

  componentWillReceiveProps: function(newProps) {
    // Focus only needs to be set once when the modal is being opened
    if (!this.props.isOpen && newProps.isOpen) {
      this.setFocusAfterRender(true);
      this.open();
    } else if (this.props.isOpen && !newProps.isOpen) {
      this.close();
    }
  },

  componentDidUpdate: function () {
    if (this.focusAfterRender) {
      this.focusContent();
      this.setFocusAfterRender(false);
    }
  },

  setFocusAfterRender: function (focus) {
    this.focusAfterRender = focus;
  },

  open: function() {
    focusManager.setupScopedFocus(this.getDOMNode());
    focusManager.markForFocusLater();
    this.setState({isOpen: true}, function() {
      this.setState({afterOpen: true});
    }.bind(this));
  },

  close: function() {
    if (!this.ownerHandlesClose())
      return;
    if (this.props.closeTimeoutMS > 0)
      this.closeWithTimeout();
    else
      this.closeWithoutTimeout();
  },

  focusContent: function() {
    this.refs.content.getDOMNode().focus();
  },

  closeWithTimeout: function() {
    this.setState({beforeClose: true}, function() {
      setTimeout(this.closeWithoutTimeout, this.props.closeTimeoutMS);
    }.bind(this));
  },

  closeWithoutTimeout: function() {
    this.setState({
      afterOpen: false,
      beforeClose: false
    }, this.afterClose);
  },

  afterClose: function() {
    focusManager.returnFocus();
    focusManager.teardownScopedFocus();
  },

  handleKeyDown: function(event) {
    if (event.keyCode == 9 /*tab*/) scopeTab(this.refs.content.getDOMNode(), event);
    if (event.keyCode == 27 /*esc*/) this.requestClose();
  },

  handleOverlayClick: function() {
    if (this.ownerHandlesClose())
      this.requestClose();
    else
      this.focusContent();
  },

  requestClose: function() {
    if (this.ownerHandlesClose())
      this.props.onRequestClose();
  },

  ownerHandlesClose: function() {
    return this.props.onRequestClose;
  },

  shouldBeClosed: function() {
    return !this.props.isOpen && !this.state.beforeClose;
  },

  buildClassName: function(which) {
    var className = CLASS_NAMES[which].base;
    if (this.state.afterOpen)
      className += ' '+CLASS_NAMES[which].afterOpen;
    if (this.state.beforeClose)
      className += ' '+CLASS_NAMES[which].beforeClose;
    return className;
  },

  render: function() {
    return this.shouldBeClosed() ? div() : (
      div({
        ref: "overlay",
        className: cx(this.buildClassName('overlay'), this.props.overlayClassName),
        style: OVERLAY_STYLES,
        onClick: this.handleOverlayClick
      },
        div({
          ref: "content",
          style: this.props.style,
          className: cx(this.buildClassName('content'), this.props.className),
          tabIndex: "-1",
          onClick: stopPropagation,
          onKeyDown: this.handleKeyDown
        },
          this.props.children
        )
      )
    );
  }
});

},{"../helpers/focusManager":4,"../helpers/scopeTab":6,"classnames":9,"react":undefined}],3:[function(require,module,exports){
var _element = null;

function setElement(element) {
  _element = element;
}

function hide(appElement) {
  validateElement(appElement);
  (appElement || _element).setAttribute('aria-hidden', 'true');
}

function show(appElement) {
  validateElement(appElement);
  (appElement || _element).removeAttribute('aria-hidden');
}

function toggle(shouldHide, appElement) {
  if (shouldHide)
    hide(appElement);
  else
    show(appElement);
}

function validateElement(appElement) {
  if (!appElement && !_element)
    throw new Error('react-modal: You must set an element with `Modal.setAppElement(el)` to make this accessible');
}

function resetForTesting() {
  _element = null;
}

exports.toggle = toggle;
exports.setElement = setElement;
exports.show = show;
exports.hide = hide;
exports.resetForTesting = resetForTesting;


},{}],4:[function(require,module,exports){
var findTabbable = require('../helpers/tabbable');
var modalElement = null;
var focusLaterElement = null;
var needToFocus = false;

function handleBlur(event) {
  needToFocus = true;
}

function handleFocus(event) {
  if (needToFocus) {
    needToFocus = false;
    if (!modalElement) {
      return;
    }
    // need to see how jQuery shims document.on('focusin') so we don't need the
    // setTimeout, firefox doesn't support focusin, if it did, we could focus
    // the the element outisde of a setTimeout. Side-effect of this
    // implementation is that the document.body gets focus, and then we focus
    // our element right after, seems fine.
    setTimeout(function() {
      if (modalElement.contains(document.activeElement))
        return;
      var el = (findTabbable(modalElement)[0] || modalElement);
      el.focus();
    }, 0);
  }
}

exports.markForFocusLater = function() {
  focusLaterElement = document.activeElement;
};

exports.returnFocus = function() {
  try {
    focusLaterElement.focus();
  }
  catch (e) {
    console.warn('You tried to return focus to '+focusLaterElement+' but it is not in the DOM anymore');
  }
  focusLaterElement = null;
};

exports.setupScopedFocus = function(element) {
  modalElement = element;

  if (window.addEventListener) {
    window.addEventListener('blur', handleBlur, false);
    document.addEventListener('focus', handleFocus, true);
  } else {
    window.attachEvent('onBlur', handleBlur);
    document.attachEvent('onFocus', handleFocus);
  }
};

exports.teardownScopedFocus = function() {
  modalElement = null;

  if (window.addEventListener) {
    window.removeEventListener('blur', handleBlur);
    document.removeEventListener('focus', handleFocus);
  } else {
    window.detachEvent('onBlur', handleBlur);
    document.detachEvent('onFocus', handleFocus);
  }
};



},{"../helpers/tabbable":7}],5:[function(require,module,exports){
module.exports = function() {
  injectStyle([
    '.ReactModal__Overlay {',
    '  background-color: rgba(255, 255, 255, 0.75);',
    '}',
    '.ReactModal__Content {',
    '  position: absolute;',
    '  top: 40px;',
    '  left: 40px;',
    '  right: 40px;',
    '  bottom: 40px;',
    '  border: 1px solid #ccc;',
    '  background: #fff;',
    '  overflow: auto;',
    '  -webkit-overflow-scrolling: touch;',
    '  border-radius: 4px;',
    '  outline: none;',
    '  padding: 20px;',
    '}',
    '@media (max-width: 768px) {',
    '  .ReactModal__Content {',
    '    top: 10px;',
    '    left: 10px;',
    '    right: 10px;',
    '    bottom: 10px;',
    '    padding: 10px;',
    '  }',
    '}'
  ].join('\n'));
};

function injectStyle(css) {
  var style = document.getElementById('rackt-style');
  if (!style) {
    style = document.createElement('style');
    style.setAttribute('id', 'rackt-style');
    style.setAttribute("type", "text/css");
  }

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
    document.body.appendChild(style);
  } else {
    style.innerHTML = css;
    document.head.appendChild(style);
  }
}


},{}],6:[function(require,module,exports){
var findTabbable = require('../helpers/tabbable');

module.exports = function(node, event) {
  var tabbable = findTabbable(node);
  var finalTabbable = tabbable[event.shiftKey ? 0 : tabbable.length - 1];
  var leavingFinalTabbable = (
    finalTabbable === document.activeElement ||
    // handle immediate shift+tab after opening with mouse
    node === document.activeElement
  );
  if (!leavingFinalTabbable) return;
  event.preventDefault();
  var target = tabbable[event.shiftKey ? tabbable.length - 1 : 0];
  target.focus();
};

},{"../helpers/tabbable":7}],7:[function(require,module,exports){
/*!
 * Adapted from jQuery UI core
 *
 * http://jqueryui.com
 *
 * Copyright 2014 jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/category/ui-core/
 */

function focusable(element, isTabIndexNotNaN) {
  var nodeName = element.nodeName.toLowerCase();
  return (/input|select|textarea|button|object/.test(nodeName) ?
    !element.disabled :
    "a" === nodeName ?
      element.href || isTabIndexNotNaN :
      isTabIndexNotNaN) && visible(element);
}

function hidden(el) {
  return (el.offsetWidth <= 0 && el.offsetHeight <= 0) ||
    el.style.display === 'none';
}

function visible(element) {
  while (element) {
    if (element === document.body) break;
    if (hidden(element)) return false;
    element = element.parentNode;
  }
  return true;
}

function tabbable(element) {
  var tabIndex = element.getAttribute('tabindex');
  if (tabIndex === null) tabIndex = undefined;
  var isTabIndexNaN = isNaN(tabIndex);
  return (isTabIndexNaN || tabIndex >= 0) && focusable(element, !isTabIndexNaN);
}

function findTabbableDescendants(element) {
  return [].slice.call(element.querySelectorAll('*'), 0).filter(function(el) {
    return tabbable(el);
  });
}

module.exports = findTabbableDescendants;


},{}],8:[function(require,module,exports){
module.exports = require('./components/Modal');


},{"./components/Modal":1}],9:[function(require,module,exports){
/*!
  Copyright (c) 2015 Jed Watson.
  Licensed under the MIT License (MIT), see
  http://jedwatson.github.io/classnames
*/

(function () {
	'use strict';

	function classNames () {

		var classes = '';

		for (var i = 0; i < arguments.length; i++) {
			var arg = arguments[i];
			if (!arg) continue;

			var argType = typeof arg;

			if ('string' === argType || 'number' === argType) {
				classes += ' ' + arg;

			} else if (Array.isArray(arg)) {
				classes += ' ' + classNames.apply(null, arg);

			} else if ('object' === argType) {
				for (var key in arg) {
					if (arg.hasOwnProperty(key) && arg[key]) {
						classes += ' ' + key;
					}
				}
			}
		}

		return classes.substr(1);
	}

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = classNames;
	} else if (typeof define === 'function' && typeof define.amd === 'object' && define.amd){
		// AMD. Register as an anonymous module.
		define(function () {
			return classNames;
		});
	} else {
		window.classNames = classNames;
	}

}());

},{}],10:[function(require,module,exports){
module.exports = function(opts) {
  return new ElementClass(opts)
}

function indexOf(arr, prop) {
  if (arr.indexOf) return arr.indexOf(prop)
  for (var i = 0, len = arr.length; i < len; i++)
    if (arr[i] === prop) return i
  return -1
}

function ElementClass(opts) {
  if (!(this instanceof ElementClass)) return new ElementClass(opts)
  var self = this
  if (!opts) opts = {}

  // similar doing instanceof HTMLElement but works in IE8
  if (opts.nodeType) opts = {el: opts}

  this.opts = opts
  this.el = opts.el || document.body
  if (typeof this.el !== 'object') this.el = document.querySelector(this.el)
}

ElementClass.prototype.add = function(className) {
  var el = this.el
  if (!el) return
  if (el.className === "") return el.className = className
  var classes = el.className.split(' ')
  if (indexOf(classes, className) > -1) return classes
  classes.push(className)
  el.className = classes.join(' ')
  return classes
}

ElementClass.prototype.remove = function(className) {
  var el = this.el
  if (!el) return
  if (el.className === "") return
  var classes = el.className.split(' ')
  var idx = indexOf(classes, className)
  if (idx > -1) classes.splice(idx, 1)
  el.className = classes.join(' ')
  return classes
}

ElementClass.prototype.has = function(className) {
  var el = this.el
  if (!el) return
  var classes = el.className.split(' ')
  return indexOf(classes, className) > -1
}

ElementClass.prototype.toggle = function(className) {
  var el = this.el
  if (!el) return
  if (this.has(className)) this.remove(className)
  else this.add(className)
}

},{}],11:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ExecutionEnvironment
 */

/*jslint evil: true */

"use strict";

var canUseDOM = !!(
  (typeof window !== 'undefined' &&
  window.document && window.document.createElement)
);

/**
 * Simple, lightweight module assisting with the detection and context of
 * Worker. Helps avoid circular dependencies and allows code to reason about
 * whether or not they are in a Worker, even if they never include the main
 * `ReactWorker` dependency.
 */
var ExecutionEnvironment = {

  canUseDOM: canUseDOM,

  canUseWorkers: typeof Worker !== 'undefined',

  canUseEventListeners:
    canUseDOM && !!(window.addEventListener || window.attachEvent),

  canUseViewport: canUseDOM && !!window.screen,

  isInWorker: !canUseDOM // For now, this is true - might change in the future.

};

module.exports = ExecutionEnvironment;

},{}],12:[function(require,module,exports){
'use strict';

var React = require('react');
var Store = require('./store.js');

module.exports = React.createClass({
    displayName: 'exports',

    getInitialState: function getInitialState() {
        return {
            error: null
        };
    },
    componentDidMount: function componentDidMount() {
        this.setSigninButton();
    },
    componentDidUpdate: function componentDidUpdate() {
        this.setSigninButton();
    },
    setSigninButton: function setSigninButton() {
        if (!Store.LoggedIn() && !Store.Processing()) {
            var options = {
                'clientid': '732661791014-gtpitcpfvciphaufnfpcpf6480gqltjg.apps.googleusercontent.com',
                'scope': 'https://www.googleapis.com/auth/plus.profile.emails.read',
                'cookiepolicy': 'single_host_origin',
                'callback': Store.HandleAuth,
                'theme': 'light'
            };
            if (this.state.error != null) {
                options['approvalprompt'] = 'force';
            } else {
                options['approvalprompt'] = 'auto';
            }

            gapi.signin.render(this.refs.login.getDOMNode(), options);
        }
    },
    componentWillMount: function componentWillMount() {
        Store.on('auth.success', this.loggedIn);
        Store.on('auth.error', this.error);
        Store.on('auth.processing', this.change);
    },
    componentWillUnmount: function componentWillUnmount() {
        Store.off('auth.success', this.loggedIn);
        Store.off('auth.error', this.error);
        Store.off('auth.processing', this.change);
    },
    contextTypes: {
        router: React.PropTypes.func
    },
    loggedIn: function loggedIn() {
        this.context.router.transitionTo('wall', { id: Store.User().id });
    },
    change: function change() {
        this.setState({});
    },
    error: function error(err) {
        var err = React.createElement(
            'div',
            { className: 'error' },
            React.createElement('i', { className: 'icon ion-ios7-information-outline' }),
            err
        );
        this.setState({
            error: err
        });
    },
    render: function render() {
        var loginButton = React.createElement(
            'div',
            null,
            React.createElement(
                'p',
                null,
                'Please login using your google account.'
            ),
            React.createElement('span', { ref: 'login', id: 'login-button' })
        );
        if (Store.Processing()) {
            loginButton = React.createElement(
                'p',
                null,
                'Logging in..'
            );
        }

        return React.createElement(
            'div',
            null,
            React.createElement(
                'div',
                { className: 'row' },
                React.createElement(
                    'div',
                    { className: 'one-third column' },
                    React.createElement('p', null)
                ),
                React.createElement(
                    'div',
                    { className: 'one-third column' },
                    loginButton,
                    this.state.error
                )
            )
        );
    }
});

},{"./store.js":13,"react":undefined}],13:[function(require,module,exports){
'use strict';

var Flux = require('flux-react');

var Actions = flux.createActions(['Auth', 'SignOut']);

var URL = '/wall/api/v1/auth/';

var Store = Flux.createStore({
    loggedIn: false,
    processing: false,
    accessToken: '',
    user: {},
    actions: [Actions.Auth, Actions.SignOut],
    revokeToken: function revokeToken() {
        var url = 'https://accounts.google.com/o/oauth2/revoke?token=' + this.accessToken;
        return $.ajax({
            type: 'GET',
            url: url,
            async: false,
            contentType: 'application/json',
            dataType: 'jsonp'
        });
    },
    SignOut: function SignOut() {
        var self = this;
        this.revokeToken().fail(function (data) {
            console.log('google logout error: ', data);
        });
        $.post(URL + 'logout/', {}).done(function (data) {
            self.loggedIn = false;
            self.emit('auth.loggedout');
        }).fail(function (data) {
            console.log('cat logout error: ', data);
        });
    },
    Auth: function Auth(code) {
        var self = this;
        $.get(URL + '?code=' + code).done(function (data) {
            self.user = $.parseJSON(data);
            self.loggedIn = true;
            self.processing = false;
            self.emit('auth.success');
        }).fail(function (data) {
            self.processing = false;
            self.emit('auth.error', $.parseJSON(data.responseText));
        });
    },
    exports: {
        LoggedIn: function LoggedIn() {
            return this.loggedIn;
        },
        Username: function Username() {
            return this.username;
        },
        HandleAuth: function HandleAuth(result) {
            if (result['status']['signed_in']) {
                Actions.Auth(result['code']);
                this.processing = true;
                this.emit('auth.processing');
                this.accessToken = result['access_token'];
            } else {
                console.log(result['error']);
            }
        },
        User: function User() {
            return this.user;
        },
        IsAdmin: function IsAdmin() {
            if ($.isEmptyObject(this.user)) return false;
            return this.user.permissions.is_admin;
        },
        Logout: function Logout() {
            Actions.SignOut();
        },
        Processing: function Processing() {
            return this.processing;
        },
        CheckLogin: function CheckLogin(fn) {
            // we do this blocking
            var self = this;
            $.get(URL + 'status/').done(function (data, status, xhr) {
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

},{"flux-react":undefined}],14:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = require('react');
var CreateLink = require('./links/add.js');
var Store = require('./links/store.js');
var List = require('./links/list.js');
var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;
var Auth = require('./auth/store.js');

var Index = (function (_React$Component) {
	_inherits(Index, _React$Component);

	function Index() {
		var _this = this;

		_classCallCheck(this, Index);

		_get(Object.getPrototypeOf(Index.prototype), 'constructor', this).apply(this, arguments);

		this.handleChange = function () {
			_this.setState({});
		};
	}

	_createClass(Index, [{
		key: 'componentDidMount',
		value: function componentDidMount() {
			Store.on('Results', this.handleChange);
			var query = {};
			if (this.props.params.id) {
				query['user_id'] = this.props.params.id;
			}
			Store.Actions().Search(query);
		}
	}, {
		key: 'componentDidUnmount',
		value: function componentDidUnmount() {
			Store.off('Results', this.handleChange);
		}
	}, {
		key: 'render',
		value: function render() {
			return React.createElement(
				'section',
				null,
				React.createElement(CreateLink, this.props),
				React.createElement(
					ReactCSSTransitionGroup,
					{ transitionName: 'fade-in', transitionAppear: true },
					React.createElement(List, { data: Store.Results() })
				)
			);
		}
	}]);

	return Index;
})(React.Component);

;

module.exports = Index;

},{"./auth/store.js":13,"./links/add.js":15,"./links/list.js":18,"./links/store.js":19,"react":undefined}],15:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = require('react');
var Store = require('./store.js');
var Auth = require('../auth/store.js');

var Add = (function (_React$Component) {
	_inherits(Add, _React$Component);

	function Add(props) {
		var _this = this;

		_classCallCheck(this, Add);

		_get(Object.getPrototypeOf(Add.prototype), 'constructor', this).call(this, props);

		this.handleInputChange = function (event) {
			var state = _this.state;
			state.value = event.target.value;
			state.action = null;
			if (state.value.length > 0) {
				if (state.authed && state.value.match(/^http/i)) {
					state.action = 'add';
				} else {
					state.action = 'search';
				}
			} else {
				Store.Actions().Search();
			}
			_this.setState(state);
		};

		this.handleAdd = function (event) {
			event.preventDefault();
			var elem = React.findDOMNode(_this.refs.input);
			var o = {
				url: elem.value.trim(),
				user_id: Auth.User() // can be changed
			};
			Store.Actions().Create(o);
			elem.value = '';
		};

		this.handleSearch = function (event) {
			event.preventDefault();
			var query = {
				query: _this.state.value
			};
			Store.Actions().Search(query);
		};

		this.state = {
			action: null,
			value: '',
			authed: Auth.LoggedIn() && this.props.params.id == Auth.User().id
		};
	}

	_createClass(Add, [{
		key: 'render',
		value: function render() {
			var action = null;
			if (this.state.action == 'add') {
				action = React.createElement(
					'div',
					{ className: 'four columns' },
					React.createElement(
						'button',
						{ onClick: this.handleAdd, className: 'button-primary u-full-width' },
						'post it'
					)
				);
			} else if (this.state.action == 'search') {
				action = React.createElement(
					'div',
					{ className: 'four columns' },
					React.createElement(
						'button',
						{ onClick: this.handleSearch, className: 'button-primary u-full-width' },
						'search'
					)
				);
			}

			var classes = "eight columns";
			if (action == null) classes = "twelve columns";

			return React.createElement(
				'form',
				null,
				React.createElement(
					'div',
					{ className: 'row' },
					React.createElement(
						'div',
						{ className: classes },
						React.createElement('input', { ref: 'input', className: 'u-full-width', type: 'text', placeholder: 'Add or Search', onChange: this.handleInputChange })
					),
					action
				)
			);
		}
	}]);

	return Add;
})(React.Component);

;

module.exports = Add;

},{"../auth/store.js":13,"./store.js":19,"react":undefined}],16:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = require('react');
var Store = require('./store.js');

var Content = (function (_React$Component) {
	_inherits(Content, _React$Component);

	function Content(props) {
		var _this = this;

		_classCallCheck(this, Content);

		_get(Object.getPrototypeOf(Content.prototype), 'constructor', this).call(this, props);

		this.handlePlay = function (event) {
			if (!_this.state.playing) {
				Store.Actions().IncrClickCount(_this.props.data.id);
			}
			_this.setState({
				playing: !_this.state.playing
			});
		};

		this.state = {
			contentWidth: 0,
			playing: false,
			iframeURL: null
		};

		var self = this;
		$.getJSON('http://noembed.com/embed?url=' + this.props.data.url).success(function (data) {
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
		}).fail(function (data) {
			console.log('fail', data);
		});
	}

	_createClass(Content, [{
		key: 'componentDidMount',
		value: function componentDidMount() {
			var self = this;
			this.setState({
				contentWidth: React.findDOMNode(self).offsetWidth
			});
		}
	}, {
		key: 'render',
		value: function render() {
			var o = this.props.data;
			var content = null;
			if (this.state.iframeURL) {
				if (this.state.playing) {
					var url = this.state.iframeURL;
					if (!url.match(/(spotify)/)) {
						if (url.match(/\?/)) {
							url += '&autoplay=true&auto_play=true';
						} else {
							url += '?autoplay=true&auto_play=true';
						}
					} else {
						console.log(url);
					}
					content = React.createElement('iframe', { width: this.state.contentWidth, src: url, frameBorder: '0', allowFullScreen: true });
				} else {
					content = React.createElement(
						'div',
						null,
						React.createElement('img', { className: 'u-max-full-width', src: this.state.iframePlaceholder }),
						React.createElement(
							'div',
							{ className: 'overlay', onClick: this.handlePlay },
							React.createElement(
								'h1',
								null,
								React.createElement('i', { className: 'icon ion-ios-play-outline' })
							)
						)
					);
				}
			} else if (o.url.match(/\.(jpeg|jpg|gif|png)$/i)) {
				content = React.createElement('img', { className: 'u-max-full-width', src: o.url });
			} else if (o.meta.image.length > 0) {
				content = React.createElement('img', { className: 'u-max-full-width', src: o.meta.image });
			}

			if (content == null) {
				content = React.createElement('div', null);
			} else {
				content = React.createElement(
					'div',
					{ className: 'content' },
					content
				);
			}
			return content;
		}
	}]);

	return Content;
})(React.Component);

;

module.exports = Content;

},{"./store.js":19,"react":undefined}],17:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = require('react');
var Store = require('./store.js');
var Content = require('./content.js');
var Modal = require('react-modal');
var moment = require('moment');

var _require = require('../utils/buttons.js');

var SlideInEdit = _require.SlideInEdit;
var Confirm = _require.Confirm;

var Item = (function (_React$Component) {
	_inherits(Item, _React$Component);

	function Item(props) {
		var _this = this;

		_classCallCheck(this, Item);

		_get(Object.getPrototypeOf(Item.prototype), 'constructor', this).call(this, props);

		this.handleChange = function () {
			_this.setState({});
		};

		this.handleClick = function (fn, event) {
			if (event) event.preventDefault();
			fn(_this.props.data);
		};

		this.show = function () {
			Store.on('Results-' + _this.props.data.id, _this.handleChange);
			var self = _this;
			$('body .container').addClass("overlay");
			$('body').on('click', function (e) {
				if (!$(e.target).closest('.ReactModal__Content').length) {
					self.close();
				}
			});
			$('.ReactModal__Content').on('click', function (e) {
				e.stopPropogation();
			});
			// hijack all clicks to close modal
			_this.setState({ show: true });
		};

		this.cleanup = function () {
			$('body').removeClass("ReactModal__Body--open");
			$('.ReactModal__Content').off('click');
			$('body .container').removeClass("overlay");
			Store.off('Results-' + _this.props.data.id, _this.handleChange);
		};

		this.close = function () {
			_this.cleanup();
			_this.setState({ show: false });
		};

		this.handleTitleSave = function (newValue) {
			var o = _this.props.data;
			o.title = newValue;
			Store.Actions().Save(o);
		};

		this.handleTagSave = function (newValue) {
			var o = _this.props.data;
			Store.Actions().AddTag(o, newValue);
		};

		this.handleRemoveTag = function (tag) {
			var o = _this.props.data;
			Store.Actions().RemoveTag(o, tag.name);
		};

		this.buildTags = function () {
			var o = _this.props.data;
			var tags = o.tags || [];
			return React.createElement(
				'div',
				null,
				React.createElement(
					'div',
					null,
					React.createElement(
						SlideInEdit,
						{
							onSave: _this.handleTagSave
						},
						tags.map(function (tag, idx) {
							return React.createElement(
								'span',
								{ className: 'tag-wrapper' },
								React.createElement('i', { onClick: this.handleRemoveTag.bind(this, tag), className: 'icon ion-ios-close-empty' }),
								React.createElement(
									'span',
									{ key: idx, className: 'tag' },
									tag.name
								)
							);
						}, _this)
					)
				)
			);
		};

		this.state = {
			show: false
		};
	}

	_createClass(Item, [{
		key: 'componentWillUnmount',
		value: function componentWillUnmount() {
			this.cleanup();
		}
	}, {
		key: 'render',
		value: function render() {
			var o = this.props.data;
			var modal = null;
			var toggleModal = !this.state.show ? React.createElement(
				'p',
				{ ref: 'target', className: 'footer', onClick: this.show },
				'more info'
			) : React.createElement(
				'p',
				{ ref: 'target', className: 'footer', onClick: this.close },
				'less info'
			);

			var body = null;
			modal = toggleModal;
			if (this.state.show) {
				var tags = this.buildTags();
				body = React.createElement(
					'div',
					null,
					React.createElement(
						'div',
						{ className: 'info' },
						React.createElement(
							SlideInEdit,
							{
								label: 'Title',
								initial: o.title,
								onSave: this.handleTitleSave
							},
							React.createElement(
								'p',
								null,
								o.title
							)
						),
						React.createElement(
							'label',
							null,
							'URL'
						),
						React.createElement(
							'a',
							{ className: 'url', target: '_blank', href: Store.Redirect(o) },
							o.url
						),
						React.createElement(
							'div',
							{ className: 'row' },
							React.createElement(
								'div',
								{ className: 'one-half column' },
								React.createElement(
									'label',
									null,
									'Added'
								),
								React.createElement(
									'p',
									null,
									moment(o.added_at).format('ddd Do MMM YYYY')
								)
							)
						),
						React.createElement(
							'div',
							{ className: 'row' },
							React.createElement(
								'div',
								{ className: 'one-half column' },
								React.createElement(
									'label',
									null,
									'Last Viewed'
								),
								React.createElement(
									'p',
									null,
									moment(o.last_viewed_at).format('ddd Do MMM YYYY')
								)
							),
							React.createElement(
								'div',
								{ className: 'one-half column' },
								React.createElement(
									'label',
									null,
									'Clicks'
								),
								React.createElement(
									'p',
									null,
									o.click_count
								)
							)
						),
						React.createElement(
							'div',
							{ className: 'row' },
							React.createElement(
								'div',
								{ className: 'three-thirds column' },
								React.createElement(
									'label',
									null,
									'Tags'
								),
								tags
							)
						),
						React.createElement('hr', null),
						o.meta.excerpt.length > 0 ? React.createElement(
							'div',
							{ className: 'row' },
							React.createElement(
								'div',
								{ className: 'three-thirds column' },
								React.createElement(
									'p',
									{ className: 'excerpt' },
									o.meta.excerpt
								),
								React.createElement(
									Confirm,
									{ className: 'mini', onClick: this.handleClick.bind(this, Store.Actions().DeleteExcerpt) },
									'Delete Excerpt'
								),
								React.createElement('hr', null)
							)
						) : null,
						React.createElement(
							'div',
							{ className: 'row' },
							React.createElement(
								'div',
								{ className: 'three columns' },
								React.createElement(
									Confirm,
									{ className: 'small u-full-width', onClick: this.handleClick.bind(this, Store.Actions().Delete) },
									'Delete'
								)
							),
							React.createElement(
								'div',
								{ className: 'three columns' },
								React.createElement(
									Confirm,
									{ className: 'small u-full-width', onClick: this.handleClick.bind(this, Store.Actions().Refresh) },
									'Refresh'
								)
							)
						)
					)
				);
				modal = React.createElement(
					Modal,
					{ isOpen: this.state.show },
					body
				);
			}

			var excerpt = null;
			if (o.meta.excerpt.length > 0) {
				excerpt = o.meta.excerpt.substring(0, 120) + '...';
				excerpt = React.createElement(
					'p',
					{ className: 'excerpt-content' },
					excerpt
				);
			}

			var tags = this.buildTags();

			return React.createElement(
				'div',
				{ className: 'panel link one-third column' },
				React.createElement(Content, { data: o }),
				React.createElement(
					'div',
					{ className: 'header info' },
					React.createElement(
						'h6',
						null,
						React.createElement(
							'a',
							{ className: '', target: '_blank', href: Store.Redirect(o) },
							o.title
						)
					),
					excerpt,
					tags,
					modal
				)
			);
		}
	}]);

	return Item;
})(React.Component);

;

module.exports = Item;

},{"../utils/buttons.js":21,"./content.js":16,"./store.js":19,"moment":undefined,"react":undefined,"react-modal":8}],18:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = require('react/addons');
var Item = require('./item.js');
var moment = require('moment');
var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;
var _ = require('underscore');
var LazyLoad = require('react-lazy-load');

function groupByDate(data) {
	var groups = {};
	var lastDate = null;
	data.map(function (o) {
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

var Row = (function (_React$Component) {
	_inherits(Row, _React$Component);

	function Row() {
		_classCallCheck(this, Row);

		_get(Object.getPrototypeOf(Row.prototype), 'constructor', this).apply(this, arguments);
	}

	_createClass(Row, [{
		key: 'render',
		value: function render() {
			var row = this.props.data;
			var items = row.map(function (o) {
				return React.createElement(Item, { key: o.id, data: o });
			});
			return React.createElement(
				LazyLoad,
				null,
				React.createElement(
					'div',
					{ className: 'list-row row' },
					React.createElement(
						ReactCSSTransitionGroup,
						{ transitionName: 'link' },
						items
					)
				)
			);
		}
	}]);

	return Row;
})(React.Component);

;

var Group = (function (_React$Component2) {
	_inherits(Group, _React$Component2);

	function Group() {
		_classCallCheck(this, Group);

		_get(Object.getPrototypeOf(Group.prototype), 'constructor', this).apply(this, arguments);
	}

	_createClass(Group, [{
		key: 'render',
		value: function render() {
			var group = this.props.data;
			var rows = groupByN(group, ITEMS_PER_ROW);
			var date = moment(rows[0][0].added_at).format('ddd Do MMM');
			return React.createElement(
				'div',
				{ className: 'list-group' },
				React.createElement(
					'h5',
					null,
					date
				),
				rows.map(function (o, idx) {
					return React.createElement(Row, { data: o, key: o[0].id });
				})
			);
		}
	}]);

	return Group;
})(React.Component);

;

var List = (function (_React$Component3) {
	_inherits(List, _React$Component3);

	function List() {
		_classCallCheck(this, List);

		_get(Object.getPrototypeOf(List.prototype), 'constructor', this).apply(this, arguments);
	}

	_createClass(List, [{
		key: 'render',
		value: function render() {
			var groups = groupByDate(this.props.data);
			return React.createElement(
				'div',
				{ className: 'list' },
				groups.map(function (o, idx) {
					return React.createElement(Group, { data: o, key: idx + '-' + o.length });
				})
			);
		}
	}]);

	return List;
})(React.Component);

;

module.exports = List;

},{"./item.js":17,"moment":undefined,"react-lazy-load":undefined,"react/addons":undefined,"underscore":undefined}],19:[function(require,module,exports){
'use strict';

var Flux = require('flux-react');
var moment = require('moment');

var _Actions = Flux.createActions(['Save', 'Create', 'Search', 'Delete', 'DeleteExcerpt', 'Refresh', 'IncrClickCount', 'AddTag', 'RemoveTag', 'refreshResults']);

var URL = "/wall/api/v1/links/";

var Store = Flux.createStore({
	results: [],
	actions: [_Actions.Save, _Actions.Create, _Actions.Search, _Actions.Delete, _Actions.DeleteExcerpt, _Actions.Refresh, _Actions.IncrClickCount, _Actions.AddTag, _Actions.RemoveTag, _Actions.refreshResults],
	// remove?
	refreshResults: function refreshResults(n) {
		this.results = this.results.map(function (o) {
			if (n != undefined && o.id == n.id) {
				return n;
			}
			return o;
		});
		this.emit('Results');
	},
	Save: function Save(o) {
		var self = this;
		$.ajax({
			url: URL,
			method: "PUT",
			data: JSON.stringify(o)
		}).done(function (data) {
			self.emit('results', $.parseJSON(data));
			self.emit('Results-' + o.id);
		}).fail(function (req, data) {
			console.log(data);
		});
	},
	RemoveTag: function RemoveTag(o, tag) {
		var self = this;
		$.ajax({
			url: URL + o.id + '/tags',
			method: "DELETE",
			data: JSON.stringify(tag)
		}).done(function (data) {
			self.emit('results', $.parseJSON(data));
		}).fail(function (req, data) {
			console.log(data);
		});
	},
	AddTag: function AddTag(o, tag) {
		var self = this;
		$.ajax({
			url: URL + o.id + '/tags',
			method: "POST",
			data: JSON.stringify(tag)
		}).done(function (data) {
			self.emit('results', $.parseJSON(data));
		}).fail(function (req, data) {
			console.log(data);
		});
	},
	Create: function Create(o) {
		var self = this;
		$.ajax({
			url: URL,
			method: "POST",
			data: JSON.stringify(o)
		}).done(function (data) {
			self.results.unshift($.parseJSON(data));
			self.emit('results');
		}).fail(function (req, data) {
			console.log(data);
		});
	},
	Delete: function Delete(o) {
		var self = this;
		$.ajax({
			url: URL + o.id + '/',
			method: "DELETE",
			data: JSON.stringify(o)
		}).done(function (data) {
			self.results = self.results.filter(function (i) {
				if (i.id != o.id) {
					return i;
				}
			});
			self.emit('results');
		}).fail(function (req, data) {
			console.log(data);
		});
	},
	DeleteExcerpt: function DeleteExcerpt(o) {
		var self = this;
		$.ajax({
			url: URL + o.id + '/excerpt',
			method: "DELETE",
			data: JSON.stringify(o)
		}).done(function (data) {
			self.emit('results', $.parseJSON(data));
			self.emit('Results-' + o.id);
		}).fail(function (req, data) {
			console.log(data);
		});
	},
	Refresh: function Refresh(o) {
		var self = this;
		$.ajax({
			url: URL + o.id + '/refresh',
			method: "POST",
			data: JSON.stringify(o)
		}).done(function (data) {
			self.emit('results', $.parseJSON(data));
			self.emit('Results-' + o.id);
		}).fail(function (req, data) {
			console.log(data);
		});
	},
	Search: function Search(data) {
		var self = this;
		if (!data) data = {};
		var query = data.query || '%';
		query = query.replace(' ', '%');
		if (query.length > 0 && query[0] != '%') {
			query = '%' + query + '%';
		}
		data['query'] = query;
		$.ajax({
			url: URL,
			method: "GET",
			data: data
		}).done(function (data) {
			self.results = $.parseJSON(data);
			self.emit('results');
		}).fail(function (req, data) {
			console.log(data);
		});
	},
	IncrClickCount: function IncrClickCount(id) {
		var self = this;
		$.ajax({
			url: URL + id + '/incrClickCount',
			method: "POST"
		});
	},
	exports: {
		Actions: function Actions() {
			return _Actions;
		},
		Results: function Results() {
			return this.results;
		},
		Redirect: function Redirect(o) {
			return URL + o.id + '/redirect';
		}
	}
});

Store.on('results', _Actions.refreshResults);
module.exports = Store;

},{"flux-react":undefined,"moment":undefined}],20:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = require('react');
var Store = require('./store.js');
var List = require('./list.js');
var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;

var Wall = (function (_React$Component) {
	_inherits(Wall, _React$Component);

	function Wall() {
		var _this = this;

		_classCallCheck(this, Wall);

		_get(Object.getPrototypeOf(Wall.prototype), 'constructor', this).apply(this, arguments);

		this.handleChange = function () {
			_this.setState({});
		};
	}

	_createClass(Wall, [{
		key: 'componentDidMount',
		value: function componentDidMount() {
			Store.on('Results', this.handleChange);
			var query = {
				user_id: this.props.params.id
			};
			console.log(query);
			Store.Actions().Search(query);
		}
	}, {
		key: 'componentDidUnmount',
		value: function componentDidUnmount() {
			Store.off('Results', this.handleChange);
		}
	}, {
		key: 'render',
		value: function render() {
			return React.createElement(
				'section',
				null,
				React.createElement(
					ReactCSSTransitionGroup,
					{ transitionName: 'fade-in', transitionAppear: true },
					React.createElement(List, { data: Store.Results() })
				)
			);
		}
	}]);

	return Wall;
})(React.Component);

;

module.exports = Wall;

},{"./list.js":18,"./store.js":19,"react":undefined}],21:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = require('react/addons');
var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;

// could turn this in to a factory by manually setting the width+offset by calculating
// the width from character length

var SlideIn = (function (_React$Component) {
	_inherits(SlideIn, _React$Component);

	function SlideIn() {
		var _this = this;

		_classCallCheck(this, SlideIn);

		_get(Object.getPrototypeOf(SlideIn.prototype), "constructor", this).apply(this, arguments);

		this.handleClick = function (event) {
			if (event) event.preventDefault();
			_this.props.onClick();
		};
	}

	_createClass(SlideIn, [{
		key: "render",
		value: function render() {
			return React.createElement(
				"div",
				{ className: "wrapper", onClick: this.handleClick },
				React.createElement(
					"button",
					{ onClick: this.handleClick, className: "button mini", id: "slide" },
					"Edit"
				),
				React.createElement(
					ReactCSSTransitionGroup,
					{ transitionName: "fade-in", transitionAppear: true },
					this.props.children
				)
			);
		}
	}], [{
		key: "propTypes",
		value: {
			onClick: React.PropTypes.func.isRequired
		},
		enumerable: true
	}]);

	return SlideIn;
})(React.Component);

var SlideInEdit = (function (_React$Component2) {
	_inherits(SlideInEdit, _React$Component2);

	_createClass(SlideInEdit, null, [{
		key: "propTypes",
		value: {
			onSave: React.PropTypes.func.isRequired
		},
		enumerable: true
	}, {
		key: "defaultProps",
		value: {
			initial: ''
		},
		enumerable: true
	}]);

	function SlideInEdit(props) {
		var _this2 = this;

		_classCallCheck(this, SlideInEdit);

		_get(Object.getPrototypeOf(SlideInEdit.prototype), "constructor", this).call(this, props);

		this.toggle = function () {
			var edit = !_this2.state.edit;
			_this2.setState({ edit: edit });
		};

		this.state = {
			edit: false,
			value: this.props.initial
		};
	}

	_createClass(SlideInEdit, [{
		key: "componentWillReceiveProps",
		value: function componentWillReceiveProps(next) {
			this.setState({ value: next.initial });
		}
	}, {
		key: "componentDidUpdate",
		value: function componentDidUpdate() {
			if (this.state.edit) {
				var input = React.findDOMNode(this.refs.input);
				input.focus();
				var self = this;
				// use namespace to unbind?
				$(input).keydown(function (event) {
					if (event.keyCode == 13) {
						self.props.onSave(input.value.trim());
						self.toggle();
					} else if (event.keyCode == 27) {
						self.toggle();
					}
				});
			}
		}
	}, {
		key: "render",
		value: function render() {
			var main = null;
			if (this.state.edit) {
				var children = React.Children.map(this.props.children, function (i) {
					return React.addons.cloneWithProps(i, { className: "edit" });
				});
				main = React.createElement(
					"div",
					null,
					children,
					React.createElement(
						ReactCSSTransitionGroup,
						{ transitionName: "fade-in", transitionAppear: true },
						React.createElement("input", { type: "text", defaultValue: this.state.value, className: "u-full-width", ref: "input" })
					)
				);
			} else {
				main = React.createElement(
					SlideIn,
					{ onClick: this.toggle },
					this.props.children
				);
			}

			return React.createElement(
				"div",
				null,
				React.createElement(
					"label",
					null,
					this.props.label
				),
				main
			);
		}
	}]);

	return SlideInEdit;
})(React.Component);

var Confirm = (function (_React$Component3) {
	_inherits(Confirm, _React$Component3);

	function Confirm(props) {
		var _this3 = this;

		_classCallCheck(this, Confirm);

		_get(Object.getPrototypeOf(Confirm.prototype), "constructor", this).call(this, props);

		this.handleClick = function (event) {
			event.preventDefault();
			if (_this3.state.confirm) {
				_this3.props.onClick.apply();
				_this3.setState({ confirm: false });
			} else {
				_this3.setState({ confirm: true });
				var self = _this3;
				setTimeout(function () {
					self.setState({ confirm: false });
				}, 2500);
			}
		};

		this.state = {
			confirm: false
		};
	}

	_createClass(Confirm, [{
		key: "render",
		value: function render() {
			var children = this.props.children;
			var classes = this.props.className;
			if (this.state.confirm) {
				children = "sure?";
				classes += " button-primary";
			}
			return React.createElement(
				"button",
				{
					className: classes,
					onClick: this.handleClick
				},
				children
			);
		}
	}]);

	return Confirm;
})(React.Component);

module.exports = {
	SlideInEdit: SlideInEdit,
	Confirm: Confirm
};

},{"react/addons":undefined}],22:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = require('react');
var Index = require('./components/index.js');
var Modal = require('react-modal');
var Router = require('react-router');
var Route = Router.Route;
var DefaultRoute = Router.DefaultRoute;
var RouteHandler = Router.RouteHandler;

var Auth = require('./components/auth/store.js');
var Login = require('./components/auth/login.js');
var Wall = require('./components/links/wall.js');

var Header = (function (_React$Component) {
	_inherits(Header, _React$Component);

	function Header(props) {
		_classCallCheck(this, Header);

		_get(Object.getPrototypeOf(Header.prototype), 'constructor', this).call(this, props);

		this.renderSettings = function () {
			return React.createElement('div', null);
		};

		this.state = {
			small: false
		};
	}

	_createClass(Header, [{
		key: 'componentDidMount',
		value: function componentDidMount() {
			var self = this;
			$(window).bind('scroll', function (e) {
				var $window = $(window);
				var offset = $window.scrollTop();
				if (offset > 100 && !self.state.small) {
					self.setState({
						small: true
					});
				} else if (offset < 100 && self.state.small) {
					self.setState({
						small: false
					});
				}
			});
		}
	}, {
		key: 'componentDidUnmount',
		value: function componentDidUnmount() {
			var self = this;
			$(window).unbind('scroll');
		}
	}, {
		key: 'render',
		value: function render() {
			var classes = "";
			var menu = [];
			if (this.state.small) {
				classes += " small";
			} else {
				if (Auth.LoggedIn()) {
					var toIndex = function toIndex() {
						Auth.Logout();
						location.reload();
					};
					menu.push(React.createElement(
						'button',
						{ className: 'button mini', onClick: toIndex },
						'Sign Out'
					));
					menu.push(React.createElement(
						'button',
						{ className: 'button mini', onClick: this.renderSettings },
						'settings'
					));
				} else {
					var self = this;
					var toLogin = function toLogin() {
						self.context.router.transitionTo('login');
					};
					menu.push(React.createElement(
						'button',
						{ className: 'button mini', onClick: toLogin },
						'Sign In'
					));
				}
			}

			if (menu.length > 0) {
				menu = React.createElement(
					'div',
					{ className: 'menu' },
					menu
				);
			}

			if (this.context.router.getCurrentPath() == "/wall/login") {
				menu = null;
			}

			return React.createElement(
				'div',
				{ className: "container" + classes },
				React.createElement(
					'section',
					{ className: "header" + classes },
					React.createElement(
						'h2',
						null,
						React.createElement('i', { className: 'icon ion-ios-albums-outline' })
					),
					React.createElement(
						'h2',
						null,
						'Wall'
					),
					menu
				),
				this.props.children
			);
		}
	}], [{
		key: 'contextTypes',
		value: {
			router: React.PropTypes.func.isRequired
		},
		enumerable: true
	}]);

	return Header;
})(React.Component);

;

var App = (function (_React$Component2) {
	_inherits(App, _React$Component2);

	function App() {
		_classCallCheck(this, App);

		_get(Object.getPrototypeOf(App.prototype), 'constructor', this).apply(this, arguments);
	}

	_createClass(App, [{
		key: 'render',
		value: function render() {
			return React.createElement(
				Header,
				null,
				React.createElement(RouteHandler, this.props)
			);
		}
	}]);

	return App;
})(React.Component);

;

var routes = React.createElement(
	Route,
	{ name: 'app', path: '/wall/', handler: App },
	React.createElement(Route, { name: 'index', handler: Index }),
	React.createElement(Route, { name: 'login', path: '/wall/login', handler: Login }),
	React.createElement(Route, { name: 'wall', path: '/wall/:id', handler: Index }),
	React.createElement(DefaultRoute, { handler: Index })
);

var appElement = document.getElementById('app');
Modal.setAppElement(appElement);
Modal.injectCSS();

$(function () {
	Auth.CheckLogin(function () {
		Router.run(routes, Router.HistoryLocation, function (Handler, state) {
			if (state.pathname == "/wall/" && !Auth.LoggedIn()) {
				Handler.transitionTo("login");
				return;
			}
			var params = state.params;
			React.render(React.createElement(Handler, { params: params }), appElement);
		});
	});
});

},{"./components/auth/login.js":12,"./components/auth/store.js":13,"./components/index.js":14,"./components/links/wall.js":20,"react":undefined,"react-modal":8,"react-router":undefined}]},{},[22]);
