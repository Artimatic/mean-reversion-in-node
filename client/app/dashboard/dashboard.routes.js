'use strict';

angular.module('pages.dashboard')
    .config(config);
  function config($stateProvider, $urlRouterProvider) {
        var dashboard = {
            name: 'home',
            url: '/home',
            template: require('./dashboard.html'),
            controller: 'BacktestController'
        };
        $urlRouterProvider.otherwise('/home');

        $stateProvider.state(dashboard);
  }
