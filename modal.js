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

(function() {

var $dom;
var paneSpecs = [];
var currentIndex = null;
var _defaults = {windowPadding : 50,
                 mobileCutoff : 700,
                 topLevelElement : null,
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
                   return $("<div id='s_simple_modal_pane_loading'></div>").append(spinner);
                 }};
var settings = {};
var loadingClass = "s_simple_modal_loading";

function mergeSettings(names, customSettings) {
  settings = {};
  _.each(names, function(name) {
    var value = customSettings[name] || _defaults[name];
    if (value != null && value != undefined) {
      settings[name] = value;
    }
  });
}

function css($element, newCss, animate) {
  if(Modernizr.csstransitions) {
    if (animate) {
      $element.css(newCss);
    } else {
      $element.addClass("s_simple_modal_notransition").css(newCss);
      $element.height();
      $element.removeClass("s_simple_modal_notransition");    }
  } else {
    // Set the no transition class here as well to allow easy
    // testing of jquery animation.
    $element.addClass("s_simple_modal_notransition");
    if(animate) {
      $element.animate(newCss, 150, "linear");
    } else {
      $element.css(newCss);
    }
  }
}

function scrollTop(newPosition) {
  if (window.pageYOffset !== undefined) {
    if (newPosition === 0 || newPosition) {
      window.scroll(0, newPosition);
    } else {
      return window.pageYOffset;
    }
  } else {
    var element = document.documentElement ? document.documentElement : document.body;
    if (newPosition === 0 || newPosition) {
      element.scrollTop = newPosition;
    } else {
      return element.scrollTop;
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

function setModalMode() {
  settings._mobileMode = $(window).width() < settings.mobileCutoff;
}

function alterTopLevelElement() {
  var el = settings.topLevelElement;
  if (el) {
    settings._preModalScroll = scrollTop();
    css(el, {position : "fixed",
             top : "-" + settings._preModalScroll + "px",
             left : 0,
             right : 0});
  }
}

function resetTopLevelElement() {
  var el = settings.topLevelElement;
  if (el) {
    css(el, {position : "",
             top : "",
             left : "",
             right : ""});
    scrollTop(settings._preModalScroll);
  }
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
    var button = $("<button class='s_simple_modal_button'><span>" + spec.text + "</span></button>");
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
  if (settings._mobileMode) {
    css($dom.slider, {width: "200%"})
    css(view, {display : "block"});
  } else {
    var slideWidth = currentView ? $dom.wrapper.width() + width : width;
    css(view, {width: width + "px"});
    css($dom.slider, {width : slideWidth + "px", left : "-" + (direction === -1 ? 0 : width) + "px"});
  }
  _.each(paneSpecs, function(spec) {spec.view.removeClass("right").removeClass("left")});
  if (currentView) {
    currentView.addClass(direction === -1 ? "left" : "right");
  }
  view.addClass(direction === -1 ? "right" : "left").addClass("pre_show");
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
  spec.view.removeClass("pre_show");
  setButtons(spec.buttons);
  if ($dom.wrapper.hasClass(loadingClass)) {
    $dom.wrapper.removeClass();
    $dom.wrapper.addClass(loadingClass);
  } else {
    $dom.wrapper.removeClass();
  }
  if (spec.modalClass) {
    $dom.wrapper.addClass(spec.modalClass);
  }
  var animate = currentIndex === null ? false : true;
  setTitle(spec.title);
  if (!settings._mobileMode) {
    var newHeights = paneHeights(spec);
    css($dom.body, {bottom : newHeights.footer + "px", top: newHeights.header + "px"}, true);
    css(spec.view, {height : newHeights.pane + "px"});
    resizeModal(spec.width, newHeights.modal, !animate);
    css($dom.slider, {left : "-" + (direction === -1 ? oldWidth : 0) + "px"}, animate);
  } else {
    scrollTop(0);
    if (currentIndex != null) {
      css(paneSpecs[currentIndex].view, {display : "none"});
    }
    css($dom.slider, {left : "-" + (direction === -1 ? 100 : 0) + "%"}, animate);
  }
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
  $dom.header = $("<div id='s_simple_modal_header'></div>");
  $dom.body = $("<div id='s_simple_modal_body'></div>");
  $dom.slider = $("<div id='s_simple_modal_pane_slider'></div>").appendTo($dom.body);
  $dom.footer = $("<div id='s_simple_modal_footer'></div>");
  $dom.closeButton = $("<div id='s_simple_modal_close'></div>");
  $dom.wrapper = $("<div id='s_simple_modal_wrapper' ></div>")
    .append($dom.closeButton, $dom.header, $dom.body, $dom.footer);
  $dom.container = $("<div id='s_simple_modal'></div>");
  $dom.container.addClass((settings._mobileMode ? "mobile" : "desktop") + "Mode");
  if (loading) {
    $dom.wrapper.addClass(loadingClass);
    makePreSpinner();
  }
  $dom.background = $("<div id='s_simple_modal_bg'></div>");
  $dom.container.append($dom.wrapper, $dom.background);
  $("body").append($dom.container);

  alterTopLevelElement();
}

function processSpec(spec) {
  if (!spec.width) throw new Error("You must define a width for each pane spec");
  var newSpec = jQuery.extend(true, {}, spec);
  var paneWrapper = $("<div class='s_simple_modal_pane_wrapper'></div>").append($(spec.view)).addClass(spec["class"]);
  var view = $("<div class='s_simple_modal_pane'></div>").append(paneWrapper);
  $dom.slider.append(view);
  newSpec.view = view;
  paneSpecs.push(newSpec);
}

function privateClose(ignoreCallback) {
  var re = (settings.closeCallback && !ignoreCallback) ? closeCallback() : true;
  if (re == null || re && $dom) {
    $dom.container.remove();
    paneSpecs = [];
    $dom = null;
    currentIndex = null;
    resetTopLevelElement();
  }
}

function closeIfEsc(e) {
  if(e.keyCode == 27) {
    $(window).off(".simple_modal");
    privateClose();
  }
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
  if (!settings._mobileMode) {
    var pane = paneSpecs[currentIndex].view;
    var heights = paneHeights(paneSpecs[currentIndex], desiredHeight)
    css(pane, {height : ""});
    resizeModal($dom.wrapper.width(), heights.modal);
  }
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
  privateClose(true);
}

function showModal() {
  $dom.loading.remove();
  $dom.wrapper.removeClass(loadingClass);
}

function openModal(specs, settings, loading) {
  mergeSettings(["windowPadding", "width", "height", "loadingView",
                 "closeCallback", "mobileCutoff", "topLevelElement"],
                settings || {});
  $(window).on("keydown.simple_modal", closeIfEsc);

  if ($dom) return;
  setModalMode();
  createDom(loading);
  $dom.closeButton.click(privateClose);
  _.each(specs, processSpec);
  setPaneByIndex(0);
}

window.SimpleModal = {
  showLoading: showLoading,
  hideLoading: hideLoading,
  updateHeight: updateHeight,
  setPaneByIndex: setPaneByIndex,
  next: next,
  previous: previous,
  close: closeModal,
  show: showModal,
  open: openModal
};

})();
