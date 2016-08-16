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
       path: '/etl/patient-by-indicator',
       config: {
           auth: 'simple',
           plugins: {
               'hapiAuthorization': { roles: [privileges.canViewPatient, privileges.canViewDataAnalytics] },
               'openmrsLocationAuthorizer': {
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
                       dao.getPatientByIndicatorAndLocation(request, reply);
                   }
               };

               //establish the number of asyncRequests
               //this is done prior to avoid any race conditions
               if (request.query.locationUuids) {
                   asyncRequests++;
               }

               if (asyncRequests === 0)
                   dao.getPatientByIndicatorAndLocation(request, reply);
               if (request.query.locationUuids) {
                   dao.getIdsByUuidAsyc('amrs.location', 'location_id', 'uuid', request.query.locationUuids,
                       function (results) {
                           request.query.locations = results;
                       }).onResolved = onResolvedPromise;
               }
           },
           description: 'Get patient',
           notes: 'Returns a patient by passing a given indicator and location.',
           tags: ['api'],
           validate: {
               options: {
                   allowUnknown: true
               },
               query: {
                   indicator: Joi.string()
                       .required()
                       .description("A list of comma separated indicators"),
                   locationUuids: Joi.string()
                       .required()
                       .description("A list of comma separated location uuids"),
               }
           }
       }
     },
    {
      method: 'GET',
      path: '/etl/location/{location}/patient-by-indicator',
      config: {
          auth: 'simple',
          plugins: {
              'hapiAuthorization': { roles: [privileges.canViewPatient, privileges.canViewDataAnalytics] },
              'openmrsLocationAuthorizer':{
                  locationParameter: [
                      {
                          type: 'params',//can be in either query or params so you have to specify
                          name: 'location' //name of the location parameter
                      }
                  ]
              }
          },
          handler: function (request, reply) {
              dao.getPatientListByIndicator(request, reply);
          },
          description: 'Get patient list by indicator',
          notes: 'Returns a patient list by indicator for a given location.',
          tags: ['api'],
          validate: {
              options: {
                  allowUnknown: true
              },
              params: {
                  location: Joi.string()
                      .required()
                      .description("The location's uuid(universally unique identifier).")
              },
              query: {
                  indicator: Joi.string()
                      .required()
                      .description("A list of comma separated indicators")
              }
          }
      }
    },
    {
       method: 'GET',
       path: '/etl/location/{location}/patient/creation/statistics',
       config: {
           auth: 'simple',
           plugins: {
               'hapiAuthorization': {
                   roles: [privileges.canViewDataEntryStats, privileges.canViewPatient]
               }
           },
           handler: function (request, reply) {
               dao.getPatientDetailsGroupedByLocation(request, reply);
           },
           description: "Get details of patient created in a location",
           notes: "Returns details of patient created in a location",
           tags: ['api'],
           validate: {
               options: {
                   allowUnknown: true
               },
               params: {
                   location: Joi.string()
                       .required()
                       .description("The location's uuid(universally unique identifier)."),
               }
           }
       }
   },
    {
        method: 'GET',
        path: '/etl/patient/creation/statistics',
        config: {
            auth: 'simple',
            plugins: {
                'hapiAuthorization': { roles: [privileges.canViewDataEntryStats, privileges.canViewPatient] },
                'openmrsLocationAuthorizer':{
                    locationParameter: [
                        {
                            type:'query',//can be in either query or params so you have to specify
                            name:'locationUuids' //name of the location parameter
                        }
                    ]
                }
            },
            handler: function (request, reply) {
                dao.getPatientCountGroupedByLocation(request, reply);
            },
            description: "Get patients created by period",
            notes: "Returns a list of patients created within a specified time period in all locations.",
            tags: ['api'],
            validate: {
                options: {
                    allowUnknown: true
                },
                query: {
                    startDate: Joi.string()
                        .optional()
                        .description("The start date to filter by"),
                    endDate: Joi.string()
                        .optional()
                        .description("The end date to filter by"),
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/etl/patient/{uuid}',
        config: {
            auth: 'simple',
            plugins: {
                'hapiAuthorization': { role: privileges.canViewPatient }
            },
            handler: function (request, reply) {
                dao.getPatient(request, reply);
            }
        }
    },
    {
        method: 'GET',
        path: '/etl/patient/{uuid}/vitals',
        config: {
            auth: 'simple',
            plugins: {
                'hapiAuthorization': { role: privileges.canViewPatient }
            },
            handler: function (request, reply) {
                dao.getPatientVitals(request, reply);
            },
            description: 'Get patient vitals',
            notes: "Returns a list of historical patient's vitals with the given patient uuid.",
            tags: ['api'],
            validate: {
                options: { allowUnknown: true },
                params: {
                    uuid: Joi.string()
                        .required()
                        .description("The patient's uuid(universally unique identifier)."),
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/etl/patient/{uuid}/data',
        config: {
            auth: 'simple',
            plugins: {
                'hapiAuthorization': { role: privileges.canViewPatient }
            },
            handler: function (request, reply) {
                dao.getPatientData(request, reply);
            },
            description: 'Get patient lab test data',
            notes: 'Returns a list of historical lab tests data of a patient with the given patient uuid.',
            tags: ['api'],
            validate: {
                options: { allowUnknown: true },
                params: {
                    uuid: Joi.string()
                        .required()
                        .description("The patient's uuid(universally unique identifier)."),
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/etl/patient/{uuid}/clinical-notes',
        config: {
            auth: 'simple',
            plugins: {
                'hapiAuthorization': { role: privileges.canViewPatient }
            },
            handler: function (request, reply) {
                dao.getClinicalNotes(request, reply);
            },
            description: 'Get patient clinical notes',
            notes: 'Returns a list of notes constructed from several ' +
            'patient information sources, particularly encounters',
            tags: ['api'],
            validate: {
                options: { allowUnknown: true },
                params: {
                    uuid: Joi.string()
                        .required()
                        .description("The patient's uuid(universally unique identifier)."),
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/etl/patient/{uuid}/hiv-summary',
        config: {
            auth: 'simple',
            plugins: {
                'hapiAuthorization': { role: privileges.canViewPatient }
            },
            handler: function (request, reply) {
                dao.getPatientHivSummary(request, reply);
            },
            description: 'Get patient HIV summary',
            notes: "Returns a list of historical patient's HIV summary with the given patient uuid. " +
            "A patient's HIV summary includes details such as last appointment date, " +
            "current ARV regimen etc. as at that encounter's date. ",
            tags: ['api'],
            validate: {
                options: { allowUnknown: true },
                params: {
                    uuid: Joi.string()
                        .required()
                        .description("The patient's uuid(universally unique identifier)."),
                }
            }
        }
    }
  ]
}();
