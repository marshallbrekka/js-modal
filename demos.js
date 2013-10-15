
/** Demo variables and functions **/


var sampleSpecs = [{view : "<div class='one'>Oh Hello <img height=300 src='pane-1.jpg'/><script>setTimeout(function(){$(\".one\").height(500);},2000)</script></div>",
                    width : 450,
                    title : "my awesome title",
                    "class" : "my-modal-class",
                    buttons : [{text : "next", click:function(){SimpleModal.setPaneByIndex(1)}},
                               {text :"adjust height", click:function(){SimpleModal.updateHeight()}}]},
                   {view : "<div class='two'>My second pane <img src='pane-2.jpg'/></div>",
                    width: 600,
                    desiredHeight : 300,
                    loading : true,
                    title : "new title wooo",
                    buttons : [{text: "next", click: function() {
                                 SimpleModal.setPaneByIndex(2, true);
                                 setTimeout(SimpleModal.hideLoading, 3000);
                               }},
                               {text : "back", "class" : "someclass", click: function() {SimpleModal.setPaneByIndex(0)}},
                               {text : "loading", click : function() {
                                 SimpleModal.showLoading();
                                 setTimeout(SimpleModal.hideLoading, 2000);
                               }}]},
                   {view : "<div>My third pane</div>",
                    width: 400,
                    desiredHeight : 450}];


function demoNormal() {
  SimpleModal.open(sampleSpecs,
                   {mobileCutoff : 4000,
                    topLevelElement : $("#toplevel")});
}

function demoPreLoad() {
  SimpleModal.open(sampleSpecs, {}, true);
  setTimeout(function() {
    SimpleModal.show();
  }, 3000);
}

function demoLargeHeight() {
  SimpleModal.open([{view : $("<div>My craxy tall content</div>").css("height", "1000px"),
              width:300,
              buttons : [{text : "Next", click: function(){SimpleModal.setPaneByIndex(1)}}]},
             sampleSpecs[1]],
             {topLevelElement : $("#toplevel")});
}

function demoPaneCallback() {
  SimpleModal.open([sampleSpecs[0],
             {view : "<div>This modal height was set from a callback which waits for 1s before setting the height.</div>",
              width:400,
              desiredHeight:200,
              preShowCallback : function(cb) {
                setTimeout(function(){ cb(500)}, 1000);
              }}])
}

function demoCustomHeader() {
  SimpleModal.open([sampleSpecs[0],
             {view : "<div>This pane sets a class that hides the header.</div>",
              width:400,
              modalClass : "hide-header",
              desiredHeight:200,
              buttons : [{text : "next", click : function() {SimpleModal.next()}},
                         {text : "back", click : SimpleModal.previous}]
             },
             {view : "<div>This pane increases the height of the header from a class.</div>",
              width:400,
              modalClass : "large-header",
              desiredHeight:200,
              buttons : [{text : "back", click : SimpleModal.previous}]
             }
],              {mobileCutoff : 4000, 
topLevelElement : $("#toplevel")})
}


function demoResponsive() {
  SimpleModal.open([{view : $("<div>My craxy tall content</div>").css("height", "1000px"),
              width:300,
              buttons : [{text : "Next", click: function(){SimpleModal.setPaneByIndex(1)}}]},
             sampleSpecs[1]],
             {mobileCutoff : 4000,
              topLevelElement : $("#toplevel")});
}
