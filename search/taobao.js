const request = require('syncrequest');
const convert = require('xml-js');
const cheerio = require('cheerio');
var _ = require('lodash');
var cookie = require('./../json/cookie.js');

exports.search1 = function(keyword,page,pageSize){
	var data = [];
	var responseBody =  request.sync('http://otapi.net/OtapiWebService2.asmx/SearchItemsFrame?instanceKey=opendemo&language=en&xmlParameters=%3CSearchItemsParameters%3E%3CProvider%3ETaobao%3C%2FProvider%3E%3CItemTitle%3E'+ encodeURIComponent(keyword) +'%3C%2FItemTitle%3E%3C%2FSearchItemsParameters%3E&framePosition='+ (page-1)*pageSize +'&frameSize=' + pageSize).body;
	var apiData = convert.xml2json(responseBody, {compact: true, spaces: 4});
	var api = JSON.parse(apiData).OtapiItemSearchResultAnswer.Result.Items.Content.Item;
	_.each(api,function(el,index){
		data.push({
			itemId : el.Id._text,
			title : el.OriginalTitle._text,
			image : el.MainPictureUrl._text,
			price : el.Price.OriginalPrice._text,
			promoPrice : (el.Price.PromotionPrice)?el.Price.PromotionPrice._text:el.Price.OriginalPrice._text,
			shop : el.VendorName._text,
			//stock : el.Volume._text,
			//shopScore : el.VendorScore._text
		});
	});
	return data;
}

exports.search2 = function(keyword,page,pageSize){
	var url = 'https://s.taobao.com/search?q=' + encodeURIComponent(keyword) + '&s=' + (page-1)*pageSize +'&type=p'
	var responseBody = request.sync(url,{headers:{'cookie':cookie.cookieTaobao(),'user-agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.135 Safari/537.36'}}).body;
	var data = [];

	var start = responseBody.indexOf('g_page_config =') + 15;
	var length = responseBody.indexOf('g_srp_loadCss();');
	var api = JSON.parse(responseBody.substring(start,length).replace("}};","}}"));
	_.each(api.mods.itemlist.data.auctions,function(el,index){
		data.push({
			itemId : el.nid,
			title : el.raw_title,
			image : "https:" + el.pic_url,
			price : el.view_price,
			promoPrice : el.view_price,
			shop : el.nick
		});
	});
	return data;
}

exports.apiTaobao = function(keyword,page,pageSize){
	//return encodeURIComponent(keyword);
	//return keyword;
	//var data = [];
	var url = 'https://api.api-taobao.com/search/node/taobao/'+ encodeURIComponent(keyword) +'/'+page;
	return request.sync(url);
	/*const $ = cheerio.load(responseBody);
	$('div[class=product-item]').each(function(i, elem) {
		var promoPrice = $(this).find('div[class=item-list_cost_new]').text().replace(/\s/g,'').replace('$','');
		var price = $(this).find('div[class=item-list_cost_old]').text().replace(/\s/g,'').replace('$','');
  	data.push({
			itemId : $(this).find('a').attr('href').replace('/item?id=',''),
			title : "",
			image : $(this).find('img').attr('src'),
			promoPrice : (promoPrice)?promoPrice:price,
			price : (price)?price:promoPrice,
			shop : $(this).find('a[class="vendor-url"]').text(),
		});
	});
	return data;*/
	//return responseBody;
}

exports.search3 = function(keyword,page,pageSize){
	var data = [];
	const options = {
	  url : 'https://api.api-taobao.com/get/ot/' + keyword + '/' + page,
	  headers: {
			 'user-agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36'
	  }
	};
	var responseBody = request.sync(options).body;
	const $ = cheerio.load(responseBody);
	$('div[class=product-item]').each(function(i, elem) {
		var promoPrice = $(this).find('div[class=item-list_cost_new]').text().replace(/\s/g,'').replace('$','');
		var price = $(this).find('div[class=item-list_cost_old]').text().replace(/\s/g,'').replace('$','');
  	data.push({
			itemId : $(this).find('a').attr('href').replace('/item?id=',''),
			title : "",
			image : $(this).find('img').attr('src'),
			promoPrice : (promoPrice)?promoPrice:price,
			price : (price)?price:promoPrice,
			shop : $(this).find('a[class="vendor-url"]').text(),
		});
	});
	return data;
}

exports.weshopchina = function(keyword,page,provider){
	var data = [];
	var url = "https://weshopchina.com/external/get_search_json.php";
	var res = request.post.sync(url, {
		headers: {
    	'content-type': 'application/x-www-form-urlencoded'
  	},
		body: "q=" + keyword + "&page=" + page + "&website=" + provider
	}).body;
	JSON.parse(res).items.forEach(function(item){
		data.push({
			itemId : item.taobaoURL.substring(item.taobaoURL.indexOf("id=")+3),
			title : "",
			image : item.pictureURL,
			promoPrice : item.price,
			price : item.price,
			shop : "",
		});
	});
	return data;
}

exports.laonet = function(keyword,page=1){
	var url = "https://laonet.online/index.php?route=api_tester/call&api_name=item_search&q="+ encodeURIComponent(keyword) +"&start_price=0&end_price=0&page="+ page +"&key=apichinaservicebzw";
	var response = request.sync(url).body;
	var json = JSON.parse(response);
	var data = [];
	json.items.item.forEach(function(item){
		data.push({
			itemId : item.num_iid,
			title : item.title,
			image : "https:"+item.pic_url,
			promoPrice : item.promotion_price,
			price : item.price,
			shop : item.seller_nick,
		});
	});
	return data;
}

exports.vcanbuy = function(keyword,page=1){
	//var url = "https://www.vcanbuy.com/gateway/docking/taobao/item/get_list?keywords="+ encodeURIComponent(keyword) +"&page="+ page +"&page_size=20&order_by=price_asc";
	var url = "https://www.vcanbuy.com/gateway/docking/taobao/item/get_list?keywords="+ encodeURIComponent(keyword) +"&page="+ page +"&page_size=20&order_by=total_sale_desc";
	var response = request.sync(url).body;
	var json = JSON.parse(response);
	var data = [];
	json.datalist.forEach(function(item){
		data.push({
			itemId : item.thid_item_id,
			title : item.item_name,
			image : item.img_url,
			promoPrice : item.activity_price/100,
			price : item.price/100,
			shop : item.shop_name,
		});
	});
	return data;
}

exports.khaisong = function(keyword,page=1){
	var url = "https://www.khaisong.com/index.php?route=product/search&search="+keyword+"&description=true&page="+pages
	var response = request.sync(url).body;
}

function translate(text,lang='th'){
	var key = 'trnsl.1.1.20200818T123519Z.d90a8b5d03396e0a.c0139ff91e28377ea5f0521b01b80629d034920d';
	var url = 'https://translate.yandex.net/api/v1.5/tr.json/translate?key=' + key + '&text=' + encodeURIComponent(text) + '&lang=zh-' + lang;
	return JSON.parse(request.sync(url).response.body).text[0];
}
