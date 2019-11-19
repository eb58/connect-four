/* global vgmodel */
const vg = (function () {
  "use strict";
  return {
    init: (id, player) => {
      vgmodel.init(player)
      vgview(vgmodel).render(id);
    },
    setLevel: vgmodel.setLevel,
    undoMove: vgmodel.undoMove,
    getStatistics: vgmodel.getStatistics,
  };
}());
