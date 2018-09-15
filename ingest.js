const clinet = require('./lib/elasticSearch')
const config = require('./config/index')

// const utf8 = require('utf8');

function insert(query, callback) {
    let baseData = {
        index: config.elasticSearch.profileIndex.customer,
        type: config.elasticSearch.profileType,
        body: query
    }

    clinet.index(baseData, function (err, resp, status) {
        if (err) {
//            console.log(err)
            callback('error')
        } else {
            callback('done')
        }
    })
}

function processFile(inputFile) {
    var fs = require('fs'),
        readline = require('readline'),
        instream = fs.createReadStream(inputFile),
        outstream = new (require('stream'))(),
        rl = readline.createInterface(instream, outstream);
    let data = []
    rl.on('line', function (line) {
        try {
            let line1 = JSON.parse(line)

            data.push(line1)
        } catch (err) {
            console.log(err)
        }

        //insert(line1)
    })

    rl.on('close', function (line) {
        let i = 0
        self()
        let err = []

        function self() {
             console.log('count '+data.length)
            if (data[i]) {
                console.log('inserting ' + i)

                insert(data[i], function (data) {
                    if (data) {
                        i = i + 1
                        self()
                    } else {
                        err.push(i)
                        i = i + 1
                        self()
                    }
                })
            } else {
                console.log(err.length)
                console.log('finished')
            }
        }


    });

}

function start() {

     processFile(__dirname + '/' + 'customer_master.jl');
    //     processFile(__dirname + '/' + 'mara_makt.jl');
}

module.exports = {
    start: start
}
