/*funktion mergesort(liste);
 falls (Größe von liste <= 1) dann antworte liste
 sonst
 halbiere die liste in linkeListe, rechteListe
 linkeListe = mergesort(linkeListe)
 rechteListe = mergesort(rechteListe)
 antworte merge(linkeListe, rechteListe)
 
 funktion merge(linkeListe, rechteListe);
 neueListe
 solange (linkeListe und rechteListe nicht leer)
 |    falls (erstes Element der linkeListe <= erstes Element der rechteListe)
 |    dann füge erstes Element linkeListe in die neueListe hinten ein und entferne es aus linkeListe
 |    sonst füge erstes Element rechteListe in die neueListe hinten ein und entferne es aus rechteListe
 solange_ende
 solange (linkeListe nicht leer)
 |    füge erstes Element linkeListe in die neueListe hinten ein und entferne es aus linkeListe
 solange_ende
 solange (rechteListe nicht leer)
 |    füge erstes Element rechteListe in die neueListe hinten ein und entferne es aus rechteListe
 solange_ende
 antworte neueListe
 def merge(l: List[A], r: List[A], acc: List[A] = Nil): List[A] = (l, r) match {
 case (Nil, Nil)           => acc
 case (Nil, h :: t)        => merge(Nil, t, h :: acc)
 case (h :: t, Nil)        => merge(t, Nil, h :: acc)
 case (lh :: lt, rh :: rt) =>
 if(ord.lt(lh, rh)) merge(lt, r, lh :: acc)
 else               merge(l, rt, rh :: acc)
 }
 */
function merge(l, r) {
   if (l.length === 0) return r;
   if (r.length === 0) return l;
   var list = (l[0] < r[0] ? l : r);
   var x = list.shift();
   return [].concat(x, merge(l, r));
}

function mergesort(arr) {
   if (arr.length <= 1) return arr;
   var n = Math.floor(arr.length / 2);
   return merge(mergesort(arr.slice(0, n)), mergesort(arr.slice(n)));
}

mergesort([3, 6, 2, 9, 1, 0, 99]);