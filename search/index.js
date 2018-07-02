const client = require('../lib/elasticSearch')
const config = require('../config/index')

const express = require('express')
let router = express.Router()
router.post('/search', searchQuery)
router.post('/suggest-search', searchMatch)

function prepareSuggestQuery(body) {
    let query = {bool: {}}
    query.bool['should'] = []
    let operator = 'or'
    let searchString = body.text
    let mixWord=searchString.replace(/ /g,'')
    if (body.text.indexOf('+') > -1) {
        searchString = searchString.replace(/\+/g, ' ');
        operator = 'and'
    }
    let s1 = {
        "match_phrase_prefix": {
            "mara_matnr": searchString
        }
    }

    query.bool.should.push(s1)
    let s2 = {
        "match_phrase_prefix": {
            "mara_mtart": searchString
        }

    }

    query.bool.should.push(s2)
    let s3 = {
        "match": {
            "mara_ernam": {
                "query": searchString
            }
        }
    }

    query.bool.should.push(s3)
    let s4 = {
        'nested': {
            'path': 'makt_props',
            'query': {
                "match_phrase_prefix": {
                    "makt_props.makt_maktx": searchString
                }
            }
        }
    }
    query.bool.should.push(s4)
    query.bool['minimum_should_match'] = 1
    return query
}

function searchMatch(req, res) {
    let text = req.body.text || null
    const source = req.body.source
    if (!text) {
        res.status(200).send({result: [], count: 0, time: 0})
    } else {
        const index = config.elasticSearch.profileIndex
        const type = config.elasticSearch.profileType
        const query = prepareSuggestQuery(req.body)
        const esQuery = {
            index: index,
            type: type,
            from: 0,
            size: 10
        }
        esQuery.body = {
            query: query
        }
        if (source) {
            esQuery.body._source = source
        }
        client.search(esQuery)
            .then(function (esDocs) {
                    if (esDocs) {
                        let result = esDocs.hits.hits.map(function (results) {
                            return results._source
                        })
                        res.status(200).send({result: result, count: esDocs.hits.total})
                    } else {
                        res.status(500).json({msg: 'something went wrong'})
                    }
                }
            ).catch(function (error) {
            res.status(500).json({msg: 'something is not correct'})
        })
    }
}

function prepareQuery(body, pureMatch) {
    let query = {bool: {}}
    query.bool['should'] = []
    let operator = 'or'
    let searchString = body.text
    let mixWord=searchString.replace(/ /g,'')
    if (body.text.indexOf('+') > -1) {
        searchString = searchString.replace(/\+/g, ' ');
        operator = 'and'
    }
    let s1 = {
        "bool": {
            "should": [
                {
                    "match": {
                        "mara_matnr": {
                            "query":mixWord,
                            "boost":3
                        }
                    }
                },
                {
                    "match": {
                        "mara_matnr": {
                            "query": searchString,
                            "operator": 'and',
                            "boost": 4
                        }
                    }
                }
                ,
                {
                    "match": {
                        "mara_matnr": {
                            "query": searchString,
                            "boost": 3,
                            "operator": operator
                        }
                    }
                }, {
                    "match": {
                        "mara_matnr": {
                            "query": searchString,
                            "fuzziness": 2,
                            "boost": 2,
                            "operator": operator
                        }
                    }
                }, {
                    "match_phrase_prefix": {
                        "mara_matnr": searchString
                    }
                }

            ], "minimum_should_match": 1
        }

    }

    query.bool.should.push(s1)
    let s2 = {
        "bool": {
            "should": [
                {
                    "match": {
                        "mara_mtart": {
                            "query":mixWord,
                            "boost":3
                        }
                    }
                },
                {
                    "match": {
                        "mara_mtart": {
                            "query": searchString,
                            "operator": 'and',
                            "boost": 4
                        }
                    }
                },
                {
                    "match": {
                        "mara_mtart": {
                            "query": searchString,
                            "operator": operator,
                            "boost": 3
                        }
                    }
                }, {
                    "match": {
                        "mara_mtart": {
                            "query": searchString,
                            "fuzziness": 2,
                            "operator": operator,
                            "boost": 2
                        }
                    }
                }, {
                    "match_phrase_prefix": {
                        "mara_mtart": searchString
                    }
                }
            ], "minimum_should_match": 1
        }


    }

    query.bool.should.push(s2)
    let s3 = {
        "bool": {
            "should": [
                {
                    "match": {
                        "mara_ernam": {
                            "query":mixWord,
                            "boost":3
                        }
                    }
                },
                {
                    "match": {
                        "mara_ernam": {
                            "query": searchString,
                            "boost": 4,
                            "operator": 'and'
                        }
                    }
                },
                {
                    "match": {
                        "mara_ernam": {
                            "query": searchString,
                            "boost": 3,
                            "operator": operator
                        }
                    }
                }, {
                    "match": {
                        "mara_ernam": {
                            "query": searchString,
                            "fuzziness": 2,
                            "boost": 2,
                            "operator": operator
                        }
                    }
                }, {
                    "match_phrase_prefix": {
                        "mara_ernam": searchString
                    }
                }
            ], "minimum_should_match": 1
        }

    }

    query.bool.should.push(s3)
    let s4 = {
        'nested': {
            'path': 'makt_props',
            'query': {
                "bool": {
                    "should": [
                        {
                            "match": {
                                "makt_props.makt_maktx": {
                                    "query":mixWord,
                                    "boost":3
                                }
                            }
                        },
                        {
                            "match": {
                                "makt_props.makt_maktx": {
                                    "query": searchString,
                                    "boost": 4,
                                    "operator": 'and'
                                }
                            }
                        },
                        {
                            "match": {
                                "makt_props.makt_maktx": {
                                    "query": searchString,
                                    "boost": 3,
                                    "operator": operator
                                }
                            }
                        }, {
                            "match": {
                                "makt_props.makt_maktx": {
                                    "query": searchString,
                                    "fuzziness": 2,
                                    "boost": 2,
                                    "operator": operator
                                }
                            }
                        }, {
                            "match_phrase_prefix": {
                                "makt_props.makt_maktx": searchString
                            }
                        }
                    ], "minimum_should_match": 1
                }
            }
        }
    }

    query.bool.should.push(s4)
    query.bool['minimum_should_match'] = 1
    return query
}

function searchQuery(req, res) {
    const index = config.elasticSearch.profileIndex
    const type = config.elasticSearch.profileType
    //prepareQuery second parameter is flag true if pure match or false if fuzzy
    const query = prepareQuery(req.body, false)
    const source = req.body.source
    let from = req.body.from || 0
    let size = req.body.size || 10
    if (1 < size > 10) {
        size = 10
    }
    if (from < 0) {
        from = 0
    }
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
                    let result = esDocs.hits.hits.map(function (results) {
                        return results._source
                    })
                    let total = esDocs.hits.total
                    if (result.length < 1) {
                        total = 0
                    }
                    res.status(200).send({
                        result: result,
                        count: total,
                        time: "About " + esDocs.hits.total + " results " + '(' + esDocs.took / 1000 + ' seconds)'
                    })
                } else {
                    res.status(500).json({msg: 'something went wrong'})
                }
            }
        ).catch(function (error) {
        res.status(500).json({msg: 'something is not correct'})
    })
}

module.exports = router