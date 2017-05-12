'use strict';

function config($stateProvider) {
    var dashboard = {
        name: 'home',
        url: '/home',
        template: require('./dashboard.html'),
        controller: 'BacktestController'
    };

    $stateProvider.state(dashboard);
}

angular.module('pages.dashboard')
    .config(config);
