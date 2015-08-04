// Generated by CoffeeScript 1.8.0
var BloodPressure, HeartBeat, Steps, Weight, accountUrl, aggregateUrl, async, authUrl, cozydb, crypto, hashMeasuresByDate, hexMd5, localization, log, measureUrl, moment, request, saveActivityMeasures, saveBodyMeasures;

cozydb = require('cozydb');

request = require('request');

moment = require('moment');

crypto = require('crypto');

async = require('async');

localization = require('../lib/localization_manager');

log = require('printit')({
  date: true,
  prefix: 'withings'
});

hexMd5 = function(name) {
  if (name != null) {
    return crypto.createHash('md5').update(name).digest('hex');
  } else {
    return '';
  }
};

authUrl = 'https://auth.withings.com/fr/';

accountUrl = 'https://healthmate.withings.com/index/service/account';

measureUrl = 'https://healthmate.withings.com/index/service/measure';

aggregateUrl = 'https://healthmate.withings.com/index/service/v2/aggregate';

Weight = cozydb.getModel('Weight', {
  date: Date,
  weight: Number,
  leanWeight: Number,
  fatWeight: Number,
  user: String,
  vendor: {
    type: String,
    "default": 'Withings'
  }
});

HeartBeat = cozydb.getModel('HeartBeat', {
  date: Date,
  value: Number,
  user: String,
  vendor: {
    type: String,
    "default": 'Withings'
  }
});

BloodPressure = cozydb.getModel('BloodPressure', {
  date: Date,
  systolic: Number,
  diastolic: Number,
  user: String,
  vendor: {
    type: String,
    "default": 'Withings'
  }
});

Steps = cozydb.getModel('Steps', {
  date: Date,
  activeTime: Number,
  activeTimeCalories: Number,
  distance: Number,
  inactiveTime: Number,
  longestActiveTime: Number,
  longestIdleTime: Number,
  steps: Number,
  totalCalories: Number,
  vendor: {
    type: String,
    "default": 'Jawbone'
  }
});

Weight.all = function(callback) {
  return Weight.request('byDate', callback);
};

HeartBeat.all = function(callback) {
  return HeartBeat.request('byDate', callback);
};

BloodPressure.all = function(callback) {
  return BloodPressure.request('byDate', callback);
};

Steps.all = function(callback) {
  return Steps.request('byDate', callback);
};

module.exports = {
  name: "Withings",
  slug: "withings",
  description: 'konnector description withings',
  vendorLink: "https://www.withings.com/",
  fields: {
    email: "text",
    password: "password"
  },
  models: {
    scalemeasure: Weight,
    heartbeat: HeartBeat,
    bloodpressure: BloodPressure,
    steps: Steps
  },
  init: function(callback) {
    var map;
    map = function(doc) {
      return emit(doc.date, doc);
    };
    return async.series([
      function(done) {
        return Weight.defineRequest('byDate', map, done);
      }, function(done) {
        return HeartBeat.defineRequest('byDate', map, done);
      }, function(done) {
        return BloodPressure.defineRequest('byDate', map, done);
      }, function(done) {
        return Steps.defineRequest('byDate', map, done);
      }
    ], callback);
  },
  fetch: function(requiredFields, callback) {
    var email, end, params, password, start;
    params = {
      limit: 1,
      descending: true
    };
    log.info('import started');
    email = requiredFields.email;
    password = requiredFields.password;
    end = Math.ceil((new Date).getTime() / 1000);
    start = moment();
    start = start.years(2008);
    start = start.month(0);
    start = start.date(1);
    start = Math.ceil(start.valueOf() / 1000);
    this.fetchData(email, password, start, end, callback);
    return log.info('import finished');
  },
  fetchData: function(email, password, start, end, callback) {
    var data, onceUrl;
    data = {
      action: 'get',
      appliver: 2014011713,
      appname: 'wiscale',
      apppfm: 'web',
      sessionid: null
    };
    onceUrl = 'https://auth.withings.com/index/service/once/';
    return request.post(onceUrl, {
      form: data
    }, function(err, res, body) {
      var once;
      if (err) {
        return callback(err);
      }
      body = JSON.parse(body);
      once = body.body.once;
      data = {
        email: email,
        password: password,
        passClear: password,
        hash: hexMd5(email + ":" + hexMd5(password) + ":" + once),
        once: once
      };
      return request.post(authUrl, {
        form: data
      }, function(err, res, body) {
        var options, sessionid;
        if (err) {
          return callback(err);
        }
        if (res.headers['set-cookie'] == null) {
          log.error('Authentification error');
          return callback('bad credentials');
        }
        sessionid = res.headers['set-cookie'][1].split(';')[0].split('=')[1];
        options = {
          strictSSL: false,
          form: {
            action: 'getuserslist',
            appliver: '20140428120105',
            appname: 'my2',
            apppfm: 'web',
            listmask: '5',
            recurse_devtype: '1',
            recurse_use: '1',
            sessionid: sessionid
          }
        };
        return request.post(accountUrl, options, function(err, res, body) {
          var user, userid, username;
          if (err) {
            return callback(err);
          }
          body = JSON.parse(body);
          user = body.body.users[0];
          userid = user.id;
          username = "" + user.firstname + " " + user.lastname;
          options = {
            strictSSL: false,
            form: {
              action: 'getmeas',
              appliver: '20140428120105',
              appname: 'my2',
              apppfm: 'web',
              category: 1,
              limit: 2000,
              offset: 0,
              meastype: '12,35',
              sessionid: sessionid,
              startdate: 0,
              enddate: end,
              userid: userid
            }
          };
          return request.post(measureUrl, options, function(err, res, body) {
            var measures;
            if (err) {
              return callback(err);
            }
            measures = JSON.parse(body);
            return saveBodyMeasures(measures.body.measuregrps, function(err) {
              var onMeasures, startDate;
              if (err) {
                return callback(err);
              }
              startDate = moment().years(2014).month(0).date(1).format('YYYY-MM-DD');
              options = {
                strictSSL: false,
                form: {
                  sessionid: sessionid,
                  userid: userid,
                  range: '1',
                  meastype: '36,40',
                  appname: 'my2',
                  appliver: '20140428120105',
                  apppfm: 'web',
                  action: 'getbyuserid',
                  startdateymd: startDate,
                  enddateymd: moment().format('YYYY-MM-DD')
                }
              };
              onMeasures = function(err, res, body) {
                if (err) {
                  return callback(err);
                }
                measures = JSON.parse(body);
                return saveActivityMeasures(measures, callback);
              };
              return request.post(aggregateUrl, options, onMeasures);
            });
          });
        });
      });
    });
  }
};

hashMeasuresByDate = function(measures) {
  var date, hash, m, _i, _len;
  hash = {};
  for (_i = 0, _len = measures.length; _i < _len; _i++) {
    m = measures[_i];
    date = moment(m.date);
    hash[date] = true;
  }
  return hash;
};

saveBodyMeasures = function(measures, callback) {
  var processData;
  processData = function(scaleMeasures, heartBeats, bloodPressures) {
    var bloodPressure, bloodPressureHash, bloodPressuresToSave, date, heartBeat, heartBeatHash, heartBeatsToSave, measure, measuregrp, measuresToSave, saveAll, scaleMeasure, scaleMeasureHash, _i, _j, _len, _len1, _ref;
    scaleMeasureHash = hashMeasuresByDate(scaleMeasures);
    heartBeatHash = hashMeasuresByDate(heartBeats);
    bloodPressureHash = hashMeasuresByDate(bloodPressures);
    log.debug('analyse new measures');
    measuresToSave = [];
    heartBeatsToSave = [];
    bloodPressuresToSave = [];
    for (_i = 0, _len = measures.length; _i < _len; _i++) {
      measuregrp = measures[_i];
      date = moment(measuregrp.date * 1000);
      scaleMeasure = new Weight;
      scaleMeasure.date = date;
      heartBeat = new HeartBeat;
      heartBeat.date = date;
      bloodPressure = new BloodPressure;
      bloodPressure.date = date;
      _ref = measuregrp.measures;
      for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
        measure = _ref[_j];
        switch (measure.type) {
          case 1:
            scaleMeasure.weight = measure.value;
            break;
          case 5:
            scaleMeasure.leanWeight = measure.value;
            break;
          case 8:
            scaleMeasure.fatWeight = measure.value;
            break;
          case 9:
            bloodPressure.diastolic = measure.value;
            break;
          case 10:
            bloodPressure.systolic = measure.value;
            break;
          case 11:
            heartBeat.value = measure.value;
        }
      }
      if ((scaleMeasure.weight != null) && (scaleMeasureHash[date] == null)) {
        measuresToSave.push(scaleMeasure);
      }
      if ((heartBeat.value != null) && (heartBeatHash[date] == null)) {
        heartBeatsToSave.push(heartBeat);
      }
      if ((bloodPressure.systolic != null) && (bloodPressureHash[date] == null)) {
        bloodPressuresToSave.push(bloodPressure);
      }
    }
    log.info("" + measuresToSave.length + " weight measures to save");
    log.info("" + heartBeatsToSave.length + " heartbeat measures to save");
    log.info("" + bloodPressuresToSave.length + " blood pressure measures to save");
    saveAll = function(models, done) {
      return async.forEach(models, function(model, callback) {
        return model.save(callback);
      }, function(err) {
        return done(err);
      });
    };
    log.info('Save weights...');
    return saveAll(measuresToSave, function(err) {
      log.info('Weights saved...');
      if (err) {
        return callback(err);
      }
      log.info('Save heartbeats...');
      return saveAll(heartBeatsToSave, function(err) {
        log.info('Heartbeats saved...');
        if (err) {
          return callback(err);
        }
        log.info('Save blood pressures...');
        return saveAll(bloodPressuresToSave, function(err) {
          var localizationKey, notifContent, options;
          log.info('Blood pressures saved...');
          if (err) {
            return callback(err);
          }
          notifContent = null;
          if (measuresToSave.length > 0) {
            localizationKey = 'notification withings';
            options = {
              smart_count: measuresToSave.length
            };
            notifContent = localization.t(localizationKey, options);
          }
          return callback(null, notifContent);
        });
      });
    });
  };
  log.debug('fetch old measures');
  return Weight.all(function(err, scaleMeasures) {
    if (err) {
      return callback(err);
    }
    return HeartBeat.all(function(err, heartBeats) {
      if (err) {
        return callback(err);
      }
      return BloodPressure.all(function(err, bloodPressures) {
        if (err) {
          return callback(err);
        }
        return processData(scaleMeasures, heartBeats, bloodPressures);
      });
    });
  });
};

saveActivityMeasures = function(measures, callback) {
  var processData;
  log.info('Processing activity measures...');
  processData = function(stepsMeasures) {
    var date, dateAsMom, newDistances, newSteps, saveInstance, stepMeasure, steps, stepsHash, stepsToSave, valueObj, _ref, _ref1, _ref2, _ref3;
    stepsHash = hashMeasuresByDate(stepsMeasures);
    newSteps = (_ref = measures.body) != null ? (_ref1 = _ref.series) != null ? _ref1.type_36 : void 0 : void 0;
    newDistances = (_ref2 = measures.body) != null ? (_ref3 = _ref2.series) != null ? _ref3.type_40 : void 0 : void 0;
    if ((newSteps == null) && (newDistances == null)) {
      return callback();
    } else {
      stepsToSave = [];
      for (date in newSteps) {
        valueObj = newSteps[date];
        dateAsMom = moment(date);
        steps = valueObj.sum;
        if (stepsHash[dateAsMom] == null) {
          stepMeasure = new Steps;
          stepMeasure.date = dateAsMom;
          stepMeasure.steps = steps;
          stepMeasure.vendor = 'Withings';
          if (newDistances[date] != null) {
            stepMeasure.distance = newDistances[date].sum;
          }
          stepsToSave.push(stepMeasure);
        }
      }
      log.info("Found " + stepsToSave.length + " new steps measures to save!");
      saveInstance = function(model, cb) {
        return model.save(cb);
      };
      return async.forEach(stepsToSave, saveInstance, function(err) {
        var localizationKey, notifContent, options;
        if (err != null) {
          return callback(err);
        }
        log.info('Steps measures saved.');
        notifContent = null;
        if (stepsToSave.length) {
          localizationKey = 'notification withings';
          options = {
            smart_count: stepsToSave.length
          };
          notifContent = localization.t(localizationKey, options);
        }
        return callback(null, notifContent);
      });
    }
  };
  log.debug('Fetching former activity measures...');
  return Steps.all(function(err, stepsMeasures) {
    if (err) {
      return callback(err);
    }
    return processData(stepsMeasures);
  });
};
