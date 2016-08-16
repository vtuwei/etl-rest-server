/*jshint -W003, -W098, -W117, -W026 */
"use strict";
var
  dao = require('./etl-dao')
  , preRequest = require('./pre-request-processing')
  , pack = require('./package')
  , winston = require('winston')
  , path = require('path')
  , _ = require('underscore')
  , Joi = require('joi')
  , eidLabData = require('./eid-data-synchronization/eid-lab-results')
  , Boom = require('boom')
  , authorizer = require('./authorization/etl-authorizer')
  , config = require('./conf/config')
  , privileges = authorizer.getAllPrivileges();

module.exports = function () {

    return [


        {
            method: 'GET',
            path: '/etl/patient-lab-orders',
            config: {
                auth: 'simple',
                handler: function (request, reply) {
                    if (config.eidSyncOn === true)
                        eidLabData.getPatientLabResults(request, reply);
                    else
                        reply(Boom.notImplemented('Sorry, sync service temporarily unavailable.'));
                }
            }
        },


    ];
} ();
