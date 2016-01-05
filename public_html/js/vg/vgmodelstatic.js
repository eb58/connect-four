/* global _, QUnit */

var vgmodelstatic = (function () {
   "use strict";
   var DIM = {NCOL: 7, NROW: 7};
   var STYP = {empty: 0, player1: 1, player2: 2, neutral: 3};
   var gr = []; // Gewinnreihen
   var grs = []; // Gewinnreihen pro Feld  

   function berechneGRs(r, c, dr, dc) { // dr = delta row,  dc = delta col
      function valOfGR(dr, dc) {
         if (dc === 0) return 8; // horizontal gr
         if (dr === 0) return 1; // vertical gr
         return 4;   // skew gr
      }
      var arr = [];
      while (r >= 0 && r < DIM.NROW && c >= 0 && c < DIM.NCOL) {
         arr.push(c + DIM.NCOL * r);
         if (arr.length === 4) {
            gr.push({arr: arr, val: valOfGR(dc, dr)});
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
            if (_.contains(gr[j].arr, i)) {
               arr.push(j);
            }
         }
         grs[i] = arr;
      }
      //dump();
   }
   initGRs();
   var initialState = {
      hcol: _.range(DIM.NCOL).map(function () { // height of cols = [0,0,0,...,0];
         return 0;
      }),
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
      gr.forEach( function (o) {
         console.log("gr: " + o.arr + ' val: ' + o.val);
      });
      grs.forEach( function ( o) {
         console.log("grs: " + o);
      });
   }
   function internalTests() {
      return gr.length === 88
         && _.isEqual(gr[0].arr, [0, 1, 2, 3])
         && _.isEqual(gr[1].arr, [0, 8, 16, 24])
         && _.isEqual(grs[0].arr, [0, 1, 2])
         && _.isEqual(grs[1].arr, [0, 3, 4, 5]);
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

   