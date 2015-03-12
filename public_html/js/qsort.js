


function qsort(arr, cmp) {
    if (arr.length <= 1) return arr;
    var pivot = arr[Math.floor(Math.random() * arr.length)];
    var eq = arr.filter(function (n) {
        return cmp(n, pivot) === 0;
    });
    var lt = qsort(arr.filter(function (n) {
        return cmp(n, pivot) < 0;
    }), cmp);
    var gt = qsort(arr.filter(function (n) {
        return cmp(n, pivot) > 0;
    }), cmp);
    return [].concat(lt, eq, gt);
}

////////////////////////////////////////
// Examples and Tests
////////////////////////////////////////

function cmpNum(a, b) {
    return (a - b);
}
;
function testQsort1() {
    var arr = [99, 44, 55, 23, 11, 44, 66, 88, 45, 87, 10, 20, 30, 90, 70, 40, 55, 23, 11, 4];
    var sarr = qsort(arr, cmpNum);
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
    var arr = [];
    for (var i = 0; i < 1000; i++) {
        arr.push(Math.floor(Math.random() * 1000));
    }
    console.log(qsort(arr, cmpNum));
    console.log(arr.sort(cmpNum));
}

function setFilterParam() {
    filterId = -1;
    filterItem = document.getElementsByName("filterId")[0];
    if (filterItem != null) {
        filterItem.value = "";
    }
    filterTextItems = document.getElementsByName("filterText");
    if (filterTextItems != null) {
        n = filterTextItems.length;
        for (var i = 0; i < n; i++) {
            filPattern = filterTextItems[i];
            if (filPattern != null) {
                fil = document.getElementsByName("filter_" + filPattern.id)[0];
                sValue = filPattern.value;
                if (filPattern.id == "Priority") {
                    fil1 = document.getElementsByName("filter_Specialcase")[0];
                    filll = document.getElementsByName("filter_ProblemOrder")[0];
                    filterIsPrg = document.getElementsByName("filter_IsPrg")[0];
                    filterAS = document.getElementsByName("filter_AmendmentStatus")[0];
                    if (sValue.length > 0) {
                        if (sValue.indexOf("!") != -1) {
                            fil.value = 1;
                        }
                        else {
                            fil.value = "";
                        }
                        if (sValue.indexOf("*") != -1) {
                            if (fil1 != null)
                                fil1.value = 1;
                        }
                        else {
                            if (fil1 != null)
                                fil1.value = "";
                        }
                        if (sValue.toUpperCase().indexOf("P") != -1) {
                            if (filll != null)
                                filll.value = 1;
                        }
                        else {
                            if (filll != null)
                                filll.value = "";
                        }

                        if (sValue.toUpperCase().indexOf("G") != -1) {
                            if (filterIsPrg != null)
                                filterIsPrg.value = 1;
                        }
                        else {
                            if (filterIsPrg != null)
                                filterIsPrg.value = "";
                        }
                        if (sValue.toUpperCase().indexOf("K") != -1) {
                            if (filterAS != null)
                                filterAS.value = 1;
                        }
                        else {
                            if (filterAS != null)
                                filterAS.value = "";
                        }
                    }
                    else {
                        fil.value = "";
                        if (fil1 != null)
                            fil1.value = "";
                        if (filll != null)
                            filll.value = "";
                        if (filterIsPrg != null)
                            filterIsPrg.value = "";
                    }
                }
                else {
                    if (fil != null) {
                        fil.value = sValue;
                    }
                }
            }
        }
    }
    return true;
}