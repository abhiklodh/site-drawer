function checkUrl(urlReg){
	var urlCheckTest = urlReg.match(/^((http|https|ftp)?:\/\/)?([\a-zA-Z0-9\.-]+)\.([a-z\.]{2,6})(\/)?([\a-zA-Z0-9\/#+=%&_\.~?\-]+)?$/)
	if(urlCheckTest==null){
		return false;
	}else{
		return true;
	}
}

function loadWebSite(website,mode){
	error=false;
	if(mode === undefined) mode = 0;
	if(mode==0){
		if(website!==""){
			if(checkUrl(website)){
				if(website.substr(0,7)!="http://" && website.substr(0,8)!="https://" && website.substr(0,6)!="ftp://") website="http://"+website;
				browser.setAttribute("src", website);
			}else{
				browser.setAttribute("src", searchEngine[sEID].url+website);
			}
		}
	}else{
		browser.setAttribute("src", website);
	}
}

function sb_on(){
	if(sidebar){
		sidebar = false;
		$("#main").animate({"left":"0"},500)
		$("#sidebar").animate({"left":"100%"},500)
	}else{
		sidebar = true;
		$("#main").animate({"left":"-70%"},500)
		$("#sidebar").animate({"left":"30%"},500)
	}
}

function darkThemeMode(){
	if(n_mode){
		n_mode=false;
		$("#nmInject").remove();$("#s_nm span").html("OFF");
	}else{
		n_mode=true;
		$("head").append("<link rel='stylesheet' href='system/style/browser_nm.css' id='nmInject'>");
		$("#s_nm span").html("ON");
	}
}

function purgeData(){
	browser.purgeHistory();
	history=[];
	$("#hist ul").html("");
}

function fullscreenMode(){
	if(f_mode){
		f_mode = false;
		$("#s_fm span").html("OFF");
		fullscreenOff();
	}else{
		f_mode = true;
		$("#s_fm span").html("ON");
		fullscreenOn();
	}
}

function fullscreenOn(){
	if (document.documentElement.requestFullscreen) {
		document.documentElement.requestFullscreen();
	} else if (document.documentElement.msRequestFullscreen) {
		document.documentElement.msRequestFullscreen();
	} else if (document.documentElement.mozRequestFullScreen) {
		document.documentElement.mozRequestFullScreen();
	} else if (document.documentElement.webkitRequestFullscreen) {
		document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
	}
}

function fullscreenOff(){
	if (document.exitFullscreen) {
		document.exitFullscreen();
	} else if (document.msExitFullscreen) {
		document.msExitFullscreen();
	} else if (document.mozCancelFullScreen) {
		document.mozCancelFullScreen();
	} else if (document.webkitExitFullscreen) {
		document.webkitExitFullscreen();
	}
}

function setBookmark(ttl1,url1){
	Bexists=false;
	for(i in bookmarksUrl){
		if(url1==bookmarksUrl[i]) Bexists=true;
	}
	if(!Bexists){
		bookmarksTitle.push(ttl1);
		bookmarksUrl.push(url1);
	}else{
		alert("Already Bookmarked!");
	}
}

function saveBookmark(){
	sdcard.delete("bookmarksURL.cache");
	sdcard.delete("bookmarksTitle.cache");
	bm = new Blob([bookmarksUrl], {type: "text/plain"});
	requestSet = sdcard.addNamed(bm, "bookmarksURL.cache");
	bm = new Blob([bookmarksTitle], {type: "text/plain"});
	requestSet = sdcard.addNamed(bm, "bookmarksTitle.cache");
}

function init(){
	$("#loading-screen").delay(1000).fadeOut();
	sidebar = false;
	error=false;
	n_mode=false;
	f_mode=false;
	
	searchEngine = [{"name":"Google","url":"http://www.google.com/search?q="}]
	sEID = 0;

	historyData=[];

	bookmarksTitle=[];
	bookmarksUrl=[];

	sdcard = navigator.getDeviceStorage("sdcard");
	
	/*
	
	requestGetURL = sdcard.get("bookmarksURL.cache");
	requestGetURL.onsuccess = function(){
		bookmarksUrl = this.result;
	}
	requestGetTitle = sdcard.get("bookmarksTitle.cache");
	requestGetTitle.onsuccess = function(){
		bookmarksTitle = this.result;
	}

	requestGetURL.onerror = function(){
		bm = new Blob([bookmarksUrl], {type: "text/plain"});
		requestSet = sdcard.addNamed(bm, "bookmarksURL.cache");
		bm = new Blob([bookmarksTitle], {type: "text/plain"});
		requestSet = sdcard.addNamed(bm, "bookmarksTitle.cache");
	}

	*/

}

document.addEventListener("DOMContentLoaded", function () {

	init();

	url  = document.getElementById("url");
	go   = document.getElementById("go");
	stop = document.getElementById("stop");
	prev = document.getElementById("btn_pre");
	next = document.getElementById("btn_nex");
	sb  = document.getElementById("btn_add_t");
	browser = document.querySelector("iframe[mozbrowser]");

	//Browser Events
	browser.addEventListener("mozbrowserloadstart", function( event ) {
		stop.innerHTML="<img src='system/images/cancel.png'>"
		$("#loading").fadeIn();
	});

	browser.addEventListener("mozbrowserloadend", function( event ) {
		stop.innerHTML="<img src='system/images/reload.png'>"
		$("#loading").fadeOut();
		if(url.value.substr(0,6)=="app://") url.value="";
		//if(error) url.value=temp;
	});

	browser.addEventListener('mozbrowserlocationchange', function (event) {
		url.value = event.detail;
	});

	browser.addEventListener('mozbrowsererror', function (event) {
		temp=url.value;
		loadWebSite("error.html",1);
		error=true;
	});

	browser.addEventListener("mozbrowsertitlechange", function( event ) {
		h_node={"title":event.detail,"urlValue":url.value};
		var exists = false;
		for(i in historyData){
			if(h_node.urlValue==historyData[i].urlValue){
				exists = true;
				break;
			}else{
				exists=false;
			}
		}
		if(!exists){
			if(url.value.substr(0,6)!="app://")	historyData.push(h_node);
		}
	});

	//Load Events
	go.addEventListener("touchend", function () {
		loadWebSite(url.value);
	});

	$("#navigation input").keydown(function(event){
		if(event.keyCode == 13) loadWebSite(url.value);
	})
	$("#navigation").submit(function(event){
		event.preventDefault();
	})

	//Stop Events
	stop.addEventListener("touchend", function () {
		if(stop.innerHTML=="<img src='system/images/cancel.png'>"){
			browser.stop();
		}else{
			if(url.value!="") browser.reload();
		}
	});

	//Navigation
	prev.addEventListener("touchend", function(){
		browser.goBack();
	})
	next.addEventListener("touchend", function(){
		browser.goForward();
	})

	//Sidebar
	sb.addEventListener("touchend", function(){
		sb_on();
	})
	$("#s_sp").click(function(){
		loadWebSite("homepage.html",1);
		sb_on();
	})
	$("#s_nm").click(function(){
		darkThemeMode();
		sb_on();
	})
	$("#s_fm").click(function(){
		fullscreenMode();
		sb_on();
	})
	$("#s_hi").click(function(){
		sb_on();
		$("#hist ul").html("");
		for(i in historyData){
			if(i>-1){
				tt="<strong>"+historyData[historyData.length-i-1].title+"</strong>";
				ur=historyData[historyData.length-i-1].urlValue;
				$("#hist ul").append("<li src='"+ur+"'>"+tt+"<br>"+ur+"</li>");
			}
		}
		$("#hist").fadeIn();
		$("#hist ul li").click(function(){
			urls=$(this).attr("src");
			loadWebSite(urls);
			$("#hist").fadeOut();
		})
	})

	$("#s_bo").click(function(){
		sb_on();
		$("#book ul").html("");
		for(i in bookmarksUrl){
			tt="<strong>"+bookmarksTitle[i]+"</strong>";
			ur=bookmarksUrl[i];
			$("#book ul").append("<li src='"+ur+"'>"+tt+"</li>");
		}
		$("#book").fadeIn();
		saveBookmark();
		$("#book ul li").click(function(){
			urls=$(this).attr("src");
			loadWebSite(urls);
			$("#book").fadeOut();
		})
	})

	$("#s_ab").click(function(){
		t=h_node.title;
		u=h_node.urlValue;
		setBookmark(t,u)
	})

	$("#s_pr").click(function(){
		sb_on();
		$("#preferences").fadeIn();
	})

	$("#s_at").click(function(){
		sb_on();
		$("#about").fadeIn();
	})

	$("#book #close").click(function(){
		$("#book").fadeOut();
	})

	$("#hist #close").click(function(){
		$("#hist").fadeOut();
	})

	$("#preferences #close").click(function(){
		$("#preferences").fadeOut();
	})

	$("#about #close").click(function(){
		$("#about").fadeOut();
	})

	//Misc
	$("input").focus(function(){
		$("#s_fm span").html("OFF");
		f_mode=false;
	})
	$("#clrHst").click(function(){
		purgeData();
	})
	$("#l_gnu").click(function(){
		$("#about").fadeOut();
		loadWebSite("http://docs.oracle.com/cd/E22471_01/html/E26049/appendix.html#50651147_24646");
	})
});