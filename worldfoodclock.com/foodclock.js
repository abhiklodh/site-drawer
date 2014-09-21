// JavaScript Document



// INIT //
var canvasA;
var cxa;
var FPS = 54;
var trans = Math.round(60/FPS);
trans = 1.2;

var scene = 0;
var slide = -1; 
var titleIn = 100;
var titleOut = 100;
var titleOutYes = 0;
var introAlpha = 100;
var looped = 1;


// COLOUR //
//var col = ["#1a1d24","#fff","#3b414f","#32d4a0","#43caff","#ffec47","#8b5173","#5e2355","#c5d6ff","#d29592" ];
var col = ["#1a1d24","#fff","#3b414f","#32d4a0","#43caff","#ffef68","#763b69","#5d2651","#c5d6ff","#d29592","#9397a3" ];
//var corn = ["#ffc2b4","#ffdec8","#fff0f0","#ffa8a8","#d59c99","#ffc198","#daa77a","#fece88","#ffdc97","#f5c58d","#fff2be" ];
//var corn = ["#e0d5c8","#f0e0d2","#fff0f0","#eccfc9","#d59c99","#ffc198","#daa77a","#fece88","#ffdc97","#f5c58d","#fff2be" ];
var corn = ["#ceccbd","#ded6c7","#ede6e3","#d9c6be","#c0948f","#e8b892","#c59f76","#e6c383","#eace89","#ddb886","#fff2be","#8f6771" ];

var bgImg = new Image();
bgImg.src = 'img/bg.gif';
var fieldImg = new Image();
fieldImg.src = 'img/field.gif';
var gasImg = new Image();
gasImg.src = 'img/greenhouse.gif';
var fieldImgS = new Image();
fieldImgS.src = 'img/field_s.gif';
var gasImgS = new Image();
gasImgS.src = 'img/greenhouse_s.gif';

var font1 = "Georgia";
var font1 = "Lora";


// MEASUREMENT //
var halfX = 0;
var halfY = 0;
var fullX = 0;
var fullY = 0;
var units = 0;
var unitOne = 0;
var headerType = 40;
var menuType = 18;
var midType = 26;
var bodyType = 12;
var dx = 0;
var dy = fullY;
var sx = 0;
var sy = 0;
var grd = 30; // GRID SNAP SIZE
var yOff = 0;
var masterArea = 2727.2727;

var introWheat = 5000;
var introWheatDest = 5000;

//TRI RATS//
var orX = 90;
var orDest = [90,90,-90,-65];

var rat1 = 0;
var rat2 = 0;
var rat3 = 0;
var rat4 = 0;

var triSlide = 1;
var triCol = [col[7],col[7],col[5],col[4]];


var ratDest1 = [0,22,1.9,4.4];
var ratDest2 = [0,19,1.9,0.55];
var ratDest3 = [0,2,22.1,22];
var ratDest4 = [0,1,22.1,5.5];

var pent = [22.2,11.4,12.4,21.6,32.4];
var pentDest = [22.2,11.4,12.4,21.6,32.4];
var pentSlide = 1;
var pentOff = 0;
var pentScale = 9;
var pentY = 20;
var pentDestY = [0,25,-90,-70,110,40,100,-20,50];


// CAMERA //
var camX = 0;
var camY = 0;
var camDestX = 0;
var camDestY = 0;
var camSpeed = 6;
var camSpeedDest = 6;

var focused = 0;
var popA = 0;

// ZOOM //
var zoomLevel = 1;
var zoomDest = 1;
var zSpeed = 2;
var zSpeedDest = 2;
var zoomSlot = 4;
var zoomSlots = [0.15, 0.24, 0.39, 0.625, 1, 1.6, 2.56, 4.1];



// ROLLOVER //  
var upA = false;
var downA = false;
var nextBTN = false;

var leftOver = false;
var rightOver = false;
var leftA = 0;
var rightA = 0;
var arrowH = 40;

var upAlpha = 0;
var downAlpha = 0;
var btnAlpha = 0;
var upOff = -5;
var downOff = 5;

var wvOver = false;
var shareOver = false;
var infoOver = false;
var shareA = 0;
var shareState = 1;
var restoreSpeed = 0;
var infoA = 0;
var infoState = 1;

var roll = [false];
var mouseX = 0;
var mouseY = 0;

var refRoll1 = false;
var refRoll2 = false;
var refRoll3 = false;
var refRoll4 = false;

var clockP = 0;
var clockC = 0;
var clockW = 0;
var hectares = 0;
var diesel = 0;
var fert = 0;
var water = 0;
var energy = 0;
var dollars = 0;
var ghg = 0;

var clockPD = 0;
var clockCD = 0;
var clockWD = 0;
var hectareD = 0;
var dieselDest = 0;
var fertDest = 0;
var waterDest = 0;
var energyDest = 0;
var dollarsDest = 0;
var ghgDest = 0;

var totalA1 = 0;
var totalA2 = 0;


var cSpeed = 40*trans;
var cSpeedDest = 40;

var seconds = 0;
var minutes = 0;
var hours = 0;


var wheatNo = 230;
var wheatX = [];
var wheatY = [];
var wheatCol = [];

var fieldDraw = 0;



// BLOSSOM //

blossomNo = 10;
blossomRunning = false;

var blossomA = [];
var blossomX = [];
var blossomY = [];
var blossomS = [];
var blossomD = [];
var blossomAlpha = [];
var blossomSize = [];

// DUST //

dustNo = 10;

var dustA = [];
var dustX = [];
var dustY = [];
var dustS = [];
var dustD = [];
var dustSize = [];


// BIRDS //

var birdNo = 22;
var birdX = [];
var birdY = [];
var birdXS = [];
var birdYS = [];
var birdF = [];
var birdS = [];
var flockX = 0;
var flockY = -200;
var birdTimer = 0;

function init() {
	
	////////////// SETUP CANVAS ////////////
	
	canvasA = document.getElementById("layerA");
	keyInput = document.getElementById("keyLayer"); // REFERENCES AN EMPTY DIV TO "FOCUS"
	keyInput.focus();
	keyInput.addEventListener( "keydown", doKeyDown, true);
	canvasA.addEventListener("mousedown", getPosition, false);
	canvasA.addEventListener("mouseup", mouseRelease, false);
	canvasA.addEventListener("mousemove", mouseMove, false);
	document.body.addEventListener('touchmove', function(event) {
	  event.preventDefault();
	}, false); 
	
    cxa = canvasA.getContext("2d");
	document.body.addEventListener('mousewheel', function(event) {
	  event.preventDefault();
	}, false); 
	document.body.addEventListener('DOMMouseScroll', function(event) {
	  event.preventDefault();
	}, false); 
	
	// SET CANVAS & DRAWING POSITIONS //
	resize_canvas();
	units = (unitOne*0.06)*zoomLevel;
	camY = camDestY = fullY;
	
	
	/*for (i=wheatNo-20;i<wheatNo;i++) {
		
		wheatX[i] = Math.round(Math.random()*(fullX/units)/5)*5;
		wheatY[i] = 10 + (Math.round((Math.random()*50)/5)*5);
		wheatCol[i] = Math.round(Math.random()*1);
	}
	for (i=0;i<wheatNo-20;i++) {
		
		wheatX[i] = Math.round(Math.random()*(fullX/units)/15)*15;
		wheatY[i] = 90 + (Math.round((Math.random()*260)/10)*10);
		wheatCol[i] = Math.round(Math.random()*1);
	}
	
	for (i=0;i<80;i++) {
		
		wheatX[i] = Math.round(Math.random()*(fullX/units)/30)*30;
		wheatY[i] = 350 + (Math.round((Math.random()*200)/10)*10);
		wheatCol[i] = Math.round(Math.random()*1);
	}*/
	
	
	/// BLOSSOM SETUP ///
	
	for (i=0;i<blossomNo;i++) {
		
		blossomX[i] = halfX + Math.round(Math.random()*fullX);
		blossomY[i] = (200*units) + Math.round(Math.random()*(200*units));
		blossomS[i] = -3 + Math.round(Math.random()*1);
		blossomAlpha[i] = 20 + Math.round(Math.random()*40);
		blossomSize[i] = 0.5 + Math.random()*1;
		
	}
	
	for (i=0;i<dustNo;i++) {
		
		dustX[i] = halfX + Math.round(Math.random()*fullX);
		dustY[i] = (200*units) + Math.round(Math.random()*(200*units));
		dustS[i] = -3 + Math.round(Math.random()*1);
		dustSize[i] = 0.3 + Math.random()*0.6;
		
	}
	
	for (i=0;i<birdNo;i++) {
		
		birdX[i] = Math.round(Math.random()*(500*units));
		birdY[i] = - ((200*units) + Math.round(Math.random()*(100*units)));	
		birdXS[i] = -3 + Math.round(Math.random()*6);
		birdYS[i] = -2 + Math.round(Math.random()*4);
		birdF[i] = 1;
		birdS[i] = 1; //flying
		
	}
	
	var myLoader = html5Preloader();
	myLoader.addFiles('bgImg*:img/bg.gif','fieldImg*:img/field.gif','gasImg*:img/greenhouse.gif','fieldImgS*:img/field_s.gif','gasImgS*:img/greenhouse_s.gif'); 
	
	myLoader.on('finish', function(){ 
	
		setTimeout(function(){
			scene = 2; // FINISHED INITALISING, GO TO SCENE 1
			
			setTimeout(function(){
				introWheatDest = 0;
			},2000);
			setTimeout(function(){
				titleOutYes = 1; // SCENE TRANSITION
			},3000);
		},1000);
		  
	});
	
	
} // END INIT


////////////////////////////// ON EVERY FRAME CALL THESE FUNCTIONS ///////////////////////////////////
setInterval(function() {
	
	if (scene==2) { // PRIMARY SCENE
	    drawBG();
		update();
		drawSlides();
		drawDisplay();
		testing(); //DISPLAY TESTED VARIABLES (FUNCTION AT VERY BOTTOM)
	}
	
	
	
}, Math.round(1000/FPS));

// END INTERVAL



function clockStep() {
			
	clockPD += 126.7523;
	clockWD += 41.1945;
	hectareD += 44.3633;
	dieselDest += 3.80257;
	fertDest += 5.64047;
	waterDest += 84290.3135;
	//waterDest += 7922.0219;
	energyDest += 93.3214;
	dollarsDest += 23766.0658;
	ghgDest += 104.5706;
	
	
	seconds += 1;
	
	if (seconds==60) {
		minutes += 1;
		seconds = 0;
	}
	
	if (minutes==60) {
		hours += 1;
		minutes = 0;
	}
	
}





//////////////////////////////////////// UPDATE EVENTS /////////////////////////////////////////////////
function update() {
	
	// CAMERA POSITION //
	camY += ((camDestY-camY)/100)*(camSpeed*trans);
	camSpeed += ((camSpeedDest-camSpeed)/100)*(2*trans);
	
	
	units = (unitOne*0.06)*zoomLevel; // UPDATE SCALED UNITS
	dx = halfX + (camX); // UPDATE ORIGIN
	dy = halfY + (camY);
	
	
	
	// CLOCK //
	clockP += ((clockPD-clockP)/100)*cSpeed;
	clockW += ((clockWD-clockW)/100)*cSpeed;
	
	hectares += ((hectareD-hectares)/100)*cSpeed;
	diesel += ((dieselDest-diesel)/100)*cSpeed;
	fert += ((fertDest-fert)/100)*cSpeed;
	water += ((waterDest-water)/100)*cSpeed;
	energy += ((energyDest-energy)/100)*cSpeed;
	dollars += ((dollarsDest-dollars)/100)*cSpeed;
	ghg += ((ghgDest-ghg)/100)*cSpeed;
	
	for (i=0;i<5;i++) {
		pent[i] += ((pentDest[i]-pent[i])/100)*(7.5*trans);
	}
	pentY += ((pentDestY[pentSlide]-pentY)/100)*(7.5*trans);
	
	
	orX += ((orDest[triSlide]-orX)/100)*(7.5*trans);
	rat1 += ((ratDest1[triSlide]-rat1)/100)*(7.5*trans);
	rat2 += ((ratDest2[triSlide]-rat2)/100)*(7.5*trans);
	rat3 += ((ratDest3[triSlide]-rat3)/100)*(7.5*trans);
	rat4 += ((ratDest4[triSlide]-rat4)/100)*(7.5*trans);
	
	
	cSpeed += ((cSpeedDest-cSpeed)/100)*(2*trans);
	
	if (slide<0) {
		introWheat += ((introWheatDest-introWheat)/100)*(6*trans);
	}
	
	// FOCUS CHECK //
	
	if (focused==0) {
		if ( camY>((-fullY*slide)-(units*1)) && camY<((-fullY*slide)+(units*1))) {
			focusEvent();
		}
	}
	
	
	// SHARE BOX - SIMPLIFY ME
	if (shareState==2 && shareA<10) {
		shareA += 1;
	} else if (shareState==3) {
		shareA -= 1;
		if (shareA==0) {
			shareState = 1;
		}
	}
	var d = document.getElementById('sharing');
    d.style.opacity = shareA/10;
	d.style.filter = 'alpha(opacity=' + shareA*10 + ')';
	if (shareA==0) {
		d.style.display = 'none';
	}
	
	
	
} /////   END UPDATE 


	

////////////////////////////////////////////   DRAWING   ////////////////////////////////////////////
////////////////////////////////////////////   _______   ////////////////////////////////////////////



///////  CAMERA  ///////////////

function zoomTo(z,d,s) { // ZOOM
	zSpeed = s;
	zSpeedDest = d;
	zoomDest = z;
}

function camTo(x,y,d,s) { // PAN / DRAG
	camSpeed = s;
	camSpeedDest = d;
	camDestX = x;
	camDestY = y;
}


function focusEvent() {
	focused = 1;
	
	// FRAME SPECIFIC FOCUS EVENTS //
	
	if (slide==3 && triSlide==0) {
		triSlide += 1;
	}
	
	if (slide==4 && popA==0) {
		popA += 1;
	}
	
	if (slide==8 && totalA1==0) {
		totalA1 += 2;
	}
	
	
}



//////// BACKGROUND ////////////////

function drawBG() {
	
	cxa.globalAlpha = 1;
	cxa.fillStyle = col[0];
	cxa.fillRect(0,0,fullX,fullY);
	
	
	bgw = Math.ceil(fullX/250);
	bgh = Math.ceil(fullY/250);
	
	for (i=0;i<bgw;i++) {
		for (j=0;j<bgh;j++) {
	        cxa.drawImage(bgImg,i*250,j*250,250,250);
		}
	}
	
}



// HUD DISPLAY //
function drawDisplay() {
	
	if (slide>0||looped==2) {
		upOff += ((0-upOff)/100)*10;
	} else {
		upOff += ((-5-upOff)/100)*10;
	}
	
	
	// UP //
	cxa.globalAlpha = 0.2;
	cxa.fillStyle = col[8];
	cxa.fillRect(halfX-(unitOne*3),upOff*unitOne,unitOne*6,unitOne*5);
	if (upA==true && upAlpha<100) {
		upAlpha += 4;
	} else if (upAlpha>0){
		upAlpha -= 4;
	}
	if (slide==2||slide==5) {
		cxa.fillStyle = col[2];
	} else {
		cxa.fillStyle = col[1];
	}
	cxa.globalAlpha = upAlpha/100;
	cxa.fillRect(halfX-(unitOne*3),upOff*unitOne,unitOne*6,unitOne*5);
	
	cxa.globalAlpha = 1;
	if (slide==2||slide==5) {
		cxa.fillStyle = col[1];
	} else {
		cxa.fillStyle = col[0];
	}
	cxa.beginPath();
	cxa.moveTo(halfX-(unitOne*1.7),(upOff*unitOne) + unitOne*3.5);
	cxa.lineTo(halfX+(unitOne*1.7),(upOff*unitOne) + unitOne*3.5);
	cxa.lineTo(halfX,(upOff*unitOne) + unitOne*1.5);
	cxa.closePath();
	cxa.fill();
	
	
	if (slide>-1||looped==2) {
		downOff += ((0-downOff)/100)*10;
	} else {
		downOff += ((5-downOff)/100)*10;
	}
	
	// DOWN //
	cxa.globalAlpha = 0.2;
	cxa.fillStyle = col[8];
	cxa.fillRect(halfX-(unitOne*3),fullY-(unitOne*5)+(downOff*unitOne),unitOne*6,unitOne*5);
	
	if (downA==true && downAlpha<100) {
		downAlpha += 4;
	} else if (downAlpha>0){
		downAlpha -= 4;
	}
	
	if (slide==2||slide==5) {
		cxa.fillStyle = col[2];
	} else {
	    cxa.fillStyle = col[1];
	}
	cxa.globalAlpha = downAlpha/100;
	cxa.fillRect(halfX-(unitOne*3),fullY-(unitOne*5)+(downOff*unitOne),unitOne*6,unitOne*5);
	
	cxa.globalAlpha = 1;
	if (slide==2||slide==5) {
		cxa.fillStyle = col[1];
	} else {
	    cxa.fillStyle = col[0];
	}
	cxa.beginPath();
	cxa.moveTo(halfX-(unitOne*1.7),fullY-(unitOne*3.5)+(downOff*unitOne));
	cxa.lineTo(halfX+(unitOne*1.7),fullY-(unitOne*3.5)+(downOff*unitOne));
	cxa.lineTo(halfX,fullY-(unitOne*1.5)+(downOff*unitOne));
	cxa.closePath();
	cxa.fill();
	
	// INFO BUTTON //
	cxa.globalAlpha = 1;
	if (shareOver==true) {
		if (slide==2||slide==5) {
			cxa.fillStyle = col[0];
		} else {
		    cxa.fillStyle = col[3];
		}
		
	} else {
		cxa.fillStyle = col[1];
	}
	cxa.font = "400 "+(headerType*0.6)+"px Cabin Condensed";
	cxa.textAlign = 'center'; 
	infoTxt = "+ share/info";
	sx = unitOne*2;
	sy = fullY - (unitOne*2);
	//cxa.fillText("+", sx, sy);
	cxa.textAlign = 'left'; 
	cxa.font = "400 "+(dataType)+"px Cabin Condensed";
	cxa.fillText(infoTxt, sx, sy);
	cxa.fillStyle = col[1];
	
	// SHARE OVERLAY//
	if (shareA>0) {
		cxa.globalAlpha = (shareA*0.97)/10;
	    cxa.fillStyle = col[0];
		cxa.fillRect(0,0,fullX,fullY);
		cxa.textAlign = 'center';
		cxa.globalAlpha = shareA/10;
		cxa.fillStyle = col[1];
		cxa.font = "700 "+midType+"px Roboto Condensed";
		cxa.fillText("SHARE THE WORLD FOOD CLOCK", halfX, halfY-(50));
		
		
		
		sx = halfX;
		sy = halfY + (60);
		
		
		if (wvOver==true) {
		    cxa.fillStyle = col[4];
		} else {
			cxa.fillStyle = col[1];
		}
		cxa.font = "400 "+(dataType)+"px Cabin Condensed";
		cxa.fillText("whitevinyldesign.com", halfX, halfY+(90));
		shareWidth = (cxa.measureText("whitevinyldesign.com").width)/2;
		
		dotDivide(halfY+(50));
		
		
	}
	
	
	if (scene==2 && introAlpha>0) {
		if (introAlpha>0) {
			introAlpha -= 2;
		}
		cxa.globalAlpha = introAlpha/100;
		cxa.fillStyle = col[0];
	    cxa.fillRect(0,0,fullX,fullY);
	}
	
}
/////////////////// MAIN STAGE ///////////////////

function drawSlides() {
	cxa.lineWidth = 1;
	cxa.globalAlpha = 1;
	cxa.fillStyle = col[1];
	cxa.strokeStyle = col[1];
	
	if (camY>((-fullY*0)+(units*1))) {
	    slideIntro();
	}
	
	if (camY<((-fullY*-1)-(units*1))&&camY>((-fullY*1)+(units*1))) {
	    slide0();
	}
	if (camY<((-fullY*0)-(units*1))&&camY>((-fullY*2)+(units*1))) {
	    slide1();
	}
	if (camY<((-fullY*1)-(units*1))&&camY>((-fullY*3)+(units*1))) {
	    slide2();
	}
	if (camY<((-fullY*2)-(units*1))&&camY>((-fullY*4)+(units*1))) {
	    slide3();
	}
	if (camY<((-fullY*3)-(units*1))&&camY>((-fullY*5)+(units*1))) {
	    slide4();
	}
	if (camY<((-fullY*4)-(units*1))&&camY>((-fullY*6)+(units*1))) {
	    slide5();
	}
	if (camY<((-fullY*5)-(units*1))&&camY>((-fullY*7)+(units*1))) {
	    slide6();
	}
	if (camY<((-fullY*6)-(units*1))&&camY>((-fullY*8)+(units*1))) {
	    slide7();
	}
	if (camY<((-fullY*7)-(units*1))&&camY>((-fullY*9)+(units*1))) {
	    slide8();
	}
	if (camY<((-fullY*8)-(units*1))&&camY>((-fullY*10)+(units*1))) {
	    slideEnd();
	}
	if (camY<((-fullY*9)-(units*1))&&camY>((-fullY*11)+(units*1))) {
	    slideOutro();
	}
	
}






function clockLine(time1,h) {
	cxa.textAlign = 'left';
	if (minutes<1 && hours<1) {
		
		cxa.font = "400 italic "+midType+"px "+font1;
		tWidth1 = (cxa.measureText(time1).width);
		if (seconds==1) {
			tWidth3 = (cxa.measureText(" second").width);
		} else {
			tWidth3 = (cxa.measureText(" seconds").width);
		}
		
		cxa.font = "700 "+midType+"px Roboto Condensed";
		tWidth2 = (cxa.measureText(seconds).width);
		tWidth = tWidth1 + tWidth2 + tWidth3;
		
		
		cxa.font = "400 italic "+midType+"px "+font1;
		cxa.fillText(time1, dx - (tWidth/2), dy+yOff-(units*h));
		if (seconds==1) {
			cxa.fillText(" second", (dx - (tWidth/2)) + tWidth1 + tWidth2, dy+yOff-(units*h));
		} else {
			cxa.fillText(" seconds", (dx - (tWidth/2)) + tWidth1 + tWidth2, dy+yOff-(units*h));
		}
		
		
		cxa.font = "700 "+midType+"px Roboto Condensed";
		cxa.fillText(seconds, (dx - (tWidth/2)) + tWidth1, dy+yOff-(units*h));
		
		
	} else if (minutes>0 && hours<1) {
		
		cxa.font = "400 italic "+midType+"px "+font1;
		tWidth1 = (cxa.measureText(time1).width);
		if (minutes==1) {
			tWidth3 = (cxa.measureText(" minute, ").width);
		} else {
			tWidth3 = (cxa.measureText(" minutes, ").width);
		}
		if (seconds==1) {
			tWidth5 = (cxa.measureText(" second").width);
		} else {
			tWidth5 = (cxa.measureText(" seconds").width);
		}
		cxa.font = "700 "+midType+"px Roboto Condensed";
		tWidth2 = (cxa.measureText(minutes).width);
		tWidth4 = (cxa.measureText(seconds).width);
		tWidth = tWidth1 + tWidth2 + tWidth3 + tWidth4 + tWidth5 ;
		
		
		cxa.font = "400 italic "+midType+"px "+font1;
		cxa.fillText(time1, dx - (tWidth/2), dy+yOff-(units*h));
		
		if (minutes==1) {
			cxa.fillText(" minute, ", (dx - (tWidth/2)) + tWidth1 + tWidth2, dy+yOff-(units*h));
		} else {
			cxa.fillText(" minutes, ", (dx - (tWidth/2)) + tWidth1 + tWidth2, dy+yOff-(units*h));
		}
		
		if (seconds==1) {
			cxa.fillText(" second", (dx - (tWidth/2)) + tWidth1 + tWidth2 + tWidth3 + tWidth4, dy+yOff-(units*h));
		} else {
			cxa.fillText(" seconds", (dx - (tWidth/2)) + tWidth1 + tWidth2 + tWidth3 + tWidth4, dy+yOff-(units*h));
		}
		
		cxa.font = "700 "+midType+"px Roboto Condensed";
		cxa.fillText(minutes, (dx - (tWidth/2)) + tWidth1, dy+yOff-(units*h));
		cxa.fillText(seconds, (dx - (tWidth/2)) + tWidth1 + tWidth2 + tWidth3, dy+yOff-(units*h));
		
		
	} else if (hours>0) {
		
		cxa.font = "400 italic "+midType+"px "+font1;
		tWidth1 = (cxa.measureText(time1).width);
		
		if (hours==1) {
			tWidth3 = (cxa.measureText(" hour, ").width);
		} else {
			tWidth3 = (cxa.measureText(" hours, ").width);
		}
		if (minutes==1) {
			tWidth5 = (cxa.measureText(" minute, ").width);
		} else {
			tWidth5 = (cxa.measureText(" minutes, ").width);
		}
		if (seconds==1) {
			tWidth7 = (cxa.measureText(" second").width);
		} else {
			tWidth7 = (cxa.measureText(" seconds").width);
		}
		cxa.font = "700 "+midType+"px Roboto Condensed";
		tWidth2 = (cxa.measureText(hours).width);
		tWidth4 = (cxa.measureText(minutes).width);
		tWidth6 = (cxa.measureText(seconds).width);
		tWidth = tWidth1 + tWidth2 + tWidth3 + tWidth4 + tWidth5 + tWidth6 + tWidth7 ;
		
		
		cxa.font = "400 italic "+midType+"px "+font1;
		cxa.fillText(time1, dx - (tWidth/2), dy+yOff-(units*h));
		
		if (hours==1) {
			cxa.fillText(" hour, ", (dx - (tWidth/2)) + tWidth1 + tWidth2, dy+yOff-(units*h));
		} else {
			cxa.fillText(" hours, ", (dx - (tWidth/2)) + tWidth1 + tWidth2, dy+yOff-(units*h));
		}
		
		if (minutes==1) {
			cxa.fillText(" minute, ", (dx - (tWidth/2)) + tWidth1 + tWidth2 + tWidth3 + tWidth4, dy+yOff-(units*h));
		} else {
			cxa.fillText(" minutes, ", (dx - (tWidth/2)) + tWidth1 + tWidth2 + tWidth3 + tWidth4, dy+yOff-(units*h));
		}
		
		if (seconds==1) {
			cxa.fillText(" second", (dx - (tWidth/2)) + tWidth1 + tWidth2 + tWidth3 + tWidth4 + tWidth5 + tWidth6, dy+yOff-(units*h));
		} else {
			cxa.fillText(" seconds", (dx - (tWidth/2)) + tWidth1 + tWidth2 + tWidth3 + tWidth4 + tWidth5 + tWidth6, dy+yOff-(units*h));
		}
		
		cxa.font = "700 "+midType+"px Roboto Condensed";
		
		cxa.fillText(hours, (dx - (tWidth/2)) + tWidth1, dy+yOff-(units*h));
		cxa.fillText(minutes, (dx - (tWidth/2)) + tWidth1 + tWidth2 + tWidth3, dy+yOff-(units*h));
		cxa.fillText(seconds, (dx - (tWidth/2)) + tWidth1 + tWidth2 + tWidth3 + tWidth4 + tWidth5, dy+yOff-(units*h));
		
		
	}
	cxa.textAlign = 'center';
	
}

function dotDivide(y) {
	cxa.globalAlpha = 1;
	cxa.fillStyle = col[10];
	for (i=0;i<Math.floor(stageW/6);i++) {
		cxa.fillRect(Math.round(dx-(stageW/2)) + (i*6),Math.round(y),1,1);
	}
}

function dotSection(x,y,l) {
	cxa.globalAlpha = 1;
	cxa.fillStyle = col[10];
	for (i=0;i<Math.floor((l)/6);i++) {
		cxa.fillRect(Math.round(dx+x) + (i*6),Math.round(y),1,1);
	}
}

function drawOrigin(x,y) {
	
	sx=dx+(x*units);
	sy=dy+yOff+(y*units);
}

function translateOrigin(x,y) {
	
	sx=sx+(x*units);
	sy=sy+(y*units);
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function scrollArrows(y) {
	
	arrowH = y;
	
	cxa.globalAlpha = 1;
	cxa.fillStyle = col[2];
	
	cxa.beginPath();
	cxa.arc(0,y+yOff,75*units,0,2*Math.PI);
	cxa.closePath();
	cxa.fill();
	cxa.beginPath();
	cxa.arc(fullX,y+yOff,75*units,0,2*Math.PI);
	cxa.closePath();
	cxa.fill();
	
	
	if (leftOver==true&&leftA<100) {
		leftA += 2;
	} else if (leftA>0) {
		leftA -= 2;
	}
	if (rightOver==true&&rightA<100) {
		rightA += 2;
	} else if (rightA>0) {
		rightA -= 2;
	}
	cxa.fillStyle = col[1];
	
	cxa.globalAlpha = leftA/100;
	cxa.beginPath();
	cxa.arc(0,y+yOff,75*units,0,2*Math.PI);
	cxa.closePath();
	cxa.fill();
	
	cxa.globalAlpha = rightA/100;
	cxa.beginPath();
	cxa.arc(fullX,y+yOff,75*units,0,2*Math.PI);
	cxa.closePath();
	cxa.fill();
	
	
	cxa.globalAlpha = 1;
	cxa.fillStyle = col[0];
	
	cxa.beginPath();
	cxa.moveTo((units*10),y+yOff);
	cxa.lineTo((units*40),y-(units*25)+yOff);
	cxa.lineTo((units*40),y+(units*25)+yOff);
	cxa.closePath();
	cxa.fill();
	cxa.beginPath();
	cxa.moveTo(fullX-(units*10),y+yOff);
	cxa.lineTo(fullX-(units*40),y-(units*25)+yOff);
	cxa.lineTo(fullX-(units*40),y+(units*25)+yOff);
	cxa.closePath();
	cxa.fill();
	
}


///////////////////////// EFFECTS /////////////////////////////



function blossom() {
	
	for (i=0;i<blossomNo;i++) {
		
		if (blossomX[i]<(-units*10)) { // LOOP
			blossomX[i] = Math.random()*(fullX*1.5);
			blossomY[i] = (200*units) + Math.round(Math.random()*(300*units));
			blossomS[i] = -3 + Math.round(Math.random()*1);
			blossomAlpha[i] = 30 + Math.round(Math.random()*60);
		}
		
		blossomX[i] -= ((units*5) + Math.round(Math.random()*4))*trans; // x move
		blossomY[i] += ((blossomS[i]*units)*2)*trans; // y move
		
		//chance change S
		sc = Math.round(Math.random()*20);
		if (sc==5) {
			blossomS[i] += -1 + Math.round(Math.random()*2);
		}
		
		
		
		// DRAWING //
		cxa.fillStyle = corn[10];
		if (blossomY[i]<-100 && blossomAlpha[i]>1) {
		    blossomAlpha[i] -= 1;
		}
		else if (blossomY[i]>200 && blossomAlpha[i]>1) {
		    blossomAlpha[i] -= 1;
		} else if (blossomAlpha[i]<60) {
			blossomAlpha[i] += 1;
		}
		
		bx = blossomX[i];
		by = dy + yOff + blossomY[i];
		bs = blossomSize[i];
		
		cxa.globalAlpha = blossomAlpha[i]/100;
		cxa.beginPath();
		cxa.moveTo(bx-(units*(6*bs)),by); //l
		cxa.lineTo(bx,by-(units*(6*bs)));
		cxa.lineTo(bx+(units*(6*bs)),by); //r
		cxa.lineTo(bx,by+(units*(6*bs)));
		cxa.closePath();
		cxa.fill();
		
	}
}

function dust() {
	
	for (i=0;i<dustNo;i++) {
		
		if (dustX[i]<(-units*10)) { // LOOP
			dustX[i] = fullX + Math.random()*(fullX*0.5);
			dustY[i] = -(halfY) + Math.round(Math.random()*(fullY));
			dustS[i] = -2 + Math.random()*3;
		}
		
		dustX[i] -= (((units*5)*dustSize[i])+ Math.random()*2)*trans; // x move
		dustY[i] += (((dustS[i]*units)*2)*dustSize[i])*trans; // y move
		
		//chance change S
		sc = Math.round(Math.random()*20);
		if (sc==5) {
			dustS[i] += -1 + Math.random()*2;
		}
		
		if (dustS[i]<-2.5) {
			dustS[i] = -2.5;
		}
		if (dustS[i]>1.5) {
			dustS[i] = 1.5;
		}
		
		
		// DRAWING //
		cxa.fillStyle = corn[4];
		
		bx = dustX[i];
		by = dy + yOff + dustY[i];
		bs = dustSize[i];
		
		cxa.globalAlpha = 1;
		cxa.beginPath();
		cxa.moveTo(bx-(units*(6*bs)),by); //l
		cxa.lineTo(bx,by-(units*(6*bs)));
		cxa.lineTo(bx+(units*(6*bs)),by); //r
		cxa.lineTo(bx,by+(units*(6*bs)));
		cxa.closePath();
		cxa.fill();
		
	}
}

function birds() {
	
	birdTimer += 1;
	fm = Math.round(Math.random()*120);
	if (fm==1&&birdTimer>100) {
		flockAdd = -400 + (Math.random()*800);
		while (flockAdd>-100&&flockAdd<100) {
			flockAdd = -400 + (Math.random()*800);
		}
		
		flockX += flockAdd;
		flockY = -300 + (Math.random()*200);
		
		birdTimer = 0;
	}
	
	
	if (flockX<-fullX*0.7) {
		flockX = -fullX*0.7;
	}
	if (flockX>fullX*0.7) {
		flockX = fullX*0.7;
	}
	
	for (i=0;i<birdNo;i++) {
		
		bx = (birdX[i])*units;
		by = (birdY[i])*units;
			
			
		if (birdS[i]==1) { // IF FLYING
		
			ad = Math.round(Math.random()*8);
			if (ad==1) {
				
				// X //
				if (bx<((flockX-15)*units)) {
					birdXS[i] += (0.2 + (Math.random()*0.4));
				} else if (bx>((flockX+15)*units)) {
					birdXS[i] -= (0.2 + (Math.random()*0.4));
				} else {
					birdXS[i] += -0.5 + (Math.random()*1);
					while (birdXS[i]>-0.2 && birdXS[i]<0.2) {
						birdXS[i] += -0.5 + (Math.random()*1);
					}
				}
				
				// Y //
				if (by<((flockY-5)*units)) {
					birdYS[i] += (0.05 + (Math.random()*0.1));
				} else if (by>((flockY+5)*units)) {
					birdYS[i] -= (0.05 + (Math.random()*0.1));
				} else {
					birdYS[i] += -0.5 + (Math.random()*1);
					while (birdYS[i]>-0.2 && birdYS[i]<0.2) {
						birdYS[i] += -0.5 + (Math.random()*1);
					}
				}
				
				
				
			}
			
			
			if (birdXS[i] >4) { // TOP SPEEDS
				birdXS[i] = 4;
			}
			if (birdXS[i] <-4) {
				birdXS[i] = -4;
			}
			if (birdYS[i] >1) {
				birdYS[i] = 1;
			}
			if (birdYS[i]<-1) {
				birdYS[i] = -1;
			}
			
			birdX[i] += ((birdXS[i]));
			birdY[i] += ((birdYS[i]));
			
			fd = Math.round(Math.random()*8); // FLAPPING
			if (fd==1) {
				birdF[i] = -birdF[i];
			}
		
		}
		
		
			
			// DRAWING //
			
			cxa.fillStyle = col[9];
			cxa.globalAlpha = 1;
			
			bx = (birdX[i])*units;
			by = (birdY[i])*units;
			
			cxa.beginPath();
			cxa.moveTo(dx + bx,dy + yOff + (by+(units*(birdF[i]*6))));
			cxa.lineTo(dx + (bx-(units*4)),dy + yOff + by);
			cxa.lineTo(dx + (bx+(units*4)),dy +yOff + by);
			cxa.closePath();
			cxa.fill();
			
	}
}

function polygon(x, y, no, sa) {
  var a = (Math.PI * 2)/5;
  sz = pentScale;
  
   // GRAD
  
  cxa.strokeStyle = col[2];
  
  cxa.beginPath();
  cxa.moveTo(dx-(stageW*0.4),y); 
  cxa.lineTo(dx-(stageW*0.4)+(units*20),y);
  cxa.closePath();
  cxa.stroke();
  
  cxa.beginPath();
  cxa.moveTo(dx+(stageW*0.4),y); 
  cxa.lineTo(dx+(stageW*0.4)-(units*20),y);
  cxa.closePath();
  cxa.stroke();
  
  cxa.beginPath();
  cxa.moveTo(dx-(stageW*0.4)+(units*10),y-(units*10)); 
  cxa.lineTo(dx-(stageW*0.4)+(units*10),y+(units*10));
  cxa.closePath();
  cxa.stroke();
  
  cxa.beginPath();
  cxa.moveTo(dx+(stageW*0.4)-(units*10),y-(units*10)); 
  cxa.lineTo(dx+(stageW*0.4)-(units*10),y+(units*10));
  cxa.closePath();
  cxa.stroke();
  
  
  cxa.beginPath();
  cxa.moveTo(x,y-((pent[0]*sz)*units));
  for (var i = 1; i < 5; i++) {
    cxa.lineTo(x+((pent[i]*sz)*Math.cos(sa+(a*i))*units),y+((pent[i]*sz)*Math.sin(sa+(a*i))*units));
  }
  cxa.closePath();
  
  // GRAD
  var grd = cxa.createLinearGradient(x,y-(pent[0]*sz),x,y+(pent[3]*sz));
  if (pentSlide==1) {
	  grd.addColorStop(0, col[3]); 
	  grd.addColorStop(1, col[4]);
  } else {
	  grd.addColorStop(0, col[7]); 
	  grd.addColorStop(1, col[9]);
  }
  cxa.fillStyle = grd;
  cxa.fill();
  
  
  cxa.strokeStyle = col[0];
  cxa.beginPath();
  cxa.moveTo(x,y);
  cxa.lineTo(x,y-((pent[0]*sz)*units));
  cxa.closePath();
  cxa.stroke();
  for (var i = 1; i < 5; i++) {
	  cxa.beginPath();
      cxa.moveTo(x,y); 
      cxa.lineTo(x+((pent[i]*sz)*Math.cos(sa+(a*i))*units),y+((pent[i]*sz)*Math.sin(sa+(a*i))*units));
	  cxa.closePath();
      cxa.stroke();
  }
  
  
  marg = 60;
  
  cxa.strokeStyle = col[2];
  
  cxa.beginPath();
  cxa.moveTo(x + (10*units), y - (((pent[0]*sz)+0)*units)); 
  cxa.lineTo(x + (50*units), y - (((pent[0]*sz)+0)*units));
  cxa.closePath();
  cxa.stroke();
  cxa.beginPath();
  cxa.moveTo(x+(10*units)+(((pent[1]*sz)+0)*Math.cos(sa+(a*1))*units), y+(((pent[1]*sz)+0)*Math.sin(sa+(a*1))*units)); 
  cxa.lineTo(x+(50*units)+(((pent[1]*sz)+0)*Math.cos(sa+(a*1))*units), y+(((pent[1]*sz)+0)*Math.sin(sa+(a*1))*units));
  cxa.closePath();
  cxa.stroke();
  cxa.beginPath();
  cxa.moveTo(x+(10*units)+(((pent[2]*sz)+0)*Math.cos(sa+(a*2))*units), y+(((pent[2]*sz)+0)*Math.sin(sa+(a*2))*units)); 
  cxa.lineTo(x+(50*units)+(((pent[2]*sz)+0)*Math.cos(sa+(a*2))*units), y+(((pent[2]*sz)+0)*Math.sin(sa+(a*2))*units));
  cxa.closePath();
  cxa.stroke();
  
  cxa.beginPath();
  cxa.moveTo(x-(10*units)+(((pent[3]*sz)+0)*Math.cos(sa+(a*3))*units), y+(((pent[3]*sz)+0)*Math.sin(sa+(a*3))*units)); 
  cxa.lineTo(x-(50*units)+(((pent[3]*sz)+0)*Math.cos(sa+(a*3))*units), y+(((pent[3]*sz)+0)*Math.sin(sa+(a*3))*units));
  cxa.closePath();
  cxa.stroke();
  cxa.beginPath();
  cxa.moveTo(x-(10*units)+(((pent[4]*sz)+0)*Math.cos(sa+(a*4))*units), y+(((pent[4]*sz)+0)*Math.sin(sa+(a*4))*units)); 
  cxa.lineTo(x-(50*units)+(((pent[4]*sz)+0)*Math.cos(sa+(a*4))*units), y+(((pent[4]*sz)+0)*Math.sin(sa+(a*4))*units));
  cxa.closePath();
  cxa.stroke();
  
  
  cxa.fillStyle = col[1];
  cxa.font = "400 italic "+dataType+"px "+font1;
  
  cxa.textAlign = 'left';
  cxa.fillText("Handling & Storage", x + (marg*units), y - (0.2*dataType) - (((pent[0]*sz)+0)*units));
  
  cxa.fillText("Processing", x+(marg*units)+(((pent[1]*sz)+0)*Math.cos(sa+(a*1))*units), y-(0.2*dataType)+(((pent[1]*sz)+0)*Math.sin(sa+(a*1))*units));
  
  cxa.fillText("Distribution", x+(marg*units)+(((pent[2]*sz)+0)*Math.cos(sa+(a*2))*units), y-(0.2*dataType)+(((pent[2]*sz)+0)*Math.sin(sa+(a*2))*units));
  
  cxa.textAlign = 'right';
  cxa.fillText("Consumption", x-(marg*units)+(((pent[3]*sz)+0)*Math.cos(sa+(a*3))*units), y-(0.2*dataType)+(((pent[3]*sz)+0)*Math.sin(sa+(a*3))*units));
  
  cxa.fillText("Production", x-(marg*units)+(((pent[4]*sz)+0)*Math.cos(sa+(a*4))*units), y-(0.2*dataType)+(((pent[4]*sz)+0)*Math.sin(sa+(a*4))*units));
  
  
  cxa.font = "700 "+dataType+"px Roboto Condensed";
  cxa.textAlign = 'left';
  cxa.fillText(pentDest[0]+" %", x + (marg*units), y + (1*dataType) - (((pent[0]*sz)+0)*units));
  
  cxa.fillText(pentDest[1]+" %", x+(marg*units)+(((pent[1]*sz)+0)*Math.cos(sa+(a*1))*units), y+(1*dataType)+(((pent[1]*sz)+0)*Math.sin(sa+(a*1))*units));
  
  cxa.fillText(pentDest[2]+" %", x+(marg*units)+(((pent[2]*sz)+0)*Math.cos(sa+(a*2))*units), y+(1*dataType)+(((pent[2]*sz)+0)*Math.sin(sa+(a*2))*units));
  
  cxa.textAlign = 'right';
  cxa.fillText(pentDest[3]+" %", x-(marg*units)+(((pent[3]*sz)+0)*Math.cos(sa+(a*3))*units), y+(1*dataType)+(((pent[3]*sz)+0)*Math.sin(sa+(a*3))*units));
  
  cxa.fillText(pentDest[4]+" %", x-(marg*units)+(((pent[4]*sz)+0)*Math.cos(sa+(a*4))*units), y+(1*dataType)+(((pent[4]*sz)+0)*Math.sin(sa+(a*4))*units));
  
  
}



function triDraw(x,y,rat,rat2,up) {
	
	
	ts = triSide(rat);
	th = Math.sqrt( Math.pow(ts,2)-Math.pow((ts*0.5),2) );
	ts2 = triSide(rat2);
	th2 = Math.sqrt( Math.pow(ts2,2)-Math.pow((ts2*0.5),2) );
	
	
	tx = dx + (orX*units) + (x*units);
	
	
	if (up==false) {
		th = -th;
		th2 = -th2;
	} else {
		ts = -ts;
		ts2 = -ts2;
	}
	
	
	ty = dy + yOff + ((y)*units) + (th/2);
	
	// DRAW //
	cxa.globalAlpha = 0.5;
	cxa.fillStyle = col[7];
	cxa.fillStyle = triCol[triSlide];
	
	cxa.beginPath();
	cxa.moveTo(tx-(ts*0.75),ty);
	cxa.lineTo(tx+(ts*0.25),ty);
	cxa.lineTo(tx-(ts*0.25),ty-th);
	cxa.closePath();
	cxa.fill();
	
	cxa.globalAlpha = 1;
	
	cxa.beginPath();
	cxa.moveTo(tx+(ts*0.25)-ts2,ty);
	cxa.lineTo(tx+(ts*0.25),ty);
	cxa.lineTo(tx+(ts*0.25)-(ts2*0.5),ty-th2);
	cxa.closePath();
	cxa.fill();
	
}
function triSide(rat) {
	a = masterArea*rat;
	var s = ((2*Math.sqrt(a))/Math.pow(3,0.25))*units;
	return s;
}



function printAtWordWrap( context , text, x, y, lineHeight, fitWidth)
{
    fitWidth = fitWidth || 0;
    
    if (fitWidth <= 0)
    {
        context.fillText( text, x, y );
        return;
    }
    var words = text.split(' ');
    var currentLine = 0;
    var idx = 1;
    while (words.length > 0 && idx <= words.length)
    {
        var str = words.slice(0,idx).join(' ');
        var w = context.measureText(str).width;
        if ( w > fitWidth )
        {
            if (idx==1)
            {
                idx=2;
            }
            context.fillText( words.slice(0,idx-1).join(' '), x, y + (lineHeight*currentLine) );
            currentLine++;
            words = words.splice(idx-1);
            idx = 1;
        }
        else
        {idx++;}
    }
    if  (idx > 0)
        context.fillText( words.join(' '), x, y + (lineHeight*currentLine) );
}


////////////////////////////// RESIZE EVERYTHING ////////////////////////////


function resize_canvas() {
	
	canvasDestW = window.innerWidth;
	canvasDestH = window.innerHeight;
	canvasA.width  = canvasDestW;
	canvasA.height = canvasDestH;
	
	
	// UNIT SIZES //
	halfX = Math.round(canvasA.width/2);
	halfY = Math.round(canvasDestH/2);
	fullX = canvasA.width;
	fullY = canvasDestH;
	
	unitOne = (canvasA.width/100); // USED ON GUI 
	if (unitOne<6) {
		unitOne = 6;
	}
	units = unitOne*zoomLevel; // USED ON STAGE - ZOOM/PAN AFFECTED
	
	
	stageW = fullX*0.86;
	columnW = stageW/3;
		
	
	// TEXT SIZES //
	headerType = Math.round(canvasA.width/17);
	midType = Math.round(canvasA.width/50);
	dataType = Math.round(canvasA.width/80);
	bodyType = Math.round(canvasA.width/90);
	subType = Math.round(canvasA.width/90);
	
	if (headerType<25) {
		headerType = 25;
	}
	if (midType<12) {
		midType = 12;
	}
	if (dataType<10) {
		dataType = 10;
	}
	if (bodyType<10) {
		bodyType = 10;
	}
	if (subType<6) {
		subType = 6;
	}
	
	var d = document.getElementById('sharing');
	d.style.display = 'block';
	d.style.left = (halfX-(d.offsetWidth*0.5))+"px";
	d.style.top = (halfY-(d.offsetHeight*0.5))+"px";
	
	
	camTo(0,-fullY*slide,10,10);
	
	fieldDraw = 0; // REDRAW FIELD BG	
}


//////////////////////////////  MOUSE/KEYBOARD/TOUCH FUNCTIONS ////////////////////////////////


function findPos(obj) { // ENSURE CURSOR IS WHERE WE THINK IT IS
    var curleft = 0, curtop = 0;
    if (obj.offsetParent) {
        do {
            curleft += obj.offsetLeft;
            curtop += obj.offsetTop;
        } while (obj = obj.offsetParent);
        return { x: curleft, y: curtop };
    }
    return undefined;
}

function doKeyDown(e) {
	if (e.keyCode==38&&(slide>0||looped==2)) { //UP
	    upAlpha = 100;
		focused = 0;
		if (slide==-1) {
			camY = -fullY*10;
		    slide =9;
		} else {
			slide -= 1;
		}
		camTo(0,-fullY*slide,10,10);
		return;
	}
	if (e.keyCode==40) { //DOWN
	    downAlpha = 100;
		focused = 0;
		if (slide==10) {
			looped = 2;
			camY = fullY;
		    slide = 0;
		} else {
			slide += 1;
		}
		camTo(0,-fullY*slide,10,10);
		return;
	}
	if (e.keyCode==37) { //LEFT
		if (slide==3) {
			leftA = 100;
			if (triSlide>1) {
				triSlide -= 1;
			} else {
				triSlide = 3;
			}
		}
		if (slide==7) {
			leftA = 100;
			if (pentSlide>1) {
				pentSlide -= 1;
			} else {
				pentSlide = 8;
			}
		}
	}
	if (e.keyCode==39) { //RIGHT
		if (slide==3) {
			rightA = 100;
			if (triSlide<3) {
				triSlide += 1;
			} else {
				triSlide = 1;
			}
		}
		if (slide==7) {
			rightA = 100;
			if (pentSlide<8) {
				pentSlide += 1;
			} else {
				pentSlide = 1;
			}
		}
	}

}

function mouseMove(event) {
	var pos = findPos(this);
    var x = event.pageX - pos.x;
    var y = event.pageY - pos.y;

    var mox = x;
	var moy = y;
	
	mouseX = mox;
    mouseY = moy;
	
	
	
	// ARROWS //
	shareOver = hudCheck(0,fullY-(unitOne*5),10*unitOne,5*unitOne);
	wvOver = hudCheck(halfX-(unitOne*6),halfY+(60),12*unitOne,50);
	upA = hudCheck(halfX-(unitOne*3),0,6*unitOne,5*unitOne);
	downA = hudCheck(halfX-(unitOne*3),fullY-(unitOne*5),6*unitOne,5*unitOne);
	nextBTN = hudCheck(dx+(stageW*0.5)-(units*160),dy+(fullY*3)+(units*190),160*units,60*units);
	
	leftOver = hudCheck(0,arrowH+yOff-(units*75),75*units,150*units);
	rightOver = hudCheck(fullX-(75*units),arrowH+yOff-(units*75),75*units,150*units);
	
	if (slide==9) {
		refRoll1 = hudCheck(halfX-(columnW*1.5),halfY-(units*180),columnW,60*units);
		refRoll2 = hudCheck(halfX-(columnW*1.5),halfY-(units*100),columnW,60*units);
		refRoll3 = hudCheck(halfX-(columnW*1.5),halfY-(units*20),columnW,60*units);
		refRoll4 = hudCheck(halfX-(columnW*1.5),halfY+(units*60),columnW,60*units);
	}
}

function mouseRelease(event) {
	keyInput.focus();
}



function squareCheck(x,y,w,h) { // IS CURSOR WITHIN GIVEN BOUNDARIES

    cx = dx + (x*units);
	cy = dy + (y*units);
	mx = mouseX;
	my = mouseY;
	
	if (mx>cx && mx<(cx+w) && my>cy && my<(cy+h)) {
		return true;
	} else {return false};
	
}

function hudCheck(x,y,w,h) { // IS CURSOR WITHIN GIVEN BOUNDARIES

	mx = mouseX;
	my = mouseY;
	
	if (mx>x && mx<(x+w) && my>y && my<(y+h)) {
		return true;
	} else {return false};
	
}




function rollTimer(t) { // CLICK DELAY
	setTimeout(function(){
				
				//rollCheck2();
				},t);
}





function getPosition(event) { // ANY MOUSECLICK

	
	mox = mouseX;
	moy = mouseY;
	
	////// SHARE SCREEN //////
	
	
	if (wvOver==true && shareState==2) {
		window.open("http://whitevinyldesign.com","_blank");
		return;
	}
	
	
	if (shareOver==true && shareState==1) {
		var d = document.getElementById('sharing');
		d.style.display = 'block';
		d.style.left = (halfX-(d.offsetWidth*0.5))+"px";
	    d.style.top = (halfY-(d.offsetHeight*0.5))+"px";
		shareState = 2;
		return;
	}
	if (shareState==2&&shareA>5) {
		shareState = 3;
		return;
	}
	
	// REF //
	if (refRoll1==true && shareState==1) {
		window.open("http://www.fao.org/nr/sustainability/food-loss-and-waste/en/","_blank");
		return;
	}
	if (refRoll2==true && shareState==1) {
		window.open("http://www.imeche.org/knowledge/themes/environment/global-food","_blank");
		return;
	}
	if (refRoll3==true && shareState==1) {
		window.open("http://www.fao.org/hunger/en/","_blank");
		return;
	}
	if (refRoll4==true && shareState==1) {
		window.open("http://www.undp.org/content/undp/en/home/librarypage/hdr/human-development-report-2006/","_blank");
		return;
	}
	
	
	////// ARROWS //////
	
	if (moy<(unitOne*5)&&(slide>0||looped==2)) {
		focused = 0;
		if (slide==-1) {
			camY = -fullY*10;
		    slide =9;
		    camTo(0,-fullY*slide,10,10); // UP	
		} else {
			slide -= 1;
			camTo(0,-fullY*slide,10,10); // UP
		}
		return;
	}
	
	if (moy>(fullY-unitOne*5)) {
		focused = 0;
		if (slide==10) {
			looped = 2;
			camY = fullY;
			slide = 0;
			camTo(0,-fullY*slide,10,10); // DOWN
		} else {
			slide += 1;
			camTo(0,-fullY*slide,10,10); // DOWN
		}
		return;
	}
	
	if (slide==2) {
		flockX = (mox-halfX)/units;
	}
	
	if (slide==3) {
		if (leftOver==true) {
			leftA = 100;
			if (triSlide>1) {
				triSlide -= 1;
			} else {
				triSlide = 3;
			}
		} else {
			rightA = 100;
			if (triSlide<3) {
				triSlide += 1;
			} else {
				triSlide = 1;
			}
		}
	}
	
	
	if (slide==7) {
		if (leftOver==true) {
			leftA = 100;
			if (pentSlide>1) {
				pentSlide -= 1;
			} else {
				pentSlide = 8;
			}
		} else {
			rightA = 100;
			if (pentSlide<8) {
				pentSlide += 1;
			} else {
				pentSlide = 1;
			}
		}
		
		
		
		
	}
	
	//rollTimer(200);
}








function testing() {
	
    // TEXT
	cxa.globalAlpha = 1;
	cxa.textAlign = 'center';
	cxa.fillStyle = "#fff";
	cxa.font = "20px PT Sans";
	
	//cxa.fillText(refRoll1, halfX, 80);
	//cxa.fillText(halfX, halfX, 110);
	//cxa.fillText(  slide , halfX, 130);
	
	
	
}
