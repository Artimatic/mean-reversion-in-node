'use strict';
class BacktestController {
    constructor($mdDialog, $http, $window, $q) {
        this.$mdDialog = $mdDialog;
        this.$http = $http;
        this.$window = $window;
        this.$q = $q;
        this.backtestDate = new Date();
        this.datapoints=[];
        this.datacolumns=[{'id':'price','type':'spline','name': 'Price', 'color': 'lightgrey'},
                            {'id':'buy','type':'scatter','name':'Buy Signal', 'color': 'green'},
                            {'id':'sell','type':'scatter','name':'Sell Signal', 'color': 'red'}];
        this.datax={'id':'x'};
        this.security = '';
        this.simulatedTrades = {};
        this.longPos = [];
        this.resolving = false;
    }

    $onInit() {
        this.menu = [{
          link: '',
          title: 'Dashboard',
          icon: 'dashboard'
        }, {
          link: '',
          title: 'Friends',
          icon: 'group'
        }, {
          link: '',
          title: 'Messages',
          icon: 'message'
        }];
        this.admin = [{
          link: '',
          title: 'Trash',
          icon: 'delete'
        }, {
          link: 'showListBottomSheet($event)',
          title: 'Settings',
          icon: 'settings'
        }];
        this.activity = [{
          what: 'Nothing here',
          who: 'Placeholder',
          when: '3:08PM',
          notes: ' I\'ll be in your neighborhood doing errands'
        }];
        this.alert = '';
        this.showListBottomSheet = function($event) {
          this.alert = '';
          this.$mdBottomSheet.show({
            template: '<md-bottom-sheet class="md-list md-has-header"> <md-subheader>Settings</md-subheader> <md-list> <md-item ng-repeat="item in items"><md-item-content md-ink-ripple flex class="inset"> <a flex aria-label="{{item.name}}" ng-click="listItemClick($index)"> <span class="md-inline-list-icon-label">{{ item.name }}</span> </a></md-item-content> </md-item> </md-list></md-bottom-sheet>',
            controller: 'ListBottomSheetCtrl',
            targetEvent: $event
          }).then(function(clickedItem) {
            this.alert = clickedItem.name + ' clicked!';
          });
        };
    }

    runTradingAlg(http, security, date, record) {
        var requestBody = {
            ticker: security,
            end: date
        };

        return http({
          method: 'POST',
          url: '/api/mean-reversion',
          data: requestBody
        })
        .then((response) => {
            if(Math.abs(((response.data.thirtyAvg/response.data.ninetyAvg)-1))<0.015) {
                if(response.data.trending === 'downwards'){
                    record[date] = 'sell';
                } else if(response.data.trending === 'upwards'){
                    record[date] = 'buy';
                }
            }
        })
        .catch((error) => {
            console.err(error);
        });
    }

    processResults(quotes) {
        var moment = this.$window.moment,
            record = this.simulatedTrades,
            tradingFn = this.runTradingAlg,
            http = this.$http,
            long = this.longPos;

        var promises = quotes.map(function(value) {
            long.push({'date': moment(value.date).format('YYYY-MM-DD'), 'price': value.close});
            return tradingFn(http, value.symbol, moment(value.date).format('YYYY-MM-DD'), record);
        });

        return this.$q.all(promises);
    }

    runTest() {
        this.simulatedTrades = {};
        this.longPos = [];
        this.dataPoints = [];
        if(!this.security){
            this.security = 'goog';
        }
        var requestBody = {
            ticker: this.security,
            start: this.$window.moment(this.backtestDate).subtract(90, 'days').format('YYYY-MM-DD'),
            end: this.$window.moment(this.backtestDate).format('YYYY-MM-DD')
        };
        this.resolving = true;
        this.$http({
          method: 'POST',
          url: '/api/quote',
          data: requestBody
        })
        .then((response) => {
            this.datapoints = [];
            return response.data;
        })
        .then((data) => {
            return this.processResults(data);
        })
        .then(() => {
            var ctr = 0;
            this.longPos.forEach((value) => {
                if(this.simulatedTrades[value.date]) {
                    if(this.simulatedTrades[value.date] === 'buy'){
                        this.datapoints.push({'x': value.date, 'price': value.price, 'buy': value.price});
                    } else {
                        this.datapoints.push({'x': value.date, 'price': value.price, 'sell': value.price});
                    }
                    ctr++;
                } else {
                    this.datapoints.push({'x': value.date, 'price': value.price});
                }
            });
            this.resolving = false;
        })
        .catch((error) => {
            this.resolving = false;
            console.log(error);
        });
    }
}

angular.module('pages.dashboard', ['ngMaterial', 'ngMdIcons'])
    .controller('BacktestController', BacktestController)
    .directive('userAvatar', function() {
      return {
        replace: true,
        template: '<svg class="user-avatar" viewBox="0 0 128 128" height="64" width="64" pointer-events="none" display="block" > <path fill="#FF8A80" d="M0 0h128v128H0z"/> <path fill="#FFE0B2" d="M36.3 94.8c6.4 7.3 16.2 12.1 27.3 12.4 10.7-.3 20.3-4.7 26.7-11.6l.2.1c-17-13.3-12.9-23.4-8.5-28.6 1.3-1.2 2.8-2.5 4.4-3.9l13.1-11c1.5-1.2 2.6-3 2.9-5.1.6-4.4-2.5-8.4-6.9-9.1-1.5-.2-3 0-4.3.6-.3-1.3-.4-2.7-1.6-3.5-1.4-.9-2.8-1.7-4.2-2.5-7.1-3.9-14.9-6.6-23-7.9-5.4-.9-11-1.2-16.1.7-3.3 1.2-6.1 3.2-8.7 5.6-1.3 1.2-2.5 2.4-3.7 3.7l-1.8 1.9c-.3.3-.5.6-.8.8-.1.1-.2 0-.4.2.1.2.1.5.1.6-1-.3-2.1-.4-3.2-.2-4.4.6-7.5 4.7-6.9 9.1.3 2.1 1.3 3.8 2.8 5.1l11 9.3c1.8 1.5 3.3 3.8 4.6 5.7 1.5 2.3 2.8 4.9 3.5 7.6 1.7 6.8-.8 13.4-5.4 18.4-.5.6-1.1 1-1.4 1.7-.2.6-.4 1.3-.6 2-.4 1.5-.5 3.1-.3 4.6.4 3.1 1.8 6.1 4.1 8.2 3.3 3 8 4 12.4 4.5 5.2.6 10.5.7 15.7.2 4.5-.4 9.1-1.2 13-3.4 5.6-3.1 9.6-8.9 10.5-15.2M76.4 46c.9 0 1.6.7 1.6 1.6 0 .9-.7 1.6-1.6 1.6-.9 0-1.6-.7-1.6-1.6-.1-.9.7-1.6 1.6-1.6zm-25.7 0c.9 0 1.6.7 1.6 1.6 0 .9-.7 1.6-1.6 1.6-.9 0-1.6-.7-1.6-1.6-.1-.9.7-1.6 1.6-1.6z"/> <path fill="#E0F7FA" d="M105.3 106.1c-.9-1.3-1.3-1.9-1.3-1.9l-.2-.3c-.6-.9-1.2-1.7-1.9-2.4-3.2-3.5-7.3-5.4-11.4-5.7 0 0 .1 0 .1.1l-.2-.1c-6.4 6.9-16 11.3-26.7 11.6-11.2-.3-21.1-5.1-27.5-12.6-.1.2-.2.4-.2.5-3.1.9-6 2.7-8.4 5.4l-.2.2s-.5.6-1.5 1.7c-.9 1.1-2.2 2.6-3.7 4.5-3.1 3.9-7.2 9.5-11.7 16.6-.9 1.4-1.7 2.8-2.6 4.3h109.6c-3.4-7.1-6.5-12.8-8.9-16.9-1.5-2.2-2.6-3.8-3.3-5z"/> <circle fill="#444" cx="76.3" cy="47.5" r="2"/> <circle fill="#444" cx="50.7" cy="47.6" r="2"/> <path fill="#444" d="M48.1 27.4c4.5 5.9 15.5 12.1 42.4 8.4-2.2-6.9-6.8-12.6-12.6-16.4C95.1 20.9 92 10 92 10c-1.4 5.5-11.1 4.4-11.1 4.4H62.1c-1.7-.1-3.4 0-5.2.3-12.8 1.8-22.6 11.1-25.7 22.9 10.6-1.9 15.3-7.6 16.9-10.2z"/> </svg>'
      };
    }).config(function($mdThemingProvider) {
      var customBlueMap = $mdThemingProvider.extendPalette('light-blue', {
        'contrastDefaultColor': 'light',
        'contrastDarkColors': ['50'],
        '50': 'ffffff'
      });
      $mdThemingProvider.definePalette('customBlue', customBlueMap);
      $mdThemingProvider.theme('default').primaryPalette('customBlue', {
        'default': '500',
        'hue-1': '50'
      }).accentPalette('pink');
      $mdThemingProvider.theme('input', 'default').primaryPalette('grey');
    });

BacktestController.$inject = [
    '$mdDialog',
    '$http',
    '$window',
    '$q'
];
