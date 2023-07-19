const vgmodelstatic = (function () {
  const range = (n) => [...Array(n).keys()]
  const DIM = { NCOL: 7, NROW: 6 };
  const STYP = { empty: 0, player1: 1, player2: 2, neutral: 3 };
  const gr = []; // Gewinnreihen
  const grs = []; // Gewinnreihen pro Feld  

  const dump = () => {
    console.log("GR", gr )
    gr.forEach(o => console.log("gr: " + o.arr + ' val: ' + o.val));
    grs.forEach((o, i) => console.log("grs: ", i, o));
  }


  const berechneGRs = (r, c, dr, dc) => { // dr = delta row,  dc = delta col
    // horizontal gr is the best (8)
    // skew gr is quit good (4)
    // vertical gr is not so strong as horizontal or skew ones (1)
    const valOfGR = (dr, dc) => dr === 0 ? 8 : (dc !== 0 ? 4 : 1);

    const arr = [];
    while (r >= 0 && r < DIM.NROW && c >= 0 && c < DIM.NCOL) {
      arr.push(c + DIM.NCOL * r);
      if (arr.length === 4) {
        gr.push({ arr: arr, val: valOfGR(dr, dc) });
        return;
      }
      c += dc;
      r += dr;
    }
  }

  const initGRs = () => {
    range(DIM.NROW).forEach(r => {
      range(DIM.NCOL).forEach(c => {
        berechneGRs(r, c, 0, 1);
        berechneGRs(r, c, 1, 1);
        berechneGRs(r, c, 1, 0);
        berechneGRs(r, c, -1, 1);
      })
    })

    range(DIM.NCOL * DIM.NROW).forEach(i => {
      grs[i] = gr.reduce((acc, g, j) => g.arr.includes(i) ? [...acc, j] : acc, []);
    })
    dump();
  }

  initGRs();
  // debug and test

  const equal = (a1, a2) => a1.every((x, i) => x === a2[i])

  const internalTests = () => gr.length === 69
    && equal(gr[0].arr, [0, 1, 2, 3])
    && equal(gr[1].arr, [0, 8, 16, 24])
    && equal(grs[0], [0, 1, 2])
    && equal(grs[1], [0, 3, 4, 5]);

  return Object.freeze({// API
    // Test + Debug
    dump,
    internalTests,
    // Public
    DIM,
    gr,
    grs,
    STYP
  });
}());

