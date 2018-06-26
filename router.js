module.exports = function (app) {
    app.use('/api',require('./search'))
    app.use('/',landing);
}
function landing(req,res) {
   res.render('landing');
}
