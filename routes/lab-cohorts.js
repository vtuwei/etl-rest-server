var
  Joi = require('joi')
  , authorizer = require('../authorization/etl-authorizer')
  , privileges = authorizer.getAllPrivileges()
  , dao = require('../dao/lab-cohorts/lab-cohorts-dao');

module.exports = function() {

  return [
    {
        method: 'GET',
        path: '/etl/lab-cohorts',
        config: {
            auth: 'simple',
            handler: function (request, reply) {
                dao.loadLabCohorts(request, reply);
            },
            description: 'Lab Cohorts',
            notes: 'returns list of uuids to be syncd',
            tags: ['api'],
            validate: {
                options: {
                    allowUnknown: true
                },
                query: {
                    startDate: Joi.string()
                        .required()
                        .description("The start date to filter by"),
                    endDate: Joi.string()
                        .required()
                        .description("The end date to filter by"),
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/etl/lab-cohorts-sync',
        config: {
            auth: 'simple',
            handler: function (request, reply) {

                dao.syncLabCohorts(request, reply);
            },
            description: 'Lab Cohorts',
            notes: 'Lab Cohorts Sync Feature',
            tags: ['api'],
            validate: {
                query: {
                    startDate: Joi.string()
                        .required()
                        .description("The start date to filter by"),
                    endDate: Joi.string()
                        .required()
                        .description("The end date to filter by"),
                }
            }
        }
    }
  ]
}();
