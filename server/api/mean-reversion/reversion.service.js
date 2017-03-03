'use strict';
const _ = require('lodash');
const moment = require('moment');

const errors = require('../../components/errors/baseErrors');
const QuoteService = require('./../quote/quote.service.js');

class ReversionService {
    getData(security, currentTime) {
        var endDate = moment(currentTime).format();
        var startDate = moment(currentTime).subtract(200, 'days').format();

        return QuoteService.getData(security, startDate, endDate)
            .then(this.calculateMovingAvg)
            .then(data => data)
            .catch(err => err);
    }

    calculateMovingAvg (historicalData) {
        var trend = 'indeterminant';
        //Trend for last four days
        if((historicalData[historicalData.length-1].close>historicalData[historicalData.length-2].close) &&
            (historicalData[historicalData.length-2].close>historicalData[historicalData.length-3].close)) {
            trend = 'upwards';
        } else if((historicalData[historicalData.length-1].close<historicalData[historicalData.length-2].close) &&
            (historicalData[historicalData.length-2].close<historicalData[historicalData.length-3].close)) {
                trend = 'downwards';
        }

        return historicalData.reduceRight((accumulator, currentValue, currentIdx) => {
            accumulator.total += currentValue.close;
            switch (currentIdx) {
                case historicalData.length - 30:
                    accumulator.thirtyAvg = accumulator.total/30;
                break;
                case historicalData.length - 90:
                    accumulator.ninetyAvg = accumulator.total/90;
                if(accumulator.thirtyAvg > accumulator.ninetyAvg && trend === 'upward') {
                    trend = 'upwards';
                } else if(accumulator.thirtyAvg < accumulator.ninetyAvg && trend === 'upward') {
                    trend = 'downward';
                } else if(accumulator.thirtyAvg < accumulator.ninetyAvg && trend === 'downward') {
                    trend = 'indeterminant';
                } else if(accumulator.thirtyAvg > accumulator.ninetyAvg && trend === 'downward') {
                    trend = 'upwards';
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
