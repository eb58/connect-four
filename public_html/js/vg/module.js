////////////////////////////////////////////////////////////////////////////////////////////////
var myModule = (function () {
    return {
        hello: function hello() {
            return 'Hello, world!';
        }
    };
}());
test('Module pattern', function () {
    equal(myModule.hello(), 'Hello, world!', 'Module works.');
});