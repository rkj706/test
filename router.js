var auth=require('./auth/auth.service');

module.exports = function (app) {


    app.use('/auth',require('./auth'));
    app.use('/api',auth.verifyToken,require('./search'))
    app.use('/logout',logOut)
    app.use('/manageuser',manageuser)
    app.use('/',landing);

}
function manageuser(req,res) {
    auth.checkAuthentication(req,function (result) {
        if(result.status && result.admin){
            res.render('admin',{userInfo:result.userName,admin:result.admin});
        }
        else{
            res.redirect('../');
        }
    })
}

function landing(req,res) {
    auth.checkAuthentication(req,function (result) {
       if(result.status){
           res.render('landing',{userInfo:result.userName,admin:result.admin});
       }else{
           res.render('landing');
       }
    })



}
function logOut(req,res) {
    req.logout();
    res.clearCookie('token',{ path: '/' })
    res.clearCookie('screenName',{ path: '/' })
    req.session.destroy(function (err) {

        res.status(200).json({message:'loggedOut'})
    });
}