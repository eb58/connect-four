var staticModel = {
    gr: [], // Gewinnreihen
    grs: [], // Gewinnreihen pro Feld  
    init: function init(amzug) {
        this.amzug = amzug;
        for (var s = 0; s < SANZ; s++) {
            this.hoehe.push(0);
            this.s.push([]);
            for (var z = 0; z < ZANZ; z++) {
                function berechneGRs(dx, dy, s, z) {
                    var reihe = [];
                    while (s >= 0 && s < SANZ && z >= 0 && z < ZANZ) {
                        reihe.push[s + SANZ * z];
                        s += dx;
                        z += dy;
                        if (reihe.length === 4) {
                            this.gr.push(reihe);
                            return;
                        }
                    }
                }
                berechneGRs(0, 1, s, z);
                berechneGRs(1, 1, s, z);
                berechneGRs(1, 0, s, z);
                berechneGRs(-1, 1, s, z);
            }
        }
        for (i = 0; i < SANZ * ZANZ; i++) {
            this.grs[i] = [];
            for (j = 0; j < this.gr.length; j++) {
                if ($.inArray(i, this.gr[j])) {
                    this.grs[i].push(j);
                }
            }
        }
    }
};
   