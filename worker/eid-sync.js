var db =
  require('../etl-db')
  , Promise = require('bluebird')
  , https = require('http')
  , config = require('../conf/config')
  , curl = require('curlrequest');

var Sync = {

  timeout: 3000,

  records_limit: 20,

  processing: false,

  start: function() {

    if(!config.eidSyncCredentials) {
      console.log('openmrs sync user credentials should be provided');
      process.exit(1);
    }

    if (config.etl.tls) {
        https = require('https');
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    }

    // load records from sync queue

    setInterval(function() {

      if(!Sync.processing)
        Sync.process();
    },  Sync.timeout);
  },

  process: function() {

    var today = new Date().getHours();

    //sync records after working hours only
    if (today >= 7 && today <= 17) {
      Sync.processing = false;
      return;
    }

    this.loadDbRecords()
      .then(function(data) {

        if(data.length > 0) {

          Sync.processing = true;

          Sync.sync(data)
            .then(function() {

              return Sync.deleteProcessed(data);
            })
            .then(function(deleted) {

              Sync.process();
            })
            .catch(function(err) {

              Sync.processing = false;
            });

        } else {
          Sync.processing = false;
        }
      });
  },

  loadDbRecords: function() {

    var limit = Sync.records_limit;

    var sql = 'select * from etl.eid_sync_queue limit ?';

    var qObject = {
      query: sql,
      sqlParams: [limit]
    }

    return new Promise(function(resolve, reject) {
      db.queryReportServer(qObject, function (data) {
        resolve(data.result);
      });
    });
  },

  sync: function(data) {

    var list = [];

    for(var i = 0; i < data.length; i++) {

      var row = data[i];
      list.push(Sync.syncSingleRecord(row.person_uuid));
    }

    return Promise.all(list);
  },

  syncSingleRecord: function(patientUuId) {

    console.log('syncing single record. ' + patientUuId);

    var protocol = config.etl.tls ? 'https://' : 'http://';

    var url = protocol + config.etl.host + ':' + config.etl.port + '/etl/patient-lab-orders?patientUuId=' + patientUuId;

    var usernamePass = config.eidSyncCredentials.username + ":" + config.eidSyncCredentials.password;
    var auth = "Basic " + new Buffer(usernamePass).toString('base64');

    var options = {
      url: url,
      insecure: config.etl.tls,
      headers: {
        'Authorization': auth
      }
    }

    return new Promise(function(resolve, reject) {

      curl.request(options, function (err, parts) {
          console.log('syncing single record done. ' + patientUuId);
          resolve('str');
      });
    });
  },

  deleteProcessed: function(data) {

    var lst = [];

    for(var i = 0; i < data.length; i++) {
      var row = data[i];
      lst.push(row.person_uuid);
    }

    var sql = 'delete from etl.eid_sync_queue where person_uuid in (?)';

    var qObject = {
      query: sql,
      sqlParams: [lst]
    }

    return new Promise(function(resolve, reject) {
      try {
        db.queryReportServer(qObject, function (result) {
          resolve(result);
        });
      } catch(e) {

        //TODO - ignoring delete
        resolve(e);
      }
    });
  }
}

Sync.start();

module.exports = Sync;
