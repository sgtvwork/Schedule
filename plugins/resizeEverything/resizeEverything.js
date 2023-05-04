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
            eventMinWidth: 4
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
            var whichHandle = ''
            // Appending handlers to resizable events
            $($el).append('<div class="stickR"></div>')
            $($el).append('<div class="stickL"></div>')

            // ----------------------------------------------------------------------
            // ----------------------------------------------------------------------
            var original_width = 0
            var original_x = 0
            var original_mouse_x = 0

            var resizerL = getHandleLeft(null, $el)
            var resizerR = getHandle(null, $el)

            function mouseDown (e){
                whichHandle = e.target.className
                e.preventDefault()
                original_width = parseFloat($el.width());
                original_x = Number($($el).css('left').replace('px',''))
                original_mouse_x = e.pageX;
                $(document).on('mousemove.' + opt.instanceId, resize);
                $(document).on('mouseup.' + opt.instanceId, stopResize);  

                if (opt.onDragStart) {
                    if (opt.onDragStart(e, $el, opt) === false){
                        return;
                    }                        
                }
            }

            resizerL.on("mousedown." + opt.instanceId, mouseDown);
            resizerR.on("mousedown." + opt.instanceId, mouseDown);

            function resize (e){
                let dayWidth = $('.ScheduleDay').width()
                let minWidth = dayWidth / options.eventMinWidth

                let elParent = $($el).parent()
                let parentOfParent = $(elParent).parent()
                let daysNumber = $(parentOfParent).children()
                let childNumber = $(elParent).attr('childnumber')                
                
                let fullDaysBeforeEvent = 0
                for (let index = 1; index < childNumber; index++) {
                    fullDaysBeforeEvent++
                }

                let commonwidth = dayWidth * daysNumber.length             
                let leftBorder = fullDaysBeforeEvent * dayWidth                
                let leftRange = original_width + leftBorder + original_x 
                let rightRange = (commonwidth - leftBorder - original_x) 
                
                if (whichHandle.indexOf('stickL') !== -1) {
                    const width = original_width - (e.pageX - original_mouse_x)
                    if (width >= minWidth && width <= leftRange) {  
                        
                        let prc = 100 * width / $('.ScheduleDay').width()
                        let leftPrc = original_x * 100 / $('.ScheduleDay').width()
                        let newLeftPrc = (original_x + (e.pageX - original_mouse_x)) * leftPrc / original_x

                        // $el[0].style.width = width + 8 + 'px'
                        $el[0].style.width = prc + '%'
                        // $el[0].style.left = original_x + (e.pageX - original_mouse_x) + 'px'                    
                        $el[0].style.left = newLeftPrc + '%'                    
                    }
                }
                else if (whichHandle.indexOf('stickR') !== -1) {
                    const width = original_width + (e.pageX - original_mouse_x);
                    if (width >= minWidth && width <= rightRange) {
                        let prc = 100 * width / $('.ScheduleDay').width()
                        // $el[0].style.width = width + 'px'
                        $el[0].style.width = prc + '%'
                    }                    
                } 

                if (opt.onDrag) {
                    opt.onDrag(e)
                }
            }

            function stopResize(e) {
                e.stopPropagation();
                e.preventDefault();
                $(document).off('mousemove.' + opt.instanceId);
                $(document).off('mouseup.' + opt.instanceId);
                window.removeEventListener('mousemove.' + opt.instanceId, resize)

                let eventdetail = $($el).children()[0]; 
                let timeparagraph = $(eventdetail).children()[1]; 
                let newTimeLabel = setTimelabel(whichHandle, $(timeparagraph).html(), 24 * 60 / $('.ScheduleDay').width(), $($el).width() - original_width)
                $(timeparagraph).html(newTimeLabel)
                let eventnameParagraph = $(eventdetail).children()[0]
                let eventnameParagraphText = $(eventnameParagraph).html()
                let newTitle = eventnameParagraphText + ' ' + newTimeLabel
                $(eventdetail).attr('data-bs-original-title', newTitle)

                if (opt.onDragEnd) {
                    opt.onDragEnd(e /*params*/)
                }
            }

            function setTimelabel(direction, datestring, minutesInPixel, widthDifference) {
                //console.log(direction, datestring, minutesInPixel, widthDifference)
                let coefficient = minutesInPixel * widthDifference
                let split1 = datestring.split(' - ')
                let split2 = split1[1].split(' ') //[1] hh mm
                let split3 = split2[0].split('.') //dd mm yy

                let split2L = split1[0].split(' ') //[1] hh mm
                let split3L = split2L[0].split('.') //dd mm yy

                let dateStart = new Date(`${split3L[1]} ${split3L[0]} ${split3L[2]} ${split2L[1]}:00`)
                let dateEnd = new Date(`${split3[1]} ${split3[0]} ${split3[2]} ${split2[1]}:00`)
                //console.log(dateStart)

                let resultString = ''

                if (direction.indexOf('stickL') !== -1) {
                    //изменяется и ширина и Х
                    //меняем время начала события
                    let newDateStart = new Date(dateStart.setMinutes(dateStart.getMinutes() - coefficient))
                    resultString += newDateStart.toLocaleString().slice(0,-3)
                    resultString += ' - ' + split1[1]
                    //console.log(resultString)
                    return resultString
                } 
                else if (direction.indexOf('stickR') !== -1) {
                    //изменяется только ширина
                    //меняем время конца события
                    resultString += split1[0] + ' - '
                    let newDateEnd = new Date(dateEnd.setMinutes(dateEnd.getMinutes() + coefficient))
                    resultString += newDateEnd.toLocaleString().slice(0,-3)
                    //console.log(resultString)
                    return resultString
                }
            }

            // ----------------------------------------------------------------------
            // ----------------------------------------------------------------------

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

            if (opt.touchActionNone){              
                $handle.css("touch-action", "none");
                $handleLeft.css("touch-action", "none")
            }

            $el.addClass("resizable");
            // $handle    .on("mousedown." + opt.instanceId + " touchstart." + opt.instanceId, startDragging);
            // $handleLeft.on("mousedown." + opt.instanceId + " left" + " touchstart." + opt.instanceId, startDragging);

            function noop(e) {
                e.stopPropagation();
                e.preventDefault();
            };

            //Do not ask, we just need this shit
            // var OLDWIDTH
            // var NEWWIDTH
            // var OLDX
            // var NEWX
            // var DIFF_BTW_CURSOR_N_LEFT

            // function startDragging(e) {
            //     // Prevent dragging a ghost image in HTML5 / Firefox and maybe others    
            //     if ( e.preventDefault ) {
            //       e.preventDefault();
            //     }
                
            //     if (e.target.className === 'stickR') {
            //         whichHandle = 'r'
            //     }
            //     else if (e.target.className === 'stickL') {
            //         whichHandle = 'l'
            //     }

            //     startPos = getMousePos(e);
            //     startPos.width = parseInt($el.width(), 10);
            //     startPos.height = parseInt($el.height(), 10);

            //     OLDWIDTH = startPos.width
            //     OLDX = startPos.x
            //     DIFF_BTW_CURSOR_N_LEFT = OLDX - Number($($el).css('left').slice(0,-2))

            //     startTransition = $el.css("transition");
            //     $el.css("transition", "none");

            //     if (opt.onDragStart) {
            //         if (opt.onDragStart(e, $el, opt) === false)
            //             return;
            //     }
                
            //     $(document).on('mousemove.' + opt.instanceId, doDrag);
            //     $(document).on('mouseup.' + opt.instanceId, stopDragging);           
            //     if (window.Touch || navigator.maxTouchPoints) {
            //         $(document).on('touchmove.' + opt.instanceId, doDrag);
            //         $(document).on('touchend.' + opt.instanceId, stopDragging);
            //     }
            //     $(document).on('selectstart.' + opt.instanceId, noop); // disable selection
            //     $("iframe").css("pointer-events","none");
            // }

            // function doDrag(e) { 
            //     let pos = getMousePos(e)

            //     let dayWidth = $('.day').width()
            //     let minWidth = dayWidth / options.eventMinWidth

            //     let eventWidthPx = $($el).width()
            //     let elParent = $($el).parent()
            //     let parentWidthPx = $(elParent).width()
            //     let eventWidthPrc = parentWidthPx / eventWidthPx * 100
            //     let parentOfParent = $(elParent).parent()
            //     let dayscount = $(parentOfParent).children()
            //     let childNumber = $(elParent).attr('childnumber')
                
            //     let hz = 0
            //     for (let index = 1; index < childNumber; index++) {
            //        hz++
            //     }

            //     let commonw = dayWidth * 6                
            //     let leftBorder = hz * dayWidth                
            //     let ll = Number($($el).css('left').slice(0,-2))
            //     let leftRange = eventWidthPx + leftBorder + ll
            //     let rightRange = (commonw - leftBorder - ll)
            //     console.log(eventWidthPx)
            //     console.log(commonw)
            //     // console.log(commonw)
            //     // console.log(leftBorder)
            //     // console.log(ll)
            //     // console.log(eventWidthPx)
            //     // console.log(commonw - leftBorder - ll - eventWidthPx)



            //     if (whichHandle === 'r') {
            //         if (opt.resizeWidthFrom === 'left')
            //             newWidth = startPos.width - pos.x + startPos.x;
            //         else{
            //             newWidth = startPos.width + pos.x - startPos.x;
            //         }

            //         if (opt.resizeHeightFrom === 'top')
            //             newHeight = startPos.height - pos.y + startPos.y;
            //         else
            //             newHeight = startPos.height + pos.y - startPos.y;

            //         if (!opt.onDrag || opt.onDrag(e, $el, newWidth, newHeight, opt) !== false) {
            //             if (opt.resizeHeight)
            //                 $el.height(newHeight); 

            //             if (newWidth >= minWidth) {
            //                 if (opt.resizeWidth){
            //                     if (newWidth <= rightRange) {
            //                         $el.width(newWidth);  
            //                     }                                  
            //                 }
            //             }                                        
            //         }   
            //     }
            //     else if (whichHandle === 'l') {
            //         let differenceBetweenCursors = e.pageX - OLDX
            //         NEWX = e.pageX   

            //         // разница больше 0, значит тянем вправо, уменьшая событие
            //         if (differenceBetweenCursors > 0) {
            //             NEWWIDTH = OLDWIDTH - (NEWX - OLDX)

            //             if (NEWWIDTH >= minWidth){
            //                 $($el).css('left', NEWX - DIFF_BTW_CURSOR_N_LEFT + 'px').css('width', NEWWIDTH + 'px')
            //             }  
            //         }
            //         //тянем влево, увеличивая событие
            //         else if (differenceBetweenCursors < 0){
            //             NEWWIDTH = OLDWIDTH + (OLDX - NEWX)
                        
            //             if (NEWWIDTH >= minWidth){
            //                 if (NEWWIDTH <= leftRange) {
            //                     $($el).css('left', NEWX - DIFF_BTW_CURSOR_N_LEFT + 'px').css('width', NEWWIDTH + 'px')
            //                 }                            
            //             }  
            //         }                  
            //     }
            // }

            // function stopDragging(e) {
            //     e.stopPropagation();
            //     e.preventDefault();

            //     $(document).off('mousemove.' + opt.instanceId);
            //     $(document).off('mouseup.' + opt.instanceId);

            //     if (window.Touch || navigator.maxTouchPoints) {
            //         $(document).off('touchmove.' + opt.instanceId);
            //         $(document).off('touchend.' + opt.instanceId);
            //     }
            //     $(document).off('selectstart.' + opt.instanceId, noop);                

            //     // reset changed values
            //     $el.css("transition", startTransition);
            //     $("iframe").css("pointer-events","auto");

            //     if (opt.onDragEnd)
            //         opt.onDragEnd(e, $el, opt);

            //     return false;
            // }

            // function getMousePos(e) {
            //     var pos = { x: 0, y: 0, width: 0, height: 0 };
            //     if (typeof e.pageX === "number") {
            //         pos.x = e.pageX;
            //         pos.y = e.clientY;
            //     } else if (e.originalEvent.touches) {
            //         pos.x = e.originalEvent.touches[0].pageX;
            //         pos.y = e.originalEvent.touches[0].clientY;
            //     } else
            //         return null;

            //     return pos;
            // }

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
