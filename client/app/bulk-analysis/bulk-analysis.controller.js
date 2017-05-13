'use strict';
function BulkAnalysisController() {
    var vm = this;
    vm.read = function (workbook) {
        console.log('read', workbook);

        // console.log(workbook);
        // for (var sheetName in workbook.Sheets) {
        //   var jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        //   console.log(jsonData);
        // }
    };
    vm.error = function (e) {
       /* DO SOMETHING WHEN ERROR IS THROWN */
       console.log('error',e);
   };
}

angular
    .module('pages.bulk-analysis')
    .controller('BulkAnalysisController', BulkAnalysisController);
