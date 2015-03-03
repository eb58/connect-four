function qsort(arr, cmp) {
    if (arr.length <= 1) return arr;
    var pivot = arr[Math.floor(Math.random() * (arr.length))];
    var eq = arr.filter(function (n) { return cmp(n, pivot) === 0; });
    var lt = qsort(arr.filter(function (n) { return cmp(n, pivot) < 0; }), cmp);
    var gt = qsort(arr.filter(function (n) { return cmp(n, pivot) > 0; }), cmp);
    return [].concat(lt, eq, gt);
}

function testQsort1() {
    var arr = [99, 44, 55, 23, 11, 44, 66, 88, 45, 87, 10, 20, 30, 90, 70, 40, 55, 23, 11, 4];
    var sarr = qsort(arr, function (a, b) {
        return a - b;
    });
    console.log(sarr);
}

function testQsort2() {
    var arr = [{a: 99}, {a: 88}, {a: 10}, {a: 111}, {a: 37}];
    var sarr = qsort(arr, function (o1, o2) {
        return o1.a - o2.a;
    });
    console.log(sarr);
}

function testQsort3() {
    var cmp = function (a, b) {
        return (a - b);
    };
    var arr = [];
    for (var i = 0; i < 1000; i++) {
        arr.push(Math.floor(Math.random() * 1000));
    }
    console.log(qsort(arr, cmp));
    console.log(arr.sort(cmp));
}