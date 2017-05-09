'use strict';
const _ = require('lodash');
const moment = require('moment');
const assert = require('assert');
const algebra = require("algebra.js");

const errors = require('../../components/errors/baseErrors');
const QuoteService = require('./../quote/quote.service.js');

const Fraction = algebra.Fraction;
const Expression = algebra.Expression;
const Equation = algebra.Equation;

const trends = {
    down:  'downwards',
    up: 'upwards',
    indet: 'indeterminant'
};

function getTrendLogic(thirtyDay, ninetyDay, trend) {
    if(thirtyDay > ninetyDay && trend === trends.up) {
        trend = trends.down;
    } else if(thirtyDay < ninetyDay && trend === trends.up) {
        trend = trends.up;
    } else if(thirtyDay < ninetyDay && trend === trends.down) {
        trend = trends.up;
    } else if(thirtyDay > ninetyDay && trend === trends.down) {
        trend = trends.down;
    }
    return trend;
}

class ReversionService {
    getData(security, currentTime) {
        let endDate = moment(currentTime).format(),
            startDate = moment(currentTime).subtract(200, 'days').format();

        return QuoteService.getData(security, startDate, endDate)
            .then(this.getDecisionData)
            .then(data => data)
            .catch(err => err);
    }

    runBacktest(security, currentTime, startDate, deviation) {
        let endDate     = moment(currentTime).format(),
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
                let decision = fn(historicalData, idx, idx - 90);
                accumulator.push(decision);
            }
            return accumulator;
        },[]);
    }

    getReturns(decisions, deviation, startDate) {
        let results = decisions.reduce(function(orders, day) {
            if(moment(day.date).isAfter(moment(startDate).subtract(1,'day').format())) {
                if(Math.abs(((day.thirtyAvg/day.ninetyAvg) - 1)) < deviation) {
                    if(day.trending === 'downwards'){
                        //Sell
                        if(orders.buy.length > 0) {
                            let holding = orders.buy.shift(),
                                totalReturn = day.close - holding,
                                percentReturn = totalReturn/holding;

                            orders.returns += percentReturn;
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

    getDecisionData(historicalData, endIdx, startIdx) {
        let trend = trends.down;

        if(endIdx === undefined) {
            endIdx = historicalData.length-1;
        }

        if(startIdx === undefined) {
            startIdx = 0;
        }
        //Trend for last four days
        if((historicalData[endIdx].close>historicalData[endIdx-1].close) &&
            (historicalData[endIdx-1].close>historicalData[endIdx-2].close)) {
            trend = trends.up;
        } else if((historicalData[endIdx].close<historicalData[endIdx-1].close) &&
            (historicalData[endIdx-1].close<historicalData[endIdx-2].close)) {
                trend = trends.down;
        }
        let data = historicalData.slice(startIdx, endIdx)

        return data.reduceRight((accumulator, currentValue, currentIdx) => {
            accumulator.total += currentValue.close;
            switch (currentIdx) {
                case data.length - 30:
                    accumulator.thirtyAvg = accumulator.total/30;
                break;
                case data.length - 90:
                    accumulator.ninetyAvg = accumulator.total/90;
                    accumulator.trending = getTrendLogic(accumulator.thirtyAvg, accumulator.ninetyAvg, trend);
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
            counter: 0,
            close: data[data.length-1].close,
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
    getPricing(historicalData, endIdx, thirtyAvg, ninetyAvg, deviation) {
        let thirtyAvgTotal = thirtyAvg * 30,
            ninetyAvgTotal = ninetyAvg * 90;
        //Subtract the last price
        thirtyAvgTotal -= historicalData[historicalData.length-30];
        ninetyAvgTotal -= historicalData[historicalData.length-90];

        let leftConstant = new Fraction(thirtyAvgTotal, 30),
            rightConstant = new Fraction(ninetyAvgTotal, 90),
            leftCoefficient = new Fraction(1, 30),
            rightCoefficient = new Fraction(1, 90);

        let leftSide = new Expression('x');
            leftSide = leftSide.multiply(leftCoefficient);
            leftSide = leftSide.add(leftConstant);

        let rightSide = new Expression('x');
        rightSide = rightSide.multiply(rightCoefficient);
        rightSide = rightSide.add(rightConstant);

        let eq = new Equation(leftSide, rightSide);
        console.log(eq.toString());

        let x = eq.solveFor('x');

        console.log("x = " + x.toString());
        return x;
    }
}

module.exports = new ReversionService();
