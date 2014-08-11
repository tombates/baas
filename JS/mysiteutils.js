// A few things I find I often need for sites, like simple email obfuscation, prime testing, color conversion etc.

/*  Simple non-caching test for primality
*
*  input: p, a positive integer to be tested for primality
*  Returns true if p is prime, false otherwise.
*/
function is_prime(p) {
	//OPTIMIZE: cache already discovered primes
	if(p == 1 || p == 2 || p == 3)
	    return true;
    var limit = (0.5 + (Math.sqrt(p) + 1)) | 0;
	for(var i = 2; i < limit; i++) {
	    if(p % i == 0)
		    return false;
	}
	return true;
}

/* Tests is_prime() for all primes below 1000
*
*  Logs result PASSED or FAILED to the console.
*
*  Normally any calls to this function and likely this function itself would be commented out or removed except during testing.

function test_is_prime() {
	var primes_to_1000 = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997];
	
	// go thru 2 to 1000 checking via is_prime for primality if true find its index in primes_to_1000 keeping track of the last lookup
	// so as not to traverse more than once total the primes list. if the next discovered prime via is_prime is always in sync with the
	// next value in primes_to_1000 than we pass but at the first non-match we fail
	var result = "PASSED";
	var isp = false;
	var primelist_index = 0;
	for(var i = 2; i < 1000; i++) {
		isp = is_prime(i);
		if(isp) {
			if(i == primes_to_1000[primelist_index]) {
			    primelist_index++;
		        continue;
			}
			else {
			    result = "FAILED";
			    break;
		    }
		}
	}
	
	// report result to console	
	console.log("result of test_is_prime(1-1000) " + result);
}
*/

/* Input: h, s, v all between 0 and 1 (correct before calling if your h is between 0 and 360 for example)
 * h  Object = {h:x, s:y, v:z}
 * OR 
 * h, s, v
 *
 * Returns: an object with r, g, b values
 *
 * Source: http://stackoverflow.com/questions/17242144/javascript-convert-hsb-hsv-color-to-rgb-accurately
*/
function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (h && s === undefined && v === undefined) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {  // my comment - do not move this { to a separate line or the return value will be undefined: see Crockford pg. 102
        r: Math.floor(r * 255),
        g: Math.floor(g * 255),
        b: Math.floor(b * 255)
    };
}

/* VLE (very low end) email harvester fence */
function NothingToSeeHere(box) {
   var domain="betweenartandscience.com";
   document.write("<a href=\"mailto:"+box+"@"+domain+"\">"+"Contact"+"</a>");
}
