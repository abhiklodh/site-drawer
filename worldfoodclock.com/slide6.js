// JavaScript Document

function slide6() {
	
	cxa.globalAlpha = 1;
	yOff = (fullY*6);
	
	
	cxa.fillStyle = col[1];
	cxa.textAlign = 'center';
	cxa.font = "400 italic "+(midType)+"px "+font1;
	cxa.fillText("Global Value", dx, dy+yOff-(units*65));
	cxa.fillText("Economic cost to food producers", dx, dy+yOff+(units*215));
	
	clockLine("Wasted food in ",190);
	
	cxa.textAlign = 'center';
	cxa.font = "400 "+(dataType)+"px Cabin Condensed";
	cxa.fillText("USD", dx, dy+yOff+(units*80));
	
	cxa.strokeStyle = col[2];
	
	dotDivide(dy+yOff-(units*150));
	dotDivide(dy+yOff+(units*150));
	
	cxa.font = "700 "+(headerType)+"px Roboto Condensed";
	
	cxa.fillStyle = col[3];
	cxa.fillText("$ "+numberWithCommas(Math.round(dollars)), dx, dy+yOff+(units*34));
    
	cxa.textAlign = 'right';
	cxa.fillStyle = col[2];
	cxa.font = "400 "+(bodyType)+"px Cabin Condensed";
	cxa.fillText("[1]", dx+(stageW*0.5), dy+(units*210)+yOff);
}