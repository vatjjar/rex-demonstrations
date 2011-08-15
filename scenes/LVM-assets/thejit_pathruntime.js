/*
  File: Core.js

 */

/*
 Object: $jit
 
 Defines the namespace for all library Classes and Objects. 
 This variable is the *only* global variable defined in the Toolkit. 
 There are also other interesting properties attached to this variable described below.
 */
$jit = {};

$jit.version = '2.0.0b';
/*
  Object: $jit.id
  
  Works just like *document.getElementById*
  
  Example:
  (start code js)
  var element = $jit.id('elementId');
  (end code)

*/

/*
 Object: $jit.util
 
 Contains utility functions.
 
 Some of the utility functions and the Class system were based in the MooTools Framework 
 <http://mootools.net>. Copyright (c) 2006-2010 Valerio Proietti, <http://mad4milk.net/>. 
 MIT license <http://mootools.net/license.txt>.
 
 These methods are generally also implemented in DOM manipulation frameworks like JQuery, MooTools and Prototype.
 I'd suggest you to use the functions from those libraries instead of using these, since their functions 
 are widely used and tested in many different platforms/browsers. Use these functions only if you have to.
 
 */
$ = {};
    
$.empty = function() {
};

/*
  Method: extend
  
  Augment an object by appending another object's properties.
  
  Parameters:
  
  original - (object) The object to be extended.
  extended - (object) An object which properties are going to be appended to the original object.
  
  Example:
  (start code js)
  $jit.util.extend({ 'a': 1, 'b': 2 }, { 'b': 3, 'c': 4 }); //{ 'a':1, 'b': 3, 'c': 4 }
  (end code)
*/
$.extend = function(original, extended) {
  for ( var key in (extended || {}))
    original[key] = extended[key];
  return original;
};

$.lambda = function(value) {
  return (typeof value == 'function') ? value : function() {
    return value;
  };
};

$.time = Date.now || function() {
  return +new Date;
};

/*
  Method: splat
  
  Returns an array wrapping *obj* if *obj* is not an array. Returns *obj* otherwise.
  
  Parameters:
  
  obj - (mixed) The object to be wrapped in an array.
  
  Example:
  (start code js)
  $jit.util.splat(3);   //[3]
  $jit.util.splat([3]); //[3]
  (end code)
*/
$.splat = function(obj) {
  var type = $.type(obj);
  return type ? ((type != 'array') ? [ obj ] : obj) : [];
};

$.type = function(elem) {
  var type = $.type.s.call(elem).match(/^\[object\s(.*)\]$/)[1].toLowerCase();
  if(type != 'object') return type;
  if(elem && elem.$$family) return elem.$$family;
  return (elem && elem.nodeName && elem.nodeType == 1)? 'element' : type;
};
$.type.s = Object.prototype.toString;
/*
  Method: each
  
  Iterates through an iterable applying *f*.
  
  Parameters:
  
  iterable - (array) The original array.
  fn - (function) The function to apply to the array elements.
  
  Example:
  (start code js)
  $jit.util.each([3, 4, 5], function(n) { alert('number ' + n); });
  (end code)
*/
$.each = function(iterable, fn) {
  var type = $.type(iterable);
  if (type == 'object') {
    for ( var key in iterable)
      fn(iterable[key], key);
  } else {
    for ( var i = 0, l = iterable.length; i < l; i++)
      fn(iterable[i], i);
  }
};

$.indexOf = function(array, item) {
  if(Array.indexOf) return array.indexOf(item);
  for(var i=0,l=array.length; i<l; i++) {
    if(array[i] === item) return i;
  }
  return -1;
};

/*
  Method: map
  
  Maps or collects an array by applying *f*.
  
  Parameters:
  
  array - (array) The original array.
  f - (function) The function to apply to the array elements.
  
  Example:
  (start code js)
  $jit.util.map([3, 4, 5], function(n) { return n*n; }); //[9, 16, 25]
  (end code)
*/
$.map = function(array, f) {
  var ans = [];
  $.each(array, function(elem, i) {
    ans.push(f(elem, i));
  });
  return ans;
};

/*
  Method: reduce
  
  Iteratively applies the binary function *f* storing the result in an accumulator.
  
  Parameters:
  
  array - (array) The original array.
  f - (function) The function to apply to the array elements.
  opt - (optional|mixed) The starting value for the acumulator.
  
  Example:
  (start code js)
  $jit.util.reduce([3, 4, 5], function(x, y) { return x + y; }, 0); //12
  (end code)
*/
$.reduce = function(array, f, opt) {
  var l = array.length;
  if(l==0) return opt;
  var acum = arguments.length == 3? opt : array[--l];
  while(l--) {
    acum = f(acum, array[l]);
  }
  return acum;
};

/*
  Method: merge
  
  Merges n-objects and their sub-objects creating a new, fresh object.
  
  Parameters:
  
  An arbitrary number of objects.
  
  Example:
  (start code js)
  $jit.util.merge({ 'a': 1, 'b': 2 }, { 'b': 3, 'c': 4 }); //{ 'a':1, 'b': 3, 'c': 4 }
  (end code)
*/
$.merge = function() {
  var mix = {};
  for ( var i = 0, l = arguments.length; i < l; i++) {
    var object = arguments[i];
    if ($.type(object) != 'object')
      continue;
    for ( var key in object) {
      var op = object[key], mp = mix[key];
      mix[key] = (mp && $.type(op) == 'object' && $.type(mp) == 'object') ? $
          .merge(mp, op) : $.unlink(op);
    }
  }
  return mix;
};

$.unlink = function(object) {
  var unlinked;
  switch ($.type(object)) {
  case 'object':
    unlinked = {};
    for ( var p in object)
      unlinked[p] = $.unlink(object[p]);
    break;
  case 'array':
    unlinked = [];
    for ( var i = 0, l = object.length; i < l; i++)
      unlinked[i] = $.unlink(object[i]);
    break;
  default:
    return object;
  }
  return unlinked;
};

$.zip = function() {
  if(arguments.length === 0) return [];
  for(var j=0, ans=[], l=arguments.length, ml=arguments[0].length; j<ml; j++) {
    for(var i=0, row=[]; i<l; i++) {
      row.push(arguments[i][j]);
    }
    ans.push(row);
  }
  return ans;
};

/*
  Method: rgbToHex
  
  Converts an RGB array into a Hex string.
  
  Parameters:
  
  srcArray - (array) An array with R, G and B values
  
  Example:
  (start code js)
  $jit.util.rgbToHex([255, 255, 255]); //'#ffffff'
  (end code)
*/
$.rgbToHex = function(srcArray, array) {
  if (srcArray.length < 3)
    return null;
  if (srcArray.length == 4 && srcArray[3] == 0 && !array)
    return 'transparent';
  var hex = [];
  for ( var i = 0; i < 3; i++) {
    var bit = (srcArray[i] - 0).toString(16);
    hex.push(bit.length == 1 ? '0' + bit : bit);
  }
  return array ? hex : '#' + hex.join('');
};

/*
  Method: hexToRgb
  
  Converts an Hex color string into an RGB array.
  
  Parameters:
  
  hex - (string) A color hex string.
  
  Example:
  (start code js)
  $jit.util.hexToRgb('#fff'); //[255, 255, 255]
  (end code)
*/
$.hexToRgb = function(hex) {
  if (hex.length != 7) {
    hex = hex.match(/^#?(\w{1,2})(\w{1,2})(\w{1,2})$/);
    hex.shift();
    if (hex.length != 3)
      return null;
    var rgb = [];
    for ( var i = 0; i < 3; i++) {
      var value = hex[i];
      if (value.length == 1)
        value += value;
      rgb.push(parseInt(value, 16));
    }
    return rgb;
  } else {
    hex = parseInt(hex.slice(1), 16);
    return [ hex >> 16, hex >> 8 & 0xff, hex & 0xff ];
  }
};

$.destroy = function(elem) {
  $.clean(elem);
  if (elem.parentNode)
    elem.parentNode.removeChild(elem);
  if (elem.clearAttributes)
    elem.clearAttributes();
};

$.clean = function(elem) {
  for (var ch = elem.childNodes, i = 0, l = ch.length; i < l; i++) {
    $.destroy(ch[i]);
  }
};

/*
  Method: addEvent
  
  Cross-browser add event listener.
  
  Parameters:
  
  obj - (obj) The Element to attach the listener to.
  type - (string) The listener type. For example 'click', or 'mousemove'.
  fn - (function) The callback function to be used when the event is fired.
  
  Example:
  (start code js)
  $jit.util.addEvent(elem, 'click', function(){ alert('hello'); });
  (end code)
*/
$.addEvent = function(obj, type, fn) {
  if (obj.addEventListener)
    obj.addEventListener(type, fn, false);
  else
    obj.attachEvent('on' + type, fn);
};

$.addEvents = function(obj, typeObj) {
  for(var type in typeObj) {
    $.addEvent(obj, type, typeObj[type]);
  }
};

$.hasClass = function(obj, klass) {
  return (' ' + obj.className + ' ').indexOf(' ' + klass + ' ') > -1;
};

$.addClass = function(obj, klass) {
  if (!$.hasClass(obj, klass))
    obj.className = (obj.className + " " + klass);
};

$.removeClass = function(obj, klass) {
  obj.className = obj.className.replace(new RegExp(
      '(^|\\s)' + klass + '(?:\\s|$)'), '$1');
};

$.getPos = function(elem) {
  var offset = getOffsets(elem);
  var scroll = getScrolls(elem);
  return {
    x: offset.x - scroll.x,
    y: offset.y - scroll.y
  };

  function getOffsets(elem) {
    var position = {
      x: 0,
      y: 0
    };
    while (elem && !isBody(elem)) {
      position.x += elem.offsetLeft;
      position.y += elem.offsetTop;
      elem = elem.offsetParent;
    }
    return position;
  }

  function getScrolls(elem) {
    var position = {
      x: 0,
      y: 0
    };
    while (elem && !isBody(elem)) {
      position.x += elem.scrollLeft;
      position.y += elem.scrollTop;
      elem = elem.parentNode;
    }
    return position;
  }

  function isBody(element) {
    return (/^(?:body|html)$/i).test(element.tagName);
  }
};

$.event = {
  get: function(e, win) {
    win = win || window;
    return e || win.event;
  },
  getWheel: function(e) {
    return e.wheelDelta? e.wheelDelta / 120 : -(e.detail || 0) / 3;
  },
  isRightClick: function(e) {
    return (e.which == 3 || e.button == 2);
  },
  getPos: function(e, win) {
    // get mouse position
    win = win || window;
    e = e || win.event;
    var doc = win.document;
    doc = doc.documentElement || doc.body;
    //TODO(nico): make touch event handling better
    if(e.touches && e.touches.length) {
      e = e.touches[0];
    }
    var page = {
      x: e.pageX || (e.clientX + doc.scrollLeft),
      y: e.pageY || (e.clientY + doc.scrollTop)
    };
    return page;
  },
  stop: function(e) {
    if (e.stopPropagation) e.stopPropagation();
    e.cancelBubble = true;
    if (e.preventDefault) e.preventDefault();
    else e.returnValue = false;
  }
};

$jit.util = $jit.id = $;

var Class = function(properties) {
  properties = properties || {};
  var klass = function() {
    for ( var key in this) {
      if (typeof this[key] != 'function')
        this[key] = $.unlink(this[key]);
    }
    this.constructor = klass;
    if (Class.prototyping)
      return this;
    var instance = this.initialize ? this.initialize.apply(this, arguments)
        : this;
    //typize
    this.$$family = 'class';
    return instance;
  };

  for ( var mutator in Class.Mutators) {
    if (!properties[mutator])
      continue;
    properties = Class.Mutators[mutator](properties, properties[mutator]);
    delete properties[mutator];
  }

  $.extend(klass, this);
  klass.constructor = Class;
  klass.prototype = properties;
  return klass;
};

Class.Mutators = {

  Implements: function(self, klasses) {
    $.each($.splat(klasses), function(klass) {
      Class.prototyping = klass;
      var instance = (typeof klass == 'function') ? new klass : klass;
      for ( var prop in instance) {
        if (!(prop in self)) {
          self[prop] = instance[prop];
        }
      }
      delete Class.prototyping;
    });
    return self;
  }

};

$.extend(Class, {

  inherit: function(object, properties) {
    for ( var key in properties) {
      var override = properties[key];
      var previous = object[key];
      var type = $.type(override);
      if (previous && type == 'function') {
        if (override != previous) {
          Class.override(object, key, override);
        }
      } else if (type == 'object') {
        object[key] = $.merge(previous, override);
      } else {
        object[key] = override;
      }
    }
    return object;
  },

  override: function(object, name, method) {
    var parent = Class.prototyping;
    if (parent && object[name] != parent[name])
      parent = null;
    var override = function() {
      var previous = this.parent;
      this.parent = parent ? parent[name] : object[name];
      var value = method.apply(this, arguments);
      this.parent = previous;
      return value;
    };
    object[name] = override;
  }

});

Class.prototype.implement = function() {
  var proto = this.prototype;
  $.each(Array.prototype.slice.call(arguments || []), function(properties) {
    Class.inherit(proto, properties);
  });
  return this;
};

$jit.Class = Class;

/*
  Object: $jit.json
  
  Provides JSON utility functions.
  
  Most of these functions are JSON-tree traversal and manipulation functions.
*/
$jit.json = {
  /*
     Method: prune
  
     Clears all tree nodes having depth greater than maxLevel.
  
     Parameters:
  
        tree - (object) A JSON tree object. For more information please see <Loader.loadJSON>.
        maxLevel - (number) An integer specifying the maximum level allowed for this tree. All nodes having depth greater than max level will be deleted.

  */
  prune: function(tree, maxLevel) {
    this.each(tree, function(elem, i) {
      if (i == maxLevel && elem.children) {
        delete elem.children;
        elem.children = [];
      }
    });
  },
  /*
     Method: getParent
  
     Returns the parent node of the node having _id_ as id.
  
     Parameters:
  
        tree - (object) A JSON tree object. See also <Loader.loadJSON>.
        id - (string) The _id_ of the child node whose parent will be returned.

    Returns:

        A tree JSON node if any, or false otherwise.
  
  */
  getParent: function(tree, id) {
    if (tree.id == id)
      return false;
    var ch = tree.children;
    if (ch && ch.length > 0) {
      for ( var i = 0; i < ch.length; i++) {
        if (ch[i].id == id)
          return tree;
        else {
          var ans = this.getParent(ch[i], id);
          if (ans)
            return ans;
        }
      }
    }
    return false;
  },
  /*
     Method: getSubtree
  
     Returns the subtree that matches the given id.
  
     Parameters:
  
        tree - (object) A JSON tree object. See also <Loader.loadJSON>.
        id - (string) A node *unique* identifier.
  
     Returns:
  
        A subtree having a root node matching the given id. Returns null if no subtree matching the id is found.

  */
  getSubtree: function(tree, id) {
    if (tree.id == id)
      return tree;
    for ( var i = 0, ch = tree.children; ch && i < ch.length; i++) {
      var t = this.getSubtree(ch[i], id);
      if (t != null)
        return t;
    }
    return null;
  },
  /*
     Method: eachLevel
  
      Iterates on tree nodes with relative depth less or equal than a specified level.
  
     Parameters:
  
        tree - (object) A JSON tree or subtree. See also <Loader.loadJSON>.
        initLevel - (number) An integer specifying the initial relative level. Usually zero.
        toLevel - (number) An integer specifying a top level. This method will iterate only through nodes with depth less than or equal this number.
        action - (function) A function that receives a node and an integer specifying the actual level of the node.
          
    Example:
   (start code js)
     $jit.json.eachLevel(tree, 0, 3, function(node, depth) {
        alert(node.name + ' ' + depth);
     });
   (end code)
  */
  eachLevel: function(tree, initLevel, toLevel, action) {
    if (initLevel <= toLevel) {
      action(tree, initLevel);
      if(!tree.children) return;
      for ( var i = 0, ch = tree.children; i < ch.length; i++) {
        this.eachLevel(ch[i], initLevel + 1, toLevel, action);
      }
    }
  },
  /*
     Method: each
  
      A JSON tree iterator.
  
     Parameters:
  
        tree - (object) A JSON tree or subtree. See also <Loader.loadJSON>.
        action - (function) A function that receives a node.

    Example:
    (start code js)
      $jit.json.each(tree, function(node) {
        alert(node.name);
      });
    (end code)
          
  */
  each: function(tree, action) {
    this.eachLevel(tree, 0, Number.MAX_VALUE, action);
  }
};
/*
 * File: Graph.js
 *
*/

/*
 Class: Graph

 A Graph Class that provides useful manipulation functions. You can find more manipulation methods in the <Graph.Util> object.

 An instance of this class can be accessed by using the *graph* parameter of any tree or graph visualization.
 
 Example:

 (start code js)
   //create new visualization
   var viz = new $jit.Viz(options);
   //load JSON data
   viz.loadJSON(json);
   //access model
   viz.graph; //<Graph> instance
 (end code)
 
 Implements:
 
 The following <Graph.Util> methods are implemented in <Graph>
 
  - <Graph.Util.getNode>
  - <Graph.Util.eachNode>
  - <Graph.Util.computeLevels>
  - <Graph.Util.eachBFS>
  - <Graph.Util.clean>
  - <Graph.Util.getClosestNodeToPos>
  - <Graph.Util.getClosestNodeToOrigin>
 
*/  

$jit.Graph = new Class({

  initialize: function(opt, Node, Edge, Label) {
    var innerOptions = {
    'klass': Complex,
    'Node': {}
    };
    this.Node = Node;
    this.Edge = Edge;
    this.Label = Label;
    this.opt = $.merge(innerOptions, opt || {});
    this.nodes = {};
    this.edges = {};
    
    //add nodeList methods
    var that = this;
    this.nodeList = {};
    for(var p in Accessors) {
      that.nodeList[p] = (function(p) {
        return function() {
          var args = Array.prototype.slice.call(arguments);
          that.eachNode(function(n) {
            n[p].apply(n, args);
          });
        };
      })(p);
    }

 },

/*
     Method: getNode
    
     Returns a <Graph.Node> by *id*.

     Parameters:

     id - (string) A <Graph.Node> id.

     Example:

     (start code js)
       var node = graph.getNode('nodeId');
     (end code)
*/  
 getNode: function(id) {
    if(this.hasNode(id)) return this.nodes[id];
    return false;
 },

 /*
   Method: getByName
  
   Returns a <Graph.Node> by *name*.
  
   Parameters:
  
   name - (string) A <Graph.Node> name.
  
   Example:
  
   (start code js)
     var node = graph.getByName('someName');
   (end code)
  */  
  getByName: function(name) {
    for(var id in this.nodes) {
      var n = this.nodes[id];
      if(n.name == name) return n;
    }
    return false;
  },

/*
   Method: getAdjacence
  
   Returns a <Graph.Adjacence> object connecting nodes with ids *id* and *id2*.

   Parameters:

   id - (string) A <Graph.Node> id.
   id2 - (string) A <Graph.Node> id.
*/  
  getAdjacence: function (id, id2) {
    if(id in this.edges) {
      return this.edges[id][id2];
    }
    return false;
 },

    /*
     Method: addNode
    
     Adds a node.
     
     Parameters:
    
      obj - An object with the properties described below

      id - (string) A node id
      name - (string) A node's name
      data - (object) A node's data hash

    See also:
    <Graph.Node>

  */  
  addNode: function(obj) { 
   if(!this.nodes[obj.id]) {  
     var edges = this.edges[obj.id] = {};
     this.nodes[obj.id] = new Graph.Node($.extend({
        'id': obj.id,
        'name': obj.name,
        'data': $.merge(obj.data || {}, {}),
        'adjacencies': edges 
      }, this.opt.Node), 
      this.opt.klass, 
      this.Node, 
      this.Edge,
      this.Label);
    }
    return this.nodes[obj.id];
  },
  
    /*
     Method: addAdjacence
    
     Connects nodes specified by *obj* and *obj2*. If not found, nodes are created.
     
     Parameters:
    
      obj - (object) A <Graph.Node> object.
      obj2 - (object) Another <Graph.Node> object.
      data - (object) A data object. Used to store some extra information in the <Graph.Adjacence> object created.

    See also:

    <Graph.Node>, <Graph.Adjacence>
    */  
  addAdjacence: function (obj, obj2, data) {
    if(!this.hasNode(obj.id)) { this.addNode(obj); }
    if(!this.hasNode(obj2.id)) { this.addNode(obj2); }
    obj = this.nodes[obj.id]; obj2 = this.nodes[obj2.id];
    if(!obj.adjacentTo(obj2)) {
      var adjsObj = this.edges[obj.id] = this.edges[obj.id] || {};
      var adjsObj2 = this.edges[obj2.id] = this.edges[obj2.id] || {};
      adjsObj[obj2.id] = adjsObj2[obj.id] = new Graph.Adjacence(obj, obj2, data, this.Edge, this.Label);
      return adjsObj[obj2.id];
    }
    return this.edges[obj.id][obj2.id];
 },

    /*
     Method: removeNode
    
     Removes a <Graph.Node> matching the specified *id*.

     Parameters:

     id - (string) A node's id.

    */  
  removeNode: function(id) {
    if(this.hasNode(id)) {
      delete this.nodes[id];
      var adjs = this.edges[id];
      for(var to in adjs) {
        delete this.edges[to][id];
      }
      delete this.edges[id];
    }
  },
  
/*
     Method: removeAdjacence
    
     Removes a <Graph.Adjacence> matching *id1* and *id2*.

     Parameters:

     id1 - (string) A <Graph.Node> id.
     id2 - (string) A <Graph.Node> id.
*/  
  removeAdjacence: function(id1, id2) {
    delete this.edges[id1][id2];
    delete this.edges[id2][id1];
  },

   /*
     Method: hasNode
    
     Returns a boolean indicating if the node belongs to the <Graph> or not.
     
     Parameters:
    
        id - (string) Node id.
   */  
  hasNode: function(id) {
    return id in this.nodes;
  },
  
  /*
    Method: empty

    Empties the Graph

  */
  empty: function() { this.nodes = {}; this.edges = {};}

});

var Graph = $jit.Graph;

/*
 Object: Accessors
 
 Defines a set of methods for data, canvas and label styles manipulation implemented by <Graph.Node> and <Graph.Adjacence> instances.
 
 */
var Accessors;

(function () {
  var getDataInternal = function(prefix, prop, type, force, prefixConfig) {
    var data;
    type = type || 'current';
    prefix = "$" + (prefix ? prefix + "-" : "");

    if(type == 'current') {
      data = this.data;
    } else if(type == 'start') {
      data = this.startData;
    } else if(type == 'end') {
      data = this.endData;
    }

    var dollar = prefix + prop;

    if(force) {
      return data[dollar];
    }

    if(!this.Config.overridable)
      return prefixConfig[prop] || 0;

    return (dollar in data) ?
      data[dollar] : ((dollar in this.data) ? this.data[dollar] : (prefixConfig[prop] || 0));
  }

  var setDataInternal = function(prefix, prop, value, type) {
    type = type || 'current';
    prefix = '$' + (prefix ? prefix + '-' : '');

    var data;

    if(type == 'current') {
      data = this.data;
    } else if(type == 'start') {
      data = this.startData;
    } else if(type == 'end') {
      data = this.endData;
    }

    data[prefix + prop] = value;
  }

  var removeDataInternal = function(prefix, properties) {
    prefix = '$' + (prefix ? prefix + '-' : '');
    var that = this;
    $.each(properties, function(prop) {
      var pref = prefix + prop;
      delete that.data[pref];
      delete that.endData[pref];
      delete that.startData[pref];
    });
  }

  Accessors = {
    /*
    Method: getData

    Returns the specified data value property.
    This is useful for querying special/reserved <Graph.Node> data properties
    (i.e dollar prefixed properties).

    Parameters:

      prop  - (string) The name of the property. The dollar sign is not needed. For
              example *getData(width)* will return *data.$width*.
      type  - (string) The type of the data property queried. Default's "current". You can access *start* and *end* 
              data properties also. These properties are used when making animations.
      force - (boolean) Whether to obtain the true value of the property (equivalent to
              *data.$prop*) or to check for *node.overridable = true* first.

    Returns:

      The value of the dollar prefixed property or the global Node/Edge property
      value if *overridable=false*

    Example:
    (start code js)
     node.getData('width'); //will return node.data.$width if Node.overridable=true;
    (end code)
    */
    getData: function(prop, type, force) {
      return getDataInternal.call(this, "", prop, type, force, this.Config);
    },


    /*
    Method: setData

    Sets the current data property with some specific value.
    This method is only useful for reserved (dollar prefixed) properties.

    Parameters:

      prop  - (string) The name of the property. The dollar sign is not necessary. For
              example *setData(width)* will set *data.$width*.
      value - (mixed) The value to store.
      type  - (string) The type of the data property to store. Default's "current" but
              can also be "start" or "end".

    Example:
    
    (start code js)
     node.setData('width', 30);
    (end code)
    
    If we were to make an animation of a node/edge width then we could do
    
    (start code js)
      var node = viz.getNode('nodeId');
      //set start and end values
      node.setData('width', 10, 'start');
      node.setData('width', 30, 'end');
      //will animate nodes width property
      viz.fx.animate({
        modes: ['node-property:width'],
        duration: 1000
      });
    (end code)
    */
    setData: function(prop, value, type) {
      setDataInternal.call(this, "", prop, value, type);
    },

    /*
    Method: setDataset

    Convenience method to set multiple data values at once.
    
    Parameters:
    
    types - (array|string) A set of 'current', 'end' or 'start' values.
    obj - (object) A hash containing the names and values of the properties to be altered.

    Example:
    (start code js)
      node.setDataset(['current', 'end'], {
        'width': [100, 5],
        'color': ['#fff', '#ccc']
      });
      //...or also
      node.setDataset('end', {
        'width': 5,
        'color': '#ccc'
      });
    (end code)
    
    See also: 
    
    <Accessors.setData>
    
    */
    setDataset: function(types, obj) {
      types = $.splat(types);
      for(var attr in obj) {
        for(var i=0, val = $.splat(obj[attr]), l=types.length; i<l; i++) {
          this.setData(attr, val[i], types[i]);
        }
      }
    },
    
    /*
    Method: removeData

    Remove data properties.

    Parameters:

    One or more property names as arguments. The dollar sign is not needed.

    Example:
    (start code js)
    node.removeData('width'); //now the default width value is returned
    (end code)
    */
    removeData: function() {
      removeDataInternal.call(this, "", Array.prototype.slice.call(arguments));
    },

    /*
    Method: getCanvasStyle

    Returns the specified canvas style data value property. This is useful for
    querying special/reserved <Graph.Node> canvas style data properties (i.e.
    dollar prefixed properties that match with $canvas-<name of canvas style>).

    Parameters:

      prop  - (string) The name of the property. The dollar sign is not needed. For
              example *getCanvasStyle(shadowBlur)* will return *data[$canvas-shadowBlur]*.
      type  - (string) The type of the data property queried. Default's *current*. You can access *start* and *end* 
              data properties also.
              
    Example:
    (start code js)
      node.getCanvasStyle('shadowBlur');
    (end code)
    
    See also:
    
    <Accessors.getData>
    */
    getCanvasStyle: function(prop, type, force) {
      return getDataInternal.call(
          this, 'canvas', prop, type, force, this.Config.CanvasStyles);
    },

    /*
    Method: setCanvasStyle

    Sets the canvas style data property with some specific value.
    This method is only useful for reserved (dollar prefixed) properties.
    
    Parameters:
    
    prop - (string) Name of the property. Can be any canvas property like 'shadowBlur', 'shadowColor', 'strokeStyle', etc.
    value - (mixed) The value to set to the property.
    type - (string) Default's *current*. Whether to set *start*, *current* or *end* type properties.
    
    Example:
    
    (start code js)
     node.setCanvasStyle('shadowBlur', 30);
    (end code)
    
    If we were to make an animation of a node/edge shadowBlur canvas style then we could do
    
    (start code js)
      var node = viz.getNode('nodeId');
      //set start and end values
      node.setCanvasStyle('shadowBlur', 10, 'start');
      node.setCanvasStyle('shadowBlur', 30, 'end');
      //will animate nodes canvas style property for nodes
      viz.fx.animate({
        modes: ['node-style:shadowBlur'],
        duration: 1000
      });
    (end code)
    
    See also:
    
    <Accessors.setData>.
    */
    setCanvasStyle: function(prop, value, type) {
      setDataInternal.call(this, 'canvas', prop, value, type);
    },

    /*
    Method: setCanvasStyles

    Convenience method to set multiple styles at once.

    Parameters:
    
    types - (array|string) A set of 'current', 'end' or 'start' values.
    obj - (object) A hash containing the names and values of the properties to be altered.

    See also:
    
    <Accessors.setDataset>.
    */
    setCanvasStyles: function(types, obj) {
      types = $.splat(types);
      for(var attr in obj) {
        for(var i=0, val = $.splat(obj[attr]), l=types.length; i<l; i++) {
          this.setCanvasStyle(attr, val[i], types[i]);
        }
      }
    },

    /*
    Method: removeCanvasStyle

    Remove canvas style properties from data.

    Parameters:
    
    A variable number of canvas style strings.

    See also:
    
    <Accessors.removeData>.
    */
    removeCanvasStyle: function() {
      removeDataInternal.call(this, 'canvas', Array.prototype.slice.call(arguments));
    },

    /*
    Method: getLabelData

    Returns the specified label data value property. This is useful for
    querying special/reserved <Graph.Node> label options (i.e.
    dollar prefixed properties that match with $label-<name of label style>).

    Parameters:

      prop  - (string) The name of the property. The dollar sign prefix is not needed. For
              example *getLabelData(size)* will return *data[$label-size]*.
      type  - (string) The type of the data property queried. Default's *current*. You can access *start* and *end* 
              data properties also.
              
    See also:
    
    <Accessors.getData>.
    */
    getLabelData: function(prop, type, force) {
      return getDataInternal.call(
          this, 'label', prop, type, force, this.Label);
    },

    /*
    Method: setLabelData

    Sets the current label data with some specific value.
    This method is only useful for reserved (dollar prefixed) properties.

    Parameters:
    
    prop - (string) Name of the property. Can be any canvas property like 'shadowBlur', 'shadowColor', 'strokeStyle', etc.
    value - (mixed) The value to set to the property.
    type - (string) Default's *current*. Whether to set *start*, *current* or *end* type properties.
    
    Example:
    
    (start code js)
     node.setLabelData('size', 30);
    (end code)
    
    If we were to make an animation of a node label size then we could do
    
    (start code js)
      var node = viz.getNode('nodeId');
      //set start and end values
      node.setLabelData('size', 10, 'start');
      node.setLabelData('size', 30, 'end');
      //will animate nodes label size
      viz.fx.animate({
        modes: ['label-property:size'],
        duration: 1000
      });
    (end code)
    
    See also:
    
    <Accessors.setData>.
    */
    setLabelData: function(prop, value, type) {
      setDataInternal.call(this, 'label', prop, value, type);
    },

    /*
    Method: setLabelDataset

    Convenience function to set multiple label data at once.

    Parameters:
    
    types - (array|string) A set of 'current', 'end' or 'start' values.
    obj - (object) A hash containing the names and values of the properties to be altered.

    See also:
    
    <Accessors.setDataset>.
    */
    setLabelDataset: function(types, obj) {
      types = $.splat(types);
      for(var attr in obj) {
        for(var i=0, val = $.splat(obj[attr]), l=types.length; i<l; i++) {
          this.setLabelData(attr, val[i], types[i]);
        }
      }
    },

    /*
    Method: removeLabelData

    Remove label properties from data.
    
    Parameters:
    
    A variable number of label property strings.

    See also:
    
    <Accessors.removeData>.
    */
    removeLabelData: function() {
      removeDataInternal.call(this, 'label', Array.prototype.slice.call(arguments));
    }
  };
})();

/*
     Class: Graph.Node

     A <Graph> node.
     
     Implements:
     
     <Accessors> methods.
     
     The following <Graph.Util> methods are implemented by <Graph.Node>
     
    - <Graph.Util.eachAdjacency>
    - <Graph.Util.eachLevel>
    - <Graph.Util.eachSubgraph>
    - <Graph.Util.eachSubnode>
    - <Graph.Util.anySubnode>
    - <Graph.Util.getSubnodes>
    - <Graph.Util.getParents>
    - <Graph.Util.isDescendantOf>     
*/
Graph.Node = new Class({
    
  initialize: function(opt, klass, Node, Edge, Label) {
    var innerOptions = {
      'id': '',
      'name': '',
      'data': {},
      'startData': {},
      'endData': {},
      'adjacencies': {},

      'selected': false,
      'drawn': false,
      'exist': false,

      'angleSpan': {
        'begin': 0,
        'end' : 0
      },

      'pos': new klass,
      'startPos': new klass,
      'endPos': new klass
    };
    
    $.extend(this, $.extend(innerOptions, opt));
    this.Config = this.Node = Node;
    this.Edge = Edge;
    this.Label = Label;
  },

    /*
       Method: adjacentTo
    
       Indicates if the node is adjacent to the node specified by id

       Parameters:
    
          id - (string) A node id.
    
       Example:
       (start code js)
        node.adjacentTo('nodeId') == true;
       (end code)
    */
    adjacentTo: function(node) {
        return node.id in this.adjacencies;
    },

    /*
       Method: getAdjacency
    
       Returns a <Graph.Adjacence> object connecting the current <Graph.Node> and the node having *id* as id.

       Parameters:
    
          id - (string) A node id.
    */  
    getAdjacency: function(id) {
        return this.adjacencies[id];
    },

    /*
      Method: getPos
   
      Returns the position of the node.
  
      Parameters:
   
         type - (string) Default's *current*. Possible values are "start", "end" or "current".
   
      Returns:
   
        A <Complex> or <Polar> instance.
  
      Example:
      (start code js)
       var pos = node.getPos('end');
      (end code)
   */
   getPos: function(type) {
       type = type || "current";
       if(type == "current") {
         return this.pos;
       } else if(type == "end") {
         return this.endPos;
       } else if(type == "start") {
         return this.startPos;
       }
   },
   /*
     Method: setPos
  
     Sets the node's position.
  
     Parameters:
  
        value - (object) A <Complex> or <Polar> instance.
        type - (string) Default's *current*. Possible values are "start", "end" or "current".
  
     Example:
     (start code js)
      node.setPos(new $jit.Complex(0, 0), 'end');
     (end code)
  */
  setPos: function(value, type) {
      type = type || "current";
      var pos;
      if(type == "current") {
        pos = this.pos;
      } else if(type == "end") {
        pos = this.endPos;
      } else if(type == "start") {
        pos = this.startPos;
      }
      pos.set(value);
  }
});

Graph.Node.implement(Accessors);

/*
     Class: Graph.Adjacence

     A <Graph> adjacence (or edge) connecting two <Graph.Nodes>.
     
     Implements:
     
     <Accessors> methods.

     See also:

     <Graph>, <Graph.Node>

     Properties:
     
      nodeFrom - A <Graph.Node> connected by this edge.
      nodeTo - Another  <Graph.Node> connected by this edge.
      data - Node data property containing a hash (i.e {}) with custom options.
*/
Graph.Adjacence = new Class({
  
  initialize: function(nodeFrom, nodeTo, data, Edge, Label) {
    this.nodeFrom = nodeFrom;
    this.nodeTo = nodeTo;
    this.data = data || {};
    this.startData = {};
    this.endData = {};
    this.Config = this.Edge = Edge;
    this.Label = Label;
  }
});

Graph.Adjacence.implement(Accessors);

/*
   Object: Graph.Util

   <Graph> traversal and processing utility object.
   
   Note:
   
   For your convenience some of these methods have also been appended to <Graph> and <Graph.Node> classes.
*/
Graph.Util = {
    /*
       filter
    
       For internal use only. Provides a filtering function based on flags.
    */
    filter: function(param) {
        if(!param || !($.type(param) == 'string')) return function() { return true; };
        var props = param.split(" ");
        return function(elem) {
            for(var i=0; i<props.length; i++) { 
              if(elem[props[i]]) { 
                return false; 
              }
            }
            return true;
        };
    },
    /*
       Method: getNode
    
       Returns a <Graph.Node> by *id*.
       
       Also implemented by:
       
       <Graph>

       Parameters:

       graph - (object) A <Graph> instance.
       id - (string) A <Graph.Node> id.

       Example:

       (start code js)
         $jit.Graph.Util.getNode(graph, 'nodeid');
         //or...
         graph.getNode('nodeid');
       (end code)
    */
    getNode: function(graph, id) {
        return graph.nodes[id];
    },
    
    /*
       Method: eachNode
    
       Iterates over <Graph> nodes performing an *action*.
       
       Also implemented by:
       
       <Graph>.

       Parameters:

       graph - (object) A <Graph> instance.
       action - (function) A callback function having a <Graph.Node> as first formal parameter.

       Example:
       (start code js)
         $jit.Graph.Util.eachNode(graph, function(node) {
          alert(node.name);
         });
         //or...
         graph.eachNode(function(node) {
           alert(node.name);
         });
       (end code)
    */
    eachNode: function(graph, action, flags) {
        var filter = this.filter(flags);
        for(var i in graph.nodes) {
          if(filter(graph.nodes[i])) action(graph.nodes[i]);
        } 
    },
    
    /*
       Method: eachAdjacency
    
       Iterates over <Graph.Node> adjacencies applying the *action* function.
       
       Also implemented by:
       
       <Graph.Node>.

       Parameters:

       node - (object) A <Graph.Node>.
       action - (function) A callback function having <Graph.Adjacence> as first formal parameter.

       Example:
       (start code js)
         $jit.Graph.Util.eachAdjacency(node, function(adj) {
          alert(adj.nodeTo.name);
         });
         //or...
         node.eachAdjacency(function(adj) {
           alert(adj.nodeTo.name);
         });
       (end code)
    */
    eachAdjacency: function(node, action, flags) {
        var adj = node.adjacencies, filter = this.filter(flags);
        for(var id in adj) {
          var a = adj[id];
          if(filter(a)) {
            if(a.nodeFrom != node) {
              var tmp = a.nodeFrom;
              a.nodeFrom = a.nodeTo;
              a.nodeTo = tmp;
            }
            action(a, id);
          }
        }
    },

     /*
       Method: computeLevels
    
       Performs a BFS traversal setting the correct depth for each node.
        
       Also implemented by:
       
       <Graph>.
       
       Note:
       
       The depth of each node can then be accessed by 
       >node._depth

       Parameters:

       graph - (object) A <Graph>.
       id - (string) A starting node id for the BFS traversal.
       startDepth - (optional|number) A minimum depth value. Default's 0.

    */
    computeLevels: function(graph, id, startDepth, flags) {
        startDepth = startDepth || 0;
        var filter = this.filter(flags);
        this.eachNode(graph, function(elem) {
            elem._flag = false;
            elem._depth = -1;
        }, flags);
        var root = graph.getNode(id);
        root._depth = startDepth;
        var queue = [root];
        while(queue.length != 0) {
            var node = queue.pop();
            node._flag = true;
            this.eachAdjacency(node, function(adj) {
                var n = adj.nodeTo;
                if(n._flag == false && filter(n)) {
                    if(n._depth < 0) n._depth = node._depth + 1 + startDepth;
                    queue.unshift(n);
                }
            }, flags);
        }
    },

    /*
       Method: eachBFS
    
       Performs a BFS traversal applying *action* to each <Graph.Node>.
       
       Also implemented by:
       
       <Graph>.

       Parameters:

       graph - (object) A <Graph>.
       id - (string) A starting node id for the BFS traversal.
       action - (function) A callback function having a <Graph.Node> as first formal parameter.

       Example:
       (start code js)
         $jit.Graph.Util.eachBFS(graph, 'mynodeid', function(node) {
          alert(node.name);
         });
         //or...
         graph.eachBFS('mynodeid', function(node) {
           alert(node.name);
         });
       (end code)
    */
    eachBFS: function(graph, id, action, flags) {
        var filter = this.filter(flags);
        this.clean(graph);
        var queue = [graph.getNode(id)];
        while(queue.length != 0) {
            var node = queue.pop();
            node._flag = true;
            action(node, node._depth);
            this.eachAdjacency(node, function(adj) {
                var n = adj.nodeTo;
                if(n._flag == false && filter(n)) {
                    n._flag = true;
                    queue.unshift(n);
                }
            }, flags);
        }
    },
    
    /*
       Method: eachLevel
    
       Iterates over a node's subgraph applying *action* to the nodes of relative depth between *levelBegin* and *levelEnd*.
       
       Also implemented by:
       
       <Graph.Node>.

       Parameters:
       
       node - (object) A <Graph.Node>.
       levelBegin - (number) A relative level value.
       levelEnd - (number) A relative level value.
       action - (function) A callback function having a <Graph.Node> as first formal parameter.

    */
    eachLevel: function(node, levelBegin, levelEnd, action, flags) {
        var d = node._depth, filter = this.filter(flags), that = this;
        levelEnd = levelEnd === false? Number.MAX_VALUE -d : levelEnd;
        (function loopLevel(node, levelBegin, levelEnd) {
            var d = node._depth;
            if(d >= levelBegin && d <= levelEnd && filter(node)) action(node, d);
            if(d < levelEnd) {
                that.eachAdjacency(node, function(adj) {
                    var n = adj.nodeTo;
                    if(n._depth > d) loopLevel(n, levelBegin, levelEnd);
                });
            }
        })(node, levelBegin + d, levelEnd + d);      
    },

    /*
       Method: eachSubgraph
    
       Iterates over a node's children recursively.
       
       Also implemented by:
       
       <Graph.Node>.

       Parameters:
       node - (object) A <Graph.Node>.
       action - (function) A callback function having a <Graph.Node> as first formal parameter.

       Example:
       (start code js)
         $jit.Graph.Util.eachSubgraph(node, function(node) {
           alert(node.name);
         });
         //or...
         node.eachSubgraph(function(node) {
           alert(node.name);
         });
       (end code)
    */
    eachSubgraph: function(node, action, flags) {
      this.eachLevel(node, 0, false, action, flags);
    },

    /*
       Method: eachSubnode
    
       Iterates over a node's children (without deeper recursion).
       
       Also implemented by:
       
       <Graph.Node>.
       
       Parameters:
       node - (object) A <Graph.Node>.
       action - (function) A callback function having a <Graph.Node> as first formal parameter.

       Example:
       (start code js)
         $jit.Graph.Util.eachSubnode(node, function(node) {
          alert(node.name);
         });
         //or...
         node.eachSubnode(function(node) {
           alert(node.name);
         });
       (end code)
    */
    eachSubnode: function(node, action, flags) {
        this.eachLevel(node, 1, 1, action, flags);
    },

    /*
       Method: anySubnode
    
       Returns *true* if any subnode matches the given condition.
       
       Also implemented by:
       
       <Graph.Node>.

       Parameters:
       node - (object) A <Graph.Node>.
       cond - (function) A callback function returning a Boolean instance. This function has as first formal parameter a <Graph.Node>.

       Example:
       (start code js)
         $jit.Graph.Util.anySubnode(node, function(node) { return node.name == "mynodename"; });
         //or...
         node.anySubnode(function(node) { return node.name == 'mynodename'; });
       (end code)
    */
    anySubnode: function(node, cond, flags) {
      var flag = false;
      cond = cond || $.lambda(true);
      var c = $.type(cond) == 'string'? function(n) { return n[cond]; } : cond;
      this.eachSubnode(node, function(elem) {
        if(c(elem)) flag = true;
      }, flags);
      return flag;
    },
  
    /*
       Method: getSubnodes
    
       Collects all subnodes for a specified node. 
       The *level* parameter filters nodes having relative depth of *level* from the root node. 
       
       Also implemented by:
       
       <Graph.Node>.

       Parameters:
       node - (object) A <Graph.Node>.
       level - (optional|number) Default's *0*. A starting relative depth for collecting nodes.

       Returns:
       An array of nodes.

    */
    getSubnodes: function(node, level, flags) {
        var ans = [], that = this;
        level = level || 0;
        var levelStart, levelEnd;
        if($.type(level) == 'array') {
            levelStart = level[0];
            levelEnd = level[1];
        } else {
            levelStart = level;
            levelEnd = Number.MAX_VALUE - node._depth;
        }
        this.eachLevel(node, levelStart, levelEnd, function(n) {
            ans.push(n);
        }, flags);
        return ans;
    },
  
  
    /*
       Method: getParents
    
       Returns an Array of <Graph.Nodes> which are parents of the given node.
       
       Also implemented by:
       
       <Graph.Node>.

       Parameters:
       node - (object) A <Graph.Node>.

       Returns:
       An Array of <Graph.Nodes>.

       Example:
       (start code js)
         var pars = $jit.Graph.Util.getParents(node);
         //or...
         var pars = node.getParents();
         
         if(pars.length > 0) {
           //do stuff with parents
         }
       (end code)
    */
    getParents: function(node) {
        var ans = [];
        this.eachAdjacency(node, function(adj) {
            var n = adj.nodeTo;
            if(n._depth < node._depth) ans.push(n);
        });
        return ans;
    },
    
    /*
    Method: isDescendantOf
 
    Returns a boolean indicating if some node is descendant of the node with the given id. 

    Also implemented by:
    
    <Graph.Node>.
    
    
    Parameters:
    node - (object) A <Graph.Node>.
    id - (string) A <Graph.Node> id.

    Example:
    (start code js)
      $jit.Graph.Util.isDescendantOf(node, "nodeid"); //true|false
      //or...
      node.isDescendantOf('nodeid');//true|false
    (end code)
 */
 isDescendantOf: function(node, id) {
    if(node.id == id) return true;
    var pars = this.getParents(node), ans = false;
    for ( var i = 0; !ans && i < pars.length; i++) {
    ans = ans || this.isDescendantOf(pars[i], id);
  }
    return ans;
 },

 /*
     Method: clean
  
     Cleans flags from nodes.

     Also implemented by:
     
     <Graph>.
     
     Parameters:
     graph - A <Graph> instance.
  */
  clean: function(graph) { this.eachNode(graph, function(elem) { elem._flag = false; }); },
  
  /* 
    Method: getClosestNodeToOrigin 
  
    Returns the closest node to the center of canvas.
  
    Also implemented by:
    
    <Graph>.
    
    Parameters:
   
     graph - (object) A <Graph> instance.
     prop - (optional|string) Default's 'current'. A <Graph.Node> position property. Possible properties are 'start', 'current' or 'end'.
  
  */
  getClosestNodeToOrigin: function(graph, prop, flags) {
   return this.getClosestNodeToPos(graph, Polar.KER, prop, flags);
  },
  
  /* 
    Method: getClosestNodeToPos
  
    Returns the closest node to the given position.
  
    Also implemented by:
    
    <Graph>.
    
    Parameters:
   
     graph - (object) A <Graph> instance.
     pos - (object) A <Complex> or <Polar> instance.
     prop - (optional|string) Default's *current*. A <Graph.Node> position property. Possible properties are 'start', 'current' or 'end'.
  
  */
  getClosestNodeToPos: function(graph, pos, prop, flags) {
   var node = null;
   prop = prop || 'current';
   pos = pos && pos.getc(true) || Complex.KER;
   var distance = function(a, b) {
     var d1 = a.x - b.x, d2 = a.y - b.y;
     return d1 * d1 + d2 * d2;
   };
   this.eachNode(graph, function(elem) {
     node = (node == null || distance(elem.getPos(prop).getc(true), pos) < distance(
         node.getPos(prop).getc(true), pos)) ? elem : node;
   }, flags);
   return node;
  } 
};

//Append graph methods to <Graph>
$.each(['getNode', 'eachNode', 'computeLevels', 'eachBFS', 'clean', 'getClosestNodeToPos', 'getClosestNodeToOrigin'], function(m) {
  Graph.prototype[m] = function() {
    return Graph.Util[m].apply(Graph.Util, [this].concat(Array.prototype.slice.call(arguments)));
  };
});

//Append node methods to <Graph.Node>
$.each(['eachAdjacency', 'eachLevel', 'eachSubgraph', 'eachSubnode', 'anySubnode', 'getSubnodes', 'getParents', 'isDescendantOf'], function(m) {
  Graph.Node.prototype[m] = function() {
    return Graph.Util[m].apply(Graph.Util, [this].concat(Array.prototype.slice.call(arguments)));
  };
});/*
 * File: Complex.js
 * 
 * Defines the <Complex> class.
 *
 * Description:
 *
 * The <Complex> class, just like the <Polar> class, is used by the <Hypertree>, <ST> and <RGraph> as a 2D point representation.
 *
 * See also:
 *
 * <http://en.wikipedia.org/wiki/Complex_number>
 *
*/

/*
   Class: Complex
    
   A multi-purpose Complex Class with common methods.
 
   Description:
 
   The <Complex> class, just like the <Polar> class, is used by the <Hypertree>, <ST> and <RGraph> as a 2D point representation.
 
   See also:
 
   <http://en.wikipedia.org/wiki/Complex_number>

   Parameters:

   x - _optional_ A Complex number real part.
   y - _optional_ A Complex number imaginary part.
 
*/

var Complex = function(x, y) {
  this.x = x || 0;
  this.y = y || 0;
};

$jit.Complex = Complex;

Complex.prototype = {
    /*
       Method: getc
    
       Returns a complex number.
    
       Returns:
    
          A complex number.
    */
    getc: function() {
        return this;
    },

    /*
       Method: getp
    
       Returns a <Polar> representation of this number.
    
       Parameters:

       simple - _optional_ If *true*, this method will return only an object holding theta and rho properties and not a <Polar> instance. Default's *false*.

       Returns:
    
          A variable in <Polar> coordinates.
    */
    getp: function(simple) {
        return this.toPolar(simple);
    },


    /*
       Method: set
    
       Sets a number.

       Parameters:

       c - A <Complex> or <Polar> instance.
    
    */
    set: function(c) {
      c = c.getc(true);
      this.x = c.x; 
      this.y = c.y;
    },

    /*
       Method: setc
    
       Sets a complex number.

       Parameters:

       x - A <Complex> number Real part.
       y - A <Complex> number Imaginary part.
    
    */
    setc: function(x, y) {
        this.x = x; 
        this.y = y;
    },

    /*
       Method: setp
    
       Sets a polar number.

       Parameters:

       theta - A <Polar> number theta property.
       rho - A <Polar> number rho property.
    
    */
    setp: function(theta, rho) {
        this.x = Math.cos(theta) * rho;
        this.y = Math.sin(theta) * rho;
    },

    /*
       Method: clone
    
       Returns a copy of the current object.
    
       Returns:
    
          A copy of the real object.
    */
    clone: function() {
        return new Complex(this.x, this.y);
    },

    /*
       Method: toPolar
    
       Transforms cartesian to polar coordinates.
    
       Parameters:

       simple - _optional_ If *true* this method will only return an object with theta and rho properties (and not the whole <Polar> instance). Default's *false*.
       
       Returns:
    
          A new <Polar> instance.
    */
    
    toPolar: function(simple) {
        var rho = this.norm();
        var atan = Math.atan2(this.y, this.x);
        if(atan < 0) atan += Math.PI * 2;
        if(simple) return { 'theta': atan, 'rho': rho };
        return new Polar(atan, rho);
    },
    /*
       Method: norm
    
       Calculates a <Complex> number norm.
    
       Returns:
    
          A real number representing the complex norm.
    */
    norm: function () {
        return Math.sqrt(this.squaredNorm());
    },
    
    /*
       Method: squaredNorm
    
       Calculates a <Complex> number squared norm.
    
       Returns:
    
          A real number representing the complex squared norm.
    */
    squaredNorm: function () {
        return this.x*this.x + this.y*this.y;
    },

    /*
       Method: add
    
       Returns the result of adding two complex numbers.
       
       Does not alter the original object.

       Parameters:
    
          pos - A <Complex> instance.
    
       Returns:
    
         The result of adding two complex numbers.
    */
    add: function(pos) {
        return new Complex(this.x + pos.x, this.y + pos.y);
    },

    /*
       Method: prod
    
       Returns the result of multiplying two <Complex> numbers.
       
       Does not alter the original object.

       Parameters:
    
          pos - A <Complex> instance.
    
       Returns:
    
         The result of multiplying two complex numbers.
    */
    prod: function(pos) {
        return new Complex(this.x*pos.x - this.y*pos.y, this.y*pos.x + this.x*pos.y);
    },

    /*
       Method: conjugate
    
       Returns the conjugate of this <Complex> number.

       Does not alter the original object.

       Returns:
    
         The conjugate of this <Complex> number.
    */
    conjugate: function() {
        return new Complex(this.x, -this.y);
    },


    /*
       Method: scale
    
       Returns the result of scaling a <Complex> instance.
       
       Does not alter the original object.

       Parameters:
    
          factor - A scale factor.
    
       Returns:
    
         The result of scaling this complex to a factor.
    */
    scale: function(factor) {
        return new Complex(this.x * factor, this.y * factor);
    },

    /*
       Method: equals
    
       Comparison method.

       Returns *true* if both real and imaginary parts are equal.

       Parameters:

       c - A <Complex> instance.

       Returns:

       A boolean instance indicating if both <Complex> numbers are equal.
    */
    equals: function(c) {
        return this.x == c.x && this.y == c.y;
    },

    /*
       Method: $add
    
       Returns the result of adding two <Complex> numbers.
       
       Alters the original object.

       Parameters:
    
          pos - A <Complex> instance.
    
       Returns:
    
         The result of adding two complex numbers.
    */
    $add: function(pos) {
        this.x += pos.x; this.y += pos.y;
        return this;    
    },
    
    /*
       Method: $prod
    
       Returns the result of multiplying two <Complex> numbers.
       
       Alters the original object.

       Parameters:
    
          pos - A <Complex> instance.
    
       Returns:
    
         The result of multiplying two complex numbers.
    */
    $prod:function(pos) {
        var x = this.x, y = this.y;
        this.x = x*pos.x - y*pos.y;
        this.y = y*pos.x + x*pos.y;
        return this;
    },
    
    /*
       Method: $conjugate
    
       Returns the conjugate for this <Complex>.
       
       Alters the original object.

       Returns:
    
         The conjugate for this complex.
    */
    $conjugate: function() {
        this.y = -this.y;
        return this;
    },
    
    /*
       Method: $scale
    
       Returns the result of scaling a <Complex> instance.
       
       Alters the original object.

       Parameters:
    
          factor - A scale factor.
    
       Returns:
    
         The result of scaling this complex to a factor.
    */
    $scale: function(factor) {
        this.x *= factor; this.y *= factor;
        return this;
    },
    
    /*
       Method: $div
    
       Returns the division of two <Complex> numbers.
       
       Alters the original object.

       Parameters:
    
          pos - A <Complex> number.
    
       Returns:
    
         The result of scaling this complex to a factor.
    */
    $div: function(pos) {
        var x = this.x, y = this.y;
        var sq = pos.squaredNorm();
        this.x = x * pos.x + y * pos.y; this.y = y * pos.x - x * pos.y;
        return this.$scale(1 / sq);
    },

    /*
      Method: isZero
   
      Returns *true* if the number is zero.
   
   */
    isZero: function () {
      var almostZero = 0.0001, abs = Math.abs;
      return abs(this.x) < almostZero && abs(this.y) < almostZero;
    }
};

var $C = function(a, b) { return new Complex(a, b); };

Complex.KER = $C(0, 0);

/*
 * File: Loader.js
 * 
 */

/*
   Object: Loader

   Provides methods for loading and serving JSON data.
*/
var Loader = {
     construct: function(json) {
        var isGraph = ($.type(json) == 'array');
        var ans = new Graph(); //this.graphOptions, this.config.Node, this.config.Edge, this.config.Label);
        if(!isGraph) 
            //make tree
            (function (ans, json) {
                ans.addNode(json);
                if(json.children) {
                  for(var i=0, ch = json.children; i<ch.length; i++) {
                    ans.addAdjacence(json, ch[i]);
                    arguments.callee(ans, ch[i]);
                  }
                }
            })(ans, json);
        else
            //make graph
            (function (ans, json) {
                var getNode = function(id) {
                  for(var i=0, l=json.length; i<l; i++) {
                    if(json[i].id == id) {
                      return json[i];
                    }
                  }
                  // The node was not defined in the JSON
                  // Let's create it
                  var newNode = {
                		"id" : id,
                		"name" : id
                	};
                  return ans.addNode(newNode);
                };

                for(var i=0, l=json.length; i<l; i++) {
                  ans.addNode(json[i]);
                  var adj = json[i].adjacencies;
                  if (adj) {
                    for(var j=0, lj=adj.length; j<lj; j++) {
                      var node = adj[j], data = {};
                      if(typeof adj[j] != 'string') {
                        data = $.merge(node.data, {});
                        node = node.nodeTo;
                      }
                      ans.addAdjacence(json[i], getNode(node), data);
                    }
                  }
                }
            })(ans, json);

        return ans;
    },

    /*
     Method: loadJSON
    
     Loads a JSON structure to the visualization. The JSON structure can be a JSON *tree* or *graph* structure.
     
      A JSON tree or graph structure consists of nodes, each having as properties
       
       id - (string) A unique identifier for the node
       name - (string) A node's name
       data - (object) The data optional property contains a hash (i.e {}) 
       where you can store all the information you want about this node.
        
      For JSON *Tree* structures, there's an extra optional property *children* of type Array which contains the node's children.
      
      Example:

      (start code js)
        var json = {  
          "id": "aUniqueIdentifier",  
          "name": "usually a nodes name",  
          "data": {
            "some key": "some value",
            "some other key": "some other value"
           },  
          "children": [ *other nodes or empty* ]  
        };  
      (end code)
        
        JSON *Graph* structures consist of an array of nodes, each specifying the nodes to which the current node is connected. 
        For JSON *Graph* structures, the *children* property is replaced by the *adjacencies* property.
        
        There are two types of *Graph* structures, *simple* and *extended* graph structures.
        
        For *simple* Graph structures, the adjacencies property contains an array of strings, each specifying the 
        id of the node connected to the main node.
        
        Example:
        
        (start code js)
        var json = [  
          {  
            "id": "aUniqueIdentifier",  
            "name": "usually a nodes name",  
            "data": {
              "some key": "some value",
              "some other key": "some other value"
             },  
            "adjacencies": ["anotherUniqueIdentifier", "yetAnotherUniqueIdentifier", 'etc']  
          },

          'other nodes go here...' 
        ];          
        (end code)
        
        For *extended Graph structures*, the adjacencies property contains an array of Adjacency objects that have as properties
        
        nodeTo - (string) The other node connected by this adjacency.
        data - (object) A data property, where we can store custom key/value information.
        
        Example:
        
        (start code js)
        var json = [  
          {  
            "id": "aUniqueIdentifier",  
            "name": "usually a nodes name",  
            "data": {
              "some key": "some value",
              "some other key": "some other value"
             },  
            "adjacencies": [  
            {  
              nodeTo:"aNodeId",  
              data: {} //put whatever you want here  
            },
            'other adjacencies go here...'  
          },

          'other nodes go here...' 
        ];          
        (end code)
       
       About the data property:
       
       As described before, you can store custom data in the *data* property of JSON *nodes* and *adjacencies*. 
       You can use almost any string as key for the data object. Some keys though are reserved by the toolkit, and 
       have special meanings. This is the case for keys starting with a dollar sign, for example, *$width*.
       
       For JSON *node* objects, adding dollar prefixed properties that match the names of the options defined in 
       <Options.Node> will override the general value for that option with that particular value. For this to work 
       however, you do have to set *overridable = true* in <Options.Node>.
       
       The same thing is true for JSON adjacencies. Dollar prefixed data properties will alter values set in <Options.Edge> 
       if <Options.Edge> has *overridable = true*.
       
       When loading JSON data into TreeMaps, the *data* property must contain a value for the *$area* key, 
       since this is the value which will be taken into account when creating the layout. 
       The same thing goes for the *$color* parameter.
       
       In JSON Nodes you can use also *$label-* prefixed properties to refer to <Options.Label> properties. For example, 
       *$label-size* will refer to <Options.Label> size property. Also, in JSON nodes and adjacencies you can set 
       canvas specific properties individually by using the *$canvas-* prefix. For example, *$canvas-shadowBlur* will refer 
       to the *shadowBlur* property.
       
       These properties can also be accessed after loading the JSON data from <Graph.Nodes> and <Graph.Adjacences> 
       by using <Accessors>. For more information take a look at the <Graph> and <Accessors> documentation.
       
       Finally, these properties can also be used to create advanced animations like with <Options.NodeStyles>. For more 
       information about creating animations please take a look at the <Graph.Plot> and <Graph.Plot.animate> documentation.
       
       loadJSON Parameters:
    
        json - A JSON Tree or Graph structure.
        i - For Graph structures only. Sets the indexed node as root for the visualization.

    */
    loadJSON: function(json, i) {
      this.json = json;
      //if they're canvas labels erase them.
      if(this.labels && this.labels.clearLabels) {
        this.labels.clearLabels(true);
      }
      this.graph = this.construct(json);
      if($.type(json) != 'array'){
        this.root = json.id;
      } else {
        this.root = json[i? i : 0].id;
      }
    },
    
    /*
      Method: toJSON
   
      Returns a JSON tree/graph structure from the visualization's <Graph>. 
      See <Loader.loadJSON> for the graph formats available.
      
      See also:
      
      <Loader.loadJSON>
      
      Parameters:
      
      type - (string) Default's "tree". The type of the JSON structure to be returned. 
      Possible options are "tree" or "graph".
    */    
    toJSON: function(type) {
      type = type || "tree";
      if(type == 'tree') {
        var ans = {};
        var rootNode = this.graph.getNode(this.root);
        var ans = (function recTree(node) {
          var ans = {};
          ans.id = node.id;
          ans.name = node.name;
          ans.data = node.data;
          var ch =[];
          node.eachSubnode(function(n) {
            ch.push(recTree(n));
          });
          ans.children = ch;
          return ans;
        })(rootNode);
        return ans;
      } else {
        var ans = [];
        var T = !!this.graph.getNode(this.root).visited;
        this.graph.eachNode(function(node) {
          var ansNode = {};
          ansNode.id = node.id;
          ansNode.name = node.name;
          ansNode.data = node.data;
          var adjs = [];
          node.eachAdjacency(function(adj) {
            var nodeTo = adj.nodeTo;
            if(!!nodeTo.visited === T) {
              var ansAdj = {};
              ansAdj.nodeTo = nodeTo.id;
              ansAdj.data = adj.data;
              adjs.push(ansAdj);
            }
          });
          ansNode.adjacencies = adjs;
          ans.push(ansNode);
          node.visited = !T;
        });
        return ans;
      }
    }
};

var Options = function() {
  var args = arguments;
  for(var i=0, l=args.length, ans={}; i<l; i++) {
    var opt = Options[args[i]];
    if(opt.$extend) {
      $.extend(ans, opt);
    } else {
      ans[args[i]] = opt;  
    }
  }
  return ans;
};