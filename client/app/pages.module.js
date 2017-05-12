'use strict';

angular
    .module('pages', [
        'pages.dashboard',
        'pages.bulk-analysis'
    ]);

require('./bulk-analysis/bulk-analysis.module');
require('./dashboard/dashboard.module');
