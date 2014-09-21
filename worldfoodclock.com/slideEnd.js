// JavaScript Document

function slideEnd() {
	
	cxa.globalAlpha = 1;
	yOff = (fullY*9);
	cxa.fillStyle = col[1];
	
	
	cxa.textAlign = 'left';
	cxa.font = "700 "+(dataType)+"px Roboto Condensed";
	if (refRoll1==true) {cxa.fillStyle = col[3];} else {cxa.fillStyle = col[1];}
	cxa.fillText("FAO.org 2013", dx-columnW*1.45, dy-(units*133)+yOff);
	if (refRoll2==true) {cxa.fillStyle = col[3];} else {cxa.fillStyle = col[1];}
	cxa.fillText("IMECHE.org 2013", dx-columnW*1.45, dy-(units*53)+yOff);
	if (refRoll3==true) {cxa.fillStyle = col[3];} else {cxa.fillStyle = col[1];}
	cxa.fillText("FAO.org 2013", dx-columnW*1.45, dy+(units*27)+yOff);
	if (refRoll4==true) {cxa.fillStyle = col[3];} else {cxa.fillStyle = col[1];}
	cxa.fillText("UNDP.org 2006", dx-columnW*1.45, dy+(units*107)+yOff);
	
	cxa.fillStyle = col[1];
	cxa.font = "400 "+(dataType)+"px Cabin Condensed";
	notesTxt = "All figures are estimates, clock values take a per capita estimate and average it over seconds per year. Water usage per second is based on 70% of total estimated human consumption [4], while the total for water wasted is based on the 'blue water footprint'. [1] This is water taken from the ground or surface (rivers,lakes etc). The rest is largely made up of rainwater and so has a relatively low environmental impact.";
	printAtWordWrap(cxa, notesTxt, dx, dy+yOff-(units*160), bodyType*1.4, columnW*1.45 );
	
	
	
	cxa.font = "400 italic "+(dataType)+"px "+font1;
	if (refRoll1==true) {cxa.fillStyle = col[3];} else {cxa.fillStyle = col[1];}
	cxa.fillText("1. 'Food Wastage Footprint'", dx-columnW*1.5, dy-(units*160)+yOff);
	if (refRoll2==true) {cxa.fillStyle = col[3];} else {cxa.fillStyle = col[1];}
	cxa.fillText("2. 'Global Food Report'", dx-columnW*1.5, dy-(units*80)+yOff);
	if (refRoll3==true) {cxa.fillStyle = col[3];} else {cxa.fillStyle = col[1];}
	cxa.fillText("3. 'State of Food Insecurity in the World'", dx-columnW*1.5, dy-(units*0)+yOff);
	if (refRoll4==true) {cxa.fillStyle = col[3];} else {cxa.fillStyle = col[1];}
	cxa.fillText("4. 'Human Development Report'", dx-columnW*1.5, dy+(units*80)+yOff);
	
	
	
	
	
	dotDivide(dy-(units*220)+yOff);
	dotDivide(dy+(units*220)+yOff);
	
	// UPRIGHTS //
	/*cxa.strokeStyle = col[1];
	cxa.beginPath();
	cxa.moveTo(dx,dy-(units*170)+yOff);
	cxa.lineTo(dx,dy+(units*170)+yOff);
	cxa.stroke();*/			
		
	
}