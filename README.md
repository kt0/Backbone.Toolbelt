Backbone.Toolbelt
==============

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

This is just a simple library to remove user's every project repeated code in an simple and elegant way.

## Toolbelt.View

### Things Added

#### 1-way model-view Bindings

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
  Backbone.Toolbelt.extend(View, Backbone.Toolbelt.View);

  // Create new Backbone.Model instance
  model = new Backbone.Model({name: 'kito'});

  // Create new View instance
  view = new View({el: $('#main').get(0)});

  // Bind model attributes
  view.bindDOM(model);

  // Apply changes to model
  model.set('name', 'KiTO'); // => will result in change in 
````

####