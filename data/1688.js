const request = require('syncrequest');
const cheerio = require('cheerio')
const _ = require('lodash');
var cookie = require('./../json/cookie.js');
const iconv  = require('iconv-lite');
const NodeCache = require( "node-cache" );
const cache = new NodeCache();

exports.data = function(id){
	var responseBody =  request.sync('https://www.vcanbuy.com/gateway/docking/alibaba/item/new/get_detail?third_item_id=' + id).body;
	var apiData = JSON.parse(responseBody).data;
	var skus = [];
	var skuMap = [];
	var attributes = [];
	var stock = 0;
	var price = [];
	var promoPrice = [];
	apiData.item_prop_list.forEach(function(el, index) {
		if(el.attribute > 0){
			var values = [];
			el.prop_value_list.forEach(function(val, i) {
				values.push({
					data : val.value,
					label : val.value,
					isImage : (val.image!="")?1:0,
					image : val.image,
				});
			});
			skus.push({
				group : el.name,
				value : values
			})
		}else{
			attributes.push(el.name + ":" + el.prop_value_list[0].value)
		}
	});
	apiData.item_sku_list.forEach(function(el,index){
		var value = JSON.parse(el.prop_value);
		var data = [];
		for (var key in value) {
			data.push(value[key]);
		}
		skuMap.push({
			skuMap : data.join(";"),
			price : el.price_real/100,
			promoPrice : el.price/100,
			stock : el.storage
		});
		stock += el.storage;
	});
	if(apiData.price_define_do){
		var priceMap = apiData.price_define_do.num_price_map;
		for (var i in priceMap) {
			price.push({
				price : priceMap[i],
				begin : i
			});
		}
		promoPrice = price;
	}else{
		price.push({
			price : apiData.price_real/100,
			begin : 1
		});
		promoPrice.push({
			price : apiData.price/100,
			begin : 1
		})
	}
	var data = {
		id : id,
		title : apiData.item_name,
		//titleTranslate : translate(apiData.item_name),
		mainImage : apiData.img_url,
		listImage : apiData.img_urls,
		sku : skus.reverse(),
		skuMap : skuMap,
		attribute : attributes,
		stock : stock,
		price : price,
		promoPrice : promoPrice,
		link : "https://detail.1688.com/offer/"+ id +".html",
		vendor : JSON.parse(apiData.props_ext).thirdSellerName,
		detail : apiData.description
	}

	return data;
}

exports.dataTranslate = function(id){
	var responseBody =  request.sync('https://www.vcanbuy.com/gateway/docking/alibaba/item/new/get_detail?third_item_id=' + id).body;
	var apiData = JSON.parse(responseBody).data;
	var skus = [];
	var skuMap = [];
	var attributes = [];
	var attributesOriginal = [];
	var stock = 0;
	var price = [];
	var promoPrice = [];
	apiData.item_prop_list.forEach(function(el, index) {
		if(el.attribute > 0){
			var values = [];
			el.prop_value_list.forEach(function(val, i) {
				values.push({
					data : val.value,
					label : (val.value.match(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/))?translate(val.value):val.value,
					labelOriginal : val.value,
					isImage : (val.image!="")?1:0,
					image : val.image,
				});
			});
			skus.push({
				group : el.name,
				groupOriginal : translate(el.name),
				value : values
			})
		}else{
			attributesOriginal.push(el.name + ":" + el.prop_value_list[0].value);
		}
	});
	apiData.item_sku_list.forEach(function(el,index){
		var value = JSON.parse(el.prop_value);
		var data = [];
		for (var key in value) {
			data.push(value[key]);
		}
		skuMap.push({
			skuMap : data.join(";"),
			price : el.price_real/100,
			promoPrice : el.price/100,
			stock : el.storage
		});
		stock += el.storage;
	});
	if(apiData.price_define_do){
		var priceMap = apiData.price_define_do.num_price_map;
		for (var i in priceMap) {
			price.push({
				price : priceMap[i],
				begin : i
			});
		}
		promoPrice = price;
	}else{
		price.push({
			price : apiData.price_real/100,
			begin : 1
		});
		promoPrice.push({
			price : apiData.price/100,
			begin : 1
		})
	}
	var data = {
		id : id,
		title : apiData.item_name,
		titleTranslate : translate(apiData.item_name),
		mainImage : apiData.img_url,
		listImage : apiData.img_urls,
		sku : skus.reverse(),
		skuMap : skuMap,
		attribute : translate(attributesOriginal.join("||")).split("||"),
		attributeOriginal : attributesOriginal,
		stock : stock,
		price : price,
		link : "https://detail.1688.com/offer/"+ id +".html",
		promoPrice : promoPrice,
		vendor : JSON.parse(apiData.props_ext).thirdSellerName,
		detail : apiData.description
	}

	return data;
}

exports.ezbuyTranslate = function(provider,id,lang="th"){
	var sku = [];
	var skuMap = [];
	var priceList = [];
	var attributes = [];
	var itemUrl = "";
	const REGEX = /(\p{Script=Hani})+/gu;
	var url = "https://th-th-web-api.ezbuy.co.th/api/EzProduct/GetProduct";
	if(provider=='taobao'){
		itemUrl = "https://item.taobao.com/item.htm?id="+id
	}else{
		itemUrl = "https://detail.1688.com/offer/"+id+".html"
	}
	var jsonData = {
		"catalogCode":"TH",
		"identifier": itemUrl,
		"entrance":1,
		"src":"10001",
		"userInfo":{
			"customerId":0,
			"isPrime":false
		},
		"loadLocal":false
	}
	var res = request.post.sync(url, { json: jsonData }).body;
	if(res.refId != ""){
	///////// sku /////////////
	res.properties.forEach(function(el,index){
		var tmpValue = [];
		el.propItems.forEach(function(e,i){
			tmpValue.push({
				data : el.propId+":"+e.valueId,
				label : (e.valueTrans.TH.match(REGEX))?translate(e.valueTrans.TH):e.valueTrans.TH,
				labelOriginal : e.value,
				isImage : (e.imageUrl)?1:0,
				image : (e.imageUrl)?e.imageUrl:""
			});
		});
		sku.push({
			group : (el.propTrans.TH.match(REGEX))?translate(el.propTrans.TH):el.propTrans.TH,
			groupOriginal : el.prop,
			value : tmpValue
		});
	});
	///////// end /////////////
	///////// skumap //////////
	res.skus.forEach(function(el,index){
		skuMap.push({
			skuMap : el.propIds.join(";"),
			price : el.price.unitPrice,
			promoPrice : el.price.unitPrice,
			stock : el.quantity
		});
		priceList.push(el.price.unitPrice);
	});
	///////// end /////////////
	///////// price ///////////
	var price = [];
	do {
		price = getPrice(id)
	} while (price && price.length == 0);
	if(getPrice(id) && getPrice(id).length > 0){
		price = getPrice(id);
	}else{
		if(priceList.length > 0){
			_.uniq(priceList).forEach(function(el,index){
				price.push({price:el,begin:1});
			});
		}else{
			price.push({price:res.price.unitPrice,begin:1});
		}
	}
	///////// end /////////////
	///////// shop ////////////
	var shop = "";
	do {
		shop = getShop(id)
	} while (shop && shop == "");
	///////// end /////////////
	var data = {
		id : id,
		title : (res.productNameTrans.TH.match(REGEX))?translate(res.productNameTrans.TH):res.productNameTrans.TH,
		titleOriginal : res.productName,
		mainImage : res.primaryImage,
		listImage : res.images,
		sku : sku,
		skuMap : skuMap,
		price : price,
		promoPrice : price,
		detail : res.description,
		attributes : attributes,
		link : itemUrl,
		vendor : shop
	}
	return data;
	}else{
	return false;
	}
}

exports.protaobao = function(id){
	let url = "https://protaobao.com/load_module.php?part=search&q=https://detail.1688.com/offer/"+id+".html";
	var responseBody =  request.sync(url).body;
	const $ = cheerio.load(responseBody);
	let data = {
		title : $('div .notranslate').find('span .lang_zh').text(),
		price : $('div .notranslate span').text(),
		mainImage : $('.item_box_image').attr('src')
	}
	return data;
}

exports.tcat = function(id){
	var url = "https://www.tcatmall.com/alibaba/product";
	var res = request.post.sync(url, {
		headers: {
    	'content-type': 'application/x-www-form-urlencoded'
  	},
		body: "id=" + id
	}).body;
	var $ = cheerio.load(res);
	return $('.col-md-12').slice(1, 5).find('a').text().replace(" ลิงค์ไปยังหน้าสินค้า","");
}

exports.original = function(id){
	var price = [];
	var url = "https://m.1688.com/offer/"+ id +".html";
	var res = request.sync(url, {
		headers: {
			'cookie' : 'ali_ab=180.183.9.182.1573537045481.6; hng=GLOBAL%7Czh-CN%7CUSD%7C999; cna=VexPFrGMAkICAbS3CbbU7ZR6; UM_distinctid=16e5e1e242f7fd-04f80f0a23171a-1c3c6a5a-fa000-16e5e1e243077b; taklid=48a454a8134841d28fd7cd4c77cac6db; lid=jaysmaster; ali_apache_track=c_mid=b2b-3939567397ef2bb|c_lid=jaysmaster|c_ms=1; XSRF-TOKEN=a8b4f587-a12c-4518-b62a-76b33a4ce54b; cookie2=13a7b4d5179ed4d30475817864381303; t=2febfb30a8437a5c560b3e05cba7db68; _tb_token_=5b5b177f161da; CNZZDATA1253659577=1228670438-1573533919-https%253A%252F%252Fwww.1688.com%252F%7C1578168121; alicnweb=touch_tb_at%3D1578168669037%7ChomeIdttS%3D58625812735412782848852667354424218228%7ChomeIdttSAction%3Dtrue%7Clastlogonid%3Djaysmaster; cookie1=VTx%2Bo5cRCTIktVYrDZjxGXBkiP5ovCHrIM3gzFnXNI8%3D; cookie17=UNk0yzsaXN6w7w%3D%3D; sg=r7b; csg=ef5b7b13; unb=3939567397; uc4=nk4=0%40C%2B0J1MF8aJRYpVatKoalr58MqlnA&id4=0%40Ug4%2B6qdMYLn%2BCfUl8VQwuJCfNOmK; __cn_logon__=true; __cn_logon_id__=jaysmaster; ali_apache_tracktmp=c_w_signed=Y; _nk_=jaysmaster; last_mid=b2b-3939567397ef2bb; _csrf_token=1578170448885; _is_show_loginId_change_block_=b2b-3939567397ef2bb_false; JSESSIONID=95F068C8A844A58AB757030E79351E56; _show_force_unbind_div_=b2b-3939567397ef2bb_false; _show_sys_unbind_div_=b2b-3939567397ef2bb_false; _show_user_unbind_div_=b2b-3939567397ef2bb_false; __rn_alert__=false; isg=BJ6ePNqlTNnc95tnPYA1eq-o7zLgX2LZdCpiZEgnF-Hcaz9FsOuY6DbBZy9C01rx; l=dBIht5mPqekv55O2BOCwnurza77O_IRfguPzaNbMi_5B8TLs6nbOoxK9fnp6cAWcG0TB4eTRZFyTFUM88P1Wjml3CIeF2VHDBOf..',
			'user-agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36'
  	}
	}).body;
	var jsonPrice = JSON.parse(res.substring(res.indexOf('"showPriceRanges":'),res.indexOf('"showOriginPriceRanges"')).replace('"showPriceRanges": ','').replace('],',']'));
	_.each(jsonPrice,function(elem,i){
		var begin = elem.range.replace("&ge;","").replace("&gt;","");
		price.push({
			price : parseFloat(elem.price),
			begin : parseInt(begin.split("-")[0])
		})
	});
	return price;
}

exports.weshopchina = function(id,provider){
	var detailUrl = (provider==0)?"https://item.taobao.com/item.htm?id=" + id:"https://detail.1688.com/offer/"+ id +".html";
	var url = "https://weshopchina.com/load_module.php?part=search&q=" + detailUrl + "&website=" + provider;
	var responseBody = request.sync(url).body;
	const $ = cheerio.load(responseBody);
	var listImage = [];
	var skus = [];
	var skuMap = [];
	var stock = 0;
	var priceList = [];
	var price = [];
	$("img[class=thumbnail_image]").each(function(index,el) {
		listImage.push($(this).attr('src'))
	});
	$("table[class=product-table] tr").each(function(index, el) {
		if($(this).find('span[class=lang_zh]') != ""){
			var tmpValue = [];
			$(this).find('input').each(function(i, e) {
				var title = $(this).attr('title');
				var isImage = 0;
				var image = "";
				var label = "";
				if(title.indexOf("img")>-1){
					label = title.substring(title.indexOf("alt='"),title.indexOf("' title")).replace("alt='","")
					isImage = 1;
					image = title.substring(title.indexOf("src='"),title.indexOf("jpg' alt")).replace("src='","") + "jpg"
				}else{
					label = title.substring(title.indexOf("class='lang_zh'>"),title.indexOf("</span><span class='lang_th'>")).replace("class='lang_zh'>","")
				}
				tmpValue.push({
					data : $(this).attr('data-pv'),
					label : label,
					isImage : isImage,
					image : image
				})
			});
			skus.push({
				group : $(this).find('span[class=lang_zh]').text(),
				value : tmpValue
			})
		}
	});
	var jsonSkuMap = JSON.parse(responseBody.substring(responseBody.indexOf("var skus = "),responseBody.indexOf("var notTranslated")).replace("var skus = ","").replace("};","}"))
	_.each( jsonSkuMap, function( element, index){
		skuMap.push({
			skuMap : element.prop.join(";"),
			price : element.price,
			promoPrice : element.price,
			stock : element.quantity
		})
		stock += parseInt(element.quantity);
		priceList.push(parseFloat(element.price));
	})
	///////// price ///////////
	var price = [];
	/*do {
		price = getPrice(id)
	} while (price && price.length == 0);
	if(getPrice(id) && getPrice(id).length > 0){
		price = getPrice(id);
	}else{*/
		if(priceList.length > 0){
			_.uniq(priceList).forEach(function(el,index){
				price.push({price:el,begin:1});
			});
		}else{
			price.push({
				price : parseFloat($("div span[style=color: orange]").text().replace("¥","")),
				begin : 1
			});
		}
	//}
	///////// end /////////////
	return {
		id : id,
		title : $("span[class=lang_zh]").text(),
		mainImage : listImage[0].replace("_250x250.jpg",""),
		listImage : listImage,
		price : price,
		promoPrice : price,
		sku : skus,
		skuMap : skuMap,
		stock : stock,
		attributes : [],
		detail: "",
		detail : $("div[class=content-panel]").find("p").html(),
		vendor : responseBody.substring(responseBody.indexOf("storeName"),responseBody.indexOf("skuProperties")).replace('storeName: "','').replace(/\s/g,'').replace('\",',''),
		link : "https://detail.1688.com/offer/"+id+".html"
	}
}

var getPrice = function(id){
	var key = "price-" + id;
	var value = cache.get( key );
	var price = [];
	if(value == undefined){
		var url = "https://m.1688.com/offer/"+ id +".html";
		var res = request.sync(url, {
			headers: {
				'cookie' : cookie.cookie1688(),
				'user-agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36'
	  	}
		}).body;
		if(res.indexOf('"showPriceRanges":')>-1){
			var jsonPrice = JSON.parse(res.substring(res.indexOf('"showPriceRanges":'),res.indexOf('"showOriginPriceRanges"')).replace('"showPriceRanges": ','').replace('],',']'));
			_.each(jsonPrice,function(elem,i){
				var begin = elem.range.replace("&ge;","").replace("&gt;","");
				price.push({
					price : parseFloat(elem.price),
					begin : parseInt(begin.split("-")[0])
				})
			});
		}else{
			return false;
		}
		if(price.length > 0){
			success = cache.set( key, price, 2592000 );
		}else{
			return price;
		}
	}else{
		return value;
	}
}
/*
var getShop = function(id){
	var key = "shop-" + id;
	var value = cache.get( key );
	var shop = "";
	if(value == undefined){
		var detailUrl = "https://detail.1688.com/offer/"+ id +".html";
		var url = "https://weshopchina.com/load_module.php?part=search&q=" + detailUrl + "&website=1";
		var responseBody = request.sync(url).body;
		const $ = cheerio.load(responseBody);
		shop = responseBody.substring(responseBody.indexOf("storeName"),responseBody.indexOf("skuProperties")).replace('storeName: "','').replace(/\s/g,'').replace('\",','');
		if(shop != ""){
			success = cache.set( key, shop, 2592000 );
		}else{
			return "1688";
		}
	}else{
		return value;
	}
}
*/

exports.shop = function(id){
	return JSON.parse(request.sync("https://1688.laonet.online/index.php?route=api_tester/call&api_name=item_get&num_iid="+id+"&key=apichinaservicebzw").body).item.nick;
}

var getShop = function(id){
	//return request.sync(Yii::$app->params["apiUrl2"]."item_get&num_iid=".$get["num_iid"]."&key=apichinaservicebzw");
	return request.sync("https://1688.api-taobao.com/get1688.php?id=" + id).response.body;
}

exports.getShop2 = function(id){
	//return request.sync(Yii::$app->params["apiUrl2"]."item_get&num_iid=".$get["num_iid"]."&key=apichinaservicebzw");
	return request.sync("https://1688.api-taobao.com/get1688.php?id=" + id).response.body;
}

exports.getShop = function(id){
	return JSON.parse(request.sync("https://1688.laonet.online/index.php?route=api_tester/call&api_name=item_get&num_iid="+id+"&key=apichinaservicebzw").body).item.nick;
}

exports.laonet = function(id){
	var sku = [];
	var skuMap = [];
	var attributes = [];
	var listImage = [];
	var stock = 1;
	var url = "https://1688.laonet.online/index.php?route=api_tester/call&api_name=item_get&num_iid="+ id +"&key=apichinaservicebzw";
	var responseBody =  request.sync(url).body;
	var json = JSON.parse(responseBody);
	var price = [{price:parseFloat(json.item.orginal_price),begin:1}];
	var promoPrice = [{price:parseFloat(json.item.price),begin:1}];
	json.item.item_imgs.forEach((item, i) => {
		listImage.push(item.url);
	});
	if(json.item.props_name != ""){
		var props = json.item.props_name.split(";")
		var groupProps = [];
		props.forEach((item, i) => {
			let prop = item.split(":");
			groupProps.push({
				group : prop[2],
				value : {
					data : prop[0]+":"+prop[1],
					label : prop[3]
				}
			});
		});
		var groupBy = _.groupBy(groupProps,"group");
		for (var i in groupBy) {
			let val = []
			for (var j in groupBy[i]) {
				let data = groupBy[i][j]["value"]["data"];
				val.push({
					data : data,
					labelOriginal : groupBy[i][j]["value"]["label"],
					label : groupBy[i][j]["value"]["label"],
					isImage : (json.item.props_img[data])?1:0,
					image : (json.item.props_img[data])?json.item.props_img[data]:""
				})
			}
			sku.push({
				group : i,
				groupOriginal : i,
				value : val
			})
		}
		if(json.item.skus){
			json.item.skus.sku.forEach((item, i) => {
				skuMap.push({
					skuMap : item.properties,
					price : parseFloat(item.orginal_price),
					promoPrice : parseFloat(item.price),
					stock : parseInt(item.quantity)
				})
				stock += parseInt(item.quantity)
			});
		}
	}
	if(json.item.props.length){
		json.item.props.forEach((item, i) => {
			attributes.push(item.name + ":" + item.value)
		});
	}
	var data = {
		id : json.item.num_iid,
		title : json.item.title,
		titleOriginal : json.item.title,
		mainImage : json.item.pic_url,
		listImage : listImage,
		price : price,
		promoPrice : promoPrice,
		sku : sku,
		skuMap : skuMap,
		attributes : attributes,
		attributeOriginal : attributes,
		detail : json.item.desc,
		link : "https://item.taobao.com/item.html?id=" + json.item.num_iid,
		vendor : json.item.nick,
		stock : stock
	}
	return data;
}

//exports.getShop = getShop(id);

function translate(text,lang='th'){
	var key = 'trnsl.1.1.20160916T015324Z.757ee15322503a5e.25df08f3c9550c695c7b65863bf5d6c452928f78';
	var url = 'https://translate.yandex.net/api/v1.5/tr.json/translate?key=' + key + '&text=' + encodeURIComponent(text) + '&lang=zh-' + lang;
	return JSON.parse(request.sync(url).response.body).text[0];
}
