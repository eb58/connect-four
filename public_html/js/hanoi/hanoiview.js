var hanoiview = function (resarr, h) {
   var brickMaxWidth = 250;
   var brickHeight = 30;
   var hPole = brickHeight * (h + 1);
   var papers = [null,null,null];

   function drawTower(n, arr) {
      if( papers[n] === null ) papers[n] = Raphael(50+n*(brickMaxWidth), 10, (brickMaxWidth + 50), hPole);
      paper = papers[n];
      paper.clear();
      paper.rect(brickMaxWidth / 2-5, 10, 10, hPole).attr("fill", "#000"); // draw pole
      arr.forEach(function (v, i) {
         var w = v * brickMaxWidth / h;
         var left = brickMaxWidth / 2 - (w / 2);
         var top = hPole - (i + 1) * brickHeight;
         paper.rect(left, top, w, brickHeight).attr("fill", "#f00");
      });
   }

   function drawModel(m) {
      drawTower(0, m.l);
      drawTower(1, m.c);
      drawTower(2, m.r);
   }

   function loop() {
      drawModel(resarr.shift());
      if (resarr.length > 0) setTimeout(loop, 1000);
   }
   return {
      show: loop
   };
};



