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
      link: link
  };

  return directive;

  function link(scope) {
    scope.backtestDate = new Date();
    scope.backtestStartDate = moment(scope.backtestDate).subtract(4, 'years').toDate();
    scope.datapoints=[];
    scope.datacolumns=[{'id':'price','type':'spline','name': 'Price', 'color': 'lightgrey'},
                    {'id':'buy','type':'scatter','name':'Buy Signal', 'color': '#0da445'},
                    {'id':'sell','type':'scatter','name':'Sell Signal', 'color': '#f56a6b'}];
    scope.datax={'id':'x'};
    scope.resolving = false;
    scope.performance = null;
    scope.recommendedDifference = 0;
    scope.prices = {lowerbound: 0, upperbound: 0};
    scope.trade = 'Neutral';
    scope.data = null;

    function calculatePercentDifference(v1, v2) {
        return Math.abs(Math.abs(v1-v2)/((v1+v2)/2));
    }

    function triggerCondition(lastPrice, thirtyDay, ninetyDay, deviation) {
        if(calculatePercentDifference(thirtyDay, ninetyDay) <= deviation) {
            return true;
        }
        return false;
    }

    scope.dateFn = function (x) {
        return moment(x).format('MM/DD');
    };

    scope.titleFormatFunction = function (x) {
        return moment(x).format('MM-DD-YYYY');
    };

    scope.tooltipContents = function (d) {
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
            body += '<tr><td>30 day MA: '+math.round(scope.data[value].thirtyAvg,2)+'</td></tr>';
            body += '<tr><td>90 day MA: '+math.round(scope.data[value].ninetyAvg,2)+'</td></tr>';
            body += '<tr><td>difference: '+math.round(scope.data[value].deviation,3)+'</td></tr>';
        }
        return '<table class="c3-tooltip">'+title+body+'</table>';
    };

    function runTest() {
        var requestBody = {
            ticker: scope.ticker,
            start: moment(scope.backtestStartDate).format('YYYY-MM-DD'),
            end: moment(scope.backtestDate).format('YYYY-MM-DD'),
            deviation: scope.difference
        };

        scope.resolving = true;
        scope.datapoints = [];

        $http({
          method: 'POST',
          url: '/api/mean-reversion/backtest',
          data: requestBody
        })
        .then((response) => {
            var data = response.data;
            scope.performance = data[data.length-1].totalReturn;
            scope.recommendedDifference = data[data.length-1].recommendedDifference;
            var day = null;

            for(var i = 0; i < data.length-1; i++) {
                day = data[i];
                if(triggerCondition(day.close, day.thirtyAvg, day.ninetyAvg, scope.difference)) {
                    if(day.trending === 'Sell') {
                        scope.datapoints.push({'x': moment(day.date).format('YYYY-MM-DD'), 'price': day.close, 'sell': day.close});
                    } else if(day.trending === 'Buy') {
                        scope.datapoints.push({'x': moment(day.date).format('YYYY-MM-DD'), 'price': day.close, 'buy': day.close});
                    } else {
                        scope.datapoints.push({'x': moment(day.date).format('YYYY-MM-DD'), 'price': day.close, 'data': day});
                    }
                } else {
                    scope.datapoints.push({'x': moment(day.date).format('YYYY-MM-DD'), 'price': day.close, 'data': day});
                }
            }
            scope.resolving = false;
        })
        .catch((error) => {
            scope.resolving = false;
            console.log(error);
        });
    }

    scope.$watch('ticker', function () {
      if(scope.ticker){
        runTest();
      }
    });
  }
}
