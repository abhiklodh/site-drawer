// JavaScript Document

function slide1() {
	
	cxa.globalAlpha = 1;
	yOff = (fullY*1);
	
	cxa.fillStyle = col[1];
	clockLine("Agriculture resources used in ",270);
	
	
	
	cxa.font = "400 italic "+(midType)+"px "+font1;
	cxa.fillText("Diesel", dx-(columnW), dy-(units*145)+yOff);
	cxa.fillText("Energy", dx, dy-(units*145)+yOff);
	cxa.fillText("Fertilizer", dx+(columnW), dy-(units*145)+yOff);
	
	cxa.fillText("Water", dx, dy+(units*105)+yOff);
	
	cxa.font = "400 "+(dataType)+"px Cabin Condensed";
	cxa.fillText("tonnes", dx-(columnW), dy-(units*5)+yOff);
	cxa.fillText("gigajoules", dx, dy-(units*5)+yOff);
	cxa.fillText("tonnes", dx+(columnW), dy-(units*5)+yOff);
	
	cxa.fillText("tonnes", dx, dy+(units*245)+yOff);
	
	
	
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
			
		
		
	
	cxa.font = "700 "+(headerType)+"px Roboto Condensed";
	
	cxa.fillStyle = col[6];
	cxa.fillText(numberWithCommas(Math.round(diesel)), dx-(columnW), dy-(units*46)+yOff);
	cxa.fillStyle = col[6];
	cxa.fillText(numberWithCommas(Math.round(energy)), dx, dy-(units*46)+yOff);
	cxa.fillStyle = col[6];
	cxa.fillText(numberWithCommas(Math.round(fert)), dx+(columnW), dy-(units*46)+yOff);
	
	
	cxa.fillStyle = col[4];
	cxa.fillText(numberWithCommas(Math.round(water)), dx, dy+(units*204)+yOff);
	
	
	cxa.textAlign = 'right';
	cxa.fillStyle = col[2];
	cxa.font = "400 "+(bodyType)+"px Cabin Condensed";
	cxa.fillText("[2][4]", dx+(stageW*0.5), dy+(units*360)+yOff);
}