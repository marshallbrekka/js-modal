/* NOTES

* all panes *
prior to showing the pane set it to block, but visibility hidden
and set it to the desired width
grab its dimmensions and calculate the desired width and height
(taking into account current window size, and any other size
restrictions imposed on the modal). We will then transition the modal
size either using css3 transitions or js animations

The same applies when resizing the modal on the current pane, the
real dimmensions of the pane are calculated and resized according to
the same rules


* iframes *
because we can't get the height of the content from outside the iframe
we need to ask the iframe (or have it tell us) the dimmensions of its 
html element (clientHeight and clientWidth);

Instead of coding specifically for iframes when a pane is defined
it can supply a callback that the modal will call after setting up the
initial dimmensions of the pane while still invisible. Once the modal
has called the callback fn, it will wait until a public fn is called
that takes the desired width and height of the modal.
At this point those dimmensions will be evaluated just like a normal
pane and the modal will transition to those dimmensions.

* resizing *
I suppose it might be useful to request a modal resize its current
window. When resizing it is assumed the modal content has already been
updated. If no dimmensions are specified when calling the resizing fn
it will attempt to get them from the current panes dom.

*/


var $dom;
var paneSpecs = [];
var currentIndex = null;
var _defaults = {windowPadding : 50}
var settings = {};

function mergeSettings(names, customSettings) {
  settings = {};
  _.each(names, function(name) {
    var value = customSettings[name] || _defaults[name];
    if (value) {
      settings[name] = value;
    }
  });
}

function animate($element, newCss, dontAnimate) {
  if(Modernizr.csstransitions) {
    if (dontAnimate) {
      $element.addClass("modal-notransition").css(newCss);
      $element.height();
      $element.removeClass("modal-notransition");
    } else {
      $element.css(newCss);
    }
  } else {
    // Set the no transition class here as well to allow easy
    // testing of jquery animation.
    $element.addClass("modal-notransition");
    if(dontAnimate) {
      $element.css(newCss);
    } else {
      $element.animate(newCss, 150, "linear");
    }
  }
}

function paneHeight(spec, overrideHeight) {
  animate(spec.view, {height : "2px"}, true);
  var height = overrideHeight ||
               spec.desiredHeight ||
               settings.height ||
               spec.view[0].scrollHeight;
  var guiHeight = $dom.wrapper.outerHeight() - $dom.body.outerHeight();
  var realTargetHeight = height + guiHeight;
  height = Math.min($(window).height() - settings.windowPadding, realTargetHeight);
  return {modal : height,
          pane : height - guiHeight};
}

function resizeModal(width, height, dontAnimate) {
  var newCss = {width : width + "px",
                height : height + "px",
                "margin-left" : "-" + (width / 2) + "px",
                "margin-top" : "-" + (height / 2) + "px"};
  animate($dom.wrapper, newCss, dontAnimate);
}

// Takes a string or a dom node and sets it as the child of the header.
function setTitle(content) {
  if (typeof content === "string") {
    $dom.header.html(content);
  } else {
    $dom.header.empty().append(content);
  }
}

function makeButtons(specs) {
  return _.map(specs, function(spec) {
    var button = $("<button class='modal-button'><span>" + spec.text + "</span></button>");
    if (spec["class"]) {
      button.addClass(spec["class"]);
    }
    if (spec.click) {
      button.click(spec.click);
    }
    return button
  });
}

// Takes a list of buttons and sets the footer to those buttons.
// If no buttons are provided it hides the footer.
function setButtons(buttonSpecs) {
  var buttons = makeButtons(buttonSpecs);
  $dom.footer.empty();
  if (buttons.length) {
    $dom.footer.append(buttons);
    $dom.footerRow.show();
  } else {
    $dom.footerRow.hide();
  }
}

/* takes a direction (left: -1, right: 1),
   the width for the new view, the view, and
   the current view, and sets up the new view
   as block but hidden, and positions the two views
   in the slider element.
*/
function setupPaneSwap(direction, width, view, currentView) {
  var width = width || $dom.wrapper.width();
  var slideWidth = currentView ? $dom.wrapper.width() + width : width;
  animate(view, {width: width + "px"}, true);
  animate($dom.slider, {width : slideWidth + "px", left : "-" + (direction === -1 ? 0 : width) + "px"}, true)
  _.each(paneSpecs, function(spec) {spec.view.removeClass("right").removeClass("left")});
  if (currentView) {
    currentView.addClass(direction === -1 ? "left" : "right");
  }
  view.addClass(direction === -1 ? "right" : "left").addClass("pre-show");
  view[0].scrollTop = 0;
}

/**
  Sets the new title and buttons, and then 
  animates the new pane into view.
  view : the dom node to switch to
  width : the width of the modal
  desiredHeight : the modal height, not guaranteed
  title : Can be a string or a dom node
  buttons : (optional) an array of objs with keys
    text : the button text
    class : can be multiple classes seperated by spaces
    click : a function to bind to the click event
  class : (optional) a class to apply to the modal wrapper
*/
function swapPanes(direction, spec) {
  var oldWidth = $dom.wrapper.outerWidth();
  spec.view.removeClass("pre-show");
  setButtons(spec.buttons);
  if ($dom.wrapper.hasClass("modal-loading")) {
    $dom.wrapper.removeClass();
    $dom.wrapper.addClass("modal-loading");
  } else {
    $dom.wrapper.removeClass();
  }
  if (spec["class"]) {
    $dom.wrapper.addClass(spec["class"]);
  }
  var dontAnimate = currentIndex === null ? true : false
  setTitle(spec.title);
  var newHeights = paneHeight(spec);
  animate(spec.view, {height : newHeights.pane + "px"}, true);
  resizeModal(spec.width, newHeights.modal, dontAnimate);
  animate($dom.slider, {left : "-" + (direction === -1 ? oldWidth : 0) + "px"}, dontAnimate);
}

function makePreSpinner() {
  var opts = {
    lines: 12, // The number of lines to draw
    length: 14, // The length of each line
    width: 6, // The line thickness
    radius: 20, // The radius of the inner circle
    corners: 1, // Corner roundness (0..1)
    rotate: 0, // The rotation offset
    direction: 1, // 1: clockwise, -1: counterclockwise
    color: '#000', // #rgb or #rrggbb
    speed: 1, // Rounds per second
    trail: 60, // Afterglow percentage
    hwaccel: true, // Whether to use hardware acceleration
    className: 'spinner', // The CSS class to assign to the spinner
    zIndex: 2e9, // The z-index (defaults to 2000000000)
    top: 'auto', // Top position relative to parent in px
    left: 'auto' // Left position relative to parent in px
  };
  $dom.loading = $(new Spinner(opts).spin().el)
     .css({position : "absolute", left : "50%", top : "50%"});
  $dom.container.append($dom.loading);
}

function createDom(loading) {
  $dom = {}
  $dom.headerRow = $("<tr id='modal-header-row'></tr>");
  $dom.header = $("<td id='modal-header'>preparing</td>").appendTo($dom.headerRow);
  $dom.body = $("<td id='modal-body'></td>");
  $dom.slider = $("<div id='modal-pane-slider'></div>").appendTo($dom.body);
  $dom.footerRow = $("<tr id='modal-footer-row'></tr>");
  $dom.footer = $("<td id='modal-footer'></td>").appendTo($dom.footerRow);
  $dom.closeButton = $("<div id='modal-close'></div>");
  var table = $("<table></table>")
    .append( $dom.headerRow, $("<tr></tr>").append($dom.body), $dom.footerRow)
  $dom.wrapper = $("<div id='modal-wrapper'></div>").append($dom.closeButton, table);
  $dom.container = $("<div id='modal'></div>");
  if (loading) {
    $dom.wrapper.addClass("modal-loading");
    makePreSpinner();
  }
  $dom.container.append($dom.wrapper);
  $("body").append($dom.container);
}

function processSpec(spec) {
  var newSpec = jQuery.extend(true, {}, spec);
  var view = $("<div class='modal-pane'></div>").append($(spec.view));
  $dom.slider.append(view);
  newSpec.view = view;
  paneSpecs.push(newSpec);
}


/** Public API Functions **/

function updateHeight(desiredHeight) {
  var pane = paneSpecs[currentIndex].view;
  var heights = paneHeight(paneSpecs[currentIndex], desiredHeight)
  animate(pane, {height : ""}, true);
  resizeModal($dom.wrapper.width(), heights.modal);
}

function setPaneByIndex(index) {
  if (index === currentIndex) return;
  var spec = paneSpecs[index];
  if (!spec) throw new Error(index + " is not a valid pane spec");
  var direction = (currentIndex || 0) < index ? -1 : 1;
  var currentView = currentIndex !== null ? paneSpecs[currentIndex].view : null;
  setupPaneSwap(direction, spec.width, spec.view, currentView);
  if(spec.preShowCallback) {
    spec.preShowCallback();
  } else {
    swapPanes(direction, spec);
  }
  currentIndex = index;
}

function closeModal() {
  if ($dom) {
    $dom.container.remove();
    paneSpecs = [];
    $dom = null;
    currentIndex = null;
  }
}

function showModal() {
  $dom.loading.remove();
  $dom.wrapper.removeClass("modal-loading");
}

function openModal(specs, settings, loading) {
  mergeSettings(["windowPadding", "width", "height"], settings || {});
  if ($dom) return;
  createDom(loading);
  $dom.closeButton.click(closeModal);
  _.each(specs, processSpec);
  setPaneByIndex(0);
}

var sampleSpecs = [{view : "<div class='one'>Oh Hello <img height=300 src='pane-1.jpg'/><script>setTimeout(function(){$(\".one\").height(500);},2000)</script></div>",
                    width : 450,
                    title : "my awesome title",
                    "class" : "my-modal-class",
                    buttons : [{text : "next", click:function(){setPaneByIndex(1)}},
                               {text :"adjust height", click:function(){updateHeight()}}]},
                   {view : "<div class='two'>My second pane <img src='pane-2.jpg'/></div>",
                    width: 600,
                    desiredHeight : 300,
                    title : "new title wooo",
                    buttons : [{text: "next", click: function() {setPaneByIndex(2)}},
                               {text : "back", "class" : "someclass", click: function() {setPaneByIndex(0)}}]},
                   {view : "<div>My third pane</div>",
                    width: 400,
                    desiredHeight : 450}];


function demoNormal() {
  openModal(sampleSpecs);
}

function demoPreLoad() {
  openModal(sampleSpecs, {}, true);
  setTimeout(showModal, 3000);
}

function demoLargeHeight() {
  openModal([{view : $("<div>My craxy tall content</div>").css("height", "1000px"),
              buttons : [{text : "Next", click: function(){setPaneByIndex(1)}}]},
             sampleSpecs[1]]);

}
