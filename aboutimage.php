<?php
    // Query the database for this image's shortdesc
	// Lesson: mysql_fetch_row returns column index addressable array, _fetch_assoc returns col name addressable array, _fetch_array returns both
    // 66.230.196.47
    $imagepath = trim($_GET["which"]);
    $db = mysqli_connect("betweenartandscience.com", "tomba", "NOTTHEPW", "tomba");
	
    if(mysqli_connect_errno($db)) {
        echo "Failed to connect to db: " . mysqli_connect_error();
    }
    else {
        $query = "SELECT * FROM ImageInfo WHERE url_fullimg LIKE '%" .mysqli_real_escape_string($db, $imagepath)."%'";
        //there should only be one result
        $result = mysqli_query($db, $query);
		$row = mysqli_fetch_assoc($result);
		$desc = $row["shortdesc"];
		echo $desc;
		echo "@#!Reference Code: 00" .$row["P_Id"]. strtoupper(substr($desc, 0, 3));
    }

    mysqli_close($db);
?>
