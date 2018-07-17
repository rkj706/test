var auth=require('./auth/auth.service');

module.exports = function (app) {


    app.use('/auth',require('./auth'));
    app.use('/api',auth.verifyToken,require('./search'))
    app.use('/logout',logOut)
    app.use('/',landing);

}

function landing(req,res) {
    auth.checkAuthentication(req,function (result) {
       if(result.status){
           res.render('landing',{userInfo:result.userName});
       }else{
           res.render('landing');
       }
    })



}
function logOut(req,res) {
    console.log('not coming')
    req.logout();
    req.session.destroy(function (err) {
        res.clearCookie('token')
        res.clearCookie('screenName')
        res.status(200).json({message:'loggedOut'})
    });
}