(function (factory) {

  if (typeof define === 'function' && define.amd)
    define(['underscore', 'backbone', 'jquery'], factory);

  else if (typeof exports === 'object')
    factory(require('underscore'), require('jquery'), require('backbone'));
  else
    factory(_, $, Backbone);

})(function (_, $, Backbone) {
  // If any object in backbone named toolbelt remove and add back that as a oldToolbelt
  if (Backbone.Toolbelt) {
    Backbone.oldToolbelt = Backbone.Toolbelt;
  }
  var Toolbelt = Backbone.Toolbelt = {};

  // Create and empty function to use as placeholder for required functions
  var Empty = function() {};

  var arrPro = Array.prototype;
  
  var slice = function(array, start, end) {
    if (!array) return [];
    return arrPro.slice.call(array, start, end);
  };

  Toolbelt.extend = function(source) {
    if (!source) { return; }
    var destinations = slice(arguments, 1), l = destinations.length;
    if (!l) { return; }
    for (var i = 0; i < l; i++ ) {
      if (!destinations[i].prototype) {
        // create empty object for those without prototype
        destinations[i].prototype = {};
      }
      _.extend(destinations[i].prototype, source);
    }
  };

  // Add helper functions and avoid clusores
  // It's may not work (just becauze we are using jquery and no handling over the class)
  // We can't rely on backbone's previous value so we save state (user can use silte: true)
  // DOMAttr just used for bindAttr, and oldValue for bindClass, but for smaller
  // (and better!) code used all the same way!
  var bindClass = function ($el, DOMAttr, value, oldValue) { $el.removeClass(oldValue).addClass(value); },
      bindText = function ($el, DOMAttr, value, oldValue) { $el.text(value); },
      bindHtml = function ($el, DOMAttr, value, oldValue) { $el.html(value); },
      bindAttr = function ($el, DOMAttr, value, oldValue) { $el.prop(DOMAttr, value); },
      // Listen method is used for listening to models change (by attr)
      listen = function (view, model, attr, callback) { view.listenTo(model, 'change:' + attr, callback); },
      generator = function (config, action, that) {
        var oldValue, $el = that.$(config.el);
        if (!$el.length) return;
        return function (newValue) {
          var _ret, $el = that.$(config.el);
          if (config.truthy) {
            _ret = !! newValue ? config.truthy : config.falsy;
          } else {
            _ret = newValue;
          }
          action($el, config.to, _ret, oldValue);
          oldValue = _ret;
        };
      },
      normalizeDOMConfigKeys = {
        'false': false,
        'true': true,
        "'false'": 'false',
        "'true'": 'true',
        '"false"': 'false',
        '"true"': 'true'
      },
      // Normalize dom configuration, change 'false' and 'true' to false and true
      // and '"false"' and '"true"' to "false" and "true"
      normalizeDOMConfig = function(attribute) {
        if (!attribute) return;
        if (normalizeDOMConfigKeys[attribute]) { return normalizeDOMConfigKeys[attribute]; }
        return attribute;
      },
      // Instead of using huge switch case, use a hash and (||) operator!
      type2action = {
        'class': bindClass,
        'html': bindText,
        'bareHtml': bindHtml
      };


  Toolbelt.View = {
    unBindDOM: function (model) {
      if (!this._domCallbacks) { return; }
      if (!model) {
        if (!this.model) {
          return;
        } else {
          model = this.model;
        }
      }
      var callbacks = this._domCallbacks[model.cid];
      if (!callbacks) { return; }
      for (var i = 0, l = callbacks.length; i < l; i++) {
        this.stopListening(model, null, callbacks[i]);
      }

      delete this._domCallbacks[model.cid];
    },

    bindDOM: function (model) {
      if (!model) {
        if (!this.model) {
          return;
        } else {
          model = this.model;
        }
      }

      var DOMAttributes = this.DOMAttributes,
          context = this;

      if (!DOMAttributes) { return; }

      if (!this._domCallbacks) { this._domCallbacks = {}; }

      if (this._domCallbacks[model.cid]) {
        this.unBindDOM(model);
      }

      var domCallbacks = this._domCallbacks[model.cid] = [];
      var config;

      _.each(DOMAttributes, function (settings, attr) {
        var callbacks = [];
        if (!_.isArray(settings)) { settings = [settings]; }
        if (!settings.length) return;
        for (var i = 0, l = settings.length; i < l; i++) {
          config = settings[i];
          // Before this must check for valid config!
          if (!config.el || !config.to) { continue; }

          config.falsy = normalizeDOMConfig(config.falsy);
          config.truthy = normalizeDOMConfig(config.truthy);

          // Below code will add a function with own workspace to callbacks.
          // I think this is acceptable by browser's GC (Not sure about IE, I'm on linux)
          callback = generator(settings[i], type2action[settings[i].to] || bindAttr, context);
          if (callback) callbacks.push(callback);
        }
        var changeFn = function (model, newValue) {
          for (var i = 0, l = callbacks.length; i < l; i++) {
            callbacks[i].call(context, newValue);
          }
        };
        listen(context, model, attr, changeFn);
        domCallbacks.push(changeFn);
        changeFn(model, model.get(attr));
      });
    }
  };

  // Borrowing changin Backbone.Model's constructor
  Toolbelt.Locals = function(attributes, options) {
    var attrs = attributes || {};
    if (!options) options = {};
    this.cid = _.uniqueId('locals'); // Hope backbone or other library don't use that!
    this.attributes = {};
    this.set(attrs, options);
    this.changed = {};
  };

  // Choose things from Backbone's model that we need
  // Keep in mind this act like model there (this is a model without ajax things!)
  // And like arguments in javascript, we like it model-like!
  var mPro = Backbone.Model.prototype,
      lPro = Toolbelt.Locals.prototype,
      localMethods = [ mPro, 'toJSON', 'get', 'set', 'has', 'unset', 'clear', 'clone',
                       'hasChanged', 'changedAttributes', 'previous', 'previousAttributes',
                       'trigger', 'listenToOnce', 'on', 'once', 'off', 'listenTo', 'stopListening'
                     ];

  _.extend(lPro, _.pick.apply(null, localMethods));

  // Haven't decided to add locals validation or not! btw for other Backbone.Model's methods
  // this always return true
  lPro._validate = function() { return true; };

  Toolbelt.Model = {
    toggle: function(key) {
      this.set(key, !this.get(key));
    },
    resetLocals: function(attributes) {
      var attrs = _.extend(_.result(this, 'defaultLocals') || {}, attributes);
      if (this.locals) {
        this.stopListening(this.locals);
        this.locals.stopListening();
        this.locals.off();
        delete this.locals;
      }
      this.locals = new Toolbelt.Locals(attrs);
      this.locals.model = this;
    },
    setLocal: function() {
      return this.locals.set.apply(this.locals, arguments);
    },
    // This is for computed property not attributes!
    property: function(key, fn, attributes) {
      // create a copy of attributes (that might change!)
      if (!key || !fn) { return; }
      // No need for binding! it's static, event an empty array will result in binding!
      // Most time user want to listen on 'change' not 'change:key'!
      if (attributes == void 0) {
        this.locals.set(key, fn.call(this));
      } else {
        var that = this, locals = this.locals;
        attributes = [].concat(_.isArray(attributes) ? attributes : [attributes]);
        this.locals.listenTo(this, 'change', function() {
          // If anything we want is in changed attributes?
          if (_.without.apply(null, [this.previousAttributes()].concat(attributes)).length) {
            locals.set(key, fn.apply(that, _.values(_.pick(that.attributes, attributes))));
          }
        });
        locals.set(key, fn.apply(that, _.values(_.pick(that.attributes, attributes))));
      }
    }
  };

  Toolbelt.Collection = {
    property: function(key, fn, attributes) {
      // create a copy of attributes (that might change!)
      if (!key || !fn) { return; }
      // No need for binding! it's static, event an empty array will result in binding!
      // Most time user want to listen on 'change' not 'change:key'!
      if (attributes == void 0) {
        this.locals.set(key, fn.call(this));
      } else {
        var that = this, locals = this.locals, fnChange;
        attributes = [].concat(_.isArray(attributes) ? attributes : [attributes]);
        // I know, This is not good (and absolutely very bad)
        // This is just a placeholder!
        var fnPluck = function(attribute) {
          return that.pluck(attribute);
        };
        fnChange = function() {
          locals.set(key, fn.apply(that, _.map(attributes, fnPluck)));
        };
        for (var i = 0, l = attributes.length; i < l; i++) {
          var attribute = attributes[i];
          this.locals.listenTo(this, 'change:'+attribute, fnChange);
        }
        this.locals.listenTo(this, 'add', fnChange);
        this.locals.listenTo(this, 'remove', fnChange);
        this.locals.listenTo(this, 'reset', fnChange);
        fnChange();
      }
    }
  };
  Toolbelt.Collection.resetLocals = Toolbelt.Model.resetLocals;

  // Borrowing some code from Backbone.Router (this is not Router like!)
  // Similarity is high but differences are more!
  Toolbelt.MiniRouter = function(options) {
    if (!options) options = {};
    _.extend(this, _.pick(options, 'subroutes', 'start', 'stop', 'initialize', 'router', 'name', 'rootName'));
    this._routes = {};
    this.initialize.apply(this, arguments);
  };

  // Cached regular expressions for matching named param parts and splatted
  // parts of route strings.
  var optionalParam = /\((.*?)\)/g;
  var namedParam    = /(\(\?)?:\w+/g;
  var splatParam    = /\*\w+/g;
  var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;

  var _routeToRegExp = function(parent, route) {
    parent = parent.replace(escapeRegExp, '\\$&')
                 .replace(optionalParam, '(?:$1)?')
                 .replace(namedParam, function(match, optional) {
                   return optional ? match : '([^\/]+)';
                 })
                 .replace(splatParam, '(.*?)');
    return new RegExp('^' + parent + '$');
  };

  var _extractParameters = function(route, fragment) {
    var params = slice(route.exec(fragment), 1);
    return _.map(params, function(param) {
      return param ? decodeURIComponent(param) : null;
    });
  };

  // Create minirouter callback (that compatible in backbone routing way)
  var routeGenerator = function(minirouter, routeRgx) {
    return function() {
      // We need a copy of arguments
      var args = slice(arguments),
          router = minirouter.router,
          _routeStack = router._routeStack,
          _minirouter,
          stackPosition = -1,
          oldRouteStack = [],
          thisRouteStack = [minirouter],
          i, l;
      _minirouter = minirouter;
      // console.log(_.pluck(_routeStack, 'name'));
      while ((_minirouter = _minirouter.parent) != void 0) {
        thisRouteStack.unshift(_minirouter);
      }
      while ((_minirouter = _routeStack.pop()) != void 0) {
        if ((stackPosition = _.indexOf(thisRouteStack, _minirouter)) !== -1) {
          _routeStack.push(_minirouter);
          break;
        } else {
          oldRouteStack.push(_minirouter);
        }
      }
      // console.log(_.pluck(oldRouteStack, 'name'));
      newRouteStack = thisRouteStack.slice(stackPosition + 1);
      // console.log(stackPosition);
      // console.log(_.pluck(newRouteStack, 'name'));
      // console.log('args');
      // console.log(args);
      var fragment = Backbone.history.previousPath, c = 0, fragments, argsStopStack = [];
      // console.log(fragment);
      if (fragment) {
        var oldArgs = Backbone.history.oldArgs;
        for (i = 0, l = _routeStack.length; i < l; i++) {
          fragments = _extractParameters(_routeStack[i].root, fragment);
          c += fragments.length - 1;
          fragment = fragments[0];
        }
        for (i = oldRouteStack.length; i--; ) {
          // console.log(fragment);
          fragments = _extractParameters(oldRouteStack[i].root, fragment);
          // console.log(fragments);
          c += fragments.length - 1;
          argsStopStack.unshift(oldArgs.slice(c));
          fragment = fragments[0];
        }
        // console.log(argsStopStack);
        for (i = 0, l = oldRouteStack.length; i < l; i++) {
          oldRouteStack[i]._callStop.apply(oldRouteStack[i], argsStopStack[i]);
        }
      }
      fragment = Backbone.history.fragment;
      c = 0;
      for (i = 0, l = _routeStack.length; i < l; i++) {
        fragments = _extractParameters(_routeStack[i].root, fragment);
        c += fragments.length - 1;
        fragment = fragments[0];
      }
      // console.log('new args');
      // console.log(args.slice(c));
      _minirouter = minirouter;
      for (i = 0, l = newRouteStack.length; i < l; i++) {
        fragments = _extractParameters(newRouteStack[i].root, fragment);
        // console.log(fragments);
        c += fragments.length - 1;
        fragment = fragments[0];
        newRouteStack[i]._callStart(args.slice(c));
      }
      router._routeStack = _routeStack.concat(newRouteStack);
    };
  };

  _.extend(Toolbelt.MiniRouter.prototype, {
    initialize: Empty,
    start: Empty,
    stop: Empty,
    _findRoute: function(fragment) {
      var minirouter;
      for (var i = 0, l = this._minirouts.length; i < l; i++) {
        minirouter = this._minirouts[i];
        if (minirouter.routeRgx.test(fragment)) return minirouter;
      }
    },
    _callStop: function() {
      this.stop.apply(this, arguments);
    },
    _callStart: function() {
      this.start.apply(this, arguments);
    },
    _route: function(route, minirouter) {
      if (_.isRegExp(route)) {
        throw new Error("I don't know much about regex, therefor can't create subroutes with regex! sorry!");
      }
      if (minirouter instanceof Toolbelt.MiniRouter) {
        if (!minirouter.router) minirouter.router = this.router;
      }
      else if (_.isObject(minirouter)) {
        minirouter = new Toolbelt.MiniRouter(minirouter);
        minirouter.router = this.router;
      } else {
        // Ok, what about handling normal routes?
        return this;
      }
      minirouter.parent = this;
      minirouter.name = route;
      minirouter.routeRgx = _routeToRegExp(minirouter.name + '/(*e)');
      if (this.rootName === '') {
        if (this.name === '') {
          minirouter.rootName = '';
        } else {
          minirouter.rootName = this.name + '/';
        }
      } else {
        minirouter.rootName = this.rootName + this.name + '/';
      }
      minirouter.root = _routeToRegExp(minirouter.rootName + '(*e)');
      var routeRgx, callback;
      minirouter.parent._routes[route] = minirouter;
      routeRgx = _routeToRegExp(minirouter.rootName + route);
      callback = routeGenerator(minirouter, routeRgx);
      this.router.route(routeRgx, callback);
      minirouter._bindRoutes();
      this._minirouts.push(minirouter);
      return this;
    },
    _bindRoutes: function() {
      this._minirouts = [];
      if (!this.subroutes) return;
      this.subroutes = _.result(this, 'subroutes');
      var route, routes = _.keys(this.subroutes);
      while ((route = routes.pop()) != void 0) {
        this._route(route, this.subroutes[route]);
      }
    }
  });

  //   funL = Backbone.history.loadUrl
  // Backbone.history.loadUrl = (_fragment)->
  //   fragment = @getFragment(_fragment)
  //   @previousPath = @fragment
  //   funL.apply(this,slice.call(arguments))

  var newBackboneHistory = false,
      overRiderBackboneHistory = function() {
        var lastPath = Backbone.history.fragment;
        Backbone.History.prototype.loadUrl = function(fragment) {
          var router = this;
          fragment = this.fragment = this.getFragment(fragment);
          this.previousPath = lastPath == void 0 ? lastPath : fragment;
          return _.any(this.handlers, function(handler) {
            if (handler.route.test(fragment)) {
              handler.callback(fragment);
              router.oldArgs = _extractParameters(handler.route, fragment);
              lastPath = fragment;
              return true;
            }
          });
        };
        newBackboneHistory = true;
      };

  Toolbelt.Router = {
    processSubroutes: function() {
      if (!newBackboneHistory) overRiderBackboneHistory();
      var subroutes = this.subroutes;
      if (!subroutes) { return; }
      this._routes = {};
      this._routeStack = [];
      this.minirouter = new Toolbelt.MiniRouter({router: this, subroutes: subroutes, parent: this, name: '', rootName: ''});
      this.minirouter.root = /^(?:(.*?))?$/;
      this.minirouter._bindRoutes();
    }
  };

});