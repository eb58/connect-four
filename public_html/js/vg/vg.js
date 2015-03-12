//
var vg = (function () {
    "use strict";
    var m = vgmodel;
    var v = vgview(m);
    return {
        init: function (id) {
            m.init();
            v.render(id)
        }
    };
}());
