/*
    Manages slide show and associated widgets for BetweenArtAndScience landing page.
*/

//STILL TODO
//           every function needs a comment header and all function params need to be doc'd there

// Use an object to encapsulate our own "globals" and reduce global namespace pollution.
var baas = {
    "aImages":[],
    "aThumbs":[],
    "iCurSlide": 0,
    "iStillTimer": 0,
    "ss_state": 1,      // 1 = slide show is running (the way we start), 0 = paused
    "prevSlideState": 1,
    "iImageDuration": 5500
};

/* Set up bindings using jQuery */
$(function(){
	
    // initially we hide the prev, next spans, we'll show them if user pauses
	baas.hidePrevNext();
	baas.hideThumb();
	
    $('#stop_start').click(function() {
		if(baas.ss_state == 1) {    // stop sliding
            $(this).css("background","url(../images/Widgets/go_dots.png)");
			$(this).attr("title", "Resume");    // change tooltip
			baas.ss_state = 0;
			clearInterval(baas.iStillTimer);   // will still allow currently sliding image, if any, to position correctly			
			baas.showPrevNext();
		}
		else {    // resume sliding
            $(this).css("background","url(../images/Widgets/pause_bars_small.png)");
			baas.ss_state = 1;
			$(this).attr("title", "Pause");
			// hide the prev, next buttons
			baas.hidePrevNext();			
			// resume slideshow with 50 so it starts right away: will get set back to iImageDuration at end of drawSlideEffect
			baas.iStillTimer = setInterval(baas.changeSlideTimer, 50);
		}
    });
	
	$('#arrow_next').click(function() {
	    if(baas.ss_state == 0) {  // if we hide them when sliding we might not need the ss_state check
	        // whatever slide is current get the next modulus the number of slides
			baas.setAndDrawCurrentSlide((baas.iCurSlide + 1) % $(baas.aImages).length);
		}
	});
		   
	$('#arrow_prev').click(function() {
	    if(baas.ss_state == 0) {  // if we hide them when sliding we might not need the ss_state check
	        // whatever slide is current get the next modulus the number of slides
			baas.setAndDrawCurrentSlide((baas.iCurSlide + ($(baas.aImages).length - 1)) % $(baas.aImages).length);
		}
	});
	
    // collect all images
    $('.slides').children().each(function(i){
        var oImg = new Image();
        oImg.src = this.src;
        baas.aImages.push(oImg);
    });
    // collect all thumbs
    $('.thumbs').children().each(function(i){
        var oImg = new Image();
        oImg.src = this.src;
        baas.aThumbs.push(oImg);
    });
	
	// Set up the "rice grains" for the image selector / thumbs viewer widget
	baas.populateBlipTable($(baas.aImages).length, 5);

	$('.allblips').click(function() {
		// we need to know which blip was clicked so we know which image to display
		var td = $(this).get(0);
		var alt = td.getElementsByTagName('img')[0].alt;
		baas.pause_and_show_ImageN(Number(alt));
    });
	
	$('.allblips').hover(   // takes in and out functions
		function() {
		    var td = $(this).get(0);
		    var alt = td.getElementsByTagName('img')[0].alt;
	        baas.showThumb(Number(alt));
		},
		function() {
			baas.hideThumb();
	});

    // set up for changing the tag group to display
	$('.tags').click(function() {
		// change active set iff chosen tag is actually different from current tag
		if($('.tag_active').html() != $(this).html()) {
			clearInterval(baas.iStillTimer);
		    $('.tag_active').removeClass('tag_active').addClass('tag_inactive');
		    // change clicked on tag to active
		    $(this).removeClass('tag_inactive').addClass('tag_active');		
		    // replace the image set with only those with the newly chosen tag
		    baas.changeImageSet($(this).html().substring(1));
		}
    });
	
	// set up the aboutImage popup dialog
	$( "#aboutImageDialog" ).dialog({
		autoOpen: false,
		position: {
			my: "left bottom", at: "left bottom"},
		show: {
		    effect: "fade",
		    duration: 500
		},
		hide: {
		    effect: "fade",
		    duration: 500
		},
		close: baas.aboutImageClose
    });

    $( "#aboutImageButton" ).click(function() {
		baas.populateAboutImageDialog();
		$( "#aboutImageDialog" ).dialog( "option", "width", 250 );
		$( "#aboutImageDialog" ).dialog( "option", "height", 300 );
		$( "#aboutImageDialog" ).dialog( "open" );
    });
			 
	// bind handler for aboutImageButton being clicked
	$('#aboutImageButton').click(function() {
		baas.prevSlideState = baas.ss_state;
		baas.pause_and_show_ImageN(baas.iCurSlide);
	});
		
    // draw the first image and start the show
	$('.slides').css("display", "block");
	baas.setAndDrawCurrentSlide(0);
	baas.iStillTimer = setInterval(baas.changeSlideTimer, baas.iImageDuration); // set outer (image is still) timer
});

/* Handler bound to close button of about this image dialog. Restores the slide state from before about image dialog went up. */
baas.aboutImageClose = function(event) {
	if(baas.prevSlideState === 1) {
		$('#stop_start').trigger("click");
	}
}

/* Populates the About this Image dialog with the information for the current image. */
baas.populateAboutImageDialog = function() {		
	// grab the current image path for the db query
	var imgsrc = baas.aImages[baas.iCurSlide].src;
	var path = imgsrc.substr(imgsrc.indexOf("images"));
	
	// direct AJAX instead of JQuery just because
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if(xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			// we expect "titlestr." at a minimum and "titlestr. more" if there is a further description. Note the space before more.
			var tindex = xmlhttp.responseText.indexOf(".");   // end of title
			var cindex = xmlhttp.responseText.indexOf("@#!");   // beginning of code string
			document.getElementById("aboutImageTitle").innerHTML = xmlhttp.responseText.slice(0, tindex);
			if(xmlhttp.responseText.length > tindex + 2) { 
			    document.getElementById("aboutImageContent").innerHTML = xmlhttp.responseText.slice(tindex + 2, cindex);
			}
			else {
			    document.getElementById("aboutImageContent").innerHTML = "";
			}
			// finally set in the code for this image
			document.getElementById("aboutImageCode").innerHTML = xmlhttp.responseText.slice(cindex + 3);
		}
	}
	xmlhttp.open("GET", "aboutimage.php?which=" + path, true);
	xmlhttp.send();	
}

/* The callback for when display duration (iStillTimer) is over for current image. */
baas.changeSlideTimer = function() {
    clearInterval(baas.iStillTimer);  // don't eat up still time with sliding effect time
	baas.setAndDrawCurrentSlide((baas.iCurSlide + 1) % $(baas.aImages).length);
	baas.iStillTimer = setInterval(baas.changeSlideTimer, baas.iImageDuration);
}

/*
*   Draws the current image via css visibility manipulation.
*
*   Input:
*     iSlide - The index of the current slide.
*/
baas.setAndDrawCurrentSlide = function(iSlide) {	
	// Toggle between the .visible_img and .invisible_img classes for current image and the target image.
	$('.visible_img').toggleClass("visible_img invisible_img");   // will only select the currently displayed image
	$('.transition_img').each(function(i){    // will iterate over all the images
		if(i == iSlide) {
			$(this).toggleClass("visible_img invisible_img"); // change target image's css from invisible_img to visible_img
			return false;    // we've found the target so end the jQuery each iteration
		}
	});
	
	// Gray the correct "rice grain" thump blip.
	if(iSlide != baas.iCurSlide) {
		baas.flipBlips(baas.iCurSlide, iSlide);
	}

	baas.iCurSlide = iSlide;
	
	// If the aboutImageDialog is up we want its content to track the current image. But first we need
	// to see if the dialog is even up as populating it hits the server. However, the jQuery open check
	// will fault if the dialog has not been initialized, so we must check for that first.
	if ($("#aboutImageDialog").hasClass('ui-dialog-content')) {
		// it's initialized so it's safe to check if it's up
		var isup = $( "#aboutImageDialog" ).dialog("isOpen");
		if(isup)
			baas.populateAboutImageDialog();
	}		
}

/* Causes a reload by setting the tagname as the query string. */
baas.changeImageSet = function(tagname) {
	tagname = tagname.trim();
	var tagpageurl = window.location.protocol + "//" + window.location.host + window.location.pathname + "?tag=" + escape(tagname);
	window.location.href = tagpageurl;
}

/* Changes the blip ("rice grain")representing the current image */
baas.flipBlips = function(iold, inew) {
	$('.blip_marker').empty().append("<img src = '../images/Widgets/image_blip.png' alt = '" + iold.toString() + "' border=0 width=18 height=9 />");
	$('.blip_marker').addClass('blip').removeClass('blip_marker');
	$('.allblips').eq(inew).addClass('blip_marker').removeClass('blip');
	$('.allblips').eq(inew).empty().append("<img src = '../images/Widgets/image_blip_current.png' alt = '" + inew.toString() + "' border=0 width=18 height=9 />");
}

/* Creates the blip ("rice grains") table for thumb-view/ go-to-image widget.
*    Input n - The total number of blips, which equals the total number of images satisfying the currently selected tag. 
*          ncols - The number of columns the table should have.
*/
baas.populateBlipTable = function(n, ncols) {
	if(n <= 0 || ncols <= 0)
	    return;

	var remaining = n;
	var row = 0;
	var cell = 0;
	var table = $('#imageblips_table').get(0);    // get(0) gets the DOM table object instead of the JQuery object
	var nrows = Math.floor(n/ncols);
	
	if(n % ncols != 0)
	    nrows++;
		
    for(var i = 0; i < nrows; i++) {
        row = table.insertRow(-1);
		
		// build the cells for the new row
        for(var j = 0; j < ncols; j++) {
		    cell = row.insertCell(-1);    // returns us a <td></td> element
			var which = n - remaining;
			var ntext = which.toString();
			if(remaining == n) {
				cell.className = "allblips blip_marker";
				var str = "<img src = '../images/Widgets/image_blip_current.png' alt = '" + ntext + "' border=0 width=18 height=9 />"
				cell.innerHTML = "<img src = '../images/Widgets/image_blip_current.png' alt = '" + ntext + "' border=0 width=18 height=9 />";
			}
			else {
				cell.className = "allblips blip";
			    cell.innerHTML = "<img src = '../images/Widgets/image_blip.png' alt = '" + ntext + "' border=0 width=18 height=9 />";
			}
			remaining--;
			if(remaining == 0)
			    break;
		}
	}
}

/*
*  Switch to a particular image and stop.
*    Input: n - image index in the slides div user wants to switch to.
*/
baas.pause_and_show_ImageN = function(n) {
	// first switch to paused if ss_state == 1
	if(baas.ss_state == 1) {
		clearInterval(baas.iStillTimer);
		// change controls from pause to prev/next/resume
        $('#stop_start').first().css("background","url(../images/Widgets/go_dots.png)");
		$('#stop_start').first().attr("title", "Resume");
		baas.showPrevNext();		    								
		baas.ss_state = 0;
	}
	baas.setAndDrawCurrentSlide(n);
}

/* Called when going into play mode */
baas.hidePrevNext = function() {
	$('#arrow_next').hide();
	$('#arrow_prev').hide();	
}

/* Called when going into pause and step mode */
baas.showPrevNext = function() {
	$('#arrow_next').show();
	$('#arrow_prev').show();
}

baas.hideThumb = function() {
	$('#thumbnail').hide();
}

/* Updates the thumb image src to aThumbs[n] then shows it. */
baas.showThumb = function(n) {
	// update the img src to thumb n then show
	var url = baas.aThumbs[n].src;
	$('#thumbnail').html("<img src = '" + url + "' alt = 'thumb " + n.toString() + "' />");
	$('#thumbnail').show();
}

