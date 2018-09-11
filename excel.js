const config=require('./config/index')
const client = require('./lib/elasticSearch')
const elasticQuery=require('./lib/query')
var Excel = require('exceljs');

function processFileAndWrite(col,row_start,phrase_column,result_column,worksheet,workbook,length,filename,index,exactMatch,callback) {
    let defaultStart=row_start || null
    let query;
    let writeCount=0
    let rowStart=row_start || 2
    let resultColumn=result_column || "B"
    let phraseColumn=phrase_column || "A"
    if(defaultStart && defaultStart>1) {
        worksheet.getRow(1).getCell(phraseColumn).value = "Search phrase"
        worksheet.getRow(1).getCell(resultColumn).value = "Search results"
    }

     col.eachCell(function (cell, rowNumber) {
        if(rowNumber>=rowStart) {
            let searchString = cell.value

            if (index == 'makt') {
                query = elasticQuery.prepareQuery({text: searchString},exactMatch)
            }else if('customer'){
                query=elasticQuery.prepareCustomerQuery({text:searchString},exactMatch)
            }
            var dataBaseIndex=index
            MassSearch(rowNumber,dataBaseIndex,searchString, query)
                .then(function (cb) {
                    if(cb.totalNumber>0){
                        worksheet.getRow(cb.rowNumber).getCell(resultColumn).value= { text: 'Search', hyperlink: config.baseUrl+'/?search-text='+searchString+'&index='+index}
                        worksheet.getRow(cb.rowNumber).getCell(resultColumn).font = {
                            underline: true,

                            color: {argb: 'FF0000FF'}

                        }
                    }else{
                        worksheet.getRow(cb.rowNumber).getCell(resultColumn).value="No records found"
                    }
                    workbook.xlsx.writeFile(__dirname + filename).then(function() {
                        writeCount=writeCount+1
                        if(writeCount>=length-rowStart){
                            callback('done')
                        }

                    }).catch(function (error) {
                        console.log('processFileAndWrite error')
                        console.log(error)
                    })
                }).catch(function (error) {
                console.log(error)
            })
        }
    })
}
function uploadFileAndWrtite(filePath,row_start,phrase_column,result_column,index,exactMatch,callback) {
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
        let phraseColumn=phrase_column || "A"
        var col = worksheet.getColumn(phraseColumn)
        processFileAndWrite(col,row_start,phrase_column,result_column,worksheet,workbook,worksheet.rowCount, filename,index,exactMatch,function (res) {

           callback(res)
       })

    }).catch(function (error) {
        console.log('uploadFileAndWrtite error')
        console.log(error)
    })
}
function MassSearch(rowNum,index,searchString,query) {
    return new Promise(function (resolve,reject) {
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
                        console.log('totalNumber '+total)
                        resolve({totalNumber:total,searchString:searchString,rowNumber:rowNum})

                    } else {
                        resolve({totalNumber:0,searchString:searchString,rowNumber:rowNum})

                    }
                }
            ).catch(function (error) {
                console.log(error)
            console.log('MassSearch client search error')
            resolve({totalNumber:0,searchString:searchString,rowNumber:rowNum})


        }).catch(function (error) {
            console.log('MassSearch error')
            console.log(error)
        })
    })


}

module.exports={
    uploadFileAndWrtite:uploadFileAndWrtite
}