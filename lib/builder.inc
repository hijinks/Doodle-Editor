<?php
class Document {
	public $doctype;
	public $head;
	public $title;
	public $body;
	protected $data;
	private $styles;
	private $metas;
	private $scripts;
	private $document;
	protected $para;
	protected $paraStyle = array();
	
	function __construct() {
		$this->document = new DOMDocument;
		$this->document->preserveWhiteSpace = false;
		$this->document->formatOutput = true; 
		$this->head = $this->document->createElement('head');
		$this->body = $this->document->createElement('body');
	}
	
	public function addStyleSheet ( $url, $media='all' ) {
		$element = $this->document->createElement( 'link' );
		$element->setAttribute( 'rel', 'stylesheet' );
		$element->setAttribute( 'type', 'text/css' );
		$element->setAttribute( 'href', $url );
		$element->setAttribute( 'media', $media );
		$this->styles[] = $element;
	}
	
	
	public function addScript ( $url ) {
		$element = $this->document->createElement( 'script');
		$element->setAttribute( 'type', 'text/javascript' );
		$element->setAttribute( 'src', $url );
		$this->scripts[] = $element;
	}
	
	
	public function addMetaTag ( $name, $content ) {
		$element = $this->document->createElement( 'meta' );
		$element->setAttribute( 'name', $name );
		$element->setAttribute( 'content', $content );
		$this->metas[] = $element;
	}
	
	public function setAttributes($element, $atts){
		foreach($atts as $name=>$att)
			$element->setAttribute($name, $att);
	}

	public function createElement ( $nodeName, $nodeValue=null ){
		return $this->document->createElement( $nodeName, $nodeValue );
	}

	public function createTextNode ($nodeValue){
		return $this->document->createTextNode($nodeValue);
	}
	
	public function assemble(){
        $doctype = '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">'."\n";
		// Create the head element
		$title = $this->document->createElement( 'title', $this->title );
		// Add stylesheets if needed
		if ( is_array( $this->styles ))
			foreach ( $this->styles as $element )
				$this->head->appendChild( $element );
		// Add scripts if needed
		if(  is_array( $this->scripts ))
			foreach ( $this->scripts as $element )
				$this->head->appendChild( $element );
		// Add meta tags if needed
		if ( is_array( $this->metas ))
			foreach ( $this->metas as $element )
				$this->head->appendChild( $element );
		
		$this->head->appendChild( $title );
		
		// Create the document
		$html = $this->document->createElement( 'html' );
		$html->appendChild( $this->head );
		$html->appendChild( $this->body );
		
		
		$this->document->appendChild($html );
		return $doctype . $this->document->saveHTML( );		
	}
	
	function buildBlock($e, $pClass){
		$this->para = $this->createElement('div');
		if($pClass) $this->para->setAttribute('class', $pClass);
		$last = $e[(sizeof($e)-1)];
		$this->paraStyle['height'] = $e.'px';
		switch($e[0]){
			case 'p':
				$els = $this->reformat($e[1]);
				foreach($els as $el)
					$this->para->appendChild($el);
			break;
			case 'l':
				foreach($e[1] as $el){
					if($el[0] == 'ul'){
						$newList = $this->createElement( 'ul' );
						$newList->setAttribute('class', 'p_list');
						$newList->setAttribute('style', 'list-style-type:'.$el[1].';');
						foreach($el[2] as $savedRow){
							$liEl = $this->createElement( 'li' );
							$els = $this->reformat($savedRow);
							foreach($els as $f)
								$liEl->appendChild($f);
							$newList->appendChild($liEl);
						}
						$this->para->appendChild($newList);
					} else if($el[0] == 'i'){
						$els = $this->reformat(array($el));
						$this->para->appendChild($els[0]);
					}
				}
			break;
			case 't':
				$table = $this->createElement( 'table' );
				$thead = $this->createElement( 'thead' );
				$tbody = $this->createElement( 'tbody' );
				$tableClass = array();
				if($e[2]){
					$tableClass[] = 'hidden';
				} else {
					$tableClass[] = 'p_table';
				}
				if($e[3]){
					$tableClass[] = 'centred';
				}
				$table->setAttribute('class', implode(' ', $tableClass));
				foreach($e[1] as $key=>$row){
					$tr = $this->createElement('tr');
					if(preg_match('/'.$tableClass.'/', 'p_match')){
						if($row[0] == 'b'){
							if($key%2){
								$rowClass = 'oddRow';
							} else {
								$rowClass = 'evenRow';
							}
							$tr->setAttribute('class', $rowClass);
						}
					}
					foreach($row[1] as $col){
						if($row[0] == 'h'){
							$newCol = $this->createElement( 'th' );
						} else if($row[0] == 'b'){
							$newCol = $this->createElement( 'td' );
						}
						if($col){
							$els = $this->reformat($col);
							foreach($els as $el)
								$newCol->appendChild($el);
						}
						$tr->appendChild($newCol);	
					}
					if($row[0] == 'h'){
						$thead->appendChild($tr);
					} else if($row[0] == 'b'){
						$tbody->appendChild($tr);
					}
				}
				$table->appendChild($thead);
				$table->appendChild($tbody);
				$this->para->appendChild($table);
			break;
			case 'h1': case 'h2': case'h3':
				$h = $this->createElement($e[0]);
				$h->setAttribute('class', 'p_'.$e[0]);
				$h->nodeValue = $e[1];
				$this->para = $h;
			break;
			case 'd':
				$div = $this->createElement('div');
				if($e[0]) $div->setAttribute('id', $e[1]);
				$classes = explode(',', $e[2]);
				$okClasses = array();
				foreach($classes as $class){
					$class = trim($class);
					if($class && preg_match('/[a-z0-9_]+/i', $class)){
						$okClasses[] = $class;
					}
				}
				$div->setAttribute('class', implode($okClasses, ' '));
				$this->para = $div;
			break;
		}
	}
	
	function reformat($elementArray){
		$elements = array();
		$spans = array();
		$imgs = array();
		foreach($elementArray as $e){
			$spanType = $e[0];
			switch($spanType){
				case 't':
					$textContent = htmlspecialchars_decode(trim($e[1]));
					$storedStyle = $e[2];
					if($storedStyle[0] != ''){
						$newSpan = $this->createElement('span');
						$styleString = '';
						foreach($storedStyle as $s){
							if($s == 'b') $styleString .= "font-weight:bold;";
							if($s == 'i') $styleString .= "font-style:oblique;";
							if($s == 'u') $styleString .= "text-decoration:underline;";					
						}
						if($e[3] != 13)
							$styleString .= "fontSize:".$e[3].'px;';
						$newSpan->setAttribute('style', $styleString);
						$newSpan->nodeValue = $textContent;
						$spans[] = $newSpan;
					} else {
						if($e[3] != 13){
							$newSpan = $this->createElement('span');
							$newSpan->setAttribute('style', 'font-size:'.$e[3].'px');
							$newSpan->nodeValue = $textContent;
							$spans[] = $newSpan;
						} else {
							$txtNode = $this->createTextNode($textContent);
							$spans[] = $txtNode;
						}
					}				
				break;
				case 'a': // link
					$type = $e[2];
					$t = preg_replace('/&#39;/', '', $e[3]);
					$u = preg_replace('/&#180;/', '', $t);
					$textContent = preg_replace('/&#34;|&quot;/', '', $u);
					$storedStyle = $e[4];
					$linkEl = $this->createElement('a');
					if($type == 'e'){
						$newHref = 'mailto:'.$e[1];
					} else if($type == 'l'){
						$newHref = preg_replace('/SITE/', 'http://doodleeditor.com', $e[1]);
					}
					$linkEl->setAttribute('href', $newHref);
					$styleString = '';
					if($e[5] && ($e[5] != 13)) $styleString = 'font-size:'.$e[5].'px';
					$linkEl->setAttribute('title', '');
					if($storedStyle[0] != null){
						foreach($storedStyle as $s){
							if($s == 'b') $styleString .= "font-weight:bold;";
							if($s == 'i') $styleString .= "font-style:oblique;";
							if($s == 'u') $styleString .= "text-decoration:underline;";						
						}
					}
					$linkEl->setAttribute('style', $styleString);
					$linkEl->nodeValue = $textContent;
					$spans[] = $linkEl;
				break;
				case 'i':
					$storedSrc = $e[1];
					$storedAlign = $e[2];
					$storedBorder = $e[3];
					$storedLink = preg_replace('/SITE/', 'http://doodleeditor.com', $e[4]);
					$storedWidth = $e[5];
					$newImg = $this->createElement('img');
					$pdfLink = false;
					if(preg_match('/\.pdf$/',$storedSrc)){
						$pdfLink = $this->createElement('a');
						$pdfLink->setAttribute('href', '/public_assets/pdfs/'.$storedSrc);
						$pdfLink->setAttribute('title', $storedSrc);
						$newImg->setAttribute('src', '/public_assets/imgs/pdf_icon.png');
					} else {
						$newImg->setAttribute('src', $storedSrc);
					}
					$newImg->setAttribute('alt', '');
					$newImg->setAttribute('style', 'height:auto;width:'.$storedWidth.'px');
					$newImgClass = '';
					if($pdfLink){
						$pdfLink->appendChild($newImg);
						$media = $pdfLink;
					} else {
						$media = $newImg;
					}
					if($storedAlign == 'l'){
						$newImgClass = 'left';
						$result = $media;					
					} else if ($storedAlign == 'r') {	
						$newImgClass = 'right';
						$result = $media;
					} else if ($storedAlign == 't') {	
						$newImgClass = 'tableImg';
						$result = $media;
					} else if($storedAlign == 'm') {
						$result	= $this->createElement('div');
						$newImgClass = 'middle';
						$result->setAttribute('class', 'inlineImageRow');
						$result->appendChild($media);
					}
					if($storedBorder == 'b'){
						$newImgClass .= ' bordered';
					}
					$newImg->setAttribute('class', $newImgClass);
					$a = $this->createElement('a');
					$storedSrc = preg_replace('/_m./', '.', $storedSrc);
					if($storedLink){
						$a->setAttribute('href', $storedLink);					
					} else {
						$a->setAttribute('href', $storedSrc);
					}
					$a->setAttribute('title', '');
					$a->appendChild($result);
					$result = $a;				
					$imgs[] = $result;		
				break;
			}
		}
		if(!empty($imgs)){
			foreach($imgs as $e)	
				$elements[] = $e;
		}
		if(!empty($spans)){
			$spaced = array();
			foreach($spans as $e){
				$spaced[] = $e;
					$txtNode = $this->createTextNode(' ');
					$spaced[] = $txtNode;				
			}
			foreach($spaced as $e)
				$elements[] = $e;
		}
		return $elements;
	}
	
	function getPara(){
		return $this->para;
	}
}
?>