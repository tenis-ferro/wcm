/**
 * EasyUI for jQuery 1.11.3
 * 
 * Copyright (c) 2009-2025 www.jeasyui.com. All rights reserved.
 *
 * Licensed under the freeware license: http://www.jeasyui.com/license_freeware.php
 * To use it on other terms please contact us: info@jeasyui.com
 *
 */
 /**
 * linkbutton - EasyUI for jQuery
 * 
 */
(function($){
	function setSize(target, param){
		var opts = $.data(target, 'linkbutton').options;
		if (param){
			$.extend(opts, param);
		}
		if (opts.width || opts.height || opts.fit){
			var btn = $(target);
			var parent = btn.parent();
			var isVisible = btn.is(':visible');
			if (!isVisible){
				var spacer = $('<div style="display:none"></div>').insertBefore(target);
				var style = {
					position: btn.css('position'),
					display: btn.css('display'),
					left: btn.css('left')
				};
				btn.appendTo('body');
				btn.css({
					position: 'absolute',
					display: 'inline-block',
					left: -20000
				});
			}
			btn._size(opts, parent);
			var left = btn.find('.l-btn-left');
			left.css('margin-top', 0);
			left.css('margin-top', Math.round((btn.height()-left.height())/2)+'px');
			if (!isVisible){
				btn.insertAfter(spacer);
				btn.css(style);
				spacer.remove();
			}
		}
	}
	
	function createButton(target) {
		var opts = $.data(target, 'linkbutton').options;
		var t = $(target).empty();
		
		t.addClass('l-btn').removeClass('l-btn-plain l-btn-selected l-btn-plain-selected l-btn-outline');
		t.removeClass('l-btn-small l-btn-medium l-btn-large').addClass('l-btn-'+opts.size);
		if (opts.plain){t.addClass('l-btn-plain')}
		if (opts.outline){t.addClass('l-btn-outline')}
		if (opts.selected){
			t.addClass(opts.plain ? 'l-btn-selected l-btn-plain-selected' : 'l-btn-selected');
		}
		t.attr('group', opts.group || '');
		t.attr('id', opts.id || '');
		
		var inner = $('<span class="l-btn-left"></span>').appendTo(t);
		if (opts.text){
			$('<span class="l-btn-text"></span>').html(opts.text).appendTo(inner);
		} else {
			$('<span class="l-btn-text l-btn-empty">&nbsp;</span>').appendTo(inner);
		}
		if (opts.iconCls){
			$('<span class="l-btn-icon">&nbsp;</span>').addClass(opts.iconCls).appendTo(inner);
			inner.addClass('l-btn-icon-'+opts.iconAlign);
		}
		
		t._unbind('.linkbutton')._bind('focus.linkbutton',function(){
			if (!opts.disabled){
				$(this).addClass('l-btn-focus');
			}
		})._bind('blur.linkbutton',function(){
			$(this).removeClass('l-btn-focus');
		})._bind('click.linkbutton',function(){
			if (!opts.disabled){
				if (opts.toggle){
					if (opts.selected){
						$(this).linkbutton('unselect');
					} else {
						$(this).linkbutton('select');
					}
				}
				opts.onClick.call(this);
			}
//			return false;
		});
		
		setSelected(target, opts.selected)
		setDisabled(target, opts.disabled);
	}
	
	function setSelected(target, selected){
		var opts = $.data(target, 'linkbutton').options;
		if (selected){
			if (opts.group){
				$('a.l-btn[group="'+opts.group+'"]').each(function(){
					var o = $(this).linkbutton('options');
					if (o.toggle){
						$(this).removeClass('l-btn-selected l-btn-plain-selected');
						o.selected = false;
					}
				});
			}
			$(target).addClass(opts.plain ? 'l-btn-selected l-btn-plain-selected' : 'l-btn-selected');
			opts.selected = true;
		} else {
			if (!opts.group){
				$(target).removeClass('l-btn-selected l-btn-plain-selected');
				opts.selected = false;
			}
		}
	}
	
	function setDisabled(target, disabled){
		var state = $.data(target, 'linkbutton');
		var opts = state.options;
		$(target).removeClass('l-btn-disabled l-btn-plain-disabled');
		if (disabled){
			opts.disabled = true;
			var href = $(target).attr('href');
			if (href){
				state.href = href;
				$(target).attr('href', 'javascript:;');
			}
			if (target.onclick){
				state.onclick = target.onclick;
				target.onclick = null;
			}
			opts.plain ? $(target).addClass('l-btn-disabled l-btn-plain-disabled') : $(target).addClass('l-btn-disabled');
		} else {
			opts.disabled = false;
			if (state.href) {
				$(target).attr('href', state.href);
			}
			if (state.onclick) {
				target.onclick = state.onclick;
			}
		}
		$(target)._propAttr('disabled', disabled);
	}
	
	$.fn.linkbutton = function(options, param){
		if (typeof options == 'string'){
			return $.fn.linkbutton.methods[options](this, param);
		}
		
		options = options || {};
		return this.each(function(){
			var state = $.data(this, 'linkbutton');
			if (state){
				$.extend(state.options, options);
			} else {
				$.data(this, 'linkbutton', {
					options: $.extend({}, $.fn.linkbutton.defaults, $.fn.linkbutton.parseOptions(this), options)
				});
				// $(this).removeAttr('disabled');
				$(this)._propAttr('disabled', false);
				$(this)._bind('_resize', function(e, force){
					if ($(this).hasClass('easyui-fluid') || force){
						setSize(this);
					}
					return false;
				});
			}
			
			createButton(this);
			setSize(this);
		});
	};
	
	$.fn.linkbutton.methods = {
		options: function(jq){
			return $.data(jq[0], 'linkbutton').options;
		},
		resize: function(jq, param){
			return jq.each(function(){
				setSize(this, param);
			});
		},
		enable: function(jq){
			return jq.each(function(){
				setDisabled(this, false);
			});
		},
		disable: function(jq){
			return jq.each(function(){
				setDisabled(this, true);
			});
		},
		select: function(jq){
			return jq.each(function(){
				setSelected(this, true);
			});
		},
		unselect: function(jq){
			return jq.each(function(){
				setSelected(this, false);
			});
		}
	};
	
	$.fn.linkbutton.parseOptions = function(target){
		var t = $(target);
		return $.extend({}, $.parser.parseOptions(target, 
			['id','iconCls','iconAlign','group','size','text',{plain:'boolean',toggle:'boolean',selected:'boolean',outline:'boolean'}]
		), {
			disabled: (t.attr('disabled') ? true : undefined),
			text: ($.trim(t.html()) || undefined),
			iconCls: (t.attr('icon') || t.attr('iconCls'))
		});
	};
	
	$.fn.linkbutton.defaults = {
		id: null,
		disabled: false,
		toggle: false,
		selected: false,
		outline: false,
		group: null,
		plain: false,
		text: '',
		iconCls: null,
		iconAlign: 'left',
		size: 'small',	// small,large
		onClick: function(){}
	};
	
})(jQuery);
