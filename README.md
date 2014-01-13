Backbone.Toolbelt
=================

This is a Backbone Toolbelt, notihg will be added to original Backbone Objects (except for Tooblelt that added to Backbone)

## What is this?

Another simple library to add things you don't like to use extension for.

## Like what?

* 1/2-way model-view binding
* Nested router
* Router logic

## So why don't use those things?

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
  for (var i = 0; i < 10; i++) {
    collection.add({title: 'Task #'+i, status: !(i%3)});
  }
````