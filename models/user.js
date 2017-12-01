/**
 * 操作数据库表结构
 * 模型类的操作---》用于操作数据库
 */


var mongoose = require('mongoose')

var usersSchema = require('../schemas/users');
module.exports = mongoose.model('user',usersSchema);
