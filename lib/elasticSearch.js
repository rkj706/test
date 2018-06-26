var elasticsearch = require('elasticsearch');
var config=require('../config/index')
var client = new elasticsearch.Client({
    hosts:config.elasticSearch.host
});

module.exports=client