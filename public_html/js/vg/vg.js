var vg = (function () {
    "use strict";
    var model = vgmodel;
    var view = vgview(model);
    model.init();        
    return {
        init: view.render
    };
}());
