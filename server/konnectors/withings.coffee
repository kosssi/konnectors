americano = require 'americano-cozy'
querystring = require 'querystring'
request = require 'request'
moment = require 'moment'
log = require('printit')
    prefix: "Withings"
    date: true


# Models

WithingsMove = americano.getModel 'WithingsMove',
    date: Date

WithingsMove.all = (callback) ->
    WithingsMove.request 'byDate', callback

WithingsSleep = americano.getModel 'WithingsSleep',
    date: Date

WithingsSleep.all = (callback) ->
    WithingsSleep.request 'byDate', callback

# Konnector

module.exports =

    name: "Withings"
    slug: "withings"
    type: "oauth"
    description: "Download Move and Sleep Data from Withings API."
    vendorLink: "https://withings.com/"

    fields:
        login: "text"
        yop: "text"
        password: "password"

    models:
        moves: WithingsMove
        sleeps: WithingsSleep

    modelNames: ['WithingsMove', 'WithingsSleep']

    oauthPath: 'withings'
    oauthController: (req, res) ->
        log.debug "Oauth callback called"


    # Define model requests.
    init: (callback) ->
        map = (doc) -> emit doc.date, doc
        WithingsMove.defineRequest 'byDate', map, (err) ->
            callback err if err
            WithingsSleep.defineRequest 'byDate', map, (err) ->
                callback err

    configOAuthCallback: (app) ->
        app.get '/oauth/withings', (req, res) ->
            log.debug  "oauth callback activated"

    fetch: (requiredFields, callback) ->
        callback()
