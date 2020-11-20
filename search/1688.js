const request = require('syncrequest');
const convert = require('xml-js');
var _ = require('lodash');
var cookie = require('./../json/cookie.js');
var cheerio = require('cheerio')
const translatte = require('translatte');

exports.search1 = function(keyword,page,pageSize){
	var data = [];
	const options = {
	  url : 'https://m.1688.com/offer_search/-6D7033.html?keywords=' + encodeURI(keyword) + '&beginPage=' + page + '&pageSize=' + pageSize,
	  headers: {
			 'cookie':cookie.cookie1688(),
			 'user-agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36'
	  },
	};
	var responseBody = request.sync(options).body;
	var $ = cheerio.load(responseBody);
	$("div[class=list_group-item]").each(function(index, el) {
		data.push({
			itemId : $(this).attr('data-offer-id'),
			title : $(this).find('img').attr('alt'),
			image : $(this).find('img').attr('data-src'),
			price : parseFloat($(this).find('div[class=count_price]').text().replace('￥','').trim()),
			promoPrice : parseFloat($(this).find('div[class=count_price]').text().replace('￥','').trim()),
			shop : "1688",
		});
	});
	return data;
	//return responseBody;
}

exports.search2 = function(keyword,page,pageSize){
	var data = [];
	const options = {
		//url : "https://s.1688.com/selloffer/offer_search.htm?keywords=" + keyword + "&beginPage=" + page,
	  url : 'https://s.1688.com/selloffer/offer_search.htm?keywords=' + encodeURIComponent(keyword) + '&beginPage=' + page + '&pageSize=' + pageSize,
	  headers: {
			 'cookie':cookie.cookie1688(),
			 'user-agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36'
	  },
	};
	var responseBody = request.sync(options).body;
	var start = "window.data.offerresultData=successDataCheck";
	var end = "window.data.pageConfigData=successDataCheck";
	var responseJson = responseBody.substring(responseBody.indexOf(start),responseBody.indexOf(end)).replace("window.data.offerresultData=successDataCheck(","").replace("});","}");
	var json = JSON.parse(responseJson).data.offerList;
	_.each(json,function(item){
		data.push({
			itemId : item.id,
			title : item.information.simpleSubject,
			image : item.image.imgUrl,
			price : item.tradePrice.offerPrice.valueString,
			promoPrice : item.tradePrice.offerPrice.valueString,
			shop : item.company.name,
		});
	});
	return data;
}

exports.laonet = function(keyword,page=1){
	var url = "https://1688.laonet.online/index.php?route=api_tester/call&api_name=item_search&q="+ encodeURIComponent(keyword) +"&start_price=0&end_price=0&page="+ page +"&key=apichinaservicebzw";
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
