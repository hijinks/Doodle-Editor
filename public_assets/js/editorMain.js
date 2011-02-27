//editorMain.js - contains the actual tool creation and editng classes

var iT =((new Element('div')).innerText != undefined) ? true : false;
// Decides if browser uses innerText or textContent and therefore removes potential for massive ballache.
var links = [];

function linkAlert (caption, div) { // linkAlerts for link mouseovers
	div.set('html','<span class="linkAlert">'+caption+'</span>');
}

function range(min, max, step){
	a = [];
	if (!step) step = 1;
	for (var i = min; i <= max; i += step) a.push(i);
	return a;
}

var Editor = new Class({
	initialize: function(){
		window.currentEditor = this;
	},
	setup: function(container){
		this.container = container;
		this.canvas = new Element('div', { 'id':'editorCanvas' });
		this.imageGallery = new Element('div', { 'id':'imageGallery','style':'height:0;'});
		this.imageGallery.setStyle('opacity',0);
		this.blockList = new Element('ul', { 'id':'block1', 'class':'blockList' }); // Default single blocklist
		this.canvas.appendChild(this.blockList);
		this.toolbar = new Element('div', { 'id':'toolbar' });
		this.createToolbar();
		this.assemble(); // Right at the bottom of the class - sticks everything together
		this.extras = []; // Extra elements whose values will be added to JSON string on submission (date, title etc..)
		this.sortables = false;
	},
	createToolbar: function(){ // Generates the list of buttons
		ul = new Element('ul');
		options = 
		[false,		'1 Column',	'2 Columns','3 Columns',false,	false, 			'Para', 	'H1',		'H2',		'H3', 		'List',		'Table',	'Image',	'PDF', 		'Div', 		false, 	false, 				'B', 		'I',			'U', 		 		false,			'textSize', 	'Link',		'Email',		'Destyle', 	'Deselect', 	'Select all text in block', false];
		IDs = 
		[false, 	'1col',		'2col',		'3col',		false,	false,			'newPara', 	'newH1', 	'newH2', 	'newH3',	'newList', 	'newTable', 'newImage', 'newPDF', 	'newDiv', 	false, 	false, 				'newBold',	'newItalics',	'newUnderline', 	false,			'textSize', 	'newLink', 	'newEmail',	'destyle', 		'deselect', 	'selectAll', 			false];
		txt = 
		['Layout: ',false,		false,		false, 		'<br>',	'New Element: ', false,		 false, 	false, 		false, 		false, 		false, 		false, 		false,		'false', 	'<br>', 'Text formating: ',	false, 		false, 			'false', 			'Text size: ',	false, 			false, 		false,		false, 			false, 			false,						' | '];
		
		options.each(function(s, index){
			li = new Element('li');
			if(s == 'textSize'){
				listItem = new Element('select', {'id':'textSize'});
				range(8,72).each(function(i){
					opt = new Element('option',{'value':i});
					opt.set('text', i+'px');
					listItem.appendChild(opt);
				});
			} else if(IDs[index]){
				listItem = new Element('input', { 'type':'button', 'value':s, 'id':IDs[index], 'class':'button' });
			} else {
				listItem = new Element('span');
				listItem.set('html', txt[index]);
			}
			li.appendChild(listItem);
			ul.appendChild(li);
			this.behaviours(listItem);
		}.bind(this));
		label = new Element('label', { For:'makeSort'});
		sortCheck = new Element('input', { 'id':'makeSort', 'type':'checkbox' }); // Checkbox which allows drag and drop reordering of blocks in a blocklist
		sortCheck.addEvent('change', function(){
			this.makeSortable(sortCheck.checked);
		}.bind(this));
		iT ? label.innerText = 'Reorder:' :  label.textContent = 'Reorder:';
		li = new Element('li');
		li.appendChild(label);
		li.appendChild(sortCheck);
		ul.appendChild(li);
		this.toolbar.appendChild(ul);
	},
	setLayout: function(n){ // Swapping layout between 1, 2 and 3 columns. Shoves all blocks evenly between.
		if($$('.blockList')[0].hasClass('double')){
			current = 2;
		} else if($$('.blockList')[0].hasClass('triple')){
			current = 3;
		} else {
			current = 1;
		}
		
		allBlocks = [];
		$$('.blockList').each(function(e){
			e.getChildren().each(function(b){ allBlocks.push(b); });
		});
		
		if(current != n){
			nBlocks = allBlocks.length;
			share = Math.ceil((allBlocks.length)/n);
			ranges = [];
			for(i=1;i<=n;i++){
				max = i*share;
				min = max-share; 
				ranges.push(range(min,max));
			}
			lists = [];
			ranges.each(function(range){
				list = [];
				range.each(function(n){
					if(allBlocks[n]) list.push(allBlocks[n]);
				});
				lists.push(list);
			});
			if(n==2){
				extraClass = ' double';
				if(lists.length < n) lists.push([]);
			} else if(n==3) {
				extraClass = ' triple';
				if(lists.length < n) lists.push([]);
			} else {
				extraClass = '';
			}
			newLists = [];
			lists.each(function(list, index){
				newUL = new Element('ul', { 'id':'block'+(index+1), 'class':'blockList'+extraClass });
				list.each(function(block){ if(block) newUL.appendChild(block); });
				newLists.push(newUL);
			});
			this.canvas.empty();
			newLists.each(function(list){ this.canvas.appendChild(list); }.bind(this));
			this.blockList = $('block1');
		}
		if(this.sortables) this.makeSortable(1);
	},
	dragOptions: {
		onDrop: function(draggable, droppable, event){
			if(droppable){
				newImg = new Element('img', { 'src':draggable.src.replace('_s.', '_m.'), 'title':'Click image to resize' });
				if(draggable.getProperty('alt')){
					if(draggable.getProperty('alt').match(/\.pdf$/)){
						pdfName = draggable.getProperty('alt');
						newImg.setProperties({
							'title':pdfName,
							'alt':pdfName
						});
					}
				}
				s = draggable.getSize();
				newImg.setStyles({
					'height':s.y+'px',
					'width':s.x+'px'
				});
				newImg.addEvent('click', function(){
					toolCont = new Element('div', { 'id':'overlayTool', 'style':'height:400px;' });
					sidebar = new Element('div', { 'id':'imageResizeTools' });
					prevImg = new Element('img');
					prevImg.setProperties({
						'src':this.src,
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
				if((droppable.hasClass('para')||(droppable.hasClass('list')))){
					prev = droppable.getFirst();
					dropType = droppable.getFirst().getProperty('class').toString().split(" ")[2];
					if((dropType == 'left') || (dropType == 'right')) {	
						newImg.addClass(dropType);
						result = newImg;			
					} else {
						result = new Element('div', { 'class':'inlineImageRow' });
						result.appendChild(newImg);
						newImg.addClass('middle');
					}
					result.inject(droppable, 'top');
					prev.destroy();
				} else if((this.droppable.get('tag') == 'td')||(this.droppable.get('tag') == 'th')){
					newImg.addClass('tableImg');
					newImg.inject(droppable, 'top');
				} else if(this.droppable.get('id') == 'thumbnail'){
					newImgSrc = draggable.src;
					newImg = new Element('img', {'src':draggable.src, 'title':''});
					try{$$('#thumbnail img')[0].destroy();}catch(err){}
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
			}
			draggable.destroy();
		},
		onEnter: function(draggable, droppable){
			this.droppable = droppable;
			try{ outline.destroy(); outline = false; } catch (err){}
		},
		onDrag: function(draggable, event){
			if(this.droppable){
				droppable = this.droppable;
				if(this.droppable.hasClass('para')||this.droppable.hasClass('list')){
					dOffset = droppable.getParent().offsetLeft;
					centre = (droppable.getStyle('width').toInt()/2)+dOffset;
					if(!droppable.hasClass('droppable')){
						if($('imageOutline')) $('imageOutline').destroy();
						$$('.para, .list').each(function(e){ e.setStyle('height','auto'); });
						$$('.droppable').each(function(e){ 
							e.setStyle('height','auto');
							e.removeClass('droppable');
						});
					}
					s = draggable.getSize();
					if(!$('imageOutline')){
						imageOutline = new Element('div', { 'id':'imageOutline', 'class':'previewOutline outline' });
						imageOutline.inject(droppable, 'top');
						$('alertDiv').empty();
					}
					if(draggable.offsetLeft < centre-50){
						if(!$('imageOutline').hasClass('left')){
							$('imageOutline').setStyles({ 'height':s.y+'px', 'width':s.x+'px'});
							$('imageOutline').getChildren().invoke('destroy');
							$('imageOutline').removeClass('middle');
							$('imageOutline').removeClass('right');
							$('imageOutline').addClass('left');
							if(droppable.getStyle('height') < s.y) droppable.setStyle('height',(s.y+5)+'px');
						}
					} else if (draggable.offsetLeft > centre+50){
						if(!$('imageOutline').hasClass('right')){
							$('imageOutline').setStyles({ 'height':s.y+'px', 'width':s.x+'px'});
							$('imageOutline').getChildren().invoke('destroy');
							$('imageOutline').removeClass('middle');
							$('imageOutline').removeClass('left');
							$('imageOutline').addClass('right');
							if(droppable.getStyle('height') < s.y) droppable.setStyle('height',(s.y+5)+'px');
						}
					} else {
						if(!$('imageOutline').hasClass('middle')){
							$('imageOutline').setStyles({
								'height':s.y+'px',
								'width':'100%'
							});
							droppable.setStyle('height','auto');
							insideOutline = new Element('div', { 'class':'insideOutline'});
							insideOutline.setStyles({
								'height':s.y+'px',
								'width':s.x+'px'
							});
							$('imageOutline').appendChild(insideOutline);
							$('imageOutline').removeClass('left');
							$('imageOutline').removeClass('right');
							$('imageOutline').addClass('middle');
						}
					}
				} else if(((this.droppable.get('tag') == 'td')||(this.droppable.get('tag') == 'th'))&&!this.droppable.hasClass('hoverTd')){
					$$('.hoverTd').invoke('removeClass', 'hoverTd');
					this.droppable.addClass('hoverTd');
				}
			}
		},
		onComplete: function(draggable){
			$$('.outline').invoke('destroy');
			$$('.hoverTd').invoke('removeClass', 'hoverTd');
		}
	},
	makeSortable: function(v){ // Checkbox behaviours for enabling or disabling drag & drop block sorting
		if(this.sortables && v){
			this.sortables.removeLists($$('.blockList'));
			this.sortables.addLists($$('.blockList'));
			$$('.blockList').each(function(block){
				block.getChildren().each(function(listItem){
					listItem.setStyles({ 'border':'1px dashed #33cc66', 'cursor':'move' });
				});
			});
		} else if(!this.sortables && v){
			this.sortables = new Sortables($$('.blockList'), {
				clone:true,
				opacity:0.5,
				revert:true,
			});
			$$('.blockList').each(function(block){
				block.getChildren().each(function(listItem){
					listItem.setStyles({ 'border':'1px dashed #33cc66', 'cursor':'move' });
				});
			});
		} else {
			$$('.blockList').each(function(block){
				block.getChildren().each(function(listItem){
					listItem.setStyles({ 'border':'1px solid #ddd', 'cursor':'inherit' });
				});
			});
			this.sortables.detach();
			this.sortables = false;		
		}
	},
	behaviours: function(e){ // Button behaviours
		switch(e.id){
			case 'newPara':
				e.addEvent('click', function(){
					new block(this.blockList, 'para');
					if(this.sortables) this.makeSortable(1);
				}.bind(this));		
			break;
			case 'newH1':
				e.addEvent('click', function(){ 
					new block(this.blockList, 'h1');
					if(this.sortables) this.makeSortable(1);
				}.bind(this));		
			break;
			case 'newH2':
				e.addEvent('click', function(){ 
					new block(this.blockList, 'h2');
					if(this.sortables) this.makeSortable(1);
				}.bind(this));		
			break;
			case 'newH3':
				e.addEvent('click', function(){
					new block(this.blockList, 'h3');
					if(this.sortables) this.makeSortable(1);
				}.bind(this));		
			break;
			case 'newList':
				e.addEvent('click', function(){
					new block(this.blockList, 'list');
					if(this.sortables) this.makeSortable(1);
				}.bind(this));		
			break;
			case 'newTable':
				e.addEvent('click', function(){
					new block(this.blockList, 'table');
					if(this.sortables) this.makeSortable(1);
				}.bind(this));		
			break;
			case 'newImage': case 'newPDF': // Loads in images (OR PDFs) in the /images/news/ directory via ajax, displayed in site toolbar
				var self = this;
				ajaxUrl = false;
				e.addEvent('click', function(){
					if(this.id == 'newImage'){
						ajaxUrl = cmsPath+'/'+'images/ajax/selected';
						mediaType = 'imgs';
					} else if(this.id == 'newPDF'){
						ajaxUrl = cmsPath+'/'+'images/ajax/pdfs';
						mediaType = 'pdfs';
					}
					if(!ajaxUrl) return false;
					req = new Request.JSON({
						url: ajaxUrl,
						onSuccess: function(responseJSON){
							images = responseJSON;
							iG = new imageGallery(images, mediaType);
							if(iG.imageRow){
								iG.imageRow.getChildren().each(function(image){
									image.addEvent('mousedown', function(e){
										xPos = e.page.x;
										yPos = e.page.y;
										e = new Event(e).stop();
										if(this.retrieve('type') == 'IMG'){
											dragImg = this.clone().setStyle('opacity',0.7);
										} else if(this.retrieve('type') == 'PDF'){
											dragImg = new Element('img', {'src':styleImagePath+'pdf_icon.png', 'title':this.get('text'), 'alt':this.get('text'), 'class':'dropImg'}).setStyle('opacity',0.7);
										}
										dragImg.inject(this, 'before');
										if(this.retrieve('type') == 'PDF'){
											dragImg.setPosition({x: xPos-20, y: yPos-20});										
										}
										self.dragOptions.droppables = $$('.para, .list, .table table tbody td, .table table thead th, #thumbnail');
										makeDrag = dragImg.makeDraggable(self.dragOptions);
										makeDrag.start(e);
									});
								});
							}									
						}								
					});
					req.send();
				});		
			break;
			case 'newDiv':
				e.addEvent('click', function(){
					new block(this.blockList, 'div');
					if(this.sortables) this.makeSortable(1);
				}.bind(this));			
			break;
			case 'newBold':
				e.addEvent('click', function(){ this.stylise('bold'); }.bind(this));
			break;
			case 'newItalics':
				e.addEvent('click', function(){ this.stylise('italics'); }.bind(this));
			break;
			case 'newLink':
				e.addEvent('click', function(){ this.stylise('link'); }.bind(this));
			break;
			case 'newEmail':
				e.addEvent('click', function(){ this.stylise('email'); }.bind(this));
			break;
			case 'newUnderline':
				e.addEvent('click', function(){ this.stylise('underline'); }.bind(this));
			break;
			case 'destyle':
				e.addEvent('click', function(){ this.stylise('destyle'); }.bind(this));
			break;
			case 'deselect':
				e.addEvent('click', function(){ this.stylise(false); }.bind(this));
			break;
			case 'selectAll':
				e.addEvent('click', function(){
					$$('.blockList').each(function(block){
						block.getChildren().each(function(el){
							el.addEvent('mouseenter', function(){
								el.setStyles({'background-color':'#ffffcc', 'cursor':'pointer' });
							});
							el.addEvent('mouseleave', function(){
								el.setStyles({'background-color':'#fff', 'cursor':'inherit'});
							});
							el.addEvent('click', function(){
								$$('.blockList').each(function(block){
									block.getChildren().each(function(e){
										e.removeEvents('mouseenter');
										e.removeEvents('mouseleave');
										e.removeEvents('click');
										el.setStyles({'background-color':'#fff', 'cursor':'inherit'  });
									});
								});
								el.getElements('span').each(function(e){
									e.addClass('selected');
									e.setStyle('background-color','yellow');
								});
							}.bind(this));
						}.bind(this));
					}.bind(this));
				}.bind(this));
			break;
			case 'textSize':
				e.addEvent('change', function(){
					$$('.selected').each(function(w){
						w.setStyle('font-size',e.value+'px');
						w.removeClass('selected');
						w.setStyle('background-color','transparent');
					});
				});
			break;
			case '1col':
				e.addEvent('click', function(){ this.setLayout(1); }.bind(this));
			break;
			case '2col':
				e.addEvent('click', function(){ this.setLayout(2); }.bind(this));
			break;
			case '3col':
				e.addEvent('click', function(){ this.setLayout(3); }.bind(this));
			break;
		}
	},
	stylise: function(styleType){  // Change spans with selected class (the yellow ones!)
		linkArray = [];
		$$('span.selected').each(function(e){
			switch(styleType){
				case 'bold':
					e.setStyle('font-weight','bold');
					e.addClass('styled');
				break;
				case 'italics':
					e.setStyle('font-style','oblique');
					e.addClass('styled');
				break;
				case 'underline':
					e.setStyle('text-decoration','underline');
					e.addClass('styled');				
				break;
				case 'destyle':
					e.setStyles({
						'font-weight':'normal',
						'font-style':'normal',
						'text-decoration':'none'
					});
					e.removeClass('styled');
					if(e.hasClass('fakeLink') || e.hasClass('fakeEmail')){
						text = iT ? e.innerText : e.textContent;
						words = text.split(' ');
						spans = []
						words.each(function(s){
							span = new Element('span');
							span.set('text',s);
							spans.push(span);
						});
						spans.each(function(e){
							e.addEvent('click', function(){	
								if(this.hasClass('selected')){
									this.setStyle('background-color','transparent');
								} else {
									this.setStyle('background-color','yellow');	
								}
								this.toggleClass('selected');
							});					
						});
						for(i=0;i<spans.length;i++){
							if(i){
								spans[i].inject(spans[i-1], 'after');
							} else {
								spans[0].inject(e, 'after');
							}
						}
						for(i=0;i<spans.length-1;i++){
							txtNode = document.createTextNode(' '); // Can't just insert space in IE7
							spans[i].parentNode.insertBefore(txtNode, spans[i].nextSibling);
						}
						e.destroy();
					}
				break;
				case 'link':
					e.addClass('link');
					linkArray.push(e);
				break;
				case 'email':
					e.addClass('email');
					linkArray.push(e);
				break;
			}
			e.removeClass('selected');
			e.setStyle('background-color','transparent');
		}.bind(this));
		if(linkArray[0]){
			contiguous = [];
			inc = 0;
			t = 1;
			if(linkArray[0].hasClass('email')){
				linkType = 'email';
			} else if(linkArray[0].hasClass('link')){
				linkType = 'link';
			}
			while(t){ // This bit sorts out whether or not words are next to each other an can be contained within the same link element
				if(!inc){
					contiguous.push(linkArray[inc]);
				} else {
					if(linkArray[inc] != null){
						if(linkArray[inc-1] == linkArray[inc].getPrevious()){
							contiguous.push(linkArray[inc]);
						} else {
							t = 0;
						}
					} else {
						t = 0;
					}
				}
				inc++;
			}
			contiguousText = [];
			contiguous.each(function(e){ iT ? contiguousText.push(e.innerText) : contiguousText.push(e.textContent); });
			linkText = contiguousText.join(' ');
			toolCont = new Element('div', { 'id':'overlayTool' });
			toolCont.setStyle('margin-top','100px');
			if(linkType == 'link'){
				this.linkOptions(linkText, false, contiguous).each(function(e){ toolCont.appendChild(e); });
			} else if(linkType == 'email'){
				this.emailOptions(linkText, false, contiguous).each(function(e){ toolCont.appendChild(e); });
			}
			$('overlayWrap').appendChild(toolCont);			
		}
	},
	linkOptions: function(linkText, link, oldSpans){ // Buttons and behaviours for new link panel
		if(!link) link = '';
		updateBtn = new Element('input', { 'type':'button', 'value':'Update and close', 'class':'button' });
		closeBtn = new Element('input', { 'type':'button', 'value':'Just close', 'class':'button' });
		httpSpan = new Element('span', { 'style':'margin-right:5px' });
		httpSpan.set('text','http://');
		hrefInput = new Element('input', { 'type':'text', 'value':link, 'class':'singleLine' });
		closeBtn.addEvent('click', function(){ this.getParent().destroy(); });
		updateBtn.addEvent('click', function(){
			link = hrefInput.value;
			n = links.length;
			links[n] = link;
			fakeLink = new Element('span', { 'class':'fakeLink', 'id':'link-'+n});
			fakeLink.addEvent('click', function(){	
				if(this.hasClass('selected')){
					this.setStyle('background-color','transparent');
				} else {
					this.setStyle('background-color','yellow');	
				}
				this.toggleClass('selected');
			});
			fakeLink.addEvent('mouseenter', function(){
				n = this.id.match(/[0-9]+/);
				linkAlert(links[n], $('alertDiv'));
			});
			fakeLink.addEvent('mouseleave', function(){
				$$('.linkAlert').invoke('destroy');
			});
			fakeLink.set('text', linkText);
			for(i=0;i<oldSpans.length;i++){
				if(i){
					oldSpans[i].destroy();
				} else {
					fakeLink.replaces(oldSpans[0]);
				}
			}
			updateBtn.getParent().destroy();
		}.bind(this));
		return [updateBtn, closeBtn, httpSpan, hrefInput];
	},
	emailOptions: function(linkText, link, oldSpans){
		if(!link) link = '';
		updateBtn = new Element('input', { 'type':'button', 'value':'Update and close', 'class':'button' });
		closeBtn = new Element('input', { 'type':'button', 'value':'Just close', 'class':'button' });
		mailtoSpan = new Element('span', { 'style':'margin-right:5px' });
		mailtoSpan.set('text','mailto:');
		mailtoInput = new Element('input', { 'type':'text', 'value':link, 'class':'singleLine' });
		closeBtn.addEvent('click', function(){ this.getParent().destroy() });
		updateBtn.addEvent('click', function(){
			link = mailtoInput.value;
			n = links.length;
			links[n] = link;
			fakeEmail = new Element('span', { 'class':'fakeEmail', 'id':'link-'+n});
			fakeEmail.addEvent('click', function(){	
				if(this.hasClass('selected')){
					this.setStyle('background-color','transparent');
				} else {
					this.setStyle('background-color','yellow');	
				}
				this.toggleClass('selected');
			});
			fakeEmail.addEvent('mouseenter', function(){
				n = this.id.match(/[0-9]+/);
				linkAlert(links[n], $('alertDiv'));
			});
			fakeEmail.addEvent('mouseleave', function(){
				$$('.linkAlert').invoke('destroy');
			});
			fakeEmail.set('text',linkText);
			for(i=0;i<oldSpans.length;i++){
				if(i){
					oldSpans[i].destroy();
				} else {
					fakeEmail.replaces(oldSpans[0]);
				}
			}
			updateBtn.getParent().destroy();
		}.bind(this));
		return [updateBtn, closeBtn, mailtoSpan, mailtoInput];	
	},
	assemble: function(){ // Initiated on page load - adds the block canvas and button toolbar to adminwrap
		this.container.appendChild(this.toolbar);
		this.container.appendChild(this.imageGallery);
 		this.container.appendChild(this.canvas);
	},
	saveFormat: function(block){ // Converts all span elements into parameter & content arrays ready for saving
		a = []; // array of elements
		block.getChildren().each(function(e){
			p = []; // element parameters
			if(e.tagName == 'SPAN'){
				if(e.hasClass('fakeLink')){
					p.push('a');
					d = e.id.split('-');
					p.push(links[d[1]]);
					p.push('l');
				} else if(e.hasClass('fakeEmail')){
					p.push('a');
					d = e.id.split('-');
					p.push(links[d[1]]);
					p.push('e');
				} else {
					p.push('t');
				}
				f = iT ? e.innerText : e.textContent;
				p.push(encodeURIComponent(f.replace(/"/g,'&quot;').replace(/\\/g,'&#92;')));
				styles = [];
				if(e.hasClass('styled')){
					if(e.getStyle('font-weight') == 'bold') styles.push('b');
					if(e.getStyle('font-style') == 'oblique') styles.push('i');
					if(e.getStyle('text-decoration') == 'underline') styles.push('u');
				}
				if(styles[0] != null){
					p.push(styles);
				} else {
					p.push(0);
				}
				textSizePx = e.getStyle('font-size').replace(/[a-z]+/, '');
				if(textSizePx == '100%')
					textSizePx = 13;
				p.push(textSizePx);
			} else if(e.tagName == 'IMG'){
				p.push('i');
				imageTitle = '';
				if(e.getProperty('title')) imageTitle = e.getProperty('title');
				if(imageTitle.match(/\.pdf$/)){
					p.push(e.getProperty('title'));
				} else {
					p.push(e.src);
				}
				if(e.hasClass('right')) p.push('r');
				if(e.hasClass('left')) p.push('l');
				if(e.hasClass('tableImg')) p.push('t');
				(e.hasClass('bordered')) ? p.push('b') : p.push('n');
				(e.retrieve('link')) ? p.push(e.retrieve('link')) : p.push(0);
				p.push(e.getWidth()-2);
			} else if(e.tagName == 'DIV'){ // inline images are contained within a div, but to avoid confusion only save data for the image
				if(e.hasClass('inlineImageRow')){
					if((e.getFirst().tagName == 'IMG') && (e.getFirst().hasClass('middle'))){
						p.push('i');
						if(e.getFirst().getProperty('title').match(/\.pdf$/)){
							p.push(e.getFirst().getProperty('title'));
						} else {
							p.push(e.getFirst().src);
						}
						p.push('m');
						(e.getFirst().hasClass('bordered')) ? p.push('b') : p.push('n');
						(e.getFirst().retrieve('link')) ? p.push(e.getFirst().retrieve('link')) : p.push(0);
						p.push(e.getFirst().getStyle('width').toInt()-2);
					}
				}
			}
			a.push(p);
		});
		return a;
	},
	save: function(){
		params = [];
		this.extras.each(function(e){
			params.push(encodeURIComponent(e.value.replace(/"/g,'&quot;').replace(/\\/g,'&#92;')));
		});
		$$('.blockList').each(function(blockList){
			blocks = [];
			blockList.getChildren().each(function(e){
				thisBlock = [];
				blockType = false;
				blockOptions = ['para','list','table','h1','h2','h3','div'];
				blockOptions.each(function(opt){
					if(e.hasClass(opt)) blockType = opt;
				});
				if(blockType){
					switch(blockType){
						case 'para':
							thisBlock.push('p');
							textElements = this.saveFormat(e);
							thisBlock.push(textElements);					
						break;
						case 'table':
							if(e.getFirst().tagName == 'TABLE'){
								thisBlock.push('t');
								rows = [];
								e.getFirst().getChildren().each(function(e){ // thead or tbody
									t = e;
									e.getChildren().each(function(e){ // each row
										row = [];
										if(t.tagName == 'THEAD'){
											row.push('h');
										} else {
											row.push('b');
										}
										columns = [];
										e.getChildren().each(function(e){ // each cell
											textElements = this.saveFormat(e);
											if(textElements[0] != null){
												columns.push(textElements);
											} else {
												columns.push(0);
											}
										}.bind(this));
										row.push(columns);
										rows.push(row);
									}.bind(this));
								}.bind(this));
								thisBlock.push(rows);
								if(e.getFirst().hasClass('prevHidden')){
									thisBlock.push(1);
								} else {
									thisBlock.push(0);
								}
								if(e.getFirst().hasClass('centred')){
									thisBlock.push(1);
								} else {
									thisBlock.push(0);
								}						
							}					
						break;
						case 'list':
							thisBlock.push('l');
							elements = [];
							e.getChildren().each(function(e){
								list = e;
								el = [];
								if(e.tagName == 'UL'){
									el.push('ul');
									el.push(e.getStyle('list-style-type'));
									rows = [];
									e.getChildren().each(function(e){
										textElements = this.saveFormat(e);
										rows.push(textElements);
									}.bind(this));
									el.push(rows);
								} else if(e.tagName == 'IMG'){
									el.push('i');
									imageTitle = '';
									if(e.getProperty('title')) imageTitle = e.getProperty('title');
									if(imageTitle.match(/\.pdf$/)){
										el.push(e.getProperty('title'));
									} else {
										el.push(e.src);
									}
									if(e.hasClass('right')) el.push('r');
									if(e.hasClass('left')) el.push('l');
									(e.hasClass('bordered')) ? el.push('b') : el.push('n');
									(e.retrieve('link')) ? el.push(e.retrieve('link')) : el.push(0);
									el.push(e.getStyle('width').toInt());
								} else if(e.tagName == 'DIV'){ // inline images are contained within a div, but to avoid confusion only save data for the image
									if(e.hasClass('inlineImageRow')){
										if((e.getFirst().tagName == 'IMG') && (e.getFirst().hasClass('middle'))){
											el.push('i');
											el.push(e.getFirst().src);
											el.push('m');
											(e.getFirst().hasClass('bordered')) ? el.push('b') : el.push('n');
											(e.getFirst().retrieve('link')) ? el.push(e.getFirst().retrieve('link')) : el.push(0);
											el.push(e.getFirst().getStyle('width').toInt());														alert(el);
										}
									}
								}
								elements.push(el);
							}.bind(this));
							thisBlock.push(elements);
							thisBlock.push(list.getStyle('width').toInt());		
						break;
						case 'h1': case 'h2': case 'h3':
							thisBlock.push(blockType);
							thisBlock.push(encodeURIComponent(iT ? e.getFirst().innerText : e.getFirst().textContent).replace(/"/g,'&quot;').replace(/\\/g,'&#92;'));					
						break;
						case 'div':
							if(e.getElement('ul')){
								thisBlock.push('d');
								thisBlock.push(e.getElement('.att1').get('text'));
								thisBlock.push(e.getElement('.att2').get('text'));
							} else {
								return;
							}					
						break;
					}
					if(thisBlock[0] == 't'){
						thisBlock.push(e.getFirst().getStyle('height').toInt());
					} else {
						thisBlock.push(e.getStyle('height').toInt());
					}
					if(thisBlock[0] != null) blocks.push(thisBlock);
				}
			}.bind(this));
			params.push(blocks);
		}.bind(this));
		JSONparams = JSON.encode(params);
		req = new Request({
			url:cmsPath+'/'+$('editorType').value+'/ajax/update',
			onSuccess: function(responseText){
				if($('alertDiv') != null){
					$('alertDiv').setStyle('opacity', 0);
					if(responseText*1 > 0){
						$('alertDiv').set('html','<span class="success">Saved!</span>');
						$('editorID').value = responseText;
					} else if(responseText.trim() == 'success'){
						$('alertDiv').set('html','<span class="success">Saved!</span>');
					} else if(responseText.trim() == 'failed'){
						$('alertDiv').set('html','<span class="warn">Failed!</span>');
					}
					fx = new Fx.Tween('alertDiv', { duration:300 });
					fx.start('opacity',0,1)
						.chain(function(){
							fx.start.delay(2000, fx, ['opacity',1,0]);
						})
						.chain(function(){
							$('alertDiv').empty();
							$('alertDiv').setStyle('opacity',1);								
						});
				}
			}
		});
		req.send('ajax='+JSONparams);
	}
});

var block = new Class({
	initialize: function(blockList, type){
		this.type = type;
		this.blockList = blockList;
		this.block = new Element('li', { 'class':'bordered' });
		if(this.type == 'list'){
			this.block.addClass('list');
			this.block.set('text','Double click to create list');
			this.block.addEvent('dblclick', function(){ // Double click to edit something
				toolCont = new Element('div', { 'id':'overlayTool' });
				this.listOptions().each(function(e){ toolCont.appendChild(e); });
				$('overlayWrap').appendChild(toolCont);
			}.bind(this));
		} else if(this.type == 'table'){
			this.block.addClass('table');
			this.block.set('text', 'Double click to create table');
			this.block.addEvent('dblclick', function(){
				toolCont = new Element('div', { 'id':'overlayTool', 'style':'width:800px;' });
				this.tableOptions().each(function(e){ toolCont.appendChild(e); });
				$('overlayWrap').appendChild(toolCont);
			}.bind(this));
		} else if(this.type == 'div'){
			this.block.addClass('div');
			this.block.set('text', 'Double click to set div options');
			this.block.addEvent('dblclick', function(){
				toolCont = new Element('div', { 'id':'overlayTool', 'style':'width:800px;' });
				this.divOptions().each(function(e){ toolCont.appendChild(e); });
				$('overlayWrap').appendChild(toolCont);
			}.bind(this));
		} else { // If editable text block
			switch(this.type){
				case 'para':
					this.block.addClass('para');
					this.block.set('text','Double click to add text');
					this.spannerise(this.block);
				break;
				case 'h1':
					this.block.addClass('h1');
					h1 = new Element('h1');
					h1.set('text','Heading 1');
					this.block.appendChild(h1);
				break;
				case 'h2':
					this.block.addClass('h2');
					h2 = new Element('h2');
					h2.set('text','Heading 2');
					this.block.appendChild(h2);
				break;
				case 'h3':
					this.block.addClass('h3');
					h3 = new Element('h3');
					h3.set('text','Heading 3');
					this.block.appendChild(h3);
				break;
			}
			this.block.addEvent('dblclick', function(){
				toolCont = new Element('div', { id:'overlayTool' });
				this.textOptions().each(function(e){ toolCont.appendChild(e); });
				$('overlayWrap').appendChild(toolCont);
			}.bind(this));
		}
		blockList.appendChild(this.block);
	},
	overlayScroll: function(overlay){
		scroll = document.body.getScroll();		
	},
	textOptions: function(){ // Options for H1, H2, H3 and para blocks
		updateBtn = new Element('input', { 'type':'button', 'value':'Update and close', 'class':'button' });
		closeBtn = new Element('input', { 'type':'button', 'value':'Just close', 'class':'button' });
		deleteBtn = new Element('input', { 'type':'button', 'value':'Delete block', 'class':'button' });
		textarea = new Element('textarea', { 'id':'overlayToolTextarea' });
		warningSpan = new Element('span', { 'style':'font-size:12px'});
		warningSpan.set('html','<strong>*WARNING*</strong> Text size formatting is lost when text is updated!');
		if(this.type == 'para'){
			textarea.value = this.substituteStyle(this.block);
		} else {
			textarea.value = iT ? this.block.getChildren()[0].innerText : this.block.getChildren()[0].textContent;
		}
		closeBtn.addEvent('click', function(){ this.getParent().destroy(); });
		deleteBtn.addEvent('click', function(){ 
			deleteBtn.getParent().destroy();
			this.block.destroy();
		}.bind(this));
		updateBtn.addEvent('click', function(){
			if(this.type == 'para'){
				otherElements = this.block.getChildren('div, img');
				textClean = textarea.value.clean().replace(/\n|\t|\r/g, '');
				this.block.set('text',textClean);
				this.spannerise(this.block);
				otherElements.invoke('inject', this.block, 'top');
			} else {
				this.block.getFirst().set('text',textarea.value.replace(/\n|\t|\r/g, ''));			
			}
			updateBtn.getParent().destroy();
		}.bind(this));
		return [updateBtn, closeBtn, deleteBtn, warningSpan, textarea];
	},
	listOptions: function(){ // Lists
		updateBtn = new Element('input', { 'type':'button', 'value':'Update and close', 'class':'button' });
		closeBtn = new Element('input', { 'type':'button', 'value':'Just close', 'class':'button' });
		deleteBtn = new Element('input', { 'type':'button', 'value':'Delete block', 'class':'button' });
		rowBtn = new Element('input', { 'type':'button', 'value':'Add row', 'class':'button' });
		delRowBtn = new Element('input', { 'type':'button', 'value':'Remove last row', 'class':'button' });
		listStyleSelect = new Element('select');
		options = ['List style', 'circle', 'disc', 'square', 'decimal', 'none'];
		options.each(function(s, index){
			opt = (index) ? new Element('option') : new Element('option', { 'selected':'selected' });
			iT ? opt.innerText = s : opt.textContent = s;
			listStyleSelect.appendChild(opt);
		});
		closeBtn.addEvent('click', function(){ this.getParent().destroy(); });
		deleteBtn.addEvent('click', function(){ 
			deleteBtn.getParent().destroy();
			this.block.destroy();
		}.bind(this));
		values = false;
		editList = new Element('table', { 'class':'editList' });
		editList.appendChild(new Element('thead'));
		editList.appendChild(new Element('tbody'));
		oldList = false;
		oldListStyle = false;
		this.block.getChildren().each(function(e){
			if(e.tagName == 'UL'){
				oldList = e;
				values = [];
				e.getChildren().each(function(e){ 
					values.push(this.substituteStyle(e)); 
				}.bind(this));
				oldListStyle = e.getStyle('list-style-type');
			}
		}.bind(this));
		listStyleSelect.getElements('option').each(function(item, index){
			if(item.value == oldListStyle) item.selected = true;
		});
		n = (values) ? values.length : 3;
		for(i=0;i<n;i++){
			row = new Element('tr');
			typeList = new Element('ul');
			typeList.appendChild(new Element('li'));
			typeTd = new Element('td', { 'class':'typeTd' });
			typeTd.appendChild(typeList);
			contentTd = new Element('td', { 'class':'contentTd' });
			row.appendChild(typeTd);
			row.appendChild(contentTd);
			inp = new Element('textarea', { 'class':'cellEdit'});
			contentTd.appendChild(inp);
			inp.value = (values[i]) ? values[i] : '';
			editList.getFirst('tbody').appendChild(row);
		}
		rowBtn.addEvent('click', function(){
			row = new Element('tr');
			typeList = new Element('ul');
			typeList.appendChild(new Element('li'));
			currentType = editList.getElement('.typeTd li').get('html');
			if(currentType*1){
				currentType = (editList.getElements('tr').length)+1;
			}
			typeTd = new Element('td', { 'class':'typeTd' });
			typeTd.set('html', currentType);
			typeTd.appendChild(typeList);
			contentTd = new Element('td', { 'class':'contentTd' });
			row.appendChild(typeTd);
			row.appendChild(contentTd);
			inp = new Element('textarea', { 'class':'cellEdit'});
			contentTd.appendChild(inp);
			inp.value = (values[i]) ? values[i] : '';
			editList.getFirst('tbody').appendChild(row);	
		});
		delRowBtn.addEvent('click', function(){ if(editList.getElements('tr').length > 1 ) editList.getElements('tr').getLast().destroy();});
		listStyleSelect.addEvent('change', function(){
			listValue = listStyleSelect.options[listStyleSelect.selectedIndex].value;
			if(listValue != 'List style'){
				if(listValue == 'decimal'){
					editList.getElements('.typeTd li').each(function(item, index){ item.set('text', index+1); });
				} else if(listValue == 'disc'){
					editList.getElements('.typeTd li').invoke('set', 'html', '<img src="'+styleImagePath+'disc.png" alt="" class="bulletStyle">');
				} else if(listValue == 'circle'){
					editList.getElements('.typeTd li').invoke('set', 'html', '<img src="'+styleImagePath+'circle.png" alt="" class="bulletStyle">');
				} else if(listValue == 'square'){
					editList.getElements('.typeTd li').invoke('set', 'html', '<img src="'+styleImagePath+'sq.gif" alt="" class="bulletStyle">');
				} else if(listValue == 'none'){
					editList.getElements('.typeTd li').invoke('set', 'text', '');
				}
			}
		}.bind(this));
		listStyleSelect.fireEvent('change');
		updateBtn.addEvent('click', function(){
			saveList = new Element('ul', { 'class':'prevList' });
			saveList.setStyle('list-style-type', listStyleSelect.options[listStyleSelect.selectedIndex].value);
			editList.getElements('tr .contentTd textarea').each(function(e){
				if(e.value){
					li = new Element('li');
					li.set('text',e.value);
					this.spannerise(li);
					saveList.appendChild(li);
				}
			}.bind(this));
			if(oldList){
				saveList.replaces(oldList, 'before');
				oldList.destroy();
			} else {
				this.block.empty();
				this.block.appendChild(saveList);			
			}
			updateBtn.getParent().destroy();
		}.bind(this));
		return [updateBtn, closeBtn, deleteBtn, rowBtn, delRowBtn, listStyleSelect, editList];
	},
	tableOptions: function(){ // Tables
		updateBtn = new Element('input', { 'type':'button', 'value':'Update and close', 'class':'button' });
		closeBtn = new Element('input', { 'type':'button', 'value':'Just close', 'class':'button' });
		deleteBtn = new Element('input', { 'type':'button', 'value':'Delete block', 'class':'button' });
		rowBtn = new Element('input', { 'type':'button', 'value':'+1 row', 'class':'button' });
		colBtn = new Element('input', { 'type':'button', 'value':'+1 column', 'class':'button' });
		rerowBtn = new Element('input', { 'type':'button', 'value':'-1 row', 'class':'button' });
		recolBtn = new Element('input', { 'type':'button', 'value':'-1 column', 'class':'button' });
		closeBtn.addEvent('click', function(){ closeBtn.getParent().destroy();}.bind(this));
		cenCheck = new Element('input', { 'type':'checkbox', 'id':'cenCheck'});
		visCheck = new Element('input', { 'type':'checkbox', 'id':'visCheck'});
		visSpan = new Element('label', { 'for':'visCheck', 'class':'small'});
		cenSpan = new Element('label', { 'for':'cenCheck', 'class':'small'});
		visSpan.set('text',' Invisible: ');
		cenSpan.set('text',' Centred: ');
		deleteBtn.addEvent('click', function(){ 
			deleteBtn.getParent().destroy();
			this.block.destroy();
		}.bind(this));
		rows = [];
		editTable = new Element('table', { 'id':'editTable', 'class':'editTable uncentred visible' });
		editTableHead = new Element('thead');
		editTableBody = new Element('tbody');
		centred = false;
		hidden = false;
		cenCheck.addEvent('change', function(){
			if(this.checked){
				$('editTable').addClass('centred');
				$('editTable').removeClass('uncentred');
			} else {
				$('editTable').removeClass('centred');
				$('editTable').addClass('uncentred');
			}
		});
		visCheck.addEvent('change', function(){
			if(this.checked){
				$('editTable').addClass('hidden');
				$('editTable').removeClass('visible');
			} else {
				$('editTable').removeClass('hidden');
				$('editTable').addClass('visible');
			}		
		});
		if(this.block.getChildren()[0]){
			thead = this.block.getChildren()[0].getChildren()[0];
			tbody = this.block.getChildren()[0].getChildren()[1];
			if(this.block.getChildren()[0].hasClass('prevHidden')){
				hidden = true;
				editTable.addClass('hidden');
				editTable.removeClass('visible');
				visCheck.checked = true;
			}
			if(this.block.getChildren()[0].hasClass('centred')){
				centred = true;
				editTable.addClass('centred');
				editTable.removeClass('uncentred');
				cenCheck.checked = true;
			}
		} else {
			thead = false;
			tbody = false;
		}
		if(thead){
			thead.getElement('tr').addClass('headRow');
			rows.push(thead.getFirst());
		} else {
			rows.push(new Element('tr', { 'class':'headRow' }));
		} 
		if(tbody){
			tbody.getChildren().each(function(e){ rows.push(e); });
		} else {
			for(i=0;i<2;i++) rows.push(new Element('tr'));
		} 
		rows.each(function(e, index){
			colType = (e.hasClass('headRow')) ? 'th' : 'td';
			tr = new Element('tr');
			if(e.getChildren()[0]){
				cols = e.getChildren();
			} else {
				cols = [];
				for(i=0;i<2;i++) cols.push(new Element('td'));
			}
			cols.each(function(e){
				miniImgs = [];
				e.getElements('img').each(function(img){
					w = img.getStyle('width');
					src = img.src;
					miniImg = new Element('img', { 'style':'height:10px;width:10px;', 'src':img.src, 'alt':w, 'class':'miniImg' });
					miniImgs.push(miniImg);
				});
				text = this.substituteStyle(e);
				inp = new Element('textarea', { 'class':'cellEdit' });
				inp.value = (text) ? text : '';
				td = new Element(colType);
				miniImgs.each(function(e){
					td.appendChild(e);
				});
				td.appendChild(inp);
				tr.appendChild(td);
			}.bind(this));
			if(colType == 'td'){
				editTableBody.appendChild(tr);
			} else {
				editTableHead.appendChild(tr);
			}
		}.bind(this));
		editTable.appendChild(editTableHead);
		editTable.appendChild(editTableBody);
		updateBtn.addEvent('click', function(){
			this.block.empty();
			saveTable = editTable.clone(true, false);
			saveTable.removeClass('editTable');
			saveTable.addClass('prevTable');
			if(saveTable.hasClass('hidden')){
				saveTable.addClass('prevHidden');
				saveTable.removeClass('hidden');
			} else {
				saveTable.addClass('prevVisible');
				saveTable.removeClass('visible');			
			}
			saveTable.getChildren().each(function(e,index){ //tbody and thead
				a = index;
				e.getChildren().each(function(e,index){ //rows
					if(saveTable.hasClass('prevVisible')){
						if(a){
							rowClass = (index%2) ? 'oddRow' : 'evenRow';
							e.addClass(rowClass);
						}
					}
					b = index;
					e.getChildren().each(function(e,index){ //cells
						c = index;
						e.set('text', (editTable.getChildren()[a].getChildren()[b].getChildren()[c].getFirst('textarea').value).replace(/\n|\t|\r/g, ''));
						editTable.getChildren()[a].getChildren()[b].getChildren()[c].getElements('img').each(function(mini){
							oldWidth = mini.alt;
							restoredImg = new Element('img', { 'src':mini.src, 'style':'width:'+oldWidth+';height:auto;', 'class':'tableImg'});
							restoredImg.addEvent('click', function(){
								toolCont = new Element('div', { 'id':'overlayTool', 'style':'height:400px;' });
								sidebar = new Element('div', { 'id':'imageResizeTools' });
								prevImg = this.clone();
								prevImg.setProperties({
								    'class': '',
								    'title': '',
								    'id': 'subjectImg'
								});
								prevImg.setStyles({
									'float':'left',
									'empty':'left'
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
							restoredImg.inject(e, 'top');
						})
						this.spannerise(e);
					}.bind(this));
				}.bind(this));
			}.bind(this));
			this.block.appendChild(saveTable);
			updateBtn.getParent().destroy();
			this.blockList.setStyle('display', 'block');
		}.bind(this));
		colBtn.addEvent('click', function(){
			newHcol = new Element('th', { 'class':'headRow' });
			newHcol.appendChild(new Element('textarea', { 'class':'cellEdit' }));
			editTableHead.getFirst().appendChild(newHcol);
			editTableBody.getChildren().each(function(e){
				newBcol = new Element('td');
				newBcol.appendChild(new Element('textarea', { 'class':'cellEdit' }));
				e.appendChild(newBcol); 
			});
		});
		rowBtn.addEvent('click', function(){
			newRow = editTableBody.getFirst().clone(true);
			newRow.getElements('img').each(function(item){ item.destroy(); });
			newRow.getElements('textarea').each(function(e){ e.value = ''; });
			editTableBody.appendChild(newRow);
		});
		rerowBtn.addEvent('click', function(){
			if(editTableBody.lastChild != editTableBody.getFirst()
			){
				editTableBody.lastChild.destroy();
			}
		});
		recolBtn.addEvent('click', function(){
			if(editTableHead.getChildren()[0].lastChild != editTableHead.getChildren()[0].getFirst()){
				editTableHead.getChildren()[0].lastChild.destroy();
				editTableBody.getChildren().each(function(e){
					e.lastChild.destroy();
				});
			}
		});
		return [updateBtn, closeBtn, deleteBtn, rowBtn, colBtn, rerowBtn, recolBtn, visSpan, visCheck, cenSpan, cenCheck, editTable];
	},
	divOptions: function(container){
		updateBtn = new Element('input', { 'type':'button', 'value':'Update and close', 'class':'button' });
		closeBtn = new Element('input', { 'type':'button', 'value':'Just close', 'class':'button' });
		deleteBtn = new Element('input', { 'type':'button', 'value':'Delete block', 'class':'button' });
		v1 = '';
		v2 = '';
		if(this.block.getElement('.att1')){
			v1 = this.block.getElement('.att1').get('text');
		}
		if(this.block.getElement('.att2')){
			v2 = this.block.getElement('.att2').get('text');
		}
		attributeList = new Element('ul', {'class':'attList' });
		attributeLi1 = new Element('li');
		attributeLi2 = new Element('li');
		idInput = new Element('input', {'type':'text', 'class':'singleLine', 'value':v1});
		classInput = new Element('input', {'type':'text', 'class':'singleLine', 'value':v2});
		attributeLabel1 = new Element('label');
		attributeLabel2 = new Element('label');
		attributeLabel1.set('text', 'Id: ');
		attributeLabel2.set('text', 'Classes (,): ');
		attributeLi1.appendChild(attributeLabel1);
		attributeLi1.appendChild(idInput);
		attributeLi2.appendChild(attributeLabel2);
		attributeLi2.appendChild(classInput);
		attributeList.appendChild(attributeLi1);
		attributeList.appendChild(attributeLi2);
		closeBtn.addEvent('click', function(){ this.getParent().destroy(); });
		deleteBtn.addEvent('click', function(){ 
			deleteBtn.getParent().destroy();
			this.block.destroy();
		}.bind(this));
		updateBtn.addEvent('click', function(){
			this.block.empty();
			attributeList.getChildren().each(function(item, index){
				inp = item.getFirst('input');
				v = inp.get('value');
				inp.destroy();
				inpSpan = new Element('span', { 'class':'att'+(index+1) });
				inpSpan.set('text',v);
				item.appendChild(inpSpan);
			});
			this.block.appendChild(attributeList);
			updateBtn.getParent().destroy();
		}.bind(this));
		return [updateBtn, closeBtn, deleteBtn, attributeList];	
	},
	spannerise: function(container){ // Convert saved plaintext into a series of selectable inline spans
		words = [];
		for(i=0;i<container.childNodes.length;i++) {
			if(container.childNodes[i].nodeType == '3'){ // 3 represents a text node
				node = container.childNodes[i];
				words = node.nodeValue.split(' '); 
				container.removeChild(node);
			}
		}
		words.each(function(s){ // Convert all words into span elements
			if(s){
				span = new Element('span');
				if(m = s.match(/\<\|[0-9]+\|[^\>]+\>/)){
					p = m.toString();
					o = p.match(/<\|[0-9]+\|/gi).toString();
					n = o.substring(2,(o.length-1));
					span.setProperty('id', 'link-'+n);
					q = p.replace(/\<\|[0-9]+\|+/gi, '').toString();
					s = q.substring(0,q.length-1).replace(/_/g, ' ');
					span.addEvent('mouseenter', function(){
						n = this.id.match(/[0-9]+/);
						linkAlert(links[n], $('alertDiv'));
					});
					span.addEvent('mouseleave', function(){
						$$('.linkAlert').invoke('destroy');
					});
					if(links[n].match(/\@/g)){
						span.addClass('fakeEmail');						
					} else {
						span.addClass('fakeLink');
					}
				}
				if(m = s.match(/\`[^`]+\`/gi)){
					span.addClass('styled');
					span.setStyle('font-style','oblique');
					s = m.toString().substring(1,(m.toString().length-1));
				}
				if(m = s.match(/\*[^*]+\*/gi)){
					span.addClass('styled');
					span.setStyle('font-weight','bold');
					s = m.toString().substring(1,(m.toString().length-1));			
				}
				if(m = s.match(/\_[^_]+\_/gi)){
					span.addClass('styled');
					span.setStyle('text-decoration', 'underline');
					s = m.toString().substring(1,(m.toString().length-1));			
				}
				span.addEvent('click', function(){	
					if(this.hasClass('selected')){
						this.setStyle('background-color','transparent');
					} else {
						this.setStyle('background-color','yellow');	
					}
					this.toggleClass('selected');
				});
				iT ? span.innerText = s : span.textContent = s;
				container.appendChild(span);
				space = document.createTextNode(' '); // Can't just insert space in IE7
				container.appendChild(space);
			}
		}.bind(this));
	},
	substituteStyle: function(container){ // For links and text style, convert into unsubtle pseudo syntax when made into editable plaintext
		words = [];
		container.getChildren().each(function(e){
			if(e.tagName == 'SPAN'){
				text = (iT) ? e.innerText : e.textContent;
				if(e.hasClass('styled')){
					if(e.getStyle('font-weight') == 'bold'){
						text = '*'+text+'*';
					}
					if(e.getStyle('font-style') == 'oblique'){
						text = '`'+text+'`';
					}
					if(e.getStyle('text-decoration') == 'underline'){
						text = '_'+text+'_';
					}
				}
				if(e.hasClass('fakeLink') || e.hasClass('fakeEmail')){
					d = e.id.split('-');
					text = '<|'+d[1]+'|'+text.replace(/\s/g, '_')+'>';
				}
				words.push(text);
			}
		}.bind(this));
		return words.join(' ');
	}
});

var imageGallery = new Class({
	initialize: function(images,mediaType){
		fx = new Fx.Morph('imageGallery', { 'duration':100 });
		if($('imageGallery').getStyle('opacity') == '1' && $('imageGallery').hasClass(mediaType)){
			fx.start({
				'height':[150,0],
				'opacity':[1,0]
			}).chain(function(){
				$('imageGallery').setProperty('class', '');
			});
			return false;
		} else if($('imageGallery').getStyle('opacity') == '0'){
			fx.start({
				'height':[0,150],
				'opacity':[0,1]
			});
			$('imageGallery').addClass(mediaType);
		}
		this.imgs = images;
		this.makeRow();
	},
	makeRow: function(){
		if(this.imgs != 'notset'){
			this.imageRow = new Element('div', { 'id':'imageRow' });
			this.imageRow.setStyle('opacity', '0');
			images.each(function(imageName){
				if(imageName.match(/\.pdf$/i)){
					img = new Element('span',{ 'alt':imageName, 'class':'dropImg dropPDF'});
					img.set('text', imageName);
					img.store('type', 'PDF');
				} else {
					img = new Element('img',{ 'src':imageName, 'alt':'', 'class':'dropImg'});
					img.store('type', 'IMG');
				}
				this.imageRow.appendChild(img);
			}.bind(this));
			$('imageGallery').empty();
			$('imageGallery').appendChild(this.imageRow);
			fx = new Fx.Tween(this.imageRow, { 'duration':100 });
			fx.start('opacity', '0', '1');
		} else {
			$('imageGallery').set('html', '<p>No images selectable, go the the <a href="'+cmsPath+'/images" title="" target="_blank">image palette</a> to select some</p>');		
		}
	}
});


var imageEditor = new Class({ // Image resizing tools
	initialize: function(oImg){
		this.oImg = oImg;
	},
	makeTools: function(oHeight, oWidth, subjectImg){
		updateBtn = new Element('input', { 'type':'button', 'value':'Update and close', 'class':'button' });
		closeBtn = new Element('input', { 'type':'button', 'value':'Just close', 'class':'button' });
		deleteBtn = new Element('input', { 'type':'button', 'value':'Delete Image', 'class':'button' });
		span = new Element('span', { 'style':'float:left;margin-right:10px;' });
		span.set('html','Resize:');
		sliderWrap = new Element('div', { 'id':'areaWrap'});
		trackLeft = new Element('div', { 'id':'track1-left'});
		sliderArea = new Element('div', { 'id':'sliderArea'});
		handle = new Element('div', { 'id':'sliderHandle'});
		sliderWrap.appendChild(trackLeft);
		sliderWrap.appendChild(sliderArea);
		sliderArea.appendChild(handle);
		updateBtn.setStyle('float','left');
		updateBtn.addEvent('click', function(){
			nWidth = $('subjectImg').getStyle('width');
			this.oImg.setStyle('width', nWidth);
			this.oImg.setStyle('height','auto');
			if($('subjectImg').hasClass('bordered')){
				if(!this.oImg.hasClass('bordered')){
					this.oImg.addClass('bordered');
				}
			} else {
				if(this.oImg.hasClass('bordered')){
					this.oImg.removeClass('bordered');
				}				
			}
			if($('linkInput').get('value')){
				this.oImg.store('link', $('linkInput').get('value'));
			} else {
				this.oImg.store('link', '');
			}
			updateBtn.getParent().destroy();
		}.bind(this));
		closeBtn.addEvent('click', function(){ this.getParent().destroy(); });
		deleteBtn.addEvent('click', function(){
			if(this.oImg.hasClass('middle')){
				this.oImg.getParent().destroy();
			} else {
				this.oImg.destroy();
			}
			deleteBtn.getParent().destroy();
		}.bind(this));
		closeBtn.setStyle('float','left');
		borderBoxLabel = new Element('label', { 'class':'small' });
		borderBoxLabel.set('text', 'Bordered:');
		borderBox = new Element('input', { 'type':'checkbox', 'id':'useBorder'});
		borderBox.addEvent('change', function(){
			if(this.checked){
				$('subjectImg').addClass('bordered');
			} else {
				$('subjectImg').removeClass('bordered');
			}
		});
		linkInputBox = new Element('div', {id:'linkInputBox'});
		linkInputLabel = new Element('label');
		linkInputLabel.set('text', 'http:// ');
		linkInputCheckLabel = new Element('label', { 'class':'small' });
		linkInputCheckLabel.set('text', 'Link:');
		linkInputCheck = new Element('input', { 'type':'checkbox', 'id':'imageLink'});
		linkInputCheck.addEvent('change', function(){
			if(this.checked){
				$('linkInputBox').setStyle('display', 'block');
			} else {
				$('linkInputBox').setStyle('display', 'none');
				$('linkInput').set('value', '');
			}
		});
		linkInput = new Element('input', {'class':'singleLine', 'type':'text', 'id':'linkInput'});
		linkInputBox.appendChild(linkInputLabel);
		linkInputBox.appendChild(linkInput);
		if(this.oImg.hasClass('bordered')){
			subjectImg.addClass('bordered');
			borderBox.checked = true;
		}
		if(this.oImg.retrieve('link')){
			linkInputBox.setStyle('display', 'block');
			linkInput.set('value', this.oImg.retrieve('link').replace(/^http:\/\//, ''));
			linkInputCheck.checked = 1;			
		}
		return [span, sliderWrap, updateBtn, closeBtn, deleteBtn, borderBoxLabel, borderBox, linkInputCheckLabel, linkInputCheck, linkInputBox];
	}
});