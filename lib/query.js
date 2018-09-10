const config=require('../config/index')
const client = require('../lib/elasticSearch')
function abbreviationReplace(searchString) {
    searchString.split(' ')
}
function prepareQuery(body, pureMatch) {
    let query = {bool: {}}
    query.bool['should'] = []
    let operator = 'or'
    let searchString = body.text

    let mixWord = searchString.replace(/\s/g, '')
    if (body.text.indexOf('+') > -1) {
        searchString = searchString.replace(/\+/g, ' ');
        operator = 'and'
    }
    let s1 = {
        "bool": {
            "should": [], "minimum_should_match": 1
        }
    }
    if (operator == 'or') {

        let appendQuery = [
            {
                "multi_match": {
                    "query": mixWord,
                    "type":"best_fields",
                    "fields": ['mara_matnr','mara_mtart','mara_ernam'],
                    "boost":30
                }

            },
            {
                "multi_match": {
                    "query": searchString,
                    "operator":"and",
                    "type":"best_fields",
                    "fuzziness":2,
                    "fields": ['mara_matnr','mara_mtart','mara_ernam'],

                }
            },
            {
                "multi_match": {
                    "query": searchString,
                    "operator":"and",
                    "type":"best_fields",
                    "boost":3000,
                    "fields": ['mara_matnr','mara_mtart','mara_ernam'],

                }
            },
            {
                "multi_match": {
                    "query": searchString,
                    "operator":"or",
                    "type":"best_fields",
                    "fuzziness":2,
                    "fields": ['mara_matnr','mara_mtart','mara_ernam'],

                }

            },
            {
                "multi_match": {
                    "query": searchString,
                    "operator":"or",
                    "type":"best_fields",
                    "boost":3,
                    "fields": ['mara_matnr','mara_mtart','mara_ernam'],

                }

            }

        ]
        s1.bool.should = appendQuery
    }
    else {
        let appendQuery = [
            {
                "multi_match": {
                    "query": searchString,
                    "operator":"and",
                    "type":"best_fields",
                    "boost":3000,
                    "fields": ['mara_matnr','mara_mtart','mara_ernam'],

                }
            },
            {
                "multi_match": {
                    "query": searchString,
                    "operator":"and",
                    "type":"best_fields",
                    "fuzziness":2,
                    "fields": ['mara_matnr','mara_mtart','mara_ernam'],

                }
            }
        ]
        s1.bool.should=appendQuery
    }
    let s4 = {
        'nested': {
            'path': 'makt_props',
            'query': {
                "bool": {
                    "should": [], "minimum_should_match": 1
                }
            }
        }
    }
    if (operator == 'or') {
        let appendQuery = [
            {
                "match": {
                    "makt_props.makt_maktx": {
                        "query": mixWord,
                        "boost": 30
                    }
                }
            },
            {
                "match": {
                    "makt_props.makt_maktx": {
                        "query": searchString,
                        "operator": "and",
                        "fuzziness": 2
                    }
                }
            },
            {
                "match": {
                    "makt_props.makt_maktx": {
                        "query": searchString,
                        "operator": "and",
                        "boost": 30000
                    }
                }
            },
            {
                "match": {
                    "makt_props.makt_maktx": {
                        "query": searchString,
                        "operator": "or",
                        "fuzziness": 2
                    }
                }
            },
            {
                "match": {
                    "makt_props.makt_maktx": {
                        "query": searchString,
                        "operator": "or",
                        "boost": 3
                    }
                }
            },
            {
                "match_phrase_prefix": {
                    "makt_props.makt_maktx": searchString
                }
            }

        ]
        s4.nested.query.bool.should = appendQuery
    } else {
        let appendQuery = [
            {
                "match": {
                    "makt_props.makt_maktx": {
                        "query": searchString,
                        "operator": "and",
                        "fuzziness": 2
                    }
                }
            },
            {
                "match": {
                    "makt_props.makt_maktx": {
                        "query": searchString,
                        "operator": "and",
                        "boost":3000
                    }
                }
            }

        ]
        s4.nested.query.bool.should = appendQuery
    }

    query.bool.should.push(s1)
    query.bool.should.push(s4)
    query.bool['minimum_should_match'] = 1
    return query
}

function prepareCustomerQuery(body,pureMatch) {

    let query = {bool: {}}
    query.bool['should'] = []
    let operator = 'or'
    let searchString = body.text

    let mixWord = searchString.replace(/\s/g, '')
    if (body.text.indexOf('+') > -1) {
        searchString = searchString.replace(/\+/g, ' ');
        operator = 'and'
    }
    let s1 = {
        "bool": {
            "should": [], "minimum_should_match": 1
        }
    }
    if (operator == 'or') {

        let appendQuery = [
            {
                "multi_match": {
                    "query": mixWord,
                    "type":"best_fields",
                    "fields": ['kna1_land1','kna1_ort01','kna1_name1','kna1_name2','kna1_kunnr'],
                    "boost":30
                }

            },
            {
                "multi_match": {
                    "query": searchString,
                    "operator":"and",
                    "type":"best_fields",
                    "fuzziness":2,
                    "fields": ['kna1_land1','kna1_ort01','kna1_name1','kna1_name2','kna1_kunnr'],

                }
            },
            {
                "multi_match": {
                    "query": searchString,
                    "operator":"and",
                    "type":"best_fields",
                    "boost":3000,
                    "fields": ['kna1_land1','kna1_ort01','kna1_name1','kna1_name2','kna1_kunnr'],

                }
            },
            {
                "multi_match": {
                    "query": searchString,
                    "operator":"or",
                    "type":"best_fields",
                    "fuzziness":2,
                    "fields": ['kna1_land1','kna1_ort01','kna1_name1','kna1_name2','kna1_kunnr'],

                }

            },
            {
                "multi_match": {
                    "query": searchString,
                    "operator":"or",
                    "type":"best_fields",
                    "boost":3,
                    "fields": ['kna1_land1','kna1_ort01','kna1_name1','kna1_name2','kna1_kunnr'],

                }

            }

        ]
        s1.bool.should = appendQuery
    }
    else {
        let appendQuery = [
            {

                "multi_match": {
                    "query": searchString,
                    "operator":"and",
                    "type":"best_fields",
                    "fuzziness":2,

                    "fields": ['kna1_land1','kna1_ort01','kna1_name1','kna1_name2','kna1_kunnr'],

                }
            }, {

                "multi_match": {
                    "query": searchString,
                    "operator":"and",
                    "type":"best_fields",

                    "boost":3000,
                    "fields": ['kna1_land1','kna1_ort01','kna1_name1','kna1_name2','kna1_kunnr'],

                }
            }
        ]
        s1.bool.should=appendQuery
    }
    let s3 = {
        'nested': {
            'path': 'knvk_props',
            'query': {
                "bool": {
                    "should": [], "minimum_should_match": 1
                }
            }
        }
    }
    if (operator == 'or') {
        let appendQuery = [
            {
                "multi_match":{
                    "query":mixWord,
                    "type":"best_fields",
                    "fields":['knvk_props.knvk_namev','knvk_props.knvk_name1'],
                    "boost":30
                }
            },
            {
                "multi_match":{
                    "query":searchString,
                    "type":"best_fields",
                    "operator":"and",
                    "fuzziness":2,
                    "fields":['knvk_props.knvk_namev','knvk_props.knvk_name1'],

                }
            },
            {
                "multi_match":{
                    "query":searchString,
                    "type":"best_fields",
                    "operator":"and",
                    "fields":['knvk_props.knvk_namev','knvk_props.knvk_name1'],
                    "boost":30000

                }

            },
            {
                "multi_match":{
                    "query":searchString,
                    "type":"best_fields",
                    "operator":"or",
                    "fuzziness":2,
                    "fields":['knvk_props.knvk_namev','knvk_props.knvk_name1'],

                }

            },
            {
                "multi_match":{
                    "query":searchString,
                    "type":"best_fields",
                    "operator":"or",
                    "fields":['knvk_props.knvk_namev','knvk_props.knvk_name1'],
                    "boost":3

                }
            },
            {
                "multi_match":{
                    "query":searchString,
                    "type":"phrase_prefix",
                    "fields":['knvk_props.knvk_namev','knvk_props.knvk_name1'],
                }
            }

        ]
        s3.nested.query.bool.should = appendQuery
    } else {
        let appendQuery = [
            {
                "multi_match":{
                    "query":searchString,
                    "type":"best_fields",
                    "operator":"and",
                    "fields":['knvk_props.knvk_namev','knvk_props.knvk_name1'],
                    "boost":30000

                }
            },
            {
                "multi_match":{
                    "query":searchString,
                    "type":"best_fields",
                    "operator":"and",
                    "fuzziness":2,
                    "fields":['knvk_props.knvk_namev','knvk_props.knvk_name1'],

                }

            }
        ]
        s3.nested.query.bool.should = appendQuery
    }
    let s4 = {
        'nested': {
            'path': 'knb1_props',
            'query': {
                "bool": {
                    "should": [], "minimum_should_match": 1
                }
            }
        }
    }
    if (operator == 'or') {
        let appendQuery = [
            {
                "multi_match":{
                    "query":mixWord,
                    "type":"best_fields",
                    "fields":['knb1_props.knb1_bukrs','knb1_props.knb1_zterm'],
                    "boost":30
                }
            },
            {
                "multi_match":{
                    "query":searchString,
                    "type":"best_fields",
                    "operator":"and",
                    "fuzziness":2,
                    "fields":['knb1_props.knb1_bukrs','knb1_props.knb1_zterm'],

                }
            },
            {
                "multi_match":{
                    "query":searchString,
                    "type":"best_fields",
                    "operator":"and",
                    "fields":['knb1_props.knb1_bukrs','knb1_props.knb1_zterm'],
                    "boost":30000

                }

            },
            {
                "multi_match":{
                    "query":searchString,
                    "type":"best_fields",
                    "operator":"or",
                    "fuzziness":2,
                    "fields":['knb1_props.knb1_bukrs','knb1_props.knb1_zterm'],

                }

            },
            {
                "multi_match":{
                    "query":searchString,
                    "type":"best_fields",
                    "operator":"or",
                    "fields":['knb1_props.knb1_bukrs','knb1_props.knb1_zterm'],
                    "boost":3

                }
            },
            {
                "multi_match":{
                    "query":searchString,
                    "type":"phrase_prefix",
                    "fields":['knb1_props.knb1_bukrs','knb1_props.knb1_zterm']
                }
            }

        ]
        s4.nested.query.bool.should = appendQuery
    } else {
        let appendQuery = [
            {
                "multi_match":{
                    "query":searchString,
                    "type":"best_fields",
                    "operator":"and",
                    "fields":['knb1_props.knb1_bukrs','knb1_props.knb1_zterm'],
                    "boost":30000

                }
            },
            {
                "multi_match":{
                    "query":searchString,
                    "type":"best_fields",
                    "operator":"and",
                    "fuzziness":2,
                    "fields":['knb1_props.knb1_bukrs','knb1_props.knb1_zterm'],

                }

            }
        ]
        s4.nested.query.bool.should = appendQuery
    }

    query.bool.should.push(s3)
    query.bool.should.push(s1)
    query.bool.should.push(s4)
    query.bool['minimum_should_match'] = 1
    return query

}


module.exports={
    prepareQuery:prepareQuery,
    prepareCustomerQuery,prepareCustomerQuery
}