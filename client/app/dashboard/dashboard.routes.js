'use strict';

angular.module('pages.dashboard')
    .config(config);

  function config($stateProvider) {
        var dashboard = {
            name: 'dashboard',
            url: '/dashboard',
            template: require('./dashboard.html'),
            controller: 'BacktestController'
        };

        $stateProvider.state(dashboard);
  }
