var $chk = function(obj){ return !!(obj || obj === 0); };

var datePicker = new Class({
	Implements: Options,
    options: {
    	trigger: false,
    	timestampOutput: false,
    	formattedOutput: false,
        timeFormat: '%B %d, %Y',
        dateObj: new Date(),
        dow : ['Mo','Tu','We','Th','Fr','Sa','Su']
    },
	initialize: function(container,options){
		this.container = container;
		this.setOptions(options);
        this.environmentCheck();
	},
	environmentCheck: function(){
		if(this.container){
			[this.options.formattedOutput,this.options.timestampOutput,this.options.trigger].each(function(item){
				if(item) if(!$chk(item)) item = false;
			});
			if(this.options.trigger){
				this.options.trigger.addEvent('click', function(){
					this.container.setStyle('visibility', 'visible');
					this.options.trigger.setStyle('visibility', 'hidden');
					this.assemble();
				}.bind(this));
			} else {
				this.assemble();
			}
		}
	},
	makeWrapper: function(){
		this.wrap = new Element('div', { 'class':'f_calendarWrap'});
		this.header = new Element('div', {'class':'f_calHead'});
		this.dateSpan = new Element('span');
		this.dateSpan.set('text', this.options.dateObj.format('%B'));
		this.years = new Element('select', { 'class':'f_select' });
		this.years.setStyle('margin-left', '5px');
		this.makeButtons();
		this.wrap.inject(this.container);
		this.dateSpan.inject(this.header);
		this.years.inject(this.header);
		this.header.inject(this.wrap);
	},
	makeTable: function(){
		this.getMonth();
		if(this.calendar) this.calendar.dispose();
		dayArray = [];
		for(i=0;i<this.days;i++) dayArray.push(i+1); 
		for(i=0;i<this.firstDay-1;i++) dayArray.unshift(false);
		weeks = [
			dayArray.slice(0,7),
			dayArray.slice(7,14),
			dayArray.slice(14,21),
			dayArray.slice(21,28),
			dayArray.slice(28,35),
			dayArray.slice(35,42)
		];
		this.calendar = new Element('table', { 'class':'f_calendar'});
		thead = new Element('thead');
		tr = new Element('tr');
		this.options.dow.each(function(s){
			th = new Element('th');
			if(s) th.set('text', s);
			th.inject(tr);			
		});
		tr.inject(thead);
		thead.inject(this.calendar);
		this.tbody = new Element('tbody');
		weeks.each(function(item){
			tr = new Element('tr');
			item.each(function(s){
				td = new Element('td');
				if(s){
					td.set('text', s);
					td.addClass('selectable');
					td.addEvent('click', function(){
						this.options.dateObj.set('date', s);
						if(this.options.timestampOutput) this.options.timestampOutput.value = Math.floor((this.options.dateObj.get('time'))/1000);
						if(this.options.formattedOutput) this.options.formattedOutput.set('text', this.options.dateObj.format(this.options.timeFormat));
						this.disassemble();
					}.bind(this));
				}
				td.inject(tr);
			}.bind(this));
			tr.inject(this.tbody);		
		}.bind(this));
		this.tbody.inject(this.calendar);
		this.calendar.inject(this.wrap);
		this.yearsSelect();
	},
	makeButtons:function(){
		inc = new Element('input', {'class':'f_calInc', 'type':'button', 'value':'+'});
		dec = new Element('input', {'class':'f_calDec','type':'button', 'value':'-'});
    		inc.addEvent('click', function(){ this.changeMonth(1); }.bind(this));
    		dec.addEvent('click', function(){ this.changeMonth(-1); }.bind(this));
		inc.inject(this.header);
		dec.inject(this.header);
	},
	getMonth: function(){
		firstOfMonth = this.options.dateObj.set('date', 1);
		this.firstDay = firstOfMonth.get('day');
		if(!this.firstDay) this.firstDay = 7;
		monthDays = [31,28,31,30,31,30,31,31,30,31,30,31];
		if(this.options.dateObj.isLeapYear()) monthDays[1] = 29;
		this.days = monthDays[this.options.dateObj.get('month')];
	},
	changeMonth: function(n){
		this.options.dateObj = (n>0) ? this.options.dateObj.increment('month', n) : this.options.dateObj.decrement('month', n*-1);
		this.dateSpan.set('text', this.options.dateObj.format('%B '));
		this.makeTable();
	},
	observeYears: function(){
		this.years.addEvent('change', function(){ 
			this.options.dateObj.set('year', this.years.value);
			this.makeTable();
		}.bind(this));
	},
	yearsSelect:function(){
		this.years.empty();
		d = new Date();
		for(i=1910;i<=d.get('year');i++){
			opt = new Element('option');
			if(i == this.options.dateObj.get('year')) opt.setProperty('selected', 'selected');
			opt.set('text', i);
			this.years.appendChild(opt);
		}
	},
	observeSurroundings: function(){
		document.addEvent('click', function(event){
			targetElement = event.target;
			inside = targetElement.getParents('.f_calendarWrap')[0];
			if(!$chk(inside)&&(targetElement != this.options.trigger)){
				this.disassemble();
			}
		}.bind(this));
	},
	assemble: function(){
		this.makeWrapper();
		this.makeTable();
		this.observeYears();
		this.observeSurroundings();
	},
	disassemble: function(){
		this.container.empty();
		this.container.setStyle('visibility', 'hidden');
		this.options.trigger.setStyle('visibility', 'visible');
		document.removeEvents('click');
	}
});