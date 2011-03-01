<?php
	require_once('lib/make.inc');
	require_once('lib/builder.inc');
	require_once('lib/html.inc');
	$data = array(unserialize(file_get_contents('save_sample')));
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
	<head>
		<title>Sample View</title>
		<meta http-equiv="content-type" content="text/html; charset=utf-8">
		<link href="/public_assets/style.css" type="text/css" rel="stylesheet" media="all">
	</head>
	<body>
		<div id="wrap">
		<?php create($data) ?>
		</div>
	</body>
</html>