function backtestGraph() {
    var directive = {
        link: link,
        scope: {
            handler: '&',
            error: '&'
        },
        template: require('./backtest-graph.html'),
        restrict: 'E'
    };
    return directive;

    function link(scope, element, attrs) {

    }
}
angular
    .module('components')
    .directive('backtestGraph', backtestGraph);
