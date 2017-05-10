'use strict';
const _ = require('lodash');
const moment = require('moment');
const assert = require('assert');
const algebra = require("algebra.js");
const math = require("mathjs");

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

function getInitialTrend(quotes, end) {
    let trend = trends.indet;
    if((quotes[end].close>quotes[end-1].close) &&
        (quotes[end-1].close>quotes[end-2].close)) {
        trend = trends.up;
    } else if((quotes[end].close<quotes[end-1].close) &&
        (quotes[end-1].close<quotes[end-2].close)) {
            trend = trends.down;
    }
    return trend;
}

function solveExpression(thirtyAvgTotal, ninetyAvgTotal, acceptedDeviation) {
    let thirtyFraction              = math.fraction(math.number(math.round(thirtyAvgTotal, 3))),
        ninetyFraction              = math.fraction(math.number(math.round(ninetyAvgTotal, 3))),
        leftConstant                = math.multiply(thirtyFraction, math.fraction('1/30')),
        rightConstant               = math.multiply(ninetyFraction, math.fraction('1/90')),
        leftConstantFraction        = new Fraction(leftConstant.n, leftConstant.d),
        rightConstantFraction       = new Fraction(rightConstant.n, rightConstant.d),
        leftCoefficient             = new Fraction(1, 30),
        rightCoefficient            = new Fraction(1, 90);

    let leftSide = new Expression('x');
    leftSide = leftSide.multiply(leftCoefficient);
    leftSide = leftSide.add(leftConstantFraction);

    let rightSide = new Expression('x');
    rightSide = rightSide.multiply(rightCoefficient);
    rightSide = rightSide.add(rightConstantFraction);

    let eq = null;

    eq = new Equation(leftSide, rightSide);

    let x = eq.solveFor('x');
    let perfectPrice = fractionToPrice(x.toString());

    acceptedDeviation = math.number(math.round(acceptedDeviation, 3));

    let lowerbound = findLowerbound(leftSide.toString(), rightSide.toString(), 0, perfectPrice, acceptedDeviation);

    let lowerThirtyAvg = math.divide(math.add(thirtyAvgTotal, lowerbound), 30);
    let upperThirtyAvg = math.divide(math.add(thirtyAvgTotal, perfectPrice), 30);
    let lowerNinetyAvg = math.divide(math.add(thirtyAvgTotal, lowerbound), 30);
    let upperNinetyAvg = math.divide(math.add(thirtyAvgTotal, perfectPrice), 30);
    return {upper: {price: perfectPrice,thirtyDay:upperThirtyAvg,ninetyDay:upperNinetyAvg},
            lower: {price:lowerbound, thirtyDay:lowerThirtyAvg,ninetyDay:lowerNinetyAvg}};
}

function findLowerbound(fn1, fn2, lower, upper, acceptedDifference) {
    let mid,
        avg1,
        avg2,
        result = -1;

    while(lower<=upper) {
        mid = math.round((upper+lower)/2, 2)
        avg1 = math.eval(fn1, {x: mid});
        avg2 = math.eval(fn2, {x: mid});
        if(math.compare(differenceAcceptance(avg1, avg2), acceptedDifference) > 0){
            lower = mid + 0.01;
        } else {
            upper = mid - 0.01;
            result = mid;
        }
    }
    return result;
}

function differenceAcceptance(v1, v2) {
    return Math.abs(Math.abs(v1-v2)/((v1+v2)/2));
}

function fractionToPrice(fraction) {
    return math.round(math.eval(fraction), 2);
}

class ReversionService {
    getTrend(quotes, end, thirtyDay, ninetyDay) {
        let trend = getInitialTrend(quotes, end);
        trend = getTrendLogic(thirtyDay, ninetyDay, trend);
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

    runBacktest(ticker, currentDate, startDate, deviation) {
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
                    return this.getReturns(decisions, deviation, startDate);
                })
                .then(data => data)
                .catch(err => {
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
                if(differenceAcceptance(day.thirtyAvg, day.ninetyAvg) < deviation) {
                    if(day.trending === 'downwards'){
                        //Sell
                        if(orders.buy.length > 0) {
                            let holding = orders.buy.shift(),
                                profit = day.close - holding;
                            orders.total += holding;
                            orders.net += profit;
                        }
                    } else if(day.trending === 'upwards'){
                        //Buy
                        orders.buy.push(day.close);
                    }
                }
            }
            return orders;
        }, {buy:[], total:0, net:0,});

        let returns = results.net/results.total;

        decisions.push({totalReturn: returns});
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

        if((historicalData[endIdx].close>historicalData[endIdx-1].close) &&
            (historicalData[endIdx-1].close>historicalData[endIdx-2].close)) {
            trend = trends.up;
        } else if((historicalData[endIdx].close<historicalData[endIdx-1].close) &&
            (historicalData[endIdx-1].close<historicalData[endIdx-2].close)) {
                trend = trends.down;
        }
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
                    accumulator.trending = getTrendLogic(accumulator.thirtyAvg, accumulator.ninetyAvg, trend);
                    accumulator.deviation = differenceAcceptance(accumulator.thirtyAvg,accumulator.ninetyAvg);
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

        let range = solveExpression(thirtyAvgTotal, ninetyAvgTotal, deviation);

        return range;
    }
}

module.exports = new ReversionService();
