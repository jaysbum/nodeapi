const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');
const taobao = require('./data/taobao');
const web1688 = require('./data/1688');
const searchTaobao = require('./search/taobao');
const search1688 = require('./search/1688');
const whitelist = require('./account/whitelist');
const ipfilter = require('express-ipfilter').IpFilter;
const cache = require('express-redis-cache')({expire: 2592000});
const expressip = require('express-ip');
const app = express();
const port = 8080;
const requestIp = require('request-ip');
var responseTime = require('response-time');

app.use(responseTime())
app.use(requestIp.mw())

app.use(ipfilter(whitelist.ips, {mode: 'allow'}));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/item/taobao/:id', function(req, res){
	if(taobao.ezbuy('taobao',req.params.id).id){
		res.send(taobao.ezbuy('taobao',req.params.id))
	}else{
		res.send(taobao.taobao(req.params.id))
	}
});

app.get('/item/taobao/option/:id', function(req, res){
	res.send(taobao.data2(req.params.id))
});

app.get('/item/taobao/translate/:id', function(req, res){
	if(taobao.ezbuy('taobao',req.params.id).id){
		res.send(taobao.ezbuyTranslate('taobao',req.params.id))
	}else{
		res.send(taobao.taobaoTranslate(req.params.id))
	}
});

app.get('/item/taobao/translate/:id/:lang', function(req, res){
	if(taobao.ezbuy('taobao',req.params.id).id){
		res.send(taobao.ezbuyTranslate('taobao',req.params.id,req.params.lang))
	}else{
		res.send(taobao.taobaoTranslate(req.params.id,req.params.lang))
	}
});

app.get('/item/tmall/translate/:id', function(req, res){
	res.send(taobao.dataTranslate1(req.params.id))
});

app.get('/item/1688/:id', function(req, res){
	res.send(taobao.ezbuy('1688',req.params.id))
	//res.send(web1688.protaobao(req.params.id))
});

app.get('/item/1688/test/:id', function(req, res){
	//res.send(taobao.ezbuy('1688',req.params.id))
	res.send(web1688.protaobao(req.params.id))
});

app.get('/item/1688/translate/:id', function(req, res){
	res.send(taobao.ezbuyTranslate('1688',req.params.id,req.params.lang))
});

app.get('/search/taobao/:keyword/:page?/:pageSize?', function(req, res){
	var pageSize = (req.params.pageSize)?req.params.pageSize:20;
	res.send(searchTaobao.search2(req.params.keyword,req.params.page,pageSize))
});

app.get('/search/1688/:keyword/:page?/:pageSize?', function(req, res){
	var pageSize = (req.params.pageSize)?req.params.pageSize:20;
	res.send(search1688.search1(req.params.keyword,req.params.page,pageSize))
});

app.get('/showcase/:keyword/:pageSize?', function(req, res){
	var pageSize = (req.params.pageSize)?req.params.pageSize:20;
	res.send(searchTaobao.search2(req.params.keyword,req.params.page,pageSize))
});

// Certificate
//const privateKey = fs.readFileSync('/etc/letsencrypt/live/node.api-taobao.com/privkey.pem', 'utf8');
//const certificate = fs.readFileSync('/etc/letsencrypt/live/node.api-taobao.com/cert.pem', 'utf8');
//const ca = fs.readFileSync('/etc/letsencrypt/live/node.api-taobao.com/chain.pem', 'utf8');

/*const credentials = {
	key: privateKey,
	cert: certificate,
	ca: ca
};*/

// Starting both http & https servers
const httpServer = http.createServer(app);
//const httpsServer = https.createServer(credentials, app);

httpServer.listen(port, () => {
	console.log('HTTP Server running on port 80');
});

/*httpsServer.listen(443, () => {
	console.log('HTTPS Server running on port 443');
});*/
