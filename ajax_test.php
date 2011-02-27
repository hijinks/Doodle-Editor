<?php
// This file is used to generate example responses to ajax functions requested by test.php
// Essentially a switch containing functions that would otherwise be seperate depending on module, CMS etc...

header('Cache-Control: no-cache, must-revalidate');
header('Content-type: application/json');
require_once('settings.inc');
$p = explode('/', $_GET['p']);
$result = false;
switch($p[0]){
	case 'test':
		require_once('lib/editor.inc');
		$editor = new LIB_Editor;
		switch($p[2]){
			case 'get':
				$result = $editor->getEditor(array(unserialize(file_get_contents('save_sample'))));
			break;
			case 'update':
				if(isset($_POST['ajax'])){
					
					$h = fopen('save_sample', 'w');
					$result =  fwrite($h, serialize($editor->input($_POST['ajax'])));
					fclose($h);
				}				
			break;
		}
	break;
	case 'images':
		switch($p[2]){
			case 'pdfs':
				$pdfs = array_map('basename', glob(PDF_PATH.'*.pdf'));
				$pdfs = array_map('htmlentities', $pdfs);
				$result = $pdfs;			
			break;
			case 'selected':
				$imgs = array(); 
				foreach(glob(IMG_PATH.'*') as $dir){
					$all = glob($dir.'/*');
					foreach($all as $i){
						preg_match('/[a-z0-9]+\_s\.jpg|gif|png$/', $i, $matches);
						if(!empty($matches)) $imgs[] = $dir.'/'.$matches[0];
					}
				}
				$result = $imgs;
			break;
		}			
	break;
}

echo json_encode($result);
?>