var express = require('express');
var router = express.Router();
var users = require('./user').items;
var User = require('../models/user');
var db = require('./db');
// var cookieParser = require('cookie-parser')
//调用加密Crypto  -->加密
try{
  var  Crypto = require('crypto');
}catch(err){
    console.log(err)
}

//统一返回格式
let responseData;
router.use(function(req,res,next){
    responseData={
        code:0,//没有任何错误
        message:'' //返回信息
    }
    next();
})
var findUser = function(name, password){
    return users.find(function(item){
        return item.name === name && item.password === password;
    });
};
// 登录接口
router.post('/api/login', function(req, res, next){
    var sess = req.session;
    // var user = findUser(req.body.name, req.body.pwd);

    // if(user){
    //     req.session.regenerate(function(err) {
    //         if(err){
    //             return res.json({code: 2, msg: '登录失败'});
    //         }
    //         req.session.loginUser = user.name;
    //         res.json({code: 0, msg: '登录成功'});
    //     });
    // }else{
    //     res.json({code: 1, msg: '账号或密码错误333'});
    // }
    let username = req.body.name;
    let password = req.body.pwd;
    User.findOne({
   username:username
   }).then(function(userInfo){
        //判断当前用户是否存在
        if(userInfo){
              //当前用户存在
              var hash = Crypto.createHash('sha1');   //-->加密 使用sha1进行加密
              hash.update(password);   //加密password
              var hashpassword=hash.digest('hex') 
              if(hashpassword == userInfo.password){
                   responseData.msg='登录成功';
                   responseData.userInfo = {
                       _username:userInfo.username,
                       _id:userInfo._id
                   }
                   //设置cookie，配置signed: true的话可以配置签名cookie
                   res.cookie('userInfo',JSON.stringify({
                        _username:userInfo.username,
                        _id:userInfo._id
                   }),{maxAge:1000*60*60*24,signed:true})
                   res.json({code: 0, msg: '登录成功'});
                    req.session.regenerate(function(err) {
                        if(err){
                            return res.json({code: 2, msg: '登录失败'});
                        }
                        req.session.loginUser = user.name;
                        res.json({code: 0, msg: '登录成功'});
                    });
                   

                    
                
               }else{
                responseData.code=1;   
                responseData.msg='密码不正确';
                res.json(responseData);
                return
               }
      
        }else{
            //当前用户不存在
            responseData.code=2;   
            responseData.msg='用户不存在';
            res.json(responseData);
            return
        }
   })
});
// 注册接口
//用户注册
/**
 * 注册逻辑
 *  1.用户名不能为空
 *  2.密码不能为空
//  *  3.两次密码必须一致
 *   
 *   1.检查用户名是否已经被注册
 *        数据库查询
 */
router.post('/api/creat', function(req, res,next){
    var sess = req.session;
    let username = req.body.name;
    let password = req.body.pwd;
    // var user = findUser(req.body.name, req.body.pwd);
    if(!username){
        res.json({code: 1, msg: '用户名不能为空'});
        return
     }
    //密码为空
   if(!password){
       responseData.code=2;
       responseData.msg='密码不能为空';
       res.json(responseData);
       return
  }
   //用户名是否已经被注册，如果数据库中已经存在和我们要注册的用户名同名的数据，表示已经被注册
   User.findOne({ //.号代表着类的的方法即为静态方法  #号代表对象的方法在使用时需要new object（）来进行使用   findOne({条件，})返回一个promise对象
      username:username
    }).then(function(userInfo){
        if(userInfo){
            //表示数据库中有该记录 
            responseData.code=4;
            responseData.msg='用户名已存在';
            res.json(responseData)
            return;
        }else{
             //表示没有用户，需要保存用户
             var hash = Crypto.createHash('sha1');   //-->加密 使用sha1进行加密
             hash.update(password);   //加密password
            //表示没有用户，需要保存用户
            var  user = new User({
                username:req.body.name,
                password:hash.digest('hex')  //此时的password已经加密完毕
            });

           
            //如果是你要操作数据库删文件 就是remove方法
            user.save().then(function(newuserInfo){  //-->此处的then接收到的是save()之后传回的promise一定要then（）不然会抛异常
                /**
                 * 此处的then不可以写到其他地方，出现promiseyi
                 */
                console.log(newuserInfo)
                res.json({code: 200, msg: '注册成功'});
                return
                /**
                 * { __v: 0,
                     username: '张维虎',
                    password: '10291992zwh',
                    _id: 59f955c5a30a391fe885b5df }  --->数据库自己生成的唯一ID
                */
                }) 
        }
    })
   
})


// // 查询文章列表路由 用于博客前端展示数据不包含草稿内容
// router.get('/api/articleList', function(req, res){
//     db.Article.find({state: "publish"}, function(err, docs){
//         if (err) {
//             console.log('出错'+ err);
//             return
//         }
//         res.json(docs)
//     })
// });
// // 按标签ID查询文章列表路由 用于博客前端展示数据不包含草稿内容
// router.post('/api/articleList', function(req, res){
//     db.TagList.find({_id: req.body.tagId}, function(err, docs){
//         if (err) {
//             res.status(500).send();
//             return
//         }
//         db.Article.find({label: docs[0].tagName,state: "publish"}, function(err, docs){
//             if (err) {
//                 res.status(500).send();
//                 return
//             }
//             res.json(docs)
//         })
//     })
// });
// // 查询文章列表路由 用于博客后端管理系统包含草稿和已发布文章数据
// router.get('/api/admin/articleList', function(req, res){
//     db.Article.find({}, function(err, docs){
//         if (err) {
//             console.log('出错'+ err);
//             return
//         }
//         res.json(docs)
//     })
// });
// // 查询文章列表路由(根据标签返回对应的文章列表) 用于博客后端管理系统包含草稿和已发布文章数据
// router.post('/api/admin/articleList', function(req, res){
//     db.Article.find({label: req.body.label}, function(err, docs){
//         if (err) {
//             console.log('出错'+ err);
//             return
//         }
//         res.json(docs)
//     })
// });
// // 查询文章详情路由
// router.get('/api/articleDetails/:id', function(req, res){
//     db.Article.findOne({_id: req.params.id}, function(err, docs){
//         if (err) {
//             return
//         }
//         res.send(docs)
//     })
// });
// router.post('/api/articleDetails', function(req, res){
//     db.Article.findOne({_id: req.body.id}, function(err, docs){
//         if (err) {
//             return
//         }
//         res.send(docs)
//     })
// });
// // 文章保存路由
// router.post('/api/saveArticle', function(req, res){
//     new db.Article(req.body.articleInformation).save(function(error){
//         if (error) {
//             res.status(500).send()
//             return
//         }
//         if (req.body.articleInformation.state != 'draft') {
//             db.Article.find({label:req.body.articleInformation.label},function(err, ArticleList){
//                 if (err) {
//                     return
//                 }
//                 db.TagList.find({tagName:req.body.articleInformation.label}, function(err, docs){
//                     if(docs.length>0){
//                         docs[0].tagNumber = ArticleList.length
//                         db.TagList(docs[0]).save(function(error){})
//                     }
//                 })
//             })
//         }
//         res.send()
//     })
// });

// // 文章更新路由
// router.post('/api/updateArticle', function(req, res){
//     db.Article.find({_id: req.body.obj._id}, function(err, docs){
//         if(err){
//             return
//         }
//         docs[0].title = req.body.obj.title
//         docs[0].articleContent = req.body.obj.articleContent
//         // 不更新文章更改时间
//         docs[0].date = docs[0].date
//         docs[0].state = req.body.obj.state
//         docs[0].label = req.body.obj.label
//         db.Article(docs[0]).save(function(err){
//             if (err){
//                 res.status(500).send();
//                 return
//             }
//             res.send()
//         })
//     })
// });

// // 删除文章
// router.post('/api/delect/article', function(req, res){
//     db.Article.remove({_id: req.body._id}, function(err, docs){
//         if (err) {
//             res.status(500).send();
//             return
//         }
//         res.send()
//     })
// })

// // 文章标签查询路由
// router.get('/api/getArticleLabel', function(req, res){
   
//     db.TagList.find({}, function(err, docs){
//         if (err)return;
//         res.json(docs)
//     })
// });
// // 文章标签保存路由
// router.post('/api/saveArticleLabel', function(req, res){
//     db.TagList.find({}, function(err, docs){
//         if(err)return;
//         var isExist = false;
//         docs.forEach(function(item){
//             if(item.tagName == req.body.tagList.tagName){
//                 isExist = true;
//             }
//         })
//         if (isExist){
//             res.json({error: true, msg: '标签已存在'})
//         }else{
//             new db.TagList(req.body.tagList).save(function(error){
//                 if (error) {
//                     res.send('保存失败');
//                     return
//                 }
//                 res.send()
//             })
//         }
//     })
// });
// // 博客信息路由
// router.post('/api/save/personalInformation', function(req, res){
//     db.PersonalInformation.find({}, function(err, docs){
//         if (err) {
//             res.status(500).send();
//             return
//         }
//         if(docs.length>0){
//             docs[0].name = req.body.form.name
//             docs[0].individualitySignature = req.body.form.individualitySignature
//             docs[0].introduce = req.body.form.introduce
//             db.PersonalInformation(docs[0]).save(function(err){
//                 if (err) {
//                     res.status(500).send();
//                     return
//                 }
//                 res.send();
//             })
//         } else {
//             new db.PersonalInformation(req.body.from).save(function(err){
//                 if (err){
//                     res.status(500).send();
//                     return
//                 }
//                 res.send();
//             })
//         }
//     })
// })

// router.get('/api/personalInformation', function(req, res){
//     db.PersonalInformation.find({}, function(err, docs){
//         if (err) {
//             res.status(500).send();
//             return
//         }
//         res.json(docs)
//     })
// })

module.exports = router