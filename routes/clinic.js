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
     path: '/etl/location/{uuid}/defaulter-list',
     config: {
         auth: 'simple',
         handler: function (request, reply) {
             dao.getClinicDefaulterList(request, reply);
         },
         plugins: {
             'hapiAuthorization': { role: privileges.canViewClinicDashBoard },
             'openmrsLocationAuthorizer': {
                 locationParameter: [
                     {
                         type: 'params',//can be in either query or params so you have to specify
                         name: 'uuid' //name of the location parameter
                     }
                 ]
             }
         },
         description: "Get a location's defaulter list",
         notes: "Returns a location's defaulter list.",
         tags: ['api'],
         validate: {
             options: { allowUnknown: true },
             params: {
                 uuid: Joi.string()
                     .required()
                     .description("The location's uuid(universally unique identifier)."),
             }
         }
     }
   },
    {
      method: 'GET',
      path: '/etl/location/{uuid}/monthly-visits',
      config: {
          auth: 'simple',
          plugins: {
              'hapiAuthorization': { role: privileges.canViewClinicDashBoard },
              'openmrsLocationAuthorizer':{
                  locationParameter: [
                      {
                          type: 'params',//can be in either query or params so you have to specify
                          name: 'uuid' //name of the location parameter
                      }
                  ]
              }
          },
          handler: function (request, reply) {
              dao.getClinicMonthlyVisits(request, reply);
          },
          description: "Get a location's monthly visits",
          notes: "Returns the actual number of patient visits for each day in a given month and location.",
          tags: ['api'],
          validate: {
              options: { allowUnknown: true },
              params: {
                  uuid: Joi.string()
                      .required()
                      .description("The location's uuid(universally unique identifier)."),
              }
          }
      }
    },
    {
       method: 'GET',
       path: '/etl/location/{uuid}/monthly-appointment-schedule',
       config: {
           auth: 'simple',
           plugins: {
               'hapiAuthorization': { role: privileges.canViewClinicDashBoard },
               'openmrsLocationAuthorizer':{
                   locationParameter: [
                       {
                           type: 'params',//can be in either query or params so you have to specify
                           name: 'uuid' //name of the location parameter
                       }
                   ]
               }
           },
           handler: function (request, reply) {
               dao.getClinicMonthlyAppointmentSchedule(request, reply);
           },
           description: "Get a location's monthly appointment schedule",
           notes: "Returns a location's monthly appointment schedule.",
           tags: ['api'],
           validate: {
               options: { allowUnknown: true },
               params: {
                   uuid: Joi.string()
                       .required()
                       .description("The location's uuid(universally unique identifier)."),
               }
           }
       }
   },
    {
        method: 'GET',
        path: '/etl/location/{uuid}/has-not-returned',
        config: {
            auth: 'simple',
            plugins: {
                'hapiAuthorization': { role: privileges.canViewClinicDashBoard },
                'openmrsLocationAuthorizer':{
                    locationParameter: [
                        {
                            type: 'params',//can be in either query or params so you have to specify
                            name: 'uuid' //name of the location parameter
                        }
                    ]
                }
            },
            handler: function (request, reply) {
                dao.getHasNotReturned(request, reply);
            },
            description: "Get a location's not returned visits",
            notes: "Returns a location's not returned visits with the given parameter uuid.",
            tags: ['api'],
            validate: {
                options: { allowUnknown: true },
                params: {
                    uuid: Joi.string()
                        .required()
                        .description("The location's uuid(universally unique identifier)."),
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/etl/location/{uuid}/daily-visits',
        config: {
            auth: 'simple',
            plugins: {
                'hapiAuthorization': { role: privileges.canViewClinicDashBoard },
                'openmrsLocationAuthorizer':{
                    locationParameter: [
                        {
                            type: 'params',//can be in either query or params so you have to specify
                            name: 'uuid' //name of the location parameter
                        }
                    ]
                }
            },
            handler: function (request, reply) {
                dao.getClinicDailyVisits(request, reply);
            },
            description: "Get a location's daily visits",
            notes: "Returns a location's daily visits with the given parameter uuid.",
            tags: ['api'],
            validate: {
                options: { allowUnknown: true },
                params: {
                    uuid: Joi.string()
                        .required()
                        .description("The location's uuid(universally unique identifier)."),
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/etl/location/{uuid}/clinic-encounter-data',
        config: {
            auth: 'simple',
            plugins: {
                'hapiAuthorization': { role: privileges.canViewClinicDashBoard },
                'openmrsLocationAuthorizer':{
                    locationParameter: [
                        {
                            type: 'params',//can be in either query or params so you have to specify
                            name: 'uuid' //name of the location parameter
                        }
                    ]
                }
            },
            handler: function (request, reply) {
                dao.getClinicEncounterData(request, reply);
            }
        }
    },
    {
        method: 'GET',
        path: '/etl/location/{uuid}/monthly-appointment-visits',
        config: {
            auth: 'simple',
            plugins: {
                'hapiAuthorization': { role: privileges.canViewClinicDashBoard },
                'openmrsLocationAuthorizer':{
                    locationParameter: [
                        {
                            type: 'params',//can be in either query or params so you have to specify
                            name: 'uuid' //name of the location parameter
                        }
                    ]
                }
            },
            handler: function (request, reply) {
                dao.getClinicMonthlySummary(request, reply);
            },
            description: "Get a location's monthly appointment visits",
            notes: "Returns a location's monthly appointment visits with the given location uuid.",
            tags: ['api'],
            validate: {
                options: { allowUnknown: true },
                params: {
                    uuid: Joi.string()
                        .required()
                        .description("The location's uuid(universally unique identifier)."),
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/etl/location/{uuid}/hiv-summary-indicators',
        config: {
            auth: 'simple',
            plugins: {
                'hapiAuthorization': { role: privileges.canViewDataAnalytics },
                'openmrsLocationAuthorizer':{
                    locationParameter: [
                        {
                            type: 'params',//can be in either query or params so you have to specify
                            name: 'uuid' //name of the location parameter
                        }
                    ]
                }
            },
            handler: function (request, reply) {
                dao.getClinicHivSummayIndicators(request, reply);
            },
            description: "Get a location's HIV summary indicators",
            notes: "Returns a location's HIV summary indicators.",
            tags: ['api'],
            validate: {
                options: { allowUnknown: true },
                params: {
                    uuid: Joi.string()
                        .required()
                        .description("The location's uuid(universally unique identifier)."),
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/etl/location/{uuid}/appointment-schedule',
        config: {
            auth: 'simple',
            plugins: {
                'hapiAuthorization': { role: privileges.canViewClinicDashBoard },
                'openmrsLocationAuthorizer':{
                    locationParameter: [
                        {
                            type: 'params',//can be in either query or params so you have to specify
                            name: 'uuid' //name of the location parameter
                        }
                    ]
                }
            },
            handler: function (request, reply) {
                dao.getClinicAppointmentSchedule(request, reply);
            },
            description: "Get a location's appointment schedule",
            notes: "Returns a location's appointment-schedule with the given location uuid.",
            tags: ['api'],
            validate: {
                options: { allowUnknown: true },
                params: {
                    uuid: Joi.string()
                        .required()
                        .description("The location's uuid(universally unique identifier)."),
                }
            }
        }
    }
  ]
}();
