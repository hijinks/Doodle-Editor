// editorSetup.js - Sets up and initiates basic buttons and Editor itself

document.addEvent('domready', function(){
	canvas = new Editor();
	canvas.setup($('cont'));		
	canvas.extras.push($('editorID'));
	canvas.extras.push($('title'));
	canvas.extras.push($('dateVal'));
	canvas.extras.push($('pdf'));
	canvas.extras.push($('thumbnailSrc'));
	now = new Date();
	curr_date = now.getDate();
	curr_month = now.getMonth()+1;
	curr_year = now.getFullYear();
	$('dateVal').value = Math.floor(now.getTime()/1000);
	$('formatDate').set('text', curr_date+'/'+curr_month+'/'+curr_year);
	$('saveBtn').addEvent('click', function(){ 
		if($('title').get('value')){
			canvas.save();
		} else {
			alert('Please enter a title');
		}
	});
	if(!$('dateVal').value){
		$('dateVal').setProperty('value') = new Date().getTime();
	}
	window.addEvent('scroll', function(){
		docScrollTop = document.documentElement.scrollTop.toInt();
		if($('overlayTool') && ($('overlayTool').getHeight().toInt() < window.getSize().y) && ((window.getSize().y.toInt()+docScrollTop) <= document.body.getStyle('height').toInt())){
			$('overlayTool').setStyle('margin-top',(docScrollTop+50)+'px');
		}
	});
	window.addEvent('resize', function(){ $('overlayWrap').setStyle('min-height', $(document.body).getScrollSize().y+'px'); });
	$('overlayWrap').setStyle('min-height', $(document.body).getScrollSize().y+'px');
	dPicker = new datePicker($('overlayWrap'), {
    	trigger: $('editDate'),
    	timestampOutput: $('dateVal'),
    	formattedOutput: $('formatDate'),
    	timeFormat: '%x'
   	});
	if($('editorID').value != 'new'){
		getData($('editorID').value, $('editorCanvas'));
	} else {
		$('editorCanvas').setStyle('display', 'block');
		$('toolbar').setStyle('display', 'block');		
	}
	$('pdf').addEvent('change')
	$('pdfButton').addEvent('click', function(){
		if($('overlayTool')) return false;
		tools = new overlay();
		closeBtn = new Element('input', { 'type':'button', value:'Just close', 'class':'button' });
		pdfList = new Element('ul', {'id':'pdfList' });
		req = new Request.JSON({
			url: cmsPath+'/'+'images/ajax/pdfs',
			onSuccess: function(responseJSON){
				pdfs = responseJSON;
				pdfs.each(function(item){
					listItem = new Element('li', { 'class':'pdf'});
					listItem.set('text', item);
					if($('pdf').get('value') == item){
						listItem.addClass('selected');
					}
					listItem.addEvent('click', function(){
						$('pdf').setProperty('value', this.get('text').clean());
						$$('#pdfList .selected').invoke('removeClass', 'selected');
						this.addClass('selected');
						linkPdfBox(this.get('text').clean());
						tools.dispose();
					});
					pdfList.appendChild(listItem);
				});
				tools.container.appendChild(closeBtn);
				tools.container.appendChild(pdfList);
				closeBtn.addEvent('click', function(){ tools.dispose(); });
				tools.create();
			}
		});
		req.send();
	});
});
function linkPdfBox(pdf){
	$('editorCanvas').setStyle('display', 'none');
	$('toolbar').setStyle('display', 'none');
	if($('linkedPdfBox')) $('linkedPdfBox').destroy();
	linkedPdfBox = new Element('div', {'id':'linkedPdfBox'});
	closePdfBox = new Element('button', { 'class':'button' });
	closePdfBox.set('text', 'Unlink');
	closePdfBox.addEvent('click', function(){
		$('pdf').setProperty('value', '');
		$('editorCanvas').setStyle('display', 'block');
		$('toolbar').setStyle('display', 'block');
		$('linkedPdfBox').destroy();
	});
	linkedPdfBox.appendText('Linked to: '+pdf);
	linkedPdfBox.appendChild(closePdfBox);
	linkedPdfBox.inject($('toolbar'), 'after');	
}
function goToImages(){ if(confirm('Continue to images? Unsaved content will be lost.')) document.location.href = cmsPath+'/images'}
function goBack(){ document.location.href = cmsPath+'/'+$('editorType').value; }
function checkIfChanged(){
	if(!$('block1').getChildren()[0]){
		goBack();
	} else {
		if(confirm('Are you sure you want to exit?')) goBack();
	}
}
