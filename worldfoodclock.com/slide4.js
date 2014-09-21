// JavaScript Document

function slide4() {
	cxa.globalAlpha = 1;
	
	yOff = (fullY*4);
	
	if (popA>0 && popA<100) {
		popA += 1;
	}
	
	cxa.textAlign = 'center';
	cxa.fillStyle = col[1];
	
	cxa.font = "400 italic "+(midType)+"px "+font1;
	cxa.fillText("Global Undernourishment", dx, dy+yOff-(units*65));
	
	cxa.font = "400 "+(dataType)+"px Cabin Condensed";
	cxa.fillText("people", dx, dy+yOff+(units*75));
	
	cxa.strokeStyle = col[2];
	
	dotDivide(dy+yOff-(units*150));
	dotSection(-(stageW*0.5),dy+(units*150)+yOff,(stageW*0.5)-(60*units));
	dotSection(60*units,dy+(units*150)+yOff,(stageW*0.5)-(60*units));
	
	cxa.font = "700 "+(headerType)+"px Roboto Condensed";
	
	cxa.fillStyle = col[6];
	cxa.fillText("842,000,000", dx, dy+yOff+(units*34));
	
	cxa.globalAlpha = popA/100;
	cxa.fillStyle = col[1];
	
	cxa.font = "400 italic "+(midType)+"px "+font1;
	cxa.fillText("12%", dx, dy+yOff+(units*160));
    cxa.font = "400 "+(dataType)+"px Cabin Condensed";
	cxa.fillText("of the world population", dx, dy+yOff+(units*200));
	
	cxa.globalAlpha = 1;
	cxa.textAlign = 'right';
	cxa.fillStyle = col[2];
	cxa.font = "400 "+(bodyType)+"px Cabin Condensed";
	cxa.fillText("[3]", dx+(stageW*0.5), dy+(units*210)+yOff);
}