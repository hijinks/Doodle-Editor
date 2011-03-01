<?php

function create($data){
	if($data){
		if($data[0]['pdf']){
			return false;
		}
		$d = new Document;
		$heading = $d->createElement('h2');
		$heading->setAttribute('id', 'mainHeading');
		$heading->nodeValue = $data[0]['title'];	
		$content = unserialize($data[0]['content']);
		$wrap = $d->createElement('div');
		$wrap->setAttribute('id', 'contentWrap');
		$wrap->appendChild($heading);
		$inc = sizeof($content);
		if($inc == 1){
			$colClass = 'column single';
		} else if($inc == 2){
			$colClass = 'column double';
		} else if($inc == 3){
			$colClass = 'column triple';
		}
		foreach($content as $key=>$column){
			$col = $d->createElement('div');
			$colId = 'col'.($key+1);
			if($column){
				foreach($column as $block){
					$d->buildBlock($block, 'p_', $d);
					$col->setAttribute('class', $colClass);
					$col->setAttribute('id', $colId);
					$col->appendChild($d->getPara());
				}
			}
			$wrap->appendChild($col);
		}
		$d->body->appendChild($wrap);
	    for ($n = $d->body->firstChild; $n !== null; $n = $n->nextSibling) {
	        $e = simplexml_import_dom($n)->asXML();
			printf('%s', $e."\n");
	    }
	} else {
		echo '<h1>404</h1>';
	}
}
?>