<?php
/**
 * Editor sanitising, saving and outputting
 *
 * Class controls incoming element arrays from client side editor canvas, cleans and checks it before submitting a serialised array to database.
 * It also ensures output to HTML is clean before displaying.
 *
 */

class LIB_Editor {
	protected $incoming = array(); //Array of blocklists to be put into database
	
	function input($dirty){
		if($decoded = json_decode($dirty)){
			//	0 	= type: either new or id of entry to update
			//	1 	= title
			//	2 	= timestamp
			//	3	= pdf
			//	4	= thumbnail
			//	5+	= blocklists (max 3)
			if(is_array($decoded[5])){
				$type = '';
				$ok = true;
				$inc = 5;
				if($decoded[0] == 'new'){
					while($ok){
						if(isset($decoded[$inc])){
							$this->incoming[] = $this->scrubber($decoded[$inc]);
							$inc++;
						} else {
							$ok = false;
						}
					}
					return $this->saveNew($decoded[1], $decoded[2], $decoded[3], $decoded[4]);
				} else if((int)$decoded[0]){
					while($ok){
						if(isset($decoded[$inc])){
							$this->incoming[] = $this->scrubber($decoded[$inc]);
							$inc++;
						} else {
							$ok = false;
						}
					}
					return $this->updateEditor($decoded[1], $decoded[2], $decoded[3], $decoded[4]);
				}
			} else { exit; }
		}
	}
	
	function saveNew($titleDirty, $timeDirty, $pdf, $thumbnail){
		$insert = array();
		$insert['title'] = filter_var($titleDirty, FILTER_SANITIZE_STRING, FILTER_FLAG_NO_ENCODE_QUOTES);
		$insert['time'] = array('FROM_UNIXTIME', filter_var($timeDirty, FILTER_SANITIZE_NUMBER_INT));
		$insert['thumbnail'] = filter_var($thumbnail, FILTER_VALIDATE_URL);
		if($pdf){
			if(file_exists('../public_html/pdfs/'.$pdf)){
				$insert['pdf'] = $pdf;
			} else {
				$insert['pdf'] = '';
			}
		} else {
			$insert['pdf'] = '';
			$insert['content'] = serialize($this->incoming);
		}
		return $insert;
	}
	
	function updateEditor($titleDirty, $timeDirty, $pdf, $thumbnail){
		$updateParams = array();
		$updateParams['title'] = filter_var($titleDirty, FILTER_SANITIZE_STRING, FILTER_FLAG_NO_ENCODE_QUOTES);
		$updateParams['time'] = array('FROM_UNIXTIME', filter_var($timeDirty, FILTER_SANITIZE_NUMBER_INT));
		$updateParams['thumbnail'] = filter_var($thumbnail, FILTER_VALIDATE_URL);
		if($pdf){
			if(file_exists('../public_html/pdfs/'.$pdf)){
				$updateParams['pdf'] = $pdf;
			} else {
				$updateParams['pdf'] = '';
			}
		} else {
			$updateParams['pdf'] = '';
			$updateParams['content'] = serialize($this->incoming);
		}
		return $updateParams;
	}
	
	function getEditor($data){
		$result = array();
		if($data){
			$result[] = filter_var($data[0]['title'], FILTER_SANITIZE_STRING, FILTER_FLAG_NO_ENCODE_QUOTES);
			if(is_array($data[0]['time'])){
				$result[] = filter_var($data[0]['time'][1], FILTER_SANITIZE_NUMBER_INT);
			} else {
				$result[] = filter_var($data[0]['time'], FILTER_SANITIZE_NUMBER_INT);
			}
			$result[] = htmlentities($data[0]['pdf']);
			$result[] = filter_var($data[0]['thumbnail'], FILTER_VALIDATE_URL);
			if($data[0]['content']){
				$blocklists = unserialize($data[0]['content']);
				if($blocklists[0]){
					foreach($blocklists as $b){
						if(!empty($b)){
							$result[] = $this->scrubber($b);
						} else {
							$result[] = array();
						}
					}
				} else {
					$result[] = false;
				}
			} else {
				$result[] = false;
			}
		} else {
			$result = 'failed';
		}
		return $result;
	}
	
	function styleElementChecks($unchecked){
		$checked = false;
		if(is_array($unchecked)){
			switch($unchecked[0]){
				case 't': // A text element
					if((isset($unchecked[0]))&&(isset($unchecked[1]))&&(isset($unchecked[2]))){
						$assoc = array();
						$assoc['t']	= $unchecked[0];
						$assoc['c']	= $unchecked[1];
						$assoc['s']	= $unchecked[2];
						if(isset($unchecked[3])){
							if($unchecked[3]){
								$assoc['p']	= $unchecked[3];
							} else {
								$assoc['p'] = 0;
							}
						} else {
							$assoc['p'] = 0;
						}
						$args = array(
							't'	=> FILTER_SANITIZE_STRING,
							'c'	=> array	(	'filter' => FILTER_SANITIZE_STRING,
												'flags'=> FILTER_FLAG_NO_ENCODE_QUOTES
											),
							's'	=> array	(	'filter' => FILTER_VALIDATE_REGEXP,
												'options'=> array( 'regexp' => '/[b|i|u]/'),
												'flags'  => FILTER_FORCE_ARRAY
										),
							'p'	=> array	(	'filter' => FILTER_SANITIZE_NUMBER_INT,
												'options'=> array('min_range' => 8, 'max_range' => 72)
											)
						);
						$a = array(0,1,2,3); // Can't be saved as associative array unless willing to somehow to send a hash from client side.
						$b = filter_var_array($assoc, $args);
						$checked = array_combine($a, $b);
					}
				break;
				case 'a': // A link element
					if((isset($unchecked[0]))&&(isset($unchecked[1]))&&(isset($unchecked[2]))&&(isset($unchecked[3]))&&(isset($unchecked[4]))){
						$assoc = array();
						$assoc['t']	= $unchecked[0]; //type
						$filterFlag = false;
						$unchecked[1] = str_replace('SITE', MAIN_FQDN, $unchecked[1]);
						if($unchecked[2] == 'l'){
							$filterFlag = FILTER_VALIDATE_URL;
							if(preg_match('/http:\/\//', $unchecked[1])){
								$assoc['h']	= $unchecked[1];
							} else {
								$assoc['h']	= 'http://'.$unchecked[1];
							}
						} else if($unchecked[2] == 'e') {
							$filterFlag = FILTER_VALIDATE_EMAIL;
							$assoc['h']	= $unchecked[1];				
						}
						
						if($filterFlag) {
							$assoc['l'] = $unchecked[2]; //link type
							$assoc['c']	= $unchecked[3]; //text
							$assoc['s']	= $unchecked[4]; //style

							if(isset($unchecked[5])){ //text size
								if($unchecked[5]){
									$assoc['p']	= $unchecked[5];
								} else {
									$assoc['p'] = 0;
								}
							} else {
								$assoc['p'] = 0;
							}
							$args = array(
								't' => FILTER_SANITIZE_STRING,
								'h' => $filterFlag,
								'l' => array	(	'filter' => FILTER_VALIDATE_REGEXP,
													'options'=> array( 'regexp' => '/[e|l]/'),
												),
								'c' => array	(	'filter' => FILTER_SANITIZE_STRING,
													'flags'	 => FILTER_FLAG_NO_ENCODE_QUOTES
												),
								's'	=> array	(	'filter' => FILTER_VALIDATE_REGEXP,
													'options'=> array( 'regexp' => '/[b|i|u]/'),
													'flags'  => FILTER_FORCE_ARRAY
												),
								'p'	=> array	(	'filter' => FILTER_SANITIZE_NUMBER_INT,
													'options'=> array('min_range' => 8, 'max_range' => 72)
												)
							);
								
							$a = array(0,1,2,3,4,5);
							$b = filter_var_array($assoc, $args);
							$checked = array_combine($a, $b);
							$checked[1] = str_replace(MAIN_FQDN, 'SITE', $checked[1]);
						}
					}						
				break;
				case 'i': // An image
					if((isset($unchecked[0]))&&(isset($unchecked[1]))&&(isset($unchecked[2]))&&(isset($unchecked[3]))){
						$assoc = array();
						$assoc['t']	= $unchecked[0];
						$assoc['i']	= $unchecked[1];
						$assoc['a']	= $unchecked[2];
						$assoc['b']	= $unchecked[3];
						$assoc['l']	= str_replace('SITE', MAIN_FQDN, $unchecked[4]);
						$assoc['w']	= $unchecked[5];
						if($assoc['l']){
							if(!preg_match('/http:\/\//', $assoc['l'])){
								$assoc['l']	= 'http://'.$assoc['l'];
							}
						}
						$args = array(
							't'	=> FILTER_SANITIZE_STRING,
							'i'	=> FILTER_VALIDATE_URL,
							'a'	=> array	(	'filter' => FILTER_VALIDATE_REGEXP,
												'options'=> array( 'regexp' => '/[r|l|m|t]/')
											),
							'b'	=> array	(	'filter' => FILTER_VALIDATE_REGEXP,
												'options'=> array( 'regexp' => '/[b|n]/')
											),
							'l'	=> FILTER_VALIDATE_URL,
							'w'	=> array	(	'filter' => FILTER_SANITIZE_NUMBER_INT,
												'options'=> array('min_range' => 10, 'max_range' => 600)
											)
							);
						if(preg_match('/\.pdf$/i',$assoc['i'])){
							$args['i'] = FILTER_SANITIZE_STRING;
						}
						$a = array(0,1,2,3,4,5);
						$b = filter_var_array($assoc, $args);
						$checked = array_combine($a, $b);
						$checked[4] = str_replace(MAIN_FQDN, 'SITE', $checked[4]);
					}
				break;
			}
		}
		return $checked;
	}
	
	function scrubber($blocklist){
		$goodBlocks = false;
		$goodBlock = false;
		if(!is_array($blocklist)) exit;
		foreach($blocklist as $block){
			if(is_array($block)) {
				$goodBlock = array();
				switch($block[0]){ // block types
					case 'p': // Paragraph
						if(is_array($block[1])) {
							$goodBlock[0] = 'p';
							foreach($block[1] as $object){
								if($cleaned = $this->styleElementChecks($object)){
									$goodBlock[1][] = $cleaned;
								}
							}
							$goodBlock[2] = filter_var($block[2], FILTER_VALIDATE_INT);
						}
					break;
					case 't': // Table --- THIS WAS A COMPLETE BUCKET OF ARSE TO DO, ARRAYS OF BLOODY ARRAYS OF WTF
						if(is_array($block[1])) {
							$goodBlock[0] = 't';
							if(is_array($block[1])){ // the 'content'
								foreach($block[1] as $element){ //array of tHead and tBody rows
									if(($element[0] == 'h') || ($element[0] == 'b')){
										$goodRow = array();
										$goodRow[0] = $element[0];
										$goodRow[1] = array();
										if(is_array($element[1])){ // array of cells
											foreach($element[1] as $cell){
												$goodCell = array(); //array of all elements in cell
												if(!empty($cell)){
													foreach($cell as $objects){
														if($cleaned = $this->styleElementChecks($objects))
															$goodCell[] = $cleaned;
													}
												}
												$goodRow[1][] = $goodCell;
											}
										}
										$goodBlock[1][] = $goodRow;
									}
								}
							}
							$goodBlock[2] = filter_var($block[2], FILTER_VALIDATE_INT);
							$goodBlock[3] = filter_var($block[3], FILTER_VALIDATE_INT);
							$goodBlock[4] = filter_var($block[4], FILTER_VALIDATE_INT);
						}
					break;			
					case 'l': // List
						if(is_array($block[1])) {
							$goodBlock[0] = 'l';
							$goodBlock[1] = array();
							foreach($block[1] as $element){
								if($element[0] == 'ul'){
									$goodList = array();
									$goodList[0] = 'ul';
									$goodList[1] = filter_var($element[1], FILTER_SANITIZE_STRING);
									$goodList[2] = array();
									foreach($element[2] as $row){
										$goodRow = array();
										foreach($row as $object){
											if($cleaned = $this->styleElementChecks($object)) 
												$goodRow[] = $cleaned;
										}
										$goodList[2][] = $goodRow;						
									}
									$goodBlock[1][] = $goodList;	
								} else if($element[0] == 'i'){
									if($okImage = $this->styleElementChecks($element)){
										$goodBlock[1][] = $okImage;
									}
								}
							}
							$goodBlock[2] = filter_var($block[2], FILTER_VALIDATE_INT);
							$goodBlock[3] = filter_var($block[3], FILTER_VALIDATE_INT);
						}
					break;
					case 'h1': case 'h2': case 'h3': //Headings
						$goodBlock[0] = $block[0];
						$goodBlock[1] = filter_var($block[1], FILTER_SANITIZE_STRING);
						$goodBlock[2] = filter_var($block[2], FILTER_VALIDATE_INT);
					break;
					case 'd': // Generic Div
						$goodBlock[0] = 'd';
						$goodBlock[1] = filter_var($block[1], FILTER_SANITIZE_STRING);
						$goodBlock[2] = filter_var($block[2], FILTER_SANITIZE_STRING);
						$goodBlock[3] = filter_var($block[3], FILTER_VALIDATE_INT);
					break;
				}
				$goodBlocks[] = $goodBlock;
			}
		}
		return $goodBlocks;
	}
	
}

?>