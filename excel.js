const config=require('./config/index')
const client = require('./lib/elasticSearch')
const elasticQuery=require('./lib/query')
var Excel = require('exceljs');

function processFileAndWrite(col,row_start,phrase_column,result_column,worksheet,workbook,length,filename,index,exMatch) {
    return new Promise(function (resolve, reject) {


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
    let exactMatch=true
    if(exMatch=="true") {
         exactMatch=true
    }else{
        exactMatch=false
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
            MassSearch(rowNumber,dataBaseIndex,searchString, query,exactMatch)
                .then(function (cb) {
                    if(cb.totalNumber>0){
                        worksheet.getRow(cb.rowNumber).getCell(resultColumn).value= { text: 'Search', hyperlink: config.baseUrl+'/?search-text='+searchString+'&index='+index+'&exactMatch='+exactMatch}
                        worksheet.getRow(cb.rowNumber).getCell(resultColumn).font = {
                            underline: true,

                            color: {argb: 'FF0000FF'}

                        }
                    }else{
                        worksheet.getRow(cb.rowNumber).getCell(resultColumn).value="No records found"
                    }
                    workbook.xlsx.writeFile(__dirname + filename).then(function() {
                        writeCount=writeCount+1
                        if(writeCount>=length-parseInt(rowStart)){
                            resolve('done')
                        }

                    }).catch(function (error) {
                        console.log(error)
                        console.log('processFileAndWrite error')
                        console.log(error)
                        reject('something went wrong')
                    })
                }).catch(function (error) {
                    reject('something went wrong')
                console.log(error)
            })
        }
    })
    })
}
function uploadFileAndWrtite(filePath,row_start,phrase_column,result_column,index,exactMatch,callback) {
    const type = config.elasticSearch.profileType
    //prepareQuery second parameter is flag true if pure match or false if fuzzy
    let query;
    var workbook = new Excel.Workbook();
    var filename = '/'+filePath;
    // Reading excel file
    workbook.xlsx.readFile(__dirname + filename).then(async function() {
        // Get the 2nd column ('input')
        var worksheet = workbook.getWorksheet(1);
        // Get the B column
        let phraseColumn=phrase_column || "A"
        var col = worksheet.getColumn(phraseColumn)
        try {

            let res= await  processFileAndWrite(col,row_start,phrase_column,result_column,worksheet,workbook,worksheet.actualRowCount, filename,index,exactMatch)
            callback(res)
        }catch (e) {
            callback(e)
        }
    })
}
function MassSearch(rowNum,index,searchString,query,exactMatch) {
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
        esQuery.body._source=['_id']
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
                       // console.log('totalNumber '+total)
                        resolve({totalNumber:total,exactMatch:exactMatch,searchString:searchString,rowNumber:rowNum})

                    } else {
                        resolve({totalNumber:0,exactMatch:exactMatch,searchString:searchString,rowNumber:rowNum})

                    }
                }
            ).catch(function (error) {
            resolve({totalNumber:0,exactMatch:exactMatch,searchString:searchString,rowNumber:rowNum})


        }).catch(function (error) {
            console.log('MassSearch error')
            console.log(error)
            reject('something went wrong')
        })
    })


}

module.exports={
    uploadFileAndWrtite:uploadFileAndWrtite
}