/**
Pane Spec
title : (optional) can be a function, string, or dome node.
view : the main content of the modal pane. can be a function, 
       string, or dom node.
width : (int) the width of the modal.
desiredHeight : (int) the modal height, not guaranteed.
buttons : (optional) a list of objs with keys
  text : the button text.
  class : can be multiple classes seperated by spaces.
  click : a function to be called on a click event.
class : (optional) a class to apply to the modal pane,
        can be used to control things like padding.
modalClass : (optional) a class to apply to the entire modal.
preShowCallback : (optional) a function that will be called before
                  the new pane is show. It must take a function as its
                  sole argument, and call that function with desired
                  pane height as its argument.
*/

var $dom;
var paneSpecs = [];
var currentIndex = null;
var _defaults = {windowPadding : 50,
                 loadingView : function() {
                   var opts = {
                     lines: 12, // The number of lines to draw
                     length: 14, // The length of each line
                     width: 6, // The line thickness
                     radius: 20, // The radius of the inner circle
                     corners: 1, // Corner roundness (0..1)
                     rotate: 0, // The rotation offset
                     direction: 1, // 1: clockwise, -1: counterclockwise
                     color: '#666666', // #rgb or #rrggbb
                     speed: 1, // Rounds per second
                     trail: 60, // Afterglow percentage
                     hwaccel: true, // Whether to use hardware acceleration
                     className: 'spinner', // The CSS class to assign to the spinner
                     zIndex: 2e9 // The z-index (defaults to 2000000000)
                   };
                   var spinner = $(new Spinner(opts).spin().el)
                     .css({position : "absolute", left : "50%", top : "50%"});
                   return $("<div id='modal-pane-loading'></div>").append(spinner);
                 }};
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

function css($element, newCss, animate) {
  if(Modernizr.csstransitions) {
    if (animate) {
      $element.css(newCss);
    } else {
      $element.addClass("modal-notransition").css(newCss);
      $element.height();
      $element.removeClass("modal-notransition");    }
  } else {
    // Set the no transition class here as well to allow easy
    // testing of jquery animation.
    $element.addClass("modal-notransition");
    if(animate) {
      $element.animate(newCss, 150, "linear");
    } else {
      $element.css(newCss);
    }
  }
}

function elementHeight($element) {
  if ($element.is(":visible")) {
    return $element.outerHeight();
  }
  return 0;
}

function paneHeights(spec, overrideHeight) {
  css(spec.view, {height : "2px"});
  var height = overrideHeight ||
               spec.desiredHeight ||
               settings.height ||
               spec.view[0].scrollHeight,
      header = elementHeight($dom.header),
      footer = elementHeight($dom.footer),
      guiHeight = header + footer,
      realTargetHeight = height + guiHeight;
  height = Math.min($(window).height() - settings.windowPadding, realTargetHeight);
  return {modal : height,
          pane : height - guiHeight,
          header : header, 
          footer : footer};
}

function resizeModal(width, height, dontAnimate) {
  var newCss = {width : width + "px",
                height : height + "px",
                "margin-left" : "-" + (width / 2) + "px",
                "margin-top" : "-" + (height / 2) + "px"};
  css($dom.wrapper, newCss, !dontAnimate);
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
    $dom.footer.append(buttons).show();
  } else {
    $dom.footer.hide();
  }
}

/* takes a direction (left: -1, right: 1),
   the width for the new view, the view, and
   the current view, and sets up the new view
   as block but hidden, and positions the two views
   in the slider element.
*/
function setupPaneSwap(direction, width, view, currentView) {
  var slideWidth = currentView ? $dom.wrapper.width() + width : width;
  css(view, {width: width + "px"});
  css($dom.slider, {width : slideWidth + "px", left : "-" + (direction === -1 ? 0 : width) + "px"});
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
  if (spec.modalClass) {
    $dom.wrapper.addClass(spec.modalClass);
  }
  var animate = currentIndex === null ? false : true;
  setTitle(spec.title);
  var newHeights = paneHeights(spec);
  css($dom.body, {bottom : newHeights.footer + "px", top: newHeights.header + "px"}, true);
  css(spec.view, {height : newHeights.pane + "px"});
  resizeModal(spec.width, newHeights.modal, !animate);
  css($dom.slider, {left : "-" + (direction === -1 ? oldWidth : 0) + "px"}, animate);
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
  $dom.header = $("<div id='modal-header'></div>");
  $dom.body = $("<div id='modal-body'></div>");
  $dom.slider = $("<div id='modal-pane-slider'></div>").appendTo($dom.body);
  $dom.footer = $("<div id='modal-footer'></div>");
  $dom.closeButton = $("<div id='modal-close'></div>");
  $dom.wrapper = $("<div id='modal-wrapper'></div>")
    .append($dom.closeButton, $dom.header, $dom.body, $dom.footer);
  $dom.container = $("<div id='modal'></div>");
  if (loading) {
    $dom.wrapper.addClass("modal-loading");
    makePreSpinner();
  }
  $dom.container.append($dom.wrapper);
  $("body").append($dom.container);
}

function processSpec(spec) {
  if (!spec.width) throw new Error("You must define a width for each pane spec");
  var newSpec = jQuery.extend(true, {}, spec);
  var paneWrapper = $("<div class='modal-pane-wrapper'></div>").append($(spec.view)).addClass(spec["class"]);
  var view = $("<div class='modal-pane'></div>").append(paneWrapper);
  $dom.slider.append(view);
  newSpec.view = view;
  paneSpecs.push(newSpec);
}


/** Public API Functions **/

function showLoading(paneIndex) {
  var spec = paneSpecs[paneIndex === undefined ? currentIndex : paneIndex]
  var loadingView = typeof(settings.loadingView) === "function"
    ? settings.loadingView() : $(settings.loadingView);
  spec.view.append(loadingView).css({overflow : "hidden"})[0].scrollTop = 0;
  spec._loadingView = loadingView;
}

function hideLoading() {
  var spec = paneSpecs[currentIndex];
  spec._loadingView.detach();
  spec.view.css("overflow","");
}

function updateHeight(desiredHeight) {
  var pane = paneSpecs[currentIndex].view;
  var heights = paneHeights(paneSpecs[currentIndex], desiredHeight)
  css(pane, {height : ""});
  resizeModal($dom.wrapper.width(), heights.modal);
}

function setPaneByIndex(index, showLoadingPane) {
  if (index === currentIndex) return;
  var spec = paneSpecs[index];
  if (!spec) throw new Error(index + " is not a valid pane spec");
  var direction = (currentIndex || 0) < index ? -1 : 1;
  if (showLoadingPane) {
    showLoading(index);
  }
  var currentView = currentIndex !== null ? paneSpecs[currentIndex].view : null;
  setupPaneSwap(direction, spec.width, spec.view, currentView);
  if(spec.preShowCallback) {
    spec.preShowCallback(
      function(paneHeight) {
        spec.desiredHeight = paneHeight
        swapPanes(direction, spec);
        currentIndex = index;
      }
    );
  } else {
    swapPanes(direction, spec);
    currentIndex = index;
  }
}

function next(showLoadingPane) {
  setPaneByIndex(currentIndex + 1, showLoadingPane);
}

function previous() {
  setPaneByIndex(currentIndex - 1);
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
  mergeSettings(["windowPadding", "width", "height", "loadingView"], settings || {});
  if ($dom) return;
  createDom(loading);
  $dom.closeButton.click(closeModal);
  _.each(specs, processSpec);
  setPaneByIndex(0);
}


/** Demo variables and functions **/


var sampleSpecs = [{view : "<div class='one'>Oh Hello <img height=300 src='pane-1.jpg'/><script>setTimeout(function(){$(\".one\").height(500);},2000)</script></div>",
                    width : 450,
                    title : "my awesome title",
                    "class" : "my-modal-class",
                    buttons : [{text : "next", click:function(){setPaneByIndex(1)}},
                               {text :"adjust height", click:function(){updateHeight()}}]},
                   {view : "<div class='two'>My second pane <img src='pane-2.jpg'/></div>",
                    width: 600,
                    desiredHeight : 300,
                    loading : true,
                    title : "new title wooo",
                    buttons : [{text: "next", click: function() {
                                 setPaneByIndex(2, true);
                                 setTimeout(hideLoading, 3000);
                               }},
                               {text : "back", "class" : "someclass", click: function() {setPaneByIndex(0)}},
                               {text : "loading", click : function() {
                                 showLoading();
                                 setTimeout(hideLoading, 2000);
                               }}]},
                   {view : "<div>My third pane</div>",
                    width: 400,
                    desiredHeight : 450}];


function demoNormal() {
  openModal(sampleSpecs);
}

function demoPreLoad() {
  openModal(sampleSpecs, {}, true);
  setTimeout(function() {
    showModal();
  }, 3000);
}

function demoLargeHeight() {
  openModal([{view : $("<div>My craxy tall content</div>").css("height", "1000px"),
              width:300,
              buttons : [{text : "Next", click: function(){setPaneByIndex(1)}}]},
             sampleSpecs[1]]);
}

function demoPaneCallback() {
  openModal([sampleSpecs[0],
             {view : "<div>This modal height was set from a callback which waits for 1s before setting the height.</div>",
              width:400,
              desiredHeight:200,
              preShowCallback : function(cb) {
                setTimeout(function(){ cb(500)}, 1000);
              }}])
}

function demoCustomHeader() {
  openModal([sampleSpecs[0],
             {view : "<div>This pane sets a class that hides the header.</div>",
              width:400,
              modalClass : "hide-header",
              desiredHeight:200,
              buttons : [{text : "next", click : function() {next()}},
                         {text : "back", click : previous}]
             },
             {view : "<div>This pane increases the height of the header from a class.</div>",
              width:400,
              modalClass : "large-header",
              desiredHeight:200,
              buttons : [{text : "back", click : previous}]
             }
])
}
