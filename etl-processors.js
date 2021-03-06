"use strict";
var _ = require('underscore');
var helpers = require('./etl-helpers');
var patientFlowProcessor = require('./report-post-processors/patient-flow-processor');
var clinicalComparatorProcessor = require('./report-post-processors/clinic-comparator-processor');

module.exports = function() {
  return {
    convertConceptIdToName: convertConceptIdToName,
    processPatientFlow: processPatientFlow,
    processClinicalComparator: processClinicalComparator,
    findChanges: findChanges
  };

  function convertConceptIdToName(indicators, queryResults, requestIndicators) {
    _.each(indicators, function(indicator) {
      _.each(queryResults.result, function(row) {
        row[indicator] = helpers.getARVNames(row[indicator]);
      });
    });
    return queryResults;
  }

  function findChanges(indicators, queryResults, requestIndicators) {
    var rows = [];
    _.each(queryResults.result, function(row) {
      var current = row.current_regimen.split('##');
      var previous = row.previous_regimen.split('##');
      if (!arraysEqual(current, previous)) {
        rows.push(row);
      }
    });
    return rows;
  }

  function arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length != b.length) return false;

    // If you don't care about the order of the elements inside
    // the array, you should sort both arrays here.

    for (var i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  function processPatientFlow(indicators, queryResults, requestIndicators) {
    //use processor helpers here
    queryResults.result =
      patientFlowProcessor.groupResultsByVisitId(queryResults.result);
    queryResults.averageWaitingTime =
      patientFlowProcessor.calculateAverageWaitingTime(queryResults.result);
    queryResults.medianWaitingTime =
      patientFlowProcessor.calculateMedianWaitingTime(queryResults.result);
    queryResults.incompleteVisitsCount =
      patientFlowProcessor.getIncompleteVisitsCount(queryResults.result);
    queryResults.completeVisitsCount =
        patientFlowProcessor.getCompleteVisitsCount(queryResults.result);
    queryResults.totalVisitsCount =
        patientFlowProcessor.getTotalVisitsCount(queryResults.result);
    queryResults.resultsByLocation = patientFlowProcessor.splitResultsByLocation(queryResults.result);
    queryResults.statsByLocation = patientFlowProcessor.calculateStatisticsByLocation(queryResults.resultsByLocation);

    return queryResults;

  }

  function processClinicalComparator(indicators, queryResults, requestIndicators) {
    queryResults.result =
      clinicalComparatorProcessor.groupResultsByMonth(queryResults.result, requestIndicators);

    return queryResults;
  }
}();
