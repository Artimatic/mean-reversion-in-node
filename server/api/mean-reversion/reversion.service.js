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

    runBacktest(security, currentTime, startDate) {
        var endDate = moment(currentTime).format();
        var start = moment(startDate).subtract(200, 'days').format();

        return QuoteService.getData(security, start, endDate)
                .then(data =>{
                    return this.calculateForBacktest(data,this.getDecisionData);
                })
                .then(data =>{
                    return data;
                })
                .then(data => data)
                .catch(err => {
                    console.log(err);
                    throw err;
                });
    }

    //90 days, +90 days for earliest moving average
    calculateForBacktest(historicalData, fn) {
        var dec = historicalData.reduce(function(accumulator, value, idx){
            if(idx >= 90) {
                var decision = fn(historicalData, idx, idx - 90);
                accumulator.push(decision);
            }
            return accumulator;
        },[]);
        return dec;
    }

    getDecisionData (historicalData, startIdx, dataStartIdx) {
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
                break;
            }
            return accumulator;
        }, {
            thirtyAvg: null,
            ninetyAvg: null,
            total: 0,
            totalLength: historicalData.length,
            trending: trend
        });
    }
}

module.exports = new ReversionService();
