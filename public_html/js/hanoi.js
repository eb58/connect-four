var hanoi = (function (l, c, r) {
   function showTowers() {
      console.log(l, c, r);
   }
   function h(n, l, c, r) {
      if (n === 0) return;
      h(n - 1, l, r, c);
      r.push(l.pop());
      showTowers();
      h(n - 1, c, l, r);
   }
   showTowers();
   h(l.length, l, c, r);
})([3, 2, 1], [], []);
