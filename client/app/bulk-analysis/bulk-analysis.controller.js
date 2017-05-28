'use strict';
function BulkAnalysisController($http) {
    var vm = this;
    vm.bulkData = [];

    function backtestRequest(data) {
        $http.post('/api/mean-reversion/info', data, {}).then(function(response) {
            vm.bulkData.push(Object.assign({stock: data.ticker}, response.data));
        }).catch(function(error) {
            console.log('error', error);
        });
    }

    vm.read = function (workbook) {
        // console.log(workbook);
        // for (var sheetName in workbook.Sheets) {
        //   var jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        //   console.log(jsonData);
        // }
        workbook.forEach(function(row){
            let data = {
                'ticker': row.Stock,
                'end': row['End Date'] || moment().format('YYYY-MM-DD'),
                'start': row['Start Date'] || moment().subtract(3, 'years').format('YYYY-MM-DD'),
                'deviation': row.Difference || null
            };

            backtestRequest(data);

        });
    };

    vm.error = function (e) {
       console.log('error',e);
   };
}

angular
    .module('pages.bulk-analysis')
    .controller('BulkAnalysisController', BulkAnalysisController);
