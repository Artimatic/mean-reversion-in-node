'use strict';

angular
    .module('main', [
        'ui.router',
        'gridshore.c3js.chart',
        'ngMaterial',
        'ngMdIcons',
        'pages',
        'components'
    ]);

require('./../components/components.module');
require('./pages.module');
