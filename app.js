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
const cache = require('express-redis-cache')({
	//host: "db-redis-blr1-64229-do-user-1467441-0.db.ondigitalocean.com",
	//port: 25061,
	//auth_pass: "iqcpyr0pqa07slv8",
	expire: 2592000
});
const expressip = require('express-ip');
const app = express();
const port = 4148;
const requestIp = require('request-ip');
var responseTime = require('response-time');

//app.use(responseTime())
app.use(requestIp.mw())

//app.use(ipfilter(whitelist.ips, {mode: 'allow'}));
// Whitelist the following IPs
//const ips = ['139.59.247.245']
const ips = []
// Create the server
//app.use(ipfilter(ips, {mode: 'allow'}))

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/item/taobao/:id', function(req, res){
	console.log("ip call : "+req.clientIp + "/" + req.params.id);
	//if(!req.clientIp.includes(ips)){
	//if(taobao.ezbuy('taobao',req.params.id).id){
		//res.send(taobao.ezbuy('taobao',req.params.id))
	//}else{*/
		//res.send(taobao.ezbuy('taobao',req.params.id))
		res.send(taobao.weshopchina(req.params.id));
	//}else{
	//	res.status(403)
	//}
	//}
});

app.get('/item/taobao/laonet/:id',cache.route(), function(req, res){
		res.send(taobao.laonet(req.params.id))
});

app.get('/item/taobaoote/:id', function(req, res){
		res.send(taobao.ote(req.params.id))
});

app.get('/itemtest/1688/:id', function(req, res){
		res.send(web1688.protaobao(req.params.id))
});

app.get('/item/taobao/option/:id', function(req, res){
	if(taobao.taobao(req.params.id).price.length == 0){
		res.send("no price");
	}else{
		res.send(taobao.taobao(req.params.id));
	}
});

app.get('/item/taobao/translate/:id', function(req, res){
	res.send(taobao.ezbuyTranslate('taobao',req.params.id));
	/*if(res.send(taobao.ezbuy('taobao',req.params.id))){
		res.send(res.send(taobao.ezbuy('taobao',req.params.id)));
	}else{*/
  //res.send(taobao.taobaoTranslate(req.params.id));
	//}
});

app.get('/item/taobao/test/translate/:id', function(req, res){
	try{
		res.send(taobao.ezbuyTranslate(req.params.id));
	}catch{
		res.send(taobao.taobaoTranslate(req.params.id));
	}
});

app.get('/item/taobao/translate/:id/:lang', function(req, res){
	//if(taobao.ezbuy('taobao',req.params.id).id){
	//	res.send(taobao.ezbuyTranslate('taobao',req.params.id,req.params.lang))
	//}else{
		res.send(taobao.taobaoTranslate(req.params.id,req.params.lang))
	//}
});

app.get('/item/tmall/:id', function(req, res){
	res.send(taobao.weshopchina(req.params.id));
});

app.get('/item/tmall/translate/:id', function(req, res){
	//if(taobao.ezbuy('taobao',req.params.id).id){
	//	res.send(taobao.ezbuyTranslate('taobao',req.params.id))
	//}else{
		res.send(taobao.taobaoTranslate(req.params.id))
	//}
});

app.get('/itemweshop/taobao/:id', function(req, res){
	res.send(taobao.weshopchina(req.params.id))
});

app.get('/itemweshop/taobao/translate/:id',cache.route(), function(req, res){
	res.send(taobao.weshopchinaTranslate(req.params.id,0))
});

app.get('/itemweshop/1688/:id', function(req, res){
	//if(!req.clientIp.includes(ips)){
		res.send(web1688.weshopchina(req.params.id,1))
	//}else{
///		res.status(403)
//	}
});

app.get('/itemoriginal/1688/:id', function(req, res){
	res.send(web1688.original(req.params.id))
	//res.send(web1688.protaobao(req.params.id))
});

app.get('/item/1688/:id', function(req, res){
	//if(!req.clientIp.includes(ips)){
		res.send(web1688.weshopchina(req.params.id,1))
	//}else{
	//	res.send("access denied")
	//}
	//res.send(web1688.protaobao(req.params.id))
});

app.get('/item/1688/test/:id', function(req, res){
	//res.send(taobao.ezbuy('1688',req.params.id))
	res.send(web1688.shop(req.params.id))
});

app.get('/item/1688/translate/:id', function(req, res){
	res.send(taobao.ezbuyTranslate('1688',req.params.id))
});

app.get('/search/taobao/:keyword/:page?/:pageSize?',cache.route(), function(req, res){
	if(!req.clientIp.includes(ips)){
		var page = (req.params.page)?req.params.page:1;
		var pageSize = (req.params.pageSize)?req.params.pageSize:20;
		res.send(searchTaobao.search1(req.params.keyword,page,pageSize))
	}else{
		res.send("access denied")
	}
});

app.get('/search/vcanbuy/taobao/:keyword/:page?/:pageSize?',cache.route(), function(req, res){
	if(!req.clientIp.includes(ips)){
		var page = (req.params.page)?req.params.page:1;
		res.send(searchTaobao.vcanbuy(req.params.keyword,page))
	}else{
		res.send("access denied")
	}
});

app.get('/searchapi/taobao/:keyword/:page?/:pageSize?', function(req, res){
	var page = (req.params.page)?req.params.page:1;
	var pageSize = (req.params.pageSize)?req.params.pageSize:20;
	res.send(searchTaobao.apiTaobao(req.params.keyword,page,pageSize))
});

app.get('/search2/taobao/:keyword/:page?',cache.route(), function(req, res){
	var page = (req.params.page)?req.params.page:1;
	res.send(searchTaobao.laonet(req.params.keyword,page))
});

app.get('/search3/taobao/:keyword/:page?',cache.route(), function(req, res){
	var page = (req.params.page)?req.params.page:1;
	res.send(searchTaobao.search2(req.params.keyword,page))
});

app.get('/search2/1688/:keyword/:page?',cache.route(), function(req, res){
	var page = (req.params.page)?req.params.page:1;
	res.send(search1688.laonet(req.params.keyword,page))
});

app.get('/searchweshop/taobao/:keyword/:page?/:pageSize?', function(req, res){
	if(!req.clientIp.includes(ips)){
		var page = (req.params.page)?req.params.page:1;
		var pageSize = (req.params.pageSize)?req.params.pageSize:20;
		res.send(searchTaobao.weshopchina(req.params.keyword,page,0))
	}else{
		res.send("access denied")
	}
});

app.get('/search/test/1688/:keyword/:page?/:pageSize?', function(req, res){
	var page = (req.params.page)?req.params.page:1;
	var pageSize = (req.params.pageSize)?req.params.pageSize:20;
	res.send(search1688.search1(req.params.keyword,page,pageSize))
});

app.get('/search/1688/:keyword/:page?/:pageSize?',cache.route(), function(req, res){
	if(!req.clientIp.includes(ips)){
		var page = (req.params.page)?req.params.page:1;
		var pageSize = (req.params.pageSize)?req.params.pageSize:20;
		res.send(search1688.search1(req.params.keyword,page,pageSize))
	}else{
		res.send("access denied")
	}
});

app.get('/showcase/:keyword/:pageSize?',cache.route(), function(req, res){
	if(!req.clientIp.includes(ips)){
		var pageSize = (req.params.pageSize)?req.params.pageSize:20;
		res.send(searchTaobao.search2(req.params.keyword,req.params.page,pageSize))
	}else{
		res.send("access denied")
	}
});

// Starting both http & https servers
const httpServer = http.createServer(app);
//const httpsServer = https.createServer(credentials, app);

httpServer.listen(port, () => {
	console.log('HTTP Server running on port '+port);
});

/*httpsServer.listen(443, () => {
	console.log('HTTPS Server running on port 443');
});*/
