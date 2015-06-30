americano = require 'americano-cozy'
moment = require 'moment'
async = require 'async'

fetcher = require '../lib/fetcher'
filterExisting = require '../lib/filter_existing'
saveDataAndFile = require '../lib/save_data_and_file'
linkBankOperation = require '../lib/link_bank_operation'

localization = require '../lib/localization_manager'

log = require('printit')
    prefix: "OVH"
    date: true


# Models

InternetBill = americano.getModel 'InternetBill',
    date: Date
    vendor: String
    amount: Number
    fileId: String

InternetBill.all = (callback) ->
    InternetBill.request 'byDate', callback

# Konnector

module.exports =

    name: "OVH"
    slug: "ovh"
    description: 'konnector description ovh'
    vendorLink: "https://www.ovh.com/"

    fields:
        endpoint: "text"
        appKey: "text"
        appSecret: "password"
        consumerKey: "text"
        folderPath: "folder"

    models:
        internetbill: InternetBill

    # Define model requests.
    init: (callback) ->
        map = (doc) -> emit doc.date, doc
        InternetBill.defineRequest 'byDate', map, (err) ->
            callback err

    fetch: (requiredFields, callback) ->
        log.info "Import started"

        fetcher.new()
#            .use(logIn)
            .use(findBills)
            .use(filterExisting log, InternetBill)
            .use(saveDataAndFile log, InternetBill, 'ovh', ['facture'])
            .use(linkBankOperation
                log: log
                model: InternetBill
                identifier: 'ovh'
                dateDelta: 4
                amountDelta: 5
            )
            .args(requiredFields, {}, {})
            .fetch (err, fields, entries) ->
                log.info "Import finished"

                notifContent = null
                if entries?.filtered?.length > 0
                    localizationKey = 'notification ovh'
                    options = smart_count: entries.filtered.length
                    notifContent = localization.t localizationKey, options

                callback err, notifContent


## Procedure to login to OVH website.
#logIn = (requiredFields, billInfos, data, next) ->
#
#    ovh = require('ovh')
#        endpoint: requiredFields.endpoint,
#        appKey: requiredFields.appKey,
#        appSecret: requiredFields.appSecret
#
#    ovh.request 'POST', '/auth/credential', {
#        'accessRules': [
#            { 'method': 'GET', 'path': '/me/bill'},
#            { 'method': 'GET', 'path': '/me/bill/*'},
#        ]
#    }, (error, credential) ->
#        if error then next error
#        data.credential = credential
#        next()


# Parse the fetched page to extract bill data.
findBills = (requiredFields, bills, data, next) ->
    bills.fetched = []

    ovh = require('ovh')
        endpoint: requiredFields.endpoint,
        appKey: requiredFields.appKey,
        appSecret: requiredFields.appSecret,
        consumerKey: requiredFields.consumerKey

    ovh.request 'GET', '/me/bill', (error, billList) ->
        if error then next error
        async.map billList, ((bill, callback) ->
            ovh.request 'GET', '/me/bill/' + bill, callback
        ), (error, billList) ->
            if error then next error
            billList.forEach (bill) ->
                date = moment.utc(bill.date)
                amount = bill.priceWithTax.value
                pdf = bill.pdfUrl
                log.info "date: " + date
                log.info "amount: " + amount
                log.info "pdf: " + pdf
                bills.fetched.push
                    date: date
                    amount: amount
                    pdfurl: pdf
            if bills.fetched.length is 0
                log.error "No bills retrieved"
                next('no bills retrieved')
            else
                log.info "bills length: " + bills.fetched.length
                next()
