'use strict';

function BulkAnalysisController($http) {
  var vm          = this,
      totalItems  = 0;
  vm.bulkData = [];
  vm.actionableFilter = false;
  vm.waiting = 0;
  vm.filterOptions = {
    actionable: true,
    sell: true,
    buy: true,
    indeterminant: false
  };

  function backtestRequest(data) {
    $http.post('/api/mean-reversion/info', data, {})
        .then(function(response) {
          vm.bulkData.push(Object.assign({
            stock: data.ticker
          }, response.data));
          vm.waiting += 100 / totalItems;
        })
        .catch(function(error) {
          vm.waiting += 100 / totalItems;
          console.log('error', error);
        });
  }

  vm.read = function(workbook) {
    totalItems = workbook.length;
    vm.waiting = 0;
    workbook.forEach(function(row) {
      let data = {
        'ticker': row.Stock,
        'end': row['End Date'] || moment().format('YYYY-MM-DD'),
        'start': row['Start Date'] || moment().subtract(4, 'years').format('YYYY-MM-DD'),
        'deviation': row.Difference || null
      };
      backtestRequest(data);
    });
  };

  vm.error = function(e) {
    console.log('error', e);
  };

  vm.filter = function(item) {
    if (vm.filterOptions.actionable && !item.actionable) {
      return false;
    }
    if (vm.filterOptions.buy && angular.lowercase(item.trending) !== 'buy') {
      return false;
    }
    if (vm.filterOptions.sell && angular.lowercase(item.trending) !== 'sell') {
      return false;
    }
    if (vm.filterOptions.indeterminant && angular.lowercase(item.trending) !== 'indeterminant') {
      return false;
    }
    return true;
  };

  vm.setGraph = function(stock, difference) {
    vm.stock = stock;
    vm.difference = difference;
  };
}
angular.module('pages.bulk-analysis').controller('BulkAnalysisController', BulkAnalysisController);
