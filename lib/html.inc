<?php
	class LIB_HTML {
		
		/* data :-
			Array (
				0 => list item
				1 => list item
				2 => list item
			);
		*/
		static function ulist($class, $id, $data = array(), $t){
			$tab = "";
			for($i=0;$i<$t;$i++) $tab.="\t";
			$classDef = false;
			$idDef = false;
			if($class)
				$classDef = ' class="'.$class.'"';
			if($id)
				$idDef = ' id="'.$id.'"';
			$HTML =
			$tab.'<ul'.$classDef.$idDef.'>'."\n";
			foreach($data as $v){
				$HTML.=
				$tab."\t".'<li>'.$v.'</li>'."\n";
			}
			$HTML .=
			$tab.'</ul>';
			return $HTML;
		}
		
		/* data :-
			Array (
				0 = >
					Array(
						0=> header1
						1=> header2
						2=> header3
					);
				1 =>
					Array(
						0=>col val 1
						1=>col val 2
						2=>col val 3
					);
			);
		*/
		static function table($class, $id, $data = array(), $t){
			$tab = '';
			for($i=0;$i<$t;$i++) $tab.="\t";
			$classDef = false;
			$idDef = false;
			if($class)
				$classDef = ' class="'.$class.'"';
			if($id)
				$idDef = ' id="'.$id.'"';
			$HTML =  $tab.'<table'.$classDef.$idDef.'>'."\n";
			$inc = 0;
			foreach($data as $key=>$row){
				if($key === 1){
					$HTML .= $tab."\t".'<tbody>'."\n";
				} else if(!$key){
					$HTML .= $tab."\t".'<thead>'."\n";
				}
				$class = false;
				if($inc){
					if($inc%2){
						$class = 'o';
					} else {
						$class = 'e';
					}
				}
				$HTML .= $tab."\t\t".'<tr class="'.$class.'">'."\n";
				$i = 1;
				foreach($row as $n=>$col){
					if($key){
						$x = 'd';
					} else {
						$x = 'h';
					}
					$colClass = false;
					if($n) $colClass = 'b ';
					$HTML.= $tab."\t\t\t".'<t'.$x.' class="'.$colClass.'col'.$i.'">'.$col.'</t'.$x.'>'."\n";
					$i++;
				}
				$HTML .= $tab."\t\t".'</tr>'."\n";
				if(!$key){
					$HTML .= $tab."\t".'</thead>'."\n";
				}
				$inc++;
			}
			$HTML .= $tab."\t".'</tbody>'."\n";
			$HTML .= $tab.'</table>';
			return $HTML;
		}
		
		/*
			$data = array(
				array(
					'type'=>'text',
					'label'=>'hello',
					'id'=>'yo',
					'value'=>123
				),
				array(
					'type'=>'submit',
					'label'=>'hello',
					'id'=>'noice',
					'value'=>123				
				),
				array(
					'type'=>'select',
					'label'=>'selectBox',
					'id'=>'selectBox',
					'value'=>
						array(
							array(
								'label'=>'cheese',
								'values'=>
									array(
										10=>'stilton',
										11=>'cheddar',
										12=>'brie'
									)
								),
							array(
								'label'=>'not cheese',
								'values'=>
									array(
										33=>'bacon',
										34=>'car'
									)
							)
						)
				)
			); */
		static function form($class, $id, $method, $action, $other = array(), $data = array(), $t){
			$tab = '';
			for($i=0;$i<$t;$i++) $tab.="\t";
			$methodAttribute = '';
			$actionAttribute = '';
			$classAttribute = '';
			$idAttribute = '';
			if($method)
				$methodAttribute = ' method="'.$method.'"';
			if($action)
				$actionAttribute = ' action="'.$action.'"';
			if($class)
				$classAttribute = ' class="'.$class.'"';
			if($id)
				$idAttribute = ' id="'.$id.'"';
			$otherString = '';
			if(!empty($other)){
				foreach($other as $attribute=>$value){
					$otherString .= ' '.$attribute.'="'.$value.'"';
				}
			}
			$HTML = $tab.'<form'.$idAttribute.$classAttribute.$actionAttribute.$methodAttribute.$otherString.'>'."\n".$tab."\t".'<ul>'."\n";
			if(!empty($data)){
				foreach($data as $d){
					$id = '';
					$label = '';
					$name ='';
					$value = '';
					if(isset($d['id'])){
						if($d['id']) {
							$id = ' id="'.$d['id'].'"';
						}
					}
					if(isset($d['name'])){
						if($d['name']) {
							$name = ' name="'.$d['name'].'"';
						}
					}
					if(isset($d['label'])) {
						$for = '';
						if(isset($d['id']))
							$for = ' for="'.$d['id'].'"';
						$label = '<label'.$for.'><span>'.$d['label'].'</span></label>';
					}
					$others = '';
					if(isset($d['others'])){
						if(!empty($d['others'])){
							foreach($d['others'] as $type=>$val){
								$others .= ' '.$type.'="'.$val.'"';
							}
						}
					}
					$extraDiv = '';
					if(isset($d['extraDiv'])){
						$extraHTML = '';
						if(isset($d['extraHTML'])){
							$extraHTML = $d['extraHTML'];
						}
						if($d['extraDiv']){
							$extraID = '';
							if(isset($d['id'])){
								$extraID = ' id="'.$d['id'].'_extra"';
							}
							$extraDiv = '<div class="f_extra"'.$extraID.'>'.$extraHTML.'</div>';
						}
					}
					switch($d['type']){
						case 'text': case 'password': case 'button': case 'submit': case 'reset': case 'hidden': case 'file':
							$item = '<input type="'.$d['type'].'"'.$id.$name.' value="'.$d['value'].'"'.$others.'>';
						break;
						case 'textarea':
							$item = '<textarea'.$id.$others.$name.'>'.$d['value'].'</textarea>';
						break;
						case 'radio': case 'checkbox':
							if(is_array($d['value'])){
								$item = "\n\t\t\t".$tab.'<ul'.$id.' class="radioList">';
								$inc = 0;
								foreach($d['value'] as $key=>$opt){
									$value = '';
									$textVal = '';
									$selected = '';
									if((array_keys($d['value']) !== range(0, count($d['value']) - 1))){ // Check if values array is associative
										if($d['checked'] == $inc) $selected = ' checked="checked"';
										$value = ' value="'.$key.'"';
										$textVal = $opt;
									} else {
										$textVal = $opt;
									}
									$item .= "\n\t\t\t\t".$tab.'<li><input type="'.$d['type'].'"'.$name.' value="'.$opt.'"'.$others.$selected.'><span>'.$opt.'</span></li>';
									$inc++;
								}
								$item .= "\n\t\t\t".$tab.'</ul>'."\n\t\t".$tab;
							} else {
								$item = '<input type="'.$d['type'].'"'.$id.$name.' value="'.$d['value'].'"'.$others.'>';
							}
						break;
						case 'select':
							$item = "\n\t\t\t".$tab.'<select'.$id.$others.$name.'>';
							$inc = 0;
							foreach($d['value'] as $key=>$v){
								if(is_array($v)){ // is an optgroup
									$item .= "\n".$tab."\t\t\t\t".'<optgroup label="'.$v['label'].'">'."\n";
									foreach($v['values'] as $key=>$opt){
										$value = '';
										$textVal = '';
										$selected = '';
										if((array_keys($v) !== range(0, count($v) - 1))){ // Check if values array is associative
											if($d['selected'] == $inc) $selected = ' selected="selected"';
											$value = ' value="'.$key.'"';
											$textVal = $opt;
										} else {
											$textVal = $opt;
										}
										$item .= $tab."\t\t\t\t\t".'<option'.$value.$selected.'>'.$textVal.'</option>'."\n";
										$inc++;
									}
									$item .= $tab."\t\t\t\t".'</optgroup>';
								} else {
									$value = '';
									$textVal = '';
									$selected = '';
									if((array_keys($d['value']) !== range(0, count($d['value']) - 1))){ // Check if values array is associative
										if($d['selected'] == $inc) $selected = ' selected="selected"';
										$value = ' value="'.$key.'"';
										$textVal = $v;
									} else {
										$textVal = $v;
									}
									$item .= "\n".$tab."\t\t\t\t".'<option'.$value.$selected.'>'.$textVal.'</option>';
									$inc++;
								}
							}
							$item .= "\n".$tab."\t\t\t".'</select>'."\n\t\t".$tab;
						break;
						case 'date':
							$item = "\n\t\t\t".$tab.'<div id="'.$d['contID'].'" class="f_dateWrap">';
							$item .= "\n\t\t\t\t".$tab.'<div class="dateDiv"></div>';
							$item .= "\n\t\t\t\t".$tab.'<div class="dateInputWrap"><input type="hidden" '.$id.$others.$name.' value="'.$d['value'].'"></div>';
							$item .= "\n\t\t\t\t".$tab.'<div class="dateInputIcon"><img src="'.$d['icon'].'" alt="" class="dateIcon"></div>';
							$item .= "\n\t\t\t\t".$tab.'<div></div>';
							$item .= "\n\t\t\t".$tab.'</div>'."\n\t\t".$tab;
						break;
						case 'time':
							$item = "\n\t\t\t".$tab.'<div'.$id.$others.$name.'>';
							$item .= "\n\t\t\t\t".$tab.'<select>';
							for($i=0;$i<25;$i++){
								$item .= "\n\t\t\t\t\t".$tab.'<option>'.sprintf("%02d",$i).'</option>';
							}
							$item .= "\n\t\t\t\t".$tab.'</select> :';
							$item .= "\n\t\t\t\t".$tab.'<select>';
							for($i=0;$i<60;$i++){
								$item .= "\n\t\t\t\t\t".$tab.'<option>'.sprintf("%02d",$i).'</option>';
							}
							$item .= "\n\t\t\t\t".$tab.'</select>';
							$item .= "\n\t\t\t".$tab.'</div>'."\n\t\t".$tab;
						break;
						case 'div':
							$item = '<div'.$id.$others.'>'.$d['value'].'</div>';
						break;
						case 'header':
							$item = '<h2'.$id.$others.'>'.$d['value'].'</h2>';
						break;
						case 'button':
							$item = '<button'.$id.$others.'>'.$d['value'].'</button>';
						break;
					}
					$HTML .= $tab."\t\t".'<li>'.$label.$item.$extraDiv.'</li>'."\n";
					unset($d);
				}
			}
			$HTML .= $tab."\t".'</ul>'."\n".$tab.'</form>';
			return $HTML;
		}

	}
?>