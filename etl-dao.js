'use strict';
var
  _ = require('underscore')
  , session = require('./dao/session/session')
  , readdirp = require('readdirp');

module.exports = function() {
  var dao ={};

  readdirp({ root: './dao', fileFilter: '*-dao.js' })
    .on('data', function (entry) {

      var file = require('./dao/' + entry.path);
      _.extend(dao,file);
    });

    _.extend(dao,session);
  return dao;
}();
