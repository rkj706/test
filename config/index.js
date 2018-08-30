var env = process.env.NODE_ENV || 'development'
var config = {
    development: {
        ingest:false,
        port: 5003,
        baseURI: '',
        elasticSearch: {
            host: 'localhost:9200',
            profileType: 'data',
            profileIndex: {
                market:'makt',
                customer:'customer'
            }
        },
        db:{
            mongo:{url:'mongodb://localhost:27017/davinchi',sessionSecret: 'ytjfXIAd8TA1ULSN2e45'}
        },
        JWTsecret: 'Ob8GcD4LyZpw5hvUtpXh!',
        profileActivateDefault:false,
    },
    prod: {}
}
module.exports = config[env]