<?php
	$editorType = 'test' //Use to differentiate between archives
?>

<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
	<head>
		<title>Doodle-Editor</title>
		<meta http-equiv="content-type" content="text/html; charset=utf-8">
		<link rel="icon" href="/public_assets/favicon.ico" type="image/x-icon">
		<link href="/public_assets/generic.css" type="text/css" rel="stylesheet" media="screen">
		<link href="/public_assets/editor.css" type="text/css" rel="stylesheet" media="screen">
		<link href="/public_assets/datepicker.css" type="text/css" rel="stylesheet" media="screen">
		<script src="/public_assets/js/mootools-1.3.js" type="text/javascript"></script>
		<script src="/public_assets/js/mootools-1.3-more-date.js" type="text/javascript"></script>
		<script src="/public_assets/js/mootools-1.3-more-drag.js" type="text/javascript"></script>
		<script src="/public_assets/js/datepicker.js" type="text/javascript"></script>
		<script src="/public_assets/js/generic.js" type="text/javascript"></script>
		<script src="/public_assets/js/editorMain.js" type="text/javascript"></script>
		<script src="/public_assets/js/editorSetup.js" type="text/javascript"></script>
		<script src="/public_assets/js/editorBuilder.js" type="text/javascript"></script>
	</head>
	<body>
<div id="mainWrap">
		<div id="overlayWrap"></div>
		<div style="margin-bottom:10px;">
			<ul id="editorBtns">

				<li><input type="button" value="Save" id="saveBtn"></li>
				<li><input type="button" value="Go Back"></li>
				<li><a href="/images" title="" target="_blank"><button>Go to image section</button></a></li>
				<li><input type="hidden" id="editorType" value="<?php echo $editorType; ?>"></li>
			</ul>
			<div id="alertDiv"></div>
			<h1 id="header">Editor</h1>
		</div>

		<ul class="inline" id="majorOptions">
			<li><label for="title">Title: </label><textarea id="title"></textarea></li>
			<li><div id="thumbnail"><span>Drop image here for use as thumbnail</span><input type="hidden" id="thumbnailSrc"></div></li>
			<li><input type="button" value="Edit Date" class="button" style="margin-left:20px;" id="editDate"></li>
			<li><span id="formatDate"></span></li>
			<li><input type="hidden" id="dateVal" value=""></li>
			<li><input type="hidden" id="editorID" value="1" autoComplete="off"></li>

			<li><input type="button" value="Show help" class="button" style="margin-left:20px;font-size:16px;background-color:#CCFCCF;float:right;display:none;" id="showHelp"></li>
			<li><button class="button" id="pdfButton">Link to PDF <img src="/public_assets/imgs/adobe_pdf_icon.png" alt=""></button></li>
			<li><input type="hidden" id="pdf" value=""></li>
		</ul>
		<div id="cont">

		</div>
	</div>
	</body>

</html>