// JavaScript Document

function slide0() {
	cxa.globalAlpha = 1;
	
	yOff = 0;
	
	
	cxa.fillStyle = col[1];
	clockLine("The World's food in ",200);
	
	
	
	cxa.font = "400 italic "+(midType)+"px "+font1;
	cxa.fillText("Produced", dx-(columnW), dy-(units*65));
	cxa.fillText("Consumed", dx, dy-(units*65));
	cxa.fillText("Wasted", dx+(columnW), dy-(units*65));
	
	cxa.font = "400 "+(dataType)+"px Cabin Condensed";
	cxa.fillText("tonnes", dx-(columnW), dy+(units*75));
	cxa.fillText("tonnes", dx, dy+(units*75));
	cxa.fillText("tonnes", dx+(columnW), dy+(units*75));
	
	
	dotDivide(dy-(units*150));
	dotDivide(dy+(units*150));
	
	// UPRIGHTS //
	cxa.strokeStyle = col[1];
	cxa.beginPath();
	cxa.moveTo(dx-(columnW/2),dy-(units*100));
	cxa.lineTo(dx-(columnW/2),dy+(units*100));
	cxa.stroke();	
		
	cxa.beginPath();
	cxa.moveTo(dx+(columnW/2),dy-(units*100));
	cxa.lineTo(dx+(columnW/2),dy+(units*100));
	cxa.stroke();	
			
		
	cxa.font = "700 "+(headerType)+"px Roboto Condensed";
	
	cxa.fillStyle = col[3];
	cxa.fillText(numberWithCommas(Math.round(clockP)), dx-columnW, dy+(units*34));
	cxa.fillStyle = col[4];
	cxa.fillText(numberWithCommas(Math.round(clockP-clockW)), dx, dy+(units*34));
	cxa.fillStyle = col[5];
	cxa.fillText(numberWithCommas(Math.round(clockW)), dx+columnW, dy+(units*34));
	
	
	cxa.textAlign = 'left';
	cxa.fillStyle = col[2];
	cxa.font = "400 "+(bodyType)+"px Cabin Condensed";
	var txt1 = "Figures shown are based on report estimates from FAO and IMECHE. [1][2]. Clock values are averaged over seconds per year. 2014.";
	printAtWordWrap(cxa, txt1, dx+columnW/2, dy+(units*210), bodyType*1.2, columnW );
	
}