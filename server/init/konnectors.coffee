path = require 'path'
fs = require 'fs'
log = require('printit')()

Konnector = require '../models/konnector'

currentPath = path.dirname fs.realpathSync __filename
modulesPath = path.join currentPath, '..', 'konnectors'

isCoffeeFile = (fileName) ->
    extension = fileName.split('.')[1]
    firstChar = fileName[0]
    firstChar isnt '.' and extension is 'coffee'


# Load every modules located in the server/konnectors folder and return them
# in a hash where the key is the module name.
getKonnectorModules = ->
    modules = {}
    moduleFiles = fs.readdirSync modulesPath
    for moduleFile in moduleFiles
        if isCoffeeFile moduleFile
            name = moduleFile.split('.')[0]
            modulePath = "../konnectors/#{name}"
            modules[name] = require modulePath
    modules


# Create a konnector database object for a given konnector module (required
# to store files.
createKonnector = (konnector, callback) ->
    konnector.init (err) ->
        if err
            callback err
        else
            delete konnector.init
            Konnector.create konnector, (err) ->
                log.info "Konnector #{konnector.name} updated"
                callback()


# Update given konnector infos with module data
updateKonnector = (konnector, callback) ->
    Konnector.find konnector.id, (err,  konnectorInstance) ->
        if err then callback err
        else if not konnectorInstance?
            log.warn "Konnector #{konnector.name} cannot be updated"
        else
            konnector.init (err) ->
                if err
                    callback err
                else
                    delete konnector.init
                    konnectorInstance.updateAttributes konnector, (err)  ->
                        log.info "Konnector #{konnector.name} updated"
                        callback()


# For every loaded konnector,
module.exports = (app, callback) ->
    Konnector.all (err, konnectors) ->
        if err
            console.log err
            callback err
        else
            konnectorHash = {}
            for konnector in konnectors
                konnectorHash[konnector.name] = konnector

            konnectorModules = getKonnectorModules()
            konnectorsToCreate = []
            konnectorsToUpdate = []

            for name, konnectorModule of konnectorModules
                if konnectorHash[konnectorModule.name]?
                    konnectorsToUpdate.push konnectorModule
                else
                    konnectorsToCreate.push konnectorModule

                if konnectorModule.type? is 'oauth'
                    konnectorModule.configOAuthCallback app

            recCreate = ->
                if konnectorsToCreate.length > 0
                    konnector = konnectorsToCreate.pop()
                    createKonnector konnector, (err) ->
                        if err then recUpdate()
                        else recCreate()
                else
                    callback null

            recUpdate = ->
                if konnectorsToUpdate.length > 0
                    konnector = konnectorsToUpdate.pop()
                    updateKonnector konnector, (err) ->
                        if err then callback err
                        else recUpdate()
                else
                    callback null

            recCreate()
