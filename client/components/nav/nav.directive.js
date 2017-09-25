angular.module('components').directive('nav', nav);

function nav($http, $state, $timeout) {
  var directive = {
    restrict: 'E',
    template: require('./nav.html'),
    link: link
  };
  return directive;

  function link(scope) {
    $timeout(function() {
      switch ($state.current.name) {
        case 'bulk':
          scope.selectedIndex = 1;
          break;
        default:
          scope.selectedIndex = 0;
      }
    }, 100);
  }
}
