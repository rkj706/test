const config = require('../config/index')
const client = require('../lib/elasticSearch')
const abbreviation=require('../lib/abbreviation')
const Abbreviation=require('../models/abbreviation')


function prepareQuery(body, exactMatch) {

    let query = {}
    //   query.bool['should'] = []
    let operator = 'or'
    let searchString = body.text
    let mixWord = searchString.replace(/\s/g, '')

    if (exactMatch) {
        query['multi_match'] = {
            "query": searchString,
            "type": "cross_fields",
            "fields": ["mara_matnr",
                "mara_mtart",
                "mara_ernam",
                "makt_props.makt_maktx"],
            "operator": "and"
        }
    } else {
        query["dis_max"] = {}
        query.dis_max['queries'] = []
        let appendQuery = [
            {
                "multi_match": {
                    "query": mixWord,
                    "type": "most_fields",
                    "fields": ['mara_matnr', 'mara_mtart', 'mara_ernam', 'makt_props.makt_maktx'],
                    "boost": 30
                }

            },
            {
                "multi_match": {
                    "query": searchString,
                    "operator": "and",
                    "type": "most_fields",
                    "fuzziness": 2,
                    "fields": ['mara_matnr', 'mara_mtart', 'mara_ernam', 'makt_props.makt_maktx'],

                }
            },
            {
                "multi_match": {
                    "query": searchString,
                    "operator": "and",
                    "type": "most_fields",
                    "boost": 3000,
                    "fields": ['mara_matnr', 'mara_mtart', 'mara_ernam', 'makt_props.makt_maktx'],

                }
            },
            {
                "multi_match": {
                    "query": searchString,
                    "operator": "or",
                    "type": "most_fields",
                    "fuzziness": 2,
                    "fields": ['mara_matnr', 'mara_mtart', 'mara_ernam', 'makt_props.makt_maktx'],

                }

            },
            {
                "multi_match": {
                    "query": searchString,
                    "operator": "or",
                    "type": "most_fields",
                    "boost": 3,
                    "fields": ['mara_matnr', 'mara_mtart', 'mara_ernam', 'makt_props.makt_maktx'],

                }

            }

        ]
        query.dis_max.queries = appendQuery
    }
 //   console.log(JSON.stringify(query))
    return query
}

function prepareCustomerQuery(body, exactMatch) {

    let query = {}
    //  query.bool['should'] = []
    let operator = 'or'
    let searchString = body.text

    let mixWord = searchString.replace(/\s/g, '')

    if (exactMatch) {
        query['multi_match'] = {
            "query": searchString,
            "type": "cross_fields",
            "fields": ['kna1_land1', 'kna1_ort01', 'kna1_name1', 'kna1_name2', 'kna1_kunnr', 'knvk_props.knvk_namev', 'knvk_props.knvk_name1', 'knb1_props.knb1_bukrs', 'knb1_props.knb1_zterm'],
            "operator": "and"
        }
    } else {
        query["dis_max"] = {}
        query.dis_max['queries'] = []
        let appendQuery = [
            {
                "multi_match": {
                    "query": mixWord,
                    "type": "most_fields",
                    "fields": ['kna1_land1', 'kna1_ort01', 'kna1_name1', 'kna1_name2', 'kna1_kunnr', 'knvk_props.knvk_namev', 'knvk_props.knvk_name1', 'knb1_props.knb1_bukrs', 'knb1_props.knb1_zterm'],
                    "boost": 30
                }

            },
            {
                "multi_match": {
                    "query": searchString,
                    "operator": "and",
                    "type": "most_fields",
                    "fuzziness": 2,
                    "fields": ['kna1_land1', 'kna1_ort01', 'kna1_name1', 'kna1_name2', 'kna1_kunnr', 'knvk_props.knvk_namev', 'knvk_props.knvk_name1', 'knb1_props.knb1_bukrs', 'knb1_props.knb1_zterm']

                }
            },
            {
                "multi_match": {
                    "query": searchString,
                    "operator": "and",
                    "type": "most_fields",
                    "boost": 3000,
                    "fields": ['kna1_land1', 'kna1_ort01', 'kna1_name1', 'kna1_name2', 'kna1_kunnr', 'knvk_props.knvk_namev', 'knvk_props.knvk_name1', 'knb1_props.knb1_bukrs', 'knb1_props.knb1_zterm']

                }
            },
            {
                "multi_match": {
                    "query": searchString,
                    "operator": "or",
                    "type": "most_fields",
                    "fuzziness": 2,
                    "fields": ['kna1_land1', 'kna1_ort01', 'kna1_name1', 'kna1_name2', 'kna1_kunnr', 'knvk_props.knvk_namev', 'knvk_props.knvk_name1', 'knb1_props.knb1_bukrs', 'knb1_props.knb1_zterm']


                }

            },
            {
                "multi_match": {
                    "query": searchString,
                    "operator": "or",
                    "type": "most_fields",
                    "boost": 3,
                    "fields": ['kna1_land1', 'kna1_ort01', 'kna1_name1', 'kna1_name2', 'kna1_kunnr', 'knvk_props.knvk_namev', 'knvk_props.knvk_name1', 'knb1_props.knb1_bukrs', 'knb1_props.knb1_zterm']


                }

            }

        ]
        query.dis_max.queries = appendQuery
    }

    return query

}


module.exports = {
    prepareQuery: prepareQuery,
    prepareCustomerQuery, prepareCustomerQuery
}