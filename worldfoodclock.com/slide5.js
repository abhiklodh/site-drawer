// JavaScript Document

function slide5() {
	
	cxa.globalAlpha = 1;
	yOff = (fullY*5);
	
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
	    cxa.drawImage(gasImgS,0,dy-(fullX*0.5)+yOff,fullX,fullX);
	} else {
		cxa.drawImage(gasImg,0,dy-(fullX*0.5)+yOff,fullX,fullX);
	}
	dust();
	
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
	cxa.fillText("Greenhouse gas from wasted food", dx, dy + yOff - (units*90));
	cxa.fillText("tonnes", dx, dy+yOff+(units*160));
	clockLine("in ",40);
	
	
	cxa.font = "700 "+(headerType)+"px Roboto Condensed";
	cxa.fillText(numberWithCommas(Math.round(ghg)), dx, dy+yOff + (units*110));
	
	cxa.textAlign = 'right';
	cxa.fillStyle = col[1];
	cxa.font = "400 "+(bodyType)+"px Cabin Condensed";
	cxa.fillText("[1]", dx+(halfX)-(units*40), dy+(halfY)-(units*40)+yOff);
}