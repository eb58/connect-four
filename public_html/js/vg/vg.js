/* global vgmodel */
var vg = (function () {
    "use strict";
    var m = vgmodel;
    var v = vgview(m);
    return {
        init: function init(id) {
            m.init();
            v.render(id);
        },
        setLevel:function setLevel(n){
           m.setLevel(n);
        },
        undoMove: function(){
          m.undoMove();
        }
    };
}());
