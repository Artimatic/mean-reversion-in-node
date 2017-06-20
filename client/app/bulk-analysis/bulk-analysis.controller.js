'use strict';
function BulkAnalysisController($http) {
    var vm = this,
        totalItems = 0;

    vm.bulkData = [];
    vm.actionableFilter = false;
    vm.waiting = 0;

    function backtestRequest(data) {
        $http.post('/api/mean-reversion/info', data, {}).then(function(response) {
            vm.bulkData.push(Object.assign({stock: data.ticker}, response.data));
            vm.waiting += 100/totalItems;
        }).catch(function(error) {
            vm.waiting += 100/totalItems;
            console.log('error', error);
        });
    }

    vm.read = function(workbook) {
        // console.log(workbook);
        // for (var sheetName in workbook.Sheets) {
        //   var jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        //   console.log(jsonData);
        // }
        totalItems = workbook.length;
        vm.waiting = 0;

        workbook.forEach(function(row){
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
       console.log('error',e);
   };

   vm.filter = function(item) {
       if(!vm.actionableFilter) {
           return true;
       }

       if(!item.actionable) {
           return false;
       }
       return true;
   };

   vm.setGraph = function(stock, difference) {
     vm.stock = stock;
     vm.difference = difference;
     console.log('set ticker to ', vm.stock);
   }
}

angular
    .module('pages.bulk-analysis')
    .controller('BulkAnalysisController', BulkAnalysisController);
