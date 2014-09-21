// JavaScript Document

function slide2() {
	
	cxa.globalAlpha = 1;
	yOff = (fullY*2);
	
	/*cxa.fillStyle = corn[0];
	cxa.fillRect(0,dy+(yOff-halfY),fullX,halfY); // SKY
	
	cxa.fillStyle = corn[2]; // SUN
	cxa.beginPath();
	cxa.arc(dx+(units*500), dy+yOff-(units*180), units*60, 0, 2 * Math.PI, false);
	cxa.closePath();
	cxa.fill();
	
	cxa.fillStyle = corn[1]; // CLOUD
	cxa.beginPath();
	cxa.moveTo(0,dy+yOff-(units*340));
	cxa.lineTo(dx-(units*610),dy+yOff-(units*330));
	cxa.lineTo(dx-(units*520),dy+yOff-(units*310));
	cxa.lineTo(dx-(units*400),dy+yOff-(units*300));
	cxa.lineTo(dx-(units*220),dy+yOff-(units*260));
	cxa.lineTo(dx-(units*420),dy+yOff-(units*260));
	cxa.lineTo(dx-(units*500),dy+yOff-(units*240));
	cxa.lineTo(dx-(units*300),dy+yOff-(units*180));
	cxa.lineTo(dx-(units*40),dy+yOff-(units*200));
	cxa.lineTo(dx+(units*140),dy+yOff-(units*220));
	cxa.lineTo(dx+(units*210),dy+yOff-(units*240));
	cxa.lineTo(dx+(units*90),dy+yOff-(units*250));
	cxa.lineTo(dx+(units*280),dy+yOff-(units*290));
	cxa.lineTo(dx+(units*500),dy+yOff-(units*300));
	cxa.lineTo(dx+(units*350),dy+yOff-(units*250));
	cxa.lineTo(dx+(units*400),dy+yOff-(units*220));
	cxa.lineTo(dx+(units*380),dy+yOff-(units*160));
	cxa.lineTo(dx+(units*640),dy+yOff-(units*180));
	cxa.lineTo(fullX,dy+yOff-(units*160));
	cxa.lineTo(fullX,dy+yOff);
	cxa.lineTo(0,dy+yOff);
	cxa.closePath();
	cxa.fill();
	
	cxa.fillStyle = corn[3]; // CLOUD
	cxa.beginPath();
	cxa.moveTo(dx-(units*360),dy+yOff-(units*220)); // l
	cxa.lineTo(dx-(units*160),dy+yOff-(units*240));
	cxa.lineTo(dx-(units*40),dy+yOff-(units*200));
	cxa.lineTo(dx+(units*200),dy+yOff-(units*190));
	cxa.lineTo(dx+(units*400),dy+yOff-(units*160)); // r
	cxa.lineTo(dx+(units*60),dy+yOff-(units*160));
	cxa.lineTo(dx+(units*230),dy+yOff-(units*140));
	cxa.lineTo(dx-(units*0),dy+yOff-(units*120));
	cxa.lineTo(dx-(units*100),dy+yOff-(units*160));
	cxa.lineTo(dx-(units*180),dy+yOff-(units*160));
	cxa.lineTo(dx-(units*220),dy+yOff-(units*200));
	cxa.lineTo(dx-(units*320),dy+yOff-(units*200));
	cxa.closePath();
	cxa.fill();
	
	cxa.beginPath();
	cxa.moveTo(dx+(units*580),dy+yOff-(units*120)); // l
	cxa.lineTo(fullX,dy+yOff-(units*130));
	cxa.lineTo(fullX,dy+yOff-(units*90));
	cxa.closePath();
	cxa.fill();
	
	cxa.fillStyle = corn[4]; // HILLS
	cxa.beginPath();
	cxa.moveTo(0,dy+yOff-(units*90));
	cxa.lineTo(dx-(units*300),dy+yOff-(units*100));
	cxa.lineTo(dx-(units*100),dy+yOff-(units*80));
	cxa.lineTo(dx+(units*20),dy+yOff-(units*95));
	cxa.lineTo(dx+(units*400),dy+yOff-(units*70));
	cxa.lineTo(dx+(units*600),dy+yOff-(units*70));
	cxa.lineTo(fullX,dy+yOff-(units*40));
	cxa.lineTo(fullX,dy+yOff+halfY);
	cxa.lineTo(0,dy+yOff+halfY);
	cxa.closePath();
	cxa.fill();
	
	cxa.fillStyle = corn[5]; // LAND 1
	cxa.beginPath();
	cxa.moveTo(0,dy+yOff-(units*110));
	cxa.lineTo(dx-(units*400),dy+yOff-(units*65));
	cxa.lineTo(dx+(units*100),dy+yOff-(units*70));
	cxa.lineTo(dx+(units*200),dy+yOff-(units*75));
	cxa.lineTo(dx+(units*500),dy+yOff-(units*60));
	cxa.lineTo(fullX,dy+yOff-(units*30));
	cxa.lineTo(fullX,dy+yOff+halfY);
	cxa.lineTo(0,dy+yOff+halfY);
	cxa.closePath();
	cxa.fill();
	
	cxa.fillStyle = corn[6]; // LAND 2
	cxa.beginPath();
	cxa.moveTo(0,dy+yOff-(units*30));
	cxa.lineTo(dx-(units*500),dy+yOff-(units*20));
	cxa.lineTo(dx+(units*100),dy+yOff-(units*60));
	cxa.lineTo(dx+(units*220),dy+yOff-(units*45));
	cxa.lineTo(dx+(units*550),dy+yOff-(units*20));
	cxa.lineTo(fullX,dy+yOff+(units*10));
	cxa.lineTo(fullX,dy+yOff+halfY);
	cxa.lineTo(0,dy+yOff+halfY);
	cxa.closePath();
	cxa.fill();
	
	cxa.fillStyle = corn[7]; // LAND 3
	cxa.beginPath();
	cxa.moveTo(0,dy+yOff+(units*30));
	cxa.lineTo(dx-(units*550),dy+yOff+(units*50));
	cxa.lineTo(dx-(units*300),dy+yOff+(units*90));
	cxa.lineTo(dx+(units*0),dy+yOff+(units*65));
	cxa.lineTo(dx+(units*200),dy+yOff+(units*70));
	cxa.lineTo(dx+(units*460),dy+yOff+(units*30));
	cxa.lineTo(fullX,dy+yOff+(units*20));
	cxa.lineTo(fullX,dy+yOff+halfY);
	cxa.lineTo(0,dy+yOff+halfY);
	cxa.closePath();
	cxa.fill();*/
	
	// MASK //
    cxa.save();
	cxa.beginPath();
	cxa.moveTo(0,dy+yOff-halfY); //tl
	cxa.lineTo(fullX,dy+yOff-halfY); //tr
	cxa.lineTo(fullX,dy+yOff+halfY); //br
	cxa.lineTo(0,dy+yOff+halfY); //bl
	cxa.closePath();
	cxa.clip();
	
	
	cxa.globalAlpha = 1;
	if (fullX<1000) {
		cxa.drawImage(fieldImgS,0,dy-(fullX*0.5)+yOff,fullX,fullX);
	} else {
	    cxa.drawImage(fieldImg,0,dy-(fullX*0.5)+yOff,fullX,fullX);
	}
	
	birds();
	blossom();
	cxa.restore();
	
	cxa.globalAlpha = 1;
	cxa.fillStyle = col[0]; // SUN
	cxa.beginPath();
	cxa.arc(dx+(units*0), dy+yOff-(units*0), units*320, 0, 2 * Math.PI, false);
	cxa.closePath();
	cxa.fill();
	
	dotSection(-(units*280),dy+yOff,(units*560));
	
	cxa.globalAlpha = 1;
	cxa.textAlign = 'center';
	cxa.fillStyle = col[1];
	
	cxa.font = "400 italic "+midType+"px "+font1;
	cxa.fillText("Land used to grow wasted food", dx, dy + yOff - (units*90));
	cxa.fillText("hectares", dx, dy+yOff+(units*160));
	clockLine("in ",40);
	
	
	cxa.font = "700 "+(headerType)+"px Roboto Condensed";
	cxa.fillText(numberWithCommas(Math.round(hectares)), dx, dy+yOff + (units*110));
	
	cxa.textAlign = 'right';
	cxa.fillStyle = col[1];
	cxa.font = "400 "+(bodyType)+"px Cabin Condensed";
	cxa.fillText("[1]", dx+(halfX)-(units*40), dy+(halfY)-(units*40)+yOff);
}