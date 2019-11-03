/* global vgmodel */
const vg = (function () {
  "use strict";
  const v = vgview(vgmodel);
  return {
    init: id => {
      vgmodel.init();
      v.render(id);
    },
    setLevel: vgmodel.setLevel,
    undoMove: vgmodel.undoMove,
  };
}());
