'use strict';

const _ = require('lodash');
const Boom = require('boom');

const BaseController = require('../../api/templates/base.controller');
const EarningsService = require('./earnings.service');

const errors = require('../../components/errors/baseErrors');

const Schema = require('./earnings.model');

class EarningsController extends BaseController {

    constructor() {
        super();
        this.addSchema('EarningsService.get.query', Schema.earnings.get.query);
    }

    getEarningsReport(request, response) {
        let requestPromise = undefined;
        //TODO Validate request
        if (_.isEmpty(request.params)) {
            if (_.isEmpty(request.query)) {
                return response.status(Boom.badRequest().output.statusCode).send(Boom.badRequest().output);
            }
            requestPromise = EarningsService.getData(request.query.symbol);
        } else {
            return response.status(Boom.badRequest().output.statusCode).send(Boom.badRequest().output);
        }
        requestPromise
            .then((data) => BaseController.requestGetSuccessHandler(response, data))
            .catch((err) => BaseController.requestErrorHandler(response, err));
    }
}

module.exports = new EarningsController();
