'use strict';

angular
    .module('pages', [
        'pages.dashboard',
        'pages.bulk-analysis'
    ]);

require('./dashboard/dashboard.module');
require('./bulk-analysis/bulk-analysis.module');
