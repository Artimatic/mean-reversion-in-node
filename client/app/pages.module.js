'use strict';

angular
    .module('pages', [
        'pages.analytics',
        'pages.dashboard'
    ]);

require('./analytics/analytics.module');
