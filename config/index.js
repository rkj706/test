var env = process.env.NODE_ENV || 'development'
var config = {
    development: {
        ingest:false,
        port: 5003,
        baseURI: '',
        elasticSearch: {
            host: 'localhost:9200',
            profileType: 'data',
            profileIndex: 'makt'
        },
    },
    prod: {}
}
module.exports = config[env]

