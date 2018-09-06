const config=require('./config/index')
const client = require('./lib/elasticSearch')
const elasticQuery=require('./lib/query')
var Excel = require('exceljs');


function x(col,worksheet,workbook,length,filename,index,callback) {
    let query;
    let writeCount=0
     col.eachCell(function (cell, rowNumber) {
        if(rowNumber>2) {
            let searchString = cell.value
            if (index == 'makt') {
                query = elasticQuery.prepareQuery({text: searchString}, false)
            }else if('customer'){
                query=elasticQuery.prepareCustomerQuery({text:searchString},false)
            }
            MassSearch(rowNumber,searchString, query, function (cb) {
                if(cb) {
                    worksheet.getRow(cb.rowNumber).getCell(3).value =cb.totalNumber.toString()
                    worksheet.getRow(cb.rowNumber).getCell(4).value=config.baseUrl+'/?search-text='+searchString+'&index='+index
                    workbook.xlsx.writeFile(__dirname + filename).then(function() {
                        writeCount=writeCount+1
                        if(writeCount>=length-2){
                            callback('done')
                        }

                    });
                }
            })
        }
    })
}
function uploadFileAndWrtite(filePath,index,callback) {
    const type = config.elasticSearch.profileType
    //prepareQuery second parameter is flag true if pure match or false if fuzzy
    let query;
    var workbook = new Excel.Workbook();
    var filename = '/'+filePath;

    // Reading excel file
    workbook.xlsx.readFile(__dirname + filename).then(function() {
        // Get the 2nd column ('input')
        var worksheet = workbook.getWorksheet(1);

            // Get the B column
        var col = worksheet.getColumn("B");
       x(col,worksheet,workbook,worksheet.rowCount, filename,index,function (res) {
           callback(res)
       })

    });
}
function MassSearch(rowNum,searchString,query,callback) {
    const index = "makt"
    const type = config.elasticSearch.profileType
    const source = []
    let from =  0
    let size = 10
    if (1 < size > 10) {
        size = 10
    }
    if (from < 0) {
        from = 0
    }
    const sort = ""
    const searchAfter = ""
    const timeout =  '200ms'
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
                    // let result = esDocs.hits.hits.map(function (results) {
                    // //     return results._source
                    // })
                    let total = esDocs.hits.total
                    // if (result.length < 1) {
                    //     total=0
                    // }
                    callback({totalNumber:total,searchString:searchString,rowNumber:rowNum})

                } else {
                   callback({totalNumber:0,searchString:searchString,rowNumber:rowNum})

                }
            }
        ).catch(function (error) {
        console.log(error)
        callback({totalNumber:0,searchString:searchString,rowNumber:rowNum})


    })

}

module.exports={
    uploadFileAndWrtite:uploadFileAndWrtite
}