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
        if (error.isBoom) {
            reply(error);
        } else {
            reply(Boom.badImplementation(error.message));
        }
    }
}

module.exports = BaseController;
