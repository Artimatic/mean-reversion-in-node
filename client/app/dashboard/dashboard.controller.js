'use strict';
class BacktestController {
    constructor ($mdDialog, $http, $window, $q) {
        this.$mdDialog = $mdDialog;
        this.$http = $http;
        this.$window = $window;
        this.$q = $q;
        this.backtestDate = new Date();
        this.datapoints=[];
        this.datacolumns=[{'id':'price','type':'spline','name': 'Price', 'color': 'lightgrey'},
                            {'id':'buy','type':'scatter','name':'Buy Signal', 'color': '#0da445'},
                            {'id':'sell','type':'scatter','name':'Sell Signal', 'color': '#f56a6b'}];
        this.datax={'id':'x'};
        this.security = '';
        this.simulatedTrades = {};
        this.longPos = [];
        this.resolving = false;
        this.performance = null;
        this.acceptedDifference = 0.010;
        this.prices = {lowerbound: 0, upperbound: 0};
        this.trade = 'Neutral';
    }

    $onInit () {
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
    dateFn (x) {
        return moment(x).format('MM/DD');
    }
    titleFormatFunction (x) {
        return moment(x).format('MM-DD-YYYY');
    }
    tooltipContents (d) {
        let template = '<p>',
            title = '<h1>'+this.dateFn(d[0].x)+'</h1>';

        if(d[1].value) {
            template +
        }
        return '<p class="tooltip--left"><md-tooltip md-direction="left">'+title+'</md-tooltip></p>';

    }
    runTest () {
        if(!this.security){
            this.security = 'goog';
        }
        var requestBody = {
            ticker: this.security,
            start: moment(this.backtestDate).subtract(3, 'years').format('YYYY-MM-DD'),
            end: moment(this.backtestDate).format('YYYY-MM-DD'),
            deviation: this.acceptedDifference
        };
        this.resolving = true;
        this.$http({
          method: 'POST',
          url: '/api/mean-reversion/backtest',
          data: requestBody
        })
        .then((response) => {
            var data = response.data;
            this.datapoints = [];
            this.performance = data[data.length-1].totalReturn;
            var day = null;

            for(var i = 0; i < data.length; i++) {
                day = data[i];
                if(day.deviation < this.acceptedDifference) {
                    if(day.trending === 'downwards') {
                        this.datapoints.push({'x': moment(day.date).format('YYYY-MM-DD'), 'price': day.close, 'sell': day.close});
                    } else if(day.trending === 'upwards') {
                        this.datapoints.push({'x': moment(day.date).format('YYYY-MM-DD'), 'price': day.close, 'buy': day.close});
                    } else {
                        this.datapoints.push({'x': moment(day.date).format('YYYY-MM-DD'), 'price': day.close});
                    }
                } else {
                    this.datapoints.push({'x': moment(day.date).format('YYYY-MM-DD'), 'price': day.close});
                }
            }
            this.resolving = false;
        })
        .catch((error) => {
            this.resolving = false;
            console.log(error);
        });

        var pricingBody = {
            ticker: this.security,
            end: moment(this.backtestDate).format('YYYY-MM-DD'),
            deviation: this.acceptedDifference
        };

        this.prices = {};

        this.$http({
          method: 'POST',
          url: '/api/mean-reversion/pricing',
          data: pricingBody
        })
        .then((response) => {
            if(response.data.lower.price < 0) {
                this.prices.lowerbound = 0;
            } else {
                this.prices.lowerbound = response.data.lower.price;
            }

            if(response.data.upper.price < 0) {
                this.prices.upperbound = 0;
            } else {
                this.prices.upperbound = response.data.upper.price;

            }
        })
        .catch((error) => {
            console.log(error);
        });
    }
}

angular.module('pages.dashboard', ['ngMaterial', 'ngMdIcons'])
    .controller('BacktestController', BacktestController)
    .config(function($mdThemingProvider) {
        $mdThemingProvider.theme('altTheme')
        .primaryPalette('grey',{
        'default': '900'})
        .accentPalette('grey',{
        'default': '700'}).dark();

        $mdThemingProvider.theme('default').dark();

        $mdThemingProvider.setDefaultTheme('altTheme');
        $mdThemingProvider.alwaysWatchTheme(true);
    });

BacktestController.$inject = [
    '$mdDialog',
    '$http',
    '$window',
    '$q'
];
