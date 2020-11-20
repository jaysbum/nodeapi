const request = require('syncrequest');
const convert = require('xml-js');
var _ = require('lodash');
const cheerio = require('cheerio');
const web1688 = require('./1688');
const REGEX = /(\p{Script=Hani})+/gu;
exports.data1 = function(id){
	var responseBody =  request.sync('https://www.vcanbuy.com/gateway/docking/taobao/item/get_detail?third_item_id=' + id).body;
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
		mainImage : apiData.img_url,
		listImage : apiData.img_urls,
		sku : skus,
		skuMap : skuMap,
		attribute : attributes,
		stock : stock,
		price : price,
		promoPrice : promoPrice,
		link : "https://item.taobao.com/item.htm?id=" + id,
		vendor : JSON.parse(apiData.props_ext).thirdSellerName,
		detail : JSON.parse(apiData.description).taobaoDescUrl
	}

	return data;
}

exports.dataTranslate1 = function(id){
	var responseBody =  request.sync('https://www.vcanbuy.com/gateway/docking/taobao/item/get_detail?third_item_id=' + id).body;
	var apiData = JSON.parse(responseBody).data;
	var skus = [];
	var skuMap = [];
	var attributes = [];
	var attributesOriginal = [];
	var stock = 0;
	var price = [];
	var promoPrice = [];
	var labelTranslate = [];
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
				group : translate(el.name),
				groupOriginal : el.name,
				value : values
			})
		}else{
			//attributes.push(translate(el.name + ":" + el.prop_value_list[0].value));
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
		title : translate(apiData.item_name),
		titleOriginal : apiData.item_name,
		mainImage : apiData.img_url,
		listImage : apiData.img_urls,
		sku : skus,
		skuMap : skuMap,
		attribute : translate(attributesOriginal.join("||")).split("||"),
		attributeOriginal : attributesOriginal,
		stock : stock,
		price : price,
		link : "https://item.taobao.com/item.htm?id=" + id,
		promoPrice : promoPrice,
		vendor : JSON.parse(apiData.props_ext).thirdSellerName,
		detail : JSON.parse(apiData.description).taobaoDescUrl
	}

	return data;
}

exports.data2 = function(id){
	var price = [];
	var promoPrice = [];
	var sku = [];
	var attributes = [];
	var skuMap = [];
	var responseBody =  request.sync('http://otapi.net/OtapiWebService2.asmx/GetItemFullInfoWithPromotions?instanceKey=opendemo&language=en&itemId=' + id).body;
	var apiData = convert.xml2json(responseBody, {compact: true, spaces: 4});
	var api = JSON.parse(apiData).OtapiItemFullInfoAnswer.OtapiItemFullInfo;
	price.push({price:api.Price.OriginalPrice._text,begin:1});
	promoPrice.push({price:api.Price.MarginPrice._text,begin:1});
	_.each(_.groupBy(api.Attributes.ItemAttribute,'OriginalPropertyName._text'),function(el, index) {
		var val = [];
		var groupName = "";
		_.each(el,function(e,i){
			if(e.IsConfigurator._text=="true"){
				groupName = e.OriginalPropertyName._text;
				val.push({
					data : e._attributes.Pid+":"+e._attributes.Vid,
					label : e.OriginalValue._text,
					image : (e.ImageUrl)?e.ImageUrl._text:"",
					isImage : (e.ImageUrl)?1:0
				})
			}
		});
		if(val.length>0){
			sku.push({
				group : groupName,
				value : val
			});
		}
	});
	_.each(api.ConfiguredItems.OtapiConfiguredItem,function(el,index){
		skuMap.push({
			skuMap : _.map(el.Configurators.ValuedConfigurator,function(conf){ return conf._attributes.Pid+":"+conf._attributes.Vid}).join(";"),
			price : el.Price.OriginalPrice._text
		})
	})
	var data = {
			title : api.OriginalTitle._text,
			mainImage : api.MainPictureUrl._text,
			listImage : _.map(api.Pictures.ItemPicture,function(item){ return item.Url._text }),
			price : price,
			promoPrice : promoPrice,
			sku : sku,
			skuMap : skuMap
	};
	return data;
}

exports.ezbuyTranslate = function(provider,id,lang="th"){
		var sku = [];
		var skuMap = [];
		var price = [];
		var priceList = [];
		var attributes = [];
		var itemUrl = "";
		//const REGEX = /(\p{Script=Hani})+/gu;
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
		///////// sku /////////////
		////// add translate here /////////////
		var titleTax = "<title>"+ res.productName +"</title>";
		var groupTag = "<group>";
		var valueTag = "<value>";
		///// end add /////////////////////////
		if(res.properties.length){
			res.properties.forEach(function(el,index){
				groupTag += el.prop +"<seperate>"; // add group
				var tmpValue = [];
				el.propItems.forEach(function(e,i){
					tmpValue.push({
						data : el.propId+":"+e.valueId,
						label : e.value,
						labelOriginal : e.value,
						isImage : (e.imageUrl)?1:0,
						image : (e.imageUrl)?e.imageUrl:""
					});
					valueTag += e.value +"<seperate>"; // add label text
				});
				sku.push({
					group : el.prop,
					groupOriginal : el.prop,
					value : tmpValue
				});
			});
			groupTag += "</group>"; // end group tag
			valueTag += "</value>"; // end value tag
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
			if(sku.length > 0){
				_.uniq(priceList).forEach(function(el,index){
					price.push({price:el,begin:1});
				});
			}else{
				price.push({price:res.price.unitPrice,begin:1});
			}
		}else{
			price.push({price:res.price.unitPrice,begin:1});
		}
		///////// end /////////////
		///////// begin translate ////////
		var textToTranslate = titleTax + groupTag + valueTag;
		var textTranslate = translateHtml(textToTranslate);
		var titleTranslate = textTranslate.substring(textTranslate.indexOf("<title>"),textTranslate.indexOf("</title>")).replace("<title>","");
		var groupTranslate = textTranslate.substring(textTranslate.indexOf("<group>"),textTranslate.indexOf("</group>")+8).replace(/<group>/g,"").replace(/<\/group>/g,"");
		groupTranslate = groupTranslate.substring(0,groupTranslate.length-10);
		var valueTranslate = textTranslate.substring(textTranslate.indexOf("<value>"),textTranslate.indexOf("</value>")+8).replace(/<value>/g,"").replace(/<\/value>/g,"");
		valueTranslate = valueTranslate.substring(0,valueTranslate.length-10);
		//var attrTranslate = textTranslate.substring(textTranslate.indexOf("<attributes>"),textTranslate.indexOf("</attributes>")+13).replace(/<attributes>/g,"").replace(/<\/attributes>/g,"");
		//attrTranslate = valueTranslate.substring(0,valueTranslate.length-10);
		if(sku){
			var groupArray = groupTranslate.split("<seperate>");
			var valueArray = valueTranslate.split("<seperate>");
			var k = 0;
			for (var i = 0; i < sku.length; i++) {
				sku[i]["group"] = groupArray[i];
				for (var j = 0; j < sku[i].value.length; j++) {
					sku[i].value[j]["label"] = valueArray[k];
					k++;
				}
			}
		}
		///////// end /////////////////////
		var data = {
			id : id,
			title : titleTranslate,
			titleOriginal : res.productName,
			mainImage : res.primaryImage,
			listImage : res.images,
			sku : sku,
			skuMap : skuMap,
			price : price,
			promoPrice : price,
			detail : res.description,
			attributes : attributes,
			link : (provider=="taobao")?"https://item.taobao.com/item.htm?id="+id:"https://detail.1688.com/offer/"+id+".html",
			vendor : (provider=="taobao")?res.vendorName:((web1688.getShop(id))?web1688.getShop(id):web1688.getShop2(id))
			//vendor : (provider=="taobao")?res.vendorName:"1688"
			//vendor : res.vendorName
		}
		return data;
}

exports.taobaoTestTranslate = function(id,lang="th"){
	var sku = [];
	var skuMap = [];
	var attributes = [];
	var priceList = [];
	var price = [];
	var stock = 0;
	var desc = "";
	const REGEX = /(\p{Script=Hani})+/gu;
	const url = "https://h5api.m.taobao.com/h5/mtop.taobao.detail.getdetail/6.0/?jsv=2.4.11&t="+Date.now()+"&api=mtop.taobao.detail.getdetail&v=6.0&ttid=2017%40htao_h5_1.0.0&type=jsonp&dataType=jsonp&data=%7B%22exParams%22%3A%22%7B%5C%22countryCode%5C%22%3A%5C%22GLOBAL%5C%22%7D%22%2C%22itemNumId%22%3A%22"+id+"%22%7D";
	var responseBody =  request.sync(url,{
	  headers: {
			'user-agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36',
	    'cookie': 'cna=YDu3FeXz0m0CAbdZWtOy1q3B; t=ed221d7e34ce99e7dbceb62a8b28c5ea; thw=ca; _fbp=fb.1.1563466992537.40416565; hng=GLOBAL%7Czh-CN%7CUSD%7C999; tracknick=jaysmaster; tg=0; enc=shGnn1SZQ625MLOvbyUuSZg0XxhpMSG9CHinIuVkp9Gn1gEKvFnOxzehYpBmz1Erb1RDruZcyA0UzI7oHsbMIg%3D%3D; v=0; cookie2=1692888ff01cb303f0a5c54a784667f7; _tb_token_=e577eeefbe518; _m_h5_tk=b0ad768aaee08a40a02968fa0f20cd78_1568440225561; _m_h5_tk_enc=1893dc84a5aaa4ebf5153f6a595c8947; mt=ci=-1_0; ockeqeudmj=qqHVh9Q%3D; munb=3939567397; WAPFDFDTGFG=%2B4cMKKP%2B8PI%2BNuKF166aVFSsiqKK; _w_app_lg=0; unb=3939567397; uc3=vt3=F8dByuKy6MZtdROVfsg%3D&id2=UNk0yzsaXN6w7w%3D%3D&nk2=CdKLBGzKvlZP4A%3D%3D&lg2=UIHiLt3xD8xYTw%3D%3D; uc1=cookie21=VT5L2FSpdiBh&cookie15=Vq8l%2BKCLz3%2F65A%3D%3D&cookie14=UoTaECIDCkfQgw%3D%3D; csg=b5919e83; lgc=jaysmaster; ntm=1; cookie17=UNk0yzsaXN6w7w%3D%3D; dnk=jaysmaster; skt=ba72020eec1b323a; _cc_=W5iHLLyFfA%3D%3D; _l_g_=Ug%3D%3D; sg=r7b; _nk_=jaysmaster; cookie1=VTx%2Bo5cRCTIktVYrDZjxGXBkiP5ovCHrIM3gzFnXNI8%3D; isg=BCYmj_Z7R80fMBMtFaPgYXlfd5por2vHkyWH6RDPUskxk8WtepZe00pi79e6O2LZ; l=cBSqASwrqM_d-y7ZBOCwPurza77O-IRcguPzaNbMi_5Bc6v9_aQOkyhnaFv6cAWFTSTH4K7K7HvtIeoY5yJwVUzU3K2aDnf..',
	  },
	}).body;
	var json = JSON.parse(responseBody).data;
	var skuMapJson = JSON.parse(json.mockData).skuCore.sku2info;
	////////////// sku ////////////////////
	json.skuBase.props.forEach(function(el,index){
		var tmpValue = [];
		el.values.forEach(function(e,i){
			tmpValue.push({
				data : el.pid + ":" + e.vid,
				labelOriginal : e.name,
				label : (e.name.match(REGEX))?translate(e.name):e.name,
				isImage : (e.image)?1:0,
				image : (e.image)?e.image:"",
			});
		});
		sku.push({
			groupOriginal : el.name,
			group : (el.name.match(REGEX))?translate(el.name):el.name,
			value : tmpValue
		})
	});
	////////////// end ////////////////////
	////////////// skuMap /////////////////
	json.skuBase.skus.forEach(function(el,index){
		skuMap.push({
			skuMap : el.propPath,
			price : skuMapJson[el.skuId].price.priceText,
			promoPrice : skuMapJson[el.skuId].price.priceText,
			stock : skuMapJson[el.skuId].quantity
		});
		stock = stock + parseInt(skuMapJson[el.skuId].quantity);
		priceList.push(parseFloat(skuMapJson[el.skuId].price.priceText));
	});
	////////////// end ////////////////////
	////////////// attribute //////////////
	var props = json.props.groupProps[0];
	for(var i in props){
		for (var j in props[i]) {
			for (var k in props[i][j]) {
				attributes.push(k+":"+props[i][j][k]);
			}
		}
	}
	////////////// end ////////////////////
	///////// price ///////////
	_.uniq(priceList).forEach(function(el,index){
		price.push({price:el,begin:1});
	});
	///////// end /////////////
	///////// getDetail ///////
	var descUrl = json.item.taobaoDescUrl;
	var f = descUrl.substring(descUrl.indexOf('f=')+2,descUrl.indexOf('&sellerType'));
	desc = "https://h5api.m.taobao.com/h5/mtop.taobao.detail.getdesc/6.0/?jsv=2.4.11&appKey=12574478&t=1568507053803&sign=db78a6ea628ed421a1870786f676d61c&api=mtop.taobao.detail.getdesc&v=6.0&type=jsonp&dataType=jsonp&timeout=20000&callback=mtopjsonp1&data=%7B%22id%22%3A%22"+id+"%22%2C%22type%22%3A%220%22%2C%22f%22%3A%22"+f+"%22%7D";
	var responseDesc =  request.sync(desc,{
	  headers: {
			'user-agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36',
	    'cookie': 'cna=YDu3FeXz0m0CAbdZWtOy1q3B; t=ed221d7e34ce99e7dbceb62a8b28c5ea; thw=ca; _fbp=fb.1.1563466992537.40416565; hng=GLOBAL%7Czh-CN%7CUSD%7C999; tracknick=jaysmaster; tg=0; enc=shGnn1SZQ625MLOvbyUuSZg0XxhpMSG9CHinIuVkp9Gn1gEKvFnOxzehYpBmz1Erb1RDruZcyA0UzI7oHsbMIg%3D%3D; v=0; cookie2=1692888ff01cb303f0a5c54a784667f7; _tb_token_=e577eeefbe518; mt=ci=-1_0; ockeqeudmj=qqHVh9Q%3D; munb=3939567397; WAPFDFDTGFG=%2B4cMKKP%2B8PI%2BNuKF166aVFSsiqKK; _w_app_lg=0; unb=3939567397; uc3=vt3=F8dByuKy6MZtdROVfsg%3D&id2=UNk0yzsaXN6w7w%3D%3D&nk2=CdKLBGzKvlZP4A%3D%3D&lg2=UIHiLt3xD8xYTw%3D%3D; uc1=cookie21=VT5L2FSpdiBh&cookie15=Vq8l%2BKCLz3%2F65A%3D%3D&cookie14=UoTaECIDCkfQgw%3D%3D; csg=b5919e83; lgc=jaysmaster; ntm=1; cookie17=UNk0yzsaXN6w7w%3D%3D; dnk=jaysmaster; skt=ba72020eec1b323a; _cc_=W5iHLLyFfA%3D%3D; _l_g_=Ug%3D%3D; sg=r7b; _nk_=jaysmaster; cookie1=VTx%2Bo5cRCTIktVYrDZjxGXBkiP5ovCHrIM3gzFnXNI8%3D; l=cBSqASwrqM_d-h3iBOCZlurza77TAIRAguPzaNbMi_5QX18_BAQOkyLPSeJ6cAWdTsYB4K7K7H29-etf282T6qM8sxAR.; _m_h5_tk=43260b08da9b7a908edc6662af341fba_1568514125171; _m_h5_tk_enc=aed8a715c7cf00b4fab7b5ae30db4c05; isg=BJ2dqg2bnEHPMHgomo7r_L6arH-XutEMdIAsLF9iy_QjFr1IJwrh3GukRRIQ8unE',
	  },
	}).body;
	var jsonDesc = JSON.parse(responseDesc.replace("mtopjsonp1(","").replace("}})","}}"));
	///////// end /////////////
 	var data = {
		id : id,
		title : translate(json.item.title),
		titleOriginal : json.item.title,
		mainImage : json.item.images[0],
		listImage : json.item.images,
		sku : sku,
		skuMap : skuMap,
		attribute : translate(attributes.join("||")).split("||"),
		attributeOriginal : attributes,
		stock : stock,
		price : price,
		link : "https://item.taobao.com/item.htm?id=" + id,
		promoPrice : price,
		vendor : json.seller.shopName,
		detail : "<div>"+jsonDesc.data.wdescContent.pages.join("")+"</div>"
	}
	return data;
}

exports.ezbuy = function(provider,id){
	var sku = [];
	var skuMap = [];
	var price = [];
	var priceList = [];
	var attributes = [];
	var itemUrl = "";
	var stock = 0;
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
	if(res){
	///////// sku /////////////
	if(res.properties){
	res.properties.forEach(function(el,index){
		var tmpValue = [];
		el.propItems.forEach(function(e,i){
			tmpValue.push({
				data : el.propId+":"+e.valueId,
				labelOriginal : e.value,
				label : e.value,
				isImage : (e.imageUrl)?1:0,
				image : (e.imageUrl)?e.imageUrl:""
			});
		});
		sku.push({
			group : el.prop,
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
		stock = stock + parseInt(el.quantity)
		priceList.push(el.price.unitPrice);
	});
	///////// end /////////////
	///////// price ///////////
	if(skuMap.length > 0){
		_.uniq(priceList).forEach(function(el,index){
			price.push({price:el,begin:1});
		});
	}else{
		price.push({price:res.price.unitPrice,begin:1});
	}
	///////// end /////////////
	}
	//var recommended = request.sync("https://ald.taobao.com/recommend.htm?appId=03136&itemId=" + id).body;
	var data = {
		id : id,
		title : res.productName,
		titleOriginal : res.productName,
		mainImage : res.primaryImage,
		listImage : res.images,
		sku : sku,
		skuMap : skuMap,
		price : _.sortBy(price, ['price']),
		promoPrice : _.sortBy(price, ['price']),
		detail : (res.description)?res.description.replace(/'/g, "\\'"):"",
		attributes : attributes,
		link : (provider=="taobao")?"https://item.taobao.com/item.htm?id="+id:"https://detail.1688.com/offer/"+id+".html",
		//vendor : (provider=="taobao")?res.vendorName:request.sync("https://rawdata.api-taobao.com/get1688.php?id=" + id).response.body,
		vendor : (provider=="taobao")?res.vendorName:web1688.getShop(id),
		stock : stock,
		source : "ezbuyTranslate"
		//recommended : JSON.parse(recommended)
	}
	return data;
	}else{
		return false;
	}
}

exports.taobao = function(id){
	var sku = [];
	var skuMap = [];
	var attributes = [];
	var priceList = [];
	var price = [];
	var stock = 0;
	var desc = "";
	const REGEX = /(\p{Script=Hani})+/gu;
	const url = "https://h5api.m.taobao.com/h5/mtop.taobao.detail.getdetail/6.0/?jsv=2.4.11&t="+Date.now()+"&api=mtop.taobao.detail.getdetail&v=6.0&ttid=2017%40htao_h5_1.0.0&type=jsonp&dataType=jsonp&data=%7B%22exParams%22%3A%22%7B%5C%22countryCode%5C%22%3A%5C%22GLOBAL%5C%22%7D%22%2C%22itemNumId%22%3A%22"+id+"%22%7D";
	var responseBody =  request.sync(url,{
	  headers: {
			'user-agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36',
	    'cookie': 'cna=ecnHF1XQQDkCAbdZn3HLcdUO; hng=GLOBAL%7Czh-CN%7CUSD%7C999; thw=th; _fbp=fb.1.1598412221606.1460193459; sgcookie=Ept6LkwwKZPUGJ8ao1KlC; uc3=nk2=CdKLBGM82yaaLm9XoQ%3D%3D&vt3=F8dCufXBwDOry%2BKzjN8%3D&id2=UUphw2VWZhug4XGP1g%3D%3D&lg2=Vq8l%2BKCLz3%2F65A%3D%3D; lgc=jaysbum031022; uc4=nk4=0%40C%2B0J1M6uLUzDX3D0QrXq5wHbkbjhT0TH&id4=0%40U2grGNp%2Foo0zvrHtChbH7eZXPrSwOZI7; tracknick=jaysbum031022; _cc_=W5iHLLyFfA%3D%3D; enc=sARQurHYu3A2WkRw78XRRW12dRLAli%2FzBqWWqrfRwsZ2KwNlJi2ojLv6CdjlmruIhj9A400Un%2BN1iznb0MY%2BFbRzf5ThlU2biBSZTXCeeG8%3D; mt=ci=-1_0; _samesite_flag_=true; cookie2=126bba2b9cfe477241db5895ec7fb3f3; t=c141a9911cf869e0c57f6b1394ec3fcb; _tb_token_=fba63f7e77efe; xlly_s=1; _m_h5_tk=bcf4dbba49796472c049695b8eb6f9ee_1601010583355; _m_h5_tk_enc=20be41f7ea0ae4a7a20d2cb9efd2f8e4; v=0; uc1=cookie14=Uoe0bHfKlhJXlw%3D%3D; tfstk=cHyRBs6_1iKJAznYb7CmAdlOX1VRZBj--3gwpGBSuZOlNm9diD2gBV-CNcL-HiC..; l=eBOBPR_ROUfduDnEBOfZhurza77tIIRXBuPzaNbMiOCPOb595scAWZrCP5TpCnHNnsdwR3ovGkW9B4TigyUGlgnYvclBs2JZndTh.; isg=BFJSDKJPWYBgE6VW6fcFc4FXox40Y1b91YYHVhyreIXwL_MpBPDsDbxNmpMTFs6V',
	  },
	}).body;
	var json = JSON.parse(responseBody).data;
	var skuMapJson = JSON.parse(json.mockData).skuCore.sku2info;
	if(json.skuBase.props){
	////////////// sku ////////////////////
	json.skuBase.props.forEach(function(el,index){
		var tmpValue = [];
		el.values.forEach(function(e,i){
			tmpValue.push({
				data : el.pid + ":" + e.vid,
				label : e.name,
				isImage : (e.image)?1:0,
				image : (e.image)?e.image:"",
			});
		});
		sku.push({
			group : el.name,
			value : tmpValue
		})
	});
	////////////// end ////////////////////
	////////////// skuMap /////////////////
	json.skuBase.skus.forEach(function(el,index){
		skuMap.push({
			skuMap : el.propPath,
			price : skuMapJson[el.skuId].price.priceText,
			promoPrice : skuMapJson[el.skuId].price.priceText,
			stock : skuMapJson[el.skuId].quantity
		});
		stock = stock + parseInt(skuMapJson[el.skuId].quantity);
		priceList.push(parseFloat(skuMapJson[el.skuId].price.priceText));
	});
	////////////// end ////////////////////
	////////////// attribute //////////////
	var props = json.props.groupProps[0];
	for(var i in props){
		for (var j in props[i]) {
			for (var k in props[i][j]) {
				attributes.push(k+":"+props[i][j][k]);
			}
		}
	}
	////////////// end ////////////////////
	///////// price ///////////
	_.uniq(priceList).forEach(function(el,index){
		price.push({price:el,begin:1});
	});
	///////// end /////////////
	}
	///////// getDetail ///////
	var descUrl = json.item.taobaoDescUrl;
	var f = descUrl.substring(descUrl.indexOf('f=')+2,descUrl.indexOf('&sellerType'));
	desc = "https://h5api.m.taobao.com/h5/mtop.taobao.detail.getdesc/6.0/?jsv=2.4.11&appKey=12574478&t=1568507053803&sign=db78a6ea628ed421a1870786f676d61c&api=mtop.taobao.detail.getdesc&v=6.0&type=jsonp&dataType=jsonp&timeout=20000&callback=mtopjsonp1&data=%7B%22id%22%3A%22"+id+"%22%2C%22type%22%3A%220%22%2C%22f%22%3A%22"+f+"%22%7D";
	var responseDesc =  request.sync(desc,{
	  headers: {
			'user-agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36',
	    'cookie': 'cna=YDu3FeXz0m0CAbdZWtOy1q3B; t=ed221d7e34ce99e7dbceb62a8b28c5ea; thw=ca; _fbp=fb.1.1563466992537.40416565; hng=GLOBAL%7Czh-CN%7CUSD%7C999; tracknick=jaysmaster; tg=0; enc=shGnn1SZQ625MLOvbyUuSZg0XxhpMSG9CHinIuVkp9Gn1gEKvFnOxzehYpBmz1Erb1RDruZcyA0UzI7oHsbMIg%3D%3D; v=0; cookie2=1692888ff01cb303f0a5c54a784667f7; _tb_token_=e577eeefbe518; mt=ci=-1_0; ockeqeudmj=qqHVh9Q%3D; munb=3939567397; WAPFDFDTGFG=%2B4cMKKP%2B8PI%2BNuKF166aVFSsiqKK; _w_app_lg=0; unb=3939567397; uc3=vt3=F8dByuKy6MZtdROVfsg%3D&id2=UNk0yzsaXN6w7w%3D%3D&nk2=CdKLBGzKvlZP4A%3D%3D&lg2=UIHiLt3xD8xYTw%3D%3D; uc1=cookie21=VT5L2FSpdiBh&cookie15=Vq8l%2BKCLz3%2F65A%3D%3D&cookie14=UoTaECIDCkfQgw%3D%3D; csg=b5919e83; lgc=jaysmaster; ntm=1; cookie17=UNk0yzsaXN6w7w%3D%3D; dnk=jaysmaster; skt=ba72020eec1b323a; _cc_=W5iHLLyFfA%3D%3D; _l_g_=Ug%3D%3D; sg=r7b; _nk_=jaysmaster; cookie1=VTx%2Bo5cRCTIktVYrDZjxGXBkiP5ovCHrIM3gzFnXNI8%3D; l=cBSqASwrqM_d-h3iBOCZlurza77TAIRAguPzaNbMi_5QX18_BAQOkyLPSeJ6cAWdTsYB4K7K7H29-etf282T6qM8sxAR.; _m_h5_tk=43260b08da9b7a908edc6662af341fba_1568514125171; _m_h5_tk_enc=aed8a715c7cf00b4fab7b5ae30db4c05; isg=BJ2dqg2bnEHPMHgomo7r_L6arH-XutEMdIAsLF9iy_QjFr1IJwrh3GukRRIQ8unE',
	  },
	}).body;
	var jsonDesc = JSON.parse(responseDesc.replace("mtopjsonp1(","").replace("}})","}}"));
	///////// end /////////////
 	var data = {
		id : id,
		title : json.item.title,
		mainImage : json.item.images[0],
		listImage : json.item.images,
		sku : sku,
		skuMap : skuMap,
		attribute : attributes,
		stock : stock,
		price : (price.length)?price:getPrice(id).price,
		link : "https://item.taobao.com/item.htm?id=" + id,
		promoPrice : (price.length)?price:getPrice(id).promoPrice,
		vendor : json.seller.shopName,
		detail : "<div>"+jsonDesc.data.wdescContent.pages.join("")+"</div>",
	}
	return data;
}

exports.weshopchina = function(id){
	var detailUrl = "https://item.taobao.com/item.htm?id=" + id;
	var url = "https://weshopchina.com/load_module.php?part=search&q=" + detailUrl + "&website=taobao";
	//return url;
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
	if(_.uniq(priceList).length > 0){
		_.each(_.uniq(priceList),function( element, index){
			price.push({
				price : element,
				begin : 1
			})
		});
	}else{
		price.push({
			price : parseFloat($("div span[style=color: orange]").text().replace("¥","")),
			begin : 1
		});
	}
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
		//detail : "",
		detail : $("div[class=content-panel]").find("p").html(),
		vendor : responseBody.substring(responseBody.indexOf("storeName"),responseBody.indexOf("skuProperties")).replace('storeName: "','').replace(/\s/g,'').replace('\",',''),
		link : "https://item.taobao.com/item.htm?id=" + id
	}
}

exports.weshopchinaTranslate = function(id,provider,lang="th"){
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
			var group = $(this).find('span[class=lang_zh]').text();
			$(this).find('input').each(function(i, e) {
				var title = $(this).attr('title');
				var isImage = 0;
				var image = "";
				var label = "";
				if(title.indexOf("img")>-1){
					label = title.substring(title.indexOf("alt='"),title.indexOf("' title")).replace("alt='","")
					isImage = 1;
					image = title.substring(title.indexOf("src='"),title.indexOf(".jpg")).replace("src='","")
				}else{
					label = title.substring(title.indexOf("class='lang_zh'>"),title.indexOf("</span><span class='lang_th'>")).replace("class='lang_zh'>","")
				}
				tmpValue.push({
					data : $(this).attr('data-pv'),
					label : (label.match(REGEX))?translate(label):label,
					labelOriginal : label,
					isImage : isImage,
					image : image
				})
			});
			skus.push({
				group : (group.match(REGEX))?translate(group):group,
				groupOriginal : group,
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
	if(_.uniq(priceList).length > 0){
		_.each(_.uniq(priceList),function( element, index){
			price.push({
				price : element,
				begin : 1
			})
		});
	}else{
		price.push({
			price : parseFloat($("div span[style=color: orange]").text().replace("¥","")),
			begin : 1
		});
	}
	const title = $("span[class=lang_zh]").text();
	return {
		id : id,
		titleOriginal : title,
		title : (title.match(REGEX))?translate(title):title,
		mainImage : listImage[0],
		listImage : listImage,
		price : price,
		promoPrice : price,
		sku : skus,
		skuMap : skuMap,
		stock : stock,
		attributes : [],
		detail : $("div[class=content-panel]").html(),
		vendor : responseBody.substring(responseBody.indexOf("storeName"),responseBody.indexOf("skuProperties")).replace('storeName: "','').replace(/\s/g,'').replace('\",',''),
		link : "https://item.taobao.com/item.htm?id=" + id
	}
}

exports.taobaoTranslate = function(id,lang="th"){
	var sku = [];
	var skuMap = [];
	var attributes = [];
	var priceList = [];
	var price = [];
	var stock = 0;
	var desc = "";
	const REGEX = /(\p{Script=Hani})+/gu;
	const url = "https://h5api.m.taobao.com/h5/mtop.taobao.detail.getdetail/6.0/?jsv=2.4.11&t="+Date.now()+"&api=mtop.taobao.detail.getdetail&v=6.0&ttid=2017%40htao_h5_1.0.0&type=jsonp&dataType=jsonp&data=%7B%22exParams%22%3A%22%7B%5C%22countryCode%5C%22%3A%5C%22GLOBAL%5C%22%7D%22%2C%22itemNumId%22%3A%22"+id+"%22%7D";
	var responseBody =  request.sync(url,{
	  headers: {
			'user-agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36',
	    'cookie': 'cna=YDu3FeXz0m0CAbdZWtOy1q3B; t=ed221d7e34ce99e7dbceb62a8b28c5ea; thw=ca; _fbp=fb.1.1563466992537.40416565; hng=GLOBAL%7Czh-CN%7CUSD%7C999; tracknick=jaysmaster; tg=0; enc=shGnn1SZQ625MLOvbyUuSZg0XxhpMSG9CHinIuVkp9Gn1gEKvFnOxzehYpBmz1Erb1RDruZcyA0UzI7oHsbMIg%3D%3D; v=0; cookie2=1692888ff01cb303f0a5c54a784667f7; _tb_token_=e577eeefbe518; _m_h5_tk=b0ad768aaee08a40a02968fa0f20cd78_1568440225561; _m_h5_tk_enc=1893dc84a5aaa4ebf5153f6a595c8947; mt=ci=-1_0; ockeqeudmj=qqHVh9Q%3D; munb=3939567397; WAPFDFDTGFG=%2B4cMKKP%2B8PI%2BNuKF166aVFSsiqKK; _w_app_lg=0; unb=3939567397; uc3=vt3=F8dByuKy6MZtdROVfsg%3D&id2=UNk0yzsaXN6w7w%3D%3D&nk2=CdKLBGzKvlZP4A%3D%3D&lg2=UIHiLt3xD8xYTw%3D%3D; uc1=cookie21=VT5L2FSpdiBh&cookie15=Vq8l%2BKCLz3%2F65A%3D%3D&cookie14=UoTaECIDCkfQgw%3D%3D; csg=b5919e83; lgc=jaysmaster; ntm=1; cookie17=UNk0yzsaXN6w7w%3D%3D; dnk=jaysmaster; skt=ba72020eec1b323a; _cc_=W5iHLLyFfA%3D%3D; _l_g_=Ug%3D%3D; sg=r7b; _nk_=jaysmaster; cookie1=VTx%2Bo5cRCTIktVYrDZjxGXBkiP5ovCHrIM3gzFnXNI8%3D; isg=BCYmj_Z7R80fMBMtFaPgYXlfd5por2vHkyWH6RDPUskxk8WtepZe00pi79e6O2LZ; l=cBSqASwrqM_d-y7ZBOCwPurza77O-IRcguPzaNbMi_5Bc6v9_aQOkyhnaFv6cAWFTSTH4K7K7HvtIeoY5yJwVUzU3K2aDnf..',
	  },
	}).body;
	var json = JSON.parse(responseBody).data;
	var skuMapJson = JSON.parse(json.mockData).skuCore.sku2info;
	if(json.skuBase.props){
	////////////// sku ////////////////////
	////// add translate here /////////////
	var titleTax = "<title>"+ json.item.title +"</title>";
	var groupTag = "<group>";
	var valueTag = "<value>";
	///// end add /////////////////////////
	json.skuBase.props.forEach(function(el,index){
		groupTag += el.name +"<seperate>"; // add group
		var tmpValue = [];
		el.values.forEach(function(e,i){
			tmpValue.push({
				data : el.pid + ":" + e.vid,
				labelOriginal : e.name, // add label original
				label : e.name,
				isImage : (e.image)?1:0,
				image : (e.image)?e.image:"",
			});
			valueTag += e.name +"<seperate>"; // add label text
		});
		sku.push({
			groupOriginal : el.name, // add group original
			group : el.name,
			value : tmpValue
		})
	});
	groupTag += "</group>"; // end group tag
	valueTag += "</value>"; // end value tag
	////////////// end ////////////////////
	////////////// skuMap /////////////////
	json.skuBase.skus.forEach(function(el,index){
		skuMap.push({
			skuMap : el.propPath,
			price : skuMapJson[el.skuId].price.priceText,
			promoPrice : skuMapJson[el.skuId].price.priceText,
			stock : skuMapJson[el.skuId].quantity
		});
		stock = stock + parseInt(skuMapJson[el.skuId].quantity);
		priceList.push(parseFloat(skuMapJson[el.skuId].price.priceText));
	});
	////////////// end ////////////////////
	////////////// attribute //////////////
	var attrTag = "<attributes>"; // add attr
	var props = json.props.groupProps[0];
	for(var i in props){
		for (var j in props[i]) {
			for (var k in props[i][j]) {
				attributes.push(k+":"+props[i][j][k]);
				attrTag = k+":"+props[i][j][k] +"<seperate>"; // add text to attr
			}
		}
	}
	attrTag = "</attributes>"; // end attr
	////////////// end ////////////////////
	///////// price ///////////
	_.uniq(priceList).forEach(function(el,index){
		price.push({price:el,begin:1});
	});
	///////// end /////////////
	}
	///////// getDetail ///////
	var descUrl = json.item.taobaoDescUrl;
	var f = descUrl.substring(descUrl.indexOf('f=')+2,descUrl.indexOf('&sellerType'));
	desc = "https://h5api.m.taobao.com/h5/mtop.taobao.detail.getdesc/6.0/?jsv=2.4.11&appKey=12574478&t=1568507053803&sign=db78a6ea628ed421a1870786f676d61c&api=mtop.taobao.detail.getdesc&v=6.0&type=jsonp&dataType=jsonp&timeout=20000&callback=mtopjsonp1&data=%7B%22id%22%3A%22"+id+"%22%2C%22type%22%3A%220%22%2C%22f%22%3A%22"+f+"%22%7D";
	var responseDesc =  request.sync(desc,{
	  headers: {
			'user-agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36',
	    'cookie': 'cna=YDu3FeXz0m0CAbdZWtOy1q3B; t=ed221d7e34ce99e7dbceb62a8b28c5ea; thw=ca; _fbp=fb.1.1563466992537.40416565; hng=GLOBAL%7Czh-CN%7CUSD%7C999; tracknick=jaysmaster; tg=0; enc=shGnn1SZQ625MLOvbyUuSZg0XxhpMSG9CHinIuVkp9Gn1gEKvFnOxzehYpBmz1Erb1RDruZcyA0UzI7oHsbMIg%3D%3D; v=0; cookie2=1692888ff01cb303f0a5c54a784667f7; _tb_token_=e577eeefbe518; mt=ci=-1_0; ockeqeudmj=qqHVh9Q%3D; munb=3939567397; WAPFDFDTGFG=%2B4cMKKP%2B8PI%2BNuKF166aVFSsiqKK; _w_app_lg=0; unb=3939567397; uc3=vt3=F8dByuKy6MZtdROVfsg%3D&id2=UNk0yzsaXN6w7w%3D%3D&nk2=CdKLBGzKvlZP4A%3D%3D&lg2=UIHiLt3xD8xYTw%3D%3D; uc1=cookie21=VT5L2FSpdiBh&cookie15=Vq8l%2BKCLz3%2F65A%3D%3D&cookie14=UoTaECIDCkfQgw%3D%3D; csg=b5919e83; lgc=jaysmaster; ntm=1; cookie17=UNk0yzsaXN6w7w%3D%3D; dnk=jaysmaster; skt=ba72020eec1b323a; _cc_=W5iHLLyFfA%3D%3D; _l_g_=Ug%3D%3D; sg=r7b; _nk_=jaysmaster; cookie1=VTx%2Bo5cRCTIktVYrDZjxGXBkiP5ovCHrIM3gzFnXNI8%3D; l=cBSqASwrqM_d-h3iBOCZlurza77TAIRAguPzaNbMi_5QX18_BAQOkyLPSeJ6cAWdTsYB4K7K7H29-etf282T6qM8sxAR.; _m_h5_tk=43260b08da9b7a908edc6662af341fba_1568514125171; _m_h5_tk_enc=aed8a715c7cf00b4fab7b5ae30db4c05; isg=BJ2dqg2bnEHPMHgomo7r_L6arH-XutEMdIAsLF9iy_QjFr1IJwrh3GukRRIQ8unE',
	  },
	}).body;
	var jsonDesc = JSON.parse(responseDesc.replace("mtopjsonp1(","").replace("}})","}}"));
	///////// end /////////////
	///////// begin translate ////////
	var textToTranslate = titleTax + groupTag + valueTag + attrTag;
	var textTranslate = translateHtml(textToTranslate);
	var titleTranslate = textTranslate.substring(textTranslate.indexOf("<title>"),textTranslate.indexOf("</title>")).replace("<title>","");
	var groupTranslate = textTranslate.substring(textTranslate.indexOf("<group>"),textTranslate.indexOf("</group>")+8).replace(/<group>/g,"").replace(/<\/group>/g,"");
	groupTranslate = groupTranslate.substring(0,groupTranslate.length-10);
	var valueTranslate = textTranslate.substring(textTranslate.indexOf("<value>"),textTranslate.indexOf("</value>")+8).replace(/<value>/g,"").replace(/<\/value>/g,"");
	valueTranslate = valueTranslate.substring(0,valueTranslate.length-10);
	var attrTranslate = textTranslate.substring(textTranslate.indexOf("<attributes>"),textTranslate.indexOf("</attributes>")+13).replace(/<attributes>/g,"").replace(/<\/attributes>/g,"");
	attrTranslate = valueTranslate.substring(0,valueTranslate.length-10);
	if(sku){
		var groupArray = groupTranslate.split("<seperate>");
		var valueArray = valueTranslate.split("<seperate>");
		var k = 0;
		for (var i = 0; i < sku.length; i++) {
			sku[i]["group"] = groupArray[i];
			for (var j = 0; j < sku[i].value.length; j++) {
				sku[i].value[j]["label"] = valueArray[k];
				k++;
			}
		}
	}
	///////// end /////////////////////
	var data = {
		id : id,
		title : titleTranslate, // add title to result
		titleOriginal : json.item.title,
		mainImage : json.item.images[0],
		listImage : json.item.images,
		sku : sku,
		skuMap : skuMap,
		attributeOriginal : attributes, // add addtribute original
		attribute : attrTranslate.split("<seperate>"), // add addtribute translate
		stock : stock,
		price : price,
		link : "https://item.taobao.com/item.htm?id=" + id,
		promoPrice : price,
		vendor : json.seller.shopName,
		detail : "<div>"+jsonDesc.data.wdescContent.pages.join("")+"</div>",
		source : "taobaoTranslate"
		//titltranslate : titleTranslate,
		//groupTranslate : groupTranslate,
		//valueTranslate : valueTranslate
	}
	return data;
}

exports.test1688 = function(id){
	var url="https://shop8t7488945nt14.1688.com/page/creditdetail.htm";
	var responseBody =  request.sync(url,{
	  headers: {
			'user-agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36',
	    'cookie': 'cna=ecnHF1XQQDkCAbdZn3HLcdUO; hng=GLOBAL%7Czh-CN%7CUSD%7C999; ali_ab=183.89.59.81.1598245676254.7; UM_distinctid=1741eddbe542cb-08124586fa6e19-31647305-fa000-1741eddbe57354; taklid=2c14cd3a8d6f4d00afc7a36cfe46a963; cookie2=175c2dad78bf206b76775dce045ab429; t=abca116e6183706e005cf35bfc9ccd46; _tb_token_=5bb33fe5b7ebe; __cn_logon__=false; _csrf_token=1598504631071; xlly_s=1; alicnweb=touch_tb_at%3D1598539578387; CNZZDATA1253659577=1206689172-1598240591-https%253A%252F%252Fwww.1688.com%252F%7C1598537638; _m_h5_tk=8da093224a250c816954c4cd0872cc3b_1598551950659; _m_h5_tk_enc=ff186ffbfa26f386294e21ed82cc3f3d; __wapcsf__=1; unb=3939567397; JSESSIONID=E44CDAC1178327AEF1F99D31BD5C55ED; tfstk=c1MPB_6pPJ0jPV2B68wFdyvCZmR5aWun5trLZXDkug5yAiPb7sYGJobz4orTWKVl.; isg=BLGxcuqNSgfwoeYXSF3ojHnYwDtLniUQ8jtn55PHynjjutMM2e7-4j2Y2Fbccr1I; l=eBgNXYXmOYth_o2SBO5alurza77T1IObzsPzaNbMiIncC6ehEy9OkjtQKAFVQIxRRWXVGgLH4SE6GLptyeh85y8bV-tdZZHWNLc2CeOh.',
	  },
	}).body;
	return responseBody;
}

exports.laonet = function(id){
	var sku = [];
	var skuMap = [];
	var attributes = [];
	var listImage = [];
	var stock = 1;
	var url = "https://laonet.online/index.php?route=api_tester/call&api_name=item_get&num_iid="+ id +"&key=apichinaservicebzw";
	var responseBody =  request.sync(url).body;
	var json = JSON.parse(responseBody);
	var price = [{price:parseFloat(json.item.orginal_price),begin:1}];
	var promoPrice = [{price:parseFloat(json.item.price),begin:1}];
	json.item.item_imgs.forEach((item, i) => {
		listImage.push("https:"+item.url);
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
					image : (json.item.props_img[data])?"https:"+json.item.props_img[data]:""
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
		mainImage : "https:"+json.item.pic_url,
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

exports.ote = function(id){
	let url = "https://www.ote.co/search-product.php?num_iid=" + id;
	return request.sync(url).body;
}

function getPrice(id){
	var url = "https://laonet.online/index.php?route=api_tester/call&api_name=item_get&num_iid="+ id +"&key=apichinaservicebzw";
	var responseBody =  request.sync(url).body;
	var json = JSON.parse(responseBody);
	var price = [{price:json.item.orginal_price,begin:1}];
	var promoPrice = [{price:json.item.price,begin:1}];
	return {price:price,promoPrice:promoPrice}
}

function translate(text,lang='th'){
	var key = 'trnsl.1.1.20200818T123519Z.d90a8b5d03396e0a.c0139ff91e28377ea5f0521b01b80629d034920d';
	var url = 'https://translate.yandex.net/api/v1.5/tr.json/translate?key=' + key + '&text=' + encodeURIComponent(text) + '&lang=zh-' + lang;
	return JSON.parse(request.sync(url).response.body).text[0];
}

function translateHtml(text,lang='th'){
	var key = 'trnsl.1.1.20200818T123519Z.d90a8b5d03396e0a.c0139ff91e28377ea5f0521b01b80629d034920d';
	var url = 'https://translate.yandex.net/api/v1.5/tr.json/translate?key=' + key + '&text=' + encodeURIComponent(text) + '&format=html&lang=zh-' + lang;
	return JSON.parse(request.sync(url).response.body).text[0];
}
