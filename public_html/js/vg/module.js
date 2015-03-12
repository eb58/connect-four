////////////////////////////////////////////////////////////////////////////////////////////////
var myModule = (function () {
    return {
        hello: function hello() {
            return 'Hello, world!';
        },
        testForLoop: function testForLoop(){
            for( var i=0; i<5; i++){
                //console.log(i);
            }
            for( var i=5; i<10; i++){
                //console.log(i);
            }
            return 'testForLoop!';
        }
    };
}());
test('Module pattern', function () {
    equal(myModule.hello(),      'Hello, world!', 'hello works.');
    equal(myModule.testForLoop(), 'testForLoop!', 'testForloop works.');
});