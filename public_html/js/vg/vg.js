   var vg = (function () {
    "use strict";
    var model = vgmodel;
    model.init();
    var view = vgview(model); 
    return {
        init: view.render
    };
}());
