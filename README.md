***This is a very old expriment, no updates, things may not work, it's DEAD!***

Backbone.Toolbelt
=================

***Under development, not advised to use in production!***

This is a Backbone Toolbelt, notihg will be added to original Backbone Objects (except for Tooblelt that added to Backbone)

<sup>This is Backbone based little sister for my framework [Lilith](https://github.com/KeyKaKiTO/Lilith). and this line isn't advertisement! Clarification!</sup>

## What is this?

Another simple library to add things you don't like to use extension for.

## Like what?

* 1/2-way model-view binding
* Model/Collection computed property
* Nested router
* Router logic

## So why don't use those other extensions?

You don't want to add another heavy code just for simple use case

## So is it a thing for all?

No, this is just a toolbelt, not a framework or library. If you want the whole things use other extension that add all things!

This is just a simple library to remove user's every project repeated code in a simple and elegant way.

## Toolbelt.View

### 1-way model-view Bindings

Usage: 

````javascript
  // Create new View class (could be any view type without things provided with Toolbelt, like Marionette.ItemView)
  View = Backbone.View.extend({
    DOMAttributes: {
      name: [{
        to: 'html',
        el: '.name'
      }],
    }
  });

  // Extend View with extra methods.
  Backbone.Toolbelt.extend(Backbone.Toolbelt.View, View);

  // Create new Backbone.Model instance
  model = new Backbone.Model({name: 'kito'});

  // Create new View instance
  view = new View({el: $('#main').get(0)});

  // Bind model attributes
  view.bindDOM(model);

  // Apply changes to model
  model.set('name', 'KiTO'); // => will result in change in DOM (el's .name)
````

## Toolbelt.Model

### Extra functions

`toggle` : toggles a value (falsy to true and true to false)

````javascript
  model.get('status') // => null
  
  model.toggle('status');

  model.get('status') // => true

  model.toggle('status');
  
  model.get('status') // => false
````

### Local attributes

Usage:
````javascript
  Model = Backbone.Model.extend({
    defaultLocals: {
      status: 'waiting'
    }
  });
  Backbone.Toolbelt.extend(Backbone.Toolbelt.Model, Model);

  var model = new Model();

  model.resetLocals();

  console.log(model.locals.get('status')); // => 'waiting'

  model.locals.set('status', 'resolved'); // => set local attribute

  model.setLocal('status', 'ready'); // => another way to set local attribute
````

### Computed properties

Usage:

````javascript
  // Extend existing model
  Backbone.Toolbelt.extend(Backbone.Toolbelt.Model, Model);

  // Keep in mind that this extension don't override anything! so locals is not create until
  // You create it!

  model.resetLocals();

  model.property('name', function(firstname, lastname) {
    // this keyword here stands for model itself, to access computed properties
    // use this.locals
    return firstname + ' ' +lastname;
  }, ['firstname', 'lastname']);
````

## Toolbelt.Collection

### property (no ready yet)

<sup>There are many times that I wanted to loop through collection models,
change each one, but binding (or in pure backbone re-rendering any model again)
was a heavy process, so decided to make collection's property don't produce on every change,
but when all changes was done (this may result in an small lag in some cases,
will fix it after adding requestAnimationFrame)</sup>

Usage :

````javascript
  var Collection = Backbone.Collection.extend({
    initialize: functions() {
      this.resetLocals();
      this.property('remaining', function(statuses) {
        var remaining = 0;
        _.each(statuses, function(status) {
          if (!status) { remaining++; }
        })
        return remaining;
      }, 'status'); // third parameter could be array!
    }
  });

  Backbone.Toolbelt.extend(Backbone.Toolbelt.Collection, Collection);

  var collection = new Collection();
  // Adding, removing, reseting or changing in collection will result a change
  // in collections computed properties
````

Keep in mind that third parameter is attributes that
you wanted to make property of, therefore if no property set
means that this is an immediate propery, and will not change on
add/remove/reset, to make that happen pass empty array as attributes.


## Toolbelt.Router

A micro routing system (just converts to backbone routes) that let you apply subrouting
and make your router code clear, and a powerfull dictator!

### subroutes

`router.routes` is like before (no magic is there), but `router.subroutes` will
make a nested set of `MiniRouters` that let you specify `start` and `end`
functions for bootstraping and/or closing controllers/views/models/etc.

Usage:

````javascript
  // Extend your router with toolbelt router (you can extend all your routers with just 
  // extending Backbone.Router itself!)
  var createRouter = new Backbone.Toolbelt.MiniRouter({
    start: function() {},
    stop: function() {},
  });
  var Router = Backbone.Router.extend({
    subroutes: {
      posts: {
        start: function() {},
        stop: function() {},
        subroutes: {
          ":id": {
            start: function() {},
          },
          create: createRouter
        }
      }
    },
    help: function() {
      // This is normal route!
    }
  });
  Backbone.Toolbelt.extend(Backbone.Toolbelt.Router, Router);

  var router = new Router();

  // Everything else is just like backbone
````

Hints:
* This is not compatible with Backbone.Router routes, will result an error, use just one of them.

* Using this will change `Backbone.History.prototype.loadUrl` to handle last url and arguemnts!

* The MiniRouter can have router other than current router and applied in another router,
can't find any usecase but maybe one requires that.

* By default MiniRouter is generated automatically on router's subroute generation process
and router set to parent router.

* This approach made with a stack of miniroutes, stack is an attribute inside router (`_routeStack`),
using router other than current router may result in unexpected things.

* Since router store minirouter specific variables inside minirouter so it's prohibited to use a 
minirouter in multiple routers.

* Passing regex as route name will throw error (cause that's much complex and not found anything to handle that)

## Contributers

This library created and maintained by @keykakito ([@keykakito](https://twitter.com/keykakito))

Feel free contribute! :)

This library needs code, wiki pages, docs, gh-pages, build scripts, tests and feedback.

<blockquote cite="https://en.wikiquote.org/wiki/Linus_Torvalds">Most good programmers do programming not because they expect to get paid or get adulation by the public, but because it is fun to program.</blockquote>

***Linus Torvalds***

## Licence

The MIT License (MIT)

Copyright (c) 2014 Kazem Keshavarz

This library released under MIT licence, Check [licence](https://github.com/KeyKaKiTO/Backbone.Toolbelt/blob/master/LICENSE)
