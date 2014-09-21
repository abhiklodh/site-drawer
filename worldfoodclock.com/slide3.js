// JavaScript Document

function slide3() {
	
	cxa.globalAlpha = 1;
	yOff = (fullY*3);
	cxa.fillStyle = col[1];
	
	
	
	if (triSlide<2) {
		
		title = "1 hectare of land will produce 1 year's worth of...";
		
		txt1a = "19-22  ";
		txt1b = "people";
		
		txt2a = "1-2  ";
		txt2b = "people";
		
		txt3a = "";
		txt3b = "Rice or Potatoes";
		
		txt4a = "";
		txt4b = "Lamb or Beef";
		
		txt5 = "to feed";
		
		btnText = "Energy";
		
	} else if (triSlide==2) {
		
		title = "Energy used in production...";
		
		txt1a = "3  ";
		txt1b = "calories of energy";
		
		txt2a = "35  ";
		txt2b = "calories of energy";
		
		txt3a = "1  ";
		txt3b = "calorie of plant";
		
		txt4a = "1  ";
		txt4b = "calorie of beef";
		
		txt5 = "requires";
		
		btnText = "Water";
		
	} else {
		
		title = "Water used in production...";
		
		txt1a = "500-4,000  ";
		txt1b = "litres";
		
		txt2a = "5,000-20,000  ";
		txt2b = "litres";
		
		txt3a = "1";
		txt3b = "kg of wheat";
		
		txt4a = "1";
		txt4b = "kg of meat";
		
		txt5 = "requires";
		
		btnText = "Land";
		
	}
	
	cxa.font = "700 "+midType+"px Roboto Condensed";
	w1 = (cxa.measureText(txt1a).width);
	w3 = (cxa.measureText(txt2a).width);
	w5 = (cxa.measureText(txt3a).width);
	w7 = (cxa.measureText(txt4a).width);
	
	
	cxa.font = "400 italic "+midType+"px "+font1;
	w2 = (cxa.measureText(txt1b).width);
	w4 = (cxa.measureText(txt2b).width);
	w6 = (cxa.measureText(txt3b).width);
	w8 = (cxa.measureText(txt4b).width);
	
	cxa.textAlign = 'left';
	
	cxa.font = "700 "+midType+"px Roboto Condensed";
	cxa.fillText(txt1a, dx-(stageW*0.32)-((w1+w2)/2), dy + yOff + (units*90));
	cxa.fillText(txt2a, dx+(stageW*0.32)-((w3+w4)/2), dy + yOff + (units*90));
	cxa.fillText(txt3a, dx-(stageW*0.32)-((w5+w6)/2), dy + yOff + (units*5));
	cxa.fillText(txt4a, dx+(stageW*0.32)-((w7+w8)/2), dy + yOff + (units*5));
	
	
	cxa.font = "400 italic "+midType+"px "+font1;
	cxa.fillText(txt1b, dx-(stageW*0.32)-(((w1+w2)/2))+w1, dy + yOff + (units*90));
	cxa.fillText(txt2b, dx+(stageW*0.32)-(((w3+w4)/2))+w3, dy + yOff + (units*90));
	cxa.fillText(txt3b, dx-(stageW*0.32)-(((w5+w6)/2))+w5, dy + yOff + (units*5));
	cxa.fillText(txt4b, dx+(stageW*0.32)-(((w7+w8)/2))+w7, dy + yOff + (units*5));
	
	cxa.textAlign = 'center';
	
	
	
	cxa.fillText(title, dx, dy + yOff - (units*270));
	
	cxa.font = "400 "+(dataType)+"px Cabin Condensed";
	cxa.fillText(txt5, dx-(stageW*0.32), dy+(units*45)+yOff);
	cxa.fillText(txt5, dx+(stageW*0.32), dy+(units*45)+yOff);
	
	
	
	cxa.font = "400 italic "+bodyType+"px "+font1;
	cxa.fillText((triSlide)+" of 3", dx, dy + yOff + (units*305));
	
	if (triSlide<2) {
		cxa.font = "400 italic "+midType+"px "+font1;
		cxa.fillText("or", dx+(orX*units), dy + yOff + (units*48));
		
		
		cxa.strokeStyle = col[1];
		cxa.beginPath();
		cxa.moveTo(dx+(units*92)+(orX*units),dy-(units*120)+yOff);
		cxa.lineTo(dx+(units*17)+(orX*units),dy+(units*10)+yOff);
		cxa.stroke();
		
		cxa.beginPath();
		cxa.moveTo(dx-(units*17)+(orX*units),dy+(units*70)+yOff);
		cxa.lineTo(dx-(units*92)+(orX*units),dy+(units*200)+yOff);
		cxa.stroke();
	} else {
		cxa.strokeStyle = col[1];
		cxa.beginPath();
		cxa.moveTo(dx+(units*92)+(orX*units),dy-(units*120)+yOff);
		cxa.lineTo(dx-(units*92)+(orX*units),dy+(units*200)+yOff);
		cxa.stroke();
	}
	
	
	dotDivide(dy-(units*220)+yOff);
	dotSection(-(stageW*0.5),dy+(units*300)+yOff,(stageW*0.5)-(60*units));
	dotSection(60*units,dy+(units*300)+yOff,(stageW*0.5)-(60*units));
	
		
			
	
	triDraw(-40,40,rat1,rat2,false);
	triDraw(40,40,rat3,rat4,true);
	
	
	// BUTTON //
	scrollArrows(dy+(40*units));
	
	cxa.textAlign = 'right';
	cxa.fillStyle = col[2];
	cxa.font = "400 "+(bodyType)+"px Cabin Condensed";
	cxa.fillText("[2]", dx+(stageW*0.5), dy+(units*360)+yOff);
}