'use strict';
function config($urlRouterProvider) {
        $urlRouterProvider.otherwise('/home');
}
angular
    .module('main')
    .config(config);
