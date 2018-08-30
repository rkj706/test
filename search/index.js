const client = require('../lib/elasticSearch')
const config = require('../config/index')

const express = require('express')
const User=require('../models/users')
let router = express.Router()
router.post('/search', searchQuery)
router.post('/suggest-search', searchMatch)
router.post('/getUsers',getUsers)
router.post('/updateUser',changeUserStatus)
function prepareSuggestQuery(body) {
    let query = {bool: {}}
    query.bool['should'] = []
    let operator = 'or'
    let searchString = body.text
    let mixWord = searchString.replace(/ /g, '')
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
        const index = config.elasticSearch.profileIndex.market
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

function searchQuery(req, res) {
    if(!req.body.index){
        return false
    }
    const index = config.elasticSearch.profileIndex[req.body.index]
    const type = config.elasticSearch.profileType

    //prepareQuery second parameter is flag true if pure match or false if fuzzy
    let query;
     if(index=='makt'){
        query= prepareQuery(req.body, false)
     }else {
         query=   prepareCustomerQuery(req.body,false)
     }

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
                    console.log(result)
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
            console.log(error)
        res.status(500).json({msg: 'something is not correct'})
    })
}

function getUsers(req,res){
    let userRole=req.user.role
    let userStatus=req.body.status
    if(userRole && userRole==1){
        User.find({status:userStatus},{screenName:1,company:1,email:1,status:1,_id:0},function (error,userlist) {
            if(error){
                res.status(500).json({message:'something went wrong,please try after sometime .'})
            }else{
                res.status(200).json(userlist)
            }
        })
    }else {
        res.status(200).json({code:403,message:'you are not authorize to access.'})
    }

}
function changeUserStatus(req,res){
    let userRole=req.user.role
    let userStatus=req.body.status
    let userEmail=req.body.email
    if(userRole && userRole==1){
      User.update({email:userEmail},{$set:{status:userStatus}},function (err,response) {
          if(err){
              res.status(500).json({message:'something went wrong'})
          }else{
              res.status(200).json({code:200,message:'done'})
          }
      })
    }else {
        res.status(200).json({code:403,message:'you are not authorize to access.'})
    }
}
module.exports = router
