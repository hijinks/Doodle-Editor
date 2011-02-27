var styleImagePath = '/public_assets/imgs/';
var cmsPath = '';

document.addEvent('domready', function(){
	if($('mainWrap')){
		w = $('mainWrap').getStyle('width').toInt()+10;
		$('mainWrap').setStyles({
			'margin':'50px auto 0 auto',
			'width': w+'px',
			'display':'block',
			'visibility':'visible'
		});
	}
});