/* global _, QUnit */
const vgmodelstatic = (function () {
  "use strict";
  const DIM = {NCOL: 7, NROW: 7};
  const STYP = {empty: 0, player1: 1, player2: 2, neutral: 3};
  const gr = []; // Gewinnreihen
  const grs = []; // Gewinnreihen pro Feld  

  const berechneGRs = (r, c, dr, dc) => { // dr = delta row,  dc = delta col
    // horizontal gr is the best (8)
    // skew gr is quit good (4)
    // vertical gr is not so strong as horizontal or skew ones (1)
    const valOfGR = (dr, dc) => dc === 0 ? 8 : (dr !== 0 ? 4 : 1);

    const arr = [];
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

  const initGRs = () => {
    for (let r = 0; r < DIM.NROW; r++) {
      for (let c = 0; c < DIM.NCOL; c++) {
        berechneGRs(r, c, 0, 1);
        berechneGRs(r, c, 1, 1);
        berechneGRs(r, c, 1, 0);
        berechneGRs(r, c, -1, 1);
      }
    }

    for (let i = 0; i < DIM.NCOL * DIM.NROW; i++) {
      grs[i] = gr.reduce((acc, g, j) => g.arr.includes(i) ? [...acc, j] : acc, []);
    }
    //dump();
  }
  initGRs();
  // debug and test
  const  dump = () => {
    gr.forEach(o => console.log("gr: " + o.arr + ' val: ' + o.val));
    grs.forEach((o,i) => console.log("grs: ", i, o));
  }
  const internalTests = () => gr.length === 88
            && _.isEqual(gr[0].arr, [0, 1, 2, 3])
            && _.isEqual(gr[1].arr, [0, 8, 16, 24])
            && _.isEqual(grs[0].arr, [0, 1, 2])
            && _.isEqual(grs[1].arr, [0, 3, 4, 5]);

  return Object.freeze({// API
    // Test + Debug
    dump: dump,
    internalTests: internalTests,
    // Public
    DIM,
    gr,
    grs,
    STYP
  });
}());

   