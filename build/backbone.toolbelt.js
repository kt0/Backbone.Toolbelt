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
      bindAttr = function ($el, DOMAttr, value, oldValue) { $el.prop(DOMAttr, value) },
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
      }
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
    options || (options = {});
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
      if (attributes == null) {
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
  }

  Toolbelt.Collection = {
    property: function(key, fn, attributes) {
      // create a copy of attributes (that might change!)
      if (!key || !fn) { return; }
      // No need for binding! it's static, event an empty array will result in binding!
      // Most time user want to listen on 'change' not 'change:key'!
      if (attributes == null) {
        this.locals.set(key, fn.call(this));
      } else {
        var that = this, locals = this.locals, fnChange;
        attributes = [].concat(_.isArray(attributes) ? attributes : [attributes]);
        // I know, This is not good (and absolutely very bad)
        // This is just a placeholder!
        var fnPluck = function(attribute) {
          return that.pluck(attribute);
        }
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
});