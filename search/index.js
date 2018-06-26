const client = require('../lib/elasticSearch')
const config = require('../config/index')

const express = require('express')
let router = express.Router()
router.post('/search', searchQuery)

function prepareQuery(body) {
    console.log(body.text)
    let query = {bool: {}}
    query.bool['should'] = []

    let s1 = {
        "match": {
            "mara_matnr": body.text
        }

    }
    query.bool.should.push(s1)
    let s2 = {
        "match": {
            "mara_mtart": body.text
        }

    }
    query.bool.should.push(s2)
    let s3 = {
        "match": {
            "mara_ernam": body.text
        }
    }
    query.bool.should.push(s3)
    let s4 = {
        'nested': {
            'path': 'makt_props',
            'query': {
                "match": {
                    "makt_props.makt_maktg": body.text
                }
            }
        }
    }
    query.bool.should.push(s4)
    query.bool['minimum_should_match'] = 1
    return query
}

function searchQuery(req, res) {
console.log('hey bro')
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
             if(esDocs){
                 res.status(200).send({result:esDocs.hits.hits,count:esDocs.hits.total})
             }else{
                 res.status(500).json({msg:'something went wrong'})
             }
            }
        )
}

module.exports = router