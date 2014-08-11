<!DOCTYPE html>
<html lang="en" >
<head>
<meta charset="utf-8" />
<title>Between Art and Science: Images from Code</title>
<link href="CSS/baas_images.css" rel="stylesheet" type="text/css" />
<link href="CSS/dropmenu.css" rel="stylesheet" type="text/css" />
<link rel="stylesheet" href="//code.jquery.com/ui/1.10.4/themes/smoothness/jquery-ui.css">
<script src="http://code.jquery.com/jquery-latest.min.js"></script>
<script src="//code.jquery.com/ui/1.10.4/jquery-ui.js"></script>
<script src="JS/baas_images.js"></script>
<script src="JS/mysiteutils.js"></script>
<script src="JS/baas_g_analytics.js"></script>
			 
</head>
<body>
<header>
<h2 class="header_left">Images from Code...</h2>
<?php include("dropmenu_phpinject.html"); ?>
</header>

<div class="container">
<?php
    // Renders the initial main page for BetweenArtandScience (BAAS) based on the ImageInfo db table
    // 
    // ImageInfo columns: P_Id, add_date url_fullimg, url_thumbimg, width, height, tags, display_group, shortdesc
    //
    // First we create the hidden divs containing the full and thumb img "lists" and
    // the div that holds the current indices for all images marked with the current tag
    // so the js on client side can do it's stuff.
    
    $tagss = array("all", "color", "Electric", "grayscale", "illusions", "just lines", "light", "organic", "many layered", "sangaku", "sequences");
    $taglist = trim(isset($_GET['tag']) ? $_GET['tag'] : "all");    // initial state, use images_with_tags.php from client to get different tag indices
    if(!in_array($taglist, $tagss))
        $taglist = "all";
    $tagpids = array();

    // Query the database for any rows in ImageData that have these tags in the tags column
    // something like SELECT * FROM ImageInfo WHERE tags LIKE '%many layers%'

    // 66.230.196.47
    $db = mysqli_connect("betweenartandscience.com", "tomba", "NOTTHEPW", "tomba");
    if(mysqli_connect_errno($db)) {
        echo "Failed to connect to db: " . mysqli_connect_error();
    }
    else {

        // start the 'slides' div
        $view_w = 850;
        $view_h = 700;
        echo "<div class='slides'>\n";
        $query = "SELECT * FROM ImageInfo WHERE tags LIKE '%" .mysqli_real_escape_string($db, $taglist)."%' AND visible = 1 ORDER BY display_group ASC";

        $result = mysqli_query($db, $query);
        $nrows = $result->num_rows;
        $c = 0;
        while($row = mysqli_fetch_array($result)) {            
            ++$c;
            $tagpids[$c] = $row['P_Id'];   // fill in the tagpids while we're at it
            //update_tag_superset($row[tags]);
            // typical entry: <img src="images/fullsize/circleexperiment3_large_700.jpg" width="700" height="700" alt="a generative image"/>
            // The main complication here is that we need to look at the actual image size and possibly add a margin-left or margin-top to
            // the inline style to correct for any resizing triggered by the css that forces the image resizing for display in our 700x700 viewport.
            $z = $nrows - $c;
            $w = $row['width'];
            $h = $row['height'];
            $margins = calc_scaled_dimenions($w, $h, $view_w, $view_h);
            $mtopstr = "";
            $mleftstr = "";
            if($margins[0] != 0) {    // image is too wide so we set height:auto and max-width:100% to trigger browswer resizing
                $mtopstr = "margin-top:" .strval(intval($margins[0])). "px; height:auto; max-width:100%;";
            }
            if($margins[1] != 0) {    // image is too tall so we set max-height:100% and width:auto to trigger browswer resizing
                $mleftstr = "margin-left:" .strval(intval($margins[1])). "px; width:auto; max-height:100%";
            }

            // OK, write the html for each image in the show
            if($c == 1) {
                echo "<img class = 'transition_img visible_img' style='position:absolute; " .$mtopstr. "" .$mleftstr. "' z-index:$z src='" .$row['url_fullimg'].  "' width='" .$view_w. "' height='" .$view_h. "' alt='a generative image'/>\n";
            }
            else {
                echo "<img class = 'transition_img invisible_img' style='position:absolute; " .$mtopstr. "" .$mleftstr. "' z-index:$z src='" .$row['url_fullimg'].  "' width='" .$view_w. "' height='" .$view_h. "' alt='a generative image'/>\n";
            }
        }
        // close the 'slides' div
        echo "</div>\n";

        // now the 'thumbs' div
        echo "<div class='thumbs'>\n";
        mysqli_data_seek($result, 0);
        while($row = mysqli_fetch_array($result)) {            
            // typical entry: <img src="images/thumbs/circleexperiment3_100.png" alt="thumbnail image"/>
            echo "<img src='" .$row['url_thumbimg'].  "' alt='thumbnail image'/>\n";
        }
        // close the 'thumbs' div
        echo "</div>\n";

        // create the tags buttons (styled to look like links) from the tags super set created above
        // TODO: no this is wrong because you want the full tag set to always be shown so either we need
        //       to hard code that here say or do the right normalizing thing and have a tags table with
        //       a two column primary key (tag_id, image_id) and query the correct tags using joins. For
        //       now we hard code to get everything else going then when multiple tags at once is implemented
        //       we'll go for a tags table.
        echo "<span id='tagspan'>\n";
        foreach($tagss as $tag) {
            //if($tag == "all")
            if($tag == $taglist)
                echo "<button class='tags tag_active' type='button' value='".$tag."'>&#8226;".$tag."</button>\n";
            else
                echo "<button class='tags tag_inactive' type='button' value='".$tag."'>&#8226;".$tag."</button>\n";
        }
        echo "</span>\n";
		
		echo "<input type='button' id='aboutImageButton' value='?' title='About this image.'/>";
    }

    mysqli_close($db);

    function calc_scaled_dimenions($w, $h, $absw, $absh) {
        $margtop = 0;
        $margleft = 0;
        if(($w == $absw && $h <= $absh) || ($h == $absh && $w <= $absw)) {
            // it fits but is same size or smaller so might still need margins
            $margtop = ($absh - $h)/2;
            $margleft = ($absw - $w)/2;
            return array($margtop, $margleft);
        }

        if($w <= $absw && $h <= $absh)
            return array($margtop, $margleft);    // no scaling will occur so no need for margins

        $wratio = $w/$absw;
        $hratio = $h/$absh;
        if($wratio > $hratio) {
            $scaledw = $w/$wratio;
            $scaledh = $h/$wratio;
            $margtop = ($absh - $scaledh)/2;
            $margleft = ($absw - $scaledw)/2;
        }
        else if($hratio >= $wratio) {
            $scaledw = $w/$hratio;
            $scaledh = $h/$hratio;
            $margtop = ($absh - $scaledh)/2;
            $margleft = ($absw - $scaledw)/2;
        }

        return array($margtop, $margleft);
    }

    function update_tag_superset($newtags) {
        global $tagss;
        $itags = explode(",", $newtags);
        foreach($itags as $tag) {
            $tag = trim($tag);
            if(!in_array($tag, $tagss))
                $tagss[] = $tag;
        }
    }
?>

<span id="thumbnail"><img src="../images/thumbs/circleexperiment3_100.png" alt="thumbnail"/></span>

<span id="blipspan">
<table id="imageblips_table" border=0>
<!-- table is filled in clientside by js by examining the above server written content -->
</table>
</span>

<div id="slidecontrols">
  <span title="Previous image" id = "arrow_prev"></span>
  <span title="Pause" id = "stop_start"></span>
  <span title="Next image" id = "arrow_next"></span>
</div>
</div>

<div id="aboutImageDialog" title="About this Image">
  <h4 id="aboutImageTitle"></h4>
  <p id="aboutImageContent">It's a mystery.</p>
  <p id="aboutImageCode"></p>
</div>

<footer><div class="footer_text"> <script language="JavaScript">NothingToSeeHere('info')</script></div></footer>
</body>
</html>
