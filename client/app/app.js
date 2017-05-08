'use strict';

angular.module('main', [
  'ui.router',
])
  .config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
    $urlRouterProvider.otherwise('/home');

    $locationProvider.html5Mode(true);
});
