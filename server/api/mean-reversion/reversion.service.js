'use strict';
const moment = require('moment');
const assert = require('assert');
const algebra = require("algebra.js");
const math = require("mathjs");

const errors = require('../../components/errors/baseErrors');
const QuoteService = require('./../quote/quote.service');
const DecisionService = require('./reversion-decision.service');

const Fraction = algebra.Fraction;
const Expression = algebra.Expression;
const Equation = algebra.Equation;

class ReversionService {
    getTrend(quotes, end, thirtyDay, ninetyDay, deviation) {
        let trend = DecisionService.getInitialTrend(quotes, end, deviation);
        trend = DecisionService.getTrendLogic(thirtyDay, ninetyDay, trend, deviation);
        return trend;
    }
    getData(ticker, currentDate) {
        let endDate = moment(currentDate).format(),
            startDate = moment(currentDate).subtract(200, 'days').format();

        return QuoteService.getData(ticker, startDate, endDate)
            .then(this.getDecisionData)
            .then(data => data)
            .catch(err => err);
    }

    getPrice(ticker, currentDate, deviation) {
        let endDate     = moment(currentDate).format(),
            start       = moment(currentDate).subtract(140, 'days').format();

            var quotes      = null,
                decisions   = null;

            deviation = parseFloat(deviation);

            if(isNaN(deviation)) {
                throw errors.InvalidArgumentsError();
            }

            return QuoteService.getData(ticker, start, endDate)
                    .then(data =>{
                        quotes = data;
                        return data;
                    })
                    .then(this.getDecisionData)
                    .then(data => {
                        decisions = data;
                        return this.calcPricing(quotes, quotes.length-1, data.thirtyTotal, data.ninetyTotal, deviation);
                    })
                    .then(price =>{
                        let trend1 = this.getTrend(quotes, quotes.length-1, price.lower.thirtyAvg, price.lower.ninetyAvg);
                        let trend2 = this.getTrend(quotes, quotes.length-1, price.upper.thirtyAvg, price.upper.ninetyAvg);
                        price.lower.trend = trend1;
                        price.upper.trend = trend2;
                        return price;
                    })
                    .catch(err => {
                        throw errors.InvalidArgumentsError();
                    });
    }

    runBacktest(ticker, currentDate, startDate, deviation, recommendDeviation) {
        let endDate     = moment(currentDate).format(),
            start       = moment(startDate).subtract(140, 'days').format();

        deviation = parseFloat(deviation);

        if(isNaN(deviation)) {
            throw errors.InvalidArgumentsError();
        }

        return QuoteService.getData(ticker, start, endDate)
                .then(data =>{
                    return this.calculateForBacktest(data, this.getDecisionData);
                })
                .then(decisions =>{
                    let recommendedDeviation = DecisionService.findBestDeviation(decisions, startDate);
                    let returns = DecisionService.getReturns(decisions, deviation, startDate);
                    let element = {totalReturn: returns, recommendedDifference: recommendedDeviation};
                    decisions.push(element);

                    return decisions;
                })
                .then(data => data)
                .catch(err => {
                    throw errors.InvalidArgumentsError();
                });
    }

    calculateForBacktest(historicalData, fn) {
        return historicalData.reduce(function(accumulator, value, idx){
            if(idx >= 90) {
                let decision = fn(historicalData, idx, idx - 90);

                accumulator.push(decision);
            }
            return accumulator;
        },[]);
    }

    getDecisionData(historicalData, endIdx, startIdx) {
        let trend = null;

        if(endIdx === undefined) {
            endIdx = historicalData.length-1;
        }

        if(startIdx === undefined) {
            startIdx = 0;
        }

        trend = DecisionService.getInitialTrend(historicalData, endIdx)

        let data = historicalData.slice(startIdx, endIdx+1);

        return data.reduceRight((accumulator, currentValue, currentIdx) => {
            accumulator.total += currentValue.close;
            switch (currentIdx) {
                case data.length - 30:
                    accumulator.thirtyAvg = accumulator.total/30;
                    accumulator.thirtyTotal = accumulator.total;
                break;
                case data.length - 90:
                    accumulator.ninetyAvg = accumulator.total/90;
                    accumulator.ninetyTotal = accumulator.total;
                    accumulator.deviation = DecisionService.calculatePercentDifference(accumulator.thirtyAvg,accumulator.ninetyAvg);
                    accumulator.trending = DecisionService.getTrendLogic(accumulator.thirtyAvg, accumulator.ninetyAvg, trend, accumulator.deviation);
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
            thirtyTotal: 0,
            ninetyTotal: 0,
            total: 0
        });
    }

    /*
    * Get tomorrow's price range that will set off buy/sell signal aka Money Function
    * @param {object[]} historicalData  Array of QuoteService
    * @param {integer} endIdx Last index
    * @param {float} thirtyAvg 30 day average
    * @param {float} ninetyAvg 90 day average
    * @param {float} deviation Accepted deviation from intersection
    */
    calcPricing(historicalData, endIdx, thirtyAvgTotal, ninetyAvgTotal, deviation) {
        //Subtract the last price
        thirtyAvgTotal -= historicalData[endIdx-29].close; //{value.closing}
        ninetyAvgTotal -= historicalData[endIdx-89].close;

        let range = DecisionService.solveExpression(thirtyAvgTotal, ninetyAvgTotal, deviation);

        return range;
    }
}

module.exports = new ReversionService();
