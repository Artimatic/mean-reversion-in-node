'use strict';

angular
    .module('main', [
        'ui.router',
        'gridshore.c3js.chart',
        'ngMaterial',
        'angular-js-xlsx',
        'pages',
        'components'
    ]);

require('./../components/components.module');
require('./pages.module');
require('./app');
