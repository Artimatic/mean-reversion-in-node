'use strict';

const _ = require('lodash');
const Ajv = require('ajv');
const Boom = require('boom');

const ajv = new Ajv({
    v5: true,
    allErrors: true,
    jsonPointers: true
});

class BaseController {

    addSchema(schemaKey, schemaObject) {
        ajv.addSchema(schemaObject, schemaKey);
    }

    validate(schemaKey, data) {
        ajv.validate(schemaKey, data);
        return ajv.errors;
    }

    static requestGetSuccessHandler(reply, data) {
        if (_.isEmpty(data) || data.Count === 0) {
            reply().code(204);
        } else {
          reply.status(200).send(data);
        }
    }

    static requestErrorHandler(reply, error) {
        console.log('error', error);
        if (error.isBoom) {
            reply.status(error.output.statusCode).send(error.output);
        } else {
            reply.status(Boom.badImplementation().output.statusCode).send(Boom.badImplementation().output);
        }
    }
}

module.exports = BaseController;
