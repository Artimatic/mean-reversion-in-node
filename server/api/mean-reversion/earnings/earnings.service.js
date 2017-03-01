'use strict';
const Promise = require('bluebird');

const request = require('request-promise');
const cheerio = require('cheerio');

const _ = require('lodash');

const errors = require('../../components/errors/baseErrors');

function executeRegExp(regex, data){
    if(!data) return null;

    var parsedVal = data.toString().match(regex);

    if(parsedVal && parsedVal.length!==0) return parsedVal;
    else return null;
}

class EarningsService {
    getData(ticker) {
        return Promise.try(() => {
            var url = 'https://www.estimize.com/'+ticker;
            //url = 'http://www.zacks.com/stock/research/'+ticker+'/earnings-announcements';
            // The structure of our request call
            // The first parameter is our URL
            // The callback function takes 3 parameters, an error, response status code and the html

            var options = {
                method: 'GET',
                uri: url,
                resolveWithFullResponse: true,
                transform: function (body) {
                    return cheerio.load(body);
                }
            };
            //TODO Check robots.txt
            return request(options).then(function ($) {
                var page = $.html();

                var regex = /\"releases\"\:(.)+\"allEstimates\"/i;
                var pageSection = executeRegExp(regex, page);
                pageSection = pageSection[0].replace(/\\/g, "");

                var regexHash = {
                    "name": /\"name\"\s{0,}:\s{0,}\"\S{3}\s\S{4}\"/gi,
                    "ticker": /\"ticker\":\"[a-zA-z]{1,5}\"/gi,
                    "eps": /\"eps\"\s{0,}:\s{0,}((\-{0,}\d{1,}\.\d{1,}){1,}|(null))/gi,
                    "revenue": /\"revenue\"\s{0,}:\s{0,}((\d{1,}\.{0,}\d{0,})|(null))/gi,
                    "estimize": /\"estimize_eps_mean\"\s{0,}:\s{0,}((\-{0,}\d{0,}\.{0,}\d{0,})|(null))/gi,
                    "estimize_revenue_mean": /\"estimize_revenue_mean\"\s{0,}:\s{0,}((\-{0,}\d{0,}\.{0,}\d{0,})|(null))/gi,
                    "wallstreet_eps_mean": /\"wallstreet_eps_mean\"\s{0,}:\s{0,}((\-{0,}\d{0,}\.{0,}\d{0,})|(null))/gi,
                    "wallstreet_revenue_mean": /\"wallstreet_revenue_mean\"\s{0,}:\s{0,}((\-{0,}\d{0,}\.{0,}\d{0,})|(null))/gi,
                    "guidance_eps_mean": /\"guidance_eps_mean\"\s{0,}:\s{0,}((\-{0,}\d{0,}\.{0,}\d{0,})|(null))/gi,
                    "guidance_eps_range": /\"guidance_eps_range\"\s{0,}:\s{0,}\[\d{0,}\.{0,}\d{0,}\,{0,}\d{0,}\.{0,}\d{0,}\]/gi,
                    "guidance_revenue_mean": /\"guidance_revenue_mean\"\s{0,}:\s{0,}((\-{0,}\d{0,}\.{0,}\d{0,})|(null))/gi,
                    "year_over_year_eps": /\"year_over_year_eps\"\s{0,}:\s{0,}((\-{0,}\d{0,}\.{0,}\d{0,})|(null))/gi,
                    "year_over_year_revenue": /\"year_over_year_revenue\"\s{0,}:\s{0,}((\-{0,}\d{0,}\.{0,}\d{0,})|(null))/gi,
                    "reportsAt": /\"reportsAt\"\s{0,}:\s{0,}\d{13}/gi
                };

                let foundItems = {};

                _.forEach(regexHash, function(regex, regexName) {
                    let found = executeRegExp(regex, pageSection);
                    foundItems[regexName] = [];
                    _.forEach(found, function(value, key) {
                        foundItems[regexName].push(value);
                    });
                });

console.log(foundItems);

                let reportsArray = [];

                _.forEach(foundItems.reportsAt, function(value, key) {
                    let newObj = {};
                    let arrayItem = value.split(":");
                    let newObjKey = arrayItem[0].replace(/\"/gi, "");
                    let newObjValue = arrayItem[1].replace(/\"/gi, "");
                    newObj.reportsAt = newObjValue;

                    _.forEach(regexHash, function(regex, regexName) {
                        let dataTypeArray = foundItems[regexName];
                        let reportValue = dataTypeArray[key];
                        let arrayItem = reportValue.split(":");
                        let newObjKey = arrayItem[0].replace(/\"/gi, "");
                        let newObjValue = arrayItem[1].replace(/\"/gi, "");
                    });
                    reportsArray.push(newObj);
                });


                return reportsArray;
            });
        });
    }
}

module.exports = new EarningsService();
