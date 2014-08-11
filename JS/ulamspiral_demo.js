/*
  The file uses a canvas to display an interactive Ulam's Spiral type square spiral grid of the positive integer number line.
  This is a demo for understanding the ideas in the Ulam's Spiral essay.
  
  There are several user options for controlling what is displayed on the spiral grid:
      1. The primes only.
	  2. The multiples of a given integer.
	  3. What is left if the multiples of a given integer are removed from the positive integers.
	  4. What is left if all multiples of all integers up to some value are removed from the positive integers.
	  5. An animation of Eratosthenes' sieve removing all multiples of 2, then 3, then 5, etc.
*/

// let's put our globals into an object to reduce global namespace contamination
var usobj = {};
usobj.uptoN = 8;
usobj.spotsize = 4;
usobj.PRIMES = 0;
usobj.MULTSOF = 1;
usobj.REMOVAL = 2;
usobj.REMOVEUPTO = 3;
usobj.action = usobj.PRIMES;
usobj.frame = 1;
usobj.sieveTimer = undefined;
usobj.animating = false;
usobj.max_frames = 200;    // beyond this there would be no visible change given the fixed canvas size
usobj.sieve_delay = 2000;  // milliseconds
/* The moves array encodes Right Up Left Down direction sequence for a ccw square spiral where +X points right and +Y points down. */
usobj.moves = [1, 0, 0, -1, -1, 0, 0, 1];

/* Set up our jQuery UI bindings and draw the initial square spiral */
$(function() {

	var canvas = document.getElementById("ulamspiraldemo");

    $('#size').keyup(function(e) {   // spot size value
        if(e.keyCode == 13) {
            usobj.spotsize = Number($(this).val());
            drawSquareSpiral(canvas, usobj.spotsize, usobj.uptoN, usobj.action);
		}
    });

	$('#n').keyup(function(e) {    // the "up to N" user set value
		if(e.keyCode == 13) {
            usobj.uptoN = Number($(this).val());
			if(!usobj.animating) {
                drawSquareSpiral(canvas, usobj.spotsize, usobj.uptoN, usobj.action);
			}
		}
	});

	$('.sieve_anim').click(function() {  // the sieve animation
		if(usobj.animating) {
		    usobj.animating = false;
			clearInterval(usobj.sieveTimer);
		}
		else {
			usobj.animating = true;
			usobj.frame = 1;
			usobj.sieveTimer = setInterval(function() {sieveInAction(canvas)}, usobj.sieve_delay);
		}
	});
		
	// fill in the default parameters in the input fields
	$('#size').val(usobj.spotsize.toString());
	$('#n').val(usobj.uptoN.toString());
	$('#primes').prop('checked', true);   // check the default
	$('.group').on('change', function() {
		if(usobj.animating) {
		    usobj.animating = false;
			clearInterval(usobj.sieveTimer);
		}
		usobj.action = parseInt($('input[name=option]:checked', '#myForm').val());
        drawSquareSpiral(canvas, usobj.spotsize, usobj.uptoN, usobj.action);
	});
	
    drawSquareSpiral(canvas, usobj.spotsize, usobj.uptoN, usobj.action);
});

/* The animation function passed to setInterval() */
function sieveInAction(canvas) {
	while(!is_prime(usobj.frame)) {
		usobj.frame++;
	}
	drawSquareSpiral(canvas, usobj.spotsize, usobj.frame, usobj.REMOVEUPTO);
	if(usobj.frame > usobj.max_frames) {
	    clearInterval(usobj.sieveTimer);
		usobj.animating = false;
	}
	
	usobj.frame++;
}

/*
*  The workhorse function that draws according to the mode on the square spiral, and called for each prime frame when animation the sieve.
*
*  Input:
*    spotsize - the edge size in pixels of each spot representing some integer on the spiral.
*    fonN - the target integer value the action applies to
*    action - one of the integer usobj.MULTSOF, usobj.PRIMES, usobj.REMOVAL or usobj.REMOVEUPTO values
*/
function drawSquareSpiral(canvas, spotsize, forN, action) {
	
	var g = canvas.getContext('2d');	
	// clear the canvas first or we will be compositing
	g.fillStyle="white";
	g.fillRect(0, 0, canvas.width, canvas.height);
	
	// calculate our grid params
	var xncells = ((0.5 + (canvas.width / spotsize)) | 0) - 1;
	var yncells = ((0.5 + (canvas.height / spotsize)) | 0) - 1;
	var ncells = xncells * yncells;
	
	// calculate and show in red the center (zero point) of the square spiral grid
	var x = 0;
	var y = 0;
	var steps = 1;
	g.fillStyle="red";
	x = canvas.width/2 - ((0.5 + spotsize/2) | 0);
	y = canvas.height/2 - ((0.5 + spotsize/2) | 0);
	g.fillRect(x, y, spotsize, spotsize);
	
	// Now do the square spiral dance step: Right Up Left Down according to the generated sequence 1,1,2,2,3,3,4,4,5,5,6,6,...
	g.fillStyle="black";
	var i = 0;
	
	//UGLY: that we have multiple breaks in there -- should microfunction the modes
	while(i < ncells) {   // if start is zero than i is also the current integer on the number line
	    for(var j = 0; j < 4; j++) {    // there are four sides to the square spiral
			if(j == 2)
			    steps += 1;             // we bump out to the next course halfway through a complete "orbit"
		    for(var k = 0; k < steps; k++) {
				x = x + usobj.moves[j * 2] * spotsize;
				y = y + usobj.moves[j*2 + 1] * spotsize;
				// if it meets the current mode test fill it
				if(action == usobj.MULTSOF && ((i + 1) % forN == 0)) {
        	        g.fillRect(x, y, spotsize, spotsize);
				}
				else if(action == usobj.PRIMES && is_prime(i+1)) {
        	        g.fillRect(x, y, spotsize, spotsize);					
				}
				else if(action == usobj.REMOVAL) {    // remove all multiples of forN (really just the visual inverse of MULTSOF)
					if((i+1) % forN != 0)
            	        g.fillRect(x, y, spotsize, spotsize);
				}
				else if(action == usobj.REMOVEUPTO) {    // remove all multiples of any value from 2 to forN
					var remove = false;
					for(var w = 2; w <= forN; w++) {
						if(!is_prime(w))
						    continue;
					    if((((i+1) % w) == 0) && (!is_prime(i+1)))
						{
						    remove = true;
							break;
						}
					}
					if(!remove)
            	        g.fillRect(x, y, spotsize, spotsize);
				}
				
				i++;
				if(i >= ncells)
					break;
			}
    		if(i >= ncells)
			    break;
		}
		steps++;
	}
	
	if(usobj.animating && usobj.frame > 1) {
		// if we are animating show the prime we just removed all multiples of
		g.strokeStyle = "red";
		g.font = "64px Verdana";
		var f = (usobj.frame).toString();
		g.strokeText(f, canvas.width/2, canvas.height/2);
	}
}
