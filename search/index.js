const client = require('../lib/elasticSearch')
const config = require('../config/index')
const elasticQuery = require('../lib/query')
const excel = require('../excel')
var path = require('path'),
    fs = require('fs'),
    formidable = require('formidable'),
    readChunk = require('read-chunk'),
    fileType = require('file-type');
const rootPath = path.normalize(__dirname);
var appRootDir = require('app-root-dir').get();
const utf8 = require('utf8');

const express = require('express')
const User = require('../models/users')
const Abbreviation = require('../models/abbreviation')
let router = express.Router()
router.post('/search', searchQuery)
router.post('/suggest-search', searchMatch)
router.post('/getUsers', getUsers)
router.post('/updateUser', changeUserStatus)
router.post('/uploadFile', uploadFile)
router.get('/download/:file(*)', download)
router.post('/addabbreviation', addAbbreviation)

function addAbbreviation(req, res) {
    let key = req.body.key.toUpperCase()
    let keysValue = req.body.keysValue.split(',')
    let abbreviation = new Abbreviation()
    abbreviation.keyName = key
    abbreviation.value = keysValue
    Abbreviation.findOne({keyName: key}, function (error, result) {
        if (result) {
            console.log(result)
            result.value = keysValue
            result.save(function (error) {
                if (error) {
                    res.status(200).json({status: 500, message: "something went wrong"})

                } else {
                    res.status(200).json({status: 200, message: "keys value updated"})
                }
            })
        } else {
            abbreviation.save(function (error) {
                if (error) {
                    res.status(200).json({status: 500, message: "something went wrong"})

                } else {
                    res.status(200).json({status: 200, message: "key saved"})
                }
            })
        }
    })

}

function generateFileName() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 15; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

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
        const index = config.elasticSearch.profileIndex.mkat
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
function x(searchString) {
    return new Promise(function (resolve, reject) {
        let newString = []
      Abbreviation.findOne({keyName: searchString.toUpperCase()}, function (error, result) {
            if (error) {
                newString.push(searchString)
                resolve(searchString)
            } else {
                if (result) {
                    console.log('hello')
                    let s = result.value.join(' ')
                    newString.push(s)
                    newString.push(searchString)
                    resolve(newString)

                } else {
                    newString.push(searchString)
                    resolve(newString)

                }
            }
        })

    })
}

async function getAllAbb(searchString) {
   let z= await x(searchString)
}

async function searchQuery(req, res) {
    if (!req.body.index) {
        return false
    }
    const index = config.elasticSearch.profileIndex[req.body.index]
    const type = config.elasticSearch.profileType
    let exactMatch = req.body.exactMatch || false

    //prepareQuery second parameter is flag true if pure match or false if fuzzy
    let query;
    // let searchText
    // if (!exactMatch) {
    //     searchText = req.body.text.replace(/[^a-zA-Z\d\s]/g, "")
    //     searchText.split(' ').forEach(async (item)=>{
    //         await  getAllAbb(item)
    //     })
    //     console.log('done')
    // }
    if (index == 'makt') {

        query = elasticQuery.prepareQuery(req.body, exactMatch)
    } else {
        query = elasticQuery.prepareCustomerQuery(req.body, exactMatch)
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
                    let total = esDocs.hits.total
                    if (result.length < 1) {
                        total = 0
                    }
                    let s = "results"
                    if (total <= 1) {
                        s = "result"
                    }
                    res.status(200).send({
                        result: result,
                        count: total,
                        time: "About " + esDocs.hits.total + " " + s + '(' + esDocs.took / 1000 + ' seconds)'
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

function download(req, res) {

    let filePath = appRootDir + '/uploads/' + req.params.file;

    var stat = fs.statSync(filePath);

    res.download(filePath, req.params.file);

}

async function uploadFile(req, res) {
    var photos = [],
        form = new formidable.IncomingForm();
    let filePath
    // Tells formidable that there will be multiple files sent.
    form.multiples = true;
    // Upload directory for the images
    form.uploadDir = 'tmp_uploads';

    // Invoked when a file has finished uploading.
    form.on('file', function (name, file) {
        // Allow only 3 files to be uploaded.
        if (photos.length === 3) {
            fs.unlink(file.path);
            return true;
        }

        var buffer = null,
            type = null,
            filename = '';
        // Read a chunk of the file.
        buffer = readChunk.sync(file.path, 0, 262);
        // Get the file type using the buffer read using read-chunk
        type = fileType(buffer);

        // Check the file type, must be either png,jpg or jpeg
        if (type !== null && (type.ext === 'zip' || type.ext == 'xls' || type.ext == 'xls' || type.ext === 'xlsx')) {
            // Assign new file name
            filename = Date.now() + '-' + file.name;

            // Move the file with the new file name
            fs.rename(file.path, 'uploads/' + filename);
            // Add to the list of photos
            photos.push({
                status: true,
                filename: filename,
                type: 'xlsx',
                publicPath: 'uploads/' + filename
            });

        } else {
            photos.push({
                status: false,
                filename: file.name,
                message: 'Invalid file type'
            });
            fs.unlink(file.path);
        }

    });

    form.on('error', function (err) {
        console.log('Error occurred during processing - ' + err);
    });

    // Invoked when all the fields have been processed.
    form.on('end', function () {
        console.log('All the request fields have been processed.');
    });

    // Parse the incoming form fields.
    form.parse(req, async function (err, fields, files) {

        let index = config.elasticSearch.profileIndex[fields.index]
        let row_start = fields.row_start || null
        let phrase_column = fields.phrase_column || null
        let result_column = fields.result_coulmn || null
        let filePath = photos[0].publicPath
        let exactMatch = fields.exactMatch || false
        try {
            let cb = await excel.uploadFileAndWrtite(filePath, row_start, phrase_column, result_column, index, exactMatch)

            res.status(200).json(photos);
        } catch (e) {
            console.log(e)
        }
//        res.status(200).json(photos);
    });
}


function getUsers(req, res) {
    let userRole = req.user.role
    let userStatus = req.body.status
    if (userRole && userRole == 1) {
        User.find({status: userStatus}, {
            screenName: 1,
            company: 1,
            email: 1,
            status: 1,
            _id: 0
        }, function (error, userlist) {
            if (error) {
                res.status(500).json({message: 'something went wrong,please try after sometime .'})
            } else {
                res.status(200).json(userlist)
            }
        })
    } else {
        res.status(200).json({code: 403, message: 'you are not authorize to access.'})
    }

}

function changeUserStatus(req, res) {
    let userRole = req.user.role
    let userStatus = req.body.status
    let userEmail = req.body.email
    if (userRole && userRole == 1) {
        User.update({email: userEmail}, {$set: {status: userStatus}}, function (err, response) {
            if (err) {
                res.status(500).json({message: 'something went wrong'})
            } else {
                res.status(200).json({code: 200, message: 'done'})
            }
        })
    } else {
        res.status(200).json({code: 403, message: 'you are not authorize to access.'})
    }
}

module.exports = router
