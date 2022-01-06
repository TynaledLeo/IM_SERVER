// 引入依赖
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const os = require('os');
const mysql = require('mysql');


//数据库配置
var connection = mysql.createConnection({
  host     : '42.193.107.6',
  user     : 'root',
  password : 'root',
  database : 'IM'
});
connection.connect();

// 组装
app.use(bodyParser.urlencoded({ extended: false }));

// 打印服务器参数
console.log('服务器信息：',os.hostname());
console.log('架构：',os.arch());
console.log('操作系统：',os.type(),os.platform(),os.release());
console.log('负载：',os.freemem()/os.totalmem());


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



// POST请求
// /login登录
app.post('/login', (req, res) => {
    const current = new Date();
    let username = req.body.username;
    let password = req.body.password;
	console.log(username+'请求登录');
    let query = `SELECT IM_USER_PASSWORD FROM IM_USER WHERE IM_USER_NAME = '${username}'`;  
    connection.query(query, function (error, results) {

        if (error){
            console.log(error);
            res.status(500).send('Something broke!');
        }
        if (results && results.length!==0 && password === results[0].IM_USER_PASSWORD) {
	        console.log(username+'登录成功 IN '+current);
            res.send("OK");      
        }else{
            console.log(username+'登录失败 IN '+current);
            res.send("ERROR")
        }
      });
    }
)    




let server = app.listen(8642, function () {
  const port = server.address().port
  console.log(">_服务已经在%s端口开启", port)
})