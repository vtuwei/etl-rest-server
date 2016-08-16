/*jshint -W003, -W098, -W117, -W026 */
"use strict";
var
  dao = require('../etl-dao')
  , preRequest = require('../pre-request-processing')
  , winston = require('winston')
  , path = require('path')
  , _ = require('underscore')
  , Joi = require('joi')
  , eidLabData = require('../eid-data-synchronization/eid-lab-results')
  , Boom = require('boom')
  , authorizer = require('../authorization/etl-authorizer')
  , config = require('../conf/config')
  , privileges = authorizer.getAllPrivileges();

module.exports = function() {
  return [
    {
        method: 'GET',
        path: '/etl/hiv-summary-data',
        config: {
            auth: 'simple',
            plugins: {
                'hapiAuthorization': { roles: [ privileges.canViewPatient, privileges.canViewDataAnalytics ] }
            },
            handler: function (request, reply) {
                dao.getHivSummaryData(request, reply);
            }

        }
    },
    {
        method: 'GET',
        path: '/etl/patient-list-by-indicator',
        config: {
            auth: 'simple',
            plugins: {
                'hapiAuthorization':
                {
                    roles: [privileges.canViewPatient, privileges.canViewDataAnalytics]
                },
                'openmrsLocationAuthorizer':{
                    locationParameter: [
                        {
                            type: 'query',//can be in either query or params so you have to specify
                            name: 'locationUuids' //name of the location parameter
                        }
                    ]
                }
            },
            handler: function (request, reply) {
                var asyncRequests = 0; //this should be the number of async requests needed before they are triggered

                var onResolvedPromise = function (promise) {
                    asyncRequests--;
                    if (asyncRequests <= 0) { //voting process to ensure all pre-processing of request async operations are complete
                        dao.getPatientListReportByIndicatorAndLocation(request, reply);
                    }
                };

                //establish the number of asyncRequests
                //this is done prior to avoid any race conditions
                if (request.query.locationUuids) {
                    asyncRequests++;
                }

                if (asyncRequests === 0)
                    dao.getPatientListReportByIndicatorAndLocation(request, reply);
                if (request.query.locationUuids) {
                    dao.getIdsByUuidAsyc('amrs.location', 'location_id', 'uuid', request.query.locationUuids,
                        function (results) {
                            request.query.locations = results;
                        }).onResolved = onResolvedPromise;
                }
            }
        }
    },
    {
        /**
         endpoint  to  get  Reports Indicators
         @todo Rename  to get-report-indicators by  report  name
         **/
        method: 'GET',
        path: '/etl/indicators-schema',
        config: {
            auth: 'simple',
            plugins: {
                'hapiAuthorization': { role: privileges.canViewDataAnalytics }
            },
            handler: function (request, reply) {
                //security check
                if (!authorizer.hasReportAccess(request.query.report)) {
                    return reply(Boom.forbidden('Unauthorized'));
                }

                dao.getIndicatorsSchema(request, reply);
            },
            description: 'Get HIV monthly summary indicator schema',
            notes: 'Returns HIV monthly summary indicator schema. ',
            tags: ['api'],
            validate: {
                options: {
                    allowUnknown: true
                },
                query: {
                    report: Joi.string()
                        .required()
                        .description("The name of the report to get indicators")
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/etl/indicators-schema-with-sections',
        config: {
            auth: 'simple',
            plugins: {
                'hapiAuthorization': { role: privileges.canViewDataAnalytics }
            },
            handler: function (request, reply) {
                dao.getIndicatorsSchemaWithSections(request, reply);
            }

        }
    },
    {
        method: 'GET',
        path: '/etl/patient-flow-data',
        config: {
            auth: 'simple',
            plugins: {
                'hapiAuthorization': { role: privileges.canViewClinicDashBoard },
                'openmrsLocationAuthorizer':{
                    locationParameter: [
                        {
                            type: 'query',//can be in either query or params so you have to specify
                            name: 'locationUuids' //name of the location parameter
                        }
                    ]
                }
            },
            handler: function (request, reply) {
                preRequest.resolveLocationIdsToLocationUuids(request,
                    function () {
                        dao.getPatientFlowData(request, reply);
                    });
            },
            description: "Get a location's patient movement and waiting time data",
            notes: "Returns a location's patient flow with the given location uuid.",
            tags: ['api'],
            validate: {
                options: { allowUnknown: true },
                params: {
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/etl/data-entry-statistics/{sub}',
        config: {
            auth: 'simple',
            plugins: {
                'hapiAuthorization': { role: privileges.canViewDataEntryStats },
                'openmrsLocationAuthorizer':{
                    locationParameter: [
                        {
                            type: 'query',//can be in either query or params so you have to specify
                            name: 'locationUuids' //name of the location parameter
                        }
                    ]
                }
            },
            handler: function (request, reply) {

                if (request.params.sub === 'patientList' &&
                    !authorizer.hasPrivilege(privileges.canViewPatient)) {
                    return reply(Boom.forbidden('Unauthorized'));
                }

                var asyncRequests = 0; //this should be the number of async requests needed before they are triggered

                var onResolvedPromise = function (promise) {
                    asyncRequests--;
                    if (asyncRequests <= 0) { //voting process to ensure all pre-processing of request async operations are complete
                        dao.getDataEntryIndicators(request.params.sub, request, reply);
                    }
                };

                //establish the number of asyncRequests
                //this is done prior to avoid any race conditions
                if (request.query.formUuids) {
                    asyncRequests++;
                }
                if (request.query.encounterTypeUuids) {
                    asyncRequests++;
                }
                if (request.query.locationUuids) {
                    asyncRequests++;
                }

                if (asyncRequests === 0)
                    dao.getDataEntryIndicators(request.params.sub, request, reply);

                if (request.query.formUuids) {
                    dao.getIdsByUuidAsyc('amrs.form', 'form_id', 'uuid', request.query.formUuids,
                        function (results) {
                            request.query.formIds = results;
                        }).onResolved = onResolvedPromise;
                }
                if (request.query.encounterTypeUuids) {

                    dao.getIdsByUuidAsyc('amrs.encounter_type', 'encounter_type_id', 'uuid', request.query.encounterTypeUuids,
                        function (results) {
                            request.query.encounterTypeIds = results;
                        }).onResolved = onResolvedPromise;
                }
                if (request.query.locationUuids) {
                    dao.getIdsByUuidAsyc('amrs.location', 'location_id', 'uuid', request.query.locationUuids,
                        function (results) {
                            request.query.locationIds = results;
                        }).onResolved = onResolvedPromise;
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/etl/custom_data/{userParams*3}',
        config: {
            auth: 'simple',
            handler: function (request, reply) {
                dao.getCustomData(request, reply);
            }
            /*
             the rest request and query expression should be
             /table/filter_column/filter/filter_value or
             /table/filter_column/filter/filter_value?fields=(field1,field2,fieldn) or

             */
        }
    },
    {
        /**
         endpoint  to  get  Reports
         @todo Rename  to get-report-by-name,count by{patient/encounters},filter-params{location/starting date/ end date}
         @todo ,groupby params{location/monthly}
         **/

        method: 'GET',
        path: '/etl/get-report-by-report-name',
        config: {
            auth: 'simple',
            plugins:{
               'openmrsLocationAuthorizer':{
                   locationParameter: [
                       {
                           type:'query',//can be in either query or params so you have to specify
                           name:'locationUuids' //name of the location parameter
                       }
                   ],
                   exemptedParameter:[ //set this if you want to prevent validation checks for certain reports
                       {
                           type:'query',//can be in either query or params so you have to specify
                           name:'report', //name of the parameter
                           value:'clinical-reminder-report' //parameter value
                       }
                   ]
                }
            },
            handler: function (request, reply) {
                //security check
                if (!authorizer.hasReportAccess(request.query.report)) {
                    return reply(Boom.forbidden('Unauthorized'));
                }

                var asyncRequests = 0; //this should be the number of async requests needed before they are triggered
                var onResolvedPromise = function (promise) {
                    asyncRequests--;
                    if (asyncRequests <= 0) { //voting process to ensure all pre-processing of request async operations are complete
                        dao.getReportIndicators(request, reply);
                    }
                };
                if (request.query.locationUuids) {
                    asyncRequests++;
                }
                if (asyncRequests === 0)
                    dao.getReportIndicators(request, reply);
                if (request.query.locationUuids) {
                    dao.getIdsByUuidAsyc('amrs.location', 'location_id', 'uuid', request.query.locationUuids,
                        function (results) {
                            request.query.locations = results;
                        }).onResolved = onResolvedPromise;
                }
            },
            description: 'Get report ',
            notes: "General api endpoint that returns a report by passing " +
            "the report name parameter and a list of custom parameters " +
            "depending on the report e.g start date, end date for MOH-731 report.",
            tags: ['api'],
            validate: {
                options: {
                    allowUnknown: true
                },
                query: {
                    report: Joi.string()
                        .required()
                        .description("The name of the report to get indicators")
                }
            }

        }
    },
  ]
}();
