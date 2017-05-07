'use strict';
const _ = require('lodash');
const moment = require('moment');
const assert = require('assert');

const errors = require('../../components/errors/baseErrors');
const QuoteService = require('./../quote/quote.service.js');

class ReversionService {
    getData(security, currentTime) {
        var endDate = moment(currentTime).format();
        var startDate = moment(currentTime).subtract(200, 'days').format();

        return QuoteService.getData(security, startDate, endDate)
            .then(this.getDecisionData)
            .then(data => data)
            .catch(err => err);
    }

    runBacktest(security, currentTime, startDate, deviation) {
        var endDate     = moment(currentTime).format(),
            start       = moment(startDate).subtract(140, 'days').format();

        deviation = parseFloat(deviation);

        if(isNaN(deviation)) {
            throw errors.InvalidArgumentsError();
        }

        return QuoteService.getData(security, start, endDate)
                .then(data =>{
                    return this.calculateForBacktest(data, this.getDecisionData);
                })
                .then(decisions =>{
                    return this.getReturns(decisions, deviation, startDate);
                })
                .then(data => data)
                .catch(err => {
                    console.log('Error ',err);
                    throw errors.InvalidArgumentsError();
                });
    }

    //90 days, +90 days for earliest moving average
    calculateForBacktest(historicalData, fn) {
        return historicalData.reduce(function(accumulator, value, idx){
            if(idx >= 90) {
                var decision = fn(historicalData, idx, idx - 90);
                accumulator.push(decision);
            }
            return accumulator;
        },[]);
    }

    getReturns(decisions, deviation, startDate) {
        var results = decisions.reduce(function(orders, day) {
            if(moment(day.date).isAfter(moment(startDate).subtract(1,'day').format())) {
                if(Math.abs(((day.thirtyAvg/day.ninetyAvg) - 1)) < deviation) {
                    if(day.trending === 'downwards'){
                        //Sell
                        if(orders.buy.length > 0) {
                            var holding = orders.buy.shift();
                            console.log(day.date,' sell at ', day.close, ' bought at ', holding)
                            orders.returns += day.close - holding;
                        }
                    } else if(day.trending === 'upwards'){
                        //Buy
                        orders.buy.push(day.close);
                    }
                }
            }
            return orders;
        }, {buy:[], returns:0});

        decisions.push({totalReturn: results.returns});
        return decisions;
    }

    getDecisionData(historicalData, startIdx, dataStartIdx) {
        var trend,
            trends = {
                down:  'downwards',
                up: 'upwards',
                indet: 'indeterminant'
            };

        trend = trends.down;

        if(startIdx === undefined) {
            startIdx = historicalData.length-1;
        }

        if(dataStartIdx === undefined) {
            dataStartIdx = 0;
        }
        //Trend for last four days
        if((historicalData[startIdx].close>historicalData[startIdx-1].close) &&
            (historicalData[startIdx-1].close>historicalData[startIdx-2].close)) {
            trend = trends.up;
        } else if((historicalData[startIdx].close<historicalData[startIdx-1].close) &&
            (historicalData[startIdx-1].close<historicalData[startIdx-2].close)) {
                trend = trends.down;
        }
        var data = historicalData.slice(dataStartIdx, startIdx)

        return data.reduceRight((accumulator, currentValue, currentIdx) => {
            accumulator.total += currentValue.close;

            switch (currentIdx) {
                case data.length - 30:
                    accumulator.thirtyAvg = accumulator.total/30;
                break;
                case data.length - 90:
                    accumulator.ninetyAvg = accumulator.total/90;
                if(accumulator.thirtyAvg > accumulator.ninetyAvg && trend === trends.up) {
                    trend = trends.up;
                } else if(accumulator.thirtyAvg < accumulator.ninetyAvg && trend === trends.up) {
                    trend = trends.down;
                } else if(accumulator.thirtyAvg < accumulator.ninetyAvg && trend === trends.down) {
                    trend = trends.indet;
                } else if(accumulator.thirtyAvg > accumulator.ninetyAvg && trend === trends.down) {
                    trend = trends.up;
                }
                accumulator.deviation = Math.abs(((accumulator.thirtyAvg/accumulator.ninetyAvg)-1));
                break;
            }
            return accumulator;
        }, {
            date: data[data.length-1].date,
            trending: trend,
            deviation: null,
            thirtyAvg: null,
            ninetyAvg: null,
            close: data[data.length-1].close,
            total: 0
        });
    }
}

module.exports = new ReversionService();
