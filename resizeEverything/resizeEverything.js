(function(factory, undefined) {
	if (typeof define === 'function' && define.amd) {
		// AMD
		define(['jquery'], factory);
	} else if (typeof module === 'object' && typeof module.exports === 'object') {
		// CommonJS
		module.exports = factory(require('jquery'));
	} else {
		// Global jQuery
		factory(jQuery);
	}
}(function($, undefined) {
    
    if ($.fn.resizableSafe)
        return;

    $.fn.resizableSafe = function fnResizable(options) {
        var defaultOptions = {
            // selector for handle that starts dragging
            handleSelector: null,
            // resize the width
            resizeWidth: true,
            // resize the height
            resizeHeight: false,
            // the side that the width resizing is relative to
            resizeWidthFrom: 'right',
            // the side that the height resizing is relative to
            resizeHeightFrom: 'bottom',
            // hook into start drag operation (event passed)
            onDragStart: null,
            // hook into stop drag operation (event passed)
            onDragEnd: null,
            // hook into each drag operation (event passed)
            onDrag: null,
            // disable touch-action on $handle
            // prevents browser level actions like forward back gestures
            touchActionNone: true,
            // instance id
            instanceId: null,
    };
        if (typeof options == "object")
            defaultOptions = $.extend(defaultOptions, options);

        return this.each(function () {
            var opt = $.extend({}, defaultOptions);
            if (!opt.instanceId)
                opt.instanceId = "rsz_" + new Date().getTime();            

            var startPos, startTransition;

            // Current element to resize
            var $el = $(this);
            // Get both of left and right handles
            var $handle;
            var $handleLeft;
            // Shows current handler
            var whichHandle = 'r'
            // Appending handlers to resizable events
            $($el).append('<div class="stickR"></div>')
            $($el).append('<div class="stickL"></div>')

            if (options === 'destroy') {            
                opt = $el.data('resizable');
                if (!opt)
                    return;

                $handle = getHandle(opt.handleSelector, $el);
                $handle.off("mousedown." + opt.instanceId + " touchstart." + opt.instanceId);
                if (opt.touchActionNone)
                    $handle.css("touch-action", "");

                $handleLeft = getHandleLeft(opt.handleSelector, $el);
                $handleLeft.off("mousedown." + opt.instanceId + " touchstart." + opt.instanceId);
                if (opt.touchActionNone)
                    $handleLeft.css("touch-action", "");

                $handle = document.getElement


                $el.removeClass("resizable");
                return;
            }
          
            $el.data('resizable', opt);

            // get the drag handle

            $handle     = getHandle(opt.handleSelector, $el);
            $handleLeft = getHandleLeft(opt.handleSelector, $el)

            if (opt.touchActionNone)
                $handle.css("touch-action", "none");
            $handleLeft.css("touch-action", "none")

            $el.addClass("resizable");
            $handle    .on("mousedown." + opt.instanceId + " touchstart." + opt.instanceId, startDragging);
            $handleLeft.on("mousedown." + opt.instanceId + " left" + " touchstart." + opt.instanceId, startDragging);

            function noop(e) {
                e.stopPropagation();
                e.preventDefault();
            };

            //Do not ask, we just need this shit
            var OLDWIDTH
            var NEWWIDTH
            var OLDX
            var NEWX
            var DIFF_BTW_CURSOR_N_LEFT

            function startDragging(e) {
                // Prevent dragging a ghost image in HTML5 / Firefox and maybe others    
                if ( e.preventDefault ) {
                  e.preventDefault();
                }
                
                if (e.target.className === 'stickR') {
                    whichHandle = 'r'
                }
                else if (e.target.className === 'stickL') {
                    whichHandle = 'l'
                }

                startPos = getMousePos(e);
                startPos.width = parseInt($el.width(), 10);
                startPos.height = parseInt($el.height(), 10);

                OLDWIDTH = startPos.width
                OLDX = startPos.x
                DIFF_BTW_CURSOR_N_LEFT = OLDX - Number($($el).css('left').slice(0,-2))

                startTransition = $el.css("transition");
                $el.css("transition", "none");

                if (opt.onDragStart) {
                    if (opt.onDragStart(e, $el, opt) === false)
                        return;
                }
                
                $(document).on('mousemove.' + opt.instanceId, doDrag);
                $(document).on('mouseup.' + opt.instanceId, stopDragging);           
                if (window.Touch || navigator.maxTouchPoints) {
                    $(document).on('touchmove.' + opt.instanceId, doDrag);
                    $(document).on('touchend.' + opt.instanceId, stopDragging);
                }
                $(document).on('selectstart.' + opt.instanceId, noop); // disable selection
                $("iframe").css("pointer-events","none");
            }

            function doDrag(e) { 
                let pos = getMousePos(e)                 
                if (whichHandle === 'r') {
                    if (opt.resizeWidthFrom === 'left')
                        newWidth = startPos.width - pos.x + startPos.x;
                    else{
                        newWidth = startPos.width + pos.x - startPos.x;
                    }

                    if (opt.resizeHeightFrom === 'top')
                        newHeight = startPos.height - pos.y + startPos.y;
                    else
                        newHeight = startPos.height + pos.y - startPos.y;

                    if (!opt.onDrag || opt.onDrag(e, $el, newWidth, newHeight, opt) !== false) {
                        if (opt.resizeHeight)
                            $el.height(newHeight);                    

                        if (opt.resizeWidth)
                            $el.width(newWidth);                    
                    }   
                }
                else if (whichHandle === 'l') {
                    let differenceBetweenCursors = e.clientX - OLDX
                    NEWX = e.clientX                  

                    // разница больше 0, значит тянем вправо, уменьшая событие
                    if (differenceBetweenCursors > 0) {
                        NEWWIDTH = OLDWIDTH - (NEWX - OLDX)
                    }
                    //тянем влево, увеличивая событие
                    else if (differenceBetweenCursors < 0){
                        NEWWIDTH = OLDWIDTH + (OLDX - NEWX)
                    }

                    $($el).css('left', NEWX - DIFF_BTW_CURSOR_N_LEFT + 'px').css('width', NEWWIDTH + 'px')
                }
            }

            function stopDragging(e) {
                e.stopPropagation();
                e.preventDefault();

                $(document).off('mousemove.' + opt.instanceId);
                $(document).off('mouseup.' + opt.instanceId);

                if (window.Touch || navigator.maxTouchPoints) {
                    $(document).off('touchmove.' + opt.instanceId);
                    $(document).off('touchend.' + opt.instanceId);
                }
                $(document).off('selectstart.' + opt.instanceId, noop);                

                // reset changed values
                $el.css("transition", startTransition);
                $("iframe").css("pointer-events","auto");

                if (opt.onDragEnd)
                    opt.onDragEnd(e, $el, opt);

                return false;
            }

            function getMousePos(e) {
                var pos = { x: 0, y: 0, width: 0, height: 0 };
                if (typeof e.clientX === "number") {
                    pos.x = e.clientX;
                    pos.y = e.clientY;
                } else if (e.originalEvent.touches) {
                    pos.x = e.originalEvent.touches[0].clientX;
                    pos.y = e.originalEvent.touches[0].clientY;
                } else
                    return null;

                return pos;
            }

            function getHandle(selector, $el) {
                return $el.find('.stickR')
            } 

             function getHandleLeft(selector, $el) {
                return $el.find('.stickL')
            } 
        });
    };

    if (!$.fn.resizable)
        $.fn.resizable = $.fn.resizableSafe;
}));
