/**
 * Created by rakesh on 24/9/17.
 */
'use strict';
var mongoose=require('../config/mongoDb');
var Schema=mongoose.Schema;
var     bcrypt   = require('bcrypt-nodejs');


var abbreviation=new Schema({
   keyName:{type:String,index:true},
   value:[{type:String}]
});


var abbreviation=mongoose.model('abbreviation',abbreviation);
module.exports=abbreviation