/*jshint -W003, -W097, -W117, -W026 */
'use strict';

var db = require('../../etl-db');
var _ = require('underscore');
var Promise = require('bluebird');
var reportFactory = require('../../etl-factory');
var helpers = require('../../etl-helpers');
var eidPatientCohortService = require('../../service/eid/eid-patient-cohort.service');
var config = require('../../conf/config');
var etlLogger = require('../../etl-file-logger');

module.exports = {

  loadLabCohorts: loadLabCohorts,
  syncLabCohorts: syncLabCohorts
}

var max_limit = 1000;

function loadLabCohorts(request, reply) {

  var startDate = request.query.startDate;
  var endDate = request.query.endDate;
  var limit = request.query.limit;
  var offset = request.query.offset;

  load(startDate, endDate, limit, offset)
    .then(function(data) {
      reply(data);
    }).catch(function(err) {
      reply({
        errorMessage: 'error generating report',
        error: err
      });
    });
}

function syncLabCohorts(request, reply) {

  var startDate = request.query.startDate;
  var endDate = request.query.endDate;
  var limit = max_limit;
  var offset = 0;

  var params = {
    startDate: startDate,
    endDate: endDate,
    limit: limit,
    offset: offset
  };

  //load uuids
  //loop through them

  etlLogger.logger(config.logging.eidPath + '/' + config.logging.eidFile).info('Starting Patient Sync...');
  sync(params,reply);
}

function load(startDate, endDate, limit, offset) {

  offset = isNaN(offset) ? 0 : offset;
  limit = isNaN(limit) ? max_limit : limit;

  if(!isNaN(limit) && parseInt(limit) > max_limit) limit = max_limit;

  var columns = ["distinct pe.uuid"]; //, "p.patient_id"

  var qParts = {
    columns: columns,
    table: "amrs.encounter",
    alias: 'e',
    where: ["e.date_created between ? and ?", startDate, endDate],
    joins: [
      ["amrs.patient", "p", "e.patient_id = p.patient_id"],
      ["amrs.person", "pe", "pe.person_id = p.patient_id"]
    ],
    offset: offset,
    limit: limit
  };

  return db.queryDb(qParts);
};

function sync(params, reply) {

  var limit = params.limit;

  etlLogger.logger(config.logging.eidPath + '/' + config.logging.eidFile).info('Loading db data: params: '+ JSON.stringify(params));

  load(params.startDate, params.endDate, limit, params.offset)
    .then(function(data) {

      var size = data.size;
      var offset = data.startIndex;

      if(size > 0)
        return post(data).then(function(post_status) {

          if(size == limit) {

            offset += size;
            params.offset = offset;

            //continue loading more
            sync(params, reply);

          } else {
            reply({
              status: "success"
            });
          }
        });
      else {

        //TODO - mark complete
        reply({
          status: "success"
        });
      }

    }).catch(function(err) {
      reply({
        errorMessage: 'error generating report',
        error: err
      })
    });
}

function post(data) {

  var arr = [];

  _.each(data.result, function(row) {
    //arr.push(row.uuid);
  });

  arr.push('5ba3e956-1359-11df-a1f1-0026b9348838');

  etlLogger.logger(config.logging.eidPath + '/' + config.logging.eidFile).info('syncronizing ' + arr.length + ' records');

  return new Promise(function(resolve, reject) {
    eidPatientCohortService.synchronizePatientCohort(arr, function(res) {
      etlLogger.logger(config.logging.eidPath + '/' + config.logging.eidFile).info('Sync Result: '+ res);
      resolve(res);
    });
  });
}
