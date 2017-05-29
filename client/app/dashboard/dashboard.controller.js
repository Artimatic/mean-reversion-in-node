'use strict';
function BacktestController ($http) {
    var vm = this;
    vm.backtestDate = new Date();
    vm.backtestStartDate = moment(vm.backtestDate).subtract(4, 'years').toDate();
    vm.datapoints=[];
    vm.datacolumns=[{'id':'price','type':'spline','name': 'Price', 'color': 'lightgrey'},
                    {'id':'buy','type':'scatter','name':'Buy Signal', 'color': '#0da445'},
                    {'id':'sell','type':'scatter','name':'Sell Signal', 'color': '#f56a6b'}];
    vm.datax={'id':'x'};
    vm.security = '';
    vm.simulatedTrades = {};
    vm.longPos = [];
    vm.resolving = false;
    vm.performance = null;
    vm.acceptedDifference = 0.010;
    vm.recommendedDifference = 0;
    vm.prices = {lowerbound: 0, upperbound: 0};
    vm.trade = 'Neutral';
    vm.data = null;

    function calculatePercentDifference(v1, v2) {
        return Math.abs(Math.abs(v1-v2)/((v1+v2)/2));
    }

    function triggerCondition(lastPrice, thirtyDay, ninetyDay, deviation) {
        if(calculatePercentDifference(thirtyDay, ninetyDay) <= deviation) {
            return true;
        }
        return false;
    }

    vm.dateFn = function (x) {
        return moment(x).format('MM/DD');
    };
    vm.titleFormatFunction = function (x) {
        return moment(x).format('MM-DD-YYYY');
    };
    vm.tooltipContents = function (d) {
        let title = '<tr><th>'+moment(d[0].x).format('MM-DD-YYYY')+'</th></tr>',
            body = '<tr><td>',
            value = d[0].index;

        if(d[1].value) {
            body += 'buy: ';
        } else if(d[2].value) {
            body += 'sell: ';
        } else {
            body += 'price: ';
        }
        body += math.round(d[0].value,2)+'</td></tr>';
        if(value) {
            body += '<tr><td>30 day MA: '+math.round(vm.data[value].thirtyAvg,2)+'</td></tr>';
            body += '<tr><td>90 day MA: '+math.round(vm.data[value].ninetyAvg,2)+'</td></tr>';
            body += '<tr><td>difference: '+math.round(vm.data[value].deviation,3)+'</td></tr>';
        }
        return '<table class="c3-tooltip">'+title+body+'</table>';

    };
    vm.runTest = function() {
        if(!vm.security){
            vm.security = 'goog';
        }
        var requestBody = {
            ticker: vm.security,
            start: moment(vm.backtestStartDate).format('YYYY-MM-DD'),
            end: moment(vm.backtestDate).format('YYYY-MM-DD'),
            deviation: vm.acceptedDifference
        };

        vm.resolving = true;
        $http({
          method: 'POST',
          url: '/api/mean-reversion/backtest',
          data: requestBody
        })
        .then((response) => {
            var data = response.data;
            vm.datapoints = [];
            vm.performance = data[data.length-1].totalReturn;
            vm.recommendedDifference = data[data.length-1].recommendedDifference;
            var day = null;

            for(var i = 0; i < data.length-1; i++) {
                day = data[i];
                if(triggerCondition(day.close, day.thirtyAvg, day.ninetyAvg, vm.acceptedDifference)) {
                    if(day.trending === 'Sell') {
                        vm.datapoints.push({'x': moment(day.date).format('YYYY-MM-DD'), 'price': day.close, 'sell': day.close});
                    } else if(day.trending === 'Buy') {
                        vm.datapoints.push({'x': moment(day.date).format('YYYY-MM-DD'), 'price': day.close, 'buy': day.close});
                    } else {
                        vm.datapoints.push({'x': moment(day.date).format('YYYY-MM-DD'), 'price': day.close, 'data': day});
                    }
                } else {
                    vm.datapoints.push({'x': moment(day.date).format('YYYY-MM-DD'), 'price': day.close, 'data': day});
                }
            }
            vm.data = data;
            vm.resolving = false;
        })
        .catch((error) => {
            vm.resolving = false;
            console.log(error);
        });

        var pricingBody = {
            ticker: vm.security,
            end: moment(vm.backtestDate).format('YYYY-MM-DD'),
            deviation: vm.acceptedDifference
        };

        vm.prices = {};

        $http({
          method: 'POST',
          url: '/api/mean-reversion/pricing',
          data: pricingBody
        })
        .then((response) => {
            if(response.data.lower.price < 0) {
                vm.prices.lowerbound = 0;
            } else {
                vm.prices.lowerbound = response.data.lower.price;
            }

            if(response.data.upper.price < 0) {
                vm.prices.upperbound = 0;
            } else {
                vm.prices.upperbound = response.data.upper.price;
            }
            if(response.data.lower.trend === 'Sell' && response.data.upper.trend === 'Sell') {
                vm.trade = 'Sell';
            } else if(response.data.lower.trend === 'Buy' && response.data.upper.trend === 'Buy') {
                vm.trade = 'Buy';
            } else {
                vm.trade = 'Neutral';
            }
        })
        .catch((error) => {
            console.log(error);
        });
    };
}

angular
    .module('pages.dashboard')
    .controller('BacktestController', BacktestController)
    .config(function($mdThemingProvider) {
        $mdThemingProvider.theme('altTheme')
        .primaryPalette('grey',{
        'default': '900'})
        .accentPalette('grey',{
        'default': '700'}).dark();

        $mdThemingProvider.theme('default').dark();

        $mdThemingProvider.setDefaultTheme('altTheme');
        $mdThemingProvider.alwaysWatchTheme(true);
    });

BacktestController.$inject = [
    '$http'
];
