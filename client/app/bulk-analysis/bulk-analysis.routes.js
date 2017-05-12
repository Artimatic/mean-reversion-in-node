'use strict';

function config($stateProvider) {
        var state = {
            name: 'bulk',
            url: '/bulk',
            template: require('./bulk-analysis.html'),
            controller: 'BulkAnalysisController'
        };

        $stateProvider.state(state);
}

angular.module('pages.bulk-analysis')
    .config(config);
