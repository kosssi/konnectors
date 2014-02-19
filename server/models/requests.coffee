# See documentation on https://github.com/frankrousseau/americano-cozy/#requests

americano = require 'americano'

module.exports =
    konnector:
        all: americano.defaultRequests.all
        bySlug: (doc) -> emit doc.slug, doc
