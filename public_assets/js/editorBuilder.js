// editorBuilder.js - Builds editor blocks from ajax

function getData(id, cont){
	ajaxUrl = cmsPath+'/'+($('editorType').value+'/ajax/get/');
	req = new Request.JSON({
		url:ajaxUrl,
		onComplete: function(data,text){
			if(text != 'failed'){
				if(data[2]){
					$('pdf').setProperty('value', data[2].clean());
					linkPdfBox(data[2].clean());
				} else {
					$('editorCanvas').setStyle('display', 'block');
					$('toolbar').setStyle('display', 'block');					
				}
				$('editorID').value = id;
				$('title').value = data[0].replace(/&quot;/g, '"');
				$('dateVal').value = data[1];
				d = new Date();
				d.setTime($('dateVal').value*1000);
				newDate = d.getDate();
				newMonth = d.getMonth()+1;
				newYear = d.getFullYear();
				$('formatDate').set('text', newDate+'/'+newMonth+'/'+newYear);				
				$('pdf').value = data[2];
				$('thumbnailSrc').value = data[3];
				newImgSrc = data[3];
				if(newImgSrc){
					newImg = new Element('img', {'src':newImgSrc, 'title':''});
					$('thumbnail').appendChild(newImg);
					$$('#thumbnail span')[0].setStyle('display', 'none');
					$('thumbnailSrc').set('value', newImgSrc);
					newImg.makeDraggable({
						droppables: '#thumbnail',
						onDrop: function(draggable, droppable, event){
							if(!droppable){
								$$('#thumbnail img')[0].destroy();
								$$('#thumbnail span')[0].setStyle('display', 'block');
								$('thumbnailSrc').set('value', '');
							}
						}
					});
				}
				blockLists = [];
				blockLists[1] = data[4];
				blockListType = ' single';
				if(data[5]){
					blockLists[2] = data[5];
					blockListType = ' double'; 
				}
				if(data[5]&&data[6]){
					blockLists[3] = data[6];
					blockListType = ' triple';
				}
				$('editorCanvas').empty();
				n = 1;
				blockLists.each(function(thisBlockList, index){
					if(thisBlockList){
						newBlockList = new Element('ul', { 'class':'blockList'+blockListType, 'id':'block'+n});
						$('editorCanvas').appendChild(newBlockList);
						thisBlockList.each(function(block){
							builder = new blockBuilder(block, $('block'+n));
						});
						n++;
					}
				});
				if(!$('editorCanvas').getFirst()){
					$('editorCanvas').appendChild(new Element('ul', { 'id':'block1', 'class':'blockList' }));
				}
				currentEditor.blockList = $('editorCanvas').getFirst();			
			}
		}
	});
	req.send('id='+id);
}

var blockBuilder = new Class({ // Rebuilds block from database, assumes that all data is correctly ordered and does no checking whatsoever
	initialize: function(e, blockList){
		this.blockList = blockList;
		switch(e[0]){
			case 'p':
				newBlock = new block(this.blockList, 'para');
				this.block = newBlock.block;
				this.block.empty();
				this.reformat(e[1]).each(function(e){
					this.block.appendChild(e);
				}.bind(this));
			break;
			case 'l':
				newBlock = new block(this.blockList, 'list');
				this.block = newBlock.block;
				this.block.empty();
				e[1].each(function(el){
					if(el[0] == 'ul'){
						newUl = new Element('ul', { 'class':'prevList' });
						newUl.setProperty('style', 'list-style-type:'+el[1]);
						newUl.setStyle('width',e[2]+'px');
						el[2].each(function(savedRow){
							liEl = new Element('li');
							this.reformat(savedRow).each(function(e){
								liEl.appendChild(e);
							}.bind(this));
							newUl.appendChild(liEl);				
						}.bind(this));
						this.block.appendChild(newUl);					
					} else if(el[0] == 'i'){
						try { this.block.appendChild(this.reformat([el])[0]); } catch(err){}
					}
				}.bind(this));
			break;
			case 't':
				newBlock = new block(this.blockList, 'table');
				this.block = newBlock.block;
				this.block.empty();
				table = new Element('table', { 'class':'prevTable' });
				thead = new Element('thead');
				tbody = new Element('tbody');
				if(e[2]){
					table.addClass('prevHidden');
				} else {
					table.addClass('prevVisible');
				}
				if(e[3]){
					table.addClass('centred');
				} else {
					table.addClass('uncentred');
				}
				e[1].each(function(row, index){
					tr = new Element('tr');
					if(table.hasClass('prevVisible')){
						if(row[0] == 'b'){
							rowClass = ((index-1)%2) ? 'oddRow' : 'evenRow';
							tr.addClass(rowClass);
						}
					}
					
					row[1].each(function(col){
						if(row[0] == 'h'){
							newCol = new Element('th');
						} else if(row[0] == 'b'){
							newCol = new Element('td');
						}
						if(col){
							this.reformat(col).each(function(e){
								newCol.appendChild(e);
							});
						}
						if(newCol){
							tr.appendChild(newCol);
						}
					}.bind(this));
					if(row[0] == 'h'){
						thead.appendChild(tr);
					} else if(row[0] == 'b'){
						tbody.appendChild(tr);
					}
				}.bind(this));
				
				table.appendChild(thead);
				table.appendChild(tbody);
				this.block.appendChild(table);
			break;
			case 'h1': case 'h2': case'h3':
				newBlock = new block(this.blockList, e[0]);
				this.block = newBlock.block;
				this.block.set('html','<'+e[0]+'>'+e[1]+'</'+e[0]+'>');
			break;
			case 'd':
				newBlock = new block(this.blockList, 'div');
				this.block = newBlock.block;
				this.block.set('html','<ul><li><label>Id: </label><span class="att1">'+e[1]+'</span></li><li><label>Classes (,): </label><span class="att2">'+e[2]+'</span></li></ul>');
			break;
		}
	},
	reformat: function(element_array){
		elements = [];
		spans = [];
		imgs = [];
		element_array.each(function(e){
			eType = e[0];
			switch(eType){
				case 't': // text span
					span = new Element('span');
					content = e[1];
					stored_style = e[2];
					if(e[3] != 13) span.setStyle('font-size',e[3]+'px');
					span.addEvent('click', function(){	
						if(this.hasClass('selected')){
							this.setStyle('background-color','transparent');
						} else {
							this.setStyle('background-color','yellow');		
						}
						this.toggleClass('selected');
					});
					if(stored_style[0]){
						span.addClass('styled');
						stored_style.each(function(s){
							if(s == 'b') span.setStyle('font-weight','bold');
							if(s == 'i') span.setStyle('font-style','oblique');
							if(s == 'u') span.setStyle('text-decoration','underline');
						});
					}
					span.set('html',content);
					spans.push(span);
				break;
				case 'a': // link
					href = e[1];
					link_type = e[2];
					content = e[3];
					stored_style = e[4];
					span = new Element('span');
					if(e[5] != 13) span.setStyle('font-size',[5]+'px');
					links.push(href);
					if(e[2] == 'e'){
						span.addClass('fakeEmail');
					} else if(e[2] == 'l'){
						span.addClass('fakeLink');
					}
					span.setProperty('id', 'link-'+(links.length-1));
					span.addEvent('click', function(){	
						if(this.hasClass('selected')){
							this.setStyle('background-color','transparent');
						} else {
							this.setStyle('background-color','yellow');	
						}
						this.toggleClass('selected');
					});
					span.addEvent('mouseover', function(){
						n = this.id.match(/[0-9]+/);
						linkAlert(links[n], $('alertDiv'));
					});
					span.addEvent('mouseout', function(){
						$$('.linkAlert').invoke('destroy');
					});
					if(stored_style[0]){
						span.addClass('styled');
						stored_style.each(function(s){
							if(s == 'b') span.setStyle('font-weight','bold');
							if(s == 'i') span.setStyle('font-style','oblique');
							if(s == 'u') span.setStyle('text-decoration','underline');
						});
					}
					span.set('text',content);
					spans.push(span);
				break;
				case 'i': // image
					stored_src = e[1];
					stored_align = e[2];
					stored_border = e[3];
					stored_link = e[4];
					stored_width = e[5];
					if(stored_src.match(/\.pdf$/i)){
						img = new Element('img', { 'src':styleImagePath+'pdf_icon.png', 'title':'Click image to resize', 'title':stored_src,'alt':stored_src });						
					} else {
						img = new Element('img', { 'src':stored_src, 'title':'Click image to resize' });				
					}

					img.setStyles({
						'height':'auto',
						'width':stored_width+'px'
					});
					if(stored_align == 'l'){
						img.addClass('left');
						result = img;					
					} else if (stored_align == 'r') {	
						img.addClass('right');
						result = img;
					} else if (stored_align == 't') {	
						img.addClass('tableImg');
						result = img;
					} else if(stored_align == 'm') {		
						result = new Element('div', { 'class':'inlineImageRow' });
						result.appendChild(img);
						img.addClass('middle');
					}
					if(stored_border == 'b'){
						img.addClass('bordered');
					}
					if(stored_link){
						img.store('link', stored_link);
					}
					img.addEvent('click', function(){
						toolCont = new Element('div', { 'id':'overlayTool', 'style':'height:400px;' });
						sidebar = new Element('div', { 'id':'imageResizeTools' });
						prevImg = this.clone();
						prevImg.setProperties({
							'class':'',
							'title':'',
							'id':'subjectImg'
						});
						prevImg.setStyles({
							'float':'left',
							'clear':'left'
						});
						a = new imageEditor(this); // returns list of tools
						a.makeTools(this.getStyle('height').toInt(), this.getStyle('width').toInt(), prevImg).each(function(e){ toolCont.appendChild(e); });
						toolCont.appendChild(prevImg);
						$('overlayWrap').appendChild(toolCont);
						sizeSlider = new Slider($('sliderArea'), $('sliderHandle'), {
							range: [10, 600],
							steps: 600,
							onChange: function(v){
								widthCalc = Math.floor(v);
								$('subjectImg').setStyles({ 'height':'auto','width':widthCalc+'px'});
							}
						}).set(this.getStyle('width').toInt());
					});
					imgs.push(result);
				break;
			}
		});		

		if(imgs){
			imgs.each(function(e){elements.push(e);});
		}
		if(spans){
			spaced = [];
			spans.each(function(e){
				spaced.push(e);
				if(e != spans.getLast()){
					txtNode = document.createTextNode(' ');
					spaced.push(txtNode);
				}
			}.bind(this));
			spaced.each(function(e){
				elements.push(e);
			});
		}
		return elements;
	}
});