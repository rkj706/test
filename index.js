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
const passport=require('passport');
//var Stream = require('stream');
//var readline = require('readline');
//require('./reply')

const mongoose=require('mongoose');
const session = require('express-session');
const connection = mongoose.createConnection(config.db.mongo.url);
const MongoStore = require('connect-mongo')(session);
const excel=require('./excel')
// const fs = require('fs');
var app=express();

app.use(bodyParser.json())

app.engine('handlebars', exphbs({
    layoutsDir: rootPath + '/views/layouts/',
    defaultLayout: 'main',
    partialsDir: [rootPath + '/views/partials/']
}))
app.set('views', rootPath + '/views');
app.set('view engine', 'handlebars');
app.use(express.static(path.join(rootPath, 'public')));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions

// Passport Configuration
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

app.use(cookieParser());
app.use(session({
    secret: config.db.mongo.sessionSecret,
    resave: true,
    saveUninitialized: false,
    store: new MongoStore({ mongooseConnection: connection })
}));





require('./router')(app);
let ingest=require('./ingest')
if(config.ingest){
    ingest.start()
}

var server=http.createServer(app);
server.listen('5000',function (err) {
    if(err){
        console.log(err)
    }
  // excel.uploadFileAndWrtite()
    console.log('server is running');

})
