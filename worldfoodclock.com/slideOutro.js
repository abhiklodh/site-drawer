// JavaScript Document

// TITLE SEQUENCE //
function slideOutro() {
	
	yOff = (fullY*10);
	cxa.globalAlpha = 1;
	
	drawOrigin(0,0+(introWheat*0.6));
	
	
	// MOUNTAIN CIRCLE //
	cxa.fillStyle = corn[0];
	cxa.beginPath();
	cxa.arc(sx, sy, 160*units, Math.PI*1.08, Math.PI*1.92, false);
	cxa.lineTo(sx,sy);
	cxa.closePath();
	cxa.fill();
	
	cxa.fillStyle = col[2];
	cxa.beginPath();
	cxa.arc(sx, sy, 160*units, -Math.PI*0.08, Math.PI*1.08, false);
	cxa.lineTo(sx-(70*units),sy-(75*units));
	cxa.lineTo(sx+(10*units),sy-(30*units));
	cxa.lineTo(sx+(80*units),sy-(60*units));
	cxa.closePath();
	cxa.fill();
	
	// WHEAT //
	wheatStem(-46,82+introWheat);
	wheatStem(82,48+introWheat);
	
	
	drawOrigin(0,0+introWheat);
	
	cxa.fillStyle = col[7];
	cxa.beginPath();
	cxa.moveTo(sx, sy);
	cxa.lineTo(sx+(120*units),sy-(240*units));
	cxa.lineTo(sx+(220*units),sy-(255*units));
	cxa.lineTo(sx,sy);
	cxa.lineTo(sx+(120*units),sy-(120*units));
	cxa.lineTo(sx+(230*units),sy-(160*units));
	cxa.lineTo(sx+(210*units),sy-(80*units));
	cxa.lineTo(sx,sy);
	cxa.lineTo(sx-(170*units),sy+(55*units));
	cxa.lineTo(sx-(185*units),sy+(95*units));
	cxa.closePath();
	cxa.fill();
	
	
	cxa.fillStyle = corn[11];
	cxa.beginPath();
	cxa.moveTo(sx, sy);
	cxa.lineTo(sx-(120*units),sy+(60*units));
	cxa.lineTo(sx-(140*units),sy+(180*units));
	cxa.lineTo(sx-(110*units),sy+(150*units));
	cxa.lineTo(sx-(40*units),sy+(100*units));
	cxa.lineTo(sx, sy);
	cxa.lineTo(sx+(170*units),sy+(70*units));
	cxa.lineTo(sx+(180*units),sy+(160*units))
	cxa.lineTo(sx+(210*units),sy+(190*units));
	cxa.lineTo(sx+(160*units),sy+(160*units));
	cxa.lineTo(sx+(130*units),sy+(90*units));
	cxa.lineTo(sx, sy);
	cxa.lineTo(sx+(40*units),sy-(135*units));
	cxa.lineTo(sx+(130*units),sy-(210*units))
	cxa.lineTo(sx+(140*units),sy-(110*units));
	cxa.closePath();
	cxa.fill();
	
	
	
	wheatStem(-10,-20+introWheat);
	wheatStem(46,150+introWheat);
	
}
