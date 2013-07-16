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


var $dom = {
  wrapper : $("#modal-wrapper"),
  slider : $("#modal-pane-slider"),
  body : $("#modal-body"),
  header : $("#modal-header"),
  footer : $("#modal-footer"),
  footerRow : $("#modal-footer").parent()
};

function animate(element, newCss) {
  if(!Modernizr.csstransitions) {
    element.css(newCss);
  } else {
    element.animate(newCss, 100, "linear");
  }
}

function resizeModal(width, targetHeight) {
  var realTargetHeight = targetHeight + $dom.wrapper.outerHeight() - $dom.body.outerHeight();
  var $window = $(window),
      height = Math.min($window.height() - 50, realTargetHeight);
  var newCss = {width : width + "px",
                height : height + "px",
                "margin-left" : "-" + (width / 2) + "px",
                "margin-top" : "-" + (height / 2) + "px"};
  animate($dom.wrapper, newCss);
}

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

function setButtons(specs) {
  var buttons = makeButtons(specs);
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
  var oldWidth = $dom.wrapper.width();
  currentView.removeClass("left right")
             .addClass(direction === -1 ? "left" : "right");
  $dom.slider.addClass("notransition")
             .css({width : (oldWidth + width) + "px", left : direction === -1 ? 0 : width})
             .height(); // trigger reflow so that the notransition
                        // class takes affect
  $dom.slider.removeClass("notransition");
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
  
  resizeModal(width, desiredHeight);
  animate($dom.slider, {left : "-" + (options.direction === -1 ? oldWidth : 0) + "px"});
}

