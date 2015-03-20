var vgmodelstatic = (function () {
   "use strict";
   var DIM = {NCOL: 7, NROW: 7};
   var STYP = {empty: 0, player1: 1, player2: 2, neutral: 3};
   var gr = []; // Gewinnreihen
   var grs = []; // Gewinnreihen pro Feld  


   function berechneGRs(r, c, dr, dc) { // dr = delta row,  dc = delta col
      function valOfGR(dr, dc) {
         if (dr === 0) return 1;
         if (dc === 0) return 8;
         return 4;
      }
      var arr = [];
      while (r >= 0 && r < DIM.NROW && c >= 0 && c < DIM.NCOL) {
         arr.push(c + DIM.NCOL * r);
         if (arr.length === 4) {
            gr.push({val: valOfGR(dc, dr), arr: arr});
            return;
         }
         c += dc;
         r += dr;
      }
   }
   function initGRs() {
      gr = [];
      for (var r = 0; r < DIM.NROW; r++) {
         for (var c = 0; c < DIM.NCOL; c++) {
            berechneGRs(r, c, 0, 1);
            berechneGRs(r, c, 1, 1);
            berechneGRs(r, c, 1, 0);
            berechneGRs(r, c, -1, 1);
         }
      }
      grs = [];
      for (var i = 0; i < DIM.NCOL * DIM.NROW; i++) {
         var arr = [];
         for (var j = 0; j < gr.length; j++) {
            if (_.contains(gr[j], i)) {
               arr.push(j);
            }
         }
         grs[i] = arr;
      }
      //dump();
   }
   initGRs();
   var initialState = {
      hcol: _.range(DIM.NCOL).map(function () {
         return 0;
      }), // height of cols = [0,0,0,...,0];
      grstate: _.range(gr.length).map(function () {
         return {
            occupiedBy: STYP.empty,
            cnt: 0
         };
      }),
      whosTurn: STYP.player1,
      isMill: 0,
      cntMoves: 0,
      bestMove: -1,
      maxVal: -1
   };
   // debug and test
   function dump() {
      $.each(gr, function (idx, val) {
         console.log("gr: " + val);
      });
      $.each(grs, function (idx, val) {
         console.log("grs: " + val);
      });
   }
   function internalTests() {
      return gr.length === 88
         && _.isEqual(gr.arr[0], [0, 1, 2, 3])
         && _.isEqual(gr.arr[1], [0, 8, 16, 24])
         && _.isEqual(grs[0].arr, [0, 1, 2])
         && _.isEqual(grs[1].arr, [0, 3, 4, 5])
         ;
   }

// Interface
   return {
      // Test + Debug
      dump: dump,
      internalTests: internalTests,
      // Public
      getDIM: function getDIM() {
         return DIM;
      },
      getInitialState: function () {
         return $.extend(true, {}, initialState);
      },
      gr: gr,
      grs: grs,
      STYP: STYP
   };
}());

QUnit.test('staticModel', function () {
   //vgmodelstatic.dump();
   equal(vgmodelstatic.getDIM().NCOL, 7, 'Dimension ok.');
   equal(vgmodelstatic.getDIM().NROW, 7, 'Dimension ok.');
   ok(vgmodelstatic.internalTests, "Interne Tests ok");
});
   