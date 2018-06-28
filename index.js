/**
 * Created by rakesh on 29/9/17.
 */

const path = require('path');
const rootPath = path.normalize(__dirname);

const express=require('express');
const http=require('http');
const bodyParser=require('body-parser');
const exphbs  = require('express-handlebars');
const config=require('./config')
const cookieParser = require('cookie-parser');
//var Stream = require('stream');
//var readline = require('readline');
//require('./reply')

// const fs = require('fs');
var app=express();

app.use(bodyParser.json())

app.engine('handlebars', exphbs({
    layoutsDir: rootPath + '/views/layouts/',
    defaultLayout: 'main',
    partialsDir: [rootPath + '/views/partials/']
}));
app.set('views', rootPath + '/views');
app.set('view engine', 'handlebars');
app.use(express.static(path.join(rootPath, 'public')));



app.use(cookieParser());




require('./router')(app);
let ingest=require('./ingest')
if(config.ingest){
    ingest.start()
}

var server=http.createServer(app);
server.listen('5000',function () {
    console.log('server is running');
})
