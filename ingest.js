const clinet = require('./lib/elasticSearch')
const config = require('./config/index')

// const utf8 = require('utf8');

function insert(query, callback) {
    let baseData = {
        index: config.elasticSearch.profileIndex,
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
    let jsonValue = [
        "APPLE IPHONE, VERSION 6S, COLOUR BLACK, SIZE 6",
        "Apple iphone, VERSION 6S, COLOUR BLACK, SIZE 6",
        "APPLEIPHONE VERSION 6S, COLOURBLACK, SIZE 6",
        "APPLE IPHONE, VERSION 6S, COLOUR BLACK, SIZE 6, WEIGHT 100 GMS",
        "APPLE IPHONE, VERSION 6S, COLOUR BLACK, SIZE 6, WEIGHT 100 GRAMS",
        "APPLE IPHONE VERSION 6S COLOUR BLACK SIZE 6. MANUFACTURED ONLY FOR INDIA AND CHINA",
        "APPLE IPHONE VERSION 6S COLOUR BLACK SIZE 6. MANUFACTURED ONLY FOR INDIA & CHINA",
        "APPLE IPHONE VERSION 6S COLOUR BLACK SIZE 6. MFG ONLY FOR INDIA & CHINA",
        " SPECIAL TEMPERED GLASS. REFER TO PURCHASE MANUAL FOR FABRICATION AND ASSEMBLY. RETINA ENABLED.",
        " SPECIAL TEMPERED GLAS. REFER TO PURCHASE MANUAL FOR FABRICATION AND ASSEMBLY. RETINA ENABLED",
        "High Definition (HD) Audio. Conexant CX20585 codec. Volume up, down, and mute buttons. Mic mute button",
        "APPLE IPHONE, VERSION 6S, COLOUR BLACK, SIZE 6S, WEIGHT 100 GRAMS. MANUFACTURED ONLY FOR INDIA AND CHINA.  SPECIAL TEMPERED GLASS. REFER TO PURCHASE MANUAL FOR FABRICATION AND ASSEMBLY. RETINA ENABLED. High Definition (HD) Audio.  Mic mute button",
        "APPLE IPHONE, VERSION 6S, COLOUR BLACK; SIZE 6S; WEIGHT 100 GRAMS; MANUFACTURED ONLY FOR INDIA AND CHINA; SPECIAL TEMPERED GLASS; REFER TO PURCHASE MANUAL FOR FABRICATION AND ASSEMBLY; RETINA ENABLED; High Definition (HD) Audio;  Mic mute button",
        "APPLE IPHONE, VERSION 6S, COLOUR BLACK; SIZE 6S; WEIGHT 100 GRAMS; MANUFACTURED ONLY FOR INDIA AND CHINA; SPECIAL TEMPERED GLASS; REFER TO PURCHASE MANUAL FOR FABRICATION & ASSEMBLY; RETINA ENABLED; High Definition Audio;  Mic mute button",
        "WINSHUTTLE PRIVATE LIMITED",
        "WINSHUTTLE PVT LTD",
        "WINSHUTTLE PVT. LTD.",
        "WINSHUTTL PRIVATE LIMITED",
        "WINSHUTTLE PRIVATELIMITED",
        "WINSHUTTLE PTE LIMITED",
    ]
    rl.on('close', function (line) {
        let i = 0
         self()
        let err = []

        function self() {
            if (data[i]) {
                console.log('inserting ' + i)
                if(i<20){
                    data[i].makt_props[0].makt_maktx=jsonValue[i]
                }
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

        //
    });
}

function start() {

    processFile(__dirname + '/' + 'mara_makt.jl');
}

module.exports = {
    start: start
}
