// Generated by CoffeeScript 1.8.0
var Konnector, NotificationHelper, async, localization, log, notification;

async = require('async');

NotificationHelper = require('cozy-notifications-helper');

log = require('printit')({
  prefix: null,
  date: true
});

Konnector = require('../models/konnector');

localization = require('./localization_manager');

notification = new NotificationHelper('konnectors');

module.exports = function(konnector) {
  var model;
  if ((konnector.fieldValues != null) && konnector.isImporting === false) {
    log.debug("Importing " + konnector.slug);
    model = require("../konnectors/" + konnector.slug);
    return konnector["import"](function(err, notifContent) {
      var data, localizationKey, notificationSlug, prefix;
      if (err != null) {
        log.error(err);
        localizationKey = 'notification import error';
        notifContent = localization.t(localizationKey, {
          name: model.name
        });
      }
      notificationSlug = konnector.slug;
      if (notifContent != null) {
        prefix = localization.t('notification prefix', {
          name: model.name
        });
        notification.createOrUpdatePersistent(notificationSlug, {
          app: 'konnectors',
          text: "" + prefix + " " + notifContent,
          resource: {
            app: 'konnectors',
            url: "konnector/" + konnector.slug
          }
        }, function(err) {
          if (err != null) {
            return log.error(err);
          }
        });
      } else {
        notification.destroy(notificationSlug, function(err) {
          if (err != null) {
            return log.error(err);
          }
        });
      }
      data = {
        lastAutoImport: new Date()
      };
      return konnector.updateAttributes(data, function(err) {
        if (err != null) {
          return log.error(err);
        }
      });
    });
  } else {
    return log.debug("Connector " + konnector.slug + " already importing");
  }
};
