// JavaScript Document

function slide7() {
	
	cxa.globalAlpha = 1;
	yOff = (fullY*7);
	
	if (pentSlide==1) { // WORLD
		pentDest[0]=22.2;
		pentDest[1]=11.4;
		pentDest[2]=12.4;
		pentDest[3]=21.6;
		pentDest[4]=32.4;
		titleTxt = "Worldwide";
		
	} else if (pentSlide==2) { // NA & O
		pentDest[0]=10;
		pentDest[1]=10;
		pentDest[2]=8;
		pentDest[3]=39;
		pentDest[4]=33;
		titleTxt = "North America & Oceania";
		
	} else if (pentSlide==3) { // EU
		pentDest[0]=10.5;
		pentDest[1]=12;
		pentDest[2]=6.5;
		pentDest[3]=34;
		pentDest[4]=37;
		titleTxt = "Europe";
		
	} else if (pentSlide==4) { // SSA
		pentDest[0]=35;
		pentDest[1]=13;
		pentDest[2]=13;
		pentDest[3]=4;
		pentDest[4]=35;
		titleTxt = "Sub-Saharan Africa";
		
	} else if (pentSlide==5) { // NA
		pentDest[0]=20.5;
		pentDest[1]=18.5;
		pentDest[2]=15;
		pentDest[3]=15.5;
		pentDest[4]=30.5;
		titleTxt = "North Africa, Western & Central Asia";
		
	} else if (pentSlide==6) { // SA
		pentDest[0]=34.5;
		pentDest[1]=9.5;
		pentDest[2]=15.5;
		pentDest[3]=9.5;
		pentDest[4]=31;
		titleTxt = "South & Southeast Asia";
		
	} else if (pentSlide==7) { // IA
		pentDest[0]=19.5;
		pentDest[1]=9.5;
		pentDest[2]=13;
		pentDest[3]=31;
		pentDest[4]=27;
		titleTxt = "Industrialised Asia";
		
	} else if (pentSlide==8) { // LA
		pentDest[0]=21.5;
		pentDest[1]=16.5;
		pentDest[2]=11;
		pentDest[3]=11;
		pentDest[4]=40;
		titleTxt = "Latin America";
		
	}
	
	
	
	if (pent[3]>pent[2]) {
	    basePent = pent[3];
	} else {
		basePent = pent[2];
	}
	
	
	pentOff = (((pent[0]*pentScale)+((basePent*pentScale)*0.8))*0.5) - (pent[0]*pentScale);
	
	
	cxa.strokeStyle = col[0];
	polygon(dx,dy+yOff+(units*40)+(pentY*units),pent,-Math.PI/2);
	
	cxa.fillStyle = col[1];
	cxa.textAlign = 'center';
	cxa.font = "400 italic "+midType+"px "+font1;
	cxa.fillText("Stages of food waste: "+titleTxt, dx, dy + yOff - (units*270));
	
	
	
	cxa.font = "400 italic "+bodyType+"px "+font1;
	cxa.fillText((pentSlide)+" of 8", dx, dy + yOff + (units*305));
	
	
	dotDivide(dy-(units*220)+yOff);
	dotSection(-(stageW*0.5),dy+(units*300)+yOff,(stageW*0.5)-(60*units));
	dotSection(60*units,dy+(units*300)+yOff,(stageW*0.5)-(60*units));
	
	scrollArrows(dy+(units*40));
	
	
	cxa.font = "400 "+(headerType*0.6)+"px Cabin Condensed";
    cxa.textAlign = 'right';
	cxa.fillStyle = col[2];
	cxa.font = "400 "+(bodyType)+"px Cabin Condensed";
	cxa.fillText("[1]", dx+(stageW*0.5), dy+(units*360)+yOff);
}