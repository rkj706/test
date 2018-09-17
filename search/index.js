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
router.post('/getUsers', getUsers)
router.post('/updateUser', changeUserStatus)
router.post('/uploadFile', uploadFile)
router.get('/download/:file(*)', download)
router.post('/addabbreviation', addAbbreviation)
router.post('/createCSV',createCsv)
router.get('/download-csv/:file(*)',downloadCsv)

function createCsv(req,res) {

    if (!req.body.index) {
        return false
    }
    const index = config.elasticSearch.profileIndex[req.body.index]
    const type = config.elasticSearch.profileType

    let exactMatch = req.body.exactMatch || false

    //prepareQuery second parameter is flag true if pure match or false if fuzzy
    let query;
    let searchText
    if (index == 'makt') {
        query = elasticQuery.prepareQuery(req.body, exactMatch)
    } else {
        query = elasticQuery.prepareCustomerQuery(req.body, exactMatch)
    }

    const source = req.body.source
    let from = req.body.from || 0
    let size = req.body.size || 10
    if (1 < size > 200) {
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
                    console.log('result count '+result.length)

                    let fileName=generateFileName()+'.csv'
                    var createStream = fs.createWriteStream(appRootDir + '/result_csv/'+fileName);
                    const createCsvWriter = require('csv-writer').createObjectCsvWriter;
                    let header;
                    let records=[]
                    if(index=='makt'){
                        header= [
                            {id: 'Material Number', title: 'Material Number'},
                            {id: 'Material Type', title: 'Material Type'},
                            {id: 'Description', title: 'Description'},
                            {id: 'Material Group', title: 'Material Group'},
                            {id: 'Packaging Material Type', title: 'Packaging Material Type'},
                            {id: 'Created On', title: 'Created On'},
                            {id: 'Name of Person who Created the Object', title: 'Name of Person who Created the Object'},
                            {id: 'Maintenance status', title: 'Maintenance status'},
                            {id: 'Industry Sector', title: 'Industry Sector'},
                            {id: 'Base Unit of Measure', title: 'Base Unit of Measure'},
                            {id: 'Product hierarchy', title: 'Product hierarchy'},
                        ]
                        for (let j = 0; j < result.length; j++) {

                            let maktMaktx = result[j]['makt_props'].map(function (data) {
                                return data.makt_maktx
                            })
                            records.push(
                                {
                                    "Material Number":result[j].mara_matnr,
                                    "Material Type":result[j].mara_mtart,
                                    "Description":maktMaktx,
                                    "Material Group":result[j].mara_matkl,
                                    "Packaging Material Type":result[j].mara_vhart,
                                    "Created On":result[j].mara_ersda,
                                    "Name of Person who Created the Object":result[j].mara_ernam,
                                    "Maintenance status":result[j].mara_pstat,
                                    "Industry Sector":result[j].mara_mbrsh,
                                    "Base Unit of Measure":result[j].mara_meins,
                                    "Product hierarchy":result[j].mara_prdha
                                }

                            )
                        }
                    }else{
                        header=[
                            {id: 'Customer name', title: 'Customer name'},
                            {id: 'Country key', title: 'Country Key'},
                            {id: 'Name 1', title: 'Name 1'},
                            {id: 'Name 2', title: 'Name 2'},
                            {id: 'City', title: 'City'},
                            {id: 'Postal Code', title: 'Postal Code'},
                            {id: 'House Number And Street', title: 'House Number And Street'},
                            {id: 'KNB1 Properties', title: 'KNB1 Properties'},
                            {id: 'KNVK Properties', title: 'KNVK Properties'},
                        ]
                        for (let j = 0; j < result.length; j++) {
                            let knb1_props = []

                            result[j]["knb1_props"].forEach(function (data) {
                                let html_data = []
                                html_data.push("Reconciliation Account in General Ledger : " + data["knb1_akont"] + ',' + " Company Code : " + data['knb1_bukrs'] + ',' + " Terms of Payment Key : " + data['knb1_zterm'])
                                knb1_props.push(html_data)
                            })
                            knb1_props = knb1_props.join("<br /><br />");

                            let knvk_props = []
                            result[j]["knvk_props"].forEach(function (data) {
                                let html_data = []
                                html_data.push("Customer Name: " + data['knvk_kunnr'] + ',' + "First Name: " + data['knvk_namev'] + ',' + " Last Name: " + data['knvk_name1'])
                                knvk_props.push(html_data)
                            })
                            knvk_props = knvk_props.join("<br /><br />");

                           records.push(
                               {
                                   'Customer name':result[j].kna1_kunnr,
                                   'Country key':result[j].kna1_land1,
                                   'Name 1':result[j].kna1_name1,
                                   'Name 2':result[j].kna1_name2,
                                   'City':result[j].kna1_ort01,
                                   'Postal Code':result[j].kna1_pstlz,
                                   'House Number And Street':result[j].kna1_stras,
                                   'KNB1 Properties':knb1_props,
                                   'KNVK Properties':knvk_props
                               }
                           )
                        }
                    }
                    const csvWriter = createCsvWriter({
                        path: appRootDir +'/result_csv/'+ fileName,
                        header: header
                    });

                    csvWriter.writeRecords(records)
                        .then(() => {
                            console.log('done')
                            res.status(200).json({fileName:fileName})
                        });

                    createStream.end();

                } else {
                    res.status(500).json({msg: 'something went wrong'})
                }
            }
        ).catch(function (error) {
        console.log(error)
        res.status(500).json({msg: 'something is not correct'})
    })

}

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


function downloadCsv(req,res) {
    let filePath = appRootDir + '/result_csv/' + req.params.file;

    var stat = fs.statSync(filePath);

    res.download(filePath, req.params.file);
}
 function searchQuery(req, res) {



    if (!req.body.index) {
        return false
    }
    const index = config.elasticSearch.profileIndex[req.body.index]
    const type = config.elasticSearch.profileType
    let exactMatch = req.body.exactMatch || false
//

     //
    //prepareQuery second parameter is flag true if pure match or false if fuzzy
    let query;
    let searchText
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
             excel.uploadFileAndWrtite(filePath, row_start, phrase_column, result_column, index, exactMatch,function (resp) {
                 res.status(200).json(photos);
             })

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
