//加载express模块
var express = require('express')
var fs = require('fs');
var path = require('path');
//加载数据库模块
var mongoose = require('mongoose')
//创建app应用  =>node.js 的http.createServer()
var app = express()
//加载body-parser,用来处理post提交过来的数据
var bodyParser = require('body-parser')

// var Cookies = require('cookies');
var cookieParser = require('cookie-parser')
//引入usermodel
var User = require('./models/user');

var router = require('./server/router')
var compression = require('compression')
var session = require('express-session')
var FileStore = require('session-file-store')(session);


var resolve = file => path.resolve(__dirname, file);
app.use(compression());
app.use('/dist', express.static(resolve('./dist')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); 
var identityKey = 'skey'; 

app.use(cookieParser('zhang'))  //zhang为加密key
app.use(session({
    name: identityKey,
    secret: 'chyingp',  // 用来对session id相关的cookie进行签名
    store: new FileStore(),  // 本地存储session（文本文件，也可以选择其他store，比如redis的）
    saveUninitialized: false,  // 是否自动保存未初始化的会话，建议false
    resave: false,  // 是否每次都重新保存会话，建议false
    // cookie: {
    //     maxAge: 15 * 60 * 1000  // 有效期，单位是毫秒, 这里设置的是15分钟
    // }
}));

app.use(router)

// 后台管理页
app.get('/admin', function(req, res) {
    var sess = req.session;
    var loginUser = sess.loginUser;
    var isLogined = !!loginUser;
    if (isLogined){
        console.log('已登录')
        var html = fs.readFileSync(resolve('./' + 'admin.html'), 'utf-8');
    }else{
        console.log('未登录')
        var html = fs.readFileSync(resolve('./' + 'login.html'), 'utf-8');
    }
	res.send(html)
});

// 博客首页
app.get('*', function(req, res) {
    var html = fs.readFileSync(resolve('./' + 'index.html'), 'utf-8');
    res.send(html)
});


app.use(function(req,res,next){
    
     req.userInfo={} //给req自定义一个空userInfo对象
     if(req.signedCookies.userInfo){
               try{   //解析登录用户的cookie
                      req.userInfo = JSON.parse(req.signedCookies.userInfo)
                      //获取当前用户登录的类型--》是否是管理员
                      User.findOne({
                       _id:req.userInfo._id
                      }).then(function(userinfo){
                      
                        req.userInfo.isAdmin = Boolean(userinfo.isAdmin)
                        next()
                      })
                     
               }catch(e){
                  
                   throw e;
                   next()
               }
            }else{
             next()
            }
            
       
});

app.listen(process.env.PORT || 8083, function() {
    console.log("应用实例，访问地址为 localhost:8083/admin")
});