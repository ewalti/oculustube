App.rootElement = '#ember-testing';

App.setupForTesting();
App.injectTestHelpers();

module('Layout');
test('has a title', function(){
  equal($('h1').text().trim(), "OculusTube");
});