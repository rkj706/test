const client = require('../lib/elasticSearch')
const config = require('../config/index')

const express = require('express')
let router = express.Router()
router.post('/search', searchQuery)

function prepareQuery(body) {
    let query = {bool: {}}
    query.bool['should'] = []

    let s1 = {
        "match": {
            "mara_matnr": {
                "query": body.text,
                "fuzziness": 2,
                "prefix_length": 1
            }
        }

    }
    query.bool.should.push(s1)
    let s2 = {
        "match": {
            "mara_mtart": {
                "query": body.text,
                "fuzziness": 2,
                "prefix_length": 1

            }
        }

    }
    query.bool.should.push(s2)
    let s3 = {
        "match": {
            "mara_ernam": {
                "query": body.text,
                "fuzziness": 2,
                "prefix_length": 1
            }
        }
    }
    query.bool.should.push(s3)
    let s4 = {
        'nested': {
            'path': 'makt_props',
            'query': {
                "match": {
                    "makt_props.makt_maktx": {
                        "query": body.text,
                        "fuzziness": 2,
                        "prefix_length": 1
                    }
                }
            }
        }
    }
    query.bool.should.push(s4)
    query.bool['minimum_should_match'] = 1
    return query
}

function searchQuery(req, res) {
    const index = 'makt'
    const type = 'data'
    const query = prepareQuery(req.body)
    const source = req.body.source
    const from = req.body.from || 0
    const size = req.body.size || 10
    const sort = req.body.sort || ""
    const searchAfter = req.body.searchAfter || ""
    const timeout = req.body.timeout || '200ms'
    const esQuery = {
        index: index,
        type: type,
        from: from,
        size: size
    }
    esQuery.body = {
        query: query
    }
    if (source) {
        esQuery.body._source = source
    }
    if (sort) {
        esQuery.body.sort = sort
    }
    if (searchAfter) {
        esQuery.body.search_after = searchAfter
    }
    client.search(esQuery)
        .then(function (esDocs) {
                if (esDocs) {
                    res.status(200).send({result: esDocs.hits.hits,count:esDocs.hits.total, time:"About "+ esDocs.hits.total+ " results "+'('+esDocs.took/1000+' seconds)'})
                } else {
                    res.status(500).json({msg: 'something went wrong'})
                }
            }
        ).catch(function (error) {
        res.status(500).json({msg: 'something is not correct'})
    })
}

module.exports = router