/*
  The file uses a canvas to display the IFS commonly known as the chaos game but with more generality than exists in most discussions.
  This is a demo for understanding the ideas in the Chaos Game essay.
  
  There are several user options for controlling what is displayed:
      1. The polygon order.
	  2. The cut fraction when placing a mark between the current mark and the next randomly chosen vertex.
	  3. Set the cut fraction to the correct interior kissing number for the polygon order.
	  4. Set the cut fraction to the correct exterior kissing number for the polygon order.
	  5. The radius of the parent polygon.
	  6. The number of marks to draw.
	  7. Whether or not to use color to show the targeting history n steps back that preceeded the placing of a mark.
*/

// let's put our globals into an object to reduce global namespace contamination
var cgobj = {};
cgobj.polytype = 3;    // i.e. default polygon is an equilateral triangle
cgobj.radius = 250;    // the radius in pixels of the parent polygon
cgobj.cutat = 0.5;          // where to place the next mark between the preceeding mark and the currently targeted vertex
cgobj.npoints = 50000;      // the number of marks to draw
cgobj.history_depth = 0;    // how many steps back in the targeting history of a mark to use for history coloring

/* Set up our jQuery UI bindings and draw the initial gasket. */
$(function() {

	canvas = document.getElementById("chaosgamedemo");

    $('#order').keyup(function(e) {
        if(e.keyCode == 13) {
            cgobj.polytype = Number($(this).val());
            drawGeneralizedSierpinski(canvas, cgobj);
		}
    });

	$('#radius').keyup(function(e) {
		if(e.keyCode == 13) {
            cgobj.radius = Number($(this).val());
            drawGeneralizedSierpinski(canvas, cgobj);
		}
	});

	$('#cutatText').keyup(function(e) {
		if(e.keyCode == 13) {
            cgobj.cutat = Number($(this).val());
			// update the slider
			$('#cutatSlider').first().val(cgobj.cutat);
            drawGeneralizedSierpinski(canvas, cgobj);
		}									 
	});
	
	$('#cutatSlider').on('change', function() {
		cgobj.cutat = Number($(this).val());
		// update the text field
		$('#cutatText').first().val(cgobj.cutat);
		drawGeneralizedSierpinski(canvas, cgobj);
	});

	$('#npoints').keyup(function(e) {
		if(e.keyCode == 13) {
            cgobj.npoints = Number($(this).val());
            drawGeneralizedSierpinski(canvas, cgobj);
		}
	});
	
	$('#history_depth').keyup(function(e) {
		if(e.keyCode == 13) {
			cgobj.history_depth = Number($(this).val());
			drawGeneralizedSierpinski(canvas, cgobj);
		}
	});
	
	$('.kinterior').click(function() {
		cgobj.cutat = getInteriorKissingNumber(cgobj.polytype);
		// update both text input and slider
		$('#cutatText').first().val(cgobj.cutat.toString());
		$('#cutatSlider').first().val(cgobj.cutat.toString());
		drawGeneralizedSierpinski(canvas, cgobj);
	});
	
	$('.kexterior').click(function() {
		cgobj.cutat = 2 - getInteriorKissingNumber(cgobj.polytype);
		// update both text input and slider
		$('#cutatText').first().val(cgobj.cutat.toString());
		$('#cutatSlider').first().val(cgobj.cutat.toString());
		drawGeneralizedSierpinski(canvas, cgobj);
	});
	
	// fill in the default parameters in the input fields
	$('#order').val(cgobj.polytype.toString());
	$('#radius').val(cgobj.radius.toString());
	$('#cutatSlider').val(cgobj.cutat.toString());
	$('#cutatText').val(cgobj.cutat.toString());
	$('#npoints').val(cgobj.npoints.toString());
	$('#history_depth').val(cgobj.history_depth.toString());
	
	// to start, draw classic Sierpinski
    drawGeneralizedSierpinski(canvas, cgobj);
});

/*
*  Draws a generalized fractal gasket of any order to an HTML5 canvas. Includes history coloring support.
*
*  Input:
*    canvas - the html5 canvas object to draw into
*    cgspec - an object with the following members:
*      polytype - order of the parent regular polygon
*      radius - the radius, in pixels, of the parent polygon
*      cutat - the cut fraction to use when "hopping" from the current mark towards the next randomly chosen vertex
*      npoints - the total number of points or marks to make
*      history_depth - how many steps back in the targeting history of a mark to use for history coloring
*/
function drawGeneralizedSierpinski(canvas, cgspec) {
	
	// get the drawing context
	var g = canvas.getContext('2d');
	// clear the canvas first or we will be compositing
	g.clearRect(0, 0, canvas.width, canvas.height);
	
	// first find the polygon vertices
	var angInc = 2 * Math.PI / cgspec.polytype;
	var verticesx = new Array();
	var verticesy = new Array();
	
	var pointsx = new Array();
	var pointsy = new Array();
	/* If we are coloring by history we need x,y arrays for each vertex to bin the points
	*  into same colored sets for drawing speed. This allows us to set color and call g.stroke()
	*  only vertex count times.
	*/
	if(cgspec.history_depth > 0) {
		for(var i = 0; i < cgspec.polytype; i++) {
			pointsx[i] = new Array();
			pointsy[i] = new Array();
		}
	}
	
	g.lineWidth="1";
	g.strokeStyle="red";
	g.beginPath();
	for(var i = 0; i < cgspec.polytype; i++) {
		verticesx[i] = canvas.width/2 + cgspec.radius * Math.cos(i * angInc - Math.PI/2);
		verticesy[i] = canvas.height/2 + cgspec.radius * Math.sin(i * angInc - Math.PI/2);
		g.moveTo(verticesx[i], verticesy[i]);
		g.lineTo(verticesx[i]+ 1, verticesy[i]);
	}
    g.stroke();
	
	// get ready to start the randomized hopping fun
	var ptx = canvas.width/2;
	var pty = canvas.height/2;
	var atx = 0;
	var aty = 0;
	var v = 0;
	
	g.fillStyle = "white";
	g.fillRect(0, 0, canvas.width, canvas.height);
	g.strokeStyle="black";
	
	var vHistory = new Array();
    // Calculate all the points before doing any path stuff - also sets us up for history coloring binning if needed.
	for(var i = 0; i < cgspec.npoints; i++) {
		v = (0.5 + Math.floor(Math.random() * cgspec.polytype)) | 0;    // will give a value from 0 to polytype-1 inclusive
		ptx = (0.5 + ptx + cgspec.cutat * (verticesx[v] - ptx)) | 0;
		pty = (0.5 + pty + cgspec.cutat * (verticesy[v] - pty)) | 0;
		// If showing history record last history_depth v's so we can put the point in the correct bins for history coloring.
		// Note when doing history we don't draw the first history_depth points.
		if(cgspec.history_depth > 0) {
			vHistory.unshift(v);   // add to beginning of vHistory, shifting prev v's higher
			if(vHistory.length == cgspec.history_depth) {
			    bin = vHistory.pop();   // this is the vertex targeted history_depth times ago and determines this point's color bin
    		    pointsx[bin].push(ptx);
	    	    pointsy[bin].push(pty);
			}
		}
		else {    // we are not coloring by history
		    pointsx[i] = ptx;
		    pointsy[i] = pty;
		}
	}

    // Draw it all
	if(cgspec.history_depth == 0) {
		g.beginPath();
		for(var i = 0; i < cgspec.npoints; i++) {
			atx = pointsx[i];
			aty = pointsy[i];
			g.moveTo(atx, aty);
			g.lineTo(atx+1, aty);
		}
		g.stroke();
	}
	else {
		for(var bin = 0; bin < cgspec.polytype; bin++) {
			//set the stroke color for the bin we are about to draw
			var rgb = HSVtoRGB(bin/(cgspec.polytype), 0.7, 0.7);   // convert hsv value to rgb
			g.strokeStyle = "rgb(" + rgb.r + "," + rgb.g + "," + rgb.b + ")";
			g.beginPath();    // now put all the points in a path and stroke all at end of loop
			for(var i = 0; i < pointsx[bin].length; i++) {
				atx = pointsx[bin][i];
				aty = pointsy[bin][i];
				g.moveTo(atx, aty);
				g.lineTo(atx+1, aty);
			}			
			g.stroke();
		}
	}	
}

/*
*  Calculates the proper interior kissing number for any order regular polygon according to the formula:
*
*    kn = 1 - (sinA/(sinA + cosB)), where A = 180/n, B = |2A*(p + 0.5) - 90| and p = Int(n/4).
*
*  Input:
*    ngon - the order of the regular polygon.
*/
function getInteriorKissingNumber(ngon) {
	var a = Math.PI/ngon;
	var b = Math.abs(2 * a * (Math.floor(ngon/4) + 0.5) - Math.PI/2);
	var kissingN = 1 - ( Math.sin(a)/(Math.sin(a) + Math.cos(b)) );
	return(kissingN);
}
