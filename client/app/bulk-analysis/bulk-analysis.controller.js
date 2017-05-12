'use strict';
function BulkAnalysisController() {
    var vm = this;
    vm.read = function (workbook) {
        /* DO SOMETHING WITH workbook HERE */
        console.log(workbook);
        for (var sheetName in workbook.Sheets) {
          var jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
          console.log(jsonData);
        }
    };
    vm.error = function (e) {
       /* DO SOMETHING WHEN ERROR IS THROWN */
       console.log(e);
   };
}

angular
    .module('pages.bulk-analysis')
    .controller('BulkAnalysisController', BulkAnalysisController);

BulkAnalysisController.$inject = [
    '$http'
];
