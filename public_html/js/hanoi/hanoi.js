var hanoi = function (n) {
   var gm = {l: _.range(1, n + 1).reverse(), c: [], r: []}; // -> { l:[1,2,3,...,n], c:[], r:[] }
   var result = [];
   result.push($.extend(true, {}, gm));

   function h(n, m) {
      if (n === 0) return;
      h(n - 1, {l: m.l, c: m.r, r: m.c});
      m.r.push(m.l.pop());
      result.push($.extend(true, {}, gm));
      //console.log(gm.l, gm.c, gm.r);
      h(n - 1, {l: m.c, c: m.l, r: m.r});
   }
   //console.log(gm.l, gm.c, gm.r);
   h(n, gm);
   return result;
};
