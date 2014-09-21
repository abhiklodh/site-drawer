// JavaScript Document

// TITLE SEQUENCE //
function slideIntro() {
	
	yOff = (fullY*-1);
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
	
	
	cxa.globalAlpha = titleOut/100;
	
	cxa.fillStyle = col[1];
	cxa.textAlign = 'center';
	cxa.font = "700 "+headerType+"px Roboto Condensed";
	cxa.fillText('WORLD FOOD CLOCK', dx, dy+(unitOne*2)+yOff);
	
	/// FADE IN ///
	if (titleIn>0) {
		cxa.globalAlpha = titleIn/100;
		cxa.fillStyle = col[0];
		cxa.fillRect(0,0,fullX,fullY);
		titleIn -= 1;
	}
	/// FADE OUT ///
	if (titleOutYes==1 && titleOut>0) {
		cxa.globalAlpha = titleOut/100;
		titleOut -= 1;
	}
	if (titleOut==1 ) { // ONVE FADED OUT, PROGRESS TO NEXT SCENE
	    titleOut = 0;
		setTimeout(function(){
			
			slide = 0;
			camTo(0,0,10,1);
			setInterval(function() {
				
				clockStep();
				
			}, 1000);
			
		},500);
		
	}
	
}

function wheatStem(x,y) {
	//STEM
	cxa.fillStyle = corn[4];
	drawOrigin(x-100,y-200);
	cxa.beginPath();
	cxa.moveTo(sx+(4*units), sy-(2*units));
	cxa.lineTo(sx-(4*units), sy+(2*units));
	cxa.lineTo(sx+(221*units),sy+(452*units));
	cxa.lineTo(sx+(229*units),sy+(448*units));
	cxa.closePath();
	cxa.fill();
	
	
	cxa.fillStyle = corn[7];
	//EAR
	drawOrigin(x-96,y-192);
	cxa.beginPath();
	cxa.moveTo(sx, sy);
	translateOrigin(-10,-20);
	cxa.lineTo(sx-(20*units), sy+(10*units));
	translateOrigin(-20,-40);
	cxa.lineTo(sx-(20*units), sy+(10*units));
	translateOrigin(10,20);
	cxa.lineTo(sx, sy); //c
	translateOrigin(-10,-20);
	cxa.lineTo(sx+(20*units), sy-(10*units));
	translateOrigin(20,40);
	cxa.lineTo(sx+(20*units), sy-(10*units));
	cxa.closePath();
	cxa.fill();
	//EAR
	drawOrigin(x-144,y-288);
	cxa.beginPath();
	cxa.moveTo(sx, sy);
	translateOrigin(-10,-20);
	cxa.lineTo(sx-(20*units), sy+(10*units));
	translateOrigin(-20,-40);
	cxa.lineTo(sx-(20*units), sy+(10*units));
	translateOrigin(10,20);
	cxa.lineTo(sx, sy); //c
	translateOrigin(-10,-20);
	cxa.lineTo(sx+(20*units), sy-(10*units));
	translateOrigin(20,40);
	cxa.lineTo(sx+(20*units), sy-(10*units));
	cxa.closePath();
	cxa.fill();
	//EAR
	drawOrigin(x-120,y-240);
	cxa.beginPath();
	cxa.moveTo(sx, sy);
	translateOrigin(-10,-20);
	cxa.lineTo(sx-(20*units), sy+(10*units));
	translateOrigin(-20,-40);
	cxa.lineTo(sx-(20*units), sy+(10*units));
	translateOrigin(10,20);
	cxa.lineTo(sx, sy); //c
	translateOrigin(-10,-20);
	cxa.lineTo(sx+(20*units), sy-(10*units));
	translateOrigin(20,40);
	cxa.lineTo(sx+(20*units), sy-(10*units));
	cxa.closePath();
	cxa.fill();
}