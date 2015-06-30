// Generated by CoffeeScript 1.9.3
var InternetBill, americano, async, cheerio, fetcher, filterExisting, fs, linkBankOperation, localization, log, logIn, moment, parsePage, qs, request, requestJson, saveDataAndFile;

americano = require('americano-cozy');

fs = require('fs');

qs = require('querystring');

requestJson = require('request-json');

request = require('request');

moment = require('moment');

cheerio = require('cheerio');

async = require('async');

fetcher = require('../lib/fetcher');

filterExisting = require('../lib/filter_existing');

saveDataAndFile = require('../lib/save_data_and_file');

localization = require('../lib/localization_manager');

linkBankOperation = require('../lib/link_bank_operation');

log = require('printit')({
  prefix: "Bouygues Telecom",
  date: true
});

InternetBill = americano.getModel('InternetBill', {
  date: Date,
  vendor: String,
  amount: Number,
  fileId: String
});

InternetBill.all = function(callback) {
  return InternetBill.request('byDate', callback);
};

module.exports = {
  name: "Bouygues Box",
  slug: "bouyguesbox",
  description: 'konnector description bouygues box',
  vendorLink: "https://www.bouyguestelecom.fr/",
  fields: {
    email: "text",
    password: "password",
    folderPath: "folder"
  },
  models: {
    phonebill: InternetBill
  },
  init: function(callback) {
    var map;
    map = function(doc) {
      return emit(doc.date, doc);
    };
    return InternetBill.defineRequest('byDate', map, function(err) {
      return callback(err);
    });
  },
  fetch: function(requiredFields, callback) {
    log.info("Import started");
    return fetcher["new"]().use(logIn).use(parsePage).use(filterExisting(log, InternetBill)).use(saveDataAndFile(log, InternetBill, 'bouyg', ['facture'])).use(linkBankOperation({
      log: log,
      model: InternetBill,
      identifier: 'bouygues',
      dateDelta: 20,
      amountDelta: 0.1
    })).args(requiredFields, {}, {}).fetch(function(err, fields, entries) {
      var localizationKey, notifContent, options, ref;
      if (err) {
        return callback(err);
      }
      log.info("Import finished");
      notifContent = null;
      if ((entries != null ? (ref = entries.filtered) != null ? ref.length : void 0 : void 0) > 0) {
        localizationKey = 'notification bouygues';
        options = {
          smart_count: entries.filtered.length
        };
        notifContent = localization.t(localizationKey, options);
      }
      return callback(null, notifContent);
    });
  }
};

logIn = function(requiredFields, bills, data, next) {
  var billUrl, loginOptions, loginUrl, userAgent;
  loginUrl = 'https://www.mon-compte.bouyguestelecom.fr/cas/login';
  billUrl = 'http://www.bouyguestelecom.fr/mon-compte/suivi-conso/factures';
  userAgent = 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:36.0) ' + 'Gecko/20100101 Firefox/36.0';
  loginOptions = {
    uri: loginUrl,
    jar: true,
    method: 'GET',
    headers: {
      'User-Agent': userAgent
    }
  };
  return request(loginOptions, function(err, res, body) {
    var $, execution, form, lt;
    if (err) {
      return next(err);
    }
    $ = cheerio.load(body);
    lt = $('input[name="lt"]').val();
    execution = $('input[name="execution"]').val();
    form = {
      "username": requiredFields.email,
      "password": requiredFields.password,
      "lt": lt,
      "execution": execution,
      "_eventId": 'submit'
    };
    loginOptions = {
      method: 'POST',
      form: form,
      jar: true,
      uri: loginUrl,
      headers: {
        'User-Agent': userAgent
      }
    };
    return request(loginOptions, function(err, res, body) {
      var options;
      if (err) {
        return next(err);
      }
      options = {
        method: 'GET',
        uri: billUrl,
        jar: true,
        headers: {
          'User-Agent': userAgent
        }
      };
      return request(options, function(err, res, body) {
        if (err) {
          return next(err);
        }
        data.html = body;
        return next();
      });
    });
  });
};

parsePage = function(requiredFields, bills, data, next) {
  var $, baseDlUrl;
  baseDlUrl = 'https://www.bouyguestelecom.fr/mon-compte/' + 'suiviconso/index/facturepdffixe';
  bills.fetched = [];
  $ = cheerio.load(data.html);
  $('.historique tr').each(function() {
    var amount, bill, dataArray, date, params, url, urlData;
    urlData = $(this).find('.voirMaFacture a').attr('onclick');
    if (urlData != null) {
      date = $(this).find('.eccogrisc:first-child').html();
      amount = $(this).find('td:nth-child(2) span').text().substring(0, 5);
      amount = amount.replace('€', ',');
      dataArray = urlData.split(',');
      params = {
        id: dataArray[4].replace(/[\/'\s]/g, ''),
        date: dataArray[5].replace(/[\/'\s]/g, ''),
        type: dataArray[6].replace(/[\/'\s]/g, ''),
        no_reference: dataArray[7].replace(/[\/)'\s]/g, '')
      };
      url = baseDlUrl + "?" + (qs.stringify(params));
      console.log(url);
      if (params.type === 'Bbox') {
        bill = {
          date: moment(date, 'DD/MM/YYYY'),
          amount: amount.replace(',', '.'),
          pdfurl: url
        };
        return bills.fetched.push(bill);
      }
    }
  });
  return next();
};
