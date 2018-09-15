const config = require('./config/index')
const client = require('./lib/elasticSearch')
const elasticQuery = require('./lib/query')
var Excel = require('exceljs');

function x() {
    return new promise(function (resolve, rejct) {
        setTimeout(
            function () {
                resolve('hello')
            }, 1000
        )
    })
}

async function processFileAndWrite(col, row_start, phrase_column, result_column, worksheet, workbook, length, filename, index, exactMatch) {
    return new Promise(async function (resolve, reject) {
        let defaultStart = row_start || null
        let query;
        let writeCount = 0
        let rowStart = row_start || 2
        let resultColumn = result_column || "B"
        let phraseColumn = phrase_column || "A"
        if (defaultStart && defaultStart > 1) {
            worksheet.getRow(1).getCell(phraseColumn).value = "Search phrase"
            worksheet.getRow(1).getCell(resultColumn).value = "Search results"
        }

       await col.eachCell(async function (cell, rowNumber) {
            if (rowNumber >= rowStart) {
                let searchString = cell.value

                if (index == 'makt') {
                    query = elasticQuery.prepareQuery({text: searchString}, exactMatch)
                } else if ('customer') {
                    query = elasticQuery.prepareCustomerQuery({text: searchString}, exactMatch)
                }
                var dataBaseIndex = index
                try {

                    let cb = await MassSearch(rowNumber, dataBaseIndex, searchString, query)
                    if (cb.totalNumber > 0) {
                        worksheet.getRow(cb.rowNumber).getCell(resultColumn).value = {
                            text: 'Search',
                            hyperlink: config.baseUrl + '/?search-text=' + searchString + '&index=' + index
                        }
                        worksheet.getRow(cb.rowNumber).getCell(resultColumn).font = {
                            underline: true,

                            color: {argb: 'FF0000FF'}

                        }
                    } else {
                        worksheet.getRow(cb.rowNumber).getCell(resultColumn).value = "No records found"
                    }
                    await  workbook.xlsx.writeFile(__dirname + filename).then(async function () {
                        writeCount = writeCount + 1
                        if (writeCount >= length - rowStart) {
                            resolve('done')
                        }

                    }).catch(function (error) {

                    })
                }
                catch (e) {
                    console.log(e)
                    reject(e)
                }

            }
        })
    })

}

async function uploadFileAndWrtite(filePath, row_start, phrase_column, result_column, index, exactMatch) {
    return new Promise(async function (resolve, reject) {
        const type = config.elasticSearch.profileType
        //prepareQuery second parameter is flag true if pure match or false if fuzzy
        let query;
        var workbook = new Excel.Workbook();
        var filename = '/' + filePath;
        // Reading excel file
        workbook.xlsx.readFile(__dirname + filename).then(async function () {
            // Get the 2nd column ('input')
            var worksheet = workbook.getWorksheet(1);
            // Get the B column
            let phraseColumn = phrase_column || "A"
            var col = worksheet.getColumn(phraseColumn)
            try {

                let res = await processFileAndWrite(col, row_start, phrase_column, result_column, worksheet, workbook, worksheet.rowCount, filename, index, exactMatch)
                resolve(res)
            } catch (e) {
                console.log(e)
            }
        }).catch(function (error) {
            console.log('uploadFileAndWrtite error')
            console.log(error)
        })
    })

}

async function MassSearch(rowNum, index, searchString, query) {
    return new Promise(async function (resolve, reject) {
        const type = config.elasticSearch.profileType
        const source = []
        let from = 0
        let size = 10
        if (1 < size > 10) {
            size = 10
        }
        if (from < 0) {
            from = 0
        }
        const sort = ""
        const searchAfter = ""
        const timeout = '200ms'
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
        await setTimeout(async function () {
            try {
             let esDocs=   await client.search(esQuery)
                if (esDocs) {

                    let total = esDocs.hits.total

                    resolve({totalNumber: total, searchString: searchString, rowNumber: rowNum})

                } else {
                    resolve({totalNumber: 0, searchString: searchString, rowNumber: rowNum})

                }
            }catch (e) {
                console.log(e)
                console.log('MassSearch client search error')
                resolve({totalNumber: 0, searchString: searchString, rowNumber: rowNum})

            }

        }, 100)


    })


}

module.exports = {
    uploadFileAndWrtite: uploadFileAndWrtite
}