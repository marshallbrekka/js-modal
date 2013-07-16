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
var currentIndex;

function animate(element, newCss) {
  if(!Modernizr.csstransitions) {
    element.css(newCss);
  } else {
    element.animate(newCss, 100, "linear");
  }
}

function resizeModal(width, targetHeight, dontAnimate) {
  var realTargetHeight = targetHeight + $dom.wrapper.outerHeight() - $dom.body.outerHeight();
  var $window = $(window),
      height = Math.min($window.height() - 50, realTargetHeight);
  var newCss = {width : width + "px",
                height : height + "px",
                "margin-left" : "-" + (width / 2) + "px",
                "margin-top" : "-" + (height / 2) + "px"};
  if (dontAnimate) {
    $dom.wrapper.addClass("notransition");
    $dom.wrapper.css(newCss);
    $dom.wrapper.height();
    $dom.wrapper.removeClass("notransition");
  } else {
    animate($dom.wrapper, newCss);
  }
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
      button.addClass(specs[i]["class"]);
    }
    if (spec.click) {
      button.click(spec.click);
    }
    return button
  });
}

// Takes a list of buttons and sets the footer to those buttons.
// If no buttons are provided it hides the footer.
function setButtons(buttons) {
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
  var slideWidth = currentView ? $dom.wrapper.width() + width : width;
  $dom.slider.addClass("notransition")
             .css({width : slideWidth + "px", left : direction === -1 ? 0 : width})
             .height(); // trigger reflow so that the notransition
                        // class takes affect
  $dom.slider.removeClass("notransition");
  if (currentView) {
    currentView.removeClass("left right")
               .addClass(direction === -1 ? "left" : "right");
  }

  $(".modal-pane").not(currentView).removeClass("left right");
  view.addClass(direction === -1 ? "right" : "left")
      .addClass("pre-show");
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
function swapPanes(options) {
  var oldWidth = $dom.wrapper.outerWidth(),
      view = $(options.view);
  options.view.removeClass("pre-show");
  setButtons(options.buttons);
  $dom.wrapper.removeClass();
  if (options["class"]) {
    $dom.wrapper.addClass(options["class"]);
  }
  setTitle(options.title);
  resizeModal(options.width, options.desiredHeight);
  animate($dom.slider, {left : "-" + (options.direction === -1 ? oldWidth : 0) + "px"}, $dom.currentView);
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
  $dom.wrapper = $("<table id='modal-wrapper'></table>")
    .append($dom.headerRow, $("<tr></tr>").append($dom.body), $dom.footerRow);
  $dom.container = $("<div id='modal'></div>");
  if (loading) {
    $dom.wrapper.addClass("loading");
    makePreSpinner();
  }
  $dom.container.append($dom.wrapper);
  $("body").append($dom.container);
}

function processSpec(spec) {
  var view = $(spec.view);
  $dom.slider.append(view);
  spec.view = view;
  spec.buttons = makeButtons(spec.buttons);
  paneSpecs.push(spec);
}

function setPaneByIndex(index) {
  var spec = paneSpecs[index];
  if (!spec) throw new Error(index + " is not a valid pane spec");
  var direction = (currentIndex || 0) < index ? -1 : 1;
  var currentView = currentIndex ? paneSpecs[currentIndex].view : null;
  setupPaneSwap(direction, spec.width, spec.view, currentView);
  if(spec.preShowCallback) {
    spec.preShowCallback();
  } else {
    swapPanes(spec);
  }
  currentIndex = 0;
}

function closeModal() {
  if ($dom) {
    $dom.container.remove();
    paneSpecs = [];
  }
}

function openModal(specs, loading) {
  if ($dom) return;
  createDom(loading);
  _.each(specs, processSpec);
  setPaneByIndex(0);
}

