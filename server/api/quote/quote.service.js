'use strict';
const yahooFinance = require('yahoo-finance');

const _ = require('lodash');

const errors = require('../../components/errors/baseErrors');

class QuoteService {
    getMultiData(tickers, start, end) {
        return yahooFinance.historical({
            symbols: tickers,
            from: String(start),
            to: String(end)
        });
    }

    getData(ticker, start, end) {
        return yahooFinance.historical({
            symbol: ticker,
            from: String(start),
            to: String(end)
        });
    }

    getSnapshot(tickers) {
        return yahooFinance.snapshot({
          symbols: tickers,
          fields: ['s', 'n', 'd1', 'l1', 'y', 'r', 'm7', 'm5', 'm3', 'm4']   // ex: ['s', 'n', 'd1', 'l1', 'y', 'r']
        });
    }
}

module.exports = new QuoteService();
