var jwt = require('jsonwebtoken')
var config = require('../config');

var moment = require('moment');
const User=require('../models/users');
// const AMQP = require('../lib/amqp');

/**
 * Returns a jwt token signed by the app secret
 */
function signToken(id) {
  return jwt.sign({_id: id}, config.JWTsecret, {expiresIn: '7d'});
}


/**
 * Set token cookie directly for oAuth strategies
 */
function setTokenCookie(req, res) {
      let token = signToken(req.user._id)
      let screenName=req.user.screenName

      res.cookie('token', token,{ path: '/' });
      res.cookie('screenName',screenName,{ path: '/' })
      res.status(200).json({code:200,message:"authenticated"})
}


const verifyToken = function (req, res, next) {
  if (!(req.cookies && req.cookies.token) && !req.header('Authorization')) {
    return res.status(401).json({message: 'Please login before searching'})
  }
  let token = req.cookies.token || req.header('Authorization').split(' ')[1]
  var payload = null;
  try {
    payload = jwt.decode(token, config.JWTsecret)
    User.findById(payload._id, function (err, user) {
      if (err){
        throw next(err)
      }else if(!user.status){
        return res.status(403).json({message:'account is not yet activated'})
      }
      req.user = user;
      next();
    })
  }
  catch (err) {
    return res.status(401).json({message: err.message})
  }
  if (payload.exp <= moment().unix()) {
    return res.status(401).json({message: 'Token has expired'})
  }
}


const checkAuthentication = function (req,result) {
    if (!(req.cookies && req.cookies.token) && !req.header('Authorization')) {
       result({status:false})
    }else {
        let token = req.cookies.token || req.header('Authorization').split(' ')[1]
        var payload = null;
        try {

            payload = jwt.decode(token, config.JWTsecret)
            User.findById(payload._id, function (err, user) {
                if (err){
                    console.log('user couldn"t find ')
                    result({status:false})
                }else if(!user.status){
                    result({status:false})
                }
               else if (payload.exp <= moment().unix()) {
                     result({status:false})
                }
                else{
                    let admin=false
                    if(user.role && user.role==1){
                        admin=true
                    }
                    result({status:true,userName:user.screenName,admin:admin})
                }

            })
        }
        catch (err) {
            console.log(err)
           result({status:false})
        }
    }
}

exports.verifyToken = verifyToken
exports.signToken = signToken
exports.setTokenCookie = setTokenCookie
exports.checkAuthentication = checkAuthentication
