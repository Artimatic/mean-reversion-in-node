angular
    .module('components')
    .directive('backtestGraph', backtestGraph);

function backtestGraph($http) {
    var directive = {
        restrict: 'E',
        template: require('./backtest-graph.html'),
        scope: {
            ticker: '=',
            difference: '='
        },
        link: link,
        controller: BacktestGraphController,
        controllerAs: 'vm',
        bindToController: true
    };

  return directive;

  function link(scope) {

      function calculatePercentDifference(v1, v2) {
          return Math.abs(Math.abs(v1-v2)/((v1+v2)/2));
      }

      function triggerCondition(lastPrice, thirtyDay, ninetyDay, deviation) {
          if(calculatePercentDifference(thirtyDay, ninetyDay) <= deviation) {
              return true;
          }
          return false;
      }

      function runTest() {
          var requestBody = {
              ticker: scope.vm.ticker,
              start: moment(scope.vm.backtestStartDate).format('YYYY-MM-DD'),
              end: moment(scope.vm.backtestDate).format('YYYY-MM-DD'),
              deviation: scope.vm.difference
          };

          scope.vm.resolving = true;
          scope.vm.datapoints = [];

          $http({
            method: 'POST',
            url: '/api/mean-reversion/backtest',
            data: requestBody
          })
          .then((response) => {
              var data = response.data;
              scope.vm.performance = data[data.length-1].totalReturn;
              scope.vm.recommendedDifference = data[data.length-1].recommendedDifference;
              var day = null;

              for(var i = 0; i < data.length-1; i++) {
                  day = data[i];
                  if(triggerCondition(day.close, day.thirtyAvg, day.ninetyAvg, scope.vm.difference)) {
                      if(day.trending === 'Sell') {
                          scope.vm.datapoints.push({'x': moment(day.date).format('YYYY-MM-DD'), 'price': day.close, 'sell': day.close});
                      } else if(day.trending === 'Buy') {
                          scope.vm.datapoints.push({'x': moment(day.date).format('YYYY-MM-DD'), 'price': day.close, 'buy': day.close});
                      } else {
                          scope.vm.datapoints.push({'x': moment(day.date).format('YYYY-MM-DD'), 'price': day.close, 'data': day});
                      }
                  } else {
                      scope.vm.datapoints.push({'x': moment(day.date).format('YYYY-MM-DD'), 'price': day.close, 'data': day});
                  }
              }
              scope.vm.data = data;
              scope.vm.resolving = false;
          })
          .catch((error) => {
              scope.vm.resolving = false;
              console.log(error);
          });
      }

      scope.$watch('vm.ticker', function () {
        if(scope.vm.ticker){
          runTest();
        }
      });
  }
}

BacktestGraphController.$inject = ['$scope'];

function BacktestGraphController($scope) {
    var vm = this;
    vm.backtestDate = new Date();
    vm.backtestStartDate = moment(vm.backtestDate).subtract(4, 'years').toDate();
    vm.datapoints=[];
    vm.datacolumns=[{'id':'price','type':'spline','name': 'Price', 'color': 'lightgrey'},
                    {'id':'buy','type':'scatter','name':'Buy Signal', 'color': '#0da445'},
                    {'id':'sell','type':'scatter','name':'Sell Signal', 'color': '#f56a6b'}];
    vm.datax={'id':'x'};
    vm.resolving = false;
    vm.performance = null;
    vm.recommendedDifference = 0;
    vm.prices = {lowerbound: 0, upperbound: 0};
    vm.trade = 'Neutral';
    vm.data = null;

    vm.dateFunc = function (x) {
        return moment(x).format('MM');
    };

    vm.titleFormat = function (x) {
        return moment(x).format('MM-DD-YYYY');
    };

    vm.tooltip = function (d) {
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
}
