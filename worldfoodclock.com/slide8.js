// JavaScript Document

function slide8() {
	
	cxa.globalAlpha = 1;
	yOff = (fullY*8);
	cxa.fillStyle = col[1];
	
	if (totalA1>0 && totalA1<100) {
		totalA1 += 2;
	}
	if (totalA1>50 && totalA2<100) {
		totalA2 += 2;
	}
	
	
	
	
	cxa.font = "400 italic "+(midType)+"px "+font1;
	cxa.textAlign = 'center';
	cxa.fillText("Global food waste & the effects: Estimated annual waste totals", dx, dy-(units*270)+yOff);
	
	cxa.fillText("Food", dx-(columnW), dy-(units*145)+yOff);
	cxa.fillText("Greenhouse Gas", dx, dy-(units*145)+yOff);
	cxa.fillText("Energy", dx+(columnW), dy-(units*145)+yOff);
	
	
	cxa.fillText("Water", dx-(columnW), dy+(units*105)+yOff);
	cxa.fillText("Land", dx, dy+(units*105)+yOff);
	cxa.fillText("Cost", dx+(columnW), dy+(units*105)+yOff);
	
	
	cxa.font = "400 "+(dataType)+"px Cabin Condensed";
	cxa.fillText("billion tonnes", dx-(columnW), dy-(units*5)+yOff);
	cxa.fillText("billion tonnes", dx, dy-(units*5)+yOff);
	cxa.fillText("billion gigajoules", dx+(columnW), dy-(units*5)+yOff);
	
	cxa.fillText("billion tonnes", dx-(columnW), dy+(units*245)+yOff);
	cxa.fillText("billion hectares", dx, dy+(units*245)+yOff);
	cxa.fillText("billion USD", dx+(columnW), dy+(units*245)+yOff);
	cxa.fillStyle = col[2];
	cxa.fillText("(blue water footprint)", dx-(columnW), dy+(units*272)+yOff);
	
	dotDivide(dy-(units*220)+yOff);
	dotDivide(dy+(units*40)+yOff);
	dotDivide(dy+(units*300)+yOff);
	
	
	cxa.strokeStyle = col[1];
	cxa.beginPath();
	cxa.moveTo(dx-(columnW/2),dy-(units*170)+yOff);
	cxa.lineTo(dx-(columnW/2),dy+(units*0)+yOff);
	cxa.stroke();
	
	cxa.beginPath();
	cxa.moveTo(dx+(columnW/2),dy-(units*170)+yOff);
	cxa.lineTo(dx+(columnW/2),dy+(units*0)+yOff);
	cxa.stroke();	
			
	cxa.beginPath();
	cxa.moveTo(dx-(columnW/2),dy+(units*90)+yOff);
	cxa.lineTo(dx-(columnW/2),dy+(units*260)+yOff);
	cxa.stroke();
	
	cxa.beginPath();
	cxa.moveTo(dx+(columnW/2),dy+(units*90)+yOff);
	cxa.lineTo(dx+(columnW/2),dy+(units*260)+yOff);
	cxa.stroke();		
		
	cxa.fillStyle = col[1];
	cxa.font = "700 "+(headerType)+"px Roboto Condensed";
	cxa.globalAlpha = totalA1/100;
	cxa.fillStyle = col[3];
	cxa.fillText("1.3", dx-(columnW), dy-(units*46)+yOff);
	cxa.fillText("3.3", dx, dy-(units*46)+yOff);
	cxa.fillText("2.9", dx+(columnW), dy-(units*46)+yOff);
	
	cxa.globalAlpha = totalA2/100;
	cxa.fillStyle = col[4];
	cxa.fillText("250", dx-(columnW), dy+(units*204)+yOff);
	cxa.fillText("1.4", dx, dy+(units*204)+yOff);
	cxa.fillText("750", dx+(columnW), dy+(units*204)+yOff);
	
	cxa.globalAlpha = 1;
	cxa.textAlign = 'right';
	cxa.fillStyle = col[2];
	cxa.font = "400 "+(bodyType)+"px Cabin Condensed";
	cxa.fillText("[1][2]", dx+(stageW*0.5), dy+(units*360)+yOff);
}