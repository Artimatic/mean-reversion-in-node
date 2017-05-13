angular
    .module('components')
    .directive('xlsImport', xlsImport);

function xlsImport() {
    var directive = {
        link: link,
        scope: {
            handler: '&',
            error: '&'
        },
        template: require('./xls-import.html'),
        restrict: 'E'
    };
    return directive;

    function link(scope, element, attrs) {
      element.on('change', function (changeEvent) {
         scope.error()('error');
        var reader = new FileReader();

        reader.onload = function (evt) {
          scope.$apply(function () {
            var data = evt.target.result;

            var workbook = XLSX.read(data, {type: 'binary'});

            var headerNames = XLSX.utils.sheet_to_json( workbook.Sheets[workbook.SheetNames[0]], { header: 1 })[0];

            var data = XLSX.utils.sheet_to_json( workbook.Sheets[workbook.SheetNames[0]]);

            scope.handler()(data);

            element.val(null);
          });
        };

        reader.readAsBinaryString(changeEvent.target.files[0]);
      });
    }
}
