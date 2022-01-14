// 引入依赖
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const os = require('os');
const mysql = require('mysql');
const http = require('http');
const imserver = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(imserver);

// // 日志服务
//  function logService(user,action){

//     console.log(user+'执行了'+action);
//     const action 

// }



//IM服务
io.on('connection', (socket) => {

    console.log('有客户端接入了IM服务:');

    socket.on('disconnect',() => {   // 断开连接的监听要放在连接监听里面
        console.log('有客户端断开了IM服务:');
    });
//通讯接收流道
    socket.on('msg',(re)=>{
        const sender = re.from;
        const receiver = re.to;
        const msg = re.msg; 

// 存储消息记录 
        let query = 'INSERT INTO im.im_msg_list (IM_MSG_FROM, IM_MSG_TO, IM_MSG_ISREAD, IM_MSG, IM_MSG_TS) VALUES (?, ?, DEFAULT, ?, DEFAULT)'
        let queryParam = [sender,receiver,msg]
        console.log(sender+'向'+receiver+'发送了消息：'+msg);
        connection.query(query,queryParam,function (error,results) {
            if (error) {
                console.log(error);
            }else{
                console.log(results);
            }
        })
//
// 日志记录

//向指定接收方发送消息
        io.emit(`msg_${receiver}`,{
            msg:msg,
            from:sender
        });
    })

});
  
imserver.listen(2468, () => {
    console.log('IM服务在2468端口开启:');
});





// 组装
app.use(bodyParser.urlencoded({ extended: false }));

// 打印服务器参数
console.log('服务器信息：',os.hostname());
console.log('架构：',os.arch());
console.log('操作系统：',os.type(),os.platform(),os.release());
console.log('负载：',os.freemem()/os.totalmem());

//数据库配置
var connection = mysql.createConnection({
    host     : '42.193.107.6',
    user     : 'root',
    password : 'root',
    database : 'IM'
  });
  connection.connect();
  console.log("成功与数据库建立了连接");
  

//设置允许跨域
app.all("*",function(req,res,next){
    //设置允许跨域的域名，*代表允许任意域名跨域
    res.header("Access-Control-Allow-Origin","*");
    //允许的header类型
    res.header("Access-Control-Allow-Headers","content-type");
    //跨域允许的请求方式 
    res.header("Access-Control-Allow-Methods","DELETE,PUT,POST,GET,OPTIONS");
    if (req.method.toLowerCase() == 'options')
        res.send(200);  //让options尝试请求快速结束
    else
        next();
})



// GET请求
app.get('/', (req, res) => {
	console.log(req.query);
    if (req.query!==null) {
        res.send("?");
    }
});

//getinvitelist
app.get('/getinvitelist',(req,res)=>{
    const x = req.query.user;
    const sql = 'SELECT IM_FRIEND_FROM FROM IM_FRIEND_LIST WHERE IM_FRIEND_TO = ? AND IM_FRIEND_STATUS_ID = 1'
    let sqlParam = [x]
    connection.query(sql,sqlParam,function(err,results) {
        if (err) {
            console.log(err);
        } else {
            res.send(results);
        }
    })
})


//搜索用户/queryuser
app.get('/queryuser', (req, res) => {
    if (req.query && req.query.name ) {
        let x = req.query.name;

        console.log('查询名为'+x+'的用户：');
        const sql = 'SELECT * FROM IM_USER WHERE IM_USER_NAME = ?'
        let sqlParam = [x]
        connection.query(sql,sqlParam,function(error,results){
            if (error) {
                console.log(error);
                res.send('ERROR');
                return;
            }
            if (results && results.length!==0) {
                console.log(results[0]);
                res.send({
                    name:results[0].IM_USER_NAME,
                    account:results[0].IM_USER_ACC,
                    status:results[0].IM_USER_STATUS_ID,
                    desc:results[0].IM_USER_DESC
                })
            }else{
                res.send("ERROR")
                console.log("查询失败");
                return;
            }
            return;
        })
    }else{
        console.log("5");
        res.send("ERROR");
        return;
    }
});

//getFriendList
app.get('/getFriendList',(req,res)=> {
    console.log('正在请求'+req.query.name+'的好友列表：');
    const query1 = `SELECT IM_FRIEND_FROM FROM IM_FRIEND_LIST WHERE IM_FRIEND_TO = ? AND IM_FRIEND_STATUS_ID = '2'`
    const query2 = `SELECT IM_FRIEND_TO FROM IM_FRIEND_LIST WHERE IM_FRIEND_FROM = ? AND IM_FRIEND_STATUS_ID = '2'`
    const queryParam = [req.query.name];
    let queryResultList1,queryResultList2;
    connection.query(query1,queryParam,function (error,results) {
        if(error){
            console.log(error);
        }else{
            queryResultList1 = results.map((item)=>{
                return {
                  name: item['IM_FRIEND_FROM']
                }
              })
            connection.query(query2,queryParam,function (error,results) {
                if(error){
                    console.log(error);
                }else{
                let temp = results.map((item)=>{
                    return {
                      name: item['IM_FRIEND_TO']
                    }
                  }) 
                queryResultList2 = temp.concat(queryResultList1);
                console.log(queryResultList2);
                console.log("以上数据已经返回给了客户端");
                res.send(queryResultList2); 
                }
            })
        }
    })

})

// /getMsgList
app.get('/getMsgList',(req,res)=>{
    console.log(`${req.query.from}查询了与${req.query.to}的消息记录`);
    let query = `SELECT * FROM IM_MSG_DOCK WHERE ( IM_MSG_FROM = '${req.query.from}' AND IM_MSG_TO = '${req.query.to}') OR (IM_MSG_FROM = '${req.query.to}' AND IM_MSG_TO = '${req.query.from}')`;  
    connection.query(query, function (error,results){
        if (error) {
            res.send(error);
        }else{
            res.send(results);
        }
    })
})


// POST请求
// /login登录
app.post('/login', (req, res) => {
    const current = new Date();
    let username = req.body.username;
    let password = req.body.password;
	console.log(username+'请求登录：');
    let query = 'SELECT IM_USER_PASSWORD FROM IM_USER WHERE IM_USER_NAME = ?';  
    let queryParam = [username,password];
    let onlineQuery = 'UPDATE im.im_user t SET t.IM_USER_STATUS_ID = 3 , t.IM_USER_LAST_ACT_TIME = NOW() WHERE t.IM_USER_NAME = ?'
    let onlineQueryParam = [username];
    connection.query(query, queryParam, function (error, results) {
        if (error){
            console.log(error);
            res.status(500).send('Something broke!');
        }
        if (results && results.length!==0 && password === results[0].IM_USER_PASSWORD) {
	        console.log(username+'登录成功 IN '+current);
            connection.query(onlineQuery,onlineQueryParam,function (err,results) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(username+'已上线');
                }
            })
            res.send("OK");      
        }else{
            console.log(username+'登录失败 IN '+current);
            res.send("ERROR")
        }
      });
    }
)    



//reg
app.post('/reg',(req,res)=>{
    const x = req.body;
    let query = 'SELECT IM_USER_ID FROM IM_USER WHERE (IM_USER_NAME = ?) OR (IM_USER_ACC = ?)' ;
    let queryParam = [x.username,x.account];
    let regQuery = 'INSERT INTO im.im_user (IM_USER_NAME, IM_USER_ACC, IM_USER_PASSWORD, IM_USER_STATUS_ID, IM_USER_PHONE, IM_USER_DESC, IM_USER_REG_DATE, IM_USER_BIRTH_DATE, IM_USER_LAST_ACT_TIME) VALUES (?, ?, ?, DEFAULT, ?, ?, DEFAULT, ?, DEFAULT)';
    let regQueryParam = [ x.username, x.account, x.password, x.phone, x.desc, x.birthday ];
    //检查重复用户名/账号
    connection.query(query,queryParam,function (err,results) {
        if (err) {
            console.log(err);
        }else{
            if (results.length) {
                res.send("101");
            }else{
                // 注册
                connection.query(regQuery,regQueryParam,function (err, results) {
                    if (err) {
                        console.log(err);
                    } else {
                        res.send("201");
                    }
                })

            }
        }
    })
})

//offline
app.post('/offline',(req,res)=>{

    res.send("?")

})

//add friend
app.post('/addfriend',(req,res)=>{
    let x = req.body
    let sql = 'SELECT IM_FRIEND_STATUS_ID FROM IM_FRIEND_LIST WHERE IM_FRIEND_FROM = ? AND IM_FRIEND_TO = ?';
    let sqlParam = [x.from,x.to];
    let addSql = 'INSERT INTO im.im_friend_list (IM_FRIEND_FROM, IM_FRIEND_TO, IM_FRIEND_STATUS_ID) VALUES (?, ?, 1)';
    connection.query(sql,sqlParam,function (err,results) {
        if (err) {
            console.log(err);
        } else {
            if (results.length) {
                res.send(`${results[0].IM_FRIEND_STATUS_ID}`);
            } else {
                connection.query(addSql,sqlParam,function(err,results) {
                    if (err) {
                        console.log(err);
                    } else {
                        res.send("OK");
                        // io.emit(`recv_${x.to}`,{
                        //     msg:"向你发出了好友请求",
                        //     from:x.from
                        // });
                    }
                })
            }
        }
    })
})

//addConfirm
app.post('/addconfirm',(req,res)=>{
    let x = req.body;
    const sql = 'UPDATE im.im_friend_list t SET t.IM_FRIEND_STATUS_ID = ? WHERE t.IM_FRIEND_FROM = ? AND t.IM_FRIEND_TO = ?';
    const delSql = 'DELETE FROM im.im_friend_list t WHERE t.IM_FRIEND_FROM = ? AND t.IM_FRIEND_TO = ?';
    let sqlParam;

    console.log(x.code,11);
    if (x.code==0) {
        sqlParam = [x.from,x.to];
        connection.query(delSql,sqlParam,function (err,results) {
            if (err) {
                console.log(err);
            } else {
                console.log(results);
            }
        })
    } else {
        sqlParam=[x.code,x.from,x.to];
        connection.query(sql,sqlParam,function (err,results) {
            if (err) {
                console.log(err);
            } else {
                console.log(results);
            }
        })
    }

    res.send("OK")
})


let server = app.listen(8642, function () {
  const port = server.address().port
  console.log("主服务已经在%s端口开启：", port)
})