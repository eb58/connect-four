var vg = (function () {
    "use strict";
    var model = vgmodel;
    var view = vgview(model); 
    return {
        init: view.render
    };
}());
