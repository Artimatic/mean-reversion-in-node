function percentageFilter($filter) {
  return function (input, decimals) {
    return $filter('number')(input * 100, decimals) + '%';
  };
}

angular.module('pages.dashboard')
    .filter('percentage', ['$filter', percentageFilter]);
